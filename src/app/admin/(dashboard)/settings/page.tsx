'use client'

import { Save, Shield, Star, Crown, Zap, Key, Database } from 'lucide-react'

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sistem Ayarları ⚙️</h1>
                    <p className="text-slate-500 text-sm mt-1">Global komisyon oranlarını ve sistem parametrelerini buradan yönet.</p>
                </div>
                <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
                    <Save size={16} />
                    <span>Ayarları Kaydet</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Commission Rules */}
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Zap size={18} className="text-yellow-500" />
                        Komisyon Oranları
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm">

                        {/* Bronze */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                <Shield size={18} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bronz Komisyonu</label>
                                <div className="relative">
                                    <input type="number" defaultValue="10" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Silver */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <Star size={18} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gümüş Komisyonu</label>
                                <div className="relative">
                                    <input type="number" defaultValue="15" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Gold */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
                                <Crown size={18} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Altın Komisyonu</label>
                                <div className="relative">
                                    <input type="number" defaultValue="20" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Sub Affiliate */}
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-sm">Alt Bayi Primi</h3>
                                    <p className="text-xs text-slate-500">Alt bayiden kazanılan pay.</p>
                                </div>
                                <div className="w-24 relative">
                                    <input type="number" defaultValue="5" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-right focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* API Integrations */}
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Database size={18} className="text-blue-500" />
                        API Entegrasyonları
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Key size={12} />
                                RevenueCat Public API Key
                            </label>
                            <input type="password" value="appl_xxxxxxxxxxxxxxxxxxx" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" readOnly />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Key size={12} />
                                RevenueCat Secret Key
                            </label>
                            <input type="password" value="sk_xxxxxxxxxxxxxxxxxxx" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" readOnly />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Hostinger Database URL</label>
                            <input type="text" value="mysql://u123_db:pass@185.x.x.x:3306/db_name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 font-mono text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" readOnly />
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs text-red-600 leading-relaxed">
                            <span className="font-bold">DİKKAT:</span> Bu ayarları değiştirmek tüm sistemi anında etkiler. Komisyon oranlarını değiştirdiğinizde, bir sonraki hesaplama periyodundan itibaren geçerli olur.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
