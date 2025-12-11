'use client'

import { useState } from 'react'
import { Search, User, ChevronRight, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

const mockUsers = Array.from({ length: 15 }, (_, i) => ({
    id: `u-${i}`,
    email: `oyuncu_${i + 1}@gmail.com`,
    joinedAt: '3 gün önce',
    status: i % 4 === 0 ? 'inactive' : 'active',
    plan: i % 4 === 0 ? 'Yok' : 'Yıllık VIP',
    totalSpent: i % 4 === 0 ? 0 : Math.floor(Math.random() * 2000) + 100
}))

export default function ReferralsPage() {
    const [search, setSearch] = useState('')

    const filteredUsers = mockUsers.filter(u => u.email.includes(search))

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Referanslarım</h1>
                    <p className="text-slate-400 text-sm mt-1">Takımındaki oyuncuların detaylarını buradan yönetebilirsin.</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="E-posta ile oyuncu ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0B1121] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-700"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
                <button className="px-4 bg-[#0B1121] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all">
                    <SlidersHorizontal size={20} />
                </button>
            </div>

            {/* Users List */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-xs uppercase bg-white/5 text-slate-300">
                            <tr>
                                <th className="px-6 py-4 font-bold">Oyuncu</th>
                                <th className="px-6 py-4 font-bold">Durum</th>
                                <th className="px-6 py-4 font-bold">Paket</th>
                                <th className="px-6 py-4 font-bold">Kayıt Tarihi</th>
                                <th className="px-6 py-4 font-bold text-right">LTV (Değer)</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => window.location.href = `/partner/referrals/${user.id}`}>
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                            <User size={14} />
                                        </div>
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/10 uppercase tracking-wide">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/10 uppercase tracking-wide">
                                                Pasif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {user.plan}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {user.joinedAt}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-white">
                                        {user.totalSpent > 0 ? `₺${user.totalSpent}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
