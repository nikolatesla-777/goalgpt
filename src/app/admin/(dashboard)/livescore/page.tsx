import LiveScoreBoard from './LiveScoreBoard'
import { SimplifiedMatch } from '@/app/admin/(dashboard)/predictions/manual/actions'
import { GlobalLivescoreService } from '@/lib/services/global-livescore-service'

export const dynamic = 'force-dynamic'

export default async function LiveScorePage() {
    // 1. Fetch live data directly from service (V4 Algorithm applied internally)
    // The service returns data grouped by Country -> League -> Match
    const data = await GlobalLivescoreService.fetchGlobalLivescore(true)

    // 2. Flatten grouped data into SimplifiedMatch array for the UI
    const flatMatches: (SimplifiedMatch & { hasAIPrediction: boolean })[] = []

    for (const country of data.countries || []) {
        for (const league of country.leagues || []) {
            for (const match of league.matches || []) {
                flatMatches.push({
                    id: match.id,
                    homeTeam: match.home.name,
                    awayTeam: match.away.name,
                    homeLogo: match.home.logo,
                    awayLogo: match.away.logo,
                    homeScore: match.home.score,
                    awayScore: match.away.score,
                    minute: match.minute || 0,
                    status: match.isLive ? (match.status === 'HT' ? 'ht' : 'live') : (match.status === 'FT' ? 'ft' : 'ns'),
                    league: league.name,
                    country: country.name, // FIXED: Now passing country name explicitly
                    leagueFlag: country.flag,
                    leagueLogo: league.logo,
                    startTime: match.startTime,
                    rawTime: match.timestamp,
                    hasAIPrediction: match.hasAIPrediction || false // FIXED: Using service's V4 calculation
                })
            }
        }
    }

    // 3. Sort logic (Same as client-side)
    const sortedMatches = flatMatches.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1
        if (a.status !== 'live' && b.status === 'live') return 1
        return (a.rawTime || 0) - (b.rawTime || 0)
    })

    return <LiveScoreBoard initialMatches={sortedMatches} />
}
