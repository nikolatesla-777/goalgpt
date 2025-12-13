'use client'

import { useState, useEffect } from 'react'
import {
    Cpu,
    Signal,
    Trophy,
    MoreVertical,
    Zap,
    Activity,
    Search,
    RefreshCw,
    Plus,
    Bot,
    MinusCircle
} from 'lucide-react'
import Link from 'next/link'

interface BotGroup {
    id: string
    name: string
    display_name: string
    description?: string
    is_active: boolean
    total_predictions: number
    winning_predictions: number
    win_rate: number
    color?: string
}

export default function BotsPage() {
    const [bots, setBots] = useState<BotGroup[]>([])
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

    const fetchBots = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/bots')
            const data = await res.json()
            if (data.bots) {
                setBots(data.bots)
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch bots:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBots()
    }, [])

    const filteredBots = bots.filter(bot => {
        if (filter === 'active') return bot.is_active
        if (filter === 'inactive') return !bot.is_active
        return true
    })

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto p-2">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Bot size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bot Yönetimi</h1>
                            <p className="text-slate-500 text-sm font-medium">
                                AI tahmin botlarını yönetin ve performanslarını takip edin ({bots.length} Bot)
                            </p>
                        </div>
                    </div>
                </div>
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all">
                    <Plus size={18} />
                    Yeni Bot Ekle
                </button>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatsCard label="Toplam Bot" value={stats.totalBots} subValue={`${stats.activeBots} aktif`} icon={Cpu} color="violet" />
                    <StatsCard label="Toplam Tahmin" value={stats.totalPredictions} icon={Signal} color="blue" />
                    <StatsCard label="Ortalama Win Rate" value={`%${stats.avgWinRate}`} subValue="Canlı Veri" icon={Trophy} color="amber" />
                    <StatsCard label="Aktif Botlar" value={stats.activeBots} subValue={`${stats.totalBots - stats.activeBots} devre dışı`} icon={Zap} color="rose" />
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Bot ara..."
                        className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
                <div className="flex gap-2">
                    <FilterButton label="Tümü" active={filter === 'all'} onClick={() => setFilter('all')} />
                    <FilterButton label="Aktif" active={filter === 'active'} onClick={() => setFilter('active')} />
                    <FilterButton label="Pasif" active={filter === 'inactive'} onClick={() => setFilter('inactive')} />
                    <button onClick={fetchBots} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg ml-2">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Bot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBots.map(bot => (
                    <BotCard key={bot.id} bot={bot} />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            )}
        </div>
    )
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function StatsCard({ label, value, subValue, icon: Icon, color }: any) {
    const styles: any = {
        violet: 'text-violet-600 bg-violet-50',
        blue: 'text-blue-600 bg-blue-50',
        amber: 'text-amber-600 bg-amber-50',
        rose: 'text-emerald-600 bg-emerald-50'
    }
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${styles[color]} flex items-center justify-center mb-3`}>
                <Icon size={20} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            {subValue && <p className="text-[10px] text-slate-400 mt-1">{subValue}</p>}
        </div>
    )
}

function FilterButton({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
            {label}
        </button>
    )
}

function BotCard({ bot }: { bot: BotGroup }) {
    const isAlert = bot.display_name.includes('Alert') || bot.display_name.includes('ALERT')

    return (
        <Link href={`/admin/bots/${bot.id}`} className="block group">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group-hover:border-indigo-300">
                <div className={`h-1.5 w-full bg-gradient-to-r ${isAlert ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-purple-500'}`}></div>

                <div className="p-5">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${isAlert ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                {bot.display_name.substring(0, 1)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {bot.display_name}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
                                    {bot.description || 'AI Analiz Botu'}
                                </p>
                            </div>
                        </div>
                        <button className="text-slate-300 hover:text-slate-600 p-1">
                            <MoreVertical size={18} />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Tahmin</span>
                            <div className="text-lg font-bold text-slate-800">{bot.total_predictions}</div>
                        </div>
                        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                            <span className="text-[10px] uppercase font-bold text-emerald-600/70">Başarı</span>
                            <div className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                                %{bot.win_rate}
                                <Activity size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Progress & Footer */}
                    <div className="space-y-3">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isAlert ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${bot.win_rate}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1.5 ${bot.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                {bot.is_active ? <Activity size={10} /> : <MinusCircle size={10} />}
                                {bot.is_active ? 'Yayında' : 'Pasif'}
                            </div>

                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1.5`}>
                                <Zap size={10} />
                                Detay
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
