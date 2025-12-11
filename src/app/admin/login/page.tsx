'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAdmin } from './actions'
import { Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react'

// Submit Button Component
function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? <Loader2 className="animate-spin" /> : (
                <>
                    Panel Girişi
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
    )
}

export default function AdminLoginPage() {
    const [state, formAction] = useActionState(loginAdmin, null)
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[#0a0a0a]">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 -right-4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl relative backdrop-blur-xl">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-emerald-900/30">
                        <span className="text-3xl font-black text-white">G</span>
                    </div>
                    <div className="flex justify-center items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-white">GoalGPT Admin</h1>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PRO</span>
                    </div>
                    <p className="text-slate-400 text-sm">Yönetim paneline erişmek için kimliğinizi doğrulayın.</p>
                </div>

                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium flex items-center justify-center gap-2">
                            <ShieldCheck size={16} />
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Yönetici E-posta</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="admin@goalgpt.pro"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Güvenlik Anahtarı (Şifre)</label>
                        </div>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <SubmitButton />
                    </div>
                </form>

                <p className="text-center text-slate-600 text-xs mt-8">
                    Bu alan 256-bit SSL ile korunmaktadır.
                    <br />
                    Unauthorized access is prohibited.
                </p>
            </div>
        </div>
    )
}
