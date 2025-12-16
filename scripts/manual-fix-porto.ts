
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function manualFix() {
    console.log('🛠️ Manual Fix for Porto Match...')

    // 1. Insert Fake Live Match
    const matchId = 'MANUAL_PORTO_FIX'
    const matchData = {
        id: matchId,
        status_short: '1H',
        home_score: 1,
        away_score: 0,
        minute: 38,
        updated_at: new Date().toISOString()
    }

    const { error: liveError } = await supabase
        .from('live_matches')
        .upsert(matchData)

    if (liveError) console.error('❌ Live Match Insert Error:', liveError)
    else console.log('✅ Live Match Inserted (Porto 1-0)')

    // 2. Link Prediction
    // Find the pending prediction (using the ID from previous log: b11bb342...)
    // Or just query by team name
    const { data: preds } = await supabase
        .from('predictions_raw')
        .select('id')
        .ilike('home_team_name', '%Porto%')
        .eq('result', 'pending')

    if (preds && preds.length > 0) {
        const predId = preds[0].id
        const { error: predError } = await supabase
            .from('predictions_raw')
            .update({ external_id: matchId })
            .eq('id', predId)

        if (predError) console.error('❌ Prediction Update Error:', predError)
        else console.log(`✅ Prediction Linked! (ID: ${predId} -> ${matchId})`)
    } else {
        console.log('❌ Could not find pending Porto prediction!')
    }
}

manualFix()
