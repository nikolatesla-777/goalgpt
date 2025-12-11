
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginPartner } from './actions'
import { Loader2, ArrowRight } from 'lucide-react'

// Submit Button Component for Loading State
function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? <Loader2 className="animate-spin" /> : (
                <>
                    Giriş Yap
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
    )
}

export default function PartnerLoginPage() {
    // @ts-ignore - useFormState types can be finicky
    const [state, formAction] = useFormState(loginPartner, null)

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 bg-[#0a0a0a]">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl relative backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-red-900/30">
                        <span className="text-3xl font-black text-white">G</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Partner Paneli</h1>
                    <p className="text-slate-400 text-sm mt-2">GoalGPT iş ortağı hesabınızla giriş yapın.</p>
                </div>

                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium animate-in fade-in slide-in-from-top-2">
                            {state.error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-posta</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="ornek@domain.com"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Şifre</label>
                            <a href="#" className="text-xs text-red-400 hover:text-red-300 transition-colors">Şifremi Unuttum</a>
                        </div>
                        <input
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>

                    <div className="pt-2">
                        <SubmitButton />
                    </div>
                </form>

                <p className="text-center text-slate-500 text-xs mt-8">
                    &copy; 2024 GoalGPT Partners. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    )
}
