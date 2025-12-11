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
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [expandedMenu, setExpandedMenu] = useState<string | null>('predictions')
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const pathname = usePathname()
    const router = useRouter()

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

    const closeSidebar = () => setSidebarOpen(false)

    return (
        <div className="admin-layout">
            {/* VERSION INDICATOR - Remove after debugging */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#ef4444',
                color: 'white',
                padding: '8px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 99999
            }}>
                V7-NATIVE | {new Date().toLocaleTimeString('tr-TR')} | sidebarOpen: {sidebarOpen ? 'TRUE' : 'FALSE'}
            </div>
            {/* Desktop Sidebar - Always visible on lg+ */}
            <aside className="admin-sidebar-desktop">
                <SidebarContent
                    navigation={navigation}
                    pathname={pathname}
                    expandedMenu={expandedMenu}
                    toggleSubMenu={toggleSubMenu}
                    userName={userName}
                    userEmail={userEmail}
                    handleLogout={handleLogout}
                    onNavClick={() => { }}
                />
            </aside>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="admin-mobile-overlay" onClick={closeSidebar}>
                    <aside
                        className="admin-sidebar-mobile"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Close Button */}
                        <button
                            className="admin-close-btn"
                            onClick={closeSidebar}
                            type="button"
                        >
                            ✕
                        </button>
                        <SidebarContent
                            navigation={navigation}
                            pathname={pathname}
                            expandedMenu={expandedMenu}
                            toggleSubMenu={toggleSubMenu}
                            userName={userName}
                            userEmail={userEmail}
                            handleLogout={handleLogout}
                            onNavClick={closeSidebar}
                        />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        {/* Mobile Menu Button */}
                        <button
                            className="admin-menu-btn"
                            onClick={() => setSidebarOpen(true)}
                            type="button"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="admin-logo-mobile">
                            <div className="admin-logo-icon">G</div>
                            <span>GoalGPT</span>
                        </div>
                    </div>
                    <Link href="/" className="admin-home-btn">
                        <Home size={16} />
                        <span className="admin-home-text">Ana Sayfa</span>
                    </Link>
                </header>

                {/* Page Content */}
                <main className="admin-content">
                    {children}
                </main>
            </div>

            <style jsx global>{`
                .admin-layout {
                    min-height: 100vh;
                    background: #f8fafc;
                }

                /* Desktop Sidebar */
                .admin-sidebar-desktop {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 256px;
                    height: 100vh;
                    background: white;
                    border-right: 1px solid #e2e8f0;
                    overflow-y: auto;
                    z-index: 40;
                }

                @media (min-width: 1024px) {
                    .admin-sidebar-desktop {
                        display: block;
                    }
                }

                /* Mobile Overlay */
                .admin-mobile-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 9999;
                }

                /* Mobile Sidebar */
                .admin-sidebar-mobile {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 85%;
                    max-width: 320px;
                    height: 100%;
                    background: white;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                /* Close Button */
                .admin-close-btn {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 40px;
                    height: 40px;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    font-size: 20px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    -webkit-tap-highlight-color: transparent;
                }

                .admin-close-btn:active {
                    background: #dc2626;
                }

                @media (min-width: 1024px) {
                    .admin-mobile-overlay {
                        display: none;
                    }
                }

                /* Main Content */
                .admin-main {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                @media (min-width: 1024px) {
                    .admin-main {
                        margin-left: 256px;
                    }
                }

                /* Header */
                .admin-header {
                    height: 56px;
                    background: white;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    position: sticky;
                    top: 0;
                    z-index: 30;
                }

                @media (min-width: 1024px) {
                    .admin-header {
                        height: 64px;
                        padding: 0 24px;
                    }
                }

                .admin-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .admin-menu-btn {
                    padding: 8px;
                    background: transparent;
                    border: none;
                    color: #475569;
                    cursor: pointer;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    -webkit-tap-highlight-color: transparent;
                }

                .admin-menu-btn:active {
                    background: #f1f5f9;
                }

                @media (min-width: 1024px) {
                    .admin-menu-btn {
                        display: none;
                    }
                }

                .admin-logo-mobile {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                @media (min-width: 1024px) {
                    .admin-logo-mobile {
                        display: none;
                    }
                }

                .admin-logo-icon {
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #10b981, #14b8a6);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                }

                .admin-logo-mobile span {
                    font-weight: 700;
                    color: #1e293b;
                }

                .admin-home-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #f1f5f9;
                    border-radius: 8px;
                    color: #475569;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 500;
                }

                .admin-home-text {
                    display: none;
                }

                @media (min-width: 640px) {
                    .admin-home-text {
                        display: inline;
                    }
                }

                /* Content */
                .admin-content {
                    flex: 1;
                    padding: 16px;
                    background: #f8fafc;
                }

                @media (min-width: 1024px) {
                    .admin-content {
                        padding: 24px;
                    }
                }

                /* Sidebar Content Styles */
                .sidebar-header {
                    height: 64px;
                    display: flex;
                    align-items: center;
                    padding: 0 16px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .sidebar-logo {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #10b981, #14b8a6);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                    margin-right: 12px;
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
                }

                .sidebar-title h1 {
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    font-size: 16px;
                }

                .sidebar-title span {
                    font-size: 10px;
                    font-weight: 700;
                    color: #10b981;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 16px 12px;
                    overflow-y: auto;
                }

                .sidebar-section-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding: 0 12px;
                    margin-bottom: 12px;
                }

                .sidebar-nav-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    margin-bottom: 4px;
                    transition: background 0.15s;
                }

                .sidebar-nav-item:hover {
                    background: #f8fafc;
                }

                .sidebar-nav-item.active {
                    background: #ecfdf5;
                    border: 1px solid #a7f3d0;
                }

                .sidebar-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    color: #475569;
                    font-size: 14px;
                    font-weight: 500;
                    flex: 1;
                }

                .sidebar-nav-item.active .sidebar-nav-link {
                    color: #047857;
                }

                .sidebar-subnav {
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                }

                .sidebar-subnav-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    margin-left: 24px;
                    border-radius: 8px;
                    text-decoration: none;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 500;
                    transition: background 0.15s;
                }

                .sidebar-subnav-item:hover {
                    background: #f8fafc;
                }

                .sidebar-subnav-item.active {
                    background: #f1f5f9;
                    color: #1e293b;
                }

                .sidebar-footer {
                    padding: 12px;
                    border-top: 1px solid #f1f5f9;
                }

                .sidebar-user {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: background 0.15s;
                    background: transparent;
                    border: none;
                    width: 100%;
                    text-align: left;
                }

                .sidebar-user:hover {
                    background: #fef2f2;
                }

                .sidebar-avatar {
                    width: 40px;
                    height: 40px;
                    background: #d1fae5;
                    border: 1px solid #a7f3d0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #047857;
                    font-weight: 700;
                    font-size: 14px;
                    text-transform: uppercase;
                    flex-shrink: 0;
                }

                .sidebar-user-info {
                    flex: 1;
                    min-width: 0;
                }

                .sidebar-user-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .sidebar-user-email {
                    font-size: 12px;
                    color: #94a3b8;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </div>
    )
}

// Sidebar Content Component
function SidebarContent({
    navigation,
    pathname,
    expandedMenu,
    toggleSubMenu,
    userName,
    userEmail,
    handleLogout,
    onNavClick
}: {
    navigation: any[]
    pathname: string
    expandedMenu: string | null
    toggleSubMenu: (id: string) => void
    userName: string | null
    userEmail: string | null
    handleLogout: () => void
    onNavClick: () => void
}) {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo">G</div>
                <div className="sidebar-title">
                    <h1>GoalGPT</h1>
                    <span>Admin Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Yönetim</div>
                {navigation.map((item: any) => {
                    const isActive = pathname === item.href
                    const hasSubItems = item.subItems && item.subItems.length > 0
                    const isExpanded = expandedMenu === item.id

                    return (
                        <div key={item.name + (item.id || '')}>
                            <div
                                className={`sidebar-nav-item ${isActive && !hasSubItems ? 'active' : ''}`}
                                onClick={() => hasSubItems ? toggleSubMenu(item.id) : null}
                            >
                                <Link
                                    href={hasSubItems ? '#' : item.href}
                                    className="sidebar-nav-link"
                                    onClick={(e) => {
                                        if (hasSubItems) {
                                            e.preventDefault()
                                        } else {
                                            onNavClick()
                                        }
                                    }}
                                >
                                    <item.icon size={20} color={isActive && !hasSubItems ? '#047857' : '#94a3b8'} />
                                    {item.name}
                                </Link>
                                {hasSubItems && (
                                    <ChevronRight
                                        size={16}
                                        color="#94a3b8"
                                        style={{
                                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                                            transition: 'transform 0.2s'
                                        }}
                                    />
                                )}
                            </div>

                            {hasSubItems && (
                                <div
                                    className="sidebar-subnav"
                                    style={{ maxHeight: isExpanded ? '400px' : '0px' }}
                                >
                                    {item.subItems.map((sub: any) => {
                                        const isSubActive = pathname === sub.href
                                        return (
                                            <Link
                                                key={sub.name + sub.href}
                                                href={sub.href}
                                                className={`sidebar-subnav-item ${isSubActive ? 'active' : ''}`}
                                                onClick={onNavClick}
                                            >
                                                <sub.icon size={16} color={isSubActive ? '#10b981' : '#94a3b8'} />
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

            {/* User Footer */}
            <div className="sidebar-footer">
                <button className="sidebar-user" onClick={handleLogout}>
                    <div className="sidebar-avatar">
                        {userName ? userName.charAt(0) : 'A'}
                    </div>
                    <div className="sidebar-user-info">
                        <p className="sidebar-user-name">{userName || 'Admin'}</p>
                        <p className="sidebar-user-email">{userEmail || 'Yükleniyor...'}</p>
                    </div>
                    <LogOut size={18} color="#94a3b8" />
                </button>
            </div>
        </div>
    )
}
