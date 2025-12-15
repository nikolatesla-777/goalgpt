
import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
    console.log('🔍 Checking Live Matches Table...')

    // We are looking for Fenerbahce.
    // The table is 'live_matches'. It doesn't have team names!
    // It only has 'id', 'home_score', 'away_score', 'status_short', 'minute'.
    // The ID column is what we have to match.
    // From inspect-db, Fenerbahce match ID (TheSports) was '1394569' (matchUuid) or matchId '251215202204'?
    // In raw_payload: "matchUuid": "1394569". TheSports usually uses short alphanumeric or numeric IDs.
    // The inspect-db raw payload also had "matchId": "251215202204".
    // AND "id" in predictions_raw table was just the DB ID.
    // The 'live_matches' table 'id' comes from TheSports 'uuid'.
    // Let's search by ID '1394569' first.

    // Also, we can check 'predictions_raw' again to be sure which ID is the 'uuid'.
    // The raw_payload says "matchUuid": "1394569". This seems to be the TheSports ID.

    const idsToCheck = ['1394569', '251215202204']

    const { data, error } = await supabase
        .from('live_matches')
        .select('*')
        .in('id', idsToCheck)

    if (error) console.error(error)
    else {
        console.log('Found in Live Matches:', data)
    }
}

run()
