'use client'

import { useState } from 'react'
import {
    List,
    Plus,
    Search,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    MoreVertical,
    Send,
    Trash2,
    Copy
} from 'lucide-react'

// Mock data for prediction lists/groups
const predictionLists = [
    {
        id: '1',
        name: 'Günün Kombine',
        description: 'Bugünün en iyi 5 maçı',
        predictions: 5,
        status: 'published',
        result: 'pending',
        totalOdds: 12.5,
        createdAt: '2024-12-10T10:00:00Z'
    },
    {
        id: '2',
        name: 'Hafta Sonu Özel',
        description: 'Hafta sonu Premier League ve La Liga',
        predictions: 8,
        status: 'published',
        result: 'won',
        totalOdds: 45.2,
        createdAt: '2024-12-08T10:00:00Z'
    },
    {
        id: '3',
        name: 'Champions League',
        description: 'Şampiyonlar Ligi maçları',
        predictions: 4,
        status: 'draft',
        result: null,
        totalOdds: 8.9,
        createdAt: '2024-12-09T14:00:00Z'
    },
    {
        id: '4',
        name: 'Banker Kuponlar',
        description: 'Düşük riskli tahminler',
        predictions: 3,
        status: 'published',
        result: 'lost',
        totalOdds: 3.2,
        createdAt: '2024-12-07T10:00:00Z'
    },
]

// List Row
function ListRow({ list }: { list: typeof predictionLists[0] }) {
    const [showMenu, setShowMenu] = useState(false)

    const statusColors: Record<string, string> = {
        draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        published: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }

    const resultColors: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-400',
        won: 'bg-green-500/20 text-green-400',
        lost: 'bg-red-500/20 text-red-400',
    }

    const createdAt = new Date(list.createdAt).toLocaleDateString('tr-TR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })

    return (
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <List size={24} className="text-purple-400" />
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="font-medium text-white text-lg">{list.name}</div>
                    <div className="text-sm text-slate-500">{list.description}</div>
                </div>

                {/* Predictions Count */}
                <div className="text-center">
                    <div className="text-lg font-bold text-white">{list.predictions}</div>
                    <div className="text-xs text-slate-500">Tahmin</div>
                </div>

                {/* Total Odds */}
                <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{list.totalOdds}</div>
                    <div className="text-xs text-slate-500">Toplam Oran</div>
                </div>

                {/* Status */}
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[list.status]}`}>
                    {list.status === 'draft' ? 'Taslak' : 'Yayında'}
                </div>

                {/* Result */}
                {list.result && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${resultColors[list.result]}`}>
                        {list.result === 'won' ? <CheckCircle2 size={14} /> :
                            list.result === 'lost' ? <XCircle size={14} /> :
                                <Clock size={14} />}
                        {list.result === 'won' ? 'Kazandı' : list.result === 'lost' ? 'Kaybetti' : 'Bekliyor'}
                    </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Calendar size={14} />
                    {createdAt}
                </div>

                {/* Actions */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical size={18} className="text-slate-400" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-10 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-left text-sm text-slate-300">
                                <Send size={14} /> Yayınla
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/5 text-left text-sm text-slate-300">
                                <Copy size={14} /> Kopyala
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-left text-sm text-red-400">
                                <Trash2 size={14} /> Sil
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function PredictionListsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all')

    // Filter lists
    const filteredLists = predictionLists.filter(list => {
        const matchesSearch = !searchQuery ||
            list.name.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = filterStatus === 'all' || list.status === filterStatus

        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tahmin Listeleri</h1>
                    <p className="text-slate-400">Kombine ve grup tahminlerini yönetin</p>
                </div>

                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all">
                    <Plus size={20} />
                    Yeni Liste
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-white mb-1">{predictionLists.length}</div>
                    <div className="text-xs text-slate-500">Toplam Liste</div>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{predictionLists.filter(l => l.status === 'published').length}</div>
                    <div className="text-xs text-slate-500">Yayında</div>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-green-400 mb-1">{predictionLists.filter(l => l.result === 'won').length}</div>
                    <div className="text-xs text-slate-500">Kazanan</div>
                </div>
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-red-400 mb-1">{predictionLists.filter(l => l.result === 'lost').length}</div>
                    <div className="text-xs text-slate-500">Kaybeden</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Liste ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 transition-all"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                    {(['all', 'draft', 'published'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {status === 'all' ? 'Tümü' : status === 'draft' ? 'Taslak' : 'Yayında'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lists */}
            <div className="space-y-3">
                {filteredLists.map((list) => (
                    <ListRow key={list.id} list={list} />
                ))}
            </div>

            {filteredLists.length === 0 && (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                    <List size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Liste bulunamadı</h3>
                    <p className="text-slate-400">Yeni bir liste oluşturun</p>
                </div>
            )}
        </div>
    )
}
