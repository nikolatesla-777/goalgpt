
'use client'

import { Share2, Copy, CheckCircle2, Lock } from 'lucide-react'
import { useState } from 'react'

export default function SubAffiliatesClient({ partner }: { partner: any }) {
    const [copied, setCopied] = useState(false)

    // Bronze Restriction
    if (partner?.tier === 'bronze') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4 shadow-2xl">
                    <Lock size={48} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Bu Özellik Kilitli 🔒</h1>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Alt bayilik sistemi sadece <span className="text-slate-200 font-bold">Silver</span> ve <span className="text-yellow-500 font-bold">Gold</span> partnerler içindir.
                    </p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-sm max-w-sm">
                    🚀 50 satış daha yaparak <strong>Silver</strong> lige geçebilir ve alt bayilik ağını kurmaya başlayabilirsin.
                </div>
            </div>
        )
    }

    const copyInvite = () => {
        navigator.clipboard.writeText(`https://goalgpt.com/partner/basvuru?ref=${partner?.ref_code}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-white">Alt Bayilik</h1>
                <p className="text-slate-400 text-sm mt-1">Kendi partner ağını kur ve onların satışlarından ekstra komisyon kazan.</p>
            </div>

            {/* Invite Box */}
            <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                        <Share2 size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Partner Davet Linki</h2>
                    <p className="text-slate-400 text-sm max-w-lg">
                        Bu linki paylaşarak yeni partnerler davet et. Onların yaptığı her satıştan <span className="text-white font-bold">%5</span> oranında ekstra komisyon kazan.
                    </p>
                </div>
                <div className="bg-[#0a0a0a] p-2 pl-4 rounded-xl border border-white/10 flex items-center gap-4 w-full md:w-auto">
                    <code className="text-sm font-mono text-purple-400 truncate">goalgpt.com/partner/apply?ref={partner?.ref_code}</code>
                    <button
                        onClick={copyInvite}
                        className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>

            {/* Sub-partners List */}
            <h3 className="text-lg font-bold text-white">Alt Bayilerin (0)</h3>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <Share2 size={32} />
                </div>
                <p className="text-slate-400 font-medium">Henüz hiç alt bayin yok.</p>
                <p className="text-xs text-slate-600 mt-2">Yukarıdaki linki paylaşarak ağını büyütmeye başla.</p>
            </div>
        </div>
    )
}
