'use server'

import { createClient } from '@/lib/supabase-server'

export type Prediction = {
    id: string
    bot_group_id: string
    bot_group_name: string
    bot_group_color: string

    // Match Info
    home_team_name: string
    away_team_name: string
    home_team_logo: string | null
    away_team_logo: string | null
    competition_name: string
    competition_logo: string | null
    country_logo: string | null

    // Score & Status
    home_score: number
    away_score: number
    match_minute: number
    match_status: string // live, ht, finished
    match_time: number

    // Prediction
    prediction_type: string
    prediction_text: string

    // Result
    result: string // pending, won, lost, void
    result_checked_at: string | null

    // Notification
    notification_sent: boolean
    notification_count: number

    created_at: string
}

export type PredictionFilters = {
    botGroupId?: string
    status?: 'all' | 'pending' | 'won' | 'lost'
    date?: 'today' | 'yesterday' | 'week' | 'all'
    search?: string
}

export type PredictionStats = {
    totalToday: number
    wonToday: number
    lostToday: number
    pendingToday: number
    winRateToday: number
}

// Get predictions with filters
export async function getPredictions(filters: PredictionFilters = {}): Promise<Prediction[]> {
    const supabase = await createClient()

    let query = supabase
        .from('predictions_matched')
        .select(`
            *,
            bot_groups!inner (
                name,
                color
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

    // Apply filters
    if (filters.botGroupId) {
        query = query.eq('bot_group_id', filters.botGroupId)
    }

    if (filters.status && filters.status !== 'all') {
        query = query.eq('result', filters.status)
    }

    if (filters.date) {
        const now = new Date()
        let startDate: Date

        switch (filters.date) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0))
                break
            case 'yesterday':
                startDate = new Date(now.setDate(now.getDate() - 1))
                startDate.setHours(0, 0, 0, 0)
                break
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7))
                break
            default:
                startDate = new Date(0)
        }

        if (filters.date !== 'all') {
            query = query.gte('created_at', startDate.toISOString())
        }
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching predictions:', error)
        return []
    }

    // Transform data
    return (data || []).map((item: any) => ({
        ...item,
        bot_group_name: item.bot_groups?.name || 'Unknown',
        bot_group_color: item.bot_groups?.color || '#6366F1'
    }))
}

// Get today's prediction stats
export async function getPredictionStats(): Promise<PredictionStats> {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
        .from('predictions_matched')
        .select('result')
        .gte('created_at', today.toISOString())

    if (error || !data) {
        return { totalToday: 0, wonToday: 0, lostToday: 0, pendingToday: 0, winRateToday: 0 }
    }

    const totalToday = data.length
    const wonToday = data.filter(p => p.result === 'won').length
    const lostToday = data.filter(p => p.result === 'lost').length
    const pendingToday = data.filter(p => p.result === 'pending' || !p.result).length
    const decidedToday = wonToday + lostToday
    const winRateToday = decidedToday > 0 ? Math.round((wonToday / decidedToday) * 100) : 0

    return { totalToday, wonToday, lostToday, pendingToday, winRateToday }
}

// Get bot groups for filter dropdown
export async function getBotGroupsForFilter() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('bot_groups')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error fetching bot groups:', error)
        return []
    }

    return data || []
}

// Update prediction result manually
export async function updatePredictionResult(predictionId: string, result: 'won' | 'lost' | 'void') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('predictions_matched')
        .update({
            result,
            result_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', predictionId)

    if (error) {
        console.error('Error updating prediction result:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}
