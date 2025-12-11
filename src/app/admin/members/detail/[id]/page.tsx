'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FAKE_MEMBERS, FakeMember } from '../../page'
import { SEGMENT_FLOWS, getSegmentFlow, getFlowProgress, getSortedActions, FlowStep, RecommendedAction } from './segment-flows'

// =============================================================================
// FLATICON URLs
// =============================================================================

const ICONS = {
    back: 'https://cdn-icons-png.flaticon.com/128/271/271220.png',
    save: 'https://cdn-icons-png.flaticon.com/128/2874/2874050.png',
    edit: 'https://cdn-icons-png.flaticon.com/128/1159/1159633.png',
    user: 'https://cdn-icons-png.flaticon.com/128/1077/1077114.png',
    email: 'https://cdn-icons-png.flaticon.com/128/561/561127.png',
    phone: 'https://cdn-icons-png.flaticon.com/128/724/724664.png',
    crown: 'https://cdn-icons-png.flaticon.com/128/3629/3629985.png',
    calendar: 'https://cdn-icons-png.flaticon.com/128/2693/2693507.png',
    activity: 'https://cdn-icons-png.flaticon.com/128/2910/2910791.png',
    card: 'https://cdn-icons-png.flaticon.com/128/2695/2695971.png',
    check: 'https://cdn-icons-png.flaticon.com/128/190/190411.png',
    cross: 'https://cdn-icons-png.flaticon.com/128/1828/1828778.png',
    ios: 'https://cdn-icons-png.flaticon.com/128/0/747.png',
    android: 'https://cdn-icons-png.flaticon.com/128/226/226770.png',
    gift: 'https://cdn-icons-png.flaticon.com/128/4213/4213958.png',
    sms: 'https://cdn-icons-png.flaticon.com/128/724/724715.png',
    campaign: 'https://cdn-icons-png.flaticon.com/128/1998/1998087.png',
    money: 'https://cdn-icons-png.flaticon.com/128/2489/2489756.png',
    key: 'https://cdn-icons-png.flaticon.com/128/3064/3064197.png',
    history: 'https://cdn-icons-png.flaticon.com/128/2972/2972531.png',
    eye: 'https://cdn-icons-png.flaticon.com/128/709/709586.png',
    eyeOff: 'https://cdn-icons-png.flaticon.com/128/709/709612.png',
    refresh: 'https://cdn-icons-png.flaticon.com/128/61/61225.png',
    // Transaction type icons
    renewal: 'https://cdn-icons-png.flaticon.com/128/3272/3272621.png',
    paymentFailed: 'https://cdn-icons-png.flaticon.com/128/753/753345.png',
    retry: 'https://cdn-icons-png.flaticon.com/128/61/61225.png',
    upgrade: 'https://cdn-icons-png.flaticon.com/128/892/892692.png',
    trialConvert: 'https://cdn-icons-png.flaticon.com/128/190/190411.png',
    trialStart: 'https://cdn-icons-png.flaticon.com/128/1087/1087927.png',
    register: 'https://cdn-icons-png.flaticon.com/128/1077/1077114.png',
}

// Segment config
const SEGMENT_CONFIG: Record<string, { label: string; color: string }> = {
    new_registration: { label: 'Yeni Kayıt', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    trial_started: { label: 'Deneme', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
    trial_converted: { label: 'Dönüşüm', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    first_purchase: { label: 'İlk Satış', color: 'bg-green-100 text-green-700 border-green-300' },
    active_subscriber: { label: 'Aktif Abone', color: 'bg-green-100 text-green-700 border-green-300' },
    loyal_subscriber: { label: 'Sadık Abone', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    payment_error: { label: 'Ödeme Hatası', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    subscription_cancel: { label: 'İptal', color: 'bg-red-100 text-red-700 border-red-300' },
    churned: { label: 'Süresi Bitti', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    win_back: { label: 'Geri Döndü', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    promo_user: { label: 'Promokod', color: 'bg-pink-100 text-pink-700 border-pink-300' },
    free_user: { label: 'Free', color: 'bg-slate-100 text-slate-800 border-slate-300' },
    // New segments for RevenueCat integration
    trial_expired: { label: 'Deneme Bitmiş', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    grace_period: { label: 'Ödeme Bekleniyor', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    paused_user: { label: 'Duraklatılmış', color: 'bg-slate-200 text-slate-700 border-slate-400' },
    refunded_user: { label: 'Geri Ödeme', color: 'bg-red-100 text-red-700 border-red-300' },
    winback_target: { label: 'Geri Kazanım', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' }
}

// Fake subscription history for long-time users
const SUBSCRIPTION_HISTORY = [
    { id: 1, date: '2024-12-10 09:15:32', type: 'renewal', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 2, date: '2024-11-10 14:22:18', type: 'renewal', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 3, date: '2024-10-10 11:45:06', type: 'renewal', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 4, date: '2024-09-10 08:33:41', type: 'payment_failed', product: 'Aylık Premium', amount: 149.99, status: 'failed' },
    { id: 5, date: '2024-09-12 16:08:55', type: 'retry', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 6, date: '2024-08-10 10:12:29', type: 'renewal', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 7, date: '2024-07-10 13:55:17', type: 'upgrade', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 8, date: '2024-06-10 19:28:44', type: 'trial_convert', product: 'Aylık Premium', amount: 149.99, status: 'success' },
    { id: 9, date: '2024-06-03 22:41:03', type: 'trial_started', product: '7 Gün Deneme', amount: 0, status: 'active' },
    { id: 10, date: '2024-06-01 15:33:22', type: 'registration', product: '-', amount: 0, status: 'completed' },
]

// Segment journey for long-time user
const SEGMENT_JOURNEY = [
    { date: '2024-06-01', segment: 'new_registration', note: 'Üye kaydı oluşturuldu' },
    { date: '2024-06-03', segment: 'trial_started', note: '7 günlük deneme başlatıldı' },
    { date: '2024-06-10', segment: 'trial_converted', note: 'Deneme dönüşümü - İlk ödeme' },
    { date: '2024-06-10', segment: 'first_purchase', note: 'İlk satış gerçekleşti' },
    { date: '2024-07-10', segment: 'active_subscriber', note: 'Aktif abone statüsü' },
    { date: '2024-09-10', segment: 'payment_error', note: 'Ödeme hatası yaşandı' },
    { date: '2024-09-12', segment: 'active_subscriber', note: 'Ödeme düzeltildi' },
    { date: '2024-12-01', segment: 'loyal_subscriber', note: '6+ ay abone - Sadık abone' },
]

// =====================================================
// USER SESSIONS DATA
// =====================================================
const USER_SESSIONS = [
    { id: 1, platform: 'iOS', ipAddress: '85.102.45.123', country: 'TR', lastActivity: '10.12.2025 23:18', validUntil: '13.12.2025 23:18', isActive: true, createdAt: '10.12.2025 20:18' },
    { id: 2, platform: 'Android', ipAddress: '176.88.12.45', country: 'TR', lastActivity: '10.12.2025 19:58', validUntil: '13.12.2025 19:58', isActive: true, createdAt: '10.12.2025 19:58' },
    { id: 3, platform: 'iOS', ipAddress: '78.180.92.201', country: 'TR', lastActivity: '09.12.2025 14:22', validUntil: '12.12.2025 14:22', isActive: false, createdAt: '09.12.2025 14:22' },
    { id: 4, platform: 'Web', ipAddress: '31.145.88.67', country: 'TR', lastActivity: '08.12.2025 10:15', validUntil: '11.12.2025 10:15', isActive: false, createdAt: '08.12.2025 10:15' },
    { id: 5, platform: 'Android', ipAddress: '95.70.134.89', country: 'TR', lastActivity: '05.12.2025 08:45', validUntil: '08.12.2025 08:45', isActive: false, createdAt: '05.12.2025 08:45' },
]

// =====================================================
// 2FA CODES DATA
// =====================================================
const TWO_FA_CODES = [
    { id: 1, code: '119c1898', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 2, code: '46249839', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 3, code: 'b5df1295', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 4, code: 'e29e94aa', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 5, code: '8b642841', isUsed: true, usedAt: '10.12.2025 20:25', createdAt: '10.12.2025 20:17' },
    { id: 6, code: 'a7c38912', isUsed: true, usedAt: '09.12.2025 15:33', createdAt: '09.12.2025 15:30' },
]

// =====================================================
// VERIFICATION HISTORY DATA
// =====================================================
const VERIFICATION_HISTORY = [
    { id: 1, type: 'forgot', code: '542001', sentAt: '10.12.2025 20:17', validUntil: '10.12.2025 20:27', status: 'used', ip: '0.0.0.0', platform: 'android', createdAt: '10.12.2025 20:17' },
    { id: 2, type: 'forgot', code: '278299', sentAt: '10.12.2025 20:13', validUntil: '10.12.2025 20:23', status: 'pending', ip: '0.0.0.0', platform: 'android', createdAt: '10.12.2025 20:13' },
    { id: 3, type: 'forgot', code: '677392', sentAt: '10.12.2025 20:10', validUntil: '10.12.2025 20:20', status: 'used', ip: '0.0.0.0', platform: 'android', createdAt: '10.12.2025 20:10' },
    { id: 4, type: 'register', code: '178866', sentAt: '10.12.2025 19:58', validUntil: '10.12.2025 20:08', status: 'used', ip: '192.168.1.9', platform: 'android', createdAt: '10.12.2025 19:58' },
    { id: 5, type: 'forgot', code: '838618', sentAt: '10.12.2025 19:01', validUntil: '10.12.2025 19:11', status: 'used', ip: '0.0.0.0', platform: 'ios', createdAt: '10.12.2025 19:01' },
]

export default function MemberDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params?.id as string

    const [member, setMember] = useState<FakeMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [showVipModal, setShowVipModal] = useState(false)
    const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
    const [vipReason, setVipReason] = useState('')
    const [subscriptionHistory, setSubscriptionHistory] = useState(SUBSCRIPTION_HISTORY)
    const [vipGranted, setVipGranted] = useState(false)
    const [promoGranted, setPromoGranted] = useState(false)
    const [footprintFilter, setFootprintFilter] = useState<'all' | 'store' | 'promo' | 'app'>('all')

    const ITEMS_PER_PAGE = 5

    // =====================================================
    // MARKET PACKAGES - App Store & Play Store Products
    // =====================================================
    // Bu paketler gerçek marketten gelecek, şimdilik fake data

    interface MarketPackage {
        id: string                      // Internal unique ID
        name: string                    // Display name (TR)
        description: string             // Package description
        duration: number                // Duration in days (0 = lifetime)
        durationLabel: string           // Human readable duration
        price: number                   // Price in TL
        originalPrice?: number          // Original price (if discounted)
        discount?: number               // Discount percentage
        isPopular?: boolean             // Show "Popüler" badge
        // Platform-specific product IDs
        ios: {
            productId: string           // App Store Product ID
            subscriptionGroupId?: string // App Store Subscription Group
        }
        android: {
            productId: string           // Play Store Product ID
            basePlanId?: string         // Play Store Base Plan ID
        }
        // RevenueCat integration
        revenueCatId: string            // RevenueCat Entitlement ID
        offeringId?: string             // RevenueCat Offering ID
        // Admin gift options
        canGift: boolean                // Can be gifted by admin
        giftNote: string                // Default gift note
    }

    // =====================================================
    // FOOTPRINT TYPES & INTERFACES
    // =====================================================
    type FootprintType = 'store' | 'promo' | 'app' | 'security'
    type FootprintStatus = 'success' | 'failed' | 'pending' | 'active' | 'completed' | 'used'

    interface FootprintItem {
        id: string | number
        date: string        // ISO string or formatted date string
        timestamp: number   // For sorting
        title: string       // Main action title (e.g. "Aylık Premium")
        description: string // Detail (e.g. "149.99 TL")
        type: FootprintType
        categoryLabel: string // "Mağaza", "Promokod", "Uygulama"
        status: FootprintStatus
        icon: string
        metadata?: any
    }
    const MARKET_PACKAGES: MarketPackage[] = [
        {
            id: 'weekly',
            name: 'Haftalık VIP',
            description: '7 gün premium erişim',
            duration: 7,
            durationLabel: '7 gün',
            price: 250,
            ios: {
                productId: 'com.goalgpt.weekly',
                subscriptionGroupId: 'goalgpt_premium'
            },
            android: {
                productId: 'weekly_subscription',
                basePlanId: 'weekly-plan'
            },
            revenueCatId: 'premium_weekly',
            offeringId: 'default',
            canGift: true,
            giftNote: 'Hediye - 1 hafta premium'
        },
        {
            id: 'monthly',
            name: 'Aylık VIP',
            description: '30 gün premium erişim',
            duration: 30,
            durationLabel: '1 ay',
            price: 800,
            originalPrice: 1000,
            discount: 20,
            isPopular: true,
            ios: {
                productId: 'com.goalgpt.monthly',
                subscriptionGroupId: 'goalgpt_premium'
            },
            android: {
                productId: 'monthly_subscription',
                basePlanId: 'monthly-plan'
            },
            revenueCatId: 'premium_monthly',
            offeringId: 'default',
            canGift: true,
            giftNote: 'Hediye - 1 ay premium'
        },
        {
            id: 'yearly',
            name: 'Yıllık VIP',
            description: '365 gün premium erişim',
            duration: 365,
            durationLabel: '1 yıl',
            price: 4999,
            originalPrice: 9600,
            discount: 48,
            ios: {
                productId: 'com.goalgpt.yearly',
                subscriptionGroupId: 'goalgpt_premium'
            },
            android: {
                productId: 'yearly_subscription',
                basePlanId: 'yearly-plan'
            },
            revenueCatId: 'premium_yearly',
            offeringId: 'default',
            canGift: true,
            giftNote: 'Hediye - 1 yıl premium'
        },
        {
            id: 'lifetime',
            name: 'Ömür Boyu VIP',
            description: 'Sınırsız premium erişim',
            duration: 0, // 0 = lifetime
            durationLabel: 'Ömür boyu',
            price: 9999,
            ios: {
                productId: 'com.goalgpt.lifetime',
            },
            android: {
                productId: 'lifetime_purchase',
            },
            revenueCatId: 'premium_lifetime',
            offeringId: 'lifetime',
            canGift: true,
            giftNote: 'Hediye - Ömür boyu premium'
        }
    ]

    // Promokod creation state
    const [showPromoModal, setShowPromoModal] = useState(false)
    const [promoCode, setPromoCode] = useState('')
    const [promoLimit, setPromoLimit] = useState('100')
    const [promoStartDate, setPromoStartDate] = useState('')
    const [promoEndDate, setPromoEndDate] = useState('')
    const [promoSegment, setPromoSegment] = useState<string>('all')
    const [promoDiscount, setPromoDiscount] = useState('100')
    const [promoDuration, setPromoDuration] = useState('7')
    const [promoNote, setPromoNote] = useState('')

    // Generate random promo code
    const generatePromoCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = 'GOAL'
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setPromoCode(code)
    }

    // Segment options for promo targeting
    const SEGMENT_OPTIONS = [
        { id: 'all', label: 'Tüm Kullanıcılar' },
        { id: 'new_registration', label: 'Yeni Kayıtlar' },
        { id: 'trial_started', label: 'Deneme Kullanıcıları' },
        { id: 'churned', label: 'Süresi Bitenler' },
        { id: 'free_user', label: 'Free Kullanıcılar' },
        { id: 'payment_error', label: 'Ödeme Hatası Yaşayanlar' },
    ]

    useEffect(() => {
        const found = FAKE_MEMBERS.find(m => m.id === userId)
        setMember(found || null)
        setLoading(false)
    }, [userId])

    const handleAction = (action: string) => {
        if (!member) return
        alert(`${action} → ${member.name} (${member.email})`)
    }

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
        let password = ''
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setNewPassword(password)
    }

    const handleGrantVip = () => {
        if (!selectedPackage || !member) return
        const pkg = MARKET_PACKAGES.find(p => p.id === selectedPackage)
        const reason = vipReason || pkg?.giftNote || 'Manuel VIP'

        // Yeni işlem geçmişine ekle
        const now = new Date()
        const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8)
        const newEntry = {
            id: Date.now(),
            date: dateStr,
            type: 'manual_vip' as const,
            product: pkg?.name || 'VIP',
            amount: 0,
            status: 'success' as const,
            note: reason
        }
        setSubscriptionHistory(prev => [newEntry, ...prev])
        setVipGranted(true)

        setShowVipModal(false)
        setSelectedPackage(null)
        setVipReason('')
    }

    const handleGrantPromo = () => {
        if (!promoCode || !member) return
        const note = promoNote || `Promokod: ${promoCode}`
        const segmentLabel = SEGMENT_OPTIONS.find(s => s.id === promoSegment)?.label || 'Tüm Kullanıcılar'

        const now = new Date()
        const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8)
        const newEntry = {
            id: Date.now(),
            date: dateStr,
            type: 'promo_code' as const,
            product: `${promoCode} (%${promoDiscount} - ${promoDuration} gün)`,
            amount: 0,
            status: 'success' as const,
            note: note
        }
        setSubscriptionHistory(prev => [newEntry, ...prev])
        setPromoGranted(true)

        setShowPromoModal(false)
        setPromoCode('')
        setPromoNote('')
        setPromoLimit('100')
        setPromoDiscount('100')
        setPromoDuration('7')
        setPromoSegment('all')
        setPromoStartDate('')
        setPromoEndDate('')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <div className="text-slate-700">Yükleniyor...</div>
            </div>
        )
    }

    if (!member) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-700 text-lg">Kullanıcı bulunamadı</p>
                <Link href="/admin/members" className="text-blue-600 hover:underline flex items-center gap-2">
                    <Image src={ICONS.back} alt="" width={16} height={16} />
                    Listeye dön
                </Link>
            </div>
        )
    }

    const isVip = member.vipStatus === 'VIP' || vipGranted
    const isFreeUser = (member.segment === 'free_user' || member.segment === 'new_registration' || member.segment === 'churned') && !vipGranted
    const hasSubscriptionHistory = subscriptionHistory.length > 0 || vipGranted
    const totalPayments = isVip ? Math.floor(1 + Math.random() * 8) : (vipGranted ? 1 : 0)
    const totalAmount = member.amount ? member.amount * totalPayments : 0

    // =====================================================
    // FOOTPRINTS DATA MERGING
    // =====================================================
    const getFootprints = (): FootprintItem[] => {
        const prints: FootprintItem[] = []

        // 1. Subscription History (Store & Promo & Manual)
        subscriptionHistory.forEach(item => {
            const isPromo = item.type === 'promo_code'
            const isManual = item.type === 'manual_vip'
            const isStore = !isPromo && !isManual

            prints.push({
                id: `sub_${item.id}`,
                date: item.date,
                timestamp: new Date(item.date).getTime(),
                title: isPromo ? 'Promokod Kullanımı' : isManual ? 'Manuel Tanımlama' : item.product,
                description: isPromo ? item.product : isManual ? item.note : `${item.amount > 0 ? `₺${item.amount}` : 'Ücretsiz'} - ${item.type === 'renewal' ? 'Yenileme' : item.type === 'payment_failed' ? 'Ödeme Hatası' : 'Satın Alma'}`,
                type: isPromo ? 'promo' : 'store',
                categoryLabel: isPromo ? 'Promokod' : isManual ? 'Yönetici' : 'Mağaza',
                status: item.status as FootprintStatus,
                icon: isPromo ? ICONS.gift : isManual ? ICONS.key : item.type === 'payment_failed' ? ICONS.paymentFailed : ICONS.card
            })
        })

        // 2. Segment Journey (App Lifecycle)
        SEGMENT_JOURNEY.forEach((item, idx) => {
            prints.push({
                id: `seg_${idx}`,
                date: `${item.date} 09:00:00`, // Normalize time
                timestamp: new Date(item.date).getTime(),
                title: 'Segment Değişimi',
                description: `${item.segment} → ${item.note}`,
                type: 'app',
                categoryLabel: 'Uygulama',
                status: 'completed',
                icon: ICONS.activity
            })
        })

        // 3. User Sessions (App Usage)
        USER_SESSIONS.forEach(session => {
            prints.push({
                id: `sess_${session.id}`,
                date: session.createdAt,
                timestamp: new Date(session.createdAt.split('.').reverse().join('-')).getTime(), // Parse TR date approx
                title: 'Oturum Açma',
                description: `${session.platform} • ${session.ipAddress} • ${session.country}`,
                type: 'app',
                categoryLabel: 'Uygulama',
                status: session.isActive ? 'active' : 'completed',
                icon: session.platform === 'iOS' ? ICONS.ios : session.platform === 'Android' ? ICONS.android : ICONS.user
            })
        })

        // 4. Verifications (Security/App)
        VERIFICATION_HISTORY.forEach(v => {
            prints.push({
                id: `ver_${v.id}`,
                date: v.createdAt,
                timestamp: new Date(v.createdAt.split('.').reverse().join('-')).getTime(),
                title: v.type === 'register' ? 'Kayıt Doğrulama' : 'Şifre Sıfırlama',
                description: `Kod: ${v.code} • Platform: ${v.platform}`,
                type: 'security',
                categoryLabel: 'Güvenlik',
                status: v.status as FootprintStatus,
                icon: ICONS.sms
            })
        })

        return prints.sort((a, b) => b.timestamp - a.timestamp)
    }

    const allFootprints = getFootprints()

    const filteredFootprints = allFootprints.filter(fp => {
        if (footprintFilter === 'all') return true
        if (footprintFilter === 'store') return fp.type === 'store'
        if (footprintFilter === 'promo') return fp.type === 'promo'
        if (footprintFilter === 'app') return fp.type === 'app' || fp.type === 'security'
        return true
    })

    return (
        <div className="min-h-screen bg-[#fafafa] p-8">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-3 rounded-xl bg-white border-2 border-slate-200 hover:bg-slate-50 transition-colors">
                            <Image src={ICONS.back} alt="back" width={20} height={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                {member.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    {member.name}
                                    {isVip && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300">
                                            <Image src={ICONS.crown} alt="" width={14} height={14} /> VIP
                                        </span>
                                    )}
                                    {isFreeUser && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                            FREE
                                        </span>
                                    )}
                                </h1>
                                <p className="text-slate-700 flex items-center gap-2">
                                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">ID: {member.id}</span>
                                    • Kayıt: {member.registeredDate}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${isEditing ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Image src={ICONS.edit} alt="" width={16} height={16} />
                            {isEditing ? 'Düzenleniyor' : 'Düzenle'}
                        </button>
                        {isEditing && (
                            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg">
                                <Image src={ICONS.save} alt="" width={16} height={16} />
                                Kaydet
                            </button>
                        )}
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* User Details */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Image src={ICONS.user} alt="" width={20} height={20} />
                                Kullanıcı Bilgileri
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-700 mb-1.5">Ad Soyad</label>
                                    <input type="text" defaultValue={member.name} disabled={!isEditing}
                                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-slate-800 ${isEditing ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-700 mb-1.5">E-posta</label>
                                    <input type="email" defaultValue={member.email} disabled={!isEditing}
                                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-slate-800 ${isEditing ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-700 mb-1.5">Telefon</label>
                                    <input type="tel" defaultValue={member.phone} disabled={!isEditing}
                                        className={`w-full border-2 rounded-xl px-4 py-2.5 text-slate-800 ${isEditing ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-700 mb-1.5">Platform</label>
                                    <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5">
                                        <Image src={member.platform === 'iOS' ? ICONS.ios : ICONS.android} alt="" width={16} height={16} />
                                        <span className="text-slate-800">{member.platform}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Image src={ICONS.activity} alt="" width={20} height={20} />
                                Durum Bilgileri
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 text-center">
                                    <span className="text-xs text-slate-700 block mb-1">Segment</span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${SEGMENT_CONFIG[member.segment]?.color || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                        {member.segmentLabel}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 text-center">
                                    <span className="text-xs text-slate-700 block mb-1">Oto. Yenileme</span>
                                    <Image src={member.autoRenew ? ICONS.check : ICONS.cross} alt="" width={24} height={24} className="mx-auto" />
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 text-center">
                                    <span className="text-xs text-slate-700 block mb-1">Son Aktivite</span>
                                    <span className="text-sm font-semibold text-slate-700">{member.lastActivity}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 text-center">
                                    <span className="text-xs text-slate-700 block mb-1">Bitiş Tarihi</span>
                                    <span className="text-sm font-semibold text-slate-700">{member.expirationDate || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* ========================================= */}
                        {/* SEGMENT AKIŞ DURUMU - User Journey Flow */}
                        {/* ========================================= */}
                        {(() => {
                            // Segment mapping - mevcut segment'i flow segment'ine dönüştür
                            const segmentMapping: Record<string, string> = {
                                'new_registration': 'new_user',
                                'trial_started': 'trial_user',
                                'trial_converted': 'paying_customer',
                                'first_purchase': 'paying_customer',
                                'active_subscriber': 'paying_customer',
                                'loyal_subscriber': 'loyal_subscriber',
                                'payment_error': 'grace_period', // Ödeme hatası = Grace Period
                                'subscription_cancel': 'churned_user',
                                'churned': 'churned_user',
                                'win_back': 'paying_customer',
                                'promo_user': 'trial_user',
                                'free_user': 'new_user',
                                // New RevenueCat segments (direct mapping)
                                'trial_expired': 'trial_expired',
                                'grace_period': 'grace_period',
                                'paused_user': 'paused_user',
                                'refunded_user': 'refunded_user',
                                'winback_target': 'winback_target'
                            };

                            const mappedSegment = segmentMapping[member.segment] || 'new_user';
                            const flow = getSegmentFlow(mappedSegment);

                            if (!flow) return null;

                            const progress = getFlowProgress(flow.steps);
                            const sortedActions = getSortedActions(flow.recommendedActions);

                            // Fake data ile adımları güncelle (gerçek uygulamada API'den gelecek)
                            const stepsWithStatus = flow.steps.map((step, index) => {
                                // İlk 2 adımı tamamlanmış, 3. adımı "current" olarak işaretle
                                if (index < 2) return { ...step, status: 'completed' as const, completedAt: '10.12.2024' };
                                if (index === 2) return { ...step, status: 'current' as const };
                                return step;
                            });

                            const completedCount = stepsWithStatus.filter(s => s.status === 'completed').length;
                            const currentStep = stepsWithStatus.find(s => s.status === 'current');

                            return (
                                <>
                                    {/* Segment Akış Durumu */}
                                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <span className="text-2xl">{flow.segmentIcon}</span>
                                                Segment Akış Durumu
                                            </h2>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${flow.segmentColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                    flow.segmentColor === 'purple' ? 'bg-purple-100 text-purple-700' :
                                                        flow.segmentColor === 'green' ? 'bg-green-100 text-green-700' :
                                                            flow.segmentColor === 'red' ? 'bg-red-100 text-red-700' :
                                                                flow.segmentColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {flow.segmentName}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-slate-700 mb-4">{flow.description}</p>

                                        {/* Progress Bar */}
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-slate-700 font-medium">İlerleme Durumu</span>
                                                <span className="text-slate-800 font-bold">{completedCount} / {stepsWithStatus.length} adım tamamlandı</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${flow.segmentColor === 'blue' ? 'bg-blue-500' :
                                                        flow.segmentColor === 'purple' ? 'bg-purple-500' :
                                                            flow.segmentColor === 'green' ? 'bg-green-500' :
                                                                flow.segmentColor === 'red' ? 'bg-red-500' :
                                                                    flow.segmentColor === 'yellow' ? 'bg-yellow-500' :
                                                                        'bg-gray-500'
                                                        }`}
                                                    style={{ width: `${(completedCount / stepsWithStatus.length) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Timeline Steps */}
                                        <div className="space-y-3">
                                            {stepsWithStatus.map((step, index) => (
                                                <div
                                                    key={step.id}
                                                    className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${step.status === 'completed' ? 'bg-green-50 border border-green-200' :
                                                        step.status === 'current' ? 'bg-blue-50 border-2 border-blue-300' :
                                                            'bg-slate-50 border border-slate-200'
                                                        }`}
                                                >
                                                    {/* Step Number/Icon */}
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${step.status === 'completed' ? 'bg-green-500 text-white' :
                                                        step.status === 'current' ? 'bg-blue-500 text-white animate-pulse' :
                                                            'bg-slate-300 text-slate-600'
                                                        }`}>
                                                        {step.status === 'completed' ? '✓' : step.icon}
                                                    </div>

                                                    {/* Step Content */}
                                                    <div className="flex-grow">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`font-semibold ${step.status === 'completed' ? 'text-green-700' :
                                                                step.status === 'current' ? 'text-blue-700' :
                                                                    'text-slate-600'
                                                                }`}>
                                                                {step.name}
                                                            </span>
                                                            {step.status === 'completed' && step.completedAt && (
                                                                <span className="text-xs text-green-600 font-medium">{step.completedAt}</span>
                                                            )}
                                                            {step.status === 'current' && (
                                                                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">Şu an</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-700 mt-0.5">{step.description}</p>
                                                        {step.trigger === 'time_based' && step.daysToTrigger && (
                                                            <span className="text-xs text-slate-500 mt-1 inline-block">⏰ Gün {step.daysToTrigger}'de otomatik tetiklenir</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ========================================= */}
                                    {/* ÖNERİLEN AKSİYONLAR - Recommended Actions */}
                                    {/* ========================================= */}
                                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            💡 Önerilen Aksiyonlar
                                        </h2>

                                        <div className="space-y-3">
                                            {sortedActions.map((action) => (
                                                <div
                                                    key={action.id}
                                                    className={`flex items-start gap-4 p-4 rounded-xl border-2 ${action.priority === 'high' ? 'border-red-200 bg-red-50' :
                                                        action.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                                                            'border-green-200 bg-green-50'
                                                        }`}
                                                >
                                                    {/* Priority Badge */}
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${action.priority === 'high' ? 'bg-red-500' :
                                                        action.priority === 'medium' ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}>
                                                        {action.icon}
                                                    </div>

                                                    {/* Action Content */}
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${action.priority === 'high' ? 'bg-red-500 text-white' :
                                                                action.priority === 'medium' ? 'bg-yellow-500 text-white' :
                                                                    'bg-green-500 text-white'
                                                                }`}>
                                                                {action.priority === 'high' ? 'ÖNCELİKLİ' : action.priority === 'medium' ? 'ORTA' : 'DÜŞÜK'}
                                                            </span>
                                                            <span className="font-semibold text-slate-800">{action.title}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700">{action.description}</p>
                                                    </div>

                                                    {/* Action Button */}
                                                    <button
                                                        onClick={() => handleAction(action.title)}
                                                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${action.priority === 'high'
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : action.priority === 'medium'
                                                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                                : 'bg-green-500 text-white hover:bg-green-600'
                                                            }`}
                                                    >
                                                        {action.buttonText}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Current Step Recommendation */}
                                        {currentStep && (
                                            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-blue-500 text-lg">📍</span>
                                                    <span className="font-semibold text-blue-700">Mevcut Adım: {currentStep.name}</span>
                                                </div>
                                                <p className="text-sm text-blue-600">{currentStep.description}</p>
                                                <p className="text-xs text-blue-500 mt-1">
                                                    Bu adım tamamlandığında kullanıcı akışta bir sonraki adıma geçecektir.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}

                        {/* ========================================= */}
                        {/* KULLANICI AYAK İZLERİ - User Footprints   */}
                        {/* ========================================= */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Image src={ICONS.history} alt="" width={20} height={20} />
                                Kullanıcı Ayak İzleri
                            </h2>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
                                <button
                                    onClick={() => setFootprintFilter('all')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${footprintFilter === 'all'
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    👣 Tümü
                                </button>
                                <button
                                    onClick={() => setFootprintFilter('store')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${footprintFilter === 'store'
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    🛍️ Mağaza
                                </button>
                                <button
                                    onClick={() => setFootprintFilter('promo')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${footprintFilter === 'promo'
                                        ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50'
                                        }`}
                                >
                                    🎁 Promokod
                                </button>
                                <button
                                    onClick={() => setFootprintFilter('app')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${footprintFilter === 'app'
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
                                        }`}
                                >
                                    📱 Uygulama
                                </button>
                            </div>

                            {/* Timeline Table */}
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                                            <th className="px-6 py-3 font-bold">Tarih</th>
                                            <th className="px-6 py-3 font-bold">İşlem</th>
                                            <th className="px-6 py-3 font-bold">Kategori</th>
                                            <th className="px-6 py-3 font-bold">Detay</th>
                                            <th className="px-6 py-3 font-bold text-right">Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredFootprints.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                        {item.date.includes(' ') ? item.date.split(' ')[0] : item.date}
                                                    </span>
                                                    <span className="ml-2 text-xs text-slate-400">
                                                        {item.date.includes(' ') ? item.date.split(' ')[1].slice(0, 5) : ''}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${item.type === 'store' ? 'bg-blue-50 border-blue-200' :
                                                            item.type === 'promo' ? 'bg-pink-50 border-pink-200' :
                                                                item.type === 'security' ? 'bg-orange-50 border-orange-200' :
                                                                    'bg-purple-50 border-purple-200'
                                                            }`}>
                                                            <Image src={item.icon} alt="" width={16} height={16} className="opacity-80" />
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                                            {item.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.type === 'store' ? 'bg-blue-100 text-blue-700' :
                                                        item.type === 'promo' ? 'bg-pink-100 text-pink-700' :
                                                            item.type === 'security' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {item.categoryLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{item.description}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${item.status === 'success' || item.status === 'completed' || item.status === 'used' || item.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                        : item.status === 'failed'
                                                            ? 'bg-red-50 text-red-600 border border-red-200'
                                                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                        }`}>
                                                        {item.status === 'success' || item.status === 'completed' || item.status === 'used' || item.status === 'active' ? 'BAŞARILI' :
                                                            item.status === 'failed' ? 'BAŞARISIZ' : 'BEKLEMEDE'}
                                                        <Image
                                                            src={item.status === 'success' || item.status === 'completed' || item.status === 'used' || item.status === 'active' ? ICONS.check :
                                                                item.status === 'failed' ? ICONS.cross : ICONS.activity}
                                                            alt=""
                                                            width={12}
                                                            height={12}
                                                        />
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredFootprints.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Image src={ICONS.history} alt="" width={48} height={48} className="opacity-20 grayscale" />
                                                        <p>Bu kategoride işlem bulunamadı.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Password Change */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                                <Image src={ICONS.key} alt="" width={20} height={20} />
                                Şifre Sıfırlama
                            </h2>
                            <p className="text-xs text-slate-700 mb-4">Yeni şifre belirleyerek kullanıcının şifresini sıfırlayabilirsiniz.</p>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Yeni şifre..."
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-slate-800"
                                    />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Image src={showPassword ? ICONS.eyeOff : ICONS.eye} alt="" width={18} height={18} className="opacity-50" />
                                    </button>
                                </div>
                                <button onClick={generatePassword} className="px-4 py-2.5 bg-slate-100 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2">
                                    <Image src={ICONS.refresh} alt="" width={14} height={14} />
                                    Üret
                                </button>
                                <button className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
                                    Şifre Sıfırla
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Hızlı İşlemler</h2>
                            <div className="space-y-2">
                                <button onClick={() => setShowPromoModal(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                                    <Image src={ICONS.gift} alt="" width={20} height={20} />
                                    Promokod Oluştur
                                </button>
                                <button onClick={() => handleAction('RevenueCat Kampanyası')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                                    <Image src={ICONS.campaign} alt="" width={20} height={20} />
                                    RevenueCat Kampanyası
                                </button>
                                <button onClick={() => handleAction('SMS Gönder')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                                    <Image src={ICONS.sms} alt="" width={20} height={20} />
                                    SMS Gönder
                                </button>
                                <button onClick={() => handleAction('E-posta Gönder')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                                    <Image src={ICONS.email} alt="" width={20} height={20} />
                                    E-posta Gönder
                                </button>
                                <button onClick={() => handleAction('Uygulama İçi Mesaj')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors">
                                    <Image src={ICONS.sms} alt="" width={20} height={20} />
                                    Uygulama İçi Mesaj
                                </button>
                            </div>
                        </div>

                        {/* VIP Control */}
                        <div className={`rounded-2xl border-2 p-6 ${isVip ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <Image src={ICONS.crown} alt="" width={20} height={20} />
                                <h2 className="text-lg font-bold text-slate-800">VIP Durumu</h2>
                            </div>
                            <p className={`text-sm mb-4 ${isVip ? 'text-yellow-700' : 'text-slate-800'}`}>
                                Bu kullanıcı şu anda {isVip ? 'VIP üye' : 'ücretsiz kullanıcı'}.
                            </p>
                            <button
                                onClick={() => setShowVipModal(true)}
                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${isVip ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                            >
                                {isVip ? 'VIP İptal Et / Değiştir' : '🎁 VIP Hediye Et'}
                            </button>
                        </div>

                        {/* System Info */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Image src={ICONS.calendar} alt="" width={20} height={20} />
                                Sistem Bilgileri
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-700">Kayıt Tarihi</span>
                                    <span className="text-slate-800 font-medium">{member.registeredDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-700">Platform</span>
                                    <span className="text-slate-800 font-medium">{member.platform}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-700">Oto. Yenileme</span>
                                    <span className="text-slate-800 font-medium">{member.autoRenew ? 'Evet' : 'Hayır'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-700">User ID</span>
                                    <span className="text-slate-800 font-mono text-xs">{member.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* VIP Gift Modal */}
            {
                showVipModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowVipModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                        <Image src={ICONS.crown} alt="" width={24} height={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">VIP Hediye Et</h3>
                                        <p className="text-xs text-slate-700">{member.name} için paket seç</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Paket Seçin</label>
                                    <div className="space-y-2">
                                        {MARKET_PACKAGES.filter(pkg => pkg.canGift).map(pkg => (
                                            <button
                                                key={pkg.id}
                                                onClick={() => setSelectedPackage(pkg.id)}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedPackage === pkg.id ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                <div className="text-left">
                                                    <p className="font-semibold text-slate-800">{pkg.name}</p>
                                                    <p className="text-xs text-slate-700">{pkg.durationLabel} • ₺{pkg.price.toLocaleString('tr-TR')}</p>
                                                </div>
                                                <span className="text-sm font-bold text-green-600">HEDİYE</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Neden (İşlem Geçmişi)</label>
                                    <input
                                        type="text"
                                        value={vipReason}
                                        onChange={e => setVipReason(e.target.value)}
                                        placeholder="Örn: Paketi yansımadı, manuel verildi"
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-700 focus:outline-none focus:border-yellow-400"
                                    />
                                </div>

                                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-800">
                                    <p className="font-semibold mb-1">📋 Not:</p>
                                    <p>Bu işlem abonelik geçmişine eklenecek ve kullanıcıya anında VIP yetkisi verilecektir.</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3">
                                <button
                                    onClick={() => setShowVipModal(false)}
                                    className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleGrantVip}
                                    disabled={!selectedPackage}
                                    className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    🎁 VIP Hediye Et
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Promokod Modal */}
            {
                showPromoModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPromoModal(false)}>
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                                        <Image src={ICONS.gift} alt="" width={24} height={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Promokod Oluştur</h3>
                                        <p className="text-xs text-slate-700">Manuel promokod oluştur ve gönder</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Promo Code */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Promokod</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="GOAL2024"
                                            className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono font-bold placeholder:text-slate-300 focus:outline-none focus:border-pink-400"
                                        />
                                        <button
                                            onClick={generatePromoCode}
                                            className="px-4 py-3 bg-pink-100 text-pink-700 rounded-xl text-sm font-bold hover:bg-pink-200 transition-colors"
                                        >
                                            🎲 Üret
                                        </button>
                                    </div>
                                </div>

                                {/* Package Selection */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Paket Seçin</label>
                                    <div className="space-y-2">
                                        {MARKET_PACKAGES.map(pkg => (
                                            <button
                                                key={pkg.id}
                                                onClick={() => {
                                                    setPromoDiscount('100')
                                                    setPromoDuration(String(pkg.duration))
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${promoDuration === String(pkg.duration) ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                                            >
                                                <div className="text-left">
                                                    <p className="font-semibold text-slate-800">{pkg.name}</p>
                                                    <p className="text-xs text-slate-700">{pkg.durationLabel} • ₺{pkg.price.toLocaleString('tr-TR')}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs text-slate-700 block">iOS: {pkg.ios.productId}</span>
                                                    <span className="text-xs text-slate-700 block">Android: {pkg.android.productId}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>


                                {/* Start & End Dates */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-2">Başlangıç</label>
                                        <input
                                            type="datetime-local"
                                            value={promoStartDate}
                                            onChange={e => setPromoStartDate(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-2">Bitiş</label>
                                        <input
                                            type="datetime-local"
                                            value={promoEndDate}
                                            onChange={e => setPromoEndDate(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-400"
                                        />
                                    </div>
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-2">Not (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        value={promoNote}
                                        onChange={e => setPromoNote(e.target.value)}
                                        placeholder="Örn: Şikayet sonrası hediye"
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-700 focus:outline-none focus:border-pink-400"
                                    />
                                </div>

                                <div className="bg-pink-50 rounded-xl p-4 text-xs text-pink-700">
                                    <p className="font-semibold mb-1">📋 Önizleme:</p>
                                    <p className="font-mono">{promoCode || 'XXXXXX'} • %{promoDiscount} indirim • {promoDuration} gün • Max {promoLimit} kişi</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex gap-3 sticky bottom-0 bg-white">
                                <button
                                    onClick={() => setShowPromoModal(false)}
                                    className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleGrantPromo}
                                    disabled={!promoCode}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Promokod Oluştur
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
