'use client'

import { useState, useEffect } from 'react'
import {
    Activity,
    RefreshCw,
    Zap,
    Clock,
    Signal,
    Target,
    Shield,
    Cpu,
    ChevronDown,
    ChevronUp,
    Timer,
    Calendar,
    Globe,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import { AIPredictionPayload } from '@/lib/types/predictions'
import { parsePredictionDetails } from '@/lib/utils/prediction-parser'

interface UI_Prediction extends AIPredictionPayload {
    parsedMinute?: string
    parsedScore?: string
    parsedAlertCode?: string
    externalId?: string
    isExpanded?: boolean
    country?: string
    parsedLeague?: string
    displayTime?: string
    cleanBotName?: string
    cleanPrediction?: string
}

export default function LiveFlowClient() {
    const [predictions, setPredictions] = useState<UI_Prediction[]>([])
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [isLoading, setIsLoading] = useState(true)

    // Polling Logic
    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const res = await fetch('/api/predictions/live')
                const data = await res.json()
                if (data.success) {
                    const processed = (data.data as AIPredictionPayload[]).map(p => {
                        const details = parsePredictionDetails(p.rawText || p.analysis || '')
                        const dateObj = p.date ? new Date(p.date) : new Date()
                        const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

                        // Robust Bot & Prediction Mapping
                        const { botName, cleanPrediction } = cleanUpPredictionData(p.prediction, p.botGroupName, p.rawText)

                        // Robust Minute Parsing
                        const robustMinute = parseMinute(p.minute, p.rawText || p.analysis);

                        // Robust Score Parsing
                        let finalScore = details.score || p.score;
                        if (!finalScore && (p.rawText || p.analysis)) {
                            const scoreMatch = (p.rawText || p.analysis || '').match(/\(\d+-\d+\)/)
                            if (scoreMatch) finalScore = scoreMatch[0].replace(/[()]/g, '')
                        }

                        return {
                            ...p,
                            homeTeam: p.homeTeam || details.homeTeam,
                            awayTeam: p.awayTeam || details.awayTeam,
                            parsedMinute: robustMinute,
                            parsedScore: finalScore,
                            parsedAlertCode: details.alertCode,
                            externalId: details.externalId || p.matchId,
                            country: details.country,
                            parsedLeague: p.league || details.league,
                            displayTime: timeStr,
                            cleanBotName: botName,
                            cleanPrediction: cleanPrediction
                        }
                    })
                    setPredictions(processed)
                    setLastUpdated(new Date())
                    setIsLoading(false)
                }
            } catch (error) {
                console.error('Polling error:', error)
                setIsLoading(false)
            }
        }

        fetchPredictions()
        const interval = setInterval(fetchPredictions, 3000)
        return () => clearInterval(interval)
    }, [])

    const toggleExpand = (index: number) => {
        setPredictions(prev => prev.map((p, i) => i === index ? { ...p, isExpanded: !p.isExpanded } : p))
    }

    const matchCount = predictions.filter(p => !p.rawText?.includes('Unknown')).length

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto p-4 md:p-8 bg-[#F0F4F8] min-h-screen">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Signal className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Eşleşme Merkezi</h1>
                        <p className="text-slate-500 text-sm font-medium">Canlı Sinyal Analiz Paneli</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anlık Akış</span>
                        <span className="text-2xl font-black text-slate-900">{predictions.length}</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Sistem Çevrimiçi</span>
                    </div>
                </div>
            </div>

            {/* Main Card List */}
            <div className="space-y-4">
                {isLoading && predictions.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
                        <span className="text-slate-400 font-bold animate-pulse">Analizler Yükleniyor...</span>
                    </div>
                ) : predictions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-300 shadow-sm">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity size={48} className="text-slate-400" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-xl mb-2">Sinyal Bekleniyor</h3>
                        <p className="text-slate-500 font-medium">Şu an için aktif bir sinyal akışı bulunmuyor.</p>
                    </div>
                ) : (
                    predictions.map((p, i) => (
                        <PremiumPredictionCard
                            key={i}
                            prediction={p}
                            isExpanded={!!p.isExpanded}
                            onToggle={() => toggleExpand(i)}
                        />
                    ))
                )}
            </div>

            <div className="text-center pt-8 text-[10px] text-slate-300 font-black uppercase tracking-widest">
                GoalGPT Live Feed v3.0
            </div>
        </div>
    )
}

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------

function parseMinute(minute: string | undefined, rawText: string | undefined): string {
    if (minute) return minute;
    if (!rawText) return '';

    // Pattern 1: Emoji followed by number (⏰ 10)
    const emojiMatch = rawText.match(/(?:⏰|⏱️|⏲️)\s*(\d{1,3})/);
    if (emojiMatch) return emojiMatch[1];

    // Pattern 2: Number followed by ' ('10')
    const quoteMatch = rawText.match(/\b(\d{1,3})['’]/);
    if (quoteMatch) return quoteMatch[1];

    // Pattern 3: Exclamation context
    const exclMatch = rawText.match(/!\s*(\d{1,3})/) || rawText.match(/(\d{1,3})\s*!/);
    if (exclMatch) return exclMatch[1];

    return '';
}

function cleanUpPredictionData(rawPrediction: string | undefined, botGroup: string | undefined, rawText: string | undefined) {
    let botName = botGroup || '';
    let cleanPrediction = rawPrediction || 'Sinyal';
    const text = (rawText || '').toUpperCase();

    // 1. Force Map 'ALERT: D' based on known patterns if botName is empty or generic
    if (!botName || botName.startsWith('BOT-')) {
        if (text.includes('IY-1') || text.includes('IY GOL') || text.includes('00076') || text.includes('00075') || text.includes('00081') || text.includes('00092')) {
            botName = 'ALERT: D';
        }
    }

    // If still empty but has ID
    if (!botName && rawText) {
        const idMatch = rawText.match(/^(\d{4,5})/)
        if (idMatch) botName = `BOT-${idMatch[1]}`
        else botName = 'AI BOT'
    }

    // 2. Clean Prediction Text
    if (cleanPrediction.length > 15 || cleanPrediction.includes('*')) {
        if (text.includes('IY GOL') || text.includes('IY-1')) cleanPrediction = 'IY Gol (0.5 Üst)';
        else if (text.includes('MS')) cleanPrediction = 'Maç Sonu';
        else cleanPrediction = 'Gol Sinyali';
    }

    return { botName, cleanPrediction }
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function PremiumPredictionCard({ prediction, isExpanded, onToggle }: { prediction: UI_Prediction, isExpanded: boolean, onToggle: () => void }) {
    const p = prediction
    const homeTeam = p.homeTeam || 'Ev Sahibi Takım'
    const awayTeam = p.awayTeam || 'Deplasman Takım'
    const score = p.parsedScore?.replace('-', ':') || '0:0'
    const league = p.parsedLeague || p.league || 'LİG BİLİNMİYOR'
    const minute = p.parsedMinute || ''


    // Determine colors/badges based on bot name
    const isAlertD = p.cleanBotName === 'ALERT: D';

    return (
        <div
            onClick={onToggle}
            className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.04)] overflow-hidden hover:border-indigo-400 hover:shadow-[0_8px_24px_rgba(79,70,229,0.15)] transition-all duration-300 group cursor-pointer transform hover:-translate-y-0.5"
        >
            {/* Header */}
            <div className="bg-slate-100/80 px-5 py-2.5 flex justify-between items-center text-xs text-slate-500 font-bold border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAlertD ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                    <span className="uppercase tracking-wide text-slate-700 truncate max-w-[200px] sm:max-w-none">{league}</span>
                </div>
                <div className="flex items-center gap-4 font-mono">
                    <span className="flex items-center gap-1.5 text-indigo-600"><Clock size={12} strokeWidth={2.5} /> {p.displayTime}</span>
                </div>
            </div>

            <div className="p-5 sm:px-6 sm:py-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-8">

                {/* Minute Box - Always Black */}
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/20 shrink-0 border-2 border-slate-800">
                    {minute ? (
                        <>
                            <span className="text-xl font-black leading-none tracking-tighter">{minute}</span>
                            <span className="text-[9px] font-bold text-slate-300 mt-0.5 opacity-80">DK</span>
                        </>
                    ) : (
                        <div className="flex flex-col items-center animate-pulse">
                            <Activity size={20} className="text-emerald-400" />
                            <span className="text-[8px] font-bold text-emerald-400 mt-0.5">CANLI</span>
                        </div>
                    )}
                </div>

                {/* Match Info */}
                <div className="flex-1 w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                    <div className="text-right font-extrabold text-slate-900 text-base sm:text-lg leading-tight break-words">
                        {homeTeam}
                    </div>

                    <div className="bg-slate-100 px-4 py-2 rounded-lg text-slate-900 font-mono font-black tracking-widest text-lg min-w-[70px] text-center border-2 border-slate-200">
                        {score}
                    </div>

                    <div className="text-left font-extrabold text-slate-900 text-base sm:text-lg leading-tight break-words">
                        {awayTeam}
                    </div>
                </div>

                {/* Bot & Prediction Badge */}
                <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
                    <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/30 flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-transform duration-200">
                        <div className="bg-white/20 p-1 rounded-full">
                            {isAlertD ? (
                                <AlertTriangle size={14} className="text-white fill-yellow-400 stroke-yellow-400 animate-pulse" />
                            ) : (
                                <Zap size={14} className="text-white fill-white" />
                            )}
                        </div>
                        <div className="flex flex-col leading-none text-left">
                            <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider mb-0.5">{p.cleanPrediction}</span>
                            <span className="text-base font-black tracking-wide">{p.cleanBotName || 'AI BOT'}</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col gap-1 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">RAW</span>
                        <p className="text-[10px] text-slate-500 font-mono break-all opacity-70">
                            {p.rawText || p.analysis}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
