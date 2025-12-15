
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    console.log('🔍 Inspecting Predictions...')

    const teams = ['Fenerbahce'] // Focus on the user's question about Fenerbahce count

    for (const team of teams) {
        const { data, error } = await supabase
            .from('predictions_raw')
            .select('*') // Select all columns to be safe
            .ilike('home_team_name', `%${team}%`)
        //.order('created_at', { ascending: false }) // Maybe created_at missing?
        //.limit(5)

        if (error) console.error('DB Error:', error)

        console.log(`\nResults for ${team}:`)
        console.log(JSON.stringify(data, null, 2))
    }
}

run()
