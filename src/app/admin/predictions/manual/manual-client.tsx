'use client'

import { useState, useTransition } from 'react'
import {
    PenTool,
    Plus,
    Search,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Clock,
    Send,
    Trash2,
    Edit,
    Calendar,
    Trophy
} from 'lucide-react'
import { ManualPrediction, publishManualPrediction, updateManualResult, deleteManualPrediction } from './actions'

// Stats Card
function StatsCard({ icon: Icon, label, value, color }: {
    icon: any
    label: string
    value: string | number
    color: string
}) {
    return (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    )
}

// Prediction Row
function PredictionRow({ prediction, onPublish, onResult, onDelete }: {
    prediction: ManualPrediction
    onPublish: (id: string) => void
    onResult: (id: string, result: 'won' | 'lost' | 'void') => void
    onDelete: (id: string) => void
}) {
    const [showMenu, setShowMenu] = useState(false)

    const statusColors = {
        draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        published: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        finished: 'bg-green-500/20 text-green-400 border-green-500/30'
    }

    const resultColors = {
        pending: 'text-yellow-400',
        won: 'text-green-400',
        lost: 'text-red-400',
        void: 'text-slate-400'
    }

    const matchDate = prediction.match_date
        ? new Date(prediction.match_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '--'

    return (
        <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group">
            <div className="flex items-center gap-4">
                {/* Match */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{prediction.home_team_name}</span>
                        <span className="text-slate-500">vs</span>
                        <span className="font-medium text-white">{prediction.away_team_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{prediction.competition_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {matchDate}
                        </span>
                    </div>
                </div>

                {/* Prediction */}
                <div className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                    {prediction.prediction_type}
                </div>

                {/* Odds */}
                {prediction.prediction_odds && (
                    <div className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm font-bold">
                        {prediction.prediction_odds.toFixed(2)}
                    </div>
                )}

                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[prediction.status]}`}>
                    {prediction.status === 'draft' ? 'Taslak' : prediction.status === 'published' ? 'Yayında' : 'Sonuçlandı'}
                </div>

                {/* Result */}
                {prediction.result && prediction.result !== 'pending' && (
                    <div className={`flex items-center gap-1 ${resultColors[prediction.result]}`}>
                        {prediction.result === 'won' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                )}

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
                            {prediction.status === 'draft' && (
                                <button
                                    onClick={() => { onPublish(prediction.id); setShowMenu(false) }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-500/10 text-left text-sm text-blue-400"
                                >
                                    <Send size={14} /> Yayınla
                                </button>
                            )}
                            {prediction.status === 'published' && (
                                <>
                                    <button
                                        onClick={() => { onResult(prediction.id, 'won'); setShowMenu(false) }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-green-500/10 text-left text-sm text-green-400"
                                    >
                                        <CheckCircle2 size={14} /> Kazandı
                                    </button>
                                    <button
                                        onClick={() => { onResult(prediction.id, 'lost'); setShowMenu(false) }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-left text-sm text-red-400"
                                    >
                                        <XCircle size={14} /> Kaybetti
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => { onDelete(prediction.id); setShowMenu(false) }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-left text-sm text-red-400"
                            >
                                <Trash2 size={14} /> Sil
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Create Modal
function CreateModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-white mb-6">Yeni Tahmin Ekle</h2>

                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Ev Sahibi</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                placeholder="Barcelona"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Deplasman</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                placeholder="Real Madrid"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Lig</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                            placeholder="La Liga"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Tahmin</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                placeholder="MS 1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Oran</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                placeholder="1.85"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Maç Tarihi</label>
                        <input
                            type="datetime-local"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function ManualPredictionsClientPage({
    initialPredictions
}: {
    initialPredictions: ManualPrediction[]
}) {
    const [predictions, setPredictions] = useState(initialPredictions)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'finished'>('all')
    const [isPending, startTransition] = useTransition()

    // Calculate stats
    const draftCount = predictions.filter(p => p.status === 'draft').length
    const publishedCount = predictions.filter(p => p.status === 'published').length
    const wonCount = predictions.filter(p => p.result === 'won').length
    const lostCount = predictions.filter(p => p.result === 'lost').length
    const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0

    // Filter
    const filteredPredictions = predictions.filter(p =>
        filterStatus === 'all' ? true : p.status === filterStatus
    )

    const handlePublish = async (id: string) => {
        startTransition(async () => {
            const result = await publishManualPrediction(id)
            if (result.success) {
                setPredictions(predictions.map(p =>
                    p.id === id ? { ...p, status: 'published' as const } : p
                ))
            }
        })
    }

    const handleResult = async (id: string, result: 'won' | 'lost' | 'void') => {
        startTransition(async () => {
            const res = await updateManualResult(id, result)
            if (res.success) {
                setPredictions(predictions.map(p =>
                    p.id === id ? { ...p, result, status: 'finished' as const } : p
                ))
            }
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu tahmini silmek istediğinize emin misiniz?')) return
        startTransition(async () => {
            const result = await deleteManualPrediction(id)
            if (result.success) {
                setPredictions(predictions.filter(p => p.id !== id))
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Manuel Tahminler</h1>
                    <p className="text-slate-400">El ile eklenen tahminleri yönetin</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20"
                >
                    <Plus size={20} />
                    Yeni Tahmin
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatsCard
                    icon={PenTool}
                    label="Toplam"
                    value={predictions.length}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatsCard
                    icon={Clock}
                    label="Taslak"
                    value={draftCount}
                    color="bg-gradient-to-br from-slate-500 to-slate-600"
                />
                <StatsCard
                    icon={Send}
                    label="Yayında"
                    value={publishedCount}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatsCard
                    icon={CheckCircle2}
                    label="Kazanan"
                    value={wonCount}
                    color="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatsCard
                    icon={Trophy}
                    label="Win Rate"
                    value={`${winRate}%`}
                    color={winRate >= 60 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'draft', 'published', 'finished'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {status === 'all' ? 'Tümü' : status === 'draft' ? 'Taslak' : status === 'published' ? 'Yayında' : 'Sonuçlanan'}
                    </button>
                ))}
            </div>

            {/* Predictions List */}
            <div className="space-y-3">
                {filteredPredictions.length > 0 ? (
                    filteredPredictions.map((prediction) => (
                        <PredictionRow
                            key={prediction.id}
                            prediction={prediction}
                            onPublish={handlePublish}
                            onResult={handleResult}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <PenTool size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Manuel tahmin yok</h3>
                        <p className="text-slate-400">Yeni bir tahmin ekleyin</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <CreateModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
        </div>
    )
}
