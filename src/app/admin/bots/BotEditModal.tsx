'use client'

import { useState } from 'react'
import {
    Save,
    ArrowLeft
} from 'lucide-react'
import { BotGroup, updateBotGroup } from './actions'

interface BotEditModalProps {
    bot: BotGroup
    onClose: () => void
    onSave: (updatedBot: BotGroup) => void
}

export default function BotEditModal({ bot, onClose, onSave }: BotEditModalProps) {
    const [name, setName] = useState(bot.name)
    const [displayName, setDisplayName] = useState(bot.display_name)
    const [description, setDescription] = useState(bot.description || '')
    const [color, setColor] = useState(bot.color || '#6366f1')
    const [isPublic, setIsPublic] = useState(bot.is_public)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await updateBotGroup(bot.id, {
                name,
                display_name: displayName,
                description,
                color,
            })

            onSave({
                ...bot,
                name,
                display_name: displayName,
                description,
                color,
                is_public: isPublic,
            })
            onClose()
        } catch (error) {
            console.error('Error saving bot:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Preset colors
    const presetColors = [
        '#22C55E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
        '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
    ]

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: color }}
                        >
                            {name.charAt(0)}
                        </div>
                        Bot Düzenle
                    </h2>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Ad (Sistem Adı)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20"
                            placeholder="ALERT-D"
                        />
                    </div>

                    {/* Display Name */}
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Açıklama</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 resize-none"
                            placeholder="Bot hakkında kısa açıklama..."
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">Renk</label>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2 flex-wrap">
                                {presetColors.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-lg transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a]' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                            />
                        </div>
                    </div>

                    {/* Public Toggle */}
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                        <div>
                            <div className="text-sm font-medium text-white">Açık (Public)</div>
                            <div className="text-xs text-slate-500">Kullanıcılara gösterilsin mi?</div>
                        </div>
                        <button
                            onClick={() => setIsPublic(!isPublic)}
                            className={`relative w-12 h-6 rounded-full transition-all ${isPublic ? 'bg-green-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
                    >
                        <ArrowLeft size={16} />
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm text-white font-medium transition-colors disabled:opacity-50"
                    >
                        <Save size={16} />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    )
}
