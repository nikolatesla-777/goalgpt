
'use client'

import { useActionState } from 'react'
import { Save, User, CreditCard, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { updateProfile, updatePassword } from './actions'

const initialState = {
    message: null,
    error: null
}

export default function SettingsClient({ partner }: { partner: any }) {
    const [profileState, profileAction, isProfilePending] = useActionState(updateProfile, initialState as any)
    const [passwordState, passwordAction, isPasswordPending] = useActionState(updatePassword, initialState as any)

    return (
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
                <p className="text-slate-400 text-sm mt-1">Profil ve ödeme bilgilerinizi güncelleyin.</p>
            </div>

            {/* Profile & Payment Form */}
            <form action={profileAction} className="space-y-8">
                {/* Personal Info */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <User className="text-slate-400" />
                        <h2 className="text-base font-bold text-white">Kişisel Bilgiler</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Ad Soyad</label>
                            <input
                                name="full_name"
                                type="text"
                                defaultValue={partner?.profile?.full_name}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">E-posta</label>
                            <input
                                type="email"
                                defaultValue={partner?.profile?.email}
                                disabled
                                className="w-full bg-white/5 border border-transparent rounded-xl px-4 py-2.5 text-slate-400 cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                        <CreditCard className="text-slate-400" />
                        <h2 className="text-base font-bold text-white">Ödeme Bilgileri</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">Banka Adı</label>
                            <select
                                name="bank_name"
                                defaultValue={partner?.payment_info?.bank_name}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50">
                                <option value="Garanti BBVA">Garanti BBVA</option>
                                <option value="Yapı Kredi">Yapı Kredi</option>
                                <option value="İş Bankası">İş Bankası</option>
                                <option value="Ziraat Bankası">Ziraat Bankası</option>
                                <option value="Akbank">Akbank</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase">IBAN</label>
                            <input
                                name="iban"
                                type="text"
                                defaultValue={partner?.payment_info?.iban}
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Profile Feedback */}
                {profileState?.success && (
                    <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-xl text-sm border border-green-500/20">
                        <CheckCircle size={16} />
                        {profileState.success}
                    </div>
                )}
                {profileState?.error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">
                        <AlertCircle size={16} />
                        {profileState.error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isProfilePending}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProfilePending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Kaydet
                    </button>
                </div>
            </form>

            <hr className="border-white/5" />

            {/* Password Form */}
            <form action={passwordAction} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                    <Lock className="text-slate-400" />
                    <h2 className="text-base font-bold text-white">Şifre Değiştir</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Yeni Şifre</label>
                        <input name="password" type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Tekrar</label>
                        <input name="confirm" type="password" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                </div>

                {/* Password Feedback */}
                <div className="mt-4">
                    {passwordState?.success && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-xl text-sm border border-green-500/20">
                            <CheckCircle size={16} />
                            {passwordState.success}
                        </div>
                    )}
                    {passwordState?.error && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl text-sm border border-red-500/20">
                            <AlertCircle size={16} />
                            {passwordState.error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isPasswordPending}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    >
                        {isPasswordPending ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                        Şifreyi Güncelle
                    </button>
                </div>
            </form>
        </div>
    )
}
