'use client'

import { useState, useEffect } from 'react'
import {
    Zap,
    Radio,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    Activity,
    Tv,
    Timer,
    Bell
} from 'lucide-react'
import { LivePrediction, LiveStats } from './actions'

// Pulsing Live Indicator
function LiveIndicator() {
    return (
        <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
    )
}

// Stats Card
function StatsCard({ icon: Icon, label, value, color, isLive }: {
    icon: any
    label: string
    value: string | number
    color: string
    isLive?: boolean
}) {
    return (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                </div>
                {isLive && <LiveIndicator />}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    )
}

// Live Prediction Card
function LivePredictionCard({ prediction }: { prediction: LivePrediction }) {
    const isHT = prediction.match_status === 'ht'

    return (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-green-500/30 rounded-2xl p-5 hover:border-green-500/50 transition-all relative overflow-hidden">
            {/* Live Badge */}
            <div className="absolute top-0 right-0">
                <div className={`px-3 py-1 ${isHT ? 'bg-yellow-500' : 'bg-green-500'} text-white text-xs font-bold rounded-bl-xl flex items-center gap-1.5`}>
                    {isHT ? (
                        <>
                            <Timer size={12} /> HT
                        </>
                    ) : (
                        <>
                            <LiveIndicator /> {prediction.match_minute}'
                        </>
                    )}
                </div>
            </div>

            {/* Bot Badge */}
            <div className="flex items-center gap-2 mb-4">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: prediction.bot_group_color }}
                >
                    {prediction.bot_group_name?.charAt(0)}
                </div>
                <span className="text-sm text-slate-400">{prediction.bot_group_name}</span>
            </div>

            {/* Teams & Score */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                        {prediction.home_team_logo ? (
                            <img src={prediction.home_team_logo} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                            <span className="text-lg font-bold text-white">{prediction.home_team_name?.charAt(0)}</span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-white truncate">{prediction.home_team_name}</p>
                </div>

                <div className="px-4">
                    <div className="text-3xl font-bold text-white">
                        {prediction.home_score} - {prediction.away_score}
                    </div>
                </div>

                <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                        {prediction.away_team_logo ? (
                            <img src={prediction.away_team_logo} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                            <span className="text-lg font-bold text-white">{prediction.away_team_name?.charAt(0)}</span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-white truncate">{prediction.away_team_name}</p>
                </div>
            </div>

            {/* League */}
            <div className="text-center text-xs text-slate-500 mb-4">
                {prediction.competition_name || 'Unknown League'}
            </div>

            {/* Prediction */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 text-center">
                <p className="text-sm text-slate-400 mb-1">Tahmin</p>
                <p className="text-lg font-bold text-blue-400">{prediction.prediction_type}</p>
            </div>

            {/* Notification Status */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                <Bell size={12} className={prediction.notification_sent ? 'text-green-400' : 'text-slate-600'} />
                {prediction.notification_sent ? 'Bildirim gönderildi' : 'Bildirim bekliyor'}
            </div>
        </div>
    )
}

// Result Ticker Item
function ResultTickerItem({ prediction }: { prediction: LivePrediction }) {
    const isWon = prediction.result === 'won'

    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${isWon ? 'bg-green-500/10' : 'bg-red-500/10'} whitespace-nowrap`}>
            {isWon ? (
                <CheckCircle2 size={16} className="text-green-400" />
            ) : (
                <XCircle size={16} className="text-red-400" />
            )}
            <span className="text-sm text-white font-medium">
                {prediction.home_team_name} vs {prediction.away_team_name}
            </span>
            <span className="text-sm text-slate-400">{prediction.prediction_type}</span>
            <span className={`text-sm font-bold ${isWon ? 'text-green-400' : 'text-red-400'}`}>
                {prediction.home_score}-{prediction.away_score}
            </span>
        </div>
    )
}

export default function LivePredictionsClientPage({
    initialPredictions,
    stats,
    recentResults
}: {
    initialPredictions: LivePrediction[]
    stats: LiveStats
    recentResults: LivePrediction[]
}) {
    const [predictions, setPredictions] = useState(initialPredictions)
    const [currentStats, setStats] = useState(stats)

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // In real app, this would fetch new data
            console.log('Refreshing live data...')
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <LiveIndicator />
                        <h1 className="text-3xl font-bold text-white">Canlı Tahminler</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Activity size={16} className="text-green-400" />
                    Her 30 saniyede otomatik yenilenir
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    icon={Radio}
                    label="Aktif Tahmin"
                    value={currentStats.activePredictions}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                    isLive
                />
                <StatsCard
                    icon={Tv}
                    label="Canlı Maç"
                    value={currentStats.liveMatches}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard
                    icon={CheckCircle2}
                    label="Bugün Kazanan"
                    value={currentStats.wonToday}
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatsCard
                    icon={XCircle}
                    label="Bugün Kaybeden"
                    value={currentStats.lostToday}
                    color="bg-gradient-to-br from-red-500 to-red-600"
                />
            </div>

            {/* Recent Results Ticker */}
            {recentResults.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-400">Son Sonuçlar</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {recentResults.map((result) => (
                            <ResultTickerItem key={result.id} prediction={result} />
                        ))}
                    </div>
                </div>
            )}

            {/* Live Predictions Grid */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-yellow-400" />
                    Aktif Tahminler ({predictions.length})
                </h2>

                {predictions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {predictions.map((prediction) => (
                            <LivePredictionCard key={prediction.id} prediction={prediction} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <Radio size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Şu anda canlı tahmin yok</h3>
                        <p className="text-slate-400">Canlı maçlar başladığında tahminler burada görünecek</p>
                    </div>
                )}
            </div>
        </div>
    )
}
