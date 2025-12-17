'use client'

import { useEffect, useState, useMemo } from 'react'
import { Activity, RefreshCw, Trophy, Clock, Search, Filter, Star, Bot } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export interface SimplifiedMatch {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo: string
    awayLogo: string
    homeScore: number
    awayScore: number
    minute: number | string
    status: 'live' | 'ht' | 'ft' | 'ns'
    league: string
    country: string
    leagueFlag: string
    leagueLogo: string
    startTime: string
    rawTime: number
    hasAIPrediction?: boolean
}

interface LiveScoreBoardProps {
    initialMatches: SimplifiedMatch[]
}

export default function LiveScoreBoard({ initialMatches }: LiveScoreBoardProps) {
    const [matches, setMatches] = useState<SimplifiedMatch[]>(initialMatches)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'finished' | 'ai'>('all')
    const [dateFilter, setDateFilter] = useState<0 | 1 | 2>(1) // 0=Yesterday, 1=Today, 2=Tomorrow
    const [favoriteMatchIds, setFavoriteMatchIds] = useState<Set<string>>(new Set())

    // Load favorites from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('favoriteMatches')
        if (stored) {
            try {
                setFavoriteMatchIds(new Set(JSON.parse(stored)))
            } catch (e) {
                console.error('Failed to parse favorites', e)
            }
        }
    }, [])

    const toggleFavorite = (e: React.MouseEvent, matchId: string) => {
        e.stopPropagation() // Prevent row click navigation
        const newFavs = new Set(favoriteMatchIds)
        if (newFavs.has(matchId)) {
            newFavs.delete(matchId)
        } else {
            newFavs.add(matchId)
        }
        setFavoriteMatchIds(newFavs)
        localStorage.setItem('favoriteMatches', JSON.stringify(Array.from(newFavs)))
    }

    // Helper to get day boundaries
    const getDayBounds = (offset: number) => {
        const start = new Date()
        start.setDate(start.getDate() + offset)
        start.setHours(0, 0, 0, 0)

        const end = new Date(start)
        end.setHours(23, 59, 59, 999)

        return { start: start.getTime() / 1000, end: end.getTime() / 1000, label: start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' }) }
    }

    const yesterdayBounds = getDayBounds(-1)
    const todayBounds = getDayBounds(0)
    const tomorrowBounds = getDayBounds(1)

    const refreshData = async () => {
        setIsRefreshing(true)
        try {
            // Fetch from new API that includes hasAIPrediction
            const res = await fetch('/api/livescore')
            const apiData = await res.json()

            // Flatten the grouped response into SimplifiedMatch format
            const flatMatches: SimplifiedMatch[] = []
            for (const country of apiData.countries || []) {
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
                        } as SimplifiedMatch & { hasAIPrediction: boolean })
                    }
                }
            }

            // Sort: Live first, then by rawTime
            const sorted = flatMatches.sort((a, b) => {
                if (a.status === 'live' && b.status !== 'live') return -1
                if (a.status !== 'live' && b.status === 'live') return 1
                return (a.rawTime || 0) - (b.rawTime || 0)
            })
            setMatches(sorted)
            setLastUpdated(new Date())
        } catch (error) {
            console.error('Failed to refresh matches', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Poll every 30 seconds (fallback) but also listen to Realtime
    useEffect(() => {
        // Initial Fetch - DISABLED to prevent overwriting server props with potential rate-limited empty response
        // refreshData()

        const interval = setInterval(() => {
            refreshData()
        }, 30000) // Increase polling interval since we have realtime

        // Supabase Realtime Setup
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        let channel: any = null
        let supabaseClient: any = null

        if (supabaseUrl && supabaseKey) {
            import('@supabase/supabase-js').then(({ createClient }) => {
                supabaseClient = createClient(supabaseUrl, supabaseKey)

                channel = supabaseClient
                    .channel('live-scores-realtime')
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'live_matches' },
                        (payload: any) => {
                            const newData = payload.new
                            if (!newData || !newData.id) return

                            // console.log('[Realtime] Update:', newData)

                            setMatches(prev => prev.map(m => {
                                if (String(m.id) === String(newData.id)) {
                                    return {
                                        ...m,
                                        homeScore: newData.home_score,
                                        awayScore: newData.away_score,
                                        minute: newData.minute || m.minute,
                                        status: mapStatusShortToUI(newData.status_short || m.status || 'NS'),
                                        // Force live status if getting updates
                                        // Update rawTime to affect sorting? Maybe not needed for just score.
                                    }
                                }
                                return m
                            }))
                        }
                    )
                    .subscribe()
            })
        }

        return () => {
            clearInterval(interval)
            if (channel && supabaseClient) supabaseClient.removeChannel(channel)
        }
    }, [])

    function mapStatusShortToUI(short: string): 'live' | 'ht' | 'ft' | 'ns' {
        if (short === 'HT') return 'ht'
        if (short === 'FT' || short === 'AET' || short === 'PEN') return 'ft'
        if (['NS', 'PST', 'CANC', 'ABD'].includes(short)) return 'ns'
        return 'live' // Default to live for 1H, 2H, ET, etc.
    }

    // Filter matches
    const filteredMatches = matches.filter(m => {
        // Date Filter - SIMPLIFIED FOR DEBUGGING
        // If server only sends Today's matches, we generally don't need to filter strictly on client
        // unless viewing Yesterday/Tomorrow tabs which are currently disabled on server.

        // Only apply heavy date filtering if NOT Today (default) logic
        // But since we reverted yesterday/tomorrow on server, let's just show everything for now
        // to ensure data appears.

        // const matchTime = m.rawTime || 0
        // let bounds = todayBounds
        // if (dateFilter === 0) bounds = yesterdayBounds
        // if (dateFilter === 2) bounds = tomorrowBounds
        // if (matchTime < bounds.start || matchTime > bounds.end) return false

        const matchesSearch =
            m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.league.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (statusFilter === 'live') return m.status === 'live' || m.status === 'ht'
        if (statusFilter === 'upcoming') return m.status === 'ns'
        if (statusFilter === 'finished') return m.status === 'ft'
        if (statusFilter === 'ai') return m.hasAIPrediction

        return true
    })

    // Group matches by League and Sort Alphabetically
    const groupedMatches = useMemo(() => {
        const groups: Record<string, typeof matches> = {}
        filteredMatches.forEach(match => {
            // Key: "Country Name|League Name|Flag URL"
            // Use match.country if available, otherwise fallback to matching from flag? No, simple strings.
            // Note: match.country might be empty string, handle gracefully.
            const cName = match.country || 'Dünya'
            const key = `${cName}|${match.league}|${match.leagueFlag}`
            if (!groups[key]) groups[key] = []
            groups[key].push(match)
        })

        // Sort keys alphabetically by Country Name (second part of key)
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const countryA = a.split('|')[0] || ''
            const countryB = b.split('|')[0] || ''
            const leagueA = a.split('|')[1] || ''
            const leagueB = b.split('|')[1] || ''

            // Primary sort: Country Name
            const countryComp = countryA.localeCompare(countryB, 'tr')
            if (countryComp !== 0) return countryComp

            // Secondary sort: League Name
            return leagueA.localeCompare(leagueB, 'tr')
        })

        // Reconstruct sorted object entries (for mapping)
        // Actually, we can just return the sorted entries array directly or handle it in rendering
        // But to keep structure simple, let's just return key-value pairs in correct order
        // JS objects don't strictly guarantee order, but Object.entries usually respects insertion.
        // Better to return entries array:
        return sortedKeys.map(key => ({ key, matches: groups[key] }))
    }, [filteredMatches])

    const liveCount = matches.filter(m => m.status === 'live' || m.status === 'ht').length

    return (
        <div className="min-h-screen bg-[#f2f2f2] font-sans text-[13px]">
            {/* Top Bar / Filters */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10 flex flex-col">
                {/* Date Filter Row */}
                <div className="flex items-center justify-center border-b border-slate-100 py-2 bg-slate-50 gap-2">
                    <button
                        onClick={() => setDateFilter(0)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${dateFilter === 0 ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Dün ({yesterdayBounds.label})
                    </button>
                    <button
                        onClick={() => setDateFilter(1)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${dateFilter === 1 ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Bugün ({todayBounds.label})
                    </button>
                    <button
                        onClick={() => setDateFilter(2)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${dateFilter === 2 ? 'bg-black text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Yarın ({tomorrowBounds.label})
                    </button>
                </div>

                <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between w-full">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {(['all', 'live', 'upcoming', 'finished', 'ai'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-tight transition-colors whitespace-nowrap flex items-center gap-1 ${statusFilter === status
                                    ? status === 'ai' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'
                                    : status === 'ai' ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {status === 'ai' && <Bot size={14} />}
                                {status === 'all' ? 'HEPSİ' : status === 'live' ? `CANLI (${liveCount})` : status === 'upcoming' ? 'BAŞLAMADI' : status === 'finished' ? 'BİTMİŞ' : 'AI MAÇLAR'}
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
                {groupedMatches.length === 0 && (
                    <div className="bg-white rounded-lg p-12 text-center text-slate-400 text-sm shadow-sm border border-slate-200 mt-8">
                        Aradığınız kriterlere uygun maç bulunamadı.
                    </div>
                )}

                {/* League Groups */}
                {groupedMatches.map(({ key: marketKey, matches: leagueMatches }) => {
                    const [countryName, leagueName, leagueFlag] = marketKey.split('|')

                    return (
                        <div key={marketKey} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            {/* League Header */}
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {leagueFlag && leagueFlag !== 'undefined' && (
                                        <img
                                            src={leagueFlag}
                                            alt={countryName}
                                            className="w-5 h-5 object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                            }}
                                        />
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
                                    const isFavorite = favoriteMatchIds.has(match.id)

                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => window.location.href = `/admin/livescore/${match.id}`}
                                            className={`group flex items-center h-16 md:h-12 hover:bg-[#fff9e6] cursor-pointer transition-colors px-2 md:px-4 ${isFavorite ? 'bg-yellow-50' : ''}`}
                                        >

                                            {/* Star / AI / Time / Status */}
                                            <div className="w-20 flex items-center gap-1 border-r border-transparent md:border-slate-50 mr-2 md:mr-4 shrink-0">
                                                {/* Favorite Star */}
                                                <button
                                                    onClick={(e) => toggleFavorite(e, match.id)}
                                                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                                                >
                                                    <Star
                                                        size={14}
                                                        className={isFavorite ? "fill-yellow-400 text-yellow-400" : "text-slate-300 hover:text-slate-400"}
                                                    />
                                                </button>

                                                {/* AI Prediction Indicator */}
                                                {(match as any).hasAIPrediction && (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center animate-pulse" title="Cenkler AI Tahmini Var">
                                                        <Bot size={14} className="text-white" />
                                                    </div>
                                                )}

                                                <div className="flex flex-col items-center justify-center gap-0.5 text-[11px] min-w-[32px]">
                                                    {isLive ? (
                                                        <span className="text-[#e21b23] font-bold animate-pulse">
                                                            {match.status === 'ht' ? 'İY' : (() => {
                                                                const min = parseInt(typeof match.minute === 'string' ? match.minute : String(match.minute || 0)) || 0
                                                                // Simple logic: if > 45 in 1H show 45+, if > 90 in 2H show 90+
                                                                // Note: match.minute comes from backend calculation now.
                                                                // If backend sends 94, we can iterate:
                                                                // If minute > 90 -> 90 + (min-90)
                                                                // If minute > 45 && status == 1H? (Backend handles status checks)
                                                                // Let's assume Minute > 90 means extra time for 2H.
                                                                if (min > 90) return `90+${min - 90}'`
                                                                if (min > 45 && min < 55 && match.status !== 'ht') {
                                                                    // This is tricky without knowing if it's 1H or 2H explicitly here if mapped to 'live'
                                                                    // But backend sends linear minute now.
                                                                    // Let's just trust the minute.
                                                                    // Or if user wants specifically 90+ format:
                                                                    return `${min}'`
                                                                }
                                                                return min > 90 ? `90+${min - 90}'` : `${min}'`
                                                            })()}
                                                        </span>
                                                    ) : isFinished ? (
                                                        <span className="text-slate-500 font-medium">Bitti</span>
                                                    ) : (
                                                        <span className="text-slate-800 font-medium">{match.startTime.split(' ')[1]?.slice(0, 5)}</span>
                                                    )}
                                                </div>
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
