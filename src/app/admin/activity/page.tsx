'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, ArrowLeft, ArrowUpRight, Apple, Smartphone as AndroidIcon, Filter } from 'lucide-react'
import Link from 'next/link'

// Mock Activity Data (Extended)
const generateActivities = (count: number) => {
    const actions = ['Yıllık VIP Paket', 'Aylık VIP Paket', '3 Gün Hediye', 'İptal Talebi', 'Süre Doldu', 'Kayıt Oldu', 'Giriş Yaptı']
    const types = ['purchase', 'purchase', 'trial', 'cancel', 'expire', 'register', 'login']
    const platforms = ['iOS', 'Android']

    return Array.from({ length: count }, (_, i) => {
        const typeIndex = Math.floor(Math.random() * actions.length)
        const isPurchase = types[typeIndex] === 'purchase'

        return {
            id: i + 1,
            user: `kullanici_${i + 1}@gmail.com`,
            action: actions[typeIndex],
            type: types[typeIndex],
            time: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            date: 'Bugün',
            detail: isPurchase ? 'Kredi Kartı' : 'Sistem',
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            amount: isPurchase ? `₺${Math.floor(Math.random() * 2000) + 100}` : null
        }
    })
}

const ALL_ACTIVITIES = generateActivities(50)

export default function ActivityLogPage() {
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('all')

    const filteredActivities = ALL_ACTIVITIES.filter(item => {
        if (filterType !== 'all' && item.type !== filterType) return false
        if (search && !item.user.includes(search)) return false
        return true
    })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin"
                    className="p-2 rounded-xl bg-[#0a0a0a] border border-white/10 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">İşlem Geçmişi 📋</h1>
                    <p className="text-slate-400 text-sm mt-1">Uygulama içindeki tüm hareketlerin detaylı dökümü.</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Kullanıcı e-postası ile ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
                <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl p-1">
                    {[
                        { id: 'all', label: 'Tümü' },
                        { id: 'purchase', label: 'Satış' },
                        { id: 'register', label: 'Kayıt' },
                        { id: 'cancel', label: 'İptal' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterType(tab.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === tab.id
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-0 overflow-hidden flex flex-col">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-2">SAAT</div>
                    <div className="col-span-5">KULLANICI</div>
                    <div className="col-span-3">İŞLEM</div>
                    <div className="col-span-2 text-right">TUTAR</div>
                </div>

                <div className="divide-y divide-white/5">
                    {filteredActivities.map((item) => {
                        const statusColorMap: any = {
                            purchase: 'bg-green-500/10 text-green-400 border border-green-500/20',
                            trial: 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20',
                            register: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
                            cancel: 'bg-red-500/10 text-red-400 border border-red-500/20',
                            expire: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
                            login: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
                        }
                        const badgeStyle = statusColorMap[item.type] || statusColorMap.login

                        return (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                                <div className="col-span-2 text-xs text-slate-500 font-mono">
                                    {item.time}
                                </div>
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-white/5 border border-white/10 ${item.platform === 'iOS' ? 'text-slate-300' : 'text-green-400'}`}>
                                        {item.platform === 'iOS' ? <Apple size={12} /> : <AndroidIcon size={12} />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                        {item.user}
                                    </span>
                                </div>
                                <div className="col-span-3">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}>
                                        {item.action}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right">
                                    {item.amount ? (
                                        <span className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">
                                            +{item.amount}.00
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-600">-</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}
