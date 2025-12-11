'use client'

import { useState, useTransition } from 'react'
import {
    Bot,
    Plus,
    Search,
    MoreVertical,
    TrendingUp,
    TrendingDown,
    Eye,
    EyeOff,
    Power,
    Pencil,
    Trash2,
    Trophy,
    Target,
    Zap,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { BotGroup, BotGroupStats, toggleBotStatus, toggleBotPublic, deleteBotGroup, getBotGroups } from './actions'
import BotEditModal from './BotEditModal'
import BotCreateModal from './BotCreateModal'

// Mini sparkline component
function Sparkline({ winRate }: { winRate: number }) {
    const color = winRate >= 70 ? '#22c55e' : winRate >= 50 ? '#eab308' : '#ef4444'
    const width = Math.min(winRate, 100)

    return (
        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: color }}
            />
        </div>
    )
}

// Stats Card component
function StatsCard({ icon: Icon, label, value, subValue, color }: {
    icon: any
    label: string
    value: string | number
    subValue?: string
    color: string
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={18} className="text-white" />
                </div>
                <span className="text-sm text-slate-500">{label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
            {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
        </div>
    )
}

// Bot Card component
function BotCard({ bot, onToggleStatus, onTogglePublic, onEdit, onDelete }: {
    bot: BotGroup
    onToggleStatus: (id: string, status: boolean) => void
    onTogglePublic: (id: string, status: boolean) => void
    onEdit: (bot: BotGroup) => void
    onDelete: (id: string) => void
}) {
    const [showMenu, setShowMenu] = useState(false)
    const [isPending, startTransition] = useTransition()

    const winRateColor = bot.win_rate >= 70 ? 'text-green-600' : bot.win_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
    const winRateBg = bot.win_rate >= 70 ? 'bg-green-50' : bot.win_rate >= 50 ? 'bg-yellow-50' : 'bg-red-50'

    return (
        <div className={`bg-white border rounded-xl p-5 transition-all hover:shadow-md ${bot.is_active ? 'border-slate-200 shadow-sm' : 'border-red-200 opacity-60'}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: bot.color || '#6366f1' }}
                    >
                        {bot.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">{bot.name}</h3>
                        <p className="text-sm text-slate-500">{bot.display_name}</p>
                    </div>
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <MoreVertical size={18} className="text-slate-400" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                            <button
                                onClick={() => { onEdit(bot); setShowMenu(false) }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm text-slate-700"
                            >
                                <Pencil size={16} /> Düzenle
                            </button>
                            <button
                                onClick={() => { onTogglePublic(bot.id, !bot.is_public); setShowMenu(false) }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left text-sm text-slate-700"
                            >
                                {bot.is_public ? <EyeOff size={16} /> : <Eye size={16} />}
                                {bot.is_public ? 'Gizle' : 'Yayınla'}
                            </button>
                            <button
                                onClick={() => { onDelete(bot.id); setShowMenu(false) }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-left text-sm text-red-600"
                            >
                                <Trash2 size={16} /> Sil
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-xs text-slate-500 mb-1">Tahmin Sayısı</div>
                    <div className="text-lg font-bold text-slate-800">{bot.total_predictions}</div>
                </div>
                <div className={`${winRateBg} rounded-lg p-3`}>
                    <div className="text-xs text-slate-500 mb-1">Başarı Oranı</div>
                    <div className={`text-lg font-bold ${winRateColor} flex items-center gap-2`}>
                        {bot.win_rate}%
                        {bot.win_rate >= 50 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                </div>
            </div>

            {/* Win Rate Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Win Rate</span>
                    <span>{bot.winning_predictions} / {bot.total_predictions}</span>
                </div>
                <Sparkline winRate={bot.win_rate} />
            </div>

            {/* Dates */}
            <div className="flex justify-between text-[10px] text-slate-400 mb-3">
                <span>Oluşturma: {new Date(bot.created_at).toLocaleDateString('tr-TR')} {new Date(bot.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span>Güncelleme: {new Date(bot.updated_at).toLocaleDateString('tr-TR')} {new Date(bot.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            {/* Footer with toggles */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    {bot.is_public ? (
                        <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-medium">
                            <Eye size={12} /> Yayında
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-medium">
                            <EyeOff size={12} /> Gizli
                        </span>
                    )}
                </div>

                {/* Active Toggle */}
                <button
                    onClick={() => startTransition(() => onToggleStatus(bot.id, !bot.is_active))}
                    disabled={isPending}
                    className={`relative w-11 h-6 rounded-full transition-all ${bot.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${bot.is_active ? 'left-6' : 'left-1'}`} />
                </button>
            </div>
        </div>
    )
}

export default function BotsClientPage({
    initialBots,
    stats
}: {
    initialBots: BotGroup[]
    stats: BotGroupStats
}) {
    const [bots, setBots] = useState(initialBots)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingBot, setEditingBot] = useState<BotGroup | null>(null)

    // Filter bots
    const filteredBots = bots.filter(bot => {
        const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bot.display_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterActive === 'all' ? true :
            filterActive === 'active' ? bot.is_active : !bot.is_active
        return matchesSearch && matchesFilter
    })

    const handleToggleStatus = async (id: string, status: boolean) => {
        const result = await toggleBotStatus(id, status)
        if (result.success) {
            setBots(bots.map(b => b.id === id ? { ...b, is_active: status } : b))
        }
    }

    const handleTogglePublic = async (id: string, status: boolean) => {
        const result = await toggleBotPublic(id, status)
        if (result.success) {
            setBots(bots.map(b => b.id === id ? { ...b, is_public: status } : b))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu botu silmek istediğinize emin misiniz?')) return
        const result = await deleteBotGroup(id)
        if (result.success) {
            setBots(bots.filter(b => b.id !== id))
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Bot Yönetimi</h1>
                    <p className="text-slate-500 text-sm">AI tahmin botlarını yönetin ve performanslarını takip edin</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Yeni Bot Ekle
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    icon={Bot}
                    label="Toplam Bot"
                    value={stats.totalBots}
                    subValue={`${stats.activeBots} aktif`}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatsCard
                    icon={Target}
                    label="Toplam Tahmin"
                    value={stats.totalPredictions.toLocaleString()}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard
                    icon={Trophy}
                    label="Ortalama Win Rate"
                    value={`${stats.avgWinRate}%`}
                    subValue={stats.avgWinRate >= 60 ? 'Başarılı' : 'Geliştirilmeli'}
                    color={stats.avgWinRate >= 60 ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-yellow-500 to-yellow-600'}
                />
                <StatsCard
                    icon={Zap}
                    label="Aktif Botlar"
                    value={stats.activeBots}
                    subValue={`${stats.totalBots - stats.activeBots} devre dışı`}
                    color="bg-gradient-to-br from-orange-500 to-orange-600"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Bot ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-11 pr-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setFilterActive(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterActive === filter
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {filter === 'all' ? 'Tümü' : filter === 'active' ? 'Aktif' : 'Devre Dışı'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBots.map((bot) => (
                    <BotCard
                        key={bot.id}
                        bot={bot}
                        onToggleStatus={handleToggleStatus}
                        onTogglePublic={handleTogglePublic}
                        onEdit={setEditingBot}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredBots.length === 0 && (
                <div className="text-center py-16">
                    <Bot size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Bot bulunamadı</h3>
                    <p className="text-slate-500 text-sm">Arama kriterlerinizi değiştirin veya yeni bot ekleyin</p>
                </div>
            )}

            {/* Bot Edit Modal */}
            {editingBot && (
                <BotEditModal
                    bot={editingBot}
                    onClose={() => setEditingBot(null)}
                    onSave={(updatedBot) => {
                        setBots(bots.map(b => b.id === updatedBot.id ? updatedBot : b))
                        setEditingBot(null)
                    }}
                />
            )}

            {/* Bot Create Modal */}
            {showCreateModal && (
                <BotCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={async () => {
                        // Refresh bot list after creation
                        const newBots = await getBotGroups()
                        setBots(newBots)
                        setShowCreateModal(false)
                    }}
                />
            )}
        </div>
    )
}
