
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
                    id: data.uuid, // ID matches TheSports ID
                    status_short: mapStatus(data.status), // Need mapper? Or just use raw if DB handles it? 
                    // Let's defer mapping or add mapper here. Status is number in update.
                    // Ideally TheSportsWebSocketClient should map it.
                    // For now, let's just store what we have. Frontend can interpret or we assume standard strings if we mapped it in client?
                    // In client, I added 'status_short' to interface but didn't implement logic to map it yet.
                    // I'll stick to updating existing columns. 
                    home_score: data.score.home,
                    away_score: data.score.away,
                    updated_at: new Date().toISOString()
                })

            if (error) console.error(`[Sync] Error saving ${data.uuid}:`, error.message)
            else console.log(`[Sync] ✅ Saved ${data.uuid}`)

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
    // Basic mapping based on TheSports documentation (assumed or previous knowledge)
    // 0: NS, 1: 1H, 2: HT, 3: 2H, 4: ET, 5: PEN, 6: FT, 7: Cancelled, 8: FT
    const map: Record<number, string> = {
        0: 'NS', 1: '1H', 2: 'HT', 3: '2H', 4: 'ET', 5: 'PEN', 6: 'FT', 7: 'CANC', 8: 'FT'
    }
    return map[statusCode] || 'LIVE'
}
