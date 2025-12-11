
'use client'

import { Wallet, ArrowDownLeft, Clock, CheckCircle2 } from 'lucide-react'

export default function EarningsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-white">Kazançlarım</h1>
                <p className="text-slate-400 text-sm mt-1">Tüm ödeme geçmişini ve bekleyen bakiyeni buradan yönetebilirsin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-900/10 border border-green-500/20 rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Wallet size={20} />
                            <span className="font-bold text-xs uppercase tracking-wider">Çekilebilir Bakiye</span>
                        </div>
                        <p className="text-4xl font-bold text-white">₺4,250.00</p>
                    </div>
                    <div className="mt-8 flex gap-4">
                        <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-900/20 flex-1 md:flex-none">
                            Ödeme Talep Et
                        </button>
                        <p className="text-xs text-slate-400 max-w-xs self-center hidden md:block">
                            *Min. çekim tutarı ₺1,000'dir. Ödemeler her ayın 1'inde ve 15'inde işleme alınır.
                        </p>
                    </div>
                </div>

                {/* Pending Payout */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col justify-center">
                    <p className="text-slate-500 text-xs font-bold uppercase mb-2">Toplam Ödenen</p>
                    <p className="text-2xl font-bold text-white mb-6">₺18,500.00</p>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Son Ödeme:</span>
                            <span className="text-white font-bold">15 Kas 2024</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Durum:</span>
                            <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Tamamlandı</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Ödeme Geçmişi</h3>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-white/5 text-xs uppercase font-bold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">İşlem Kodu</th>
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4">Tutar</th>
                                <th className="px-6 py-4">IBAN / Hesap</th>
                                <th className="px-6 py-4 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr className="hover:bg-white/[0.02]">
                                <td className="px-6 py-4 font-mono text-xs">TRX-98231</td>
                                <td className="px-6 py-4">15 Kas 2024</td>
                                <td className="px-6 py-4 font-bold text-white">₺2,500.00</td>
                                <td className="px-6 py-4 text-xs">TR12 **** 4567</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/10">Ödendi</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/[0.02]">
                                <td className="px-6 py-4 font-mono text-xs">TRX-78214</td>
                                <td className="px-6 py-4">15 Ekim 2024</td>
                                <td className="px-6 py-4 font-bold text-white">₺3,200.00</td>
                                <td className="px-6 py-4 text-xs">TR12 **** 4567</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/10">Ödendi</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/[0.02]">
                                <td className="px-6 py-4 font-mono text-xs">TRX-66239</td>
                                <td className="px-6 py-4">15 Eylül 2024</td>
                                <td className="px-6 py-4 font-bold text-white">₺1,800.00</td>
                                <td className="px-6 py-4 text-xs">TR12 **** 4567</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/10">Ödendi</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
