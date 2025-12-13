'use client'

import { useEffect, useState } from 'react'
import { Activity, RefreshCcw } from 'lucide-react'
import { fetchLiveMatchesSimplified, SimplifiedMatch } from '@/app/admin/(dashboard)/predictions/manual/actions'

interface LiveScoreBoardProps {
    initialMatches: SimplifiedMatch[]
}

export default function LiveScoreBoard({ initialMatches }: LiveScoreBoardProps) {
    const [matches, setMatches] = useState<SimplifiedMatch[]>(initialMatches)
    const [loading, setLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

    const refreshData = async () => {
        try {
            const data = await fetchLiveMatchesSimplified()
            // Sort: Live first, then by rawTime (newest first)
            const sorted = data.sort((a, b) => {
                if (a.status === 'live' && b.status !== 'live') return -1
                if (a.status !== 'live' && b.status === 'live') return 1
                return (b.rawTime || 0) - (a.rawTime || 0)
            })
            setMatches(sorted)
            setLastUpdated(new Date())
        } catch (error) {
            console.error('Failed to refresh matches', error)
        }
    }

    // Poll every 15 seconds (Safe for API limits, feels live enough)
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData()
        }, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Activity className="text-emerald-400 animate-pulse" />
                        LiveScore
                    </h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Canlı Veri Akışı (Otomatik Yenilenir)
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-600 font-mono hidden md:block">
                        Son Güncelleme: {lastUpdated.toLocaleTimeString()}
                    </span>
                    <div className="bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-500/30">
                        <span className="text-emerald-400 font-bold">{matches.length}</span>
                        <span className="text-emerald-200/70 ml-2 text-sm">Maç Bulundu</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => (
                    <div
                        key={match.id}
                        className="bg-[#111111] border border-white/5 rounded-xl p-4 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                    >
                        {/* Status Badge */}
                        <div className="absolute top-0 right-0 p-3">
                            <span className={`
                                text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1
                                ${match.status === 'live'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' // blink effect handles by icon
                                    : 'bg-gray-800 text-gray-400 border-gray-700'}
                            `}>
                                {match.status === 'live' && (
                                    <span className="block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse space-x-1" />
                                )}
                                {match.status === 'live' ? `${match.minute}'` : match.status.toUpperCase()}
                            </span>
                        </div>

                        {/* League Info */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">{match.leagueFlag}</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-300 truncate max-w-[200px]">{match.league}</span>
                                <span className="text-[10px] text-gray-500">{match.startTime}</span>
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
                                <div className={`text-2xl font-bold tracking-widest px-3 py-1 rounded-lg border transition-colors
                                    ${match.status === 'live' ? 'text-white bg-white/5 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-gray-400 bg-white/5 border-white/10'}
                                `}>
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
