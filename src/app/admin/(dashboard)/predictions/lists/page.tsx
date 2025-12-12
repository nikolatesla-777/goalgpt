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
    Copy,
    LayoutGrid,
    Filter
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

    // Status Badge Styles
    const statusBadges: Record<string, string> = {
        draft: 'bg-slate-100 text-slate-600 border-slate-200',
        published: 'bg-blue-50 text-blue-600 border-blue-200 ring-blue-500/10',
    }

    // Result Badge Styles
    const resultBadges: Record<string, string> = {
        pending: 'bg-amber-50 text-amber-600 border-amber-200',
        won: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        lost: 'bg-red-50 text-red-600 border-red-200',
    }

    const createdAt = new Date(list.createdAt).toLocaleDateString('tr-TR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-center">
                    <List size={22} className="text-purple-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg truncate">{list.name}</h3>
                        {list.status === 'published' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                YAYINDA
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">{list.description}</p>
                </div>

                {/* Metrics */}
                <div className="hidden sm:flex items-center gap-8 mr-4">
                    <div className="text-center">
                        <div className="text-lg font-bold text-slate-800">{list.predictions}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Tahmin</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{list.totalOdds}</div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Oran</div>
                    </div>
                </div>

                {/* Result */}
                <div className="hidden md:block w-32">
                    {list.result ? (
                        <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${resultBadges[list.result]}`}>
                            {list.result === 'won' ? <CheckCircle2 size={16} /> :
                                list.result === 'lost' ? <XCircle size={16} /> :
                                    <Clock size={16} />}
                            {list.result === 'won' ? 'Kazandı' : list.result === 'lost' ? 'Kaybetti' : 'Bekliyor'}
                        </div>
                    ) : (
                        <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${statusBadges[list.status]}`}>
                            Taslak
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400 w-24 justify-end">
                    <Calendar size={14} />
                    {createdAt}
                </div>

                {/* Actions */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                                <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-left text-sm font-medium text-slate-600">
                                    <Send size={16} className="text-slate-400" /> Yayınla
                                </button>
                                <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-left text-sm font-medium text-slate-600">
                                    <Copy size={16} className="text-slate-400" /> Kopyala
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-left text-sm font-medium text-red-600">
                                    <Trash2 size={16} /> Sil
                                </button>
                            </div>
                        </>
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

    const stats = {
        total: predictionLists.length,
        published: predictionLists.filter(l => l.status === 'published').length,
        won: predictionLists.filter(l => l.result === 'won').length,
        lost: predictionLists.filter(l => l.result === 'lost').length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Tahmin Listeleri</h1>
                    <p className="text-slate-500 text-sm">Kombine kuponları ve özel listeleri buradan yönetebilirsiniz.</p>
                </div>

                <button className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95">
                    <Plus size={18} />
                    Yeni Liste
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-slate-800 mb-1">{stats.total}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Toplam Liste</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{stats.published}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Yayında</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">{stats.won}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Kazanan</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-2xl font-bold text-red-600 mb-1">{stats.lost}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Kaybeden</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                {/* Status Filter Tabs */}
                <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm w-full sm:w-auto">
                    {(['all', 'draft', 'published'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterStatus === status
                                ? 'bg-slate-100 text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {status === 'all' ? 'Tümü' : status === 'draft' ? 'Taslak' : 'Yayında'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Liste ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Lists */}
            <div className="space-y-3">
                {filteredLists.length > 0 ? (
                    filteredLists.map((list) => (
                        <ListRow key={list.id} list={list} />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Liste bulunamadı</h3>
                        <p className="text-slate-500 text-sm">Arama kriterlerinize uygun liste yok.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
