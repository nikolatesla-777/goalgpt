import LiveScoreBoard from './LiveScoreBoard'
import { SimplifiedMatch } from '@/app/admin/(dashboard)/predictions/manual/actions'
import { GlobalLivescoreService } from '@/lib/services/global-livescore-service'

export const dynamic = 'force-dynamic'

// Set a reasonable timeout for the page
export const maxDuration = 30

export default async function LiveScorePage() {
    let flatMatches: (SimplifiedMatch & { hasAIPrediction: boolean })[] = []
    let error: string | null = null
    let apiStatus = 'loading'

    try {
        // Add timeout wrapper to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API Timeout')), 25000)
        )

        const dataPromise = GlobalLivescoreService.fetchGlobalLivescore(true)

        const data = await Promise.race([dataPromise, timeoutPromise]) as Awaited<ReturnType<typeof GlobalLivescoreService.fetchGlobalLivescore>>

        // Flatten grouped data into SimplifiedMatch array for the UI
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
                        country: country.name,
                        leagueFlag: country.flag,
                        leagueLogo: league.logo,
                        startTime: match.startTime,
                        rawTime: match.timestamp,
                        hasAIPrediction: match.hasAIPrediction || false
                    })
                }
            }
        }

        // Sort logic
        flatMatches = flatMatches.sort((a, b) => {
            if (a.status === 'live' && b.status !== 'live') return -1
            if (a.status !== 'live' && b.status === 'live') return 1
            return (a.rawTime || 0) - (b.rawTime || 0)
        })

        apiStatus = flatMatches.length > 0 ? 'success' : 'empty'

    } catch (err: any) {
        console.error('[LiveScorePage] Error:', err)
        error = err?.message || 'Veri yüklenirken hata oluştu'
        apiStatus = 'error'
    }

    // Show error state
    if (apiStatus === 'error') {
        return (
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="bg-red-900/30 border border-red-500 rounded-xl p-6 text-center">
                    <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ API Bağlantı Hatası</h2>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">TheSports API'ye bağlanılamıyor. Rate limit veya VPS proxy sorunu olabilir.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                    >
                        Yeniden Dene
                    </button>
                </div>
            </div>
        )
    }

    // Show empty state
    if (apiStatus === 'empty') {
        return (
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-6 text-center">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">📭 Maç Bulunamadı</h2>
                    <p className="text-gray-300">Şu anda canlı veya günün programında maç bulunmuyor.</p>
                </div>
            </div>
        )
    }

    return <LiveScoreBoard initialMatches={flatMatches} />
}
