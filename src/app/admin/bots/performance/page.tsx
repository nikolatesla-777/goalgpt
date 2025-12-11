'use client'

import { useState } from 'react'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    Zap,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react'

// Mock data for performance - will be replaced with real data
const performanceData = [
    { bot: 'ALERT: D', predictions: 3078, wins: 2247, winRate: 73.0, trend: 2.3, color: '#10B981' },
    { bot: 'Alert Code: 2', predictions: 1338, wins: 968, winRate: 72.3, trend: -1.2, color: '#6366F1' },
    { bot: 'AlertCode: 17', predictions: 304, wins: 232, winRate: 76.6, trend: 4.1, color: '#EC4899' },
    { bot: 'AlertCode: 31', predictions: 428, wins: 282, winRate: 66.8, trend: -0.5, color: '#F59E0B' },
    { bot: 'Alert System', predictions: 156, wins: 112, winRate: 71.8, trend: 1.8, color: '#14B8A6' },
    { bot: '61B- MS 3.5 ÜST', predictions: 321, wins: 223, winRate: 69.8, trend: 0.3, color: '#EF4444' },
]

// Stats Card
function StatsCard({ icon: Icon, label, value, color, change }: {
    icon: any
    label: string
    value: string | number
    color: string
    change?: number
}) {
    return (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                </div>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-slate-500">{label}</div>
        </div>
    )
}

// Performance Row
function PerformanceRow({ data, rank }: { data: typeof performanceData[0], rank: number }) {
    const isPositive = data.trend >= 0

    return (
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                            rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-white/5 text-slate-500'
                    }`}>
                    {rank}
                </div>

                {/* Bot Badge */}
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: data.color }}
                >
                    {data.bot.charAt(0)}
                </div>

                {/* Bot Name */}
                <div className="flex-1">
                    <div className="font-medium text-white">{data.bot}</div>
                    <div className="text-xs text-slate-500">{data.predictions} tahmin</div>
                </div>

                {/* Wins */}
                <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{data.wins}</div>
                    <div className="text-xs text-slate-500">Kazanan</div>
                </div>

                {/* Win Rate */}
                <div className="w-32">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Win Rate</span>
                        <span className={`font-bold ${data.winRate >= 70 ? 'text-green-400' : data.winRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {data.winRate}%
                        </span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${data.winRate >= 70 ? 'bg-green-500' : data.winRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${data.winRate}%` }}
                        />
                    </div>
                </div>

                {/* Trend */}
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPositive ? '+' : ''}{data.trend}%
                </div>
            </div>
        </div>
    )
}

export default function BotPerformancePage() {
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')

    // Calculate totals
    const totals = performanceData.reduce((acc, bot) => ({
        predictions: acc.predictions + bot.predictions,
        wins: acc.wins + bot.wins
    }), { predictions: 0, wins: 0 })

    const avgWinRate = Math.round((totals.wins / totals.predictions) * 100 * 10) / 10

    // Sort by win rate
    const sortedData = [...performanceData].sort((a, b) => b.winRate - a.winRate)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bot Performansı</h1>
                    <p className="text-slate-400">Tüm botların performans analizi</p>
                </div>

                {/* Time Range */}
                <div className="flex gap-2">
                    {(['week', 'month', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {range === 'week' ? 'Bu Hafta' : range === 'month' ? 'Bu Ay' : 'Tüm Zamanlar'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    icon={Target}
                    label="Toplam Tahmin"
                    value={totals.predictions.toLocaleString()}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard
                    icon={Award}
                    label="Kazanan Tahmin"
                    value={totals.wins.toLocaleString()}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                    change={2.4}
                />
                <StatsCard
                    icon={BarChart3}
                    label="Ortalama Win Rate"
                    value={`${avgWinRate}%`}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                    change={1.2}
                />
                <StatsCard
                    icon={Zap}
                    label="Aktif Bot"
                    value={performanceData.length}
                    color="bg-gradient-to-br from-orange-500 to-orange-600"
                />
            </div>

            {/* Leaderboard */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Award size={20} className="text-yellow-400" />
                    Performans Sıralaması
                </h2>

                <div className="space-y-3">
                    {sortedData.map((bot, index) => (
                        <PerformanceRow key={bot.bot} data={bot} rank={index + 1} />
                    ))}
                </div>
            </div>
        </div>
    )
}
