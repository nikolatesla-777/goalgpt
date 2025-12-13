import { fetchLiveMatchesSimplified } from '@/app/admin/(dashboard)/predictions/manual/actions'
import { Activity } from 'lucide-react'

// Re-using the fetch logic from Manual Actions since it already handles fallback/error
// But we might want to expose a direct server action for this specific page if we want more data
// For now, let's use what we have or import directly from API if needed.
// Actually, `fetchLiveMatches` in manual actions returns `TheSportsMatch[]`.

export const dynamic = 'force-dynamic'

export default async function LiveScorePage() {
    const matches = await fetchLiveMatchesSimplified()

    // Sort by status (Live first) and then by time
    const sortedMatches = matches.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1
        if (a.status !== 'live' && b.status === 'live') return 1
        return b.rawTime - a.rawTime
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Activity className="text-emerald-400" />
                        LiveScore
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Şu an oynanan tüm maçlar ve anlık skorlar (TheSports API)
                    </p>
                </div>
                <div className="bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400 font-bold">{matches.length}</span>
                    <span className="text-emerald-200/70 ml-2 text-sm">Maç Bulundu</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedMatches.map((match) => (
                    <div
                        key={match.id}
                        className="bg-[#111111] border border-white/5 rounded-xl p-4 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                    >
                        {/* Status Badge */}
                        <div className="absolute top-0 right-0 p-3">
                            <span className={`
                                text-[10px] font-bold px-2 py-1 rounded-full border
                                ${match.status === 'live'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                                    : 'bg-gray-800 text-gray-400 border-gray-700'}
                            `}>
                                {match.status === 'live' ? `${match.minute}'` : match.status.toUpperCase()}
                            </span>
                        </div>

                        {/* League Info */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">{match.leagueFlag}</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-300 truncate max-w-[200px]">{match.league}</span>
                                <span className="text-[10px] text-gray-500">{match.id}</span>
                            </div>
                        </div>

                        {/* Teams & Score */}
                        <div className="flex items-center justify-between gap-4 mt-2">
                            {/* Home */}
                            <div className="flex-1 flex flex-col items-center text-center gap-2">
                                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                    {match.homeTeam.substring(0, 2)}
                                </div>
                                <span className="text-sm font-medium text-gray-300 leading-tight">{match.homeTeam}</span>
                            </div>

                            {/* Score */}
                            <div className="flex flex-col items-center">
                                <div className="text-2xl font-bold text-white tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/10 group-hover:bg-white/10 group-hover:border-emerald-500/20 transition-colors">
                                    {match.homeScore} - {match.awayScore}
                                </div>
                            </div>

                            {/* Away */}
                            <div className="flex-1 flex flex-col items-center text-center gap-2">
                                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                                    {match.awayTeam.substring(0, 2)}
                                </div>
                                <span className="text-sm font-medium text-gray-300 leading-tight">{match.awayTeam}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {matches.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <Activity className="w-12 h-12 mb-4 opacity-20" />
                        <p>Şu an canlı maç bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
