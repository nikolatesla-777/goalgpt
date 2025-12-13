'use client'

import { Calendar, Clock, Target, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'

export function PredictionList({ predictions }: { predictions: any[] }) {
    // Client-side only rendering for dates to avoid hydration mismatch
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
    }

    if (predictions.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={32} className="text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-medium mb-1">Henüz Tahmin Yok</h3>
                <p className="text-slate-500 text-sm">Bu bot henüz sistem tarafından eşleştirilmiş bir sinyal üretmedi.</p>
                <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg inline-block max-w-md">
                    <span className="font-bold block mb-1">💡 Bilgi:</span>
                    Yeni sinyaller geldikçe burada otomatik olarak listelenecektir.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {predictions.map((p) => {
                const homeTeam = p.home_team_name || 'Ev Sahibi'
                const awayTeam = p.away_team_name || 'Deplasman'
                const score = p.match_score || p.prediction_text?.match(/\(\d+-\d+\)/)?.[0]?.replace(/[()]/g, '') || '-' // Try to extract score
                const league = p.league_name || 'Lig Bilinmiyor'

                // Safe Date parsing
                let dateStr = '-'
                let timeStr = '-'
                try {
                    const dateObj = new Date(p.received_at || p.created_at)
                    timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    dateStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                } catch (e) {
                    // ignore invalid date
                }

                // Clean prediction type
                const predType = p.prediction_type || p.prediction_text?.split('!')[0] || 'Sinyal'

                return (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group">
                        {/* Top Bar */}
                        <div className="bg-slate-50/80 px-4 py-2 flex justify-between items-center border-b border-slate-100 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-600 uppercase tracking-tight">{league}</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-slate-500">
                                <Calendar size={12} className="text-slate-400" />
                                <span>{dateStr}</span>
                                <span className="text-slate-300">|</span>
                                <Clock size={12} className="text-indigo-500" />
                                <span>{timeStr}</span>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="p-4 sm:p-5 flex items-center gap-4 sm:gap-8">
                            {/* Minute */}
                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl shadow-md">
                                <span className="text-sm font-bold leading-none">{p.match_minute || '-'}</span>
                                <span className="text-[9px] text-slate-400">dk</span>
                            </div>

                            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-6">
                                <div className="text-right font-bold text-slate-800 text-sm sm:text-base">{homeTeam}</div>
                                <div className="bg-slate-100 px-3 py-1 rounded text-slate-800 font-mono font-bold tracking-widest">{score}</div>
                                <div className="text-left font-bold text-slate-800 text-sm sm:text-base">{awayTeam}</div>
                            </div>

                            {/* Status/Prediction */}
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100 flex items-center gap-2">
                                <Target size={14} />
                                {predType}
                            </div>
                        </div>

                        {/* Raw Text Footer (Optional, good for debugging) */}
                        {p.prediction_text && (
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-mono break-all line-clamp-1 hover:line-clamp-none transition-all">
                                {p.prediction_text}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
