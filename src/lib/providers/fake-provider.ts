import type {
    User,
    SegmentType,
    DashboardMetrics,
    ChartDataPoint,
    UserFilters,
    PaginatedResult,
    UserAction,
    Platform
} from '../types/segments'
import { AIPredictionPayload } from '../types/predictions'

// Note: Removed IDataProvider import to avoid circular dependency
// FakeProvider implements the same interface methods

// =============================================================================
// FAKE DATA GENERATOR
// =============================================================================

const NAMES = [
    'Ahmet Yılmaz', 'Mehmet Kaya', 'Mustafa Demir', 'Ali Çelik', 'Hüseyin Öztürk',
    'Hasan Aydın', 'İbrahim Şahin', 'Osman Yıldız', 'Yusuf Özdemir', 'Murat Er',
    'Fatma Aktaş', 'Ayşe Koç', 'Emine Arslan', 'Hatice Polat', 'Zeynep Korkmaz',
    'Elif Doğan', 'Merve Kılıç', 'Büşra Çetin', 'Esra Aksoy', 'Seda Kaplan',
    'Kemal Özkan', 'Emre Yıldırım', 'Burak Şen', 'Serkan Acar', 'Tolga Koç',
    'Gizem Bayrak', 'Deniz Aksu', 'Ceren Yılmaz', 'Pınar Güneş', 'Sinem Özdemir'
]

const PACKAGES = [
    { name: 'Haftalık', amount: 149 },
    { name: 'Aylık', amount: 449 },
    { name: 'Yıllık', amount: 899 }
]

// Segment dağılımı (gerçekçi oranlar)
const SEGMENT_DISTRIBUTION: Record<SegmentType, number> = {
    new_user: 312,
    free_user: 1847,
    trial_user: 187,
    trial_expired: 234,
    active_subscriber: 1247,
    grace_period: 23,
    paused_user: 45,
    churned_user: 456,
    winback_target: 147,
    refunded_user: 23
}

function generateEmail(name: string): string {
    return name.toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[üöşığç]/g, c => ({ ü: 'u', ö: 'o', ş: 's', ı: 'i', ğ: 'g', ç: 'c' }[c] || c))
        + '@gmail.com'
}

function generatePhone(): string {
    return `+90 5${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`
}

function randomDate(daysAgo: number): Date {
    const now = new Date()
    return new Date(now.getTime() - Math.floor(Math.random() * daysAgo) * 24 * 60 * 60 * 1000)
}

function randomFutureDate(daysAhead: number): Date {
    const now = new Date()
    return new Date(now.getTime() + Math.floor(Math.random() * daysAhead) * 24 * 60 * 60 * 1000)
}

// Generate all users once
let CACHED_USERS: User[] | null = null

function generateAllUsers(): User[] {
    if (CACHED_USERS) return CACHED_USERS

    const users: User[] = []
    let id = 1

    for (const [segment, count] of Object.entries(SEGMENT_DISTRIBUTION)) {
        for (let i = 0; i < count; i++) {
            const name = NAMES[Math.floor(Math.random() * NAMES.length)]
            const pkg = PACKAGES[Math.floor(Math.random() * PACKAGES.length)]
            const platform: Platform = Math.random() > 0.43 ? 'apple' : 'google'
            const transactionCount = segment === 'active_subscriber' ? Math.floor(Math.random() * 24) + 1
                : segment === 'churned_user' ? Math.floor(Math.random() * 12) + 1
                    : Math.floor(Math.random() * 5)
            const totalSpent = transactionCount * pkg.amount * (0.8 + Math.random() * 0.4)

            const user: User = {
                id: String(id++),
                name: `${name}${i > 0 ? ` ${i + 1}` : ''}`,
                email: generateEmail(name) + (i > 0 ? i : ''),
                phone: generatePhone(),
                platform,
                segment: segment as SegmentType,
                created_at: randomDate(180),
                last_seen: randomDate(7),
                total_spent: Math.round(totalSpent),
                transaction_count: transactionCount,
                subscription: segment === 'active_subscriber' || segment === 'trial_user' || segment === 'grace_period' ? {
                    id: `sub_${id}`,
                    product_id: pkg.name.toLowerCase(),
                    product_name: pkg.name,
                    status: segment === 'active_subscriber' ? 'active'
                        : segment === 'trial_user' ? 'active'
                            : segment === 'grace_period' ? 'in_grace_period'
                                : 'expired',
                    is_trial: segment === 'trial_user',
                    purchase_date: randomDate(90),
                    expiration_date: randomFutureDate(30),
                    price: pkg.amount
                } : undefined
            }

            users.push(user)
        }
    }

    CACHED_USERS = users
    return users
}

// =============================================================================
// FAKE METRICS
// =============================================================================

const FAKE_METRICS: DashboardMetrics = {
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

// Metric ID → Segment mapping
const METRIC_TO_SEGMENT: Record<string, SegmentType | SegmentType[]> = {
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
    reactivations: 'active_subscriber',
    totalUsers: ['new_user', 'free_user', 'trial_user', 'active_subscriber', 'churned_user']
}

// =============================================================================
// CHART DATA GENERATOR
// =============================================================================

function generateChartData(baseTotal: number, trend: 'up' | 'down' | 'stable'): ChartDataPoint[] {
    const data: ChartDataPoint[] = []
    let total = baseTotal * 0.85
    let ios = total * 0.57
    let android = total * 0.43

    const months = ['Kas', 'Kas', 'Kas', 'Kas', 'Kas', 'Kas', 'Kas', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara', 'Ara']
    const days = [28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    for (let i = 0; i < 14; i++) {
        const trendFactor = trend === 'up' ? 1.02 : trend === 'down' ? 0.98 : 1
        total = Math.max(1, total * trendFactor * (0.95 + Math.random() * 0.1))
        ios = Math.max(1, ios * trendFactor * (0.95 + Math.random() * 0.1))
        android = Math.max(1, android * trendFactor * (0.95 + Math.random() * 0.1))

        data.push({
            name: `${days[i]} ${months[i]}`,
            total: Math.round(total),
            iOS: Math.round(ios),
            Android: Math.round(android)
        })
    }

    return data
}

const CHART_DATA_CACHE: Record<string, ChartDataPoint[]> = {}

// =============================================================================
// FAKE PROVIDER IMPLEMENTATION
// =============================================================================

// In-memory prediction store
const FAKE_PREDICTIONS: AIPredictionPayload[] = []

export class FakeProvider {

    async getUsers(filters: UserFilters): Promise<PaginatedResult<User>> {
        let users = generateAllUsers()

        // Filter by segment
        if (filters.segment) {
            const segments = Array.isArray(filters.segment) ? filters.segment : [filters.segment]
            users = users.filter(u => segments.includes(u.segment))
        }

        // Filter by platform
        if (filters.platform) {
            users = users.filter(u => u.platform === filters.platform)
        }

        // Search
        if (filters.search) {
            const search = filters.search.toLowerCase()
            users = users.filter(u =>
                u.name.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search) ||
                u.phone?.includes(search)
            )
        }

        // Date filters
        if (filters.dateFrom) {
            users = users.filter(u => u.created_at >= filters.dateFrom!)
        }
        if (filters.dateTo) {
            users = users.filter(u => u.created_at <= filters.dateTo!)
        }

        const total = users.length
        const page = filters.page || 1
        const limit = filters.limit || 15
        const start = (page - 1) * limit
        const paginatedUsers = users.slice(start, start + limit)

        return {
            data: paginatedUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    }

    async getUserById(id: string): Promise<User | null> {
        const users = generateAllUsers()
        return users.find(u => u.id === id) || null
    }

    async updateUserSegment(userId: string, segment: SegmentType): Promise<void> {
        // In fake mode, just log
        console.log(`[FakeProvider] Updated user ${userId} segment to ${segment}`)
    }

    async getSegmentCounts(): Promise<Record<SegmentType, number>> {
        return { ...SEGMENT_DISTRIBUTION }
    }

    async getMetrics(period: string): Promise<DashboardMetrics> {
        // period is ignored in fake mode
        return { ...FAKE_METRICS }
    }

    async getChartData(metricId: string, period: string): Promise<ChartDataPoint[]> {
        const cacheKey = `${metricId}_${period}`

        if (!CHART_DATA_CACHE[cacheKey]) {
            const metric = FAKE_METRICS[metricId as keyof DashboardMetrics]
            const trend = ['billingErrors', 'cancellations', 'churn'].includes(metricId) ? 'down'
                : ['revenue', 'activeSubs', 'newRegistrations'].includes(metricId) ? 'up'
                    : 'stable'

            CHART_DATA_CACHE[cacheKey] = generateChartData(metric?.total || 100, trend)
        }

        return CHART_DATA_CACHE[cacheKey]
    }

    async getMetricUsers(metricId: string, page: number, limit: number): Promise<PaginatedResult<User>> {
        const segment = METRIC_TO_SEGMENT[metricId]
        return this.getUsers({ segment: segment as SegmentType | SegmentType[], page, limit })
    }

    async logAction(userId: string, action: Omit<UserAction, 'id' | 'created_at'>): Promise<void> {
        console.log(`[FakeProvider] Action logged for user ${userId}:`, action)
    }

    async getActionHistory(userId: string): Promise<UserAction[]> {
        // Return mock empty history
        return []
    }

    async addPrediction(prediction: AIPredictionPayload): Promise<void> {
        console.log(`[FakeProvider] Adding prediction for match ${prediction.matchId}:`, prediction.prediction)
        FAKE_PREDICTIONS.unshift(prediction)
    }
}
