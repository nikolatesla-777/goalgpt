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
// SUPABASE PROVIDER
// =============================================================================

export class SupabaseProvider implements IDataProvider {
    private get supabase() {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )
    }

    async getUsers(filters: UserFilters): Promise<PaginatedResult<User>> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getUserById(id: string): Promise<User | null> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async updateUserSegment(userId: string, segment: SegmentType): Promise<void> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getSegmentCounts(): Promise<Record<SegmentType, number>> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getMetrics(period: string): Promise<DashboardMetrics> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getChartData(metricId: string, period: string): Promise<ChartDataPoint[]> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getMetricUsers(metricId: string, page: number, limit: number): Promise<PaginatedResult<User>> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async logAction(userId: string, action: Omit<UserAction, 'id' | 'created_at'>): Promise<void> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    async getActionHistory(userId: string): Promise<UserAction[]> {
        throw new Error('SupabaseProvider not implemented. Use FakeProvider.')
    }

    // -------------------------------------------------------------------------
    // PREDICTION METHODS
    // -------------------------------------------------------------------------

    async addPrediction(prediction: AIPredictionPayload): Promise<void> {
        // Use service role key for server-side writes
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        // 0. FIRST ACTION RULE (CRITICAL)
        // Check for existing pending prediction for this bot+match combo.
        // User Requirement: "Her zaman ilk işlem. Diğerleriyle işimiz yok (Duplicate Suppression)"
        if (prediction.botGroupId) {
            const { data: existing } = await supabaseAdmin
                .from('predictions_raw')
                .select('id, match_minute, created_at')
                .eq('bot_group_id', prediction.botGroupId)
                .eq('home_team_name', prediction.homeTeam)
                .eq('away_team_name', prediction.awayTeam)
                .eq('status', 'pending') // Only block if still pending
                .maybeSingle()

            if (existing) {
                console.log(`🔒 First Action Rule: Ignoring duplicate update for ${prediction.homeTeam} vs ${prediction.awayTeam}. Existing: ${existing.match_minute}' (New: ${prediction.minute}')`)
                return
            }
        }

        // 1. Insert Prediction (No Upsert on ID, allow new ID if logical check passed)
        const { error } = await supabaseAdmin
            .from('predictions_raw')
            .insert({
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
                bot_group_id: prediction.botGroupId || null,
                received_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error inserting prediction:', error)
            throw new Error(`Failed to insert prediction: ${error.message}`)
        }

        // 2. Increment Bot Stats (Logic to update dashboard numbers)
        if (prediction.botGroupId) {
            try {
                // Try RPC first (atomic)
                const { error: rpcError } = await supabaseAdmin.rpc('increment_bot_stats', {
                    group_id: prediction.botGroupId
                })

                if (rpcError) {
                    // Fallback: Read-Update-Write (Optimization: Skip if high frequency, acceptable for now)
                    const { data: bot } = await supabaseAdmin
                        .from('bot_groups')
                        .select('total_predictions')
                        .eq('id', prediction.botGroupId)
                        .single()

                    if (bot) {
                        await supabaseAdmin
                            .from('bot_groups')
                            .update({ total_predictions: (bot.total_predictions || 0) + 1 })
                            .eq('id', prediction.botGroupId)
                    }
                }
            } catch (statError) {
                console.warn('Failed to update bot stats:', statError)
            }
        }

        // 3. Dual Write to Mapped Table (Optional but good for legacy)
        if (prediction.homeTeamId || prediction.awayTeamId) {
            const { error: mapError } = await supabaseAdmin
                .from('ts_prediction_mapped')
                .insert({
                    home_team_id: prediction.homeTeamId,
                    away_team_id: prediction.awayTeamId,
                    home_team_name: prediction.homeTeam,
                    away_team_name: prediction.awayTeam,
                    match_score: prediction.rawText?.match(/\(\d+-\d+\)/)?.[0] || '',
                    minute: prediction.minute,
                    prediction: prediction.prediction,
                    competition_name: prediction.league,
                    raw_text: prediction.rawText,
                    bot_group_id: prediction.botGroupId || null // Also here
                })

            if (mapError) console.error('⚠️ Failed to insert mapped prediction:', mapError)
            else console.log('✅ Also saved to ts_prediction_mapped')
        }

        console.log(`✅ Prediction saved to Supabase: ${prediction.homeTeam} vs ${prediction.awayTeam} (Bot: ${prediction.botGroupName || 'None'})`)
    }

    async getPredictions(limit: number = 50): Promise<AIPredictionPayload[]> {
        // Use service role key for server-side reads (bypasses RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        const { data, error } = await supabaseAdmin
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
            rawText: row.prediction_text,
            botGroupId: row.bot_group_id, // Return saved bot ID if needed
        }))
    }
}
