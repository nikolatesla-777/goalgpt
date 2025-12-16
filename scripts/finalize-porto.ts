
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function finalizePorto() {
    console.log('🏁 Finalizing Porto Match...')

    // 1. Update Result to WON (3-1 = 4 goals > 3.5)
    // ID: dd36b443-3b63-461d-9dd6-a61abd88b9d9
    const { error: pError } = await supabase
        .from('predictions_raw')
        .update({
            result: 'won', // 4 goals total
            settled_at: new Date().toISOString(),
            match_score: '3-1',
            processing_log: '✅ Manual Finalize: 3-1 (3-1 FT)'
        })
        .eq('id', 'dd36b443-3b63-461d-9dd6-a61abd88b9d9')

    if (pError) console.error('❌ Pred Error:', pError)
    else console.log('✅ Prediction Finalized: WON (3-1)')

    // 2. Update Live Match Card to FT 3-1
    const { error: mError } = await supabase.from('live_matches').upsert({
        id: 'MANUAL_PORTO_FIX_V2',
        status_short: 'FT',
        home_score: 3,
        away_score: 1,
        minute: 90,
        updated_at: new Date().toISOString()
    })

    if (mError) console.error('❌ Match Error:', mError)
    else console.log('✅ Match Status Updated: FT 3-1')
}

finalizePorto()
