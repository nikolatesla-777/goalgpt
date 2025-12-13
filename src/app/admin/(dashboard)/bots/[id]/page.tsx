'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, Target, Trophy, Zap, Shield, Calendar, Clock, CheckCircle2, XCircle, Timer, AlertTriangle, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { getBotWithPredictions } from './actions'

// Types
interface Prediction {
    id: string
    home_team_name: string
    away_team_name: string
    match_score: string
    league_name: string
    match_minute: string
    prediction_type: string
    prediction_text: string
    received_at: string
    status: string
}

interface Bot {
    id: string
    name: string
    display_name: string
    description: string
    is_active: boolean
    win_rate: number
    total_predictions: number
    winning_predictions: number
}

// Custom Hook for Debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function BotDetailPage() {
    const params = useParams()
    const id = params?.id as string

    // State
    const [bot, setBot] = useState<Bot | null>(null)
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [page, setPage] = useState(1)
    const [searchText, setSearchText] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all', 'won', 'lost', 'pending'

    const debouncedSearch = useDebounce(searchText, 500)
    const itemsPerPage = 10

    useEffect(() => {
        if (!id) return

        const fetchData = async () => {
            setLoading(true)
            try {
                // Call Server Action with filters
                const { bot, predictions, totalCount, error } = await getBotWithPredictions(id, {
                    page,
                    limit: itemsPerPage,
                    search: debouncedSearch,
                    date: dateFilter,
                    status: statusFilter
                })

                if (error) throw new Error(error)

                setBot(bot)
                setPredictions(predictions)
                setTotalItems(totalCount)

            } catch (err: any) {
                console.error('Error fetching bot:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, page, debouncedSearch, dateFilter, statusFilter])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, dateFilter, statusFilter])


    // --- Loading State (Initial only) ---
    if (!bot && loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (error || (!bot && !loading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
                <Shield size={48} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold text-slate-800">Bot Bulunamadı</h2>
                <Link href="/admin/bots" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Bot Listesine Dön
                </Link>
            </div>
        )
    }

    // Calculations
    const totalCount = bot?.total_predictions || 0 // Global Total
    const wonCount = bot?.winning_predictions || 0
    // Currently we don't track lost count accurately in bot_groups table, assuming 0 for now as per clean data
    const lostCount = 0

    // Dynamic Pending Count: Total - (Won + Lost)
    const pendingCount = Math.max(0, totalCount - (wonCount + lostCount))

    const totalPages = Math.ceil(totalItems / itemsPerPage)

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto p-4 md:p-8 min-h-screen bg-[#F0F4F8]">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-4">
                <Link href="/admin/bots" className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all">
                    <ArrowLeft size={22} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        {bot?.display_name}
                        {bot?.is_active && <span className="flex h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shadow-sm"></span>}
                    </h1>
                    <p className="text-slate-600 font-medium text-base">{bot?.description}</p>
                </div>
            </div>

            {/* 5-Column Stats - Interactive */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatsCard
                    title="Toplam"
                    value={totalCount}
                    color="blue"
                    icon={<Activity size={90} />}
                    onClick={() => setStatusFilter('all')}
                    isActive={statusFilter === 'all'}
                />
                <StatsCard
                    title="Kazanan"
                    value={wonCount}
                    color="emerald"
                    icon={<CheckCircle2 size={90} />}
                    onClick={() => setStatusFilter('won')}
                    isActive={statusFilter === 'won'}
                />
                <StatsCard
                    title="Kaybeden"
                    value={lostCount}
                    color="rose"
                    icon={<XCircle size={90} />}
                    onClick={() => setStatusFilter('lost')}
                    isActive={statusFilter === 'lost'}
                />
                <StatsCard
                    title="Bekleyen"
                    value={pendingCount}
                    color="amber"
                    icon={<Timer size={90} />}
                    onClick={() => setStatusFilter('pending')}
                    isActive={statusFilter === 'pending'}
                />
                <StatsCard
                    title="Başarı"
                    value={`%${bot?.win_rate || 0}`}
                    color="purple"
                    icon={<Trophy size={90} />}
                    // Success rate is not a list filter
                    onClick={() => { }}
                />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto text-slate-800 font-bold text-lg">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md">
                        <Zap size={20} fill="white" />
                    </div>
                    <span>Canlı Maç Akışı</span>
                    {statusFilter !== 'all' && (
                        <span className="ml-2 px-3 py-1 rounded-full bg-slate-800 text-white text-xs uppercase tracking-wider">
                            {statusFilter === 'won' ? 'Kazananlar' : statusFilter === 'lost' ? 'Kaybedenler' : 'Bekleyenler'}
                        </span>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Takım ara..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:font-medium"
                        />
                        {searchText && (
                            <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Date Picker */}
                    <div className="relative">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                </div>
            ) : predictions.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-300 shadow-sm">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield size={48} className="text-slate-400" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl mb-2">Sonuç Bulunamadı</h3>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Bu filtreye uygun kayıt bulunamadı.</p>
                    {(searchText || dateFilter || statusFilter !== 'all') && (
                        <button
                            onClick={() => { setSearchText(''); setDateFilter(''); setStatusFilter('all') }}
                            className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors"
                        >
                            Filtreleri Temizle
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {predictions.map((p) => (
                        <ClientPredictionCard key={p.id} prediction={p} />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalItems > itemsPerPage && (
                <div className="flex justify-center items-center gap-2 mt-8 pb-8">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-1">
                        {getPageNumbers(page, totalPages).map((pageNum, idx) => (
                            pageNum === -1 ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold">...</span>
                            ) : (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`
                                        w-10 h-10 rounded-lg font-bold text-sm transition-all
                                        ${page === pageNum
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-600 ring-offset-2'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}
                                    `}
                                >
                                    {pageNum}
                                </button>
                            )
                        ))}
                    </div>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}

function ClientPredictionCard({ prediction }: { prediction: Prediction }) {
    const p = prediction
    const homeTeam = p.home_team_name || 'Ev Sahibi'
    const awayTeam = p.away_team_name || 'Deplasman'
    let score = p.match_score || '-'
    if (score === '-' && p.prediction_text) {
        const scoreMatch = p.prediction_text.match(/\(\d+-\d+\)/)
        if (scoreMatch) score = scoreMatch[0].replace(/[()]/g, '')
    }
    const league = p.league_name || 'Lig Bilinmiyor'
    let minute = p.match_minute || ''
    const raw = p.prediction_text || ''
    if (!minute && raw) {
        const emojiMatch = raw.match(/(?:⏰|⏱️|⏲️)\s*(\d{1,3})/);
        if (emojiMatch) { minute = emojiMatch[1]; }
        else {
            const quoteMatch = raw.match(/\b(\d{1,3})['’]/);
            if (quoteMatch) minute = quoteMatch[1];
            else {
                const exclMatch = raw.match(/!\s*(\d{1,3})/) || raw.match(/(\d{1,3})\s*!/);
                if (exclMatch) minute = exclMatch[1];
            }
        }
    }
    const dateObj = new Date(p.received_at)
    const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    const dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden hover:border-indigo-400 hover:shadow-[0_8px_24px_rgba(79,70,229,0.15)] transition-all duration-300 group transform hover:-translate-y-0.5">
            <div className="bg-slate-100/80 px-5 py-2.5 flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    <span className="uppercase tracking-wide text-slate-700">{league}</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                    <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={12} strokeWidth={2.5} /> {dateStr}</span>
                    <span className="flex items-center gap-1.5 text-indigo-600"><Clock size={12} strokeWidth={2.5} /> {timeStr}</span>
                </div>
            </div>
            <div className="p-5 sm:px-6 sm:py-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 shrink-0 border-2 border-slate-800">
                    {minute ? (
                        <>
                            <span className="text-xl font-black leading-none tracking-tighter">{minute}</span>
                            <span className="text-[9px] font-bold text-slate-300 mt-0.5 opacity-80">DK</span>
                        </>
                    ) : (
                        <div className="flex flex-col items-center animate-pulse">
                            <Activity size={20} className="text-emerald-400" />
                            <span className="text-[8px] font-bold text-emerald-400 mt-0.5">CANLI</span>
                        </div>
                    )}
                </div>
                <div className="flex-1 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="text-right font-extrabold text-slate-900 text-base sm:text-lg leading-tight">{homeTeam}</div>
                    <div className="bg-slate-100 px-4 py-2 rounded-lg text-slate-900 font-mono font-black tracking-widest text-lg min-w-[70px] text-center border-2 border-slate-200">{score}</div>
                    <div className="text-left font-extrabold text-slate-900 text-base sm:text-lg leading-tight">{awayTeam}</div>
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
                    <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-transform duration-200">
                        <div className="bg-white/20 p-1 rounded-full"><AlertTriangle size={14} className="text-white fill-yellow-400 stroke-yellow-400 animate-pulse" /></div>
                        <div className="flex flex-col leading-none text-left">
                            <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider mb-0.5">AI Sinyali</span>
                            <span className="text-base font-black tracking-wide">ALERT - D</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatsCard({ title, value, color, icon, onClick, isActive }: any) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-600 shadow-blue-500/50',
        emerald: 'text-emerald-600 bg-emerald-500 shadow-emerald-500/50',
        rose: 'text-rose-600 bg-rose-500 shadow-rose-500/50',
        amber: 'text-amber-500 bg-amber-500 shadow-amber-500/50',
        purple: 'text-purple-600 bg-purple-500 shadow-purple-500/50'
    }
    const borderColors: any = {
        blue: 'hover:border-blue-200',
        emerald: 'hover:border-emerald-200',
        rose: 'hover:border-rose-200',
        amber: 'hover:border-amber-200',
        purple: 'hover:border-purple-200'
    }

    // Active State Styling
    const ringClass = isActive
        ? `ring-4 ring-offset-2 ring-${color}-500/50 scale-[1.02]`
        : 'hover:scale-[1.01]'

    return (
        <div
            onClick={onClick}
            className={`
                bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] 
                flex flex-col justify-between h-36 relative overflow-hidden group 
                ${borderColors[color]} transition-all duration-300 cursor-pointer
                ${ringClass}
            `}
        >
            <div className={`absolute right-[-10px] top-[-10px] opacity-10 transform rotate-12 group-hover:scale-110 transition-transform ${colors[color].split(' ')[0]}`}>
                {icon}
            </div>
            <div className={`text-sm font-bold opacity-60 uppercase tracking-wider flex items-center gap-2 ${colors[color].split(' ')[0]}`}>
                {title}
            </div>
            <div className={`text-4xl font-black mt-2 text-slate-900`}>{value}</div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-auto overflow-hidden">
                <div className={`h-full w-full shadow-lg ${colors[color] ? colors[color].split(' ').slice(1).join(' ') : ''}`}></div>
            </div>
        </div>
    )
}

function getPageNumbers(currentPage: number, totalPages: number) {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
    }
    if (currentPage - delta > 2) range.unshift(-1);
    if (currentPage + delta < totalPages - 1) range.push(-1);
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
}
