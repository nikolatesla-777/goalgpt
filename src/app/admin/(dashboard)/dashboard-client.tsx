'use client'


import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
    Search, Bell, Menu, X, Filter, Download, MoreVertical,
    ChevronLeft, ChevronRight, User, Settings, LogOut,
    Check, AlertCircle, Calendar, CreditCard, Users, Activity,
    BarChart3, PieChart, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownRight, Package, Shield, Gift,
    Megaphone, MessageSquare, Smartphone as AndroidIcon,
    Globe, Mail, Phone, MapPin, Hash, Grip, LayoutDashboard,
    Database, Bot, FileText, Wallet, Settings2, Moon, Sun,
    RefreshCw, XCircle, Apple, MessageCircle,
    DollarSign, ShoppingCart, AlertTriangle, UserPlus,
    PlayCircle, UserCheck, UserMinus, Users2, Eye, Ticket,
    Zap, Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { motion } from 'framer-motion'

// =============================================================================
// SEGMENT CONFIG (imported from central config for consistency)
// =============================================================================

type SegmentType = 'new_user' | 'free_user' | 'trial_user' | 'trial_expired' | 'active_subscriber' | 'grace_period' | 'paused_user' | 'churned_user' | 'winback_target' | 'refunded_user'

const SEGMENT_LABELS: Record<SegmentType, { label: string, bg: string, text: string }> = {
    new_user: { label: 'Yeni Üye', bg: 'bg-cyan-100', text: 'text-cyan-600' },
    free_user: { label: 'Free', bg: 'bg-slate-100', text: 'text-slate-600' },
    trial_user: { label: 'Deneme', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    trial_expired: { label: 'Deneme Bitti', bg: 'bg-orange-100', text: 'text-orange-600' },
    active_subscriber: { label: 'Aktif Abone', bg: 'bg-green-100', text: 'text-green-600' },
    grace_period: { label: 'Ödeme Bekliyor', bg: 'bg-red-100', text: 'text-red-600' },
    paused_user: { label: 'Duraklatılmış', bg: 'bg-yellow-100', text: 'text-yellow-600' },
    churned_user: { label: 'Ayrılan', bg: 'bg-slate-200', text: 'text-slate-600' },
    winback_target: { label: 'Geri Kazanım', bg: 'bg-purple-100', text: 'text-purple-600' },
    refunded_user: { label: 'İade', bg: 'bg-rose-100', text: 'text-rose-600' }
}

// =============================================================================
// FAKE DATA (embedded for reliable operation)
// =============================================================================

const FAKE_METRICS = {
    revenue: { total: 147850, apple: 84275, google: 63575 },
    activeSubs: { total: 1247, apple: 711, google: 536 },
    totalSales: { total: 156, apple: 89, google: 67 },
    billingErrors: { total: 23, apple: 13, google: 10 },
    newRegistrations: { total: 312, apple: 178, google: 134 },
    trialStarters: { total: 187, apple: 107, google: 80 },
    firstSales: { total: 89, apple: 51, google: 38 },
    trialConversions: { total: 67, apple: 38, google: 29 },
    cancellations: { total: 34, apple: 19, google: 15 },
    churn: { total: 78, apple: 44, google: 34 },
    reactivations: { total: 23, apple: 13, google: 10 },
    totalUsers: { total: 4521, apple: 2577, google: 1944 },
}

const NAMES = [
    'Ahmet Yılmaz', 'Mehmet Kaya', 'Mustafa Demir', 'Ali Çelik', 'Hüseyin Öztürk',
    'Hasan Aydın', 'İbrahim Şahin', 'Osman Yıldız', 'Yusuf Özdemir', 'Murat Er',
    'Fatma Aktaş', 'Ayşe Koç', 'Emine Arslan', 'Hatice Polat', 'Zeynep Korkmaz',
    'Elif Doğan', 'Merve Kılıç', 'Büşra Çetin', 'Esra Aksoy', 'Seda Kaplan'
]

const METRIC_TO_SEGMENT: Record<string, SegmentType> = {
    activeSubs: 'active_subscriber',
    revenue: 'active_subscriber',
    totalSales: 'active_subscriber',
    billingErrors: 'grace_period',
    newRegistrations: 'new_user',
    trialStarters: 'trial_user',
    firstSales: 'active_subscriber',
    trialConversions: 'active_subscriber',
    cancellations: 'churned_user',
    churn: 'churned_user',
    reactivations: 'winback_target',
    totalUsers: 'free_user'
}

interface User {
    id: string
    name: string
    email: string
    platform: 'apple' | 'google'
    segment: SegmentType
    lastSeen: Date
    totalSpent: number
    transactionCount: number
    // RevenueCat-ready fields
    package?: {
        id: string
        name: string
        duration: 'weekly' | 'monthly' | 'yearly'
        price: number
    }
    purchaseDate?: Date
    expirationDate?: Date
    transactionId?: string
    autoRenew?: boolean
    conversionSource?: 'trial' | 'promo' | 'direct' | 'reactivation'
    phone?: string
}

const PACKAGES = [
    { id: 'weekly_premium', name: 'Haftalık', duration: 'weekly' as const, price: 149 },
    { id: 'monthly_premium', name: 'Aylık', duration: 'monthly' as const, price: 449 },
    { id: 'yearly_premium', name: 'Yıllık', duration: 'yearly' as const, price: 899 }
]

function generateUsers(count: number, segment: SegmentType, metricKey?: string): User[] {
    const now = new Date()

    return Array.from({ length: count }, (_, i) => {
        const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : '')
        const email = name.toLowerCase().replace(/\s+/g, '.').replace(/[üöşığç]/g, c => ({ ü: 'u', ö: 'o', ş: 's', ı: 'i', ğ: 'g', ç: 'c' }[c] || c)) + '@gmail.com'
        const pkg = PACKAGES[Math.floor(Math.random() * 3)]
        const transactionCount = Math.floor(Math.random() * 24) + 1
        const phonePrefix = ['532', '533', '542', '555', '505'][Math.floor(Math.random() * 5)]
        const phone = `${phonePrefix} ${Math.floor(Math.random() * 899 + 100)} ${Math.floor(Math.random() * 89 + 10)} ${Math.floor(Math.random() * 89 + 10)}`

        // Rastgele satın alma tarihi (son 30 gün içinde)
        let purchaseDate = new Date(now.getTime() - Math.floor(Math.random() * 30 * 24) * 60 * 60 * 1000)
        // Rastgele saat ekle (09:00 - 23:59)
        purchaseDate.setHours(9 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 60))

        // Bitiş tarihi (pakete göre)
        const daysToAdd = pkg.duration === 'weekly' ? 7 : pkg.duration === 'monthly' ? 30 : 365
        let expirationDate = new Date(purchaseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

        // FIXME: Active subscriber must have future expiration date
        // FIXME: Active subscriber and Trial user must have future expiration date
        if ((segment === 'active_subscriber' || segment === 'trial_user') && expirationDate <= now) {
            const futureDays = Math.floor(Math.random() * (pkg.duration === 'weekly' ? 6 : 29)) + 1
            expirationDate = new Date(now.getTime() + futureDays * 24 * 60 * 60 * 1000)
            purchaseDate = new Date(expirationDate.getTime() - daysToAdd * 24 * 60 * 60 * 1000)
        }

        if (segment === 'churned_user') {
            const daysLeft = Math.floor(Math.random() * 20) + 1
            expirationDate = new Date(new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).getTime() + daysLeft * 24 * 60 * 60 * 1000)
        }

        let lastSeenDate = new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))

        if (metricKey === 'cancellations') {
            segment = 'active_subscriber'
            // Iptal edilmis ama suresi bitmemis
            // lastSeen (Canceled At) -> Bugunden once
            const daysSinceCancel = Math.floor(Math.random() * 5) // 0-5 gun once iptal etmis
            lastSeenDate = new Date(now.getTime() - daysSinceCancel * 24 * 60 * 60 * 1000)

            // expirationDate -> Bugunden sonra (Iptal aninda kalan gun + gecen sure)
            const daysRemainingFromNow = Math.floor(Math.random() * 25) + 1
            expirationDate = new Date(now.getTime() + daysRemainingFromNow * 24 * 60 * 60 * 1000)

            purchaseDate = new Date(lastSeenDate.getTime() - Math.floor(Math.random() * 10 + 1) * 24 * 60 * 60 * 1000)
        } else if (metricKey === 'churn') {
            // Kullanıcı isteği: Tek segmente indirgendi (Ayrılan)
            segment = 'churned_user'
        }

        const autoRenew = metricKey === 'cancellations' ? false : Math.random() > 0.2

        let conversionSource: 'trial' | 'promo' | 'direct' | 'reactivation' | undefined = undefined
        // Conversion Source (for active subscribers)
        if (segment === 'active_subscriber') {
            const rand = Math.random()
            if (rand < 0.4) conversionSource = 'trial'
            else if (rand < 0.6) conversionSource = 'promo'
            else if (rand < 0.8) conversionSource = 'direct'
            else conversionSource = 'reactivation'
        }

        return {
            id: String(i + 1),
            name,
            email,
            platform: i % 3 === 0 ? 'google' : 'apple',

            segment,
            lastSeen: lastSeenDate,
            totalSpent: Math.floor(Math.random() * 5000) + 100,
            transactionCount,
            package: pkg,
            purchaseDate,
            expirationDate,
            autoRenew,
            conversionSource,
            phone,
            transactionId: `rc_${Math.random().toString(36).substring(7)}_${Math.random().toString(36).substring(7)}`
        }
    })
}

// USERS_DATA removed to prevent blocking main thread on load
// Data will be generated lazily inside the component via useMemo

function generateChartData(baseTotal: number, trend: 'up' | 'down' | 'stable') {
    const data = []
    let total = baseTotal * 0.85, ios = total * 0.57, android = total * 0.43
    const months = ['Kas', 'Kas', 'Kas', 'Kas', 'Kas', 'Kas', 'Kas', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara']
    const days = [28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    for (let i = 0; i < 14; i++) {
        const trendFactor = trend === 'up' ? 1.02 : trend === 'down' ? 0.98 : 1
        total = Math.max(1, total * trendFactor * (0.95 + Math.random() * 0.1))
        ios = Math.max(1, ios * trendFactor * (0.95 + Math.random() * 0.1))
        android = Math.max(1, android * trendFactor * (0.95 + Math.random() * 0.1))
        data.push({ name: `${days[i]} ${months[i]}`, total: Math.round(total), iOS: Math.round(ios), Android: Math.round(android) })
    }
    return data
}

const CHART_DATA: Record<string, any[]> = {
    revenue: generateChartData(10500, 'up'),
    activeSubs: generateChartData(90, 'up'),
    totalSales: generateChartData(11, 'stable'),
    billingErrors: generateChartData(2, 'down'),
    newRegistrations: generateChartData(22, 'up'),
    trialStarters: generateChartData(13, 'stable'),
    firstSales: generateChartData(6, 'up'),
    trialConversions: generateChartData(5, 'up'),
    cancellations: generateChartData(2, 'down'),
    churn: generateChartData(5, 'down'),
    reactivations: generateChartData(2, 'up'),
    totalUsers: generateChartData(320, 'up'),
}

// =============================================================================
// HELPERS
// =============================================================================

const fmtMoney = (val: number) => `₺${val.toLocaleString('tr-TR')}`
const fmtCount = (val: number) => val.toLocaleString('tr-TR')
const fmtDateTime = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear().toString().slice(-2)} - ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

// =============================================================================
// MINI SPARKLINE
// =============================================================================

function MiniSparkline({ data, color }: { data: any[], color: string }) {
    return (
        <div className="h-8 w-16">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`mini-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="total" stroke={color} strokeWidth={1.5} fill={`url(#mini-${color.replace('#', '')})`} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

// =============================================================================
// COLORS & METRIC CARD
// =============================================================================

const COLORS: Record<string, { bg: string, text: string, border: string, spark: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', spark: '#10b981' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', spark: '#3b82f6' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', spark: '#8b5cf6' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500', spark: '#ef4444' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-500', spark: '#06b6d4' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500', spark: '#6366f1' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-500', spark: '#14b8a6' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', spark: '#22c55e' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500', spark: '#eab308' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-500', spark: '#64748b' },
    lime: { bg: 'bg-lime-50', text: 'text-lime-600', border: 'border-lime-500', spark: '#84cc16' },
    gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-500', spark: '#6b7280' },
}

function MetricCard({ id, title, data, icon: Icon, color, isMoney, isAlert, active, onClick }: any) {
    const c = COLORS[color] || COLORS.slate

    return (

        <button
            onClick={onClick}
            className={`relative w-full h-full bg-white rounded-xl p-3 md:p-4 text-left transition-all border-2 overflow-hidden group hover:shadow-lg ${active ? `${c.border} shadow-lg` : 'border-slate-200 hover:border-slate-300'}`}
        >
            {active && <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: c.spark }} />}

            <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Icon size={18} className={`${c.text} md:w-5 md:h-5 w-4 h-4`} />
                </div>
                {isAlert && data.total > 0 && (
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>

            <p className="text-[10px] md:text-xs font-semibold text-slate-500 mb-0.5 md:mb-1 uppercase tracking-wide truncate">{title}</p>

            <div className="flex items-end justify-between gap-1 md:gap-2">
                <div className="min-w-0">
                    <p className={`text-lg md:text-2xl font-bold tracking-tight truncate ${isAlert && data.total > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                        {isMoney ? fmtMoney(data.total) : fmtCount(data.total)}
                    </p>
                    <div className="flex flex-col md:flex-row gap-0.5 md:gap-3 mt-1 md:mt-1.5">
                        <span className="text-[9px] md:text-[11px] text-slate-400 flex items-center gap-1"><Apple size={10} className="md:w-[11px] md:h-[11px]" /> {fmtCount(data.apple)}</span>
                        <span className="text-[9px] md:text-[11px] text-green-500 flex items-center gap-1"><AndroidIcon size={10} className="md:w-[11px] md:h-[11px]" /> {fmtCount(data.google)}</span>
                    </div>
                </div>
                {/* Lazy rendered sparkline - Hidden on Mobile to save space */}
                <div className="hidden md:block opacity-50 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline data={CHART_DATA[id] || []} color={c.spark} />
                </div>
            </div>
        </button>
    )

}

// =============================================================================
// TABLE CONFIGS
// =============================================================================

// Ortak sütun tanımları (Tek merkezden yönetim için)
const COLUMNS = {
    INDEX: { key: '#', label: '#', width: '40px' },
    USER: { key: 'user', label: 'Kullanıcı', width: '180px' },
    PHONE: { key: 'phone', label: 'Telefon', width: '140px' },
    PLATFORM: { key: 'platform', label: 'Platform', width: '90px' },
    PACKAGE: { key: 'package', label: 'Paket', width: '100px' },
    SEGMENT: { key: 'segment', label: 'Segment', width: '120px' },
    TOTAL_SPENT: { key: 'totalSpent', label: 'Tutar', width: '90px' },
    TOTAL_SPENT_LONG: { key: 'totalSpent', label: 'Toplam Harcama', width: '110px' },
    TRANSACTION_COUNT: { key: 'transactionCount', label: 'İşlem Adeti', width: '80px' },
    TRANSACTION_COUNT_SHORT: { key: 'transactionCount', label: 'İşlem', width: '70px' },
    PURCHASE_DATE: { key: 'purchaseDate', label: 'Satın Alma', width: '130px' },
    DAYS_REMAINING: { key: 'daysRemaining', label: 'Kalan Gün', width: '90px' },
    AUTO_RENEW: { key: 'autoRenew', label: 'Yenileme', width: '90px' },
    FIRST_TX_AMOUNT: { key: 'firstTxAmount', label: 'Tutar', width: '100px' },
    CONVERSION_SOURCE: { key: 'conversionSource', label: 'Kaynak', width: '110px' },
    DAYS_BEFORE_EXPIRY: { key: 'daysBeforeExpiry', label: 'Bitişe Kalan Gün', width: '130px' },
    EXPIRATION_DATE: { key: 'expirationDate', label: 'Bitiş Tarihi', width: '130px' },
    LAST_SEEN: { key: 'lastSeen', label: 'Son Giriş', width: '140px' },
    DATE: { key: 'lastSeen', label: 'Tarih', width: '150px' },
    ACTIONS: { key: 'actions', label: 'İşlemler', width: '70px' }
}

const TABLE_CONFIGS: Record<string, { title: string, caption: string, columns: { key: string, label: string, width?: string }[] }> = {
    activeSubs: {
        title: 'Aktif Aboneler',
        caption: 'Şu anda aktif aboneliği bulunan kullanıcılar.',
        columns: [
            COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE,
            COLUMNS.SEGMENT, COLUMNS.AUTO_RENEW,
            COLUMNS.DAYS_REMAINING, COLUMNS.TOTAL_SPENT_LONG, COLUMNS.TRANSACTION_COUNT_SHORT,
            COLUMNS.ACTIONS
        ]
    },
    revenue: {
        title: 'Gelir Detayları',
        caption: 'Seçili dönemde gerçekleşen tüm satın alma işlemleri. RevenueCat entegrasyonu için hazır.',
        columns: [
            COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE,
            COLUMNS.TOTAL_SPENT, COLUMNS.TRANSACTION_COUNT, COLUMNS.PURCHASE_DATE,
            COLUMNS.ACTIONS
        ]
    },
    totalSales: {
        title: 'Satış Detayları',
        caption: 'Bu dönemde yapılan satış işlemleri detayları.',
        columns: [
            COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE,
            COLUMNS.TOTAL_SPENT, COLUMNS.TRANSACTION_COUNT, COLUMNS.PURCHASE_DATE,
            COLUMNS.ACTIONS
        ]
    },
    billingErrors: { title: 'Faturalandırma Hataları', caption: '⚠️ Ödeme alınamayan kullanıcılar.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.SEGMENT, COLUMNS.LAST_SEEN, COLUMNS.ACTIONS] },
    newRegistrations: { title: 'Yeni Kayıtlar', caption: 'Son 7 günde kayıt olan kullanıcılar.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PHONE, COLUMNS.PLATFORM, COLUMNS.SEGMENT, { ...COLUMNS.DATE, label: 'Kayıt Tarihi' }, COLUMNS.ACTIONS] },
    trialStarters: { title: 'Deneme Başlatanlar', caption: 'Ücretsiz deneme sürecindeki kullanıcılar.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE, COLUMNS.SEGMENT, COLUMNS.DAYS_REMAINING, { ...COLUMNS.DATE, label: 'Başlangıç' }, COLUMNS.ACTIONS] },
    firstSales: { title: 'İlk Kez Satın Alanlar', caption: '🎉 İlk kez satın alan kullanıcılar (Tek seferlik işlem tutarı).', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE, COLUMNS.SEGMENT, COLUMNS.FIRST_TX_AMOUNT, COLUMNS.DATE, COLUMNS.ACTIONS] },
    trialConversions: { title: 'Kazanılan Aboneler', caption: '✅ Ücretli aboneliğe geçen tüm kullanıcılar (Deneme, Direkt, Promokod ve Geri Kazanım).', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE, COLUMNS.CONVERSION_SOURCE, COLUMNS.FIRST_TX_AMOUNT, { ...COLUMNS.DATE, label: 'Dönüşüm' }, COLUMNS.ACTIONS] },
    cancellations: { title: 'Gönüllü İptaller', caption: '⚠️ Aboneliğini iptal eden kullanıcılar.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.PACKAGE, COLUMNS.SEGMENT, { ...COLUMNS.DATE, label: 'İptal Tarihi' }, COLUMNS.DAYS_BEFORE_EXPIRY, COLUMNS.ACTIONS] },
    churn: { title: 'Süresi Bitenler', caption: 'Abonelik süresi dolmuş kullanıcılar.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.SEGMENT, COLUMNS.LAST_SEEN, COLUMNS.ACTIONS] },
    reactivations: { title: 'Geri Kazanılanlar', caption: '🔄 Geri dönen kullanıcılar.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.SEGMENT, COLUMNS.TOTAL_SPENT, { ...COLUMNS.DATE, label: 'Geri Dönüş' }, COLUMNS.ACTIONS] },
    totalUsers: { title: 'Tüm Üyeler', caption: 'Kayıtlı tüm kullanıcıların listesi.', columns: [COLUMNS.INDEX, COLUMNS.USER, COLUMNS.PLATFORM, COLUMNS.SEGMENT, { ...COLUMNS.DATE, label: 'Kayıt' }, COLUMNS.ACTIONS] }
}

// =============================================================================
// PAGINATION
// =============================================================================

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    return (
        <div className="flex items-center justify-center gap-1">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={18} /></button>
            {start > 1 && (<><button onClick={() => onPageChange(1)} className="w-9 h-9 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">1</button>{start > 2 && <span className="px-1 text-slate-400">...</span>}</>)}
            {pages.map(page => (<button key={page} onClick={() => onPageChange(page)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>))}
            {end < totalPages && (<>{end < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}<button onClick={() => onPageChange(totalPages)} className="w-9 h-9 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">{totalPages}</button></>)}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight size={18} /></button>
        </div>
    )
}

// =============================================================================
// MAIN DASHBOARD
// =============================================================================

export default function DashboardClient() {
    const router = useRouter()
    const [activeMetric, setActiveMetric] = useState('activeSubs')
    const [actionMenuId, setActionMenuId] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedPeriod, setSelectedPeriod] = useState('Bu Ay')
    const itemsPerPage = 15

    const [mounted, setMounted] = useState(false)
    const [isDetailView, setIsDetailView] = useState(false)

    // Lazy load heavy components
    useEffect(() => {
        setMounted(true)
    }, [])

    // Optimized Data Generation: Only generate users for the active metric
    const allUsers = useMemo(() => {
        if (!mounted) return [] // Don't block initial render

        const metricKey = activeMetric
        const count = Math.min(FAKE_METRICS[metricKey as keyof typeof FAKE_METRICS]?.total || 50, 150)

        if (metricKey === 'totalUsers') {
            // Mix for total users
            const active = generateUsers(30, 'active_subscriber', 'activeSubs')
            const churn = generateUsers(20, 'churned_user', 'churn')
            const newReg = generateUsers(20, 'new_user', 'newRegistrations')
            const free = generateUsers(50, 'free_user')
            return [...active, ...churn, ...newReg, ...free].sort(() => Math.random() - 0.5).map((u, i) => ({ ...u, id: `mixed_${i}` }))
        }

        return generateUsers(count, METRIC_TO_SEGMENT[metricKey] || 'free_user', metricKey)
    }, [activeMetric, mounted])

    const allMetrics = [
        { id: 'revenue', title: 'Toplam Gelir', data: FAKE_METRICS.revenue, icon: DollarSign, color: 'emerald', isMoney: true, row: 1 },
        { id: 'activeSubs', title: 'Aktif Aboneler', data: FAKE_METRICS.activeSubs, icon: Users, color: 'blue', row: 1 },
        { id: 'totalSales', title: 'Satış Adedi', data: FAKE_METRICS.totalSales, icon: ShoppingCart, color: 'purple', row: 1 },
        { id: 'billingErrors', title: 'Fatura Hatası', data: FAKE_METRICS.billingErrors, icon: AlertTriangle, color: 'red', isAlert: true, row: 1 },
        { id: 'newRegistrations', title: 'Yeni Kayıt', data: FAKE_METRICS.newRegistrations, icon: UserPlus, color: 'cyan', row: 2 },
        { id: 'trialStarters', title: 'Deneme', data: FAKE_METRICS.trialStarters, icon: PlayCircle, color: 'indigo', row: 2 },
        { id: 'firstSales', title: 'İlk Satış', data: FAKE_METRICS.firstSales, icon: UserCheck, color: 'teal', row: 2 },
        { id: 'trialConversions', title: 'Dönüşüm', data: FAKE_METRICS.trialConversions, icon: TrendingUp, color: 'green', row: 2 },
        { id: 'cancellations', title: 'İptaller', data: FAKE_METRICS.cancellations, icon: Settings, color: 'yellow', row: 3 },
        { id: 'churn', title: 'Churn', data: FAKE_METRICS.churn, icon: UserMinus, color: 'slate', row: 3 },

        { id: 'totalUsers', title: 'Toplam Üye', data: FAKE_METRICS.totalUsers, icon: Users2, color: 'gray', row: 3 },
    ]

    const handleMetricChange = (metricId: string) => {
        setActiveMetric(metricId);
        setCurrentPage(1);
        setIsDetailView(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const handleBackToDashboard = () => { setIsDetailView(false) }
    const goToDetail = (userId: string) => router.push(`/admin/members/detail/${userId}`)
    const handleAction = (action: string, user: User) => { console.log(`Action: ${action} for user: ${user.name}`); setActionMenuId(null) }

    const tableConfig = TABLE_CONFIGS[activeMetric]
    // allUsers is now derived from useMemo above
    const totalPages = Math.ceil(allUsers.length / itemsPerPage)
    const paginatedUsers = allUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    const chartData = CHART_DATA[activeMetric] || []
    const activeMetricInfo = allMetrics.find(m => m.id === activeMetric)

    const exportToExcel = () => {
        const headers = tableConfig.columns.filter(c => c.key !== 'actions').map(c => c.label).join(',')
        const rows = allUsers.map((user, i) => tableConfig.columns.filter(c => c.key !== 'actions').map(col => {
            switch (col.key) {
                case '#': return i + 1
                case 'user': return `"${user.name} <${user.email}>"`
                case 'platform': return user.platform === 'apple' ? 'iOS' : 'Android'
                case 'segment': return SEGMENT_LABELS[user.segment].label
                case 'totalSpent': return user.totalSpent
                case 'transactionCount': return user.transactionCount
                case 'package': return user.package?.name || '-'
                case 'purchaseDate': return user.purchaseDate ? fmtDateTime(user.purchaseDate) : '-'
                case 'autoRenew': return user.autoRenew === undefined ? '-' : user.autoRenew ? 'Açık' : 'Kapalı'
                case 'daysRemaining': return user.expirationDate ? Math.max(0, Math.ceil((user.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + ' gün' : '-'
                case 'daysBeforeExpiry': return user.expirationDate && user.lastSeen ? Math.max(0, Math.ceil((user.expirationDate.getTime() - user.lastSeen.getTime()) / (1000 * 60 * 60 * 24))) + ' gün kaldı' : '-'
                case 'lastSeen': return fmtDateTime(user.lastSeen)
                default: return '-'
            }
        }).join(',')).join('\n')

        const csv = `${headers}\n${rows}`
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${tableConfig.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const renderCell = (user: User, key: string, index: number) => {
        const globalIndex = (currentPage - 1) * itemsPerPage + index
        const segLabel = SEGMENT_LABELS[user.segment]

        switch (key) {
            case '#': return <span className="text-slate-400">{globalIndex + 1}</span>
            case 'user': return (<div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{user.name.charAt(0)}</div><div><p className="text-sm font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></div></div>)
            case 'phone': return user.phone ? (
                <a href={`https://wa.me/90${user.phone.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors group">
                    <span className="text-sm font-medium">{user.phone}</span>
                    <MessageCircle size={16} className="text-green-500 group-hover:scale-110 transition-transform" />
                </a>
            ) : <span className="text-slate-400">-</span>
            case 'platform': return (<span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${user.platform === 'apple' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>{user.platform === 'apple' ? <Apple size={12} /> : <AndroidIcon size={12} />}{user.platform === 'apple' ? 'iOS' : 'Android'}</span>)
            case 'segment': return (<span className={`px-2 py-1 rounded text-xs font-medium ${segLabel.bg} ${segLabel.text}`}>{segLabel.label}</span>)
            case 'totalSpent': return <span className="font-bold text-emerald-600">{fmtMoney(user.totalSpent)}</span>
            case 'firstTxAmount': return <span className="font-bold text-green-600">{user.package ? fmtMoney(user.package.price) : '-'}</span>
            case 'conversionSource': return user.conversionSource === 'trial' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"><Activity size={12} /> Deneme</span>
            ) : user.conversionSource === 'promo' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"><Ticket size={12} /> Promokod</span>
            ) : user.conversionSource === 'direct' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200"><CreditCard size={12} /> Direkt</span>
            ) : user.conversionSource === 'reactivation' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-lime-50 text-lime-700 border border-lime-200"><RefreshCw size={12} /> Geri Kazanım</span>
            ) : '-'
            case 'transactionCount': return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{user.transactionCount}</span>
            case 'package': return user.package ? (
                <span className={`px-2 py-1 rounded text-xs font-medium ${user.package.duration === 'yearly' ? 'bg-purple-100 text-purple-600' :
                    user.package.duration === 'monthly' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {user.package.name}
                </span>
            ) : <span className="text-slate-400">-</span>
            case 'purchaseDate': return user.purchaseDate ? (
                <span className="text-slate-600 font-medium">{fmtDateTime(user.purchaseDate)}</span>
            ) : <span className="text-slate-400">-</span>
            case 'expirationDate': return user.expirationDate ? (
                <span className="text-slate-600 font-medium">{fmtDateTime(user.expirationDate)}</span>
            ) : <span className="text-slate-400">-</span>
            case 'autoRenew': return user.autoRenew === undefined ? <span className="text-slate-400">-</span> : user.autoRenew ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <RefreshCw size={10} /> Açık
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                    <XCircle size={10} /> Kapalı
                </span>
            )
            case 'daysRemaining': {
                if (!user.expirationDate) return <span className="text-slate-400">-</span>
                const diffTime = user.expirationDate.getTime() - new Date().getTime()
                const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                const color = days <= 3 ? 'bg-red-100 text-red-600' : days <= 7 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                return <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>{days} gün</span>
            }
            case 'daysBeforeExpiry': {
                if (!user.expirationDate || !user.lastSeen) return <span className="text-slate-400">-</span>
                const diffTime = user.expirationDate.getTime() - user.lastSeen.getTime()
                const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
                return <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-600">{days} gün kaldı</span>
            }
            case 'lastSeen': return <span className="text-slate-600 font-medium">{fmtDateTime(user.lastSeen)}</span>
            case 'actions': return (
                <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === user.id ? null : user.id) }} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"><MoreVertical size={16} className="text-slate-500" /></button>
                    {actionMenuId === user.id && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                            <div className="p-2">
                                <p className="text-xs text-slate-400 px-3 py-2 border-b border-slate-100">İşlemler</p>
                                <button onClick={() => handleAction('Promokod Gönder', user)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"><Gift size={16} className="text-pink-500" />Promokod Gönder</button>
                                <button onClick={() => handleAction('RevenueCat Kampanyası', user)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"><Megaphone size={16} className="text-orange-500" />RevenueCat Kampanyası</button>
                                <button onClick={() => handleAction('SMS Gönder', user)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"><MessageSquare size={16} className="text-green-500" />SMS Gönder</button>
                                <button onClick={() => handleAction('E-posta Gönder', user)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"><Mail size={16} className="text-blue-500" />E-posta Gönder</button>
                                <div className="border-t border-slate-100 mt-2 pt-2"><button onClick={() => goToDetail(user.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} className="text-blue-600" />Detay Görüntüle</button></div>
                            </div>
                        </div>
                    )}
                </div>
            )
            default: return <span className="text-slate-500">-</span>
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Komuta Merkezi 🚀</h1>
                    <p className="text-slate-500 mt-1 text-sm">Tüm uygulamanın anlık verileri ve finansal durumu.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                    <div className="p-2 text-slate-400"><Calendar size={16} /></div>
                    <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent text-sm font-medium text-slate-700 outline-none border-none pr-2 cursor-pointer">
                        <option value="Bugün">Bugün</option>
                        <option value="Dün">Dün</option>
                        <option value="Son 7 Gün">Son 7 Gün</option>
                        <option value="Bu Hafta">Bu Hafta</option>
                        <option value="Bu Ay">Bu Ay</option>
                        <option value="Geçen Ay">Geçen Ay</option>
                        <option value="Tümü">Tümü</option>
                    </select>
                </div>
            </div>

            {/* Metric Rows or Detail View */}
            {!isDetailView ? (
                // DASHBOARD OVERVIEW MODE
                <div className="space-y-8 animate-in fade-in duration-500">
                    {[1, 2, 3].map(row => (
                        <div key={row}>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${row === 1 ? 'bg-emerald-500 animate-pulse' : row === 2 ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                                {row === 1 ? 'Finansal Sağlık' : row === 2 ? 'Edinim & Büyüme' : 'Tutundurma & Kayıp'}
                            </h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                {allMetrics.filter(m => m.row === row).map(m => (
                                    <MetricCard
                                        key={m.id}
                                        {...m}
                                        active={false} // In overview, no single card is 'active' in the old sense
                                        onClick={() => handleMetricChange(m.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // DETAIL FOCUS MODE
                <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                    <button
                        onClick={handleBackToDashboard}
                        className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Panela Dön
                    </button>

                    {/* Horizontal Metrics List */}
                    <div className="flex gap-3 overflow-x-auto p-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x items-stretch">
                        {allMetrics.map(m => (
                            <div key={m.id} className="min-w-[180px] md:min-w-[200px] snap-start shrink-0">
                                <MetricCard
                                    {...m}
                                    active={activeMetric === m.id}
                                    onClick={() => handleMetricChange(m.id)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Multi-Line Chart */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">{activeMetricInfo?.title} Trendi</h2>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400"></span> Toplam</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500"></span> iOS</span>
                                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500"></span> Android</span>
                            </div>
                        </div>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }} />
                                    <Line type="monotone" dataKey="total" stroke="#64748b" strokeWidth={2} dot={false} name="Toplam" strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey="iOS" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} name="iOS" />
                                    <Line type="monotone" dataKey="Android" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} name="Android" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Detail Table */}
                    {tableConfig && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-slate-200 bg-slate-50">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-bold text-slate-800">{tableConfig.title}</h2>
                                    <div className="flex items-center gap-3">
                                        <button onClick={exportToExcel} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"><Download size={16} />Excel İndir</button>
                                        <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-semibold">{allUsers.length} kayıt</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 leading-relaxed">{tableConfig.caption}</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                                        <tr>{tableConfig.columns.map(col => (<th key={col.key} className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap" style={{ width: col.width }}>{col.label}</th>))}</tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedUsers.map((user, i) => (
                                            <tr key={user.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => goToDetail(user.id)}>
                                                {tableConfig.columns.map(col => (<td key={col.key} className="px-4 py-4 text-sm whitespace-nowrap" onClick={col.key === 'actions' ? (e) => e.stopPropagation() : undefined}>{renderCell(user, col.key, i)}</td>))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allUsers.length)} / {allUsers.length} kayıt</p>
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {actionMenuId && <div className="fixed inset-0 z-40" onClick={() => setActionMenuId(null)} />}
        </div>
    )
}
