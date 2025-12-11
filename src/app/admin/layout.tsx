'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldAlert,
    Search,
    Activity,
    Globe,
    CheckCircle2,
    Smartphone,
    UserPlus,
    UserX,
    UserMinus,
    ChevronRight,
    Bot,
    Target,
    Zap,
    List,
    PenTool,
    BarChart3,
    Trophy,
    Clock,
    FileText,
    Home
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [expandedMenu, setExpandedMenu] = useState<string | null>('predictions')
    const pathname = usePathname()

    // Enhanced Navigation Structure
    const navigation = [
        { name: 'Genel Bakış', href: '/admin', icon: LayoutDashboard },
        {
            name: 'Yapay Zeka Tahminleri',
            id: 'predictions',
            icon: Target,
            subItems: [
                { name: 'Tüm Tahminler', href: '/admin/predictions', icon: List },
                { name: 'Canlı Tahminler', href: '/admin/predictions/live', icon: Zap },
                { name: 'Liste Tahminleri', href: '/admin/predictions/lists', icon: List },
                { name: 'Tahmin Logları', href: '/admin/predictions/logs', icon: FileText },
                { name: 'Arşiv', href: '/admin/predictions/archive', icon: Clock },
            ]
        },
        {
            name: 'Bot Yönetimi',
            id: 'bots',
            icon: Bot,
            subItems: [
                { name: 'Bot Grupları', href: '/admin/bots', icon: Bot },
                { name: 'Performans', href: '/admin/bots/performance', icon: BarChart3 },
                { name: 'Lig Eşleştirme', href: '/admin/bots/competitions', icon: Trophy },
            ]
        },
        {
            name: 'Manuel Tahminler',
            id: 'manual',
            icon: PenTool,
            subItems: [
                { name: 'Tekli Tahmini Oluştur', href: '/admin/predictions/manual', icon: Target },
                { name: 'Liste Tahmini Oluştur', href: '/admin/predictions/lists', icon: List },
            ]
        },
        { name: 'Üye Yönetimi', href: '/admin/members', icon: Users },
        { name: 'Partner Yönetimi', href: '/admin/partners', icon: Users },
        { name: 'Finans & Ödemeler', href: '/admin/finance', icon: CreditCard },
        { name: 'Sistem Ayarları', href: '/admin/settings', icon: Settings },
    ]

    const toggleSubMenu = (id: string) => {
        setExpandedMenu(expandedMenu === id ? null : id)
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

            {/* Sidebar - Light Theme */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 shadow-sm transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-100">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 mr-3">
                            <span className="font-bold text-lg text-white">G</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 tracking-tight">GoalGPT</h1>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Admin Panel</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                        <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Yönetim
                        </div>
                        {navigation.map((item: any) => {
                            const isActive = pathname === item.href
                            const hasSubItems = item.subItems && item.subItems.length > 0
                            const isExpanded = expandedMenu === item.id

                            return (
                                <div key={item.name}>
                                    {/* Main Menu Item */}
                                    <div
                                        onClick={() => hasSubItems ? toggleSubMenu(item.id) : null}
                                        className={`
                                            flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer
                                            ${isActive && !hasSubItems
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <Link href={hasSubItems ? '#' : item.href} className="flex items-center gap-3 flex-1" onClick={(e) => hasSubItems && e.preventDefault()}>
                                            <item.icon size={18} className={`transition-colors ${isActive && !hasSubItems ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            <span className="text-[13px]">{item.name}</span>
                                        </Link>
                                        {hasSubItems && (
                                            <ChevronRight size={14} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                    </div>

                                    {/* Sub Items */}
                                    {hasSubItems && (
                                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100 mt-1 space-y-0.5' : 'max-h-0 opacity-0'}`}>
                                            {item.subItems.map((sub: any) => {
                                                const isSubActive = pathname === sub.href
                                                return (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        className={`
                                                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ml-6
                                                            ${isSubActive
                                                                ? 'bg-slate-100 text-slate-900'
                                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                            }
                                                        `}
                                                    >
                                                        <sub.icon size={14} className={isSubActive ? 'text-emerald-500' : 'text-slate-400'} />
                                                        {sub.name}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-3 border-t border-slate-100">
                        <button className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                <ShieldAlert size={16} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-sm font-semibold text-slate-700">Süper Admin</p>
                                <p className="text-xs text-slate-400">Root Access</p>
                            </div>
                            <LogOut size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`${isSidebarOpen ? 'lg:ml-64' : ''} transition-all duration-300`}>

                {/* Header - Light Theme */}
                <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-slate-400 hover:text-slate-700 lg:hidden"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span>Sistem Durumu:</span>
                            <span className="text-emerald-600 font-semibold">Normal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden sm:block">
                            <input
                                type="text"
                                placeholder="Arama..."
                                className="w-56 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-400"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors">
                            <Home size={16} />
                            Ana Sayfa
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>

        </div>
    )
}
