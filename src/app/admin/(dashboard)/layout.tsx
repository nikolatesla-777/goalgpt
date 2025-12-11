'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Menu,
    X,
    Search,
    Activity,
    ChevronRight,
    Bot,
    Target,
    List,
    PenTool,
    BarChart3,
    Trophy,
    Clock,
    FileText,
    Home
} from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    // Start closed on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [expandedMenu, setExpandedMenu] = useState<string | null>('predictions')
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const pathname = usePathname()
    const router = useRouter()

    // Set initial sidebar state based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true)
            } else {
                setIsSidebarOpen(false)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || null)
                setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin')
            }
        }
        fetchUser()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    const navigation = [
        { name: 'Genel Bakış', href: '/admin', icon: LayoutDashboard },
        {
            name: 'Yapay Zeka Tahminleri',
            id: 'predictions',
            icon: Target,
            subItems: [
                { name: 'Tüm Tahminler', href: '/admin/predictions', icon: List },
                { name: 'Canlı Veri Akışı', href: '/admin/live-flow', icon: Activity },
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

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

            {/* Mobile Overlay - Higher z-index */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[100] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Highest z-index on mobile */}
            <aside className={`
                fixed top-0 left-0 z-[110] h-full w-[280px] bg-white shadow-2xl lg:shadow-sm transition-transform duration-300 ease-in-out
                lg:w-64 lg:border-r lg:border-slate-200
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="h-full flex flex-col overflow-hidden">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 flex-shrink-0">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 mr-3">
                                <span className="font-bold text-lg text-white">G</span>
                            </div>
                            <div>
                                <h1 className="font-bold text-slate-800 tracking-tight">GoalGPT</h1>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Admin Panel</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 -mr-2 text-slate-400 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation - Scrollable */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <div className="px-3 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Yönetim
                        </div>
                        {navigation.map((item: any) => {
                            const isActive = pathname === item.href
                            const hasSubItems = item.subItems && item.subItems.length > 0
                            const isExpanded = expandedMenu === item.id

                            return (
                                <div key={item.name + item.id}>
                                    <div
                                        onClick={() => hasSubItems ? toggleSubMenu(item.id) : null}
                                        className={`
                                            flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer
                                            ${isActive && !hasSubItems
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <Link
                                            href={hasSubItems ? '#' : item.href}
                                            className="flex items-center gap-3 flex-1"
                                            onClick={(e) => {
                                                if (hasSubItems) {
                                                    e.preventDefault()
                                                } else {
                                                    handleNavClick()
                                                }
                                            }}
                                        >
                                            <item.icon size={20} className={`transition-colors ${isActive && !hasSubItems ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                            <span className="text-[14px]">{item.name}</span>
                                        </Link>
                                        {hasSubItems && (
                                            <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                    </div>

                                    {hasSubItems && (
                                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100 mt-1 space-y-1' : 'max-h-0 opacity-0'}`}>
                                            {item.subItems.map((sub: any) => {
                                                const isSubActive = pathname === sub.href
                                                return (
                                                    <Link
                                                        key={sub.name + sub.href}
                                                        href={sub.href}
                                                        onClick={handleNavClick}
                                                        className={`
                                                            flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ml-6
                                                            ${isSubActive
                                                                ? 'bg-slate-100 text-slate-900'
                                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                                            }
                                                        `}
                                                    >
                                                        <sub.icon size={16} className={isSubActive ? 'text-emerald-500' : 'text-slate-400'} />
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
                    <div className="p-3 border-t border-slate-100 flex-shrink-0">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 uppercase font-bold text-sm flex-shrink-0">
                                {userName ? userName.charAt(0) : 'A'}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">{userName || 'Admin'}</p>
                                <p className="text-xs text-slate-400 truncate">{userEmail || 'Yükleniyor...'}</p>
                            </div>
                            <LogOut size={18} className="text-slate-400 group-hover:text-red-500 transition-colors flex-shrink-0" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:ml-64 min-h-screen flex flex-col">

                {/* Header - Fixed on mobile */}
                <header className="h-14 lg:h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 lg:px-6 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {/* Hamburger Menu - Only on mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Mobile Logo */}
                        <div className="flex items-center lg:hidden">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center mr-2">
                                <span className="font-bold text-sm text-white">G</span>
                            </div>
                            <span className="font-bold text-slate-800">GoalGPT</span>
                        </div>

                        {/* Desktop Status */}
                        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span>Sistem:</span>
                            <span className="text-emerald-600 font-semibold">Normal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search - Desktop only */}
                        <div className="relative hidden lg:block">
                            <input
                                type="text"
                                placeholder="Arama..."
                                className="w-48 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pl-10 text-sm text-slate-700 focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-400"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>

                        {/* Home Button */}
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-600 transition-colors"
                        >
                            <Home size={16} />
                            <span className="hidden sm:inline">Ana Sayfa</span>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 bg-slate-50">
                    {children}
                </main>
            </div>

        </div>
    )
}

