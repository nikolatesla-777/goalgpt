'use client'

import { useState } from 'react'
import {
    Save,
    ArrowLeft,
    Search,
    Check,
    ChevronLeft,
    ChevronRight,
    Globe
} from 'lucide-react'
import { createBotGroup } from './actions'

// Sample competitions data matching TheSports structure
interface Competition {
    id: string
    externalId: string
    countryId: string
    countryName: string
    countryFlag: string
    name: string
    isSelected: boolean
}

const sampleCompetitions: Competition[] = [
    // Afghanistan
    { id: '1', externalId: 'AFG_CL', countryId: 'AF', countryName: 'Afghanistan', countryFlag: '🇦🇫', name: 'Afghanistan Champions League', isSelected: true },
    // Albania
    { id: '2', externalId: 'ALB_CUP', countryId: 'AL', countryName: 'Albania', countryFlag: '🇦🇱', name: 'Albanian Cup', isSelected: true },
    { id: '3', externalId: 'ALB_D1', countryId: 'AL', countryName: 'Albania', countryFlag: '🇦🇱', name: 'Albanian Division 1', isSelected: true },
    { id: '4', externalId: 'ALB_SC', countryId: 'AL', countryName: 'Albania', countryFlag: '🇦🇱', name: 'Albanian Super Cup', isSelected: true },
    { id: '5', externalId: 'ALB_SL', countryId: 'AL', countryName: 'Albania', countryFlag: '🇦🇱', name: 'Albanian Super league', isSelected: true },
    // Algeria
    { id: '6', externalId: 'ALG_RL', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'ALG RL', isSelected: true },
    { id: '7', externalId: 'ALG_CUP', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algeria Cup', isSelected: true },
    { id: '8', externalId: 'ALG_L1', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algerian Ligue Professionnelle 1', isSelected: true },
    { id: '9', externalId: 'ALG_L2', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algerian Ligue Professionnelle 2', isSelected: true },
    { id: '10', externalId: 'ALG_RES', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algeria Reserve League', isSelected: true },
    { id: '11', externalId: 'ALG_SC', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algeria Super Cup', isSelected: true },
    { id: '12', externalId: 'ALG_U19', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algeria U19 Youth League', isSelected: true },
    { id: '13', externalId: 'ALG_U21', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algeria U21-2 Youth League', isSelected: true },
    { id: '14', externalId: 'ALG_U21C', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Algeria U21 Cup', isSelected: true },
    { id: '15', externalId: 'ALG_WC', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: "Algeria Women's Cup", isSelected: true },
    { id: '16', externalId: 'ALG_WL', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: "Algeria Women's League", isSelected: true },
    { id: '17', externalId: 'ALG_ASC', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'Alge-SC', isSelected: true },
    { id: '18', externalId: 'ALG_LC', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'ALG LC', isSelected: true },
    { id: '19', externalId: 'ALG_U20', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'ALG U20', isSelected: true },
    { id: '20', externalId: 'ALG_U21B', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'ALG U21', isSelected: true },
    { id: '21', externalId: 'ALG_UC', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'ALG UC', isSelected: true },
    { id: '22', externalId: 'ALG_AR', countryId: 'DZ', countryName: 'Algeria', countryFlag: '🇩🇿', name: 'AR Cup', isSelected: true },
    // Andorra
    { id: '23', externalId: 'AND_CUP', countryId: 'AD', countryName: 'Andorra', countryFlag: '🇦🇩', name: 'Andorran Cup', isSelected: true },
    { id: '24', externalId: 'AND_PD', countryId: 'AD', countryName: 'Andorra', countryFlag: '🇦🇩', name: 'Andorran Primera Divisio', isSelected: true },
    // Turkey
    { id: '25', externalId: 'TUR_SL', countryId: 'TR', countryName: 'Turkey', countryFlag: '🇹🇷', name: 'Süper Lig', isSelected: true },
    { id: '26', externalId: 'TUR_1L', countryId: 'TR', countryName: 'Turkey', countryFlag: '🇹🇷', name: '1. Lig', isSelected: true },
    { id: '27', externalId: 'TUR_2L', countryId: 'TR', countryName: 'Turkey', countryFlag: '🇹🇷', name: '2. Lig', isSelected: true },
    { id: '28', externalId: 'TUR_CUP', countryId: 'TR', countryName: 'Turkey', countryFlag: '🇹🇷', name: 'Türkiye Kupası', isSelected: true },
    // England
    { id: '29', externalId: 'ENG_PL', countryId: 'GB', countryName: 'England', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Premier League', isSelected: true },
    { id: '30', externalId: 'ENG_CH', countryId: 'GB', countryName: 'England', countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'Championship', isSelected: true },
    // Spain
    { id: '31', externalId: 'ESP_LL', countryId: 'ES', countryName: 'Spain', countryFlag: '🇪🇸', name: 'La Liga', isSelected: true },
    { id: '32', externalId: 'ESP_L2', countryId: 'ES', countryName: 'Spain', countryFlag: '🇪🇸', name: 'La Liga 2', isSelected: true },
    // Germany
    { id: '33', externalId: 'DEU_BL', countryId: 'DE', countryName: 'Germany', countryFlag: '🇩🇪', name: 'Bundesliga', isSelected: true },
    { id: '34', externalId: 'DEU_BL2', countryId: 'DE', countryName: 'Germany', countryFlag: '🇩🇪', name: '2. Bundesliga', isSelected: true },
    // France
    { id: '35', externalId: 'FRA_L1', countryId: 'FR', countryName: 'France', countryFlag: '🇫🇷', name: 'Ligue 1', isSelected: true },
    // Italy
    { id: '36', externalId: 'ITA_SA', countryId: 'IT', countryName: 'Italy', countryFlag: '🇮🇹', name: 'Serie A', isSelected: true },
    { id: '37', externalId: 'ITA_SB', countryId: 'IT', countryName: 'Italy', countryFlag: '🇮🇹', name: 'Serie B', isSelected: true },
    // UEFA
    { id: '38', externalId: 'UEFA_CL', countryId: 'EU', countryName: 'Europe', countryFlag: '🇪🇺', name: 'UEFA Champions League', isSelected: true },
    { id: '39', externalId: 'UEFA_EL', countryId: 'EU', countryName: 'Europe', countryFlag: '🇪🇺', name: 'UEFA Europa League', isSelected: true },
]

const ITEMS_PER_PAGE = 25

interface BotCreateModalProps {
    onClose: () => void
    onCreated: () => void
}

export default function BotCreateModal({ onClose, onCreated }: BotCreateModalProps) {
    const [name, setName] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [competitions, setCompetitions] = useState<Competition[]>(sampleCompetitions)
    const [currentPage, setCurrentPage] = useState(1)
    const [isSaving, setIsSaving] = useState(false)

    // Filter competitions
    const filteredCompetitions = competitions.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.countryName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination
    const totalPages = Math.ceil(filteredCompetitions.length / ITEMS_PER_PAGE)
    const paginatedCompetitions = filteredCompetitions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Selected leagues count
    const selectedCount = competitions.filter(c => c.isSelected).length

    const toggleCompetition = (id: string) => {
        setCompetitions(prev => prev.map(c =>
            c.id === id ? { ...c, isSelected: !c.isSelected } : c
        ))
    }

    const toggleAll = () => {
        const allSelected = paginatedCompetitions.every(c => c.isSelected)
        const idsToToggle = new Set(paginatedCompetitions.map(c => c.id))
        setCompetitions(prev => prev.map(c =>
            idsToToggle.has(c.id) ? { ...c, isSelected: !allSelected } : c
        ))
    }

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Bot adı zorunludur')
            return
        }

        setIsSaving(true)
        try {
            const result = await createBotGroup({
                name: name.trim(),
                display_name: displayName.trim() || name.trim(),
                description: '',
                color: '#10B981'
            })

            if (result.success) {
                // TODO: Save competition selections to bot_competition_config table
                onCreated()
                onClose()
            } else {
                alert('Bot oluşturulurken hata: ' + result.error)
            }
        } catch (error) {
            console.error('Error creating bot:', error)
            alert('Bot oluşturulurken hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">🤖 Yeni Bot Grubu Oluştur</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Geri Dön
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm text-white font-medium transition-colors disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-6 border-b border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Ad</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                placeholder="ALERT-D"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Görünüm Adı</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                                placeholder="Alert D - Live Goals"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <label className="text-sm text-slate-400">Takma Ad</label>
                        <span className="text-sm text-white bg-white/5 px-3 py-1 rounded">{name || '-'}</span>

                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-slate-400">Açık (Public)</span>
                            <button
                                onClick={() => setIsPublic(!isPublic)}
                                className={`relative w-12 h-6 rounded-full transition-all ${isPublic ? 'bg-blue-500' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* League Selection Section */}
                <div className="flex-1 overflow-hidden flex flex-col p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Lig Seç</h3>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                                    placeholder="Ülke, lig adı..."
                                    className="w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
                                />
                            </div>
                            <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm text-white transition-colors">
                                <Search size={14} />
                                Ara
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto bg-white/[0.02] border border-white/10 rounded-xl">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-[#0f0f1a] z-10">
                                <tr className="border-b border-white/10">
                                    <th className="text-left px-4 py-3 text-xs text-slate-400 w-16">
                                        <button onClick={toggleAll} className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${paginatedCompetitions.every(c => c.isSelected)
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-white/20 hover:border-white/40'
                                                }`}>
                                                {paginatedCompetitions.every(c => c.isSelected) && <Check size={12} className="text-white" />}
                                            </div>
                                            Tümü
                                        </button>
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs text-slate-400 w-12">#</th>
                                    <th className="text-left px-4 py-3 text-xs text-slate-400 w-12">Ülke</th>
                                    <th className="text-left px-4 py-3 text-xs text-slate-400 w-[180px]">Ülke Adı</th>
                                    <th className="text-left px-4 py-3 text-xs text-slate-400 w-12">Lig</th>
                                    <th className="text-left px-4 py-3 text-xs text-slate-400">Lig Adı</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCompetitions.map((comp, index) => (
                                    <tr
                                        key={comp.id}
                                        className={`border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors ${comp.isSelected ? 'bg-green-500/5' : ''}`}
                                        onClick={() => toggleCompetition(comp.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${comp.isSelected
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-white/20'
                                                }`}>
                                                {comp.isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-xl">{comp.countryFlag}</td>
                                        <td className="px-4 py-3 text-sm text-white">{comp.countryName}</td>
                                        <td className="px-4 py-3">
                                            <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center">
                                                <Globe size={14} className="text-slate-400" />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white">{comp.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            Toplam: <span className="text-white font-bold">{filteredCompetitions.length}</span> |
                            Seçili: <span className="text-green-400 font-bold">{selectedCount} lig</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm text-white disabled:opacity-30"
                            >
                                İlk
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30"
                            >
                                <ChevronLeft size={16} className="text-white" />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum = i + 1
                                    if (totalPages > 5) {
                                        if (currentPage <= 3) pageNum = i + 1
                                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                                        else pageNum = currentPage - 2 + i
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${currentPage === pageNum
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 bg-white/5 hover:bg-white/10 rounded disabled:opacity-30"
                            >
                                <ChevronRight size={16} className="text-white" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-sm text-white disabled:opacity-30"
                            >
                                Son
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
