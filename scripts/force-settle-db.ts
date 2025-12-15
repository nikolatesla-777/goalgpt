
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials missing (SUPABASE_SERVICE_ROLE_KEY required)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    console.log('🚀 Force Settling Pending Matches...')

    const targets = ['Fenerbahce', 'TSC', 'Ikorodu']

    for (const team of targets) {
        const { data, error } = await supabase
            .from('predictions_raw')
            .update({
                result: 'lost',
                settled_at: new Date().toISOString()
            })
            .ilike('home_team_name', `%${team}%`) // Loose match
            .eq('result', 'pending')
            .select() // return updated rows

        if (error) {
            console.error(`❌ Failed to settle ${team}:`, error.message)
        } else {
            if (data && data.length > 0) {
                console.log(`✅ Settled ${team}: ${data.length} prediction(s) marked as LOST.`)
            } else {
                console.log(`⚠️ No pending predictions found for ${team}.`)
            }
        }
    }
}

run()
