
import dotenv from 'dotenv'
import path from 'path'
import { GlobalLivescoreService } from '../src/lib/services/global-livescore-service'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function run() {
    console.log('🚀 Triggering Manual Settlement...')

    // Determine today's date context? The service assumes "Today" or uses logic.
    // fetchGlobalLivescore uses APIFootball.getFixturesByDate() which defaults to today.
    // The matches in screenshot are "15.12.25", which is today (if system time is correct).

    try {
        const result = await GlobalLivescoreService.fetchGlobalLivescore(true)
        console.log(`✅ Fetch Complete. Total: ${result.totalCount}, Live: ${result.liveCount}`)
        console.log('👉 Check DB/Logs for settlement updates.')
    } catch (e) {
        console.error('❌ Error:', e)
    }
    process.exit(0)
}

run()
