
'use client'

import { useState, useEffect } from 'react'
import { Activity, RefreshCw, Smartphone, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'
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
            {/* Header Status */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 animate-pulse">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">Canlı Veri Akışı</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            API Dinleniyor
                            <span className="text-slate-300">|</span>
                            Son Güncelleme: {lastUpdated.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-slate-800">{predictions.length}</div>
                    <div className="text-xs text-slate-400">Toplam Veri</div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-700">Gelen Paketler (Son 50)</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                        POST /api/v1/ingest/predictions
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {predictions.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <RefreshCw size={48} className="mx-auto mb-4 opacity-20 animate-spin-slow" />
                            <p>Veri bekleniyor...</p>
                            <p className="text-xs mt-2">API'ye henüz bir istek gelmedi.</p>
                        </div>
                    ) : (
                        predictions.map((p, i) => (
                            <div key={i} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {/* Time Icon */}
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
                                        {p.minute ? `${p.minute}'` : 'MS'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-slate-800">
                                            {p.homeTeam} <span className="text-slate-400 font-normal px-1">-</span> {p.awayTeam}
                                        </h4>
                                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            ID: {p.matchId}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded border border-emerald-200">
                                            {p.prediction}
                                        </span>
                                        {p.botId && (
                                            <span className="text-[10px] flex items-center gap-1 text-slate-500">
                                                <Smartphone size={10} /> {p.botId}
                                            </span>
                                        )}
                                    </div>

                                    {/* Simulation Log Preview */}
                                    <div className="bg-slate-900 rounded-lg p-2 text-[10px] font-mono text-emerald-400 overflow-x-auto">
                                        <div className="flex items-center gap-2 text-slate-500 mb-1 pb-1 border-b border-slate-800">
                                            <AlertTriangle size={10} className="text-yellow-500" />
                                            Notification Simulation Triggered
                                        </div>
                                        <div>To: All Active Devices</div>
                                        <div className="truncate">Body: "{p.botId || 'GoalGPT AI'}: {p.prediction}"</div>
                                    </div>
                                </div>

                                {/* Timestamp */}
                                <div className="text-right">
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                                        <Clock size={10} />
                                        {new Date(p.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
