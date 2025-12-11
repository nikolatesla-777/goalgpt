import { createClient } from '@supabase/supabase-js'
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
import type { IDataProvider } from './data-provider'

// =============================================================================
// SUPABASE PROVIDER (SHELL - Future Implementation)
// =============================================================================

/**
 * ⚠️ NOT IMPLEMENTED
 * 
 * Bu dosya gerçek veritabanı bağlantısı için hazırlanmış shell'dir.
 * İmplementasyon yapılacak:
 * 
 * 1. Supabase client oluştur
 * 2. Her method için SQL sorgusu yaz
 * 3. data-provider.ts'de export'u değiştir
 */

export class SupabaseProvider implements IDataProvider {
    private get supabase() {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )
    }

    async getUsers(filters: UserFilters): Promise<PaginatedResult<User>> {
        // TODO: Implement Supabase query
        /*
        let query = this.supabase
            .from('users')
            .select('*, user_segments!inner(*), subscriptions(*)', { count: 'exact' })
        
        if (filters.segment) {
            query = query.eq('user_segments.segment', filters.segment)
        }
        
        if (filters.platform) {
            query = query.eq('platform', filters.platform)
        }
        
        if (filters.search) {
            query = query.or(`email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
        }
        
        const { data, count, error } = await query
            .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1)
        
        return { data, total: count, ... }
        */

        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getUserById(id: string): Promise<User | null> {
        // TODO: Implement
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async updateUserSegment(userId: string, segment: SegmentType): Promise<void> {
        // TODO: Implement
        /*
        await this.supabase
            .from('user_segments')
            .upsert({
                user_id: userId,
                segment: segment,
                updated_at: new Date().toISOString()
            })
        */
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getSegmentCounts(): Promise<Record<SegmentType, number>> {
        // TODO: Implement
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getMetrics(period: string): Promise<DashboardMetrics> {
        // TODO: Implement with date range queries
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getChartData(metricId: string, period: string): Promise<ChartDataPoint[]> {
        // TODO: Implement with GROUP BY date queries
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getMetricUsers(metricId: string, page: number, limit: number): Promise<PaginatedResult<User>> {
        // TODO: Implement
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async logAction(userId: string, action: Omit<UserAction, 'id' | 'created_at'>): Promise<void> {
        // TODO: Implement
        /*
        await this.supabase
            .from('segment_actions_log')
            .insert({
                user_id: userId,
                action_type: action.action_type,
                action_detail: action.action_detail,
                created_by: action.created_by
            })
        */
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getActionHistory(userId: string): Promise<UserAction[]> {
        // TODO: Implement
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async addPrediction(prediction: AIPredictionPayload): Promise<void> {
        // Use service role key for server-side writes
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        const { error } = await supabaseAdmin
            .from('predictions_raw')
            .upsert({
                external_id: prediction.matchId,
                home_team_name: prediction.homeTeam,
                away_team_name: prediction.awayTeam,
                league_name: prediction.league,
                prediction_type: prediction.prediction,
                prediction_text: prediction.analysis || prediction.rawText || '',
                confidence: prediction.confidence || 0,
                match_minute: prediction.minute || null,
                raw_payload: prediction,
                status: 'pending',
                received_at: new Date().toISOString()
            }, {
                onConflict: 'external_id',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('Error inserting prediction:', error)
            throw new Error(`Failed to insert prediction: ${error.message}`)
        }

        console.log(`✅ Prediction saved to Supabase: ${prediction.homeTeam} vs ${prediction.awayTeam}`)
    }

    async getPredictions(limit: number = 50): Promise<AIPredictionPayload[]> {
        const { data, error } = await this.supabase
            .from('predictions_raw')
            .select('*')
            .order('received_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching predictions:', error)
            return []
        }

        // Map database rows to AIPredictionPayload
        return (data || []).map(row => ({
            matchId: row.external_id || row.id,
            homeTeam: row.home_team_name,
            awayTeam: row.away_team_name,
            league: row.league_name || 'Unknown',
            prediction: row.prediction_type || '',
            odds: 0,
            confidence: row.confidence || 0,
            analysis: row.prediction_text || '',
            timestamp: new Date(row.received_at).getTime(),
            minute: row.match_minute,
            rawText: row.prediction_text
        }))
    }

}

