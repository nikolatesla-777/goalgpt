'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FAKE_MEMBERS, FakeMember } from '../../page'
import { SEGMENT_FLOWS, getSegmentFlow, getFlowProgress, getSortedActions, FlowStep } from './segment-flows'

// =============================================================================
// ICONS & ASSETS
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
    logout: 'https://cdn-icons-png.flaticon.com/128/1828/1828479.png',
    trash: 'https://cdn-icons-png.flaticon.com/128/1214/1214428.png',
    search: 'https://cdn-icons-png.flaticon.com/128/149/149852.png',
    filter: 'https://cdn-icons-png.flaticon.com/128/3161/3161885.png',
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
    new_registration: { label: 'Yeni Kayıt', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    trial_started: { label: 'Deneme', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    trial_converted: { label: 'Dönüşüm', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    first_purchase: { label: 'İlk Satış', color: 'bg-green-100 text-green-700 border-green-200' },
    active_subscriber: { label: 'Aktif Abone', color: 'bg-green-100 text-green-700 border-green-200' },
    loyal_subscriber: { label: 'Sadık Abone', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    payment_error: { label: 'Ödeme Hatası', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    subscription_cancel: { label: 'İptal', color: 'bg-red-100 text-red-700 border-red-200' },
    churned: { label: 'Süresi Bitti', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    win_back: { label: 'Geri Döndü', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    promo_user: { label: 'Promokod', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    free_user: { label: 'Free', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    trial_expired: { label: 'Deneme Bitmiş', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    grace_period: { label: 'Ödeme Bekleniyor', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    paused_user: { label: 'Duraklatılmış', color: 'bg-slate-200 text-slate-700 border-slate-300' },
    refunded_user: { label: 'Geri Ödeme', color: 'bg-red-100 text-red-700 border-red-200' },
    winback_target: { label: 'Geri Kazanım', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
}

// Fake Data Constants
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

const USER_SESSIONS = [
    { id: 1, platform: 'iOS', ipAddress: '85.102.45.123', country: 'TR', lastActivity: '10.12.2025 23:18', validUntil: '13.12.2025 23:18', isActive: true, createdAt: '10.12.2025 20:18' },
    { id: 2, platform: 'Android', ipAddress: '176.88.12.45', country: 'TR', lastActivity: '10.12.2025 19:58', validUntil: '13.12.2025 19:58', isActive: true, createdAt: '10.12.2025 19:58' },
    { id: 3, platform: 'iOS', ipAddress: '78.180.92.201', country: 'TR', lastActivity: '09.12.2025 14:22', validUntil: '12.12.2025 14:22', isActive: false, createdAt: '09.12.2025 14:22' },
    { id: 4, platform: 'Web', ipAddress: '31.145.88.67', country: 'TR', lastActivity: '08.12.2025 10:15', validUntil: '11.12.2025 10:15', isActive: false, createdAt: '08.12.2025 10:15' },
    { id: 5, platform: 'Android', ipAddress: '95.70.134.89', country: 'TR', lastActivity: '05.12.2025 08:45', validUntil: '08.12.2025 08:45', isActive: false, createdAt: '05.12.2025 08:45' },
]

const TWO_FA_CODES = [
    { id: 1, code: '119c1898', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 2, code: '46249839', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 3, code: 'b5df1295', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 4, code: 'e29e94aa', isUsed: false, usedAt: null, createdAt: '10.12.2025 20:17' },
    { id: 5, code: '8b642841', isUsed: true, usedAt: '10.12.2025 20:25', createdAt: '10.12.2025 20:17' },
    { id: 6, code: 'a7c38912', isUsed: true, usedAt: '09.12.2025 15:33', createdAt: '09.12.2025 15:30' },
]

const VERIFICATION_HISTORY = [
    { id: 1, type: 'forgot', code: '542001', sentAt: '10.12.2025 20:17', validUntil: '10.12.2025 20:27', status: 'used', ip: '0.0.0.0', platform: 'android', createdAt: '10.12.2025 20:17' },
    { id: 2, type: 'forgot', code: '278299', sentAt: '10.12.2025 20:13', validUntil: '10.12.2025 20:23', status: 'pending', ip: '0.0.0.0', platform: 'android', createdAt: '10.12.2025 20:13' },
    { id: 3, type: 'forgot', code: '677392', sentAt: '10.12.2025 20:10', validUntil: '10.12.2025 20:20', status: 'used', ip: '0.0.0.0', platform: 'android', createdAt: '10.12.2025 20:10' },
    { id: 4, type: 'register', code: '178866', sentAt: '10.12.2025 19:58', validUntil: '10.12.2025 20:08', status: 'used', ip: '192.168.1.9', platform: 'android', createdAt: '10.12.2025 19:58' },
    { id: 5, type: 'forgot', code: '838618', sentAt: '10.12.2025 19:01', validUntil: '10.12.2025 19:11', status: 'used', ip: '0.0.0.0', platform: 'ios', createdAt: '10.12.2025 19:01' },
]

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function MemberDetailPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params?.id as string

    const [member, setMember] = useState<FakeMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'activity' | 'security'>('overview')

    // -- State from previous component for functionality --
    const [isEditing, setIsEditing] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [subscriptionHistory, setSubscriptionHistory] = useState(SUBSCRIPTION_HISTORY)

    // Data Loading
    useEffect(() => {
        const found = FAKE_MEMBERS.find(m => m.id === userId)
        setMember(found || null)
        setLoading(false)
    }, [userId])

    // Helper: Generate derived data
    const isVip = member?.vipStatus === 'VIP'
    const isFree = !isVip
    const totalSpent = member?.amount ? member.amount * 5 : 0 // Fake LTV logic

    if (loading) return <div className="flex bg-slate-50 min-h-screen items-center justify-center text-slate-500">Yükleniyor...</div>
    if (!member) return <div className="flex bg-slate-50 min-h-screen items-center justify-center">Kullanıcı bulunamadı</div>

    return (
        <div className="min-h-screen bg-[#F8F9FC] p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-8">

                {/* =========================================================================
                    HEADER & KEY STATS (REDESIGN)
                   ========================================================================= */}
                <div className="grid grid-cols-12 gap-6">

                    {/* 1. PROFILE CARD (LEFT) */}
                    <div className="col-span-12 xl:col-span-4 bg-white rounded-[20px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col">
                        {/* Top Accent */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                        <div className="p-6 flex-grow flex flex-col">
                            {/* Profile Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex gap-5">
                                    <div className="w-[72px] h-[72px] rounded-2xl bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-700 shadow-inner">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-slate-900 mt-1">{member.name}</h1>
                                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                                            <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px] font-bold">ID: {member.id}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[220px]">{member.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {isVip && (
                                    <span className="px-3 py-1.5 rounded-full bg-[#FFF9E5] text-[#B7880B] text-xs font-bold border border-[#FDEEB3] flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                                        <Image src="https://cdn-icons-png.flaticon.com/128/10452/10452206.png" alt="" width={16} height={16} /> VIP
                                    </span>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between text-[13px]">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                        <div className="w-6 flex justify-center"><Image src="https://cdn-icons-png.flaticon.com/128/159/159832.png" alt="" width={14} height={14} className="opacity-40" /></div>
                                        Telefon
                                    </div>
                                    <span className="font-semibold text-slate-700 font-mono tracking-tight">{member.phone}</span>
                                </div>
                                <div className="flex items-center justify-between text-[13px]">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                        <div className="w-6 flex justify-center"><Image src="https://cdn-icons-png.flaticon.com/128/0/747.png" alt="" width={14} height={14} className="opacity-40" /></div>
                                        Platform
                                    </div>
                                    <span className="font-semibold text-slate-700">{member.platform}</span>
                                </div>
                                <div className="flex items-center justify-between text-[13px]">
                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                        <div className="w-6 flex justify-center"><Image src="https://cdn-icons-png.flaticon.com/128/2693/2693507.png" alt="" width={14} height={14} className="opacity-40" /></div>
                                        Kayıt
                                    </div>
                                    <span className="font-semibold text-slate-700">{member.registeredDate}</span>
                                </div>
                            </div>

                            {/* Actions Buttons */}
                            <div className="mt-auto grid grid-cols-2 gap-3">
                                <button onClick={() => router.back()} className="py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all active:scale-95">
                                    Geri Dön
                                </button>
                                <button className="py-3 rounded-xl bg-[#1E293B] text-white text-sm font-bold hover:bg-[#0F172A] transition-all active:scale-95 shadow-lg shadow-slate-900/10">
                                    Düzenle
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 2. STAT CARDS (RIGHT - 4 Vertical Cards) */}
                    <div className="col-span-12 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* 1. LTV Card */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[180px] hover:border-emerald-200 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Image src="https://cdn-icons-png.flaticon.com/128/2454/2454282.png" alt="" width={20} height={20} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">+12%</span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[12px] font-medium mb-1">Toplam Harcama (LTV)</p>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">₺{totalSpent.toLocaleString('tr-TR')}</h3>
                            </div>
                        </div>

                        {/* 2. Subscription Card */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[180px] hover:border-blue-200 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Image src="https://cdn-icons-png.flaticon.com/128/8983/8983163.png" alt="" width={20} height={20} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${member.autoRenew ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {member.autoRenew ? 'Otomatik' : 'Manuel'}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 text-[12px] font-medium">Mevcut Paket</p>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight truncate">{member.package?.name || 'Paket Yok'}</h3>
                                <p className="text-[11px] text-slate-400 font-medium">Bitiş: {member.expirationDate || '-'}</p>
                            </div>
                        </div>

                        {/* 3. Segment Card */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[180px] hover:border-purple-200 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Image src="https://cdn-icons-png.flaticon.com/128/3524/3524752.png" alt="" width={20} height={20} className="group-hover:scale-110 transition-transform opacity-70" />
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[12px] font-medium mb-2">Kullanıcı Segmenti</p>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${SEGMENT_CONFIG[member.segment]?.color || 'bg-slate-100 text-slate-700'}`}>
                                    {SEGMENT_CONFIG[member.segment]?.label || member.segment}
                                </span>
                            </div>
                        </div>

                        {/* 4. Last Seen Card */}
                        <div className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm flex flex-col justify-between min-h-[180px] hover:border-orange-200 transition-colors group">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                    <Image src="https://cdn-icons-png.flaticon.com/128/992/992700.png" alt="" width={20} height={20} className="group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-500 text-[12px] font-medium mb-1">Son Görülme</p>
                                <h3 className="text-lg font-bold text-slate-800">{member.lastActivity}</h3>
                                <p className="text-[10px] text-slate-400 font-mono mt-1 w-full truncate" title={USER_SESSIONS[0]?.ipAddress}>IP: {USER_SESSIONS[0]?.ipAddress}</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* =========================================================================
                    TABS & MAIN CONTENT
                   ========================================================================= */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
                    {/* Tabs Header */}
                    <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50 overflow-x-auto">
                        <TabButton id="overview" label="Genel Bakış" icon={ICONS.user} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <TabButton id="financial" label="Finansal Geçmiş" icon={ICONS.card} active={activeTab === 'financial'} onClick={() => setActiveTab('financial')} />
                        <TabButton id="activity" label="Aktivite & Loglar" icon={ICONS.history} active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} count={99} />
                        <TabButton id="security" label="Güvenlik" icon={ICONS.key} active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                    </div>

                    {/* Tabs Content */}
                    <div className="p-0">

                        {/* --- TAB: OVERVIEW --- */}
                        {activeTab === 'overview' && (
                            <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">

                                {/* Quick Actions Toolbar */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ActionButton icon={ICONS.gift} label="Promokod Gönder" color="pink" />
                                    <ActionButton icon={ICONS.sms} label="SMS Gönder" color="green" />
                                    <ActionButton icon={ICONS.key} label="Şifre Sıfırla" color="orange" />
                                    <ActionButton icon={ICONS.crown} label="VIP Tanımla" color="yellow" />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left: Journey Flow */}
                                    <div className="lg:col-span-2">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4">Kullanıcı Yolculuğu</h3>
                                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                            {/* Reuse existing Segment Flow logic here visually */}
                                            <div className="relative pl-8 border-l-2 border-slate-200 space-y-8">
                                                {SEGMENT_JOURNEY.map((step, idx) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[39px] w-5 h-5 rounded-full bg-white border-4 border-blue-500"></div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 text-sm">{step.note}</h4>
                                                                <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                                                                    {SEGMENT_CONFIG[step.segment]?.label}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{step.date}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Notes or Additional Info */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-4">Hızlı Notlar</h3>
                                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm text-yellow-800">
                                                <p className="font-semibold mb-1">⚠️ Sistem Notu:</p>
                                                <p>Kullanıcı daha önce 2 kez ödeme hatası almış. Riskli olabilir.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 mb-4">Cihaz Bilgisi</h3>
                                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Model</span>
                                                    <span className="font-medium text-slate-800">iPhone 14 Pro</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">OS Sürümü</span>
                                                    <span className="font-medium text-slate-800">iOS 17.2</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">App Sürümü</span>
                                                    <span className="font-medium text-slate-800">v2.4.1 (Build 104)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: FINANCIAL --- */}
                        {activeTab === 'financial' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <h3 className="font-bold text-slate-800">Abonelik & Ödeme Geçmişi</h3>
                                    <button className="text-sm text-blue-600 font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Rapor İndir (CSV)</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-8 py-4">Tarih</th>
                                                <th className="px-6 py-4">İşlem Türü</th>
                                                <th className="px-6 py-4">Ürün</th>
                                                <th className="px-6 py-4 text-right">Tutar</th>
                                                <th className="px-8 py-4 text-right">Durum</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {subscriptionHistory.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-8 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">{item.date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                            <div className={`w-2 h-2 rounded-full ${item.type === 'renewal' ? 'bg-green-500' : item.type === 'payment_failed' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                            {item.type === 'renewal' ? 'Yenileme' : item.type === 'payment_failed' ? 'Ödeme Hatası' : 'Satın Alma'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{item.product}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-800">₺{item.amount}</td>
                                                    <td className="px-8 py-4 text-right">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                            item.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                                            }`}>
                                                            {item.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ACTIVITY --- */}
                        {activeTab === 'activity' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="p-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/30">
                                    <div className="col-span-2">
                                        <h3 className="font-bold text-slate-800">Sistem Logları & Ayak İzleri</h3>
                                        <p className="text-xs text-slate-500 mt-1">Kullanıcının uygulama içerisindeki tüm hareketleri.</p>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <select className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400">
                                            <option>Tüm Zamanlar</option>
                                            <option>Son 24 Saat</option>
                                            <option>Son 7 Gün</option>
                                        </select>
                                        <select className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-400">
                                            <option>Tüm Tipler</option>
                                            <option>Hatalar</option>
                                            <option>Login</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="px-8 py-4">Zaman</th>
                                                <th className="px-6 py-4">Aksiyon</th>
                                                <th className="px-6 py-4">Detay</th>
                                                <th className="px-6 py-4">IP Adresi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {/* Reuse USER_SESSIONS mixed with history for demo */}
                                            {USER_SESSIONS.map((session, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-8 py-4 text-sm font-mono text-slate-500">{session.createdAt}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="flex items-center gap-2">
                                                            <Image src={session.platform === 'iOS' ? ICONS.ios : ICONS.android} alt="" width={16} height={16} className="opacity-70" />
                                                            <span className="text-sm font-semibold text-slate-700">Oturum Açma</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{session.country} lokasyonundan giriş yapıldı.</td>
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-500 bg-slate-50/50 w-fit">{session.ipAddress}</td>
                                                </tr>
                                            ))}
                                            {/* Add some fake logs */}
                                            <tr className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-8 py-4 text-sm font-mono text-slate-500">10.12.2025 20:15</td>
                                                <td className="px-6 py-4"><span className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div></div><span className="text-sm font-semibold text-slate-700">Sayfa Görüntüleme</span></span></td>
                                                <td className="px-6 py-4 text-sm text-slate-600">/premium-offer sayfasını görüntüledi.</td>
                                                <td className="px-6 py-4 text-sm font-mono text-slate-500">85.102.45.123</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: SECURITY --- */}
                        {activeTab === 'security' && (
                            <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Image src={ICONS.key} alt="" width={20} height={20} /> Şifre İşlemleri
                                        </h3>
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-600">Kullanıcının şifresini manuel olarak sıfırlayabilirsiniz. Yeni şifre kullanıcıya SMS/Email olarak iletilmez, buradan kopyalayıp iletmeniz gerekir.</p>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Yeni şifre..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500" />
                                                <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-900">Güncelle</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Image src={ICONS.sms} alt="" width={20} height={20} /> 2FA & Doğrulama
                                        </h3>
                                        <div className="space-y-2">
                                            {VERIFICATION_HISTORY.slice(0, 3).map((v, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{v.type === 'register' ? 'Kayıt Kodu' : 'Şifre Sıfırlama'}</p>
                                                        <p className="text-xs text-slate-500">{v.sentAt}</p>
                                                    </div>
                                                    <span className="font-mono text-lg font-bold tracking-widest text-slate-800">{v.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    )
}

// =====================================================
// SUBCOMPONENTS
// =====================================================

function TabButton({ id, label, icon, active, onClick, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all min-w-max ${active
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
        >
            <Image src={icon} alt="" width={18} height={18} className={active ? 'opacity-100' : 'opacity-60 grayscale'} />
            {label}
            {count && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">{count}</span>}
        </button>
    )
}

function ActionButton({ icon, label, color }: any) {
    const colors: any = {
        pink: 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
        green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
    }
    return (
        <button className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${colors[color]}`}>
            <Image src={icon} alt="" width={16} height={16} />
            {label}
        </button>
    )
}
