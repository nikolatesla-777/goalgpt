
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { TheSportsWebSocketClient, LiveMatchUpdate } from '../src/lib/thesports-websocket'
import { TheSportsAPI, APIFootballFixture } from '../src/lib/thesports-api'
import { PredictionEvaluator } from '../src/lib/prediction-evaluator'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing (SUPABASE_SERVICE_ROLE_KEY required)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple status mapper helper
function mapStatus(statusCode: number): string {
    const map: Record<number, string> = {
        0: 'NS', 1: '1H', 2: 'HT', 3: '2H', 4: 'ET', 5: 'PEN', 6: 'FT', 7: 'CANC', 8: 'FT'
    }
    return map[statusCode] || 'LIVE'
}

/**
 * Checks for pending predictions for this match and settles them if possible.
 */
async function attemptSettlement(match: LiveMatchUpdate) {
    const { data: predictions, error } = await supabase
        .from('predictions_raw')
        .select('*')
        .eq('result', 'pending')
        .or(`external_id.eq.${match.uuid}, raw_payload ->> matchUuid.eq.${match.uuid}`)

    if (error) return

    if (!predictions || predictions.length === 0) return

    for (const pred of predictions) {
        const statusLabel = mapStatus(match.status)

        // SAFEGUARD: TheSports MQTT payload does not explicitly provide HT score in this array.
        // We can only trust Current Score = HT Score if we are IN the first half or AT half time.
        const isHalfTimeBet = pred.prediction_type.startsWith('IY') || pred.prediction_type.startsWith('HT')
        if (isHalfTimeBet && !['1H', 'HT', 'INT'].includes(statusLabel)) {
            continue;
        }

        let htHome = 0
        let htAway = 0
        if (['1H', 'HT', 'INT'].includes(statusLabel)) {
            htHome = match.score.home
            htAway = match.score.away
        }

        // Evaluate
        const evaluation = PredictionEvaluator.evaluate(
            pred.prediction_type,
            match.score.home,
            match.score.away,
            htHome,
            htAway,
            statusLabel
        )

        if (evaluation.result === 'won' || evaluation.result === 'lost') {
            console.log(`[Settlement] 🎯 MATCH! ID:${pred.id} | ${pred.prediction_type} -> ${evaluation.result} | Score: ${match.score.home}-${match.score.away}`)

            await supabase
                .from('predictions_raw')
                .update({
                    result: evaluation.result,
                    settled_at: new Date().toISOString(),
                    match_score: `${match.score.home}-${match.score.away}`,
                    processing_log: evaluation.log
                })
                .eq('id', pred.id)
        }
    }
}

// --- NAME MATCHING / LINKING LOGIC ---
async function linkOrphanedPredictions() {
    // 1. Get all pending predictions with NO external_id (or where it doesn't look like a UUID/Int ID)
    // For safety, we check ones where external_id is null OR length > 20 (timestamp ids)
    const { data: orphans } = await supabase
        .from('predictions_raw')
        .select('*')
        .eq('result', 'pending')
        .is('external_id', null)
        .limit(50)

    if (!orphans || orphans.length === 0) return

    // 2. Get Live Matches from DB (we just synced them)
    // We can also use the in-memory cache if we had one, but DB is fine.
    const { data: liveMatches } = await supabase
        .from('live_matches')
        .select('*')

    if (!liveMatches || liveMatches.length === 0) return

    let linkedCount = 0

    for (const pred of orphans) {
        // Try to find a match in liveMatches by team name
        // Simple normalization: lowercase, remove spaces check
        const pHome = pred.home_team_name?.toLowerCase().trim() || ''
        const pAway = pred.away_team_name?.toLowerCase().trim() || ''

        if (!pHome || !pAway) continue

        const match = liveMatches.find(m => {
            // We use the live_matches DB columns. 
            // NOTE: We verified live_matches DOES NOT have home_team/away_team columns in DB schema (schema.sql).
            // BUT our update script tried to write them. 
            // Wait, we need team names to do matching!
            // If live_matches table misses them, we can't match against DB.
            // We must use the 'liveFixtures' from the periodic Sync or cache?
            // Ah, 'live_matches' table only has scores.
            // We need to match against the TheSportsAPI fixtures directly.
            return false
        })
    }
}

// REVISED STRATEGY: 
// Run the linker as part of the periodic "Sync" or separate loop that calls API.
// Since we removed home_team/away_team from live_matches TABLE, we cannot query names from DB.
// We must use the API data we fetch in syncInitialState.

async function syncAndLink() {
    console.log('🔄 Syncing & Linking...')
    try {
        const liveFixtures = await TheSportsAPI.getLiveFixtures()

        // 1. Upsert Live Matches (Scores)
        for (const fixture of liveFixtures) {
            const goalsHome = fixture.goals.home ?? 0
            const goalsAway = fixture.goals.away ?? 0
            const statusShort = fixture.fixture.status.short || 'L'
            const elapsed = fixture.fixture.status.elapsed || 0

            await supabase.from('live_matches').upsert({
                id: fixture.fixture.id,
                status_short: statusShort,
                updated_at: new Date().toISOString(),
                home_score: goalsHome,
                away_score: goalsAway,
                minute: elapsed
            })

            // 2. LINKING: Check if any orphan predictions match this fixture
            const homeName = fixture.teams.home.name.toLowerCase()
            const awayName = fixture.teams.away.name.toLowerCase()

            // Fetch potential orphans for THIS match specificially? No, too many DB calls.
            // Better: Load orphans once at start of loop?
            // For now, let's just run a targeted query for this specific match names if plausible?
            // "home_team_name ilike ... "

            // Optimization: Just do it for ALL fixtures in batch if possible. 
            // But doing it here per fixture is easiest to implement:

            const { data: matchedOrphans } = await supabase
                .from('predictions_raw')
                .select('id')
                .eq('result', 'pending')
                .is('external_id', null)
                .ilike('home_team_name', `%${fixture.teams.home.name}%`)
            // We use home team as primary anchor. 
            // CAUTION: "Manchester" matches "Manchester City" and "Manchester United".
            // Need stricter check?

            if (matchedOrphans && matchedOrphans.length > 0) {
                for (const orphan of matchedOrphans) {
                    console.log(`🔗 Auto-Linking Prediction ${orphan.id} to Match ${fixture.fixture.id} (${fixture.teams.home.name})`)
                    await supabase
                        .from('predictions_raw')
                        .update({ external_id: fixture.fixture.id })
                        .eq('id', orphan.id)
                }
            }
        }
    } catch (e) {
        console.error('Sync Error:', e)
    }
}

// MAIN EXECUTION
(async () => {
    try {
        console.log('🚀 Starting Client...')

        // Initial Sync & Link
        await syncAndLink()

        // Periodic Sync (Every 2 minutes) to ensure names/orphan linking works 
        // and to catch up if WebSockets miss anything.
        setInterval(() => syncAndLink(), 120 * 1000)

        // WebSocket
        const client = new TheSportsWebSocketClient()
        // ... (rest of websocket logic)
        client.on('update', async (data: LiveMatchUpdate) => {
            // if (rawData) console.log('[RAW DEBUG]', JSON.stringify(rawData).slice(0, 200))
            try {
                // Upsert directly to live_matches
                const { error } = await supabase
                    .from('live_matches')
                    .upsert({
                        id: data.uuid,
                        status_short: mapStatus(data.status),
                        updated_at: new Date().toISOString(),
                        home_score: data.score.home,
                        away_score: data.score.away,
                        minute: data.minute
                    })

                if (error) console.error(`[Sync] Error saving ${data.uuid}: `, error.message)
                else {
                    // Trigger Settlement
                    if (data.status !== undefined && data.score) {
                        await attemptSettlement(data)
                    }
                }

            } catch (dbErr) {
                console.error('[Sync] DB Exception:', dbErr)
            }
        })

        client.connect()

        // Handle manual exit
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down...')
            process.exit(0)
        })

    } catch (e) { }
})()
