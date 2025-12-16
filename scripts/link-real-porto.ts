
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function linkRealMatch() {
    const realMatchId = 'y0or5jh83x2pqwz' // Inferred Porto Match ID (3-0, 60')

    console.log(`🔗 Linking Porto prediction to Real stream: ${realMatchId}`)

    // Find valid pending prediction for Porto
    const { data: preds } = await supabase
        .from('predictions_raw')
        .select('id')
        .ilike('home_team_name', '%Porto%')
        .eq('result', 'pending')
        .limit(1)

    if (preds && preds.length > 0) {
        const predId = preds[0].id
        const { error } = await supabase
            .from('predictions_raw')
            .update({ external_id: realMatchId })
            .eq('id', predId)

        if (error) console.error('❌ Update failed:', error)
        else console.log(`✅ Success! Prediction ${predId} linked to ${realMatchId}`)
    } else {
        console.log('⚠️ No pending Porto prediction found.')
    }
}

linkRealMatch()
