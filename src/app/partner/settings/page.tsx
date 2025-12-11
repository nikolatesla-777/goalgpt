'use client'

import { User, Lock, Save, Mail, Phone, MapPin } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hesap Ayarları</h1>
                    <p className="text-slate-400 text-sm mt-1">Kişisel bilgilerinizi ve güvenliğinizi buradan yönetebilirsiniz.</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                    <Save size={16} />
                    <span>Kaydet</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Info */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-blue-400" />
                            Profil Bilgileri
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ad</label>
                                    <input type="text" defaultValue="Ahmet" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Soyad</label>
                                    <input type="text" defaultValue="Yılmaz" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">E-posta Adresi</label>
                                <div className="relative">
                                    <input type="email" defaultValue="ahmet_yilmaz@gmail.com" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Telefon</label>
                                <div className="relative">
                                    <input type="tel" defaultValue="+90 555 123 45 67" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
                                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security / Password */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Lock size={20} className="text-orange-400" />
                            Güvenlik
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mevcut Şifre</label>
                                <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Yeni Şifre</label>
                                    <input type="password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Yeni Şifre (Tekrar)</label>
                                    <input type="password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button className="w-full py-3 rounded-xl border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 text-sm font-bold transition-all">
                                    Şifreyi Güncelle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
