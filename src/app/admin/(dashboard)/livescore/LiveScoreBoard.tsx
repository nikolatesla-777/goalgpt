'use client'

import { useEffect, useState, useMemo } from 'react'
import { Activity, RefreshCw, Trophy, Clock, Search, Filter } from 'lucide-react'
import { fetchLiveMatchesSimplified, SimplifiedMatch } from '@/app/admin/(dashboard)/predictions/manual/actions'

interface LiveScoreBoardProps {
    initialMatches: SimplifiedMatch[]
}

export default function LiveScoreBoard({ initialMatches }: LiveScoreBoardProps) {
    const [matches, setMatches] = useState<SimplifiedMatch[]>(initialMatches)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all')

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

    // Filter matches
    const filteredMatches = matches.filter(m => {
        const matchesSearch =
            m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.league.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (statusFilter === 'live') return m.status === 'live' || m.status === 'ht'
        if (statusFilter === 'upcoming') return m.status === 'ns'
        if (statusFilter === 'finished') return m.status === 'ft'

        return true
    })

    // Group matches by League
    const groupedMatches = useMemo(() => {
        const groups: Record<string, typeof matches> = {}
        filteredMatches.forEach(match => {
            // Key: "League Name|Country Name" (using pipe to split later)
            const key = `${match.league}|${match.leagueFlag}`
            if (!groups[key]) groups[key] = []
            groups[key].push(match)
        })
        return groups
    }, [filteredMatches])

    const liveCount = matches.filter(m => m.status === 'live' || m.status === 'ht').length

    return (
        <div className="min-h-screen bg-[#f2f2f2] font-sans text-[13px]">
            {/* Top Bar / Filters */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {(['all', 'live', 'upcoming', 'finished'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-tight transition-colors whitespace-nowrap ${statusFilter === status
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {status === 'all' ? 'HEPSİ' : status === 'live' ? `CANLI (${liveCount})` : status === 'upcoming' ? 'BAŞLAMADI' : 'BİTMİŞ'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center bg-slate-100 rounded-md px-2 py-1 ml-4 ring-1 ring-slate-200">
                        <span className="text-slate-400 mr-2">🔍</span>
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs w-32 md:w-48 placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-0 md:p-4 space-y-4">

                {/* Empty State */}
                {Object.keys(groupedMatches).length === 0 && (
                    <div className="bg-white rounded-lg p-12 text-center text-slate-400 text-sm shadow-sm border border-slate-200 mt-8">
                        Aradığınız kriterlere uygun maç bulunamadı.
                    </div>
                )}

                {/* League Groups */}
                {Object.entries(groupedMatches).map(([marketKey, leagueMatches]) => {
                    const [leagueName, countryName] = marketKey.split('|')

                    return (
                        <div key={marketKey} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            {/* League Header */}
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {leagueMatches[0]?.leagueFlag && (
                                        <span className="text-lg leading-none grayscale opacity-80">{leagueMatches[0].leagueFlag}</span>
                                    )}
                                    <div className="flex flex-col md:flex-row md:items-baseline gap-1">
                                        <span className="font-bold text-slate-700 text-xs uppercase">{countryName}</span>
                                        <span className="text-slate-400 text-[11px] hidden md:inline">•</span>
                                        <span className="font-semibold text-slate-600 text-xs">{leagueName}</span>
                                    </div>
                                </div>
                                <a href="#" className="text-[11px] text-blue-600 hover:underline">Puan Durumu</a>
                            </div>

                            {/* Match List */}
                            <div className="divide-y divide-slate-100">
                                {leagueMatches.map(match => {
                                    const isLive = match.status === 'live' || match.status === 'ht'
                                    const isFinished = match.status === 'ft'
                                    const isNotStarted = match.status === 'ns'

                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => window.location.href = `/admin/livescore/${match.id}`}
                                            className="group flex items-center h-16 md:h-12 hover:bg-[#fff9e6] cursor-pointer transition-colors px-2 md:px-4"
                                        >
                                            {/* Star / Time / Status */}
                                            <div className="w-16 flex flex-col items-center justify-center gap-0.5 text-[11px] border-r border-transparent md:border-slate-50 mr-2 md:mr-4 shrink-0">
                                                {isLive ? (
                                                    <span className="text-[#e21b23] font-bold animate-pulse">
                                                        {match.status === 'ht' ? 'İY' : `${match.minute}'`}
                                                    </span>
                                                ) : isFinished ? (
                                                    <span className="text-slate-500 font-medium">Bitti</span>
                                                ) : (
                                                    <span className="text-slate-800 font-medium">{match.startTime.split(' ')[1]?.slice(0, 5)}</span>
                                                )}
                                            </div>

                                            {/* Teams & Score */}
                                            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-8">

                                                {/* Home */}
                                                <div className={`flex items-center justify-end gap-2 text-right ${isLive || isFinished ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    <span className="hidden md:inline truncate">{match.homeTeam}</span>
                                                    <span className="md:hidden truncate">{match.homeTeam.substring(0, 12)}</span>
                                                    {match.homeLogo && <img src={match.homeLogo} alt="" className="w-5 h-5 object-contain" />}
                                                </div>

                                                {/* Score Box */}
                                                <div className="w-16 text-center shrink-0 flex items-center justify-center gap-1 font-bold text-sm">
                                                    {isNotStarted ? (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    ) : (
                                                        <>
                                                            <span className={`${isLive ? 'text-[#e21b23]' : 'text-slate-800'}`}>{match.homeScore}</span>
                                                            <span className="text-slate-300 mx-[1px]">-</span>
                                                            <span className={`${isLive ? 'text-[#e21b23]' : 'text-slate-800'}`}>{match.awayScore}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Away */}
                                                <div className={`flex items-center justify-start gap-2 text-left ${isLive || isFinished ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                                                    {match.awayLogo && <img src={match.awayLogo} alt="" className="w-5 h-5 object-contain" />}
                                                    <span className="hidden md:inline truncate">{match.awayTeam}</span>
                                                    <span className="md:hidden truncate">{match.awayTeam.substring(0, 12)}</span>
                                                </div>

                                            </div>

                                            {/* Half Time Display */}
                                            <div className="hidden md:flex w-16 items-center justify-end text-[10px] text-slate-400 shrink-0 ml-4 font-normal">
                                                {!isNotStarted && <span>(0-0)</span>}
                                            </div>

                                            {/* Arrow visual on hover */}
                                            <div className="w-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-slate-400">›</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                <div className="h-8"></div>
            </div>
        </div>
    )
}
