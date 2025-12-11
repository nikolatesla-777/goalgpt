// =============================================================================
// SEGMENT TYPES - Merkezi Tip Tanımları
// =============================================================================

/**
 * Kullanıcı segment tipleri
 * RevenueCat webhook'ları ve cron job'lar bu segmentleri günceller
 */
export type SegmentType =
    | 'new_user'           // Kayıt < 7 gün
    | 'free_user'          // Kayıt > 7 gün, hiç işlem yapmamış
    | 'trial_user'         // Trial aktif
    | 'trial_expired'      // Trial bitti, satın almadı
    | 'active_subscriber'  // Aktif ücretli abonelik
    | 'grace_period'       // Ödeme başarısız, grace period
    | 'paused_user'        // Abonelik duraklatılmış
    | 'churned_user'       // Abonelik bitti/iptal edildi
    | 'winback_target'     // Churn olmuş, geri kazanım hedefi
    | 'refunded_user'      // İade almış

/**
 * Platform tipleri
 */
export type Platform = 'apple' | 'google'

/**
 * Abonelik durumu
 */
export interface Subscription {
    id: string
    product_id: string
    product_name: string
    status: 'active' | 'expired' | 'in_grace_period' | 'paused' | 'cancelled'
    is_trial: boolean
    trial_start?: Date
    trial_end?: Date
    purchase_date?: Date
    expiration_date?: Date
    renewal_date?: Date
    price?: number
    currency?: string
}

/**
 * Kullanıcı aksiyonu
 */
export interface UserAction {
    id: string
    user_id: string
    action_type: 'sms' | 'email' | 'push' | 'promocode' | 'campaign'
    action_detail?: string
    created_at: Date
    created_by?: string
}

/**
 * Temel kullanıcı modeli
 */
export interface User {
    id: string
    name: string
    email: string
    phone?: string
    platform: Platform
    segment: SegmentType

    // Tarihler
    created_at: Date
    last_seen: Date

    // Finansal metrikler
    total_spent: number
    transaction_count: number

    // Abonelik
    subscription?: Subscription

    // Metadata
    app_version?: string
    device_info?: string
    country?: string
}

/**
 * Dashboard metrikleri
 */
export interface DashboardMetrics {
    revenue: MetricData
    activeSubs: MetricData
    totalSales: MetricData
    billingErrors: MetricData
    newRegistrations: MetricData
    trialStarters: MetricData
    firstSales: MetricData
    trialConversions: MetricData
    cancellations: MetricData
    churn: MetricData
    reactivations: MetricData
    totalUsers: MetricData
}

export interface MetricData {
    total: number
    apple: number
    google: number
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
    name: string
    total: number
    iOS: number
    Android: number
}

/**
 * Kullanıcı filtreleri
 */
export interface UserFilters {
    segment?: SegmentType | SegmentType[]
    platform?: Platform
    search?: string
    dateFrom?: Date
    dateTo?: Date
    page?: number
    limit?: number
}

/**
 * Sayfalı sonuç
 */
export interface PaginatedResult<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

/**
 * Önerilen aksiyon tipi
 */
export interface RecommendedAction {
    id: string
    label: string
    icon: string
    priority: 'high' | 'medium' | 'low'
    color: string
}

/**
 * Segment kuralları (7 gün vb.)
 */
export const SEGMENT_RULES = {
    NEW_USER_DAYS: 7,
    TRIAL_DURATION_DAYS: 3,
    GRACE_PERIOD_DAYS: 16,
    WINBACK_THRESHOLD_DAYS: 30
} as const
