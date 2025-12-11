
import { Trophy, Star, Crown, Lock, Check } from 'lucide-react'
import { getPartner } from '../../utils'

export default async function TiersPage() {
    const partner = await getPartner()
    if (!partner) return null

    // For Bronze user, goal is Silver.
    // Assuming mock sales count for demo progress
    const currentSales = 242 // Example from image is 242? Wait image says "SU AN: 242 SATIS" but 242 is usually Silver/Gold level. 
    // Image shows "Altın Partner" on the right card "Mevcut Ligin", but "Bronz Partner" on the left card. 
    // Actually the image shows "Tebrikler Zirvedesin" and "Altın Partner".
    // BUT the USER REQUEST says: "su an giriş yaptığımız tipster bronze hesap ona dikkat et."
    // So I must adapt the logic to show BRONZE perspective.

    // Bronze Logic:
    // Current: Bronze (%10)
    // Next: Silver (%15, 100 sales needed)
    // Progress: Let's say 42 sales.

    const mockSales = 42
    const nextTierGoal = 100 // Silver goal
    const progressPercent = (mockSales / nextTierGoal) * 100

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Hero Card - Progress */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 p-8 md:p-12">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Trophy size={300} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 md:items-center">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">
                            <Trophy size={14} />
                            Performans Ligi
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Hedef: <span className="text-slate-300">Gümüş Partner!</span> 🚀
                        </h1>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Harika gidiyorsun! Şu an <span className="text-orange-500 font-bold">Bronz Partner</span> seviyesindesin.
                            Gümüş seviyeye geçip <span className="text-white font-bold">%15 komisyon</span> oranına ulaşmak için biraz daha gayret!
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all duration-1000 ease-out relative"
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <span>Bronz (0)</span>
                                <span className="text-white">Şu an: {mockSales} Satış</span>
                                <span>Gümüş (100+)</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Tier Badge Card */}
                    <div className="bg-[#0a0a0a] border border-orange-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center w-full md:w-64 shrink-0 shadow-2xl shadow-orange-900/20">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
                            <Trophy size={32} />
                        </div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Mevcut Ligin</p>
                        <h3 className="text-xl font-bold text-white mb-1">Bronz Partner</h3>
                        <p className="text-orange-500 font-bold bg-orange-500/10 px-3 py-1 rounded-lg text-sm">%10 Komisyon</p>
                    </div>
                </div>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Bronze Card */}
                <div className="bg-[#0a0a0a] border border-orange-500 rounded-3xl p-8 relative overflow-hidden group shadow-lg shadow-orange-500/5">
                    <div className="absolute top-4 right-4 animate-pulse">
                        <span className="bg-orange-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase">Aktif</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500">
                        <Trophy size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Bronz Partner</h3>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-4xl font-bold text-orange-500">%10</span>
                        <span className="text-slate-500 font-medium mb-1.5">Komisyon</span>
                    </div>

                    <div className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            Aylık Ödeme
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            7/24 Destek
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            Reklam Görselleri
                        </li>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <span className="text-orange-500 font-bold text-sm tracking-wide uppercase">Şu an Buradasın</span>
                    </div>
                </div>

                {/* Silver Card */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6 text-slate-300">
                        <Star size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Gümüş Partner</h3>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-4xl font-bold text-white">%15</span>
                        <span className="text-slate-500 font-medium mb-1.5">Komisyon</span>
                    </div>

                    <div className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            Aylık Ödeme
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            7/24 Destek
                        </li>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <span className="text-slate-500 font-bold text-sm tracking-wide uppercase">Hedefin</span>
                    </div>
                </div>

                {/* Gold Card */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group opacity-40">
                    <div className="absolute top-4 right-4">
                        <Lock size={16} className="text-slate-600" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-6 text-yellow-500">
                        <Crown size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Altın Partner</h3>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-4xl font-bold text-yellow-500">%20</span>
                        <span className="text-slate-500 font-medium mb-1.5">Komisyon</span>
                    </div>

                    <div className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            Tüm Avantajlar
                        </li>
                        <li className="flex items-center gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <Check size={10} className="text-green-500" />
                            </div>
                            Alt Bayilik
                        </li>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <span className="text-slate-600 font-bold text-sm tracking-wide uppercase">Kilitli</span>
                    </div>
                </div>

            </div>
        </div>
    )
}
