'use client'

import { Trophy, Star, Shield, Crown, Check, ChevronRight, Lock } from 'lucide-react'

const tiers = [
    {
        id: 'bronze',
        name: 'Bronz Partner',
        commission: '%10',
        minSales: 0,
        color: 'text-orange-400',
        border: 'border-orange-400/20',
        shadow: 'shadow-orange-400/5',
        gradient: 'from-orange-500/20 to-orange-900/5',
        icon: Shield,
        benefits: ['Aylık Ödeme', '7/24 Destek', 'Reklam Görselleri']
    },
    {
        id: 'silver',
        name: 'Gümüş Partner',
        commission: '%15',
        minSales: 50,
        color: 'text-slate-300',
        border: 'border-slate-300/20',
        shadow: 'shadow-slate-300/5',
        gradient: 'from-slate-400/20 to-slate-800/5',
        icon: Star,
        benefits: ['Aylık Ödeme', '7/24 Destek', 'Reklam Görselleri']
    },
    {
        id: 'gold',
        name: 'Altın Partner',
        commission: '%20',
        minSales: 200,
        color: 'text-yellow-400',
        border: 'border-yellow-400/20',
        shadow: 'shadow-yellow-400/5',
        gradient: 'from-yellow-500/20 to-yellow-900/5',
        icon: Crown,
        benefits: ['Aylık Ödeme', '7/24 Destek', 'Reklam Görselleri', 'Alt Bayilik Yetkisi']
    }
]

export default function TierSystemPage() {
    const currentSales = 242 // Updated to Gold level
    const nextTarget = 500 // Arbitrary higher target for Gold or just show completed
    const progress = 100 // Maxed out for Gold demo

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-900/40 via-slate-900/60 to-slate-900 border border-yellow-500/20 p-8 md:p-12">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <Trophy size={14} />
                            Performans Ligi
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                            Tebrikler, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200">Zirvedesin!</span> 👑
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed mb-2">
                            Harika bir performans! Şu an <strong>Altın Partner</strong> seviyesindesin ve maksimum komisyon oranına sahipsin.
                        </p>
                        <p className="text-xs text-slate-500 italic">
                            *Bu baremler her ayın 1'inde sıfırlanır. O ay içerisindeki tekil satış performansına göre ligin belirlenir.
                        </p>

                        {/* Progress Bar Large */}
                        <div className="mt-8 bg-slate-900/50 p-1 rounded-full border border-white/10">
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full transition-all duration-1000 ease-out relative"
                                    style={{ width: `100%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            <span>Gümüş (50)</span>
                            <span className="text-yellow-400">Şu an: {currentSales} Satış</span>
                            <span>Altın (200+)</span>
                        </div>
                    </div>

                    {/* Current Tier Badge */}
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full" />
                        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-yellow-500/20 p-6 rounded-2xl text-center w-48 shadow-2xl">
                            <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-3 border border-yellow-500/20">
                                <Crown size={32} className="text-yellow-400" />
                            </div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mevcut Ligin</div>
                            <div className="text-xl font-bold text-white mb-1">Altın Partner</div>
                            <div className="text-sm font-bold text-yellow-400">%20 Komisyon</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tiers.map((tier) => {
                    const isCurrent = tier.id === 'gold' // Demo is Gold
                    // const isLocked = tier.minSales > currentSales // Not needed for Gold view logic much

                    return (
                        <div
                            key={tier.id}
                            className={`
                        relative overflow-hidden rounded-2xl border p-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                        ${isCurrent ? 'bg-gradient-to-b from-white/10 to-transparent border-white/10' : 'bg-slate-900/40 border-white/5'}
                        ${tier.shadow}
                    `}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                            <div className="relative bg-slate-900/80 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-3 rounded-xl bg-white/5 ${tier.color} border border-white/5`}>
                                        <tier.icon size={24} />
                                    </div>
                                    {isCurrent && (
                                        <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                            Aktif
                                        </span>
                                    )}
                                </div>

                                {/* Title & Commision */}
                                <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                                <div className="flex items-baseline gap-2 mb-6">
                                    <span className={`text-3xl font-bold ${tier.color}`}>{tier.commission}</span>
                                    <span className="text-sm text-slate-400">Komisyon</span>
                                </div>

                                {/* Benefits List */}
                                <div className="space-y-3 mb-8 flex-1">
                                    {tier.benefits.map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-green-500/10 text-green-400`}>
                                                <Check size={10} />
                                            </div>
                                            <span>{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Status */}
                                <div className={`mt-auto pt-6 border-t border-white/5 text-center text-xs font-bold uppercase tracking-wider ${tier.color}`}>
                                    {isCurrent
                                        ? 'Şu an buradasın'
                                        : 'Tamamlandı'
                                    }
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}
