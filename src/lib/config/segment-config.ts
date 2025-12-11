import {
    UserPlus,
    User,
    PlayCircle,
    Clock,
    CreditCard,
    AlertTriangle,
    Pause,
    UserMinus,
    Target,
    RotateCcw,
    Gift,
    Megaphone,
    MessageSquare,
    Mail,
    Bell,
    Percent
} from 'lucide-react'
import type { SegmentType, RecommendedAction } from '../types/segments'

// =============================================================================
// SEGMENT CONFIGURATION - Renkler, İkonlar, Aksiyonlar
// =============================================================================

export interface SegmentConfig {
    label: string
    labelEn: string
    description: string
    color: string
    bgColor: string
    borderColor: string
    iconName: string
    icon: any
    priority: number // Sıralama için
    actions: RecommendedAction[]
}

export const SEGMENT_CONFIG: Record<SegmentType, SegmentConfig> = {
    new_user: {
        label: 'Yeni Üye',
        labelEn: 'New User',
        description: 'Son 7 günde kayıt olmuş kullanıcılar',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        borderColor: 'border-cyan-500',
        iconName: 'UserPlus',
        icon: UserPlus,
        priority: 1,
        actions: [
            { id: 'welcome_push', label: 'Hoş Geldin Push', icon: 'Bell', priority: 'high', color: 'text-blue-500' },
            { id: 'trial_offer', label: 'Trial Teklifi', icon: 'Gift', priority: 'high', color: 'text-pink-500' },
            { id: 'onboarding_email', label: 'Onboarding Email', icon: 'Mail', priority: 'medium', color: 'text-purple-500' }
        ]
    },

    free_user: {
        label: 'Ücretsiz Üye',
        labelEn: 'Free User',
        description: 'Kayıt olmuş ama hiç satın alma yapmamış',
        color: 'text-slate-600',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-400',
        iconName: 'User',
        icon: User,
        priority: 2,
        actions: [
            { id: 'trial_offer', label: 'Trial Teklifi', icon: 'Gift', priority: 'high', color: 'text-pink-500' },
            { id: 'discount_campaign', label: 'İndirim Kampanyası', icon: 'Percent', priority: 'medium', color: 'text-orange-500' },
            { id: 'feature_highlight', label: 'Özellik Tanıtımı', icon: 'Megaphone', priority: 'low', color: 'text-blue-500' }
        ]
    },

    trial_user: {
        label: 'Deneme',
        labelEn: 'Trial User',
        description: 'Ücretsiz deneme sürecinde',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-500',
        iconName: 'PlayCircle',
        icon: PlayCircle,
        priority: 3,
        actions: [
            { id: 'trial_reminder', label: 'Deneme Hatırlatması', icon: 'Bell', priority: 'high', color: 'text-indigo-500' },
            { id: 'value_highlight', label: 'Değer Önerisi', icon: 'Megaphone', priority: 'medium', color: 'text-blue-500' },
            { id: 'conversion_offer', label: 'Dönüşüm Teklifi', icon: 'Gift', priority: 'high', color: 'text-pink-500' }
        ]
    },

    trial_expired: {
        label: 'Deneme Bitti',
        labelEn: 'Trial Expired',
        description: 'Deneme süresi dolmuş, satın almamış',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-500',
        iconName: 'Clock',
        icon: Clock,
        priority: 4,
        actions: [
            { id: 'last_chance', label: 'Son Şans Teklifi', icon: 'Gift', priority: 'high', color: 'text-red-500' },
            { id: 'extended_trial', label: 'Uzatılmış Deneme', icon: 'PlayCircle', priority: 'high', color: 'text-indigo-500' },
            { id: 'feedback_request', label: 'Geri Bildirim İste', icon: 'MessageSquare', priority: 'medium', color: 'text-green-500' }
        ]
    },

    active_subscriber: {
        label: 'Aktif Abone',
        labelEn: 'Active Subscriber',
        description: 'Aktif ücretli aboneliği var',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-500',
        iconName: 'CreditCard',
        icon: CreditCard,
        priority: 5,
        actions: [
            { id: 'upsell', label: 'Üst Paket Teklifi', icon: 'Gift', priority: 'medium', color: 'text-purple-500' },
            { id: 'referral', label: 'Arkadaşını Getir', icon: 'UserPlus', priority: 'low', color: 'text-blue-500' },
            { id: 'thank_you', label: 'Teşekkür Mesajı', icon: 'Mail', priority: 'low', color: 'text-pink-500' }
        ]
    },

    grace_period: {
        label: 'Ödeme Bekliyor',
        labelEn: 'Grace Period',
        description: 'Ödeme başarısız, grace period süreci',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-500',
        iconName: 'AlertTriangle',
        icon: AlertTriangle,
        priority: 6,
        actions: [
            { id: 'payment_reminder', label: 'Ödeme Hatırlatması', icon: 'Bell', priority: 'high', color: 'text-red-500' },
            { id: 'update_payment', label: 'Kart Güncelleme', icon: 'CreditCard', priority: 'high', color: 'text-orange-500' },
            { id: 'sms_urgent', label: 'Acil SMS', icon: 'MessageSquare', priority: 'high', color: 'text-red-600' }
        ]
    },

    paused_user: {
        label: 'Duraklatılmış',
        labelEn: 'Paused',
        description: 'Abonelik duraklatılmış',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-500',
        iconName: 'Pause',
        icon: Pause,
        priority: 7,
        actions: [
            { id: 'resume_offer', label: 'Devam Teklifi', icon: 'Gift', priority: 'medium', color: 'text-green-500' },
            { id: 'check_in', label: 'Durum Kontrolü', icon: 'MessageSquare', priority: 'low', color: 'text-blue-500' }
        ]
    },

    churned_user: {
        label: 'Ayrılan',
        labelEn: 'Churned',
        description: 'Abonelik iptal/sona ermiş',
        color: 'text-slate-500',
        bgColor: 'bg-slate-200',
        borderColor: 'border-slate-400',
        iconName: 'UserMinus',
        icon: UserMinus,
        priority: 8,
        actions: [
            { id: 'winback_offer', label: 'Geri Kazanım', icon: 'Gift', priority: 'high', color: 'text-pink-500' },
            { id: 'exit_survey', label: 'Çıkış Anketi', icon: 'MessageSquare', priority: 'medium', color: 'text-blue-500' },
            { id: 'special_discount', label: 'Özel İndirim', icon: 'Percent', priority: 'high', color: 'text-orange-500' }
        ]
    },

    winback_target: {
        label: 'Geri Kazanım',
        labelEn: 'Winback Target',
        description: 'Geri kazanılabilir segment',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-500',
        iconName: 'Target',
        icon: Target,
        priority: 9,
        actions: [
            { id: 'aggressive_offer', label: 'Agresif Teklif', icon: 'Gift', priority: 'high', color: 'text-red-500' },
            { id: 'personal_email', label: 'Kişisel Email', icon: 'Mail', priority: 'high', color: 'text-purple-500' },
            { id: 'sms_campaign', label: 'SMS Kampanyası', icon: 'MessageSquare', priority: 'medium', color: 'text-green-500' }
        ]
    },

    refunded_user: {
        label: 'İade Almış',
        labelEn: 'Refunded',
        description: 'İade işlemi yapılmış',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100',
        borderColor: 'border-rose-500',
        iconName: 'RotateCcw',
        icon: RotateCcw,
        priority: 10,
        actions: [
            { id: 'feedback_request', label: 'Geri Bildirim', icon: 'MessageSquare', priority: 'high', color: 'text-blue-500' },
            { id: 'improvement_note', label: 'İyileştirme Notu', icon: 'Mail', priority: 'medium', color: 'text-slate-500' }
        ]
    }
}

/**
 * Segment'e göre config al
 */
export function getSegmentConfig(segment: SegmentType): SegmentConfig {
    return SEGMENT_CONFIG[segment] || SEGMENT_CONFIG.free_user
}

/**
 * Tüm segment listesi (sıralı)
 */
export function getAllSegments(): { type: SegmentType, config: SegmentConfig }[] {
    return Object.entries(SEGMENT_CONFIG)
        .map(([type, config]) => ({ type: type as SegmentType, config }))
        .sort((a, b) => a.config.priority - b.config.priority)
}

/**
 * Segment için önerilen aksiyonları al
 */
export function getRecommendedActions(segment: SegmentType): RecommendedAction[] {
    return SEGMENT_CONFIG[segment]?.actions || []
}
