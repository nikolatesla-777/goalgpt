
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { TheSportsWebSocketClient, LiveMatchUpdate } from '../src/lib/thesports-websocket'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing (SUPABASE_SERVICE_ROLE_KEY required)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🚀 Starting TheSports WebSocket Listener with Supabase Sync...')

try {
    const client = new TheSportsWebSocketClient()

    client.on('update', async (data: LiveMatchUpdate, rawData?: any) => {
        // console.log(`[Sync] Handling ${data.uuid} | ${data.score.home}-${data.score.away}`)
        if (rawData) console.log('[RAW DEBUG]', JSON.stringify(rawData).slice(0, 200))
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

            if (error) console.error(`[Sync] Error saving ${data.uuid}:`, error.message)
            else {
                // console.log(`[Sync] ✅ Saved ${data.uuid}`)

                // ---------------------------------------------------------
                // 🚀 REAL-TIME SETTLEMENT TRIGGER
                // ---------------------------------------------------------
                // Only trigger if we have score/status data
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
import { PredictionEvaluator } from '../src/lib/prediction-evaluator'

async function attemptSettlement(match: LiveMatchUpdate) {
    // 1. Find pending predictions for this match
    // We try to match by:
    // A. "external_id" column (if it stores TheSports ID)
    // B. Or loosen strictness if needed (team names) - pending for now just ID.
    // Based on logs, external_id seems to store TheSports ID (e.g. "251215..." or similar)
    // But logs showed "matchUuid": "1394569".
    // We'll search where external_id contains the UUID or exactly matches.

    // Note: 'raw_payload->matchUuid' is the most reliable if populated.
    // But supabase query on jsonb requires properly indexed or ->> access.

    const { data: predictions, error } = await supabase
        .from('predictions_raw')
        .select('*')
        .eq('result', 'pending')
        .or(`external_id.eq.${match.uuid},raw_payload->>matchUuid.eq.${match.uuid}`)

    if (error) {
        // console.error('[Settlement] Fetch Error:', error.message)
        return
    }

    if (!predictions || predictions.length === 0) return

    // console.log(`[Settlement] Found ${predictions.length} pending bets for ${match.uuid}`)

    for (const pred of predictions) {
        // Prepare data for evaluator
        const statusLabel = mapStatus(match.status)

        // SAFEGUARD: TheSports MQTT payload does not explicitly provide HT score in this array.
        // We can only trust Current Score = HT Score if we are IN the first half or AT half time.
        // If we in 2H or FT, we don't know the HT score.
        // To prevent False Wins/Losses for "IY/HT" bets, we only evaluate them during 1H/HT.

        const isHalfTimeBet = pred.prediction_type.startsWith('IY') || pred.prediction_type.startsWith('HT')
        if (isHalfTimeBet && !['1H', 'HT', 'INT'].includes(statusLabel)) {
            // Skip IY bets in 2H/FT to avoid using 2H score as HT score (or 0 as HT score)
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
            pred.prediction_type, // e.g. "IY 0.5 ÜST"
            match.score.home,
            match.score.away,
            htHome,
            htAway,
            statusLabel
        )

        if (evaluation.result === 'won' || evaluation.result === 'lost') {
            console.log(`[Settlement] 🎯 MATCH! ID:${pred.id} | ${pred.prediction_type} -> ${evaluation.result} | Score: ${match.score.home}-${match.score.away}`)

            // Update DB
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
