'use client'

import { useState, useEffect } from 'react'
import { getApiLogs, ApiLog } from './actions'
import { formatInTimeZone } from 'date-fns-tz'
import { tr } from 'date-fns/locale'
import { RefreshCw, ChevronRight, Activity, Globe, Calendar } from 'lucide-react'

// ...

export default function LogsPage() {
    const [logs, setLogs] = useState<ApiLog[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedLog, setExpandedLog] = useState<number | null>(null)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const data = await getApiLogs(50)
            setLogs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        // Auto refresh every 5s
        const interval = setInterval(fetchLogs, 5000)
        return () => clearInterval(interval)
    }, [])

    const toggleExpand = (id: number) => {
        setExpandedLog(expandedLog === id ? null : id)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gelen API İstekleri</h1>
                    <p className="text-sm text-slate-500 mt-1">Sisteme gelen son 50 webhook isteği ve detayları.</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Yenile
                </button>
            </div>

            {loading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <RefreshCw size={32} className="animate-spin text-slate-300 mb-3" />
                    <span className="text-slate-500 font-medium">Loglar Yükleniyor...</span>
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Activity size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-800 font-bold mb-1">Henüz Kayıt Yok</p>
                    <p className="text-slate-500 text-sm">Gelen istek logları burada listelenecek.</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {logs.map((log) => {
                            const isSuccess = log.response_status >= 200 && log.response_status < 300
                            const isExpanded = expandedLog === log.id

                            return (
                                <div key={log.id} className={`group transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                                    {/* Log Header Row */}
                                    <div
                                        onClick={() => toggleExpand(log.id)}
                                        className="p-4 flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className={`w-2 h-10 rounded-full flex-shrink-0 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />

                                        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                                            {/* Status Badge */}
                                            <div className="col-span-2 sm:col-span-1">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${isSuccess
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}>
                                                    {log.response_status}
                                                </span>
                                            </div>

                                            {/* Method & Endpoint */}
                                            <div className="col-span-6 sm:col-span-7 flex items-center gap-3">
                                                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                                                    {log.method}
                                                </span>
                                                <span className="font-mono text-sm text-slate-700 font-medium truncate" title={log.endpoint}>
                                                    {log.endpoint}
                                                </span>
                                            </div>

                                            {/* Date */}
                                            <div className="col-span-4 flex items-center justify-end gap-2 text-xs text-slate-400 font-medium">
                                                <Calendar size={14} />
                                                {formatInTimeZone(new Date(log.created_at), 'Europe/Istanbul', 'd MMM HH:mm:ss', { locale: tr })} (TSİ)
                                                <ChevronRight size={16} className={`text-slate-300 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-slate-200/50 ml-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Globe size={14} className="text-slate-400" />
                                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">İstek Detayları</h4>
                                                </div>
                                                <div className="bg-slate-900 rounded-lg p-4 overflow-hidden shadow-inner ring-1 ring-black/5">
                                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700/50 pb-2">
                                                        <span className="text-[10px] text-slate-400 font-mono">HEADERS</span>
                                                    </div>
                                                    <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto custom-scrollbar max-h-40 mb-4">
                                                        {JSON.stringify(log.headers, null, 2)}
                                                    </pre>

                                                    {log.decoded && (
                                                        <div className="mb-4 bg-slate-800/50 p-2 rounded border border-slate-700/50">
                                                            <div className="text-[10px] text-slate-500 font-bold mb-1 uppercase">Sinyal İçeriği (Çözümlendi)</div>
                                                            <div className="text-sm font-bold text-white mb-0.5">{log.decoded.teams}</div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                                <span className="bg-slate-700 text-white px-1.5 py-0.5 rounded">{log.decoded.score}</span>
                                                                <span className="text-emerald-400 font-mono">{log.decoded.minute}'</span>
                                                                <span>{log.decoded.league}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700/50 pb-2">
                                                        <span className="text-[10px] text-slate-400 font-mono">REQUEST BODY</span>
                                                    </div>
                                                    <pre className="font-mono text-[11px] text-blue-400 overflow-x-auto custom-scrollbar max-h-60">
                                                        {JSON.stringify(log.body, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity size={14} className="text-slate-400" />
                                                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sunucu Yanıtı</h4>
                                                </div>
                                                <div className="bg-slate-900 rounded-lg p-4 overflow-hidden shadow-inner ring-1 ring-black/5 h-full">
                                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700/50 pb-2">
                                                        <span className="text-[10px] text-slate-400 font-mono">RESPONSE BODY</span>
                                                    </div>
                                                    <pre className="font-mono text-[11px] text-amber-400 overflow-x-auto custom-scrollbar">
                                                        {JSON.stringify(log.response_body, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
