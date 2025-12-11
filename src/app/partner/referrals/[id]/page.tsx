'use client'

import { ArrowLeft, Mail, Calendar, CreditCard, Activity, BellRing } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function UserDetailPage() {
    const params = useParams()
    const userId = params?.id

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/partner/referrals"
                    className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">oyuncu_5@gmail.com</h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/10 uppercase tracking-wide">
                            Aktif Üye
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm">Katılım: 12 Kasım 2024</p>
                </div>

                <button className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                    <BellRing size={16} />
                    <span className="hidden sm:inline">Hatırlatma Gönder</span>
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <CreditCard size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Mevcut Paket</span>
                    </div>
                    <p className="text-2xl font-bold text-white">Yıllık VIP</p>
                    <p className="text-xs text-green-400 mt-1">12 Kasım 2025'e kadar geçerli</p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Activity size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Son Aktivite</span>
                    </div>
                    <p className="text-2xl font-bold text-white">Bugün</p>
                    <p className="text-xs text-slate-500 mt-1">14:32'de giriş yaptı</p>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <DollarSign size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Bıraktığı Kazanç</span>
                    </div>
                    <p className="text-2xl font-bold text-white">₺450.00</p>
                    <p className="text-xs text-slate-500 mt-1">Toplam 3 işlem</p>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white">İşlem Geçmişi</h2>
                </div>
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-white/5 text-slate-300">
                        <tr>
                            <th className="px-6 py-4 font-bold">Paket Adı</th>
                            <th className="px-6 py-4 font-bold">Tarih</th>
                            <th className="px-6 py-4 font-bold text-right">Tutar</th>
                            <th className="px-6 py-4 font-bold text-right">Komisyonun</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {[1, 2].map(i => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">Yıllık VIP Paket</td>
                                <td className="px-6 py-4">12 Kasım 2024</td>
                                <td className="px-6 py-4 text-right">₺2,500.00</td>
                                <td className="px-6 py-4 text-right font-bold text-green-400">+₺250.00</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function DollarSign({ size }: { size: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    )
}
