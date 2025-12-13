'use client'

import { useEffect, useState } from 'react'
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

    const liveCount = matches.filter(m => m.status === 'live' || m.status === 'ht').length

    return (
        <div className="min-h-screen bg-[#fafafa] p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-200">
                            <Activity className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                LiveScore Center
                                {isRefreshing && <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />}
                            </h1>
                            <p className="text-sm text-slate-500">
                                Son güncelleme: {lastUpdated.toLocaleTimeString()} • Otomatik yenilenir
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white border text-center border-slate-200 px-6 py-3 rounded-xl shadow-sm">
                            <span className="block text-2xl font-bold text-slate-800">{matches.length}</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Toplam Maç</span>
                        </div>
                        <div className="bg-white border text-center border-emerald-200 px-6 py-3 rounded-xl shadow-sm">
                            <span className="block text-2xl font-bold text-emerald-600">{liveCount}</span>
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Canlı Maç</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Takım veya lig ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {(['all', 'live', 'finished'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalization ${statusFilter === status
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {status === 'all' ? 'Tümü' : status === 'live' ? 'Canlı' : 'Bitmiş'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Durum</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Lig</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Tarih</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Ev Sahibi</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">Skor</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Deplasman</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMatches.map((match) => (
                                <tr
                                    key={match.id}
                                    onClick={() => window.location.href = `/admin/livescore/${match.id}`}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`
                                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border w-fit
                                            ${match.status === 'live'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'}
                                        `}>
                                            {match.status === 'live' && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            )}
                                            {match.status === 'live' ? `${match.minute}'` : match.status.toUpperCase()}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{match.leagueFlag}</span>
                                            <span className="text-sm font-semibold text-slate-700">{match.league}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                            <Clock className="w-3 h-3 opacity-50" />
                                            {match.startTime}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-sm font-semibold text-slate-700">{match.homeTeam}</span>
                                            {match.homeLogo ? (
                                                <img src={match.homeLogo} alt="" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {match.homeTeam.substring(0, 1)}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className={`
                                            inline-block px-4 py-1.5 rounded-lg border font-mono font-bold text-sm shadow-sm
                                            ${match.status === 'live'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-white text-slate-600 border-slate-200'}
                                        `}>
                                            {match.homeScore} - {match.awayScore}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-left">
                                        <div className="flex items-center justify-start gap-3">
                                            {match.awayLogo ? (
                                                <img src={match.awayLogo} alt="" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                    {match.awayTeam.substring(0, 1)}
                                                </div>
                                            )}
                                            <span className="text-sm font-semibold text-slate-700">{match.awayTeam}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredMatches.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Maç bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
