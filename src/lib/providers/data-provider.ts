import type {
    User,
    SegmentType,
    DashboardMetrics,
    ChartDataPoint,
    UserFilters,
    PaginatedResult,
    UserAction
} from '../types/segments'
import { AIPredictionPayload } from '../types/predictions'

// =============================================================================
// DATA PROVIDER INTERFACE
// =============================================================================

/**
 * IDataProvider - Tüm veri erişimi bu interface üzerinden yapılır
 * 
 * Fake → Real DB geçişi için sadece export satırı değiştirilir:
 * - Şu an: export { FakeProvider as DataProvider }
 * - Gerçek: export { SupabaseProvider as DataProvider }
 */
export interface IDataProvider {
    // =========================================================================
    // USER OPERATIONS
    // =========================================================================

    /**
     * Kullanıcıları filtrele ve getir
     */
    getUsers(filters: UserFilters): Promise<PaginatedResult<User>>

    /**
     * Tek kullanıcı getir
     */
    getUserById(id: string): Promise<User | null>

    /**
     * Kullanıcı segmentini güncelle
     */
    updateUserSegment(userId: string, segment: SegmentType): Promise<void>

    /**
     * Segment bazlı kullanıcı sayıları
     */
    getSegmentCounts(): Promise<Record<SegmentType, number>>

    // =========================================================================
    // METRICS OPERATIONS
    // =========================================================================

    /**
     * Dashboard metrikleri
     */
    getMetrics(period: string): Promise<DashboardMetrics>

    /**
     * Metrik için chart data
     */
    getChartData(metricId: string, period: string): Promise<ChartDataPoint[]>

    /**
     * Metrik detay tablosu için kullanıcılar
     */
    getMetricUsers(metricId: string, page: number, limit: number): Promise<PaginatedResult<User>>

    // =========================================================================
    // ACTION OPERATIONS
    // =========================================================================

    /**
     * Kullanıcıya aksiyon logla
     */
    logAction(userId: string, action: Omit<UserAction, 'id' | 'created_at'>): Promise<void>

    /**
     * Kullanıcının aksiyon geçmişi
     */
    getActionHistory(userId: string): Promise<UserAction[]>

    // =========================================================================
    // PREDICTION OPERATIONS
    // =========================================================================

    /**
     * Canlı AI tahminini sisteme ekle
     */
    addPrediction(prediction: AIPredictionPayload): Promise<void>
}

// =============================================================================
// ACTIVE PROVIDER EXPORT
// =============================================================================

/**
 * ⚠️ GEÇİŞ NOKTASI
 * 
 * Fake moddan gerçek DB'ye geçmek için:
 * 1. SupabaseProvider'ı implement et
 * 2. Aşağıdaki satırı değiştir:
 *    export const DataProvider = new SupabaseProvider()
 */
import { FakeProvider } from './fake-provider'
// import { SupabaseProvider } from './supabase-provider'

// Active provider instance (TEK SATIR DEĞİŞİKLİĞİ ile geçiş)
export const DataProvider: IDataProvider = new FakeProvider()

// Future: Real DB
// export const DataProvider: IDataProvider = new SupabaseProvider()
