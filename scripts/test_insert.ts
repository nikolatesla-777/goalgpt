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

async function testInsert() {
    console.log('=== Testing Direct Insert to predictions_raw ===\n')

    const testPayload = {
        external_id: 'local-test-001',
        home_team_name: 'Local Test FC',
        away_team_name: 'Direct Insert United',
        league_name: 'Test League',
        prediction_type: 'MS 1',
        prediction_text: 'Direct local test to verify table works',
        confidence: 95,
        raw_payload: { test: true },
        status: 'pending',
        received_at: new Date().toISOString()
    }

    console.log('Inserting:', testPayload.home_team_name, 'vs', testPayload.away_team_name)

    const { data, error } = await supabase
        .from('predictions_raw')
        .upsert(testPayload, {
            onConflict: 'external_id',
            ignoreDuplicates: false
        })
        .select()

    if (error) {
        console.error('❌ INSERT ERROR:', error)
    } else {
        console.log('✅ INSERT SUCCESS:', data)
    }

    // Check count again
    const { count } = await supabase
        .from('predictions_raw')
        .select('*', { count: 'exact', head: true })

    console.log('\nTotal records in predictions_raw:', count)
}

testInsert()
