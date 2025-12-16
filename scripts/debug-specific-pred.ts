
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPred() {
    console.log('🔍 Finding Porto Over 3.5 Prediction...')

    const { data: preds } = await supabase
        .from('predictions_raw')
        .select('*')
        .eq('external_id', 'y0or5jh83x2pqwz')
        .order('id')
        .limit(10)

    if (preds && preds.length > 0) {
        preds.forEach(p => {
            console.log('--------------------------------------------------')
            console.log(`ID: ${p.id}`)
            console.log(`Prediction: ${p.prediction_text}`)
            console.log(`Parser Type: ${p.prediction_type}`)
            console.log(`Result: ${p.result}`)
            console.log(`Match Score: ${p.match_score}`)
            console.log(`Log: ${p.processing_log}`)
            console.log('--------------------------------------------------')
        })
    } else {
        console.log('❌ No matching prediction found.')
    }
}

debugPred()
