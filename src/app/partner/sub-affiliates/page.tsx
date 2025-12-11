'use client'

import { useState } from 'react'
import { Share2, Copy, CheckCircle2, Users, TrendingUp } from 'lucide-react'

const subPartners = [
    { id: 1, name: 'mehmet_k@gmail.com', sales: 45, earnings: '₺4,500', yourCut: '₺225' },
    { id: 2, name: 'ayse_y@hotmail.com', sales: 12, earnings: '₺1,200', yourCut: '₺60' },
    { id: 3, name: 'can_b@outlook.com', sales: 8, earnings: '₺800', yourCut: '₺40' },
]

export default function SubAffiliatesPage() {
    const [copied, setCopied] = useState(false)

    const copyLink = () => {
        navigator.clipboard.writeText('goalgpt.com/partner/join?ref=AHMET2024')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header & Invite Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Alt Bayilik Sistemi 🕸️</h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Kendi ekibini kur, pasif gelir elde et. Davet ettiğin her yeni partnerin satışlarından <span className="text-white font-bold">%5 komisyon</span> kazan.
                    </p>
                </div>

                <div className="bg-gradient-to-r from-indigo-900/40 to-blue-900/40 border border-indigo-500/20 rounded-2xl p-6">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">Davet Linkin</label>
                    <div className="flex gap-2">
                        <code className="flex-1 bg-black/30 rounded-lg px-4 py-3 text-sm text-slate-300 font-mono truncate border border-white/5">
                            goalgpt.com/partner/join?ref=AHMET2024
                        </code>
                        <button
                            onClick={copyLink}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg font-bold transition-colors flex items-center justify-center min-w-[100px]"
                        >
                            {copied ? <div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>Kopyalandı</span></div> : <span>Kopyala</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Network Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Toplam Alt Bayi</div>
                    <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        <Users size={20} className="text-indigo-400" />
                        3
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl text-center">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Ekip Hacmi</div>
                    <div className="text-2xl font-bold text-white">₺6,500</div>
                </div>
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl text-center border-b-2 border-b-green-500">
                    <div className="text-green-400 text-xs font-bold uppercase mb-1">Senin Kazancın (Net)</div>
                    <div className="text-2xl font-bold text-white">+₺325</div>
                </div>
            </div>

            {/* Network List */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Ekibim</h2>
                    <Share2 className="text-slate-600" size={20} />
                </div>
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-white/5 text-slate-300">
                        <tr>
                            <th className="px-6 py-4 font-bold">Partner Adı</th>
                            <th className="px-6 py-4 font-bold">Toplam Satış</th>
                            <th className="px-6 py-4 font-bold">Ciro</th>
                            <th className="px-6 py-4 font-bold text-right text-green-400">Payın (%5)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {subPartners.map((p) => (
                            <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{p.name}</td>
                                <td className="px-6 py-4">{p.sales} Adet</td>
                                <td className="px-6 py-4 text-white">{p.earnings}</td>
                                <td className="px-6 py-4 text-right font-bold text-green-400">+{p.yourCut}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
