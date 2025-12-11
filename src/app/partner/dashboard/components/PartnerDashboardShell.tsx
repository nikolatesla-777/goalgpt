
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutGrid,
    Wallet,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronDown,
    Trophy,
    Share2,
    Lock,
    Smartphone
} from 'lucide-react'

interface PartnerDashboardShellProps {
    children: React.ReactNode
    partner: {
        profile: {
            full_name: string
            email: string
        }
        tier: string
    }
}

export default function PartnerDashboardShell({ children, partner }: PartnerDashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const pathname = usePathname()

    const navigation = [
        { label: 'Genel Bakış', icon: LayoutGrid, href: '/partner/dashboard', active: pathname === '/partner/dashboard' },
        {
            label: 'Üyelerim',
            icon: Users,
            href: '/partner/dashboard/members/all',
            active: pathname.includes('/partner/dashboard/members'),
            items: [
                { label: 'Tüm Üyeler', href: '/partner/dashboard/members/all' },
                { label: 'Aktif Aboneler', href: '/partner/dashboard/members/active' },
                { label: 'Ücretsiz (Potansiyel)', href: '/partner/dashboard/members/free' },
                { label: 'Yeni Kayıtlar', href: '/partner/dashboard/members/new' },
                { label: 'İptal Edenler', href: '/partner/dashboard/members/cancelled' },
                { label: 'Süresi Bitenler', href: '/partner/dashboard/members/expired' },
            ]
        },
        { label: 'Alt Bayilik', icon: Share2, href: '/partner/dashboard/sub-affiliates', active: pathname === '/partner/dashboard/sub-affiliates' },
        { label: 'Performans Ligi', icon: Trophy, href: '/partner/dashboard/tiers', active: pathname === '/partner/dashboard/tiers' },
        { label: 'Kazançlarım', icon: Wallet, href: '/partner/dashboard/earnings', active: pathname === '/partner/dashboard/earnings' },
        { label: 'Ayarlar', icon: Settings, href: '/partner/dashboard/settings', active: pathname === '/partner/dashboard/settings' },
    ]

    // Helper for sub-menu icons
    const getSubIcon = (label: string) => {
        if (label.includes('Tüm')) return <LayoutGrid size={14} />
        if (label.includes('Aktif')) return <Bell size={14} />
        if (label.includes('Ücretsiz')) return <Smartphone size={14} />
        if (label.includes('Yeni')) return <Users size={14} />
        if (label.includes('İptal')) return <LogOut size={14} />
        if (label.includes('Süresi')) return <Lock size={14} />
        return <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white flex">
            {/* Mobile Sidebar Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:w-72 shrink-0 flex flex-col`}
            >
                <div className="p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="font-bold text-lg">G</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg tracking-tight">GoalGPT</h1>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Partner</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="px-4 py-4 space-y-1 flex-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = item.active || (item.items && item.items.some(i => pathname === i.href))

                        // Main Item
                        const mainItem = (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive && !item.items
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors'}`} />
                                    {item.label}
                                </div>
                                {item.items && (
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isActive ? 'rotate-180 text-white' : ''}`} />
                                )}
                            </Link>
                        )

                        // If no sub-items, just return main item
                        if (!item.items) return mainItem

                        // If has sub-items, wrap in container
                        return (
                            <div key={item.label} className="space-y-1">
                                {mainItem}
                                {/* Sub Menu */}
                                {isActive && (
                                    <div className="pl-12 pr-2 space-y-0.5 animate-in fade-in slide-in-from-top-1">
                                        {item.items.map(sub => {
                                            const isSubActive = pathname === sub.href
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isSubActive
                                                        ? 'text-white bg-white/5'
                                                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                                >
                                                    <span className={isSubActive ? 'text-blue-400' : 'text-slate-600'}>
                                                        {getSubIcon(sub.label)}
                                                    </span>
                                                    {sub.label}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 w-full p-4 border-t border-white/5">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <LogOut className="w-5 h-5" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center ml-auto">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsNotificationsOpen(!isNotificationsOpen)
                                    setIsProfileOpen(false)
                                }}
                                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
                            >
                                <Bell size={20} />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#020617]"></span>
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <div className="absolute right-0 top-full mt-4 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="font-bold text-white text-sm">Bildirimler</h3>
                                        <span className="text-xs text-blue-400 font-medium cursor-pointer hover:text-blue-300">Tümünü Okundu Say</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {[
                                            { type: 'sale', title: 'Yeni Satış!', msg: 'mehmet_k@gmail.com Yıllık VIP Paket aldı.', time: '10 dk önce', color: 'text-green-400', bg: 'bg-green-500/10', icon: Trophy },
                                            { type: 'expire', title: 'Süre Doldu', msg: 'ayse_y@hotmail.com paket süresi bitti.', time: '2 saat önce', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Bell },
                                            { type: 'cancel', title: 'İptal', msg: 'can_b@outlook.com aboneliği iptal etti.', time: '1 gün önce', color: 'text-red-400', bg: 'bg-red-500/10', icon: LogOut }
                                        ].map((notif, i) => (
                                            <div key={i} className="p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer flex gap-3 relative group">
                                                <div className={`w-8 h-8 rounded-full ${notif.bg} ${notif.color} flex items-center justify-center shrink-0`}>
                                                    <notif.icon size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <p className="text-sm font-bold text-white">{notif.title}</p>
                                                        {notif.type === 'sale' && <span className="text-xs font-bold text-green-400">+₺250</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-snug">{notif.msg}</p>
                                                    <p className="text-[10px] text-slate-600 mt-1">{notif.time}</p>
                                                </div>
                                                {/* Unread indicator dot */}
                                                {i === 0 && <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-2" />

                        {/* Profile & Settings */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsProfileOpen(!isProfileOpen)
                                    setIsNotificationsOpen(false)
                                }}
                                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden relative">
                                    <span className="font-bold text-xs text-slate-300 relative z-10">
                                        {partner.profile.full_name?.charAt(0) || 'P'}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-amber-500/20" />
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-bold text-white">{partner.profile.full_name}</div>
                                    <div className="text-xs text-yellow-400 font-bold">{partner.tier.toUpperCase()} Partner</div>
                                </div>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Profile Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-4 w-60 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 border-b border-white/5">
                                        <p className="text-sm font-bold text-white">{partner.profile.full_name}</p>
                                        <p className="text-xs text-slate-400 truncate">{partner.profile.email}</p>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <Link href="/partner/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                                            <Settings size={16} />
                                            Hesap Ayarları
                                        </Link>
                                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left">
                                            <Lock size={16} />
                                            Şifre Değiştir
                                        </button>
                                    </div>
                                    <div className="p-2 border-t border-white/5">
                                        <Link href="/partner/login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                            <LogOut size={16} />
                                            Çıkış Yap
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
