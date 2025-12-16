
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function revertFix() {
    console.log('↩️ Reverting to Manual Fix...')

    // Reset to Manual Fix ID
    const matchId = 'MANUAL_PORTO_FIX'

    // Find the prediction linked to the WRONG ID (y0or5jh83x2pqwz)
    const { data: preds } = await supabase
        .from('predictions_raw')
        .select('id')
        .eq('external_id', 'y0or5jh83x2pqwz')

    if (preds && preds.length > 0) {
        for (const p of preds) {
            await supabase
                .from('predictions_raw')
                .update({ external_id: matchId })
                .eq('id', p.id)
            console.log(`✅ Reverted Prediction ${p.id} to ${matchId}`)
        }
    } else {
        // Just in case, try by name
        const { data: namePreds } = await supabase
            .from('predictions_raw')
            .select('id')
            .ilike('home_team_name', '%Porto%')
            .eq('result', 'pending')

        if (namePreds) {
            for (const p of namePreds) {
                await supabase
                    .from('predictions_raw')
                    .update({ external_id: matchId })
                    .eq('id', p.id)
                console.log(`✅ Reverted Prediction ${p.id} to ${matchId} (by Name)`)
            }
        }
    }
}

revertFix()
