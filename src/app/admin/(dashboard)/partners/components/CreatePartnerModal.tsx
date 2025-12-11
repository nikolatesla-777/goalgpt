
'use client'

import { useState, useRef } from 'react'
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { createPartner } from '../actions'

export default function CreatePartnerModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setResult(null)

        try {
            const res = await createPartner({}, formData)
            setResult(res)

            if (res.success) {
                formRef.current?.reset()
                // Optional: Close after delay or let user close
            }
        } catch (e) {
            setResult({ error: 'Beklenmeyen bir hata oluştu.' })
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
            >
                + Yeni Partner Ekle
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-lg font-bold text-white">Yeni Partner Oluştur</h3>
                    <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {result?.success ? (
                        <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                                <CheckCircle size={32} />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white">Başarılı!</h4>
                                <p className="text-slate-400 mt-2 text-sm">{result.message}</p>
                            </div>
                            <button
                                onClick={() => { setIsOpen(false); setResult(null); }}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    ) : (
                        <form ref={formRef} action={handleSubmit} className="space-y-4">
                            {result?.error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle size={16} />
                                    {result.error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Ad Soyad</label>
                                    <input required name="fullName" type="text" placeholder="Örn: Ahmet Yılmaz" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">E-posta</label>
                                    <input required name="email" type="email" placeholder="ornek@mail.com" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase">Referans Kodu (Özel)</label>
                                <input required name="refCode" type="text" placeholder="Örn: GOAL2024" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-red-500/50 uppercase" />
                                <p className="text-[10px] text-slate-500">Benzersiz olmalıdır.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Başlangıç Ligi</label>
                                    <select name="tier" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50">
                                        <option value="bronze">Bronze</option>
                                        <option value="silver">Silver</option>
                                        <option value="gold">Gold</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Komisyon (%)</label>
                                    <input name="commissionRate" type="number" defaultValue="10" min="0" max="100" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50" />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-900/20 flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {isLoading ? 'Oluşturuluyor...' : 'Partner Oluştur'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
