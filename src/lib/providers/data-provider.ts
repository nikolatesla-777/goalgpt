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
    getPredictions(limit?: number): Promise<AIPredictionPayload[]>
}

// =============================================================================
// ACTIVE PROVIDER EXPORT
// =============================================================================

/**
 * ⚠️ HYBRID MODE
 * 
 * Predictions → Supabase (gerçek veritabanı)
 * Diğer işlemler → FakeProvider (mock data)
 * 
 * Tam geçiş için SupabaseProvider'ın tüm metodlarını implement et.
 */
import { FakeProvider } from './fake-provider'
import { SupabaseProvider } from './supabase-provider'

// Create instances
const fakeProvider = new FakeProvider()
const supabaseProvider = new SupabaseProvider()

// Hybrid Provider - Best of both worlds
class HybridDataProvider implements IDataProvider {
    // User operations - FakeProvider (mock)
    getUsers = fakeProvider.getUsers.bind(fakeProvider)
    getUserById = fakeProvider.getUserById.bind(fakeProvider)
    updateUserSegment = fakeProvider.updateUserSegment.bind(fakeProvider)
    getSegmentCounts = fakeProvider.getSegmentCounts.bind(fakeProvider)

    // Metrics operations - FakeProvider (mock)
    getMetrics = fakeProvider.getMetrics.bind(fakeProvider)
    getChartData = fakeProvider.getChartData.bind(fakeProvider)
    getMetricUsers = fakeProvider.getMetricUsers.bind(fakeProvider)

    // Action operations - FakeProvider (mock)
    logAction = fakeProvider.logAction.bind(fakeProvider)
    getActionHistory = fakeProvider.getActionHistory.bind(fakeProvider)

    // 🔥 PREDICTION OPERATIONS - SUPABASE (gerçek veritabanı!)
    addPrediction = supabaseProvider.addPrediction.bind(supabaseProvider)
    getPredictions = supabaseProvider.getPredictions.bind(supabaseProvider)
}

export const DataProvider: IDataProvider = new HybridDataProvider()
