
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatInTimeZone } from 'date-fns-tz'
import { tr } from 'date-fns/locale'

interface ApiLog {
    id: number
    created_at: string
    endpoint: string
    method: string
    headers: any
    body: any
    response_status: number
    response_body: any
    ip_address: string
}

export default function LogsPage() {
    const [logs, setLogs] = useState<ApiLog[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedLog, setExpandedLog] = useState<number | null>(null)
    const supabase = createClient()

    const fetchLogs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('api_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setLogs(data)
        if (error) console.error(error)
        setLoading(false)
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Gelen API İstekleri (Son 50)</h1>
                <button
                    onClick={fetchLogs}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-colors"
                >
                    Yenile
                </button>
            </div>

            {loading && logs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Yükleniyor...</div>
            ) : logs.length === 0 ? (
                <div className="bg-[#1C1C1E] border border-white/10 rounded-xl p-8 text-center text-gray-400">
                    Henüz kayıt yok. Tablo oluşturulmamış olabilir veya istek gelmemiş.
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log.id} className="bg-[#1C1C1E] border border-white/10 rounded-xl overflow-hidden">
                            <div
                                onClick={() => toggleExpand(log.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${log.response_status >= 200 && log.response_status < 300 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="font-mono text-sm text-yellow-500">{log.method}</span>
                                    <span className="font-mono text-sm text-gray-300">{log.endpoint}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.response_status >= 200 && log.response_status < 300
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {log.response_status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {formatInTimeZone(new Date(log.created_at), 'Europe/Istanbul', 'd MMM HH:mm:ss', { locale: tr })} (TSİ)
                                </div>
                            </div>

                            {expandedLog === log.id && (
                                <div className="p-4 border-t border-white/10 bg-black/20 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Request Body</h4>
                                            <pre className="bg-black/40 p-3 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto border border-white/5">
                                                {JSON.stringify(log.body, null, 2)}
                                            </pre>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Response Body</h4>
                                            <pre className="bg-black/40 p-3 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto border border-white/5">
                                                {JSON.stringify(log.response_body, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Headers</h4>
                                        <pre className="bg-black/40 p-3 rounded-lg text-xs font-mono text-gray-500 overflow-x-auto border border-white/5">
                                            {JSON.stringify(log.headers, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
