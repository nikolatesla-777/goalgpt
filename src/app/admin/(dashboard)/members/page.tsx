'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// =============================================================================
// FLATICON URLs
// =============================================================================

const ICONS = {
    search: 'https://cdn-icons-png.flaticon.com/128/3917/3917132.png',
    calendar: 'https://cdn-icons-png.flaticon.com/128/2693/2693507.png',
    users: 'https://cdn-icons-png.flaticon.com/128/681/681494.png',
    money: 'https://cdn-icons-png.flaticon.com/128/2489/2489756.png',
    edit: 'https://cdn-icons-png.flaticon.com/128/1159/1159633.png',
    trash: 'https://cdn-icons-png.flaticon.com/128/3096/3096673.png',
    crown: 'https://cdn-icons-png.flaticon.com/128/3629/3629985.png',
    check: 'https://cdn-icons-png.flaticon.com/128/190/190411.png',
    cross: 'https://cdn-icons-png.flaticon.com/128/1828/1828778.png',
    clock: 'https://cdn-icons-png.flaticon.com/128/2088/2088617.png',
    ios: 'https://cdn-icons-png.flaticon.com/128/0/747.png',
    android: 'https://cdn-icons-png.flaticon.com/128/226/226770.png',
    home: 'https://cdn-icons-png.flaticon.com/128/1946/1946488.png',
    newUser: 'https://cdn-icons-png.flaticon.com/128/1828/1828817.png',
    trial: 'https://cdn-icons-png.flaticon.com/128/1087/1087927.png',
    converted: 'https://cdn-icons-png.flaticon.com/128/190/190411.png',
    firstSale: 'https://cdn-icons-png.flaticon.com/128/3135/3135706.png',
    active: 'https://cdn-icons-png.flaticon.com/128/7518/7518748.png',
    loyal: 'https://cdn-icons-png.flaticon.com/128/3629/3629985.png',
    paymentError: 'https://cdn-icons-png.flaticon.com/128/564/564619.png',
    cancel: 'https://cdn-icons-png.flaticon.com/128/1828/1828778.png',
    churned: 'https://cdn-icons-png.flaticon.com/128/1828/1828843.png',
    winBack: 'https://cdn-icons-png.flaticon.com/128/3272/3272621.png',
    promo: 'https://cdn-icons-png.flaticon.com/128/3514/3514491.png',
    free: 'https://cdn-icons-png.flaticon.com/128/1077/1077114.png',
    all: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png',
    revenue: 'https://cdn-icons-png.flaticon.com/128/2489/2489756.png',
    gift: 'https://cdn-icons-png.flaticon.com/128/4213/4213958.png',
    campaign: 'https://cdn-icons-png.flaticon.com/128/1998/1998087.png',
    sms: 'https://cdn-icons-png.flaticon.com/128/724/724715.png',
    email: 'https://cdn-icons-png.flaticon.com/128/561/561127.png',
    menu: 'https://cdn-icons-png.flaticon.com/128/2311/2311524.png',
}

// =============================================================================
// TYPES
// =============================================================================

// Simplified segment types - 16 total (3 filters + 13 real segments)
type SegmentType =
    // Filters (not real segments)
    | 'all'
    | 'revenue_members'
    | 'auto_renew'
    // Real segments
    | 'free'            // Hiç ödeme yapmamış
    | 'trial'           // Aktif deneme
    | 'trial_expired'   // Deneme bitti, dönüşmedi
    | 'first_purchase'  // İlk ödeme yapan (INITIAL_PURCHASE)
    | 'active'          // Aktif ödemeli abone (RENEWAL)
    | 'loyal'           // 6+ ay kesintisiz
    | 'grace_period'    // Ödeme hatası, bekleniyor
    | 'cancelled'       // İptal etmiş, süresi dolmadı
    | 'churned'         // Abonelik tamamen bitti
    | 'winback_target'  // 30+ gün churned
    | 'promo'           // Promokod ile gelen
    | 'refunded'        // Geri ödeme almış
    | 'paused'          // Google Play pause

export type FakeMember = {
    id: string; name: string; email: string; phone: string; segment: SegmentType; segmentLabel: string
    vipStatus: 'VIP' | 'FREE'; platform: 'iOS' | 'Android'; autoRenew: boolean
    lastActivity: string; expirationDate: string | null; amount?: number; registeredDate: string
    package?: { name: string; price: number; interval: 'week' | 'month' | 'year' }
}

// =============================================================================
// SEGMENT CONFIG - With descriptions for UX captions
// =============================================================================

interface SegmentConfig {
    label: string
    icon: string
    color: string
    description: string // UX caption - explains what this segment means
}

const SEGMENT_CONFIG: Record<SegmentType, SegmentConfig> = {
    // FILTERS (not real segments, used for filtering)
    all: {
        label: 'Tüm Segmentler',
        icon: ICONS.all,
        color: 'bg-slate-100 text-slate-600 border-slate-200',
        description: 'Tüm kayıtlı kullanıcılar listelenir.'
    },
    revenue_members: {
        label: 'Gelir Getiren',
        icon: ICONS.revenue,
        color: 'bg-green-50 text-green-600 border-green-200',
        description: 'En az bir ödeme yapmış kullanıcılar. LTV > 0 olan tüm üyeler.'
    },
    auto_renew: {
        label: 'Oto. Yenileme',
        icon: ICONS.check,
        color: 'bg-teal-50 text-teal-600 border-teal-200',
        description: 'Otomatik yenileme aktif olan aboneler. Bir sonraki dönemde otomatik ödeme alınacak.'
    },

    // FREE / REGISTRATION
    free: {
        label: 'Free',
        icon: ICONS.free,
        color: 'bg-slate-50 text-slate-500 border-slate-200',
        description: 'Kayıt olmuş ama hiç ödeme yapmamış kullanıcılar. Trial bile başlamamış.'
    },

    // TRIAL STATES
    trial: {
        label: 'Deneme',
        icon: ICONS.trial,
        color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
        description: 'Aktif deneme sürecinde olan kullanıcılar. Trial süresi devam ediyor.'
    },
    trial_expired: {
        label: 'Deneme Bitmiş',
        icon: ICONS.clock,
        color: 'bg-orange-50 text-orange-600 border-orange-200',
        description: 'Deneme süresi dolmuş, ödemeye geçmemiş kullanıcılar. Dönüşüm fırsatı!'
    },

    // FIRST PURCHASE
    first_purchase: {
        label: 'İlk Satış',
        icon: ICONS.money,
        color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        description: 'Bugün ilk ödeme yapan kullanıcılar. INITIAL_PURCHASE event ile tetiklenir. En önemli dönüşüm metrisi!'
    },    // ACTIVE SUBSCRIBERS
    active: {
        label: 'Aktif Abone',
        icon: ICONS.active,
        color: 'bg-green-50 text-green-600 border-green-200',
        description: 'Aktif ödeme yapan aboneler. Abonelik geçerli ve ödeme güncel.'
    },
    loyal: {
        label: 'Sadık Abone',
        icon: ICONS.loyal,
        color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        description: '6+ ay kesintisiz abone olan VIP kullanıcılar. En değerli segment!'
    },

    // ISSUES
    grace_period: {
        label: 'Ödeme Bekleniyor',
        icon: ICONS.paymentError,
        color: 'bg-amber-50 text-amber-600 border-amber-200',
        description: 'Kart hatası yaşayan kullanıcılar. Grace period içinde, kurtarılabilir!'
    },
    cancelled: {
        label: 'İptal',
        icon: ICONS.cancel,
        color: 'bg-red-50 text-red-600 border-red-200',
        description: 'Aboneliğini iptal etmiş ama süresi henüz dolmamış kullanıcılar.'
    },

    // CHURNED
    churned: {
        label: 'Süresi Bitti',
        icon: ICONS.churned,
        color: 'bg-slate-200 text-slate-700 border-slate-300',
        description: 'Aboneliği tamamen sona ermiş kullanıcılar. Geri kazanım kampanyası hedefi.'
    },
    winback_target: {
        label: 'Geri Kazanım',
        icon: ICONS.gift,
        color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
        description: '30+ gün önce churned olmuş kullanıcılar. Özel teklif ile geri kazanılabilir.'
    },

    // SPECIAL
    promo: {
        label: 'Promokod',
        icon: ICONS.promo,
        color: 'bg-pink-50 text-pink-600 border-pink-200',
        description: 'Promokod ile gelen kullanıcılar. Hangi kodun hangi kampanyadan geldiği takip edilir.'
    },
    refunded: {
        label: 'Geri Ödeme',
        icon: ICONS.money,
        color: 'bg-red-100 text-red-700 border-red-200',
        description: 'Geri ödeme (refund) almış kullanıcılar. Dikkatle izlenmesi gereken segment.'
    },
    paused: {
        label: 'Duraklatılmış',
        icon: ICONS.clock,
        color: 'bg-slate-100 text-slate-600 border-slate-300',
        description: 'Google Play üzerinden aboneliğini duraklatmış kullanıcılar.'
    }
}

const DATE_PRESETS = [
    { value: 'today', label: 'Bugün' },
    { value: 'yesterday', label: 'Dün' },
    { value: 'last_7_days', label: 'Son 7 Gün' },
    { value: 'this_month', label: 'Bu Ay' },
    { value: 'all_time', label: 'Tümü' }
]

// =============================================================================
// FAKE DATA - Günlük 25.000 TL gelir için gerçekçi veri
// =============================================================================

const turkishNames = [
    'Ali Yılmaz', 'Seda Kara', 'Mehmet Kaya', 'Zeynep Demir', 'Can Arslan', 'Fatma Çelik', 'Burak Yıldız', 'Elif Şahin',
    'Ahmet Öztürk', 'Selin Acar', 'Emre Koç', 'Deniz Polat', 'Ayşe Yıldırım', 'Murat Öz', 'Kerem Aktaş', 'Ozan Çetin',
    'Hakan Demir', 'Esra Kılıç', 'Tolga Aksoy', 'Merve Yalçın', 'Serkan Özdemir', 'İrem Aydın', 'Umut Şen', 'Gizem Koç',
    'Volkan Eren', 'Pınar Güneş', 'Cem Yavuz', 'Nazlı Kurt', 'Barış Özkan', 'Sibel Doğan', 'Kaan Arslan', 'Damla Çelik',
    'Onur Kaya', 'Meltem Yıldız', 'Berk Güler', 'Ceren Şahin', 'Alper Korkmaz', 'Tuğba Özdemir', 'Erdem Yılmaz', 'Simge Acar',
    'Koray Yılmaz', 'Defne Aydın', 'Taner Koç', 'Eylül Kaya', 'Selim Demir', 'Gül Çetin', 'Yusuf Şen', 'Ebru Polat'
]

// Bugünün tarihini al
const now = new Date()
const todayStr = now.toISOString().split('T')[0]
const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
const days3Str = new Date(now.getTime() - 86400000 * 3).toISOString().split('T')[0]
const days5Str = new Date(now.getTime() - 86400000 * 5).toISOString().split('T')[0]

function generateEmail(name: string): string {
    return name.toLowerCase().replace(' ', '.').replace(/[ıİşŞğĞüÜöÖçÇ]/g, c =>
        ({ 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' }[c] || c)
    ) + '@gmail.com'
}

function generatePhone(): string {
    return `+90 5${Math.floor(30 + Math.random() * 10)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)}`
}

// 750 Aktif abone için gerçekçi dağılım
// Günlük ~25.000 TL gelir (167 satış x 149.99 TL)
const memberData: { segment: SegmentType; label: string; count: number; date: string; hasAmount: boolean; vip: 'VIP' | 'FREE'; autoRenew: boolean }[] = [
    // BUGÜN - Yoğun gün (~250 aktif işlem)
    { segment: 'first_purchase', label: 'İlk Satış', count: 55, date: todayStr, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'active', label: 'Aktif Abone', count: 100, date: todayStr, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'loyal', label: 'Sadık Abone', count: 80, date: todayStr, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'trial', label: 'Deneme', count: 65, date: todayStr, hasAmount: false, vip: 'VIP', autoRenew: true },
    { segment: 'trial_expired', label: 'Deneme Bitmiş', count: 30, date: todayStr, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'free', label: 'Free', count: 85, date: todayStr, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'promo', label: 'Promokod', count: 25, date: todayStr, hasAmount: false, vip: 'VIP', autoRenew: true },
    { segment: 'grace_period', label: 'Ödeme Bekleniyor', count: 12, date: todayStr, hasAmount: false, vip: 'VIP', autoRenew: true },
    { segment: 'cancelled', label: 'İptal', count: 18, date: todayStr, hasAmount: false, vip: 'VIP', autoRenew: false },
    { segment: 'churned', label: 'Süresi Bitti', count: 20, date: todayStr, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'winback_target', label: 'Geri Kazanım', count: 15, date: todayStr, hasAmount: false, vip: 'FREE', autoRenew: false },
    // DÜN (~200 aktif işlem)
    { segment: 'first_purchase', label: 'İlk Satış', count: 45, date: yesterdayStr, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'active', label: 'Aktif Abone', count: 120, date: yesterdayStr, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'loyal', label: 'Sadık Abone', count: 70, date: yesterdayStr, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'trial', label: 'Deneme', count: 45, date: yesterdayStr, hasAmount: false, vip: 'VIP', autoRenew: true },
    { segment: 'free', label: 'Free', count: 60, date: yesterdayStr, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'churned', label: 'Süresi Bitti', count: 15, date: yesterdayStr, hasAmount: false, vip: 'FREE', autoRenew: false },
    // 3 GÜN ÖNCE
    { segment: 'active', label: 'Aktif Abone', count: 100, date: days3Str, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'loyal', label: 'Sadık Abone', count: 80, date: days3Str, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'free', label: 'Free', count: 40, date: days3Str, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'refunded', label: 'Geri Ödeme', count: 5, date: days3Str, hasAmount: false, vip: 'FREE', autoRenew: false },
    // 5 GÜN ÖNCE
    { segment: 'loyal', label: 'Sadık Abone', count: 60, date: days5Str, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'active', label: 'Aktif Abone', count: 50, date: days5Str, hasAmount: true, vip: 'VIP', autoRenew: true },
    { segment: 'churned', label: 'Süresi Bitti', count: 25, date: days5Str, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'free', label: 'Free', count: 45, date: days5Str, hasAmount: false, vip: 'FREE', autoRenew: false },
    { segment: 'paused', label: 'Duraklatılmış', count: 8, date: days5Str, hasAmount: false, vip: 'VIP', autoRenew: false },
]

let memberId = 1
export const FAKE_MEMBERS: FakeMember[] = []

memberData.forEach(data => {
    for (let i = 0; i < data.count; i++) {
        const name = turkishNames[(memberId - 1) % turkishNames.length]
        // Fiyatlandırma: %80 haftalık (250 TL), %20 aylık (800 TL)
        const isWeekly = Math.random() < 0.8
        const packagePrice = isWeekly ? 250 : 800
        FAKE_MEMBERS.push({
            id: String(memberId++),
            name: name + (memberId > turkishNames.length ? ` ${Math.floor(memberId / turkishNames.length)}` : ''),
            email: generateEmail(name) + (memberId > turkishNames.length ? memberId : ''),
            phone: generatePhone(),
            segment: data.segment,
            segmentLabel: data.label,
            vipStatus: data.vip,
            platform: Math.random() > 0.5 ? 'iOS' : 'Android',
            autoRenew: data.autoRenew,
            lastActivity: ['2 dk', '5 dk', '12 dk', '30 dk', '1 saat', '2 saat'][Math.floor(Math.random() * 6)] + ' önce',
            expirationDate: data.vip === 'VIP' ? `${Math.floor(10 + Math.random() * 20)} Ara 2024` : null,
            amount: data.hasAmount ? packagePrice : undefined,
            registeredDate: data.date,
            package: data.vip === 'VIP' ? {
                name: isWeekly ? 'Haftalık Premium' : 'Aylık Premium',
                price: packagePrice,
                interval: isWeekly ? 'week' : 'month'
            } : undefined
        })
    }
})

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function MembersPage() {
    const router = useRouter()
    const [selectedSegment, setSelectedSegment] = useState<SegmentType>('all')
    const [search, setSearch] = useState('')
    const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all')
    const [dateFilter, setDateFilter] = useState('today')
    const [showSegmentDropdown, setShowSegmentDropdown] = useState(false)
    const [showDateDropdown, setShowDateDropdown] = useState(false)
    const [actionMenuId, setActionMenuId] = useState<string | null>(null)

    const filteredMembers = useMemo(() => {
        const today = new Date()
        const getDateRange = (filter: string) => {
            const end = new Date(today); end.setHours(23, 59, 59, 999)
            const start = new Date(today); start.setHours(0, 0, 0, 0)
            switch (filter) {
                case 'yesterday': start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); break
                case 'last_7_days': start.setDate(start.getDate() - 7); break
                case 'this_month': start.setDate(1); break
                case 'all_time': start.setFullYear(2020); break
            }
            return { start, end }
        }
        const { start, end } = getDateRange(dateFilter)
        return FAKE_MEMBERS.filter(m => {
            if (selectedSegment === 'revenue_members' && !m.amount) return false
            if (selectedSegment === 'auto_renew' && !m.autoRenew) return false
            if (selectedSegment !== 'all' && selectedSegment !== 'revenue_members' && selectedSegment !== 'auto_renew' && m.segment !== selectedSegment) return false
            if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false
            if (platform !== 'all' && m.platform.toLowerCase() !== platform) return false
            const d = new Date(m.registeredDate + 'T12:00:00')
            if (d < start || d > end) return false
            return true
        })
    }, [selectedSegment, search, platform, dateFilter])

    const stats = useMemo(() => {
        const m = filteredMembers
        // Aktif abone sayısı TARİH FİLTRESİNDEN BAĞIMSIZ - anlık toplam
        const allVip = FAKE_MEMBERS.filter(x => x.vipStatus === 'VIP')
        return {
            totalRevenue: m.filter(x => x.amount).reduce((s, x) => s + (x.amount || 0), 0),
            iosRevenue: m.filter(x => x.platform === 'iOS' && x.amount).reduce((s, x) => s + (x.amount || 0), 0),
            androidRevenue: m.filter(x => x.platform === 'Android' && x.amount).reduce((s, x) => s + (x.amount || 0), 0),
            // Aktif abone - TÜM üyelerden (tarihten bağımsız)
            totalActive: allVip.length,
            iosActive: allVip.filter(x => x.platform === 'iOS').length,
            androidActive: allVip.filter(x => x.platform === 'Android').length,
            // Diğer metrikler tarih filtresine bağlı
            newUsers: m.filter(x => x.segment === 'free').length,
            trial: m.filter(x => x.segment === 'trial').length,
            firstPurchase: m.filter(x => x.segment === 'first_purchase').length,
            loyal: m.filter(x => x.segment === 'loyal').length,
            cancel: m.filter(x => x.segment === 'cancelled').length,
            paymentError: m.filter(x => x.segment === 'grace_period').length,
            winBack: m.filter(x => x.segment === 'winback_target').length,
            revenueMembers: m.filter(x => x.amount).length,
        }
    }, [filteredMembers])

    const allSegments: SegmentType[] = Object.keys(SEGMENT_CONFIG) as SegmentType[]

    const handleAction = (action: string, member: FakeMember) => {
        alert(`${action} → ${member.name} (${member.email})`)
        setActionMenuId(null)
    }

    return (
        <div className="min-h-screen bg-[#fafafa] p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* FILTER BAR */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="relative">
                            <label className="text-xs text-slate-500 font-medium mb-2 block">Segment</label>
                            <button onClick={() => setShowSegmentDropdown(!showSegmentDropdown)}
                                className={`flex items-center gap-3 px-4 py-3 text-sm border-2 rounded-xl transition-all min-w-[200px] ${SEGMENT_CONFIG[selectedSegment].color}`}>
                                <Image src={SEGMENT_CONFIG[selectedSegment].icon} alt="" width={18} height={18} />
                                <span className="font-semibold">{SEGMENT_CONFIG[selectedSegment].label}</span>
                                <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded-full">{filteredMembers.length}</span>
                            </button>
                            {showSegmentDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                                    {allSegments.map(seg => (
                                        <button key={seg} onClick={() => { setSelectedSegment(seg); setShowSegmentDropdown(false) }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50 ${selectedSegment === seg ? 'bg-slate-50' : ''}`}>
                                            <Image src={SEGMENT_CONFIG[seg].icon} alt="" width={18} height={18} />
                                            <span className="flex-1 font-medium text-slate-700">{SEGMENT_CONFIG[seg].label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-[280px]">
                            <label className="text-xs text-slate-500 font-medium mb-2 block">Arama</label>
                            <div className="relative">
                                <Image src={ICONS.search} alt="search" width={18} height={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
                                <input type="text" placeholder="İsim veya e-posta ara..." value={search} onChange={e => setSearch(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 font-medium mb-2 block">Platform</label>
                            <div className="flex bg-slate-100 rounded-xl p-1">
                                {(['all', 'ios', 'android'] as const).map(p => (
                                    <button key={p} onClick={() => setPlatform(p)}
                                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${platform === p ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                        {p === 'all' ? 'Tümü' : p === 'ios' ? 'iOS' : 'Android'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-xs text-slate-500 font-medium mb-2 block">Tarih</label>
                            <button onClick={() => setShowDateDropdown(!showDateDropdown)}
                                className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-sm hover:border-slate-300 min-w-[140px]">
                                <Image src={ICONS.calendar} alt="calendar" width={18} height={18} className="opacity-60" />
                                <span className="font-semibold text-slate-700">{DATE_PRESETS.find(d => d.value === dateFilter)?.label}</span>
                            </button>
                            {showDateDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                                    {DATE_PRESETS.map(preset => (
                                        <button key={preset.value} onClick={() => { setDateFilter(preset.value); setShowDateDropdown(false) }}
                                            className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${dateFilter === preset.value ? 'bg-slate-50 text-blue-600 font-semibold' : 'text-slate-600'}`}>
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <Image src={ICONS.users} alt="users" width={32} height={32} />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800">Üye Yönetimi</h1>
                        <p className="text-sm text-slate-500">Toplam {FAKE_MEMBERS.length.toLocaleString('tr-TR')} kayıtlı üye</p>
                    </div>
                    <button
                        onClick={() => { setSelectedSegment('all'); setPlatform('all'); setSearch(''); setDateFilter('today') }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                        title="Tüm Filtreleri Sıfırla"
                    >
                        <Image src={ICONS.home} alt="home" width={20} height={20} />
                        <span className="text-sm font-medium text-slate-600">Ana Sayfa</span>
                    </button>
                </div>

                {/* STATS ROW 1 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <button
                        onClick={() => setSelectedSegment('revenue_members')}
                        className={`col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-2 rounded-2xl p-6 text-left transition-all hover:shadow-lg ${selectedSegment === 'revenue_members' ? 'border-green-500 shadow-lg' : 'border-green-200'}`}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <Image src={ICONS.money} alt="money" width={24} height={24} />
                            <span className="text-sm font-semibold text-green-700">Toplam Gelir</span>
                            <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">{stats.revenueMembers} kişi</span>
                        </div>
                        <p className="text-3xl font-bold text-green-800">₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
                        <div className="flex gap-6 mt-4 text-sm">
                            <span className="text-slate-600 flex items-center gap-2"><Image src={ICONS.ios} alt="ios" width={14} height={14} /> ₺{stats.iosRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-green-600 flex items-center gap-2"><Image src={ICONS.android} alt="android" width={14} height={14} /> ₺{stats.androidRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </button>

                    <button onClick={() => setSelectedSegment('active')} className={`bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-lg ${selectedSegment === 'active' ? 'border-green-400 shadow-lg' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Image src={ICONS.active} alt="active" width={20} height={20} />
                            <span className="text-sm font-semibold text-slate-600">Aktif Abone</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalActive} <span className="text-sm font-normal text-slate-400">kişi</span></p>
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Image src={ICONS.ios} alt="" width={12} height={12} /> {stats.iosActive}</span>
                            <span className="flex items-center gap-1"><Image src={ICONS.android} alt="" width={12} height={12} /> {stats.androidActive}</span>
                        </div>
                    </button>

                    <button onClick={() => setSelectedSegment('first_purchase')} className={`bg-white border-2 rounded-2xl p-6 text-left transition-all hover:shadow-lg ${selectedSegment === 'first_purchase' ? 'border-emerald-400 shadow-lg' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <Image src={ICONS.money} alt="first" width={20} height={20} />
                            <span className="text-sm font-semibold text-slate-600">İlk Satış</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">{stats.firstPurchase} <span className="text-sm font-normal text-slate-400">kişi</span></p>
                    </button>
                </div>

                {/* STATS ROW 2 - Original layout + Geri Kazanım */}
                <div className="grid grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                        { seg: 'free' as SegmentType, icon: ICONS.newUser, label: 'Yeni Kayıt', count: stats.newUsers },
                        { seg: 'trial' as SegmentType, icon: ICONS.trial, label: 'Deneme', count: stats.trial },
                        { seg: 'active' as SegmentType, icon: ICONS.winBack, label: 'Geri Dönenler', count: stats.winBack },
                        { seg: 'loyal' as SegmentType, icon: ICONS.loyal, label: 'Sadık', count: stats.loyal },
                        { seg: 'cancelled' as SegmentType, icon: ICONS.cancel, label: 'İptal', count: stats.cancel },
                        { seg: 'grace_period' as SegmentType, icon: ICONS.paymentError, label: 'Ödeme Hatası', count: stats.paymentError },
                        { seg: 'winback_target' as SegmentType, icon: ICONS.gift, label: 'Geri Kazanım', count: stats.winBack },
                    ].map(item => (
                        <button key={item.seg + item.label} onClick={() => setSelectedSegment(item.seg)}
                            className={`bg-white border-2 rounded-xl p-5 text-left transition-all hover:shadow-md ${selectedSegment === item.seg ? 'border-blue-400 shadow-md' : 'border-slate-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Image src={item.icon} alt={item.label} width={18} height={18} className="opacity-70" />
                                <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{item.count} <span className="text-xs font-normal text-slate-400">kişi</span></p>
                        </button>
                    ))}
                </div>

                {/* SEGMENT DESCRIPTION CAPTION */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Image src={SEGMENT_CONFIG[selectedSegment].icon} alt="" width={18} height={18} className="brightness-200" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-blue-800">{SEGMENT_CONFIG[selectedSegment].label}</h4>
                            <p className="text-sm text-blue-700 mt-1">{SEGMENT_CONFIG[selectedSegment].description}</p>
                            <p className="text-xs text-blue-500 mt-2">
                                <span className="font-semibold">{filteredMembers.length}</span> kullanıcı bu kriterlere uyuyor
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                {['#', 'Kullanıcı', 'Telefon', 'Segment', 'VIP', 'Platform', 'Oto', 'Aktivite', 'Bitiş', 'İşlemler'].map(h => (
                                    <th key={h} className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMembers.slice(0, 50).map((m, i) => (
                                <tr
                                    key={m.id}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/admin/members/detail/${m.id}`)}
                                >
                                    <td className="px-4 py-4 text-sm text-slate-400">{i + 1}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{m.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                                                <p className="text-xs text-slate-400">{m.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-500">{m.phone}</td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${SEGMENT_CONFIG[m.segment].color}`}>
                                            <Image src={SEGMENT_CONFIG[m.segment].icon} alt="" width={14} height={14} />
                                            {m.segmentLabel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {m.vipStatus === 'VIP' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300">
                                                <Image src={ICONS.crown} alt="" width={12} height={12} /> VIP
                                            </span>
                                        ) : <span className="text-xs text-slate-400">FREE</span>}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 w-fit ${m.platform === 'iOS' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>
                                            <Image src={m.platform === 'iOS' ? ICONS.ios : ICONS.android} alt="" width={12} height={12} />
                                            {m.platform}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Image src={m.autoRenew ? ICONS.check : ICONS.cross} alt="" width={18} height={18} />
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <Image src={ICONS.clock} alt="" width={12} height={12} className="opacity-50" />
                                            {m.lastActivity}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-xs text-slate-400">{m.expirationDate || '-'}</td>
                                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                        <div className="relative">
                                            <button
                                                onClick={() => setActionMenuId(actionMenuId === m.id ? null : m.id)}
                                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                                            >
                                                <Image src={ICONS.menu} alt="menu" width={16} height={16} className="opacity-60" />
                                            </button>

                                            {actionMenuId === m.id && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                                                    <div className="p-2">
                                                        <p className="text-xs text-slate-400 px-3 py-2 border-b border-slate-100">İşlemler</p>
                                                        <button onClick={() => handleAction('Promokod Gönder', m)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                                            <Image src={ICONS.gift} alt="" width={16} height={16} />
                                                            Promokod Gönder
                                                        </button>
                                                        <button onClick={() => handleAction('RevenueCat Kampanyası', m)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                                            <Image src={ICONS.campaign} alt="" width={16} height={16} />
                                                            RevenueCat Kampanyası
                                                        </button>
                                                        <button onClick={() => handleAction('SMS Gönder', m)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                                            <Image src={ICONS.sms} alt="" width={16} height={16} />
                                                            SMS Gönder
                                                        </button>
                                                        <button onClick={() => handleAction('E-posta Gönder', m)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                                                            <Image src={ICONS.email} alt="" width={16} height={16} />
                                                            E-posta Gönder
                                                        </button>
                                                        <div className="border-t border-slate-100 mt-2 pt-2">
                                                            <button onClick={() => router.push(`/admin/members/detail/${m.id}`)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                                                                <Image src={ICONS.edit} alt="" width={16} height={16} />
                                                                Detay Görüntüle
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredMembers.length > 50 && (
                        <div className="p-4 border-t border-slate-200 text-center text-sm text-slate-500">
                            +{filteredMembers.length - 50} daha fazla üye gösterilmiyor
                        </div>
                    )}
                </div>
            </div>

            {(showSegmentDropdown || showDateDropdown || actionMenuId) && (
                <div className="fixed inset-0 z-40" onClick={() => { setShowSegmentDropdown(false); setShowDateDropdown(false); setActionMenuId(null) }} />
            )}
        </div>
    )
}
