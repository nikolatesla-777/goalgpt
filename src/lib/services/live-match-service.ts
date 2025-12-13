import { TheSportsApi } from '@/lib/thesports-api'

export class LiveMatchService {

    /**
     * Finds a live or upcoming match in TheSports API that matches the resolved team IDs.
     */
    static async findMatchForPrediction(homeTeamId: string, awayTeamId: string): Promise<string | null> {
        if (!homeTeamId || !awayTeamId) return null

        try {
            // 1. Try to fetch Today's Matches first (most likely scenario)
            const fixtures = await TheSportsApi.getFixturesByDate()

            // 2. Search for the match with matching Home/Away IDs
            // TheSports API typically returns team IDs in the fixture object.
            // We assume the ID format matches what we stored in our 'teams' table.

            const match = fixtures.find(f =>
                (f.home_team_id === homeTeamId && f.away_team_id === awayTeamId) ||
                // Fallback: Check if IDs are numbers vs strings mismatch e.g. "123" vs 123
                (String(f.home_team_id) === String(homeTeamId) && String(f.away_team_id) === String(awayTeamId))
            )

            if (match) {
                console.log(`✅ Live Match Found: ${match.home.name} vs ${match.away.name} (ID: ${match.id})`)
                return match.id
            }

            // 3. Optional: Search "Live" specifically if date filtering wasn't enough or timezones differ
            // (Often getFixturesByDate covers live, but just in case)
            // const liveFixtures = await TheSportsApi.getLiveMatches()
            // ... search in validFixtures ...

            console.log(`⚠️ No live match found for TeamIDs: ${homeTeamId} vs ${awayTeamId}`)
            return null

        } catch (error) {
            console.error('Error in LiveMatchService:', error)
            return null
        }
    }
}
