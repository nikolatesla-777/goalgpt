'use client'

import { useEffect, useState } from 'react'
import { Activity, Trophy, Calendar, MapPin, Info, Timer, Users, TrendingUp, Target, BarChart2, Star, ArrowLeft, Award } from 'lucide-react'
import { MatchStatistics } from './components/MatchStatistics'

interface MatchEvent {
    type: string
    time: number
    team: 'home' | 'away'
    player: string
    detail?: string
    assist?: string
}

interface MatchStat {
    type: string
    home: number | string
    away: number | string
}

interface H2HMatch {
    id: number
    date: string
    homeTeam: { name: string }
    awayTeam: { name: string }
    homeScore: number
    awayScore: number
    league: string
}

interface PlayerRating {
    id: number
    name: string
    photo: string
    position: string
    rating: number | null
    team: 'home' | 'away'
}

interface TeamStats {
    team: { name: string; logo: string }
    form: string
    fixtures: { wins: { total: number }; draws: { total: number }; loses: { total: number } }
    goals: { avgFor: string }
    cleanSheet: { total: number }
}

interface Prediction {
    advice: string
    winner: { name: string | null; comment: string | null }
    percent: { home: string; draw: string; away: string }
    comparison: {
        form: { home: string; away: string }
        att: { home: string; away: string }
        def: { home: string; away: string }
        total: { home: string; away: string }
    }
}

type TabType = 'aitahmin' | 'stats' | 'events' | 'h2h' | 'teamstats' | 'predictions' | 'standings'

interface CenklerPrediction {
    id: string
    prediction_type: string
    prediction_odds: number
    confidence: number
    analysis: string
    bot_name: string
    status: string
    result: string | null
    minute: number | null
}

// Display mapper for prediction types
function formatPredictionDisplay(rawType: string): string {
    const mappings: Record<string, string> = {
        'İY Gol': 'İY 0.5 ÜST',
        'IY Gol': 'İY 0.5 ÜST',
        'IY GOL': 'İY 0.5 ÜST',
        '+1 Gol': 'Maç 0.5 ÜST',
        '+1 GOL': 'Maç 0.5 ÜST',
        'MS 1': 'Maç Sonucu: EV SAHİBİ',
        'MS 2': 'Maç Sonucu: DEPLASMAN',
        'MS X': 'Maç Sonucu: BERABERLİK',
        'MS 1X': 'Çifte Şans: 1X',
        'MS X2': 'Çifte Şans: X2',
        'MS 12': 'Çifte Şans: 12',
        '2.5 ÜST': 'Maç 2.5 ÜST',
        '2.5 ALT': 'Maç 2.5 ALT',
        '1.5 ÜST': 'Maç 1.5 ÜST',
        'KG VAR': 'Karşılıklı Gol: VAR',
        'KG YOK': 'Karşılıklı Gol: YOK',
    }
    return mappings[rawType] || rawType || 'Tahmin Yok'
}

// Extract prediction from prediction_text if prediction_type is empty
function extractPredictionFromText(prediction: any): string {
    // First try prediction_type
    if (prediction?.prediction_type && prediction.prediction_type.trim()) {
        return prediction.prediction_type.trim()
    }

    // Try raw_payload.prediction
    if (prediction?.raw_payload?.prediction && prediction.raw_payload.prediction.trim()) {
        return prediction.raw_payload.prediction.trim()
    }

    // Parse from prediction_text (look for *bold* patterns)
    const text = prediction?.prediction_text || ''
    const boldMatch = text.match(/\*([^*]+)\*(?:\s*$|\r|\n)/g)
    if (boldMatch && boldMatch.length > 0) {
        // Get the last bold text (usually the prediction)
        const lastBold = boldMatch[boldMatch.length - 1].replace(/\*/g, '').trim()
        if (lastBold && !lastBold.includes('(') && lastBold.length < 30) {
            return lastBold
        }
    }

    return 'Tahmin Mevcut'
}

export default function MatchDetailClientPage({ params }: { params: Promise<{ id: string }> }) {
    const [matchId, setMatchId] = useState<string | null>(null)
    const [match, setMatch] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<TabType>('stats')

    // Lazy loaded data
    const [stats, setStats] = useState<MatchStat[] | null>(null)
    const [events, setEvents] = useState<MatchEvent[] | null>(null)
    const [h2h, setH2H] = useState<H2HMatch[] | null>(null)
    const [teamStats, setTeamStats] = useState<{ home: TeamStats | null; away: TeamStats | null } | null>(null)
    const [predictions, setPredictions] = useState<Prediction | null>(null)
    const [standings, setStandings] = useState<any[] | null>(null)
    const [cenklerPredictions, setCenklerPredictions] = useState<any[] | null>(null)
    const [loadingTab, setLoadingTab] = useState<TabType | null>(null)

    useEffect(() => {
        params.then(p => {
            setMatchId(p.id)
            fetchMatch(p.id)
        })
    }, [params])

    useEffect(() => {
        if (match && matchId) loadTabData(activeTab)
    }, [activeTab, match, matchId])

    // Auto-refresh for live matches every 30 seconds
    useEffect(() => {
        if (!matchId || !match) return

        // Only auto-refresh for live matches
        const isLive = match.status === 'LIVE' || match.status === '1H' || match.status === '2H' || match.status === 'HT'
        if (!isLive) return

        const interval = setInterval(() => {
            console.log('[Auto-Refresh] Updating live match data...')
            fetchMatch(matchId)
        }, 30000) // 30 seconds

        return () => clearInterval(interval)
    }, [matchId, match?.status])

    const fetchMatch = async (id: string) => {
        try {
            const res = await fetch(`/api/livescore/match/${id}`)
            const data = await res.json()
            setMatch(data)
        } catch (e) {
            console.error('Match fetch error:', e)
        } finally {
            setLoading(false)
        }
    }

    const loadTabData = async (tab: TabType) => {
        if (!match || !matchId) return

        switch (tab) {
            case 'aitahmin':
                if (!cenklerPredictions) {
                    setLoadingTab('aitahmin')
                    try {
                        const res = await fetch(`/api/match/${matchId}/cenkler-prediction`)
                        const data = await res.json()
                        if (!data.error && data.predictions) {
                            setCenklerPredictions(data.predictions)
                        }
                    } catch (e) {
                        console.error('Cenkler prediction fetch error:', e)
                    }
                    setLoadingTab(null)
                }
                break

            case 'stats':
                if (!stats) {
                    setLoadingTab('stats')
                    const res = await fetch(`/api/match/${matchId}/stats`)
                    const data = await res.json()
                    setStats(data.statistics || [])
                    setLoadingTab(null)
                }
                break

            case 'events':
                if (!events) {
                    setLoadingTab('events')
                    const res = await fetch(`/api/match/${matchId}/events`)
                    const data = await res.json()
                    setEvents(data.events || [])
                    setLoadingTab(null)
                }
                break

            case 'h2h':
                if (!h2h) {
                    setLoadingTab('h2h')
                    const res = await fetch(`/api/match/${matchId}/h2h?home=${match.homeTeam.id}&away=${match.awayTeam.id}`)
                    const data = await res.json()
                    setH2H(data.matches || [])
                    setLoadingTab(null)
                }
                break

            case 'teamstats':
                if (!teamStats && match.league?.id) {
                    setLoadingTab('teamstats')
                    const res = await fetch(`/api/match/${matchId}/team-stats?home=${match.homeTeam.id}&away=${match.awayTeam.id}&league=${match.league.id}`)
                    const data = await res.json()
                    setTeamStats(data)
                    setLoadingTab(null)
                }
                break

            case 'predictions':
                if (!predictions) {
                    setLoadingTab('predictions')
                    const res = await fetch(`/api/match/${matchId}/predictions`)
                    const data = await res.json()
                    if (!data.error) setPredictions(data)
                    setLoadingTab(null)
                }
                break

            case 'standings':
                if (!standings && match.league?.id) {
                    setLoadingTab('standings')
                    const res = await fetch(`/api/standings/${match.league.id}`)
                    const data = await res.json()
                    setStandings(data.standings || [])
                    setLoadingTab(null)
                }
                break
        }
    }

    const tabs: { key: TabType; label: string; icon: any }[] = [
        { key: 'aitahmin', label: '🤖 AI Tahminler', icon: Star },
        { key: 'stats', label: 'İstatistik', icon: BarChart2 },
        { key: 'events', label: 'Olaylar', icon: Timer },
        { key: 'h2h', label: 'H2H', icon: Users },
        { key: 'teamstats', label: 'Sezon', icon: TrendingUp },
        { key: 'predictions', label: 'API Tahmin', icon: Target },
        { key: 'standings', label: 'Puan Durumu', icon: Award },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Maç yükleniyor...</p>
                </div>
            </div>
        )
    }

    if (!match) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 text-center max-w-md">
                    <h2 className="text-xl font-bold text-white mb-2">Maç Bulunamadı</h2>
                    <p className="text-slate-400 mb-6">Aradığınız maç sistemde bulunamadı.</p>
                    <a href="/admin/livescore" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                        <ArrowLeft size={16} />
                        LiveScore'a Dön
                    </a>
                </div>
            </div>
        )
    }

    const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(match.status?.short)

    return (
        <div className="min-h-screen bg-[#fafafa]">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    {/* Back Button */}
                    <a href="/admin/livescore" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                        <ArrowLeft size={16} />
                        LiveScore Merkezine Dön
                    </a>

                    {/* League Info */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {match.league?.logo && (
                            <img src={match.league.logo} alt="" className="w-6 h-6" />
                        )}
                        <div className="text-center">
                            <div className="text-slate-400 text-xs uppercase tracking-wider">{match.league?.country}</div>
                            <div className="text-white font-semibold">{match.league?.name}</div>
                        </div>
                        {isLive && (
                            <span className="ml-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                CANLI
                            </span>
                        )}
                    </div>

                    {/* Scoreboard */}
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {/* Home Team */}
                        <div className="flex-1 text-center">
                            <div className="w-20 h-20 mx-auto mb-3 bg-white/10 rounded-2xl p-3 backdrop-blur">
                                {match.homeTeam?.logo && (
                                    <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-full h-full object-contain" />
                                )}
                            </div>
                            <h2 className="text-white font-bold text-lg">{match.homeTeam?.name}</h2>
                        </div>

                        {/* Score */}
                        <div className="px-8">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl font-black text-white">{match.score?.home ?? '-'}</span>
                                <span className="text-3xl text-slate-500">-</span>
                                <span className="text-5xl font-black text-white">{match.score?.away ?? '-'}</span>
                            </div>
                            <div className="text-center mt-2">
                                <span className={`text-sm font-medium px-4 py-1 rounded-full ${isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-300'}`}>
                                    {match.status?.elapsed ? `${match.status.elapsed}'` : match.status?.long}
                                </span>
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 text-center">
                            <div className="w-20 h-20 mx-auto mb-3 bg-white/10 rounded-2xl p-3 backdrop-blur">
                                {match.awayTeam?.logo && (
                                    <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-full h-full object-contain" />
                                )}
                            </div>
                            <h2 className="text-white font-bold text-lg">{match.awayTeam?.name}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="space-y-6">
                    {/* Tab Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1 flex gap-1 overflow-x-auto">{tabs.map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.key
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        )
                    })}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {loadingTab === activeTab ? (
                            <div className="p-12 text-center">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-slate-400 text-sm">Yükleniyor...</p>
                            </div>
                        ) : (
                            <>
                                {/* AI Tahmin Tab */}
                                {activeTab === 'aitahmin' && (
                                    <div className="p-6">
                                        {!cenklerPredictions || cenklerPredictions.length === 0 ? (
                                            <div className="text-center py-16">
                                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                                                    <span className="text-5xl">🤖</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-700 mb-2">AI Tahmini Bulunamadı</h3>
                                                <p className="text-slate-500 max-w-md mx-auto">Bu maç için henüz yapay zeka tahmini üretilmedi.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                                                            <span className="text-xl">🤖</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-slate-800 font-bold text-lg">AI Tahminleri</h3>
                                                            <p className="text-slate-500 text-sm">{cenklerPredictions.length} farklı bot tahmini</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Predictions Grid */}
                                                <div className="grid gap-4">
                                                    {cenklerPredictions.map((pred, idx) => (
                                                        <div
                                                            key={pred.id || idx}
                                                            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl"
                                                        >
                                                            {/* Bot Info Row */}
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-emerald-400 text-sm font-semibold border border-emerald-500/30">
                                                                        ⚡ {pred.bot_display_name || pred.raw_payload?.botGroupName || 'AI Bot'}
                                                                    </span>
                                                                    <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-slate-300 text-sm">
                                                                        🕐 {pred.match_minute || '?'}. Dakika
                                                                    </span>
                                                                </div>
                                                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${pred.result === 'won' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        pred.result === 'lost' ? 'bg-rose-500/20 text-rose-400' :
                                                                            'bg-amber-500/20 text-amber-400'
                                                                    }`}>
                                                                    {pred.result === 'won' ? '✅ Kazandı' :
                                                                        pred.result === 'lost' ? '❌ Kaybetti' : '⏳ Bekliyor'}
                                                                </div>
                                                            </div>

                                                            {/* Main Prediction */}
                                                            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-xl p-4 shadow-xl">
                                                                <div className="text-white/80 text-sm mb-1 font-medium">TAHMİN</div>
                                                                <div className="text-white text-2xl md:text-3xl font-black tracking-tight">
                                                                    {formatPredictionDisplay(pred.display_prediction || pred.prediction_type || 'Tahmin Mevcut')}
                                                                </div>
                                                            </div>

                                                            {/* Meta Info */}
                                                            <div className="flex items-center gap-4 mt-3 text-slate-400 text-xs">
                                                                <span>📅 {new Date(pred.received_at).toLocaleString('tr-TR')}</span>
                                                                {pred.confidence > 0 && <span>💪 Güven: %{pred.confidence}</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Stats Bar */}
                                                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-center">
                                                            <div className="text-slate-500 text-xs">Bu Maç</div>
                                                            <div className="text-slate-800 font-bold">{cenklerPredictions.length} Tahmin</div>
                                                        </div>
                                                        <div className="h-8 w-px bg-slate-300"></div>
                                                        <div className="text-center">
                                                            <div className="text-slate-500 text-xs">Kazanan</div>
                                                            <div className="text-emerald-600 font-bold">
                                                                {cenklerPredictions.filter(p => p.result === 'won').length}
                                                            </div>
                                                        </div>
                                                        <div className="h-8 w-px bg-slate-300"></div>
                                                        <div className="text-center">
                                                            <div className="text-slate-500 text-xs">Bekleyen</div>
                                                            <div className="text-amber-600 font-bold">
                                                                {cenklerPredictions.filter(p => p.result === 'pending' || !p.result).length}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}



                                {/* Events Tab */}
                                {activeTab === 'events' && (
                                    <div className="p-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                            <Timer className="w-5 h-5 text-orange-500" />
                                            Maç Olayları
                                        </h3>
                                        {!events || events.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <Timer className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>Henüz olay yok</p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                {/* Center Timeline Line */}
                                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />

                                                <div className="space-y-4">
                                                    {events.map((event, i) => (
                                                        <div key={i} className={`flex items-center gap-4 ${event.team === 'home' ? 'flex-row' : 'flex-row-reverse'}`}>
                                                            {/* Event Content */}
                                                            <div className={`flex-1 ${event.team === 'home' ? 'text-right' : 'text-left'}`}>
                                                                <div className="inline-block">
                                                                    <div className={`flex items-center gap-2 ${event.team === 'home' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                        <span className="text-lg">{getEventIcon(event.type, event.detail)}</span>
                                                                        <span className="font-bold text-sm text-slate-800">{formatEventType(event.type, event.detail)}</span>
                                                                    </div>
                                                                    <p className={`text-xs text-slate-500 ${event.team === 'home' ? 'text-right' : 'text-left'}`}>
                                                                        {event.player}
                                                                        {event.detail && ` (${event.detail})`}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Time Bubble - Centered */}
                                                            <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0 z-10">
                                                                {event.time}'
                                                            </div>

                                                            {/* Empty Space */}
                                                            <div className="flex-1" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Stats Tab */}
                                {activeTab === 'stats' && (
                                    <div className="p-6">
                                        <MatchStatistics
                                            stats={stats || []}
                                            homeTeamName={match.homeTeam?.name}
                                            awayTeamName={match.awayTeam?.name}
                                        />
                                    </div>
                                )}

                                {/* H2H Tab */}
                                {activeTab === 'h2h' && (
                                    <div className="p-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                            <Users className="w-5 h-5 text-blue-500" />
                                            Karşılaşma Geçmişi
                                        </h3>
                                        {!h2h || h2h.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>Karşılaşma geçmişi yok</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {h2h.map((m, i) => (
                                                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="text-xs text-slate-400 mb-2">
                                                            {new Date(m.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-sm text-slate-700 flex-1">{m.homeTeam.name}</span>
                                                            <span className="px-4 py-1 bg-emerald-500 text-white font-bold text-sm rounded-lg">
                                                                {m.homeScore} - {m.awayScore}
                                                            </span>
                                                            <span className="font-medium text-sm text-slate-700 flex-1 text-right">{m.awayTeam.name}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-2">{m.league}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Team Stats Tab */}
                                {activeTab === 'teamstats' && (
                                    <div className="p-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                            <TrendingUp className="w-5 h-5 text-purple-500" />
                                            Sezon İstatistikleri
                                        </h3>
                                        {!teamStats?.home && !teamStats?.away ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>Sezon istatistikleri yok</p>
                                            </div>
                                        ) : (
                                            <div>
                                                {/* Team Headers */}
                                                <div className="flex justify-around mb-6">
                                                    <div className="text-center">
                                                        {teamStats?.home?.team?.logo && <img src={teamStats.home.team.logo} className="w-12 h-12 mx-auto mb-2" />}
                                                        <div className="font-semibold text-sm text-slate-700">{match.homeTeam?.name}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        {teamStats?.away?.team?.logo && <img src={teamStats.away.team.logo} className="w-12 h-12 mx-auto mb-2" />}
                                                        <div className="font-semibold text-sm text-slate-700">{match.awayTeam?.name}</div>
                                                    </div>
                                                </div>

                                                {/* Stats Rows */}
                                                {[
                                                    { label: 'Galibiyet', homeVal: teamStats?.home?.fixtures?.wins?.total, awayVal: teamStats?.away?.fixtures?.wins?.total },
                                                    { label: 'Beraberlik', homeVal: teamStats?.home?.fixtures?.draws?.total, awayVal: teamStats?.away?.fixtures?.draws?.total },
                                                    { label: 'Mağlubiyet', homeVal: teamStats?.home?.fixtures?.loses?.total, awayVal: teamStats?.away?.fixtures?.loses?.total },
                                                    { label: 'Ort. Gol', homeVal: teamStats?.home?.goals?.avgFor, awayVal: teamStats?.away?.goals?.avgFor },
                                                    { label: 'Clean Sheet', homeVal: teamStats?.home?.cleanSheet?.total, awayVal: teamStats?.away?.cleanSheet?.total },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center py-3 border-b border-slate-100 last:border-0">
                                                        <span className="w-16 text-center font-bold text-lg text-slate-800">{item.homeVal ?? '-'}</span>
                                                        <span className="flex-1 text-center text-slate-400 text-sm">{item.label}</span>
                                                        <span className="w-16 text-center font-bold text-lg text-slate-800">{item.awayVal ?? '-'}</span>
                                                    </div>
                                                ))}

                                                {/* Form */}
                                                <div className="mt-6 text-center">
                                                    <div className="text-sm text-slate-500 mb-3">Son Form</div>
                                                    <div className="flex justify-around">
                                                        <div className="flex gap-1">
                                                            {teamStats?.home?.form?.slice(-5).split('').map((r, i) => (
                                                                <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getFormColor(r)}`}>
                                                                    {r}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {teamStats?.away?.form?.slice(-5).split('').map((r, i) => (
                                                                <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getFormColor(r)}`}>
                                                                    {r}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Predictions Tab */}
                                {activeTab === 'predictions' && (
                                    <div className="p-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                            <Target className="w-5 h-5 text-rose-500" />
                                            Maç Tahmini
                                        </h3>
                                        {!predictions ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>Tahmin verisi yok</p>
                                            </div>
                                        ) : (
                                            <div>
                                                {/* AI Advice */}
                                                <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 text-white p-4 rounded-xl mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">🤖</span>
                                                        <span className="font-semibold">{predictions.advice}</span>
                                                    </div>
                                                </div>

                                                {/* Winner */}
                                                {predictions.winner.name && (
                                                    <div className="text-center p-4 bg-slate-50 rounded-xl mb-6 border-2 border-emerald-500">
                                                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Favori</div>
                                                        <div className="text-xl font-bold text-emerald-600">{predictions.winner.name}</div>
                                                        <div className="text-sm text-slate-500">{predictions.winner.comment}</div>
                                                    </div>
                                                )}

                                                {/* Win Probability */}
                                                <div className="mb-6">
                                                    <div className="text-sm font-medium text-slate-700 mb-4">Kazanma Olasılığı</div>
                                                    {[
                                                        { label: 'Ev Sahibi', value: predictions.percent.home, color: 'from-emerald-500 to-cyan-400' },
                                                        { label: 'Beraberlik', value: predictions.percent.draw, color: 'from-gray-400 to-gray-500' },
                                                        { label: 'Deplasman', value: predictions.percent.away, color: 'from-orange-400 to-rose-500' },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3 mb-3">
                                                            <span className="w-24 text-sm text-slate-500">{item.label}</span>
                                                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all`} style={{ width: item.value }} />
                                                            </div>
                                                            <span className="w-12 text-right font-bold text-sm text-slate-700">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Comparison */}
                                                <div className="bg-slate-50 rounded-xl p-4">
                                                    <div className="text-sm font-medium text-slate-700 mb-4">Karşılaştırma</div>
                                                    {Object.entries({
                                                        'Form': predictions.comparison.form,
                                                        'Hücum': predictions.comparison.att,
                                                        'Savunma': predictions.comparison.def,
                                                        'Toplam': predictions.comparison.total
                                                    }).map(([label, vals], i) => (
                                                        <div key={i} className="flex items-center py-2 border-b border-slate-200 last:border-0">
                                                            <span className="w-16 text-center font-bold text-slate-800">{vals.home}</span>
                                                            <span className="flex-1 text-center text-sm text-slate-400">{label}</span>
                                                            <span className="w-16 text-center font-bold text-slate-800">{vals.away}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Standings Tab */}
                                {activeTab === 'standings' && (
                                    <div className="p-6">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                            <Award className="w-5 h-5 text-yellow-500" />
                                            Puan Durumu
                                        </h3>
                                        {!standings || standings.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400">
                                                <Award className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                                <p>Puan durumu verisi yok</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-slate-400 text-xs uppercase border-b border-slate-100">
                                                            <th className="py-3 text-left w-8">#</th>
                                                            <th className="py-3 text-left">Takım</th>
                                                            <th className="py-3 text-center w-8">O</th>
                                                            <th className="py-3 text-center w-8">G</th>
                                                            <th className="py-3 text-center w-8">B</th>
                                                            <th className="py-3 text-center w-8">M</th>
                                                            <th className="py-3 text-center w-12">AV</th>
                                                            <th className="py-3 text-center w-10">P</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {standings.map((team: any, i: number) => {
                                                            const isMatchTeam = team.teamId == match.homeTeam?.id || team.teamId == match.awayTeam?.id
                                                            return (
                                                                <tr key={i} className={`border-b border-slate-50 ${isMatchTeam ? 'bg-emerald-50 font-semibold' : 'hover:bg-slate-50'}`}>
                                                                    <td className="py-3">
                                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${team.rank <= 4 ? 'bg-emerald-500 text-white' :
                                                                            team.rank >= standings.length - 2 ? 'bg-rose-500 text-white' :
                                                                                'bg-slate-100 text-slate-600'
                                                                            }`}>
                                                                            {team.rank}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            {team.teamLogo && <img src={team.teamLogo} className="w-5 h-5" alt="" />}
                                                                            <span className="text-slate-900 font-medium">{team.teamName}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 text-center text-slate-600">{team.all?.played}</td>
                                                                    <td className="py-3 text-center text-emerald-600">{team.all?.win}</td>
                                                                    <td className="py-3 text-center text-slate-500">{team.all?.draw}</td>
                                                                    <td className="py-3 text-center text-rose-500">{team.all?.lose}</td>
                                                                    <td className="py-3 text-center text-slate-600">{team.goalsDiff > 0 ? '+' : ''}{team.goalsDiff}</td>
                                                                    <td className="py-3 text-center font-bold text-slate-800">{team.points}</td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function formatStatLabel(type: string): string {
    const labels: Record<string, string> = {
        'Ball Possession': 'Topla Oynama (%)',
        'Shots on Goal': 'İsabetli Şut',
        'Shots off Goal': 'İsabetsiz Şut',
        'Total Shots': 'Toplam Şut',
        'Corner Kicks': 'Korner',
        'Fouls': 'Faul',
        'Offsides': 'Ofsayt',
        'Yellow Cards': 'Sarı Kart',
        'Red Cards': 'Kırmızı Kart',
        'Goalkeeper Saves': 'Kaleci Kurtarışı',
        'Total passes': 'Toplam Pas',
        'Passes accurate': 'İsabetli Pas',
        'Passes %': 'Pas Başarısı (%)'
    }
    return labels[type] || type
}

function getEventIcon(type: string, detail?: string): string {
    if (type === 'Goal') return '⚽'
    if (detail?.includes('Yellow')) return '🟨'
    if (detail?.includes('Red')) return '🟥'
    if (type === 'Subst') return '🔄'
    if (type === 'Var') return '📺'
    return '📌'
}

function formatEventType(type: string, detail?: string): string {
    if (type === 'Goal') return 'Gol'
    if (type === 'Card' && detail?.includes('Yellow')) return 'Sarı Kart'
    if (type === 'Card' && detail?.includes('Red')) return 'Kırmızı Kart'
    if (type === 'Subst') return 'Değişiklik'
    if (type === 'Var') return 'VAR Kararı'
    return type
}

function getFormColor(result: string): string {
    switch (result) {
        case 'W': return 'bg-emerald-500'
        case 'L': return 'bg-rose-500'
        case 'D': return 'bg-gray-400'
        default: return 'bg-gray-300'
    }
}
