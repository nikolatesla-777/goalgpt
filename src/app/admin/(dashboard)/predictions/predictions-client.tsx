'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Search,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Trash2,
    Check,
    X,
    RefreshCw,
    Plus,
    Filter,
    Download,
    CheckCircle2,
    XCircle,
    Clock,
    Eye
} from 'lucide-react'
import { getAdminPredictions, AdminPrediction } from './actions'

// Helper: Format team logo URL (API-Football CDN)
function formatTeamLogoUrl(teamId: string | number | null): string | null {
    if (!teamId) return null
    return `https://media.api-sports.io/football/teams/${teamId}.png`
}

// Helper: Country flag emoji
function getCountryFlag(country: string | null | undefined): string {
    if (!country) return '🌍'
    const c = country.toLowerCase()
    if (c.includes('romania')) return '🇷🇴'
    if (c.includes('australia')) return '🇦🇺'
    if (c.includes('malaysia')) return '🇲🇾'
    if (c.includes('ethiopia')) return '🇪🇹'
    if (c.includes('austria')) return '🇦🇹'
    if (c.includes('hong kong')) return '🇭🇰'
    if (c.includes('france')) return '🇫🇷'
    if (c.includes('usa') || c.includes('united states')) return '🇺🇸'
    if (c.includes('england') || c.includes('premier')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
    if (c.includes('spain')) return '🇪🇸'
    if (c.includes('germany')) return '🇩🇪'
    if (c.includes('italy')) return '🇮🇹'
    if (c.includes('turkey') || c.includes('türkiye')) return '🇹🇷'
    return '🌍'
}

const ITEMS_PER_PAGE = 15

// Action Dropdown Component
function ActionDropdown({ onView, onMarkWon, onMarkLost, onDelete }: {
    onView: () => void
    onMarkWon: () => void
    onMarkLost: () => void
    onDelete: () => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                    <button onClick={() => { onView(); setIsOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        <Eye size={14} /> Detay Görüntüle
                    </button>
                    <button onClick={() => { onMarkWon(); setIsOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <Check size={14} /> Kazandı İşaretle
                    </button>
                    <button onClick={() => { onMarkLost(); setIsOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                        <X size={14} /> Kaybetti İşaretle
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={() => { onDelete(); setIsOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 size={14} /> Sil
                    </button>
                </div>
            )}
        </div>
    )
}

export default function PredictionsClientPage() {
    const [predictions, setPredictions] = useState<AdminPrediction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')

    // Live Data Map: key = matchId (TheSports UUID), value = { score: "1-0", minute: 45, status: "live" }
    const [liveData, setLiveData] = useState<Record<string, { home: number, away: number, minute: number, status: string }>>({})

    useEffect(() => {
        fetchData()

        // Realtime Subscription for Live Scores
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        let channel: any = null

        if (supabaseUrl && supabaseKey) {
            import('@supabase/supabase-js').then(({ createClient }) => {
                const supabase = createClient(supabaseUrl, supabaseKey)
                channel = supabase
                    .channel('admin-predictions-live')
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'live_matches' },
                        (payload: any) => {
                            const newData = payload.new
                            if (!newData || !newData.id) return

                            setLiveData(prev => ({
                                ...prev,
                                [newData.id]: {
                                    home: newData.home_score,
                                    away: newData.away_score,
                                    minute: newData.minute,
                                    status: newData.status_short
                                }
                            }))
                        }
                    )
                    .subscribe()
            })
        }

        return () => {
            if (channel) channel.unsubscribe()
        }
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const data = await getAdminPredictions(200)
            setPredictions(data)
        } catch (err) {
            console.error('Failed to load predictions', err)
        } finally {
            setIsLoading(false)
        }
    }

    // Filter
    const filteredPredictions = predictions.filter(p => {
        // Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            const matchesSearch = (
                p.homeTeam?.toLowerCase().includes(q) ||
                p.awayTeam?.toLowerCase().includes(q) ||
                p.league?.toLowerCase().includes(q) ||
                p.botName?.toLowerCase().includes(q)
            )
            if (!matchesSearch) return false
        }

        // Status
        if (statusFilter !== 'all') {
            if (statusFilter === 'won' && p.result !== 'won') return false
            if (statusFilter === 'lost' && p.result !== 'lost') return false
            if (statusFilter === 'pending' && p.result !== 'pending') return false
        }

        return true
    })

    // Pagination
    const totalPages = Math.ceil(filteredPredictions.length / ITEMS_PER_PAGE)
    const paginatedPredictions = filteredPredictions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Stats
    const totalCount = predictions.length
    const wonCount = predictions.filter(p => p.result === 'won').length
    const lostCount = predictions.filter(p => p.result === 'lost').length
    const pendingCount = predictions.filter(p => p.result === 'pending').length

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-xs text-slate-400 mb-1">Ana Sayfa &gt; AI Tahminler</p>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-2xl">📊</span> Tüm Tahminler
                    </h1>
                </div>
                <button className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                    <Plus size={18} />
                    Yeni Tahmin Oluştur
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Toplam</div>
                    <div className="text-2xl font-bold text-slate-800">{totalCount}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-xs font-medium text-emerald-500 uppercase tracking-wide mb-1">Kazanan</div>
                    <div className="text-2xl font-bold text-emerald-600">{wonCount}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-xs font-medium text-rose-500 uppercase tracking-wide mb-1">Kaybeden</div>
                    <div className="text-2xl font-bold text-rose-600">{lostCount}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="text-xs font-medium text-amber-500 uppercase tracking-wide mb-1">Bekleyen</div>
                    <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Takım, lig, bot ara..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        {(['all', 'pending', 'won', 'lost'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => { setStatusFilter(status); setCurrentPage(1) }}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${statusFilter === status
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {status === 'all' ? 'Tümü' : status === 'pending' ? 'Bekleyen' : status === 'won' ? 'Kazanan' : 'Kaybeden'}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tarih</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Bot</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lig</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ev Sahibi</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Skor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Deplasman</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahmin</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-16">
                                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
                                        <p className="text-slate-500 text-sm">Yükleniyor...</p>
                                    </td>
                                </tr>
                            ) : paginatedPredictions.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-16">
                                        <div className="text-slate-400 text-4xl mb-2">📭</div>
                                        <p className="text-slate-500 text-sm">Sonuç bulunamadı</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedPredictions.map((p, index) => {
                                    const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                                    const homeLogoUrl = formatTeamLogoUrl(p.homeTeamId)
                                    const awayLogoUrl = formatTeamLogoUrl(p.awayTeamId)

                                    // Bot renk sınıfı
                                    const getBotColorClass = (name: string) => {
                                        if (name.includes('ALERT')) return 'bg-orange-100 text-orange-700'
                                        if (name.includes('Code Zero')) return 'bg-purple-100 text-purple-700'
                                        if (name.includes('BOT 007')) return 'bg-blue-100 text-blue-700'
                                        return 'bg-slate-100 text-slate-700'
                                    }

                                    // Live Data Check
                                    const liveMatch = p.matchId ? liveData[p.matchId] : null

                                    // Determine Display Values
                                    let displayScore = p.currentScore
                                    let displayStatus = p.matchStatus
                                    let displayStatusText = p.matchStatusText
                                    let isLiveUpdate = false

                                    if (liveMatch && p.result === 'pending') {
                                        displayScore = `${liveMatch.home}-${liveMatch.away}`
                                        displayStatus = 'live'
                                        isLiveUpdate = true
                                        // Status Text (Minute or Status)
                                        if (['HT', 'FT', 'NS', 'INT'].includes(liveMatch.status)) {
                                            displayStatusText = liveMatch.status
                                        } else {
                                            displayStatusText = `${liveMatch.minute}'`
                                        }
                                    }

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            {/* # */}
                                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">{rowNum}</td>

                                            {/* TARİH: 15.12.25 alt satır 05:21 */}
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-slate-700">{p.dateFormatted}</div>
                                                <div className="text-xs text-slate-400">{p.timeFormatted}</div>
                                            </td>

                                            {/* BOT: Parser'dan gelen isim */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${getBotColorClass(p.botName)}`}>
                                                    {p.botName}
                                                </span>
                                            </td>

                                            {/* LİG */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base">{p.leagueFlag}</span>
                                                    <span className="text-sm text-slate-600 truncate max-w-[120px]" title={p.league}>{p.league}</span>
                                                </div>
                                            </td>

                                            {/* EV SAHİBİ: Tam isim, sığmazsa alt satıra */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {homeLogoUrl ? (
                                                        <img src={homeLogoUrl} alt="" className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">⚽</div>
                                                    )}
                                                    <span className="text-sm font-medium text-slate-800 break-words max-w-[120px]" title={p.homeTeam}>{p.homeTeam}</span>
                                                </div>
                                            </td>

                                            {/* SKOR: Anlık skor + MS/IY/Canlı icon */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="relative">
                                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-sm font-bold font-mono transition-all ${displayStatus === 'ft' ? 'bg-slate-800 text-white' :
                                                                isLiveUpdate ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200' :
                                                                    displayStatus === 'live' ? 'bg-emerald-500 text-white' :
                                                                        'bg-slate-100 text-slate-700'
                                                            }`}>
                                                            {displayScore}
                                                        </span>
                                                        {isLiveUpdate && (
                                                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {displayStatusText && (
                                                        <span className={`text-[10px] font-bold ${displayStatusText === 'MS' ? 'text-slate-500' :
                                                                isLiveUpdate ? 'text-emerald-600 animate-pulse' :
                                                                    ['IY', 'HT'].includes(displayStatusText) ? 'text-amber-600' :
                                                                        'text-emerald-600'
                                                            }`}>
                                                            {displayStatusText}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* DEPLASMAN: Tam isim */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {awayLogoUrl ? (
                                                        <img src={awayLogoUrl} alt="" className="w-6 h-6 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                    ) : (
                                                        <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs flex-shrink-0">⚽</div>
                                                    )}
                                                    <span className="text-sm font-medium text-slate-800 break-words max-w-[120px]" title={p.awayTeam}>{p.awayTeam}</span>
                                                </div>
                                            </td>

                                            {/* TAHMİN: Üst satır tahmin, alt satır dakika ve skor */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-emerald-600">{p.prediction || '-'}</span>
                                                    <span className="text-xs text-slate-400">
                                                        {p.predictionMinute}' - {p.predictionScore}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* DURUM */}
                                            <td className="px-4 py-3 text-center">
                                                {p.result === 'won' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                                                        <CheckCircle2 size={12} />
                                                        Kazandı
                                                    </span>
                                                ) : p.result === 'lost' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold">
                                                        <XCircle size={12} />
                                                        Kaybetti
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-xs font-bold">
                                                        <Clock size={12} />
                                                        Bekliyor
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <ActionDropdown
                                                    onView={() => console.log('View', p.id)}
                                                    onMarkWon={() => console.log('Won', p.id)}
                                                    onMarkLost={() => console.log('Lost', p.id)}
                                                    onDelete={() => console.log('Delete', p.id)}
                                                />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 0 && (
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Toplam <span className="font-semibold text-slate-700">{filteredPredictions.length}</span> kayıt
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-600 font-medium"
                            >
                                İlk
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-600 font-medium flex items-center gap-1"
                            >
                                <ChevronLeft size={14} /> Önceki
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 2 + i
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                                    }
                                    if (pageNum < 1) pageNum = 1
                                    if (pageNum > totalPages) return null

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${currentPage === pageNum
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-600 font-medium flex items-center gap-1"
                            >
                                Sonraki <ChevronRight size={14} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs text-slate-600 font-medium"
                            >
                                Son
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
