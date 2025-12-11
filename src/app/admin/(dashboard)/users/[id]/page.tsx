'use client'

import {
    ArrowLeft,
    Smartphone,
    CreditCard,
    Calendar,
    Clock,
    Shield,
    History,
    Ban,
    Gift,
    RefreshCcw,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function AdminUserDetailPage() {
    const params = useParams()

    // Mock detailed user data
    const user = {
        id: 'u_123456789',
        email: 'premium_user@gmail.com',
        name: 'Ahmet Yılmaz', // Optional
        platform: 'iOS (iPhone 14 Pro)',
        ip: '192.168.1.1 (Turkey)',
        joined: '12 Kas 2024',
        lastActive: '10 dakika önce',
        ltv: '₺1,250',
        status: 'active',
        plan: {
            name: 'Yıllık VIP Paket',
            price: '₺1,250 / Yıl',
            renewal: '12 Kas 2025',
            autoRenew: true,
            store: 'App Store'
        },
        history: [
            { type: 'renew', msg: 'Yıllık VIP Paket yenilendi.', date: '12 Kas 2024', amount: '₺1,250' },
            { type: 'convert', msg: 'Deneme sürümü bitti, ödeme alındı.', date: '12 Kas 2024', amount: '₺1,250' },
            { type: 'trial', msg: '7 Günlük Deneme Başlatıldı', date: '05 Kas 2024', amount: '₺0' },
            { type: 'install', msg: 'Uygulama yüklendi (v2.1.0)', date: '05 Kas 2024', amount: '-' },
        ]
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/users"
                        className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {user.email}
                            <span className="px-2 py-0.5 rounded textxs font-bold bg-green-500/10 text-green-500 border border-green-500/20 text-sm uppercase">Aktif Abone</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-mono mt-1">ID: {user.id}</p>
                    </div>
                </div>

                {/* Action Buttons (God Mode) */}
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-600/20 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <Gift size={16} />
                        Hediye Paket Ver
                    </button>
                    <button className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                        <Ban size={16} />
                        Kullanıcıyı Yasakla
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Subscription & Stats */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Subscription Card */}
                    <div className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-green-500">
                            <Shield size={120} />
                        </div>

                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <CreditCard size={20} className="text-green-500" />
                            Abonelik Detayları
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Mevcut Plan</p>
                                    <p className="text-2xl font-bold text-white">{user.plan.name}</p>
                                    <p className="text-sm text-slate-400">{user.plan.price}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-2">
                                        <Smartphone size={12} /> {user.plan.store}
                                    </span>
                                    {user.plan.autoRenew && (
                                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 flex items-center gap-2">
                                            <RefreshCcw size={12} /> Oto-Yenileme Açık
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Gelecek Yenileme</span>
                                        <span className="text-xs font-bold text-green-500">340 Gün Kaldı</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">{user.plan.renewal}</p>
                                </div>
                                <button className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <XCircle size={16} />
                                    Aboneliği İptal Et (Refund)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Device & Usage Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <StatBox label="Toplam Harcama (LTV)" value={user.ltv} icon={CreditCard} color="text-green-500" />
                        <StatBox label="Son Görülme" value={user.lastActive} icon={Clock} color="text-blue-500" />
                        <StatBox label="Platform" value={user.platform} icon={Smartphone} color="text-purple-500" />
                    </div>

                </div>

                {/* Right Column: Timeline */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-fit">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <History size={20} className="text-slate-400" />
                        İşlem Geçmişi
                    </h2>
                    <div className="relative border-l border-white/10 ml-3 space-y-8 pb-4">
                        {user.history.map((event, i) => (
                            <div key={i} className="relative pl-8">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#0a0a0a] ${event.type === 'renew' || event.type === 'convert' ? 'bg-green-500' :
                                        event.type === 'trial' ? 'bg-blue-500' : 'bg-slate-600'
                                    }`} />

                                <div>
                                    <p className="text-sm font-medium text-white">{event.msg}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-slate-500">{event.date}</span>
                                        {event.amount !== '-' && (
                                            <span className={`text-xs font-bold ${event.amount === '₺0' ? 'text-slate-500' : 'text-green-500'}`}>
                                                {event.amount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

function StatBox({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <Icon size={20} className={`${color} mb-3`} />
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">{label}</p>
            <p className="text-lg font-bold text-white truncate" title={value}>{value}</p>
        </div>
    )
}
