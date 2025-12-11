import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPredictions() {
    console.log('=== Checking Predictions Tables ===\n')

    // 1. Check predictions_raw
    console.log('1. predictions_raw table:')
    const { data: rawData, error: rawError, count: rawCount } = await supabase
        .from('predictions_raw')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('received_at', { ascending: false })

    if (rawError) {
        console.log('   Error:', rawError.message)
    } else {
        console.log(`   Total records: ${rawCount}`)
        if (rawData && rawData.length > 0) {
            console.log('   Last 5 records:')
            rawData.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.home_team} vs ${r.away_team} - ${r.prediction_type} (${r.received_at})`)
            })
        } else {
            console.log('   No records found!')
        }
    }

    // 2. Check predictions_matched
    console.log('\n2. predictions_matched table:')
    const { data: matchedData, error: matchedError, count: matchedCount } = await supabase
        .from('predictions_matched')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false })

    if (matchedError) {
        console.log('   Error:', matchedError.message)
    } else {
        console.log(`   Total records: ${matchedCount}`)
        if (matchedData && matchedData.length > 0) {
            console.log('   Last 5 records:')
            matchedData.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.home_team} vs ${r.away_team} - ${r.prediction_type} (${r.created_at})`)
            })
        } else {
            console.log('   No records found!')
        }
    }

    // 3. Check manual_predictions
    console.log('\n3. manual_predictions table:')
    const { data: manualData, error: manualError, count: manualCount } = await supabase
        .from('manual_predictions')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false })

    if (manualError) {
        console.log('   Error:', manualError.message)
    } else {
        console.log(`   Total records: ${manualCount}`)
        if (manualData && manualData.length > 0) {
            console.log('   Last 5 records:')
            manualData.forEach((r, i) => {
                console.log(`   ${i + 1}. ${r.home_team} vs ${r.away_team} - ${r.prediction_type} (${r.created_at})`)
            })
        } else {
            console.log('   No records found!')
        }
    }

    console.log('\n=== Done ===')
}

checkPredictions()
