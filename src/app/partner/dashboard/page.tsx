
'use client'

import {
    DollarSign,
    Users,
    TrendingUp,
    ArrowUpRight,
    Copy,
    CheckCircle2,
    ShoppingBag,
    UserPlus,
    Calendar,
    Filter,
    UserMinus
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { useState } from 'react'

const generateMockData = (type: string) => {
    return Array.from({ length: 30 }, (_, i) => ({
        name: `${i + 1} Ara`,
        value: type === 'earnings'
            ? Math.floor(Math.random() * 500) + 100
            : Math.floor(Math.random() * 20) + 1
    }))
}

const allChartData = {
    earnings: generateMockData('earnings'),
    firstSales: generateMockData('count'),
    activeUsers: generateMockData('count'),
    churnedUsers: generateMockData('count'),
    totalUsers: generateMockData('count')
}

const metricConfig = {
    earnings: { label: 'Biriken Kazanç', color: '#10b981', prefix: '₺' },
    firstSales: { label: 'First Satış', color: '#a855f7', prefix: '' },
    activeUsers: { label: 'Aktif Üye', color: '#3b82f6', prefix: '' },
    churnedUsers: { label: 'Pasif Üye', color: '#ef4444', prefix: '' },
    totalUsers: { label: 'Toplam Üye', color: '#f97316', prefix: '' },
}

export default function PartnerDashboard() {
    const [copied, setCopied] = useState(false)
    const [dateRange, setDateRange] = useState('bugun')
    const [selectedMetric, setSelectedMetric] = useState<keyof typeof allChartData>('earnings')

    const copyCode = () => {
        navigator.clipboard.writeText('AHMET2024')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Calculate next payout cutoff (1st of next month)
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const cutoffDate = nextMonth.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

    const currentMetric = metricConfig[selectedMetric]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Welcome & Filtering */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Genel Bakış</h1>
                    <p className="text-slate-400 text-sm mt-1">Hoşgeldin Ahmet, günlük satış ivmeni buradan takip edebilirsin. 🚀</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-slate-900 border border-white/10 p-1.5 rounded-xl">
                        <div className="p-2 text-slate-400">
                            <Calendar size={16} />
                        </div>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent text-sm font-medium text-white outline-none border-none pr-2 cursor-pointer"
                        >
                            <option value="bugun">Bugün</option>
                            <option value="bu-hafta">Bu Hafta</option>
                            <option value="bu-ay">Bu Ay</option>
                            <option value="gecen-ay">Geçen Ay</option>
                            <option value="tum-zamanlar">Tüm Zamanlar</option>
                        </select>
                    </div>

                    {/* Ref Code Box */}
                    <div className="flex items-center gap-3 bg-slate-900 border border-blue-500/20 p-1.5 pl-4 rounded-xl shadow-lg shadow-blue-500/5">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Referans Kodun</span>
                            <span className="text-sm font-mono font-bold text-blue-400">AHMET2024</span>
                        </div>
                        <button
                            onClick={copyCode}
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                        >
                            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payout Info Alert */}
            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-xl p-4 flex items-start sm:items-center gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shrink-0">
                    <DollarSign size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">Sıradaki Ödeme Dönemi</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Hesap kesim tarihi <span className="text-white font-bold">{cutoffDate}</span>'dir. Biriken bakiyeniz bu tarihte cüzdanınıza aktarılacaktır.
                    </p>
                </div>
                <div className="hidden sm:block text-right">
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Aktarılacak Tutar</span>
                    <p className="text-xl font-bold text-white">₺4,250.00</p>
                </div>
            </div>

            {/* Stats Grid (5 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Card 1: Toplam Kazanç (Accumulating) */}
                <div
                    onClick={() => setSelectedMetric('earnings')}
                    className={`bg-slate-900/50 border rounded-2xl p-6 relative overflow-hidden group transition-all cursor-pointer hover:bg-slate-900/80 ${selectedMetric === 'earnings' ? 'border-green-500/50 shadow-lg shadow-green-500/10' : 'border-white/5 hover:border-green-500/30'}`}
                >
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <DollarSign size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Biriken Kazanç</span>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-bold text-white">₺12,450</span>
                        <span className="text-green-400 text-[10px] font-bold flex items-center mb-1.5 bg-green-500/10 px-1.5 py-0.5 rounded">
                            <ArrowUpRight size={10} className="mr-0.5" />
                            +15%
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Bu ayki toplam komisyon</p>
                </div>

                {/* Card 2: First Satış (Newly acquired customers making purchase) */}
                <div
                    onClick={() => setSelectedMetric('firstSales')}
                    className={`bg-slate-900/50 border rounded-2xl p-6 relative overflow-hidden group transition-all cursor-pointer hover:bg-slate-900/80 ${selectedMetric === 'firstSales' ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-white/5 hover:border-purple-500/30'}`}
                >
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <ShoppingBag size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">First Satış</span>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-bold text-white">84</span>
                        <span className="text-green-400 text-[10px] font-bold flex items-center mb-1.5 bg-green-500/10 px-1.5 py-0.5 rounded">
                            <ArrowUpRight size={10} className="mr-0.5" />
                            +12
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Bu tarihte ilk kez paket alan kişi sayısı</p>
                </div>

                {/* Card 3: Aktif Üye */}
                <div
                    onClick={() => setSelectedMetric('activeUsers')}
                    className={`bg-slate-900/50 border rounded-2xl p-6 relative overflow-hidden group transition-all cursor-pointer hover:bg-slate-900/80 ${selectedMetric === 'activeUsers' ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/5 hover:border-blue-500/30'}`}
                >
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <CheckCircle2 size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Aktif Üye</span>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-bold text-white">142</span>
                        <span className="text-blue-400 text-[10px] font-bold flex items-center mb-1.5 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Aboneliği Süren
                        </span>
                    </div>
                </div>

                {/* Card 4: Pasif Üye (Churned) - NEW */}
                <div
                    onClick={() => setSelectedMetric('churnedUsers')}
                    className={`bg-slate-900/50 border rounded-2xl p-6 relative overflow-hidden group transition-all cursor-pointer hover:bg-slate-900/80 ${selectedMetric === 'churnedUsers' ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-white/5 hover:border-red-500/30'}`}
                >
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                            <UserMinus size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Pasif Üye</span>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-bold text-white">23</span>
                        <span className="text-red-400 text-[10px] font-bold flex items-center mb-1.5 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <ArrowUpRight size={10} className="mr-0.5" />
                            +5
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2">Paketini yenilemeyen eski üyeler</p>
                </div>

                {/* Card 5: Toplam Üye (Registered via ref) */}
                <div
                    onClick={() => setSelectedMetric('totalUsers')}
                    className={`bg-slate-900/50 border rounded-2xl p-6 relative overflow-hidden group transition-all cursor-pointer hover:bg-slate-900/80 ${selectedMetric === 'totalUsers' ? 'border-orange-500/50 shadow-lg shadow-orange-500/10' : 'border-white/5 hover:border-orange-500/30'}`}
                >
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                            <UserPlus size={18} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Toplam Üye</span>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-bold text-white">856</span>
                        <span className="text-slate-500 text-[10px] font-bold flex items-center mb-1.5">
                            Kayıtlı
                        </span>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-bold text-white">Son 30 Günlük Hareket</h2>
                        <p className="text-sm text-slate-400">
                            <span className="text-white font-bold">{currentMetric.label}</span> verileri gösteriliyor.
                        </p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={allChartData[selectedMetric]}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#475569"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                interval={4}
                            />
                            <YAxis
                                stroke="#475569"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${currentMetric.prefix}${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: currentMetric.color }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={currentMetric.color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">Son İşlemler</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs uppercase bg-white/5 text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-bold">Kullanıcı</th>
                                <th className="px-6 py-4 font-bold">İşlem</th>
                                <th className="px-6 py-4 font-bold">Tarih</th>
                                <th className="px-6 py-4 font-bold text-right">Kazanç</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">kullanici_{i}@gmail.com</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/10">
                                            Yıllık VIP Paket
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">2 saat önce</td>
                                    <td className="px-6 py-4 text-right font-bold text-white">+₺150.00</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
