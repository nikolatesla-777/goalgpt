'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Target,
    Trophy,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Trash2,
    Crown,
    Gift,
    Check,
    X
} from 'lucide-react'
import { getManualPredictions, ManualPrediction, deletePrediction as deleteFromStore, updatePredictionResult, toggleVipStatus } from './prediction-store'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// Prediction type with VIP status
interface Prediction {
    id: string
    date: string
    time: string
    botName: string
    league: string
    leagueFlag: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    matchStatus: 'live' | 'ht' | 'ft'
    minute: number
    predictionMinute: string
    predictionScore: string
    prediction: string
    result: 'pending' | 'live_won' | 'won' | 'lost'
    isVip: boolean
}

const initialPredictions: Prediction[] = []

const botOptions = ['Tüm Botlar', 'Alert System', 'ALERT: D', 'Alert Code: 2', 'AlertCode: 17', 'Algoritma: 01', 'CODE 100']
const ITEMS_PER_PAGE = 10

// Match Status Badge
function MatchStatusBadge({ status, minute }: { status: string, minute: number }) {
    if (status === 'live') {
        return (
            <div className="flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-600 font-bold text-sm">{minute}'</span>
            </div>
        )
    }
    if (status === 'ht') {
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">HT</span>
    }
    return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded">FT</span>
}

// Result Badge
function ResultBadge({ result, matchStatus }: { result: string, matchStatus: string }) {
    const isLive = matchStatus === 'live' || matchStatus === 'ht'

    if (result === 'live_won') {
        return (
            <div className="relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-green-500/30 to-green-600/20 flex items-center justify-center border-2 border-green-500/50">
                    <CheckCircle2 size={22} className="text-green-400" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            </div>
        )
    }

    if (result === 'won') {
        return (
            <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-green-400" />
            </div>
        )
    }

    if (result === 'lost') {
        return (
            <div className="w-10 h-10 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle size={22} className="text-red-400" />
            </div>
        )
    }

    return (
        <div className="relative">
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${isLive ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-yellow-500/20'
                }`}>
                <Clock size={22} className="text-yellow-400" />
            </div>
            {isLive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
            )}
        </div>
    )
}

// VIP Badge
function VipBadge({ isVip }: { isVip: boolean }) {
    if (isVip) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-200 rounded text-xs font-bold text-amber-600">
                <Crown size={12} />
                VIP
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded text-xs font-bold text-emerald-600">
            <Gift size={12} />
            FREE
        </span>
    )
}

// Action Dropdown Component
function ActionDropdown({
    prediction,
    onUpdateResult,
    onToggleVip,
    onDelete
}: {
    prediction: Prediction
    onUpdateResult: (id: string, result: 'won' | 'lost') => void
    onToggleVip: (id: string) => void
    onDelete: (id: string) => void
}) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
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
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <MoreVertical size={18} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {/* Manuel Sonuçlandırma */}
                    <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-100">Sonuçlandır</div>
                    <button
                        onClick={() => { onUpdateResult(prediction.id, 'won'); setIsOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <Check size={16} className="text-green-500" />
                        Kazandı İşaretle
                    </button>
                    <button
                        onClick={() => { onUpdateResult(prediction.id, 'lost'); setIsOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <X size={16} className="text-red-500" />
                        Kaybetti İşaretle
                    </button>

                    {/* VIP Toggle */}
                    <div className="border-t border-slate-100">
                        <button
                            onClick={() => { onToggleVip(prediction.id); setIsOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            {prediction.isVip ? (
                                <>
                                    <Gift size={16} className="text-emerald-500" />
                                    FREE Yap
                                </>
                            ) : (
                                <>
                                    <Crown size={16} className="text-amber-500" />
                                    VIP Yap
                                </>
                            )}
                        </button>
                    </div>

                    {/* Delete */}
                    <div className="border-t border-slate-100">
                        <button
                            onClick={() => { onDelete(prediction.id); setIsOpen(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={16} />
                            Tahmini Sil
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PredictionsClientPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBot, setSelectedBot] = useState('Tüm Botlar')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all')
    const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'all'>('today')
    const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions)
    const [currentPage, setCurrentPage] = useState(1)

    // Load real predictions from Supabase and manual predictions
    useEffect(() => {
        const fetchPredictions = async () => {
            const supabase = createClient()

            // 1. Fetch from DB
            const { data, error } = await supabase
                .from('predictions_raw')
                .select('*')
                .order('received_at', { ascending: false })
                .limit(100)

            let dbPredictions: Prediction[] = []

            if (data) {
                dbPredictions = data.map((row: any) => {
                    // Extract Bot Name from analysis if possible, otherwise 'AI Bot'
                    // analysis format usually: "AlertCode: IY-1 Ev: 21 Dep: 16"
                    let botName = 'AI Bot'
                    const match = row.prediction_text?.match(/AlertCode:\s*([^\s]+)/) || row.prediction_text?.match(/Alert\s*System/)
                    if (match) botName = match[0]

                    const dateObj = new Date(row.received_at)

                    return {
                        id: row.external_id || row.id.toString(),
                        date: format(dateObj, 'dd.MM.yyyy'),
                        time: format(dateObj, 'HH:mm'),
                        botName: botName,
                        league: row.league_name || 'Unknown',
                        leagueFlag: '⚽', // DB doesn't have flag yet
                        homeTeam: row.home_team_name,
                        awayTeam: row.away_team_name,
                        homeScore: 0, // DB doesn't have live score yet
                        awayScore: 0,
                        matchStatus: 'live', // Assume live if recently received
                        minute: row.match_minute || 0,
                        predictionMinute: '0\'',
                        predictionScore: '0 - 0',
                        prediction: row.prediction_type,
                        result: 'pending',
                        isVip: true // Default to VIP for AI
                    }
                })
            }

            // 2. Load Manual
            const manualPreds = getManualPredictions()
            const manualConverted: Prediction[] = manualPreds.map((mp: ManualPrediction) => ({
                id: mp.id,
                date: mp.date,
                time: mp.time,
                botName: mp.botName,
                league: mp.league,
                leagueFlag: mp.leagueFlag,
                homeTeam: mp.homeTeam,
                awayTeam: mp.awayTeam,
                homeScore: mp.homeScore,
                awayScore: mp.awayScore,
                matchStatus: mp.matchStatus,
                minute: mp.minute,
                predictionMinute: mp.predictionMinute,
                predictionScore: mp.predictionScore,
                prediction: mp.prediction,
                result: mp.result,
                isVip: mp.isVip
            }))

            setPredictions([...manualConverted, ...dbPredictions])
        }

        fetchPredictions()
        // Auto refresh
        const interval = setInterval(fetchPredictions, 30000)

        // Listen for new manual predictions
        const handleNewPrediction = () => fetchPredictions()
        window.addEventListener('manual-prediction-added', handleNewPrediction)
        window.addEventListener('prediction-updated', handleNewPrediction)
        window.addEventListener('prediction-deleted', handleNewPrediction)
        window.addEventListener('prediction-vip-toggled', handleNewPrediction)

        return () => {
            clearInterval(interval)
            window.removeEventListener('manual-prediction-added', handleNewPrediction)
            window.removeEventListener('prediction-updated', handleNewPrediction)
            window.removeEventListener('prediction-deleted', handleNewPrediction)
            window.removeEventListener('prediction-vip-toggled', handleNewPrediction)
        }
    }, [])

    // Simulate minute updates just for visual effect
    useEffect(() => {
        const interval = setInterval(() => {
            setPredictions(prev => prev.map(p => {
                if (p.matchStatus === 'live' && p.minute < 90) {
                    return { ...p, minute: p.minute + 1 }
                }
                return p
            }))
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    // Action handlers
    const handleUpdateResult = (id: string, result: 'won' | 'lost') => {
        // Check if it's a manual prediction (starts with 'manual_')
        if (id.startsWith('manual_')) {
            updatePredictionResult(id, result)
        }
        setPredictions(prev => prev.map(p =>
            p.id === id ? { ...p, result, matchStatus: 'ft' as const } : p
        ))
    }

    const handleToggleVip = (id: string) => {
        // Check if it's a manual prediction
        if (id.startsWith('manual_')) {
            toggleVipStatus(id)
        }
        setPredictions(prev => prev.map(p =>
            p.id === id ? { ...p, isVip: !p.isVip } : p
        ))
    }

    const handleDelete = (id: string) => {
        if (confirm('Bu tahmini silmek istediğinize emin misiniz?')) {
            // Check if it's a manual prediction
            if (id.startsWith('manual_')) {
                deleteFromStore(id)
            }
            setPredictions(prev => prev.filter(p => p.id !== id))
        }
    }

    // Calculate stats
    const stats = {
        total: predictions.length,
        won: predictions.filter(p => p.result === 'won' || p.result === 'live_won').length,
        lost: predictions.filter(p => p.result === 'lost').length,
        pending: predictions.filter(p => p.result === 'pending').length,
    }
    const completedMatches = predictions.filter(p => p.matchStatus === 'ft')
    const winRate = completedMatches.length > 0
        ? Math.round((completedMatches.filter(p => p.result === 'won').length / completedMatches.length) * 100)
        : 0

    // Filter predictions
    const filteredPredictions = predictions.filter(p => {
        const matchesSearch = !searchQuery ||
            p.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.league.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesBot = selectedBot === 'Tüm Botlar' || p.botName === selectedBot

        let matchesStatus = statusFilter === 'all'
        if (statusFilter === 'won') matchesStatus = p.result === 'won' || p.result === 'live_won'
        if (statusFilter === 'lost') matchesStatus = p.result === 'lost'
        if (statusFilter === 'pending') matchesStatus = p.result === 'pending'

        return matchesSearch && matchesBot && matchesStatus
    })

    // Sort by date and time (newest first)
    const sortedPredictions = [...filteredPredictions].sort((a, b) => {
        // Parse dates (format: dd.mm.yyyy)
        const datePartsA = a.date.split('.')
        const datePartsB = b.date.split('.')
        const dateA = new Date(`${datePartsA[2]}-${datePartsA[1]}-${datePartsA[0]}T${a.time}:00`)
        const dateB = new Date(`${datePartsB[2]}-${datePartsB[1]}-${datePartsB[0]}T${b.time}:00`)
        return dateB.getTime() - dateA.getTime() // Newest first
    })

    // Pagination
    const totalPages = Math.ceil(sortedPredictions.length / ITEMS_PER_PAGE)
    const paginatedPredictions = sortedPredictions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedBot, statusFilter, dateFilter])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Tüm Tahminler</h1>
                    <p className="text-slate-500 text-sm">AI botlarından gelen tahminleri takip edin</p>
                </div>

                <div className="flex gap-2">
                    {(['today', 'yesterday', 'week', 'all'] as const).map((date) => (
                        <button
                            key={date}
                            onClick={() => setDateFilter(date)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateFilter === date
                                ? 'bg-emerald-500 text-white'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {date === 'today' ? 'Bugün' : date === 'yesterday' ? 'Dün' : date === 'week' ? 'Bu Hafta' : 'Tümü'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-2">
                        <Target size={18} className="text-white" />
                    </div>
                    <div className="text-xl font-bold text-slate-800">{stats.total}</div>
                    <div className="text-xs text-slate-500">Toplam</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-2">
                        <Clock size={18} className="text-white" />
                    </div>
                    <div className="text-xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-xs text-slate-500">Bekleyen</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-2">
                        <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <div className="text-xl font-bold text-emerald-600">{stats.won}</div>
                    <div className="text-xs text-slate-500">Kazanan</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-2">
                        <XCircle size={18} className="text-white" />
                    </div>
                    <div className="text-xl font-bold text-red-600">{stats.lost}</div>
                    <div className="text-xs text-slate-500">Kaybeden</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-2">
                        <Trophy size={18} className="text-white" />
                    </div>
                    <div className={`text-xl font-bold ${winRate >= 70 ? 'text-emerald-600' : winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{winRate}%</div>
                    <div className="text-xs text-slate-500">Win Rate</div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Takım veya lig ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                </div>

                <div className="relative">
                    <select
                        value={selectedBot}
                        onChange={(e) => setSelectedBot(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer min-w-[160px]"
                    >
                        {botOptions.map(bot => (
                            <option key={bot} value={bot}>{bot}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>

                <div className="flex gap-2">
                    {(['all', 'pending', 'won', 'lost'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {status === 'all' ? 'Tümü' : status === 'pending' ? 'Bekleyen' : status === 'won' ? 'Kazanan' : 'Kaybeden'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-[90px]">Tarih</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-[120px]">Bot Adı</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-[170px]">Lig</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-[150px]">Ev Takım</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-[90px]">Skor</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-[150px]">Deplasman</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 w-[170px]">Tahmin</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-[60px]">Tür</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-[70px]">Sonuç</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedPredictions.map((p) => (
                                <tr
                                    key={p.id}
                                    className={`hover:bg-slate-50 transition-colors ${p.result === 'live_won' ? 'bg-emerald-50' :
                                        p.matchStatus === 'live' ? 'bg-blue-50/50' :
                                            p.matchStatus === 'ht' ? 'bg-yellow-50/50' : ''
                                        }`}
                                >
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-semibold text-slate-800">{p.date}</div>
                                        <div className="text-xs text-slate-500">{p.time}</div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <span className="text-sm font-medium text-slate-700">{p.botName}</span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{p.leagueFlag}</span>
                                            <span className="text-sm text-slate-700 truncate max-w-[130px]">{p.league}</span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                                                {p.homeTeam.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800 truncate max-w-[100px]">{p.homeTeam}</span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <MatchStatusBadge status={p.matchStatus} minute={p.minute} />
                                            <span className={`text-lg font-bold ${p.result === 'live_won' ? 'text-emerald-600' :
                                                p.matchStatus === 'live' ? 'text-blue-600' :
                                                    p.matchStatus === 'ht' ? 'text-yellow-600' : 'text-slate-800'
                                                }`}>
                                                {p.homeScore} - {p.awayScore}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-xs font-bold text-purple-600 flex-shrink-0">
                                                {p.awayTeam.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800 truncate max-w-[100px]">{p.awayTeam}</span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="text-sm text-emerald-600 font-semibold">{p.prediction}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{p.predictionMinute} | {p.predictionScore}</div>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <VipBadge isVip={p.isVip} />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <ResultBadge result={p.result} matchStatus={p.matchStatus} />
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <ActionDropdown
                                            prediction={p}
                                            onUpdateResult={handleUpdateResult}
                                            onToggleVip={handleToggleVip}
                                            onDelete={handleDelete}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Toplam {sortedPredictions.length} tahmin, Sayfa {currentPage} / {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
                        >
                            <ChevronLeft size={16} />
                            Önceki
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum
                                if (totalPages <= 5) {
                                    pageNum = i + 1
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i
                                } else {
                                    pageNum = currentPage - 2 + i
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
                        >
                            Sonraki
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {paginatedPredictions.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
                    <Target size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Tahmin bulunamadı</h3>
                    <p className="text-slate-500 text-sm">Filtrelerinizi değiştirin veya yeni tahminler bekleyin</p>
                </div>
            )}
        </div>
    )
}
