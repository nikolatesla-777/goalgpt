
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- DEBUGGING IDS ---')

    // 1. Get Live Matches
    const { data: liveMatches } = await supabase
        .from('live_matches')
        .select('id, status_short, home_score, away_score, minute')
        .limit(5)

    console.log('\nLIVE MATCHES (from live_matches table):')
    liveMatches?.forEach(m => {
        console.log(`[${m.id}] ${m.home_team} vs ${m.away_team} | Status: ${m.status}`)
    })

    // 2. Get Pending Predictions
    const { data: predictions } = await supabase
        .from('predictions_raw')
        .select('id, external_id, home_team_name, away_team_name, prediction_text, raw_payload')
        .eq('result', 'pending')
        .order('received_at', { ascending: false })
        .limit(5)

    console.log('\nPENDING PREDICTIONS (from predictions_raw table):')
    predictions?.forEach(p => {
        console.log(`[PredID: ${p.id}] ExternalID: ${p.external_id}`)
        console.log(`   Match: ${p.home_team_name} vs ${p.away_team_name}`)
        console.log(`   Payload MatchUUID: ${p.raw_payload?.matchUuid}`)
    })
}

debug()
