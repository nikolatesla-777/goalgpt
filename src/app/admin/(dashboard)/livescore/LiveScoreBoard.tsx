'use client'

import { useEffect, useState } from 'react'
import { Activity, Calendar, Clock, Trophy, MapPin, RefreshCw, AlertCircle } from 'lucide-react'
import { fetchLiveMatchesSimplified, SimplifiedMatch } from '@/app/admin/(dashboard)/predictions/manual/actions'

interface LiveScoreBoardProps {
    initialMatches: SimplifiedMatch[]
}

export default function LiveScoreBoard({ initialMatches }: LiveScoreBoardProps) {
    const [matches, setMatches] = useState<SimplifiedMatch[]>(initialMatches)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)

    const refreshData = async () => {
        setIsRefreshing(true)
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
        } finally {
            setIsRefreshing(false)
        }
    }

    // Poll every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            refreshData()
        }, 15000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="relative">
                            <Activity className="w-8 h-8 text-emerald-400" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75" />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
                        </div>
                        LiveScore Center
                    </h1>
                    <p className="text-slate-400 mt-2 flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Gerçek zamanlı veri akışı ve anlık skor takibi
                    </p>
                </div>

                <div className="flex items-center gap-4 z-10">
                    <div className="bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Son Güncelleme</span>
                        <span className="text-xs font-mono text-emerald-400 font-medium">
                            {lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>

                    <div className="bg-emerald-500/10 px-6 py-3 rounded-xl border border-emerald-500/20 flex flex-col items-center min-w-[100px]">
                        <span className="text-2xl font-bold text-emerald-400">{matches.length}</span>
                        <span className="text-[10px] text-emerald-200/60 uppercase font-bold tracking-wider">Aktif Maç</span>
                    </div>
                </div>
            </div>

            {/* Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                ))}

                {matches.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-500 bg-[#0F172A] rounded-2xl border border-dashed border-slate-800">
                        <div className="bg-slate-900 p-4 rounded-full mb-4">
                            <Activity className="w-8 h-8 opacity-40" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">Şu an canlı maç bulunmuyor</h3>
                        <p className="text-sm text-slate-500 mt-1">Daha sonra tekrar kontrol edebilirsiniz.</p>
                    </div>
                )}
            </div>

            {/* API Status Hint (Only visible if using sample data implicitly) */}
            <div className="flex items-center gap-2 text-xs text-slate-600 justify-center pt-8 opacity-50">
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Veriler TheSports API üzerinden 15 saniyede bir güncellenir.</span>
            </div>
        </div>
    )
}

function MatchCard({ match }: { match: SimplifiedMatch }) {
    const isLive = match.status === 'live'

    return (
        <div className="group relative bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10">
            {/* Top Bar: League & Status */}
            <div className="px-5 py-4 border-b border-slate-800/50 flex justify-between items-start bg-slate-900/30">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-lg border border-slate-700">
                        {match.leagueFlag || '⚽'}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate pr-2">{match.league}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {match.startTime}
                        </div>
                    </div>
                </div>

                <div className={`
                    flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm
                    ${isLive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'}
                `}>
                    {isLive && (
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                    )}
                    {isLive ? `${match.minute}'` : match.status.toUpperCase()}
                </div>
            </div>

            {/* Match Content */}
            <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-slate-700/50 shadow-inner group-hover:border-emerald-500/20 transition-colors">
                            <span className="text-sm font-bold text-slate-400 tracking-tighter">
                                {match.homeTeam.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-200 text-center leading-tight line-clamp-2 h-10 flex items-center">
                            {match.homeTeam}
                        </span>
                    </div>

                    {/* Score Board */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="bg-slate-950 px-5 py-2 rounded-xl border border-slate-800 shadow-inner flex items-center gap-3">
                            <span className={`text-2xl font-bold font-mono ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {match.homeScore}
                            </span>
                            <span className="text-slate-600 font-bold">-</span>
                            <span className={`text-2xl font-bold font-mono ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {match.awayScore}
                            </span>
                        </div>
                        {isLive && (
                            <span className="text-[10px] text-emerald-500/80 font-medium tracking-wider animate-pulse">CANLI</span>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center border-2 border-slate-700/50 shadow-inner group-hover:border-emerald-500/20 transition-colors">
                            <span className="text-sm font-bold text-slate-400 tracking-tighter">
                                {match.awayTeam.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-200 text-center leading-tight line-clamp-2 h-10 flex items-center">
                            {match.awayTeam}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer / ID */}
            <div className="px-5 py-3 border-t border-slate-800/50 bg-slate-900/30 flex justify-between items-center">
                <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    ID: {match.id}
                </div>
                <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {match.leagueFlag}
                </div>
            </div>
        </div>
    )
}
