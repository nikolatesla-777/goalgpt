
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function resetPred() {
    console.log('🔄 Resetting Porto Prediction...')

    // 1. Find the falsely won prediction
    const { data: preds } = await supabase
        .from('predictions_raw')
        .select('*')
        .eq('id', 'dd36b443-3b63-461d-9dd6-a61abd88b9d9')
        .limit(1)

    if (preds && preds.length > 0) {
        const p = preds[0]
        console.log(`Found: ${p.id} | Result: ${p.result} | Score: ${p.match_score}`)

        // 2. Reset Status
        const { error } = await supabase
            .from('predictions_raw')
            .update({
                result: 'pending',
                settled_at: null,
                match_score: '2-1', // Set to user's reported score
                external_id: 'MANUAL_PORTO_FIX_V2', // Unique ID to avoid collision
                processing_log: '⚠️ Manually Reset due to wrong link'
            })
            .eq('id', p.id)

        if (error) console.error('❌ Error:', error)
        else console.log('✅ Prediction reset to PENDING and unlinked.')

        // 3. Update Manual Live Match Entry to 2-1
        await supabase.from('live_matches').upsert({
            id: 'MANUAL_PORTO_FIX_V2',
            status_short: 'LIVE',
            home_score: 2,
            away_score: 1,
            minute: 67, // Estimate from user screenshot
            updated_at: new Date().toISOString()
        })
        console.log('✅ Updated Manual Fix V2 to 2-1 (67\')')

    } else {
        console.log('❌ Prediction not found')
    }
}

resetPred()
