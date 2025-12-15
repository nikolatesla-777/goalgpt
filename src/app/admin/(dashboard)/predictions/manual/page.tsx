'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Save,
    ArrowLeft,
    Search,
    ChevronDown,
    Radio,
    Clock,
    Crown,
    Gift,
    Check,
    AlertCircle
} from 'lucide-react'
import { addManualPrediction, ManualPrediction } from '../prediction-store'

// Sample live matches data - will come from API-Football
interface LiveMatch {
    id: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    minute: number
    status: 'live' | 'ht' | 'ft'
    league: string
    leagueFlag: string
    startTime: string
}

const sampleLiveMatches: LiveMatch[] = [
    { id: 'm1', homeTeam: 'Persekama Kab Madiun 0', awayTeam: 'PS Mojokerto Putra', homeScore: 0, awayScore: 3, minute: 90, status: 'ft', league: 'Indonesia Liga 3', leagueFlag: '🇮🇩', startTime: '10.12.2025 09:00:00' },
    { id: 'm2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 2, awayScore: 1, minute: 67, status: 'live', league: 'La Liga', leagueFlag: '🇪🇸', startTime: '10.12.2025 22:00:00' },
    { id: 'm3', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', homeScore: 1, awayScore: 1, minute: 45, status: 'ht', league: 'Bundesliga', leagueFlag: '🇩🇪', startTime: '10.12.2025 20:30:00' },
    { id: 'm4', homeTeam: 'Galatasaray', awayTeam: 'Fenerbahçe', homeScore: 1, awayScore: 0, minute: 35, status: 'live', league: 'Süper Lig', leagueFlag: '🇹🇷', startTime: '10.12.2025 21:00:00' },
    { id: 'm5', homeTeam: 'Manchester United', awayTeam: 'Liverpool', homeScore: 0, awayScore: 2, minute: 78, status: 'live', league: 'Premier League', leagueFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', startTime: '10.12.2025 18:00:00' },
    { id: 'm6', homeTeam: 'AC Milan', awayTeam: 'Inter', homeScore: 0, awayScore: 0, minute: 15, status: 'live', league: 'Serie A', leagueFlag: '🇮🇹', startTime: '10.12.2025 21:45:00' },
    { id: 'm7', homeTeam: 'PSG', awayTeam: 'Lyon', homeScore: 3, awayScore: 1, minute: 90, status: 'ft', league: 'Ligue 1', leagueFlag: '🇫🇷', startTime: '10.12.2025 21:00:00' },
]

// Prediction templates
const predictionTemplates = [
    { id: 't1', label: 'Şablon seçiniz', value: '' },
    { id: 't2', label: '+1 Gol - (3.5 ÜST)', value: '+1 Gol - (3.5 ÜST)' },
    { id: 't3', label: '+1 Gol - (4.5 ÜST)', value: '+1 Gol - (4.5 ÜST)' },
    { id: 't4', label: '+1 Gol - (5.5 ÜST)', value: '+1 Gol - (5.5 ÜST)' },
    { id: 't5', label: '+2 Gol - (3.5 ÜST)', value: '+2 Gol - (3.5 ÜST)' },
    { id: 't6', label: '+2 Gol - (4.5 ÜST)', value: '+2 Gol - (4.5 ÜST)' },
    { id: 't7', label: 'IY 0.5 ÜST', value: 'IY 0.5 ÜST' },
    { id: 't8', label: 'IY 1.5 ÜST', value: 'IY 1.5 ÜST' },
    { id: 't9', label: 'MS 1', value: 'MS 1' },
    { id: 't10', label: 'MS 2', value: 'MS 2' },
    { id: 't11', label: 'MS X', value: 'MS X' },
    { id: 't12', label: 'KG VAR', value: 'KG VAR' },
    { id: 't13', label: '2.5 ÜST', value: '2.5 ÜST' },
    { id: 't14', label: '1.5 ÜST', value: '1.5 ÜST' },
]

// Access types
const accessTypes = [
    { id: 'vip', label: 'VIP', icon: Crown, color: 'text-yellow-400' },
    { id: 'free', label: 'FREE', icon: Gift, color: 'text-green-400' },
]

// Manual predictions bot name
const MANUAL_BOT_NAME = 'CODE 100'

export default function ManualPredictionPage() {
    const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null)
    const [matchSearch, setMatchSearch] = useState('')
    const [isMatchDropdownOpen, setIsMatchDropdownOpen] = useState(false)
    const [minute, setMinute] = useState('')
    const [accessType, setAccessType] = useState('vip')
    const [selectedTemplate, setSelectedTemplate] = useState('')
    const [prediction, setPrediction] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const matchDropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (matchDropdownRef.current && !matchDropdownRef.current.contains(event.target as Node)) {
                setIsMatchDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter matches
    const filteredMatches = sampleLiveMatches.filter(m =>
        m.homeTeam.toLowerCase().includes(matchSearch.toLowerCase()) ||
        m.awayTeam.toLowerCase().includes(matchSearch.toLowerCase()) ||
        m.league.toLowerCase().includes(matchSearch.toLowerCase())
    )

    // Live match count
    const liveMatchCount = sampleLiveMatches.filter(m => m.status === 'live').length

    // When template selected, update prediction
    const handleTemplateChange = (value: string) => {
        setSelectedTemplate(value)
        if (value) {
            setPrediction(value)
        }
    }

    // When match selected, auto-fill minute
    const handleMatchSelect = (match: LiveMatch) => {
        setSelectedMatch(match)
        setMinute(match.minute.toString())
        setIsMatchDropdownOpen(false)
        setMatchSearch('')
    }

    const handleSave = async () => {
        if (!selectedMatch) {
            alert('Lütfen bir maç seçiniz')
            return
        }
        if (!prediction.trim()) {
            alert('Lütfen tahmin giriniz')
            return
        }

        setIsSaving(true)
        try {
            // Create prediction object
            const now = new Date()
            const newPrediction: ManualPrediction = {
                id: `manual_${Date.now()}`,
                date: now.toLocaleDateString('tr-TR'),
                time: now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                botName: MANUAL_BOT_NAME,
                league: selectedMatch.league,
                leagueFlag: selectedMatch.leagueFlag,
                homeTeam: selectedMatch.homeTeam,
                awayTeam: selectedMatch.awayTeam,
                homeScore: selectedMatch.homeScore,
                awayScore: selectedMatch.awayScore,
                matchStatus: selectedMatch.status,
                minute: parseInt(minute) || selectedMatch.minute,
                predictionMinute: `${minute || selectedMatch.minute}'`,
                predictionScore: `${selectedMatch.homeScore} - ${selectedMatch.awayScore}`,
                prediction: prediction.trim(),
                result: 'pending',
                isVip: accessType === 'vip',
                source: 'manual'
            }

            // Save to store
            addManualPrediction(newPrediction)

            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 3000)

            // Reset form
            setSelectedMatch(null)
            setMinute('')
            setSelectedTemplate('')
            setPrediction('')
        } catch (error) {
            console.error('Error saving:', error)
            alert('Kaydetme sırasında hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    const getMatchStatusBadge = (match: LiveMatch) => {
        if (match.status === 'live') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    {match.minute}'
                </span>
            )
        } else if (match.status === 'ht') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                    <Clock size={10} />
                    HT
                </span>
            )
        } else {
            return (
                <span className="inline-flex items-center px-2 py-0.5 bg-slate-500/20 text-slate-400 rounded text-xs font-bold">
                    FT
                </span>
            )
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-xl shadow-lg">
                        <Check size={20} />
                        <span className="font-medium">Tahmin başarıyla kaydedildi! "Tüm Tahminler" sekmesinde görüntüleyebilirsiniz.</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-white">🎯 Yeni Tahmin Oluştur</h1>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold">
                        <Radio size={14} className="animate-pulse" />
                        {liveMatchCount} canlı maç
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Geri Dön
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedMatch || !prediction.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                    >
                        <Save size={16} />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>

            {/* Bot Info Card */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    C
                </div>
                <div>
                    <div className="text-sm text-slate-400">Tahmin Bot Grubu</div>
                    <div className="text-lg font-bold text-white">{MANUAL_BOT_NAME}</div>
                </div>
                <div className="ml-auto text-xs text-slate-500">
                    Tüm manuel tahminler bu bot grubu altında gösterilir
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                {/* Row 1: Match, Minute, AccessType */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-white/10">
                    {/* Match Dropdown */}
                    <div className="md:col-span-1" ref={matchDropdownRef}>
                        <label className="block text-sm text-slate-400 mb-2">Lig / Maç</label>
                        <div className="relative">
                            <button
                                onClick={() => setIsMatchDropdownOpen(!isMatchDropdownOpen)}
                                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left hover:border-white/20 transition-colors"
                            >
                                {selectedMatch ? (
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm text-white truncate">
                                            {selectedMatch.homeTeam} {selectedMatch.homeScore} - {selectedMatch.awayScore} {selectedMatch.awayTeam}
                                        </span>
                                        {getMatchStatusBadge(selectedMatch)}
                                    </div>
                                ) : (
                                    <span className="text-slate-500">Maç seçiniz</span>
                                )}
                                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isMatchDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isMatchDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden">
                                    {/* Search */}
                                    <div className="p-3 border-b border-white/10">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input
                                                type="text"
                                                value={matchSearch}
                                                onChange={(e) => setMatchSearch(e.target.value)}
                                                placeholder="Maç ara..."
                                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    {/* Match List */}
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredMatches.length > 0 ? (
                                            filteredMatches.map(match => (
                                                <button
                                                    key={match.id}
                                                    onClick={() => handleMatchSelect(match)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left border-b border-white/5 last:border-0 transition-colors ${selectedMatch?.id === match.id ? 'bg-blue-500/10' : ''
                                                        }`}
                                                >
                                                    <span className="text-xl">{match.leagueFlag}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-white truncate">
                                                            {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span>{match.league}</span>
                                                            <span>•</span>
                                                            <span>{match.startTime}</span>
                                                        </div>
                                                    </div>
                                                    {getMatchStatusBadge(match)}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-500 text-sm">
                                                Maç bulunamadı
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Minute */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Minute</label>
                        <input
                            type="number"
                            value={minute}
                            onChange={(e) => setMinute(e.target.value)}
                            placeholder="90"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
                        />
                    </div>

                    {/* Access Type */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">AccessType</label>
                        <div className="flex gap-3">
                            {accessTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setAccessType(type.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium transition-all ${accessType === type.id
                                        ? type.id === 'vip'
                                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                            : 'bg-green-500/20 border-green-500/50 text-green-400'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                >
                                    <type.icon size={16} />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: Template */}
                <div className="p-6 border-b border-white/10">
                    <label className="block text-sm text-slate-400 mb-2">Tahmin Şablonu</label>
                    <div className="relative">
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-white/20"
                        >
                            {predictionTemplates.map(t => (
                                <option key={t.id} value={t.value} className="bg-[#1a1a2e]">
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Row 4: Prediction Text */}
                <div className="p-6">
                    <label className="block text-sm text-slate-400 mb-2">Prediction</label>
                    <textarea
                        value={prediction}
                        onChange={(e) => setPrediction(e.target.value)}
                        placeholder="Tahmin metni..."
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 resize-none"
                    />

                    {/* Preview */}
                    {selectedMatch && prediction && (
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} className="text-blue-400" />
                                <span className="text-sm font-medium text-blue-400">Önizleme</span>
                            </div>
                            <div className="text-sm text-slate-300">
                                <span className="text-purple-400 font-bold">[{MANUAL_BOT_NAME}]</span>
                                {' '}
                                <span className="text-white font-medium">{selectedMatch.homeTeam}</span>
                                {' '}{selectedMatch.homeScore} - {selectedMatch.awayScore}{' '}
                                <span className="text-white font-medium">{selectedMatch.awayTeam}</span>
                                {' '}@ {minute}' →
                                <span className="text-cyan-400 font-bold ml-1">{prediction}</span>
                                <span className={`ml-2 ${accessType === 'vip' ? 'text-yellow-400' : 'text-green-400'}`}>
                                    [{accessType.toUpperCase()}]
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
