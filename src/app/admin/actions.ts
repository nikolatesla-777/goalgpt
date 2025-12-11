
'use server'

import { createClient } from '@/utils/supabase/server'

// ============================================
// Helper Functions
// ============================================

const getStartDate = (range: string) => {
    const now = new Date()
    switch (range) {
        case 'bugun': return new Date(now.setHours(0, 0, 0, 0)).toISOString()
        case 'bu-hafta':
            const d = new Date(now)
            const day = d.getDay()
            const diff = d.getDate() - day + (day === 0 ? -6 : 1)
            return new Date(d.setDate(diff)).toISOString()
        case 'bu-ay': return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        case 'gecen-ay': return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        default: return new Date(0).toISOString()
    }
}

// Platform count helper
const countByPlatform = (data: any[] | null, platformField: string = 'platform') => {
    if (!data) return { total: 0, apple: 0, google: 0 }
    const apple = data.filter(d => d[platformField] === 'apple').length
    const google = data.filter(d => d[platformField] === 'google').length
    return { total: data.length, apple, google }
}

// Platform sum helper for revenue
const sumByPlatform = (data: any[] | null, amountField: string = 'amount_in_try', platformField: string = 'store') => {
    if (!data) return { total: 0, apple: 0, google: 0 }
    let apple = 0, google = 0, total = 0
    data.forEach(d => {
        const amount = Number(d[amountField]) || 0
        if (d.transaction_type !== 'refund') {
            total += amount
            if (d[platformField] === 'apple') apple += amount
            if (d[platformField] === 'google') google += amount
        }
    })
    return { total, apple, google }
}

// ============================================
// Core Metric Functions (with iOS/Android breakdown)
// ============================================

// 1. Total Revenue
export async function getTotalRevenueWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('revenue_transactions')
        .select('amount_in_try, transaction_type, store')
        .gte('created_at', startDate)

    return sumByPlatform(data)
}

// 2. Active Subscribers (Date Independent!)
export async function getActiveSubsWithBreakdown() {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data } = await supabase
        .from('profiles')
        .select('platform')
        .gt('expiration_date', now)

    return countByPlatform(data)
}

// 3. Total Users (Date Independent!)
export async function getTotalUsersWithBreakdown() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('profiles')
        .select('platform')

    return countByPlatform(data)
}

// 4. First Sales
export async function getFirstSalesWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('revenue_transactions')
        .select('store')
        .eq('transaction_type', 'initial_purchase')
        .gte('created_at', startDate)

    return countByPlatform(data, 'store')
}

// 5. Trial Starters
export async function getTrialStartersWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('profiles')
        .select('platform')
        .eq('is_trial_used', true)
        .gte('created_at', startDate)

    return countByPlatform(data)
}

// 6. Trial Conversions
export async function getTrialConversionsWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('revenue_transactions')
        .select('store')
        .eq('transaction_type', 'trial_conversion')
        .gte('created_at', startDate)

    return countByPlatform(data, 'store')
}

// 7. New Registrations
export async function getNewRegistrationsWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('profiles')
        .select('platform')
        .gte('created_at', startDate)

    return countByPlatform(data)
}

// 8. Churn (Expired users)
export async function getChurnWithBreakdown() {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data } = await supabase
        .from('profiles')
        .select('platform')
        .eq('subscription_status', 'expired')
        .lt('expiration_date', now)

    return countByPlatform(data)
}

// 9. Voluntary Cancellations (auto_renew = false but still active)
export async function getCancellationsWithBreakdown() {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const { data } = await supabase
        .from('profiles')
        .select('platform')
        .eq('auto_renew', false)
        .gt('expiration_date', now)
        .eq('subscription_status', 'active')

    return countByPlatform(data)
}

// 10. Billing Errors (Grace Period)
export async function getBillingErrorsWithBreakdown() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('profiles')
        .select('platform')
        .eq('subscription_status', 'grace_period')

    return countByPlatform(data)
}

// 11. Reactivations
export async function getReactivationsWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('revenue_transactions')
        .select('store')
        .eq('transaction_type', 'renewal')
        .gte('created_at', startDate)

    return countByPlatform(data, 'store')
}

// 12. Total Sales Count
export async function getTotalSalesWithBreakdown(range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    const { data } = await supabase
        .from('revenue_transactions')
        .select('store')
        .neq('transaction_type', 'refund')
        .gte('created_at', startDate)

    return countByPlatform(data, 'store')
}

// ============================================
// Aggregated Dashboard Metrics
// ============================================

export async function getDashboardMetrics(range: string) {
    const [
        revenue,
        activeSubs,
        totalUsers,
        firstSales,
        trialStarters,
        trialConversions,
        newRegistrations,
        churn,
        cancellations,
        billingErrors,
        reactivations,
        totalSales
    ] = await Promise.all([
        getTotalRevenueWithBreakdown(range),
        getActiveSubsWithBreakdown(),
        getTotalUsersWithBreakdown(),
        getFirstSalesWithBreakdown(range),
        getTrialStartersWithBreakdown(range),
        getTrialConversionsWithBreakdown(range),
        getNewRegistrationsWithBreakdown(range),
        getChurnWithBreakdown(),
        getCancellationsWithBreakdown(),
        getBillingErrorsWithBreakdown(),
        getReactivationsWithBreakdown(range),
        getTotalSalesWithBreakdown(range)
    ])

    return {
        revenue,
        activeSubs,
        totalUsers,
        firstSales,
        trialStarters,
        trialConversions,
        newRegistrations,
        churn,
        cancellations,
        billingErrors,
        reactivations,
        totalSales
    }
}

// ============================================
// Recent Activity Feed
// ============================================

export async function getRecentActivity() {
    const supabase = await createClient()

    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, platform')
        .order('created_at', { ascending: false })
        .limit(5)

    const { data: transactions } = await supabase
        .from('revenue_transactions')
        .select('id, amount_in_try, created_at, transaction_type, user_id, store')
        .order('created_at', { ascending: false })
        .limit(5)

    return { users, transactions }
}

// ============================================
// Metric Detail Lists (for bottom panel)
// ============================================

export async function getMetricDetails(metricId: string, range: string) {
    const supabase = await createClient()
    const startDate = getStartDate(range)

    switch (metricId) {
        case 'revenue':
        case 'totalSales': {
            const { data } = await supabase
                .from('revenue_transactions')
                .select(`
                    id,
                    amount_in_try,
                    transaction_type,
                    store,
                    created_at,
                    user_id
                `)
                .neq('transaction_type', 'refund')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'transactions',
                title: metricId === 'revenue' ? 'Gelir Detayları' : 'Satış Detayları',
                columns: ['Tarih', 'İşlem', 'Platform', 'Tutar'],
                data: data?.map(t => ({
                    id: t.id,
                    date: t.created_at,
                    action: t.transaction_type === 'initial_purchase' ? 'İlk Satın Alma' :
                        t.transaction_type === 'renewal' ? 'Yenileme' :
                            t.transaction_type === 'trial_conversion' ? 'Trial→Paid' : t.transaction_type,
                    platform: t.store,
                    amount: t.amount_in_try
                })) || []
            }
        }

        case 'activeSubs': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, expiration_date, subscription_status, last_seen')
                .gt('expiration_date', new Date().toISOString())
                .order('expiration_date', { ascending: true })
                .limit(50)

            const now = new Date()
            return {
                type: 'users',
                title: 'Aktif Aboneler',
                columns: ['Kullanıcı', 'Platform', 'Son Giriş', 'Bitiş', 'Kalan Gün'],
                data: data?.map(u => {
                    const expDate = u.expiration_date ? new Date(u.expiration_date) : null
                    const daysRemaining = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null

                    return {
                        id: u.id,
                        name: u.full_name || u.email,
                        platform: u.platform,
                        lastSeen: u.last_seen || null,
                        expiry: u.expiration_date,
                        daysRemaining: daysRemaining
                    }
                }) || []
            }
        }

        case 'newRegistrations': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, created_at')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'users',
                title: 'Yeni Kayıtlar',
                columns: ['Kullanıcı', 'Platform', 'Kayıt Tarihi', 'Durum'],
                data: data?.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    platform: u.platform,
                    date: u.created_at,
                    status: 'Yeni Üye'
                })) || []
            }
        }

        case 'trialStarters': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, created_at, expiration_date')
                .eq('is_trial_used', true)
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'users',
                title: 'Deneme Başlatanlar',
                columns: ['Kullanıcı', 'Platform', 'Başlangıç', 'Bitiş'],
                data: data?.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    platform: u.platform,
                    start: u.created_at,
                    end: u.expiration_date
                })) || []
            }
        }

        case 'trialConversions': {
            const { data } = await supabase
                .from('revenue_transactions')
                .select('id, store, created_at, amount_in_try, user_id')
                .eq('transaction_type', 'trial_conversion')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'transactions',
                title: 'Deneme → Ücretli Dönüşümler',
                columns: ['Tarih', 'Platform', 'Tutar', 'Durum'],
                data: data?.map(t => ({
                    id: t.id,
                    date: t.created_at,
                    platform: t.store,
                    amount: t.amount_in_try,
                    status: 'Dönüştü ✓'
                })) || []
            }
        }

        case 'firstSales': {
            const { data } = await supabase
                .from('revenue_transactions')
                .select('id, store, created_at, amount_in_try, user_id')
                .eq('transaction_type', 'initial_purchase')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'transactions',
                title: 'İlk Kez Satın Alanlar',
                columns: ['Tarih', 'Platform', 'Tutar', 'Durum'],
                data: data?.map(t => ({
                    id: t.id,
                    date: t.created_at,
                    platform: t.store,
                    amount: t.amount_in_try,
                    status: 'İlk Satış 🎉'
                })) || []
            }
        }

        case 'churn': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, expiration_date')
                .eq('subscription_status', 'expired')
                .lt('expiration_date', new Date().toISOString())
                .order('expiration_date', { ascending: false })
                .limit(50)
            return {
                type: 'users',
                title: 'Süresi Biten Kullanıcılar',
                columns: ['Kullanıcı', 'Platform', 'Bitiş Tarihi', 'Durum'],
                data: data?.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    platform: u.platform,
                    expiry: u.expiration_date,
                    status: 'Churned ❌'
                })) || []
            }
        }

        case 'cancellations': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, expiration_date')
                .eq('auto_renew', false)
                .gt('expiration_date', new Date().toISOString())
                .order('expiration_date', { ascending: true })
                .limit(50)
            return {
                type: 'users',
                title: 'İptal Edenler (Hala Aktif)',
                columns: ['Kullanıcı', 'Platform', 'Bitiş Tarihi', 'Risk'],
                data: data?.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    platform: u.platform,
                    expiry: u.expiration_date,
                    risk: 'Yüksek Risk ⚠️'
                })) || []
            }
        }

        case 'billingErrors': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, expiration_date')
                .eq('subscription_status', 'grace_period')
                .order('expiration_date', { ascending: true })
                .limit(50)
            return {
                type: 'users',
                title: 'Faturalandırma Hataları',
                columns: ['Kullanıcı', 'Platform', 'Grace Bitiş', 'Aksiyon'],
                data: data?.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    platform: u.platform,
                    expiry: u.expiration_date,
                    action: 'Hatırlatma Gönder 📧'
                })) || []
            }
        }

        case 'reactivations': {
            const { data } = await supabase
                .from('revenue_transactions')
                .select('id, store, created_at, amount_in_try, user_id')
                .eq('transaction_type', 'renewal')
                .gte('created_at', startDate)
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'transactions',
                title: 'Geri Kazanılan Kullanıcılar',
                columns: ['Tarih', 'Platform', 'Tutar', 'Durum'],
                data: data?.map(t => ({
                    id: t.id,
                    date: t.created_at,
                    platform: t.store,
                    amount: t.amount_in_try,
                    status: 'Geri Döndü 🔄'
                })) || []
            }
        }

        case 'totalUsers': {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, platform, created_at, subscription_status')
                .order('created_at', { ascending: false })
                .limit(50)
            return {
                type: 'users',
                title: 'Tüm Üyeler',
                columns: ['Kullanıcı', 'Platform', 'Kayıt', 'Durum'],
                data: data?.map(u => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    platform: u.platform,
                    date: u.created_at,
                    status: u.subscription_status === 'active' ? 'Aktif' :
                        u.subscription_status === 'expired' ? 'Pasif' : u.subscription_status
                })) || []
            }
        }

        default:
            return { type: 'empty', title: 'Detay Yok', columns: [], data: [] }
    }
}

// ============================================
// Chart Data from Daily Snapshots
// ============================================

export async function getChartDataFromSnapshots(metricId: string, days: number = 30) {
    const supabase = await createClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: snapshots } = await supabase
        .from('daily_snapshots')
        .select('*')
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true })

    if (!snapshots || snapshots.length === 0) {
        // Fallback to calculated data if no snapshots exist yet
        return getChartDataCalculated(metricId, days)
    }

    // Map snapshot data to chart format based on metricId
    return snapshots.map(s => {
        const date = new Date(s.snapshot_date)
        let value = 0, ios = 0, android = 0

        switch (metricId) {
            case 'activeSubs':
                value = s.active_subscribers || 0
                ios = s.active_subscribers_apple || 0
                android = s.active_subscribers_google || 0
                break
            case 'totalUsers':
                value = s.total_users || 0
                ios = s.total_users_apple || 0
                android = s.total_users_google || 0
                break
            case 'revenue':
                value = Number(s.total_revenue) || 0
                ios = Number(s.total_revenue_apple) || 0
                android = Number(s.total_revenue_google) || 0
                break
            case 'newRegistrations':
                value = s.new_registrations || 0
                ios = s.new_registrations_apple || 0
                android = s.new_registrations_google || 0
                break
            case 'trialStarters':
                value = s.trial_starters || 0
                ios = s.trial_starters_apple || 0
                android = s.trial_starters_google || 0
                break
            case 'trialConversions':
                value = s.trial_conversions || 0
                break
            case 'firstSales':
                value = s.first_sales || 0
                break
            case 'churn':
                value = s.churned_users || 0
                break
            case 'cancellations':
                value = s.voluntary_cancellations || 0
                break
            case 'billingErrors':
                value = s.billing_errors || 0
                break
            case 'reactivations':
                value = s.reactivations || 0
                break
            case 'totalSales':
                value = s.total_sales || 0
                break
        }

        return {
            name: `${date.getDate()}.${date.getMonth() + 1}`,
            value,
            ios,
            android
        }
    })
}

// Fallback: Calculate chart data if no snapshots exist
async function getChartDataCalculated(metricId: string, days: number) {
    const supabase = await createClient()
    const result = []

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
        const dayEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()

        let value = 0, ios = 0, android = 0

        if (metricId === 'newRegistrations') {
            const { data } = await supabase
                .from('profiles')
                .select('platform')
                .gte('created_at', dayStart)
                .lte('created_at', dayEnd)

            if (data) {
                value = data.length
                ios = data.filter(u => u.platform === 'apple').length
                android = data.filter(u => u.platform === 'google').length
            }
        } else if (metricId === 'revenue' || metricId === 'totalSales') {
            const { data } = await supabase
                .from('revenue_transactions')
                .select('amount_in_try, store')
                .gte('created_at', dayStart)
                .lte('created_at', dayEnd)
                .neq('transaction_type', 'refund')

            if (data) {
                if (metricId === 'revenue') {
                    data.forEach(t => {
                        const amt = Number(t.amount_in_try) || 0
                        value += amt
                        if (t.store === 'apple') ios += amt
                        if (t.store === 'google') android += amt
                    })
                } else {
                    value = data.length
                    ios = data.filter(t => t.store === 'apple').length
                    android = data.filter(t => t.store === 'google').length
                }
            }
        }

        result.push({
            name: `${date.getDate()}.`,
            value,
            ios,
            android
        })
    }

    return result
}

// Legacy export for compatibility
export async function getChartData(metricType: string) {
    return getChartDataFromSnapshots(metricType, 30)
}

export async function getPlatformBreakdown() {
    const metrics = await getDashboardMetrics('all')
    return {
        activeSubs: { apple: metrics.activeSubs.apple, google: metrics.activeSubs.google },
        totalUsers: { apple: metrics.totalUsers.apple, google: metrics.totalUsers.google },
        revenue: { apple: metrics.revenue.apple, google: metrics.revenue.google }
    }
}
