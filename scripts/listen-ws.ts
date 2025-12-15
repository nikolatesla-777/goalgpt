
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

// --- SYNC FUNCTION ---
async function syncInitialState() {
    console.log('🔄 Syncing initial live matches from API...')
    try {
        const liveFixtures = await TheSportsAPI.getLiveFixtures()
        console.log(`✅ Found ${liveFixtures.length} live matches. Upserting...`)

        for (const fixture of liveFixtures) {
            // Correctly access nested properties of APIFootballFixture
            const goalsHome = fixture.goals.home ?? 0
            const goalsAway = fixture.goals.away ?? 0

            // Map API status object to our simplified status
            const statusShort = fixture.fixture.status.short || 'L'
            const statusLong = fixture.fixture.status.long || 'Live'
            const elapsed = fixture.fixture.status.elapsed || 0

            const matchData = {
                id: fixture.fixture.id, // TheSports ID is nested in fixture.id
                status_short: statusShort,
                updated_at: new Date().toISOString(),
                home_score: goalsHome,
                away_score: goalsAway,
                minute: elapsed
            }

            const { error } = await supabase
                .from('live_matches')
                .upsert(matchData)

            if (error) console.error(`❌ Failed to upsert ${fixture.fixture.id}:`, error.message)
            else console.log(`[Init] Synced ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${fixture.fixture.id}) Score: ${goalsHome}-${goalsAway}`)
        }
        console.log('✅ Initial sync complete.')
    } catch (e) {
        console.error('❌ Initial sync failed:', e)
    }
}

// MAIN EXECUTION
(async () => {
    try {
        console.log('🚀 Starting TheSports WebSocket Listener with Supabase Sync...')

        // 1. Sync Initial State
        await syncInitialState()

        // 2. Start WebSocket Listener
        const client = new TheSportsWebSocketClient()

        client.on('update', async (data: LiveMatchUpdate, rawData?: any) => {
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

    } catch (error: any) {
        console.error('❌ Failed to initialize:', error.message)
    }
})()
