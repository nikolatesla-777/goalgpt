'use client'

import { useState } from 'react'
import {
    Trophy,
    Search,
    Globe,
    Flag,
    CheckCircle2,
    XCircle,
    Bot,
    Plus,
    Settings
} from 'lucide-react'

// Mock data for competitions - will be replaced with real data from API-Football
const competitions = [
    { id: '1', name: 'UEFA Champions League', country: 'Europe', logo: null, bots: ['ALERT: D', 'Alert Code: 2'], enabled: true },
    { id: '2', name: 'Premier League', country: 'England', logo: null, bots: ['ALERT: D', 'AlertCode: 17'], enabled: true },
    { id: '3', name: 'La Liga', country: 'Spain', logo: null, bots: ['Alert Code: 2', 'AlertCode: 31'], enabled: true },
    { id: '4', name: 'Bundesliga', country: 'Germany', logo: null, bots: ['ALERT: D'], enabled: true },
    { id: '5', name: 'Serie A', country: 'Italy', logo: null, bots: ['AlertCode: 17'], enabled: true },
    { id: '6', name: 'Ligue 1', country: 'France', logo: null, bots: ['Alert System'], enabled: false },
    { id: '7', name: 'Süper Lig', country: 'Turkey', logo: null, bots: ['ALERT: D', 'Alert Code: 2', 'AlertCode: 31'], enabled: true },
    { id: '8', name: 'Eredivisie', country: 'Netherlands', logo: null, bots: [], enabled: false },
]

const botColors: Record<string, string> = {
    'ALERT: D': '#10B981',
    'Alert Code: 2': '#6366F1',
    'AlertCode: 17': '#EC4899',
    'AlertCode: 31': '#F59E0B',
    'Alert System': '#14B8A6',
}

// Competition Row
function CompetitionRow({ comp, onToggle }: { comp: typeof competitions[0], onToggle: () => void }) {
    return (
        <div className={`bg-gradient-to-br from-white/[0.03] to-transparent border rounded-xl p-4 transition-all ${comp.enabled ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-60'
            }`}>
            <div className="flex items-center gap-4">
                {/* Competition Logo/Flag */}
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    {comp.logo ? (
                        <img src={comp.logo} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                        <Trophy size={24} className="text-yellow-400" />
                    )}
                </div>

                {/* Competition Info */}
                <div className="flex-1">
                    <div className="font-medium text-white text-lg">{comp.name}</div>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Flag size={12} />
                        {comp.country}
                    </div>
                </div>

                {/* Assigned Bots */}
                <div className="flex items-center gap-2">
                    {comp.bots.length > 0 ? (
                        comp.bots.map((bot) => (
                            <div
                                key={bot}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: botColors[bot] || '#64748B' }}
                                title={bot}
                            >
                                {bot.charAt(0)}
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-slate-500">Bot atanmamış</span>
                    )}

                    <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-all">
                        <Plus size={16} />
                    </button>
                </div>

                {/* Toggle */}
                <button
                    onClick={onToggle}
                    className={`relative w-12 h-6 rounded-full transition-all ${comp.enabled ? 'bg-green-500' : 'bg-slate-600'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${comp.enabled ? 'left-7' : 'left-1'}`} />
                </button>
            </div>
        </div>
    )
}

export default function BotCompetitionsPage() {
    const [comps, setComps] = useState(competitions)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all')

    // Filter competitions
    const filteredComps = comps.filter(comp => {
        const matchesSearch = !searchQuery ||
            comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comp.country.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filterEnabled === 'all' ? true :
            filterEnabled === 'enabled' ? comp.enabled : !comp.enabled

        return matchesSearch && matchesFilter
    })

    const handleToggle = (id: string) => {
        setComps(comps.map(c =>
            c.id === id ? { ...c, enabled: !c.enabled } : c
        ))
    }

    // Stats
    const enabledCount = comps.filter(c => c.enabled).length
    const totalBotAssignments = comps.reduce((sum, c) => sum + c.bots.length, 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Lig Eşleştirme</h1>
                    <p className="text-slate-400">Botların takip ettiği ligleri yönetin</p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all">
                    <Plus size={20} />
                    Yeni Lig Ekle
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                            <Globe size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{comps.length}</div>
                    <div className="text-xs text-slate-500">Toplam Lig</div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <CheckCircle2 size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{enabledCount}</div>
                    <div className="text-xs text-slate-500">Aktif Lig</div>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{totalBotAssignments}</div>
                    <div className="text-xs text-slate-500">Bot Ataması</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Lig veya ülke ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 transition-all"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    {(['all', 'enabled', 'disabled'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setFilterEnabled(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterEnabled === filter
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {filter === 'all' ? 'Tümü' : filter === 'enabled' ? 'Aktif' : 'Pasif'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Competitions List */}
            <div className="space-y-3">
                {filteredComps.map((comp) => (
                    <CompetitionRow
                        key={comp.id}
                        comp={comp}
                        onToggle={() => handleToggle(comp.id)}
                    />
                ))}
            </div>

            {filteredComps.length === 0 && (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                    <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Lig bulunamadı</h3>
                    <p className="text-slate-400">Arama kriterlerinizi değiştirin</p>
                </div>
            )}
        </div>
    )
}
