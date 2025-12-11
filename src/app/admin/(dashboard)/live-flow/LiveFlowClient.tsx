
'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw, Zap, Clock, CheckCircle2, TrendingUp, Trophy } from 'lucide-react'
import { AIPredictionPayload } from '@/lib/types/predictions'

export default function LiveFlowClient() {
    const [predictions, setPredictions] = useState<AIPredictionPayload[]>([])
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [isLoading, setIsLoading] = useState(true)

    // Polling Logic
    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const res = await fetch('/api/predictions/live')
                const data = await res.json()
                if (data.success) {
                    setPredictions(data.data)
                    setLastUpdated(new Date())
                }
            } catch (error) {
                console.error('Polling error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        // Initial fetch
        fetchPredictions()

        // Poll every 2 seconds
        const interval = setInterval(fetchPredictions, 2000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Canlı Tahmin Akışı</h1>
                <p className="text-slate-500 mt-1 text-sm">AI sisteminden gelen tahminler gerçek zamanlı olarak burada görüntülenir.</p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Live Status */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Activity size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-100">Sistem Durumu</p>
                                <p className="text-xl font-bold">Aktif</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Total Predictions */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Zap size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Toplam Tahmin</p>
                            <p className="text-2xl font-bold text-slate-800">{predictions.length}</p>
                        </div>
                    </div>
                </div>

                {/* Last Update */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                            <Clock size={24} className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Son Güncelleme</p>
                            <p className="text-lg font-bold text-slate-800">{lastUpdated.toLocaleTimeString('tr-TR')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Predictions List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-emerald-500" />
                        <h3 className="font-semibold text-slate-700">Gelen Tahminler</h3>
                    </div>
                    <span className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        Son 50 kayıt
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <RefreshCw size={40} className="mx-auto mb-4 text-emerald-500 animate-spin" />
                            <p className="text-slate-500 font-medium">Yükleniyor...</p>
                        </div>
                    ) : predictions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                <Clock size={32} className="text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium">Henüz tahmin gelmedi</p>
                            <p className="text-xs text-slate-400 mt-2">AI sistemi tahmin gönderdiğinde burada görünecek.</p>
                        </div>
                    ) : (
                        predictions.map((p, i) => (
                            <div
                                key={i}
                                className="p-5 hover:bg-emerald-50/50 transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left: Match Info */}
                                    <div className="flex items-center gap-4">
                                        {/* Prediction Badge */}
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <Trophy size={24} className="text-white" />
                                        </div>

                                        {/* Teams */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800 text-lg">
                                                    {p.homeTeam}
                                                </h4>
                                                <span className="text-slate-400 font-normal">vs</span>
                                                <h4 className="font-bold text-slate-800 text-lg">
                                                    {p.awayTeam}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-slate-500">{p.league}</p>
                                        </div>
                                    </div>

                                    {/* Center: Prediction */}
                                    <div className="text-center">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold border border-emerald-200">
                                            <CheckCircle2 size={16} />
                                            {p.prediction}
                                        </span>
                                        {p.analysis && (
                                            <p className="text-xs text-slate-400 mt-2 max-w-xs">{p.analysis}</p>
                                        )}
                                    </div>

                                    {/* Right: Metadata */}
                                    <div className="text-right">
                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                            {p.matchId}
                                        </span>
                                        <p className="text-xs text-slate-400 mt-2 flex items-center justify-end gap-1">
                                            <Clock size={12} />
                                            {new Date(p.timestamp).toLocaleString('tr-TR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
