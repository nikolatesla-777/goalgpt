'use client'

import { useState } from 'react'
import { Search, MoreVertical, ShieldCheck, Ban, CheckCircle2, SlidersHorizontal, User, KeyRound } from 'lucide-react'

import CreatePartnerModal from './CreatePartnerModal'
import ResetPasswordModal from './ResetPasswordModal'

// Define the shape of Partner Data coming from Supabase
export interface Partner {
    id: string
    ref_code: string
    tier: string
    commission_rate: number
    balance: number
    total_earnings: number
    status: string
    profile: {
        email: string
        full_name: string
        avatar_url: string
    }
}

interface PartnerClientTableProps {
    initialPartners: Partner[]
}

export default function PartnerClientTable({ initialPartners }: PartnerClientTableProps) {
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    // Action State
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null) // Partner ID

    // Close dropdown on outside click (simplified)
    // In a real app we'd use a hook or overlay. For now, strict button control.

    // Simple Client-side filtering
    const filteredPartners = initialPartners.filter(p => {
        const matchesFilter = filter === 'all' ? true :
            filter === 'active' ? true : // TODO: Real status check
                filter === 'pending' ? false : // TODO: Approval flow
                    false // banned

        const matchesSearch = p.profile.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.profile.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.ref_code?.toLowerCase().includes(search.toLowerCase())

        return matchesFilter && matchesSearch
    })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" onClick={() => setActiveDropdown(null)}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Partner Yönetimi</h1>
                    <p className="text-slate-400 text-sm mt-1">Sistemdeki tüm partnerleri buradan onaylayabilir veya yasaklayabilirsiniz.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold border border-white/10 transition-all flex items-center gap-2">
                        <SlidersHorizontal size={16} />
                        Filtrele
                    </button>
                    <CreatePartnerModal />
                </div>
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 bg-[#0a0a0a] border border-white/5 p-1 rounded-xl w-full md:w-fit">
                    {['all', 'active', 'pending', 'banned'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === tab ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {tab === 'all' ? 'Tümü' : tab === 'active' ? 'Aktif' : tab === 'pending' ? 'Bekleyen' : 'Yasaklı'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="İsim, E-posta veya Ref Kodu..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm text-white focus:outline-none focus:border-red-500/30 transition-all placeholder:text-slate-700"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-white/5 text-slate-500 font-bold border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Partner</th>
                            <th className="px-6 py-4">Ref Kodu</th>
                            <th className="px-6 py-4">Lig</th>
                            <th className="px-6 py-4">Oran</th>
                            <th className="px-6 py-4 text-right">Bakiye</th>
                            <th className="px-6 py-4 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPartners.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-600">
                                    Kayıt bulunamadı.
                                </td>
                            </tr>
                        ) : filteredPartners.map((partner) => (
                            <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors group relative">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0 overflow-hidden">
                                            {partner.profile.avatar_url ? (
                                                <img src={partner.profile.avatar_url} alt={partner.profile.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                partner.profile.full_name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{partner.profile.full_name || 'İsimsiz'}</p>
                                            <p className="text-xs text-slate-500">{partner.profile.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-300">
                                    {partner.ref_code}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${partner.tier === 'gold' ? 'text-yellow-500' :
                                        partner.tier === 'silver' ? 'text-slate-300' : 'text-orange-400'
                                        }`}>
                                        {partner.tier.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-white font-mono">
                                    %{partner.commission_rate}
                                </td>
                                <td className="px-6 py-4 text-right text-white font-mono font-bold">
                                    ₺{partner.balance.toLocaleString('tr-TR')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setActiveDropdown(activeDropdown === partner.id ? null : partner.id)
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${activeDropdown === partner.id ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Custom Dropdown */}
                                        {activeDropdown === partner.id && (
                                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col p-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedPartner(partner)
                                                        setIsPasswordModalOpen(true)
                                                        setActiveDropdown(null)
                                                    }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                                                >
                                                    <div className="w-6 h-6 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                                        <KeyRound size={14} />
                                                    </div>
                                                    Şifre Değiştir
                                                </button>
                                                <button
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                                                >
                                                    <div className="w-6 h-6 rounded bg-red-500/10 flex items-center justify-center text-red-500">
                                                        <Ban size={14} />
                                                    </div>
                                                    Yasakla (Ban)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {selectedPartner && (
                <ResetPasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    userId={selectedPartner.id}
                    partnerName={selectedPartner.profile.full_name}
                />
            )}
        </div>
    )
}
