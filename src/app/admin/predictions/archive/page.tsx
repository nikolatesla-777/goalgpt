'use client'

import { useState } from 'react'
import {
    Archive,
    Search,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Download,
    Bot,
    TrendingUp
} from 'lucide-react'

// Mock archive data
const archiveData = [
    { date: '2024-12-09', total: 145, won: 98, lost: 47, winRate: 67.6 },
    { date: '2024-12-08', total: 132, won: 89, lost: 43, winRate: 67.4 },
    { date: '2024-12-07', total: 167, won: 118, lost: 49, winRate: 70.7 },
    { date: '2024-12-06', total: 98, won: 72, lost: 26, winRate: 73.5 },
    { date: '2024-12-05', total: 156, won: 101, lost: 55, winRate: 64.7 },
    { date: '2024-12-04', total: 189, won: 134, lost: 55, winRate: 70.9 },
    { date: '2024-12-03', total: 112, won: 78, lost: 34, winRate: 69.6 },
]

// Archive Row
function ArchiveRow({ data }: { data: typeof archiveData[0] }) {
    const date = new Date(data.date).toLocaleDateString('tr-TR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    })

    const winRateColor = data.winRate >= 70 ? 'text-green-400' : data.winRate >= 60 ? 'text-yellow-400' : 'text-red-400'
    const winRateBg = data.winRate >= 70 ? 'bg-green-500' : data.winRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'

    return (
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-6">
                {/* Date */}
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Calendar size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <div className="font-medium text-white">{date}</div>
                        <div className="text-sm text-slate-500">{data.total} tahmin</div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="flex items-center gap-1 text-lg font-bold text-green-400">
                            <CheckCircle2 size={18} />
                            {data.won}
                        </div>
                        <div className="text-xs text-slate-500">Kazanan</div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center gap-1 text-lg font-bold text-red-400">
                            <XCircle size={18} />
                            {data.lost}
                        </div>
                        <div className="text-xs text-slate-500">Kaybeden</div>
                    </div>
                </div>

                {/* Win Rate */}
                <div className="w-40">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Win Rate</span>
                        <span className={`font-bold ${winRateColor}`}>{data.winRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${winRateBg}`}
                            style={{ width: `${data.winRate}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-all">
                    <Download size={16} />
                    İndir
                </button>
            </div>
        </div>
    )
}

export default function PredictionArchivePage() {
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week')

    // Calculate totals
    const totals = archiveData.reduce((acc, day) => ({
        total: acc.total + day.total,
        won: acc.won + day.won,
        lost: acc.lost + day.lost
    }), { total: 0, won: 0, lost: 0 })

    const avgWinRate = Math.round((totals.won / totals.total) * 100 * 10) / 10

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tahmin Arşivi</h1>
                    <p className="text-slate-400">Geçmiş tahminlerin performans özeti</p>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                    {(['week', 'month', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === range
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {range === 'week' ? 'Bu Hafta' : range === 'month' ? 'Bu Ay' : 'Tüm Zamanlar'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Archive size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{totals.total.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Toplam Tahmin</div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-green-400 mb-1">{totals.won.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Kazanan</div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                            <XCircle size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-400 mb-1">{totals.lost.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Kaybeden</div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${avgWinRate >= 70 ? 'text-green-400' : avgWinRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {avgWinRate}%
                    </div>
                    <div className="text-xs text-slate-500">Ortalama Win Rate</div>
                </div>
            </div>

            {/* Archive List */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Günlük Özet</h2>
                <div className="space-y-3">
                    {archiveData.map((day) => (
                        <ArchiveRow key={day.date} data={day} />
                    ))}
                </div>
            </div>
        </div>
    )
}
