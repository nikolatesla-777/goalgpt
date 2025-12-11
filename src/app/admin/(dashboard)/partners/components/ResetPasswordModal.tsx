
'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { resetPartnerPassword } from '../actions'

interface ResetPasswordModalProps {
    userId: string
    partnerName: string
    isOpen: boolean
    onClose: () => void
}

export default function ResetPasswordModal({ userId, partnerName, isOpen, onClose }: ResetPasswordModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)
    const [password, setPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setResult(null)

        try {
            const res = await resetPartnerPassword(userId, password)
            setResult(res)
            if (res.success) setPassword('')
        } catch (e) {
            setResult({ error: 'Beklenmeyen bir hata oluştu.' })
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-white">
                        <KeyRound size={20} className="text-yellow-500" />
                        <h3 className="text-lg font-bold">Şifre Sıfırla</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
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
                                <h4 className="text-xl font-bold text-white">Şifre Değiştirildi!</h4>
                                <p className="text-slate-400 mt-2 text-sm">{partnerName} için yeni şifre ayarlandı.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {result?.error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                                    <AlertCircle size={16} />
                                    {result.error}
                                </div>
                            )}

                            <div>
                                <p className="text-slate-400 text-sm mb-4">
                                    <strong className="text-white">{partnerName}</strong> kullanıcısının şifresini değiştirmek üzeresin.
                                </p>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Yeni Şifre</label>
                                    <input
                                        required
                                        type="text"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Yeni şifreyi girin..."
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPassword(Math.random().toString(36).slice(-8) + '!')}
                                        className="text-[10px] text-yellow-500 hover:underline"
                                    >
                                        Rastgele Oluştur
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-sm font-bold transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !password}
                                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-yellow-900/20 flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
