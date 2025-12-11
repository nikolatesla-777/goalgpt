'use client'

import { DollarSign, CheckCircle2, Clock, Calendar, Download } from 'lucide-react'

const pendingPayouts = [
    { id: 1, partner: 'Ahmet Yılmaz', amount: '₺2,500', date: '2 saat önce', status: 'pending', method: 'IBAN: TR52...' },
    { id: 2, partner: 'Can Yıldız', amount: '₺850', date: '5 saat önce', status: 'pending', method: 'Papara: 152...' },
]

const payoutHistory = [
    { id: 101, partner: 'Zeynep Çelik', amount: '₺1,200', date: '15 Kas 2024', status: 'paid' },
    { id: 102, partner: 'Mehmet Demir', amount: '₺350', date: '01 Kas 2024', status: 'paid' },
    { id: 103, partner: 'Ahmet Yılmaz', amount: '₺5,000', date: '01 Kas 2024', status: 'paid' },
]

export default function AdminFinancePage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <h1 className="text-2xl font-bold text-slate-800">Finans ve Ödemeler 💸</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-6">
                    {/* Pending Requests Card */}
                    <div className="bg-white border border-orange-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-orange-100 bg-orange-50 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <Clock size={18} className="text-orange-500" />
                                    Bekleyen Ödeme Talepleri
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Bu ödemeleri kontrol edip gönderdikten sonra "Ödendi" olarak işaretleyin.</p>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {pendingPayouts.map((req) => (
                                <div key={req.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                            ₺
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{req.amount}</h3>
                                            <p className="text-sm text-slate-600 font-medium">{req.partner}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{req.method} • {req.date}</p>
                                        </div>
                                    </div>
                                    <button className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Ödendi İşaretle
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-bold text-slate-800">Ödeme Geçmişi</h2>
                            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <Download size={14} />
                                CSV İndir
                            </button>
                        </div>
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="text-xs uppercase bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-3">Partner</th>
                                    <th className="px-6 py-3">Tutar</th>
                                    <th className="px-6 py-3">Tarih</th>
                                    <th className="px-6 py-3 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payoutHistory.map((pay) => (
                                    <tr key={pay.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{pay.partner}</td>
                                        <td className="px-6 py-4 text-slate-800 font-mono">{pay.amount}</td>
                                        <td className="px-6 py-4 flex items-center gap-2 text-slate-500">
                                            <Calendar size={14} />
                                            {pay.date}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                                                Tamamlandı
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="col-span-1 space-y-5">
                    <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl p-5">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Toplam Dağıtılan</div>
                        <div className="text-3xl font-bold text-slate-800">₺142,500</div>
                        <div className="text-xs text-slate-500 mt-2">Bu yıl partnerlere ödenen toplam komisyon tutarı.</div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm">Ödeme Kuralları</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Aylık ödemeler her ayın 5'inde işleme alınır.
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Alt limit 250 TL'dir.
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Sadece onaylı hesaplara (IBAN/Papara) ödeme yapılır.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
