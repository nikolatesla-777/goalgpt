'use server'

import { createClient } from '@/lib/supabase-server'

export type LivePrediction = {
    id: string
    bot_group_id: string
    bot_group_name: string
    bot_group_color: string

    // Match Info
    match_uuid: string
    home_team_name: string
    away_team_name: string
    home_team_logo: string | null
    away_team_logo: string | null
    competition_name: string
    competition_logo: string | null
    country_logo: string | null

    // Live Score
    home_score: number
    away_score: number
    match_minute: number
    match_status: 'live' | 'ht' | 'finished'
    match_time: number

    // Prediction
    prediction_type: string
    prediction_text: string
    prediction_minute: number

    // Status
    result: 'pending' | 'won' | 'lost' | 'void'
    notification_sent: boolean

    created_at: string
}

export type LiveStats = {
    activePredictions: number
    liveMatches: number
    wonToday: number
    lostToday: number
}

// Get only live/active predictions
export async function getLivePredictions(): Promise<LivePrediction[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('predictions_matched')
        .select(`
            *,
            bot_groups!inner (
                name,
                color
            )
        `)
        .in('match_status', ['live', 'ht'])
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching live predictions:', error)
        return []
    }

    return (data || []).map((item: any) => ({
        ...item,
        bot_group_name: item.bot_groups?.name || 'Unknown',
        bot_group_color: item.bot_groups?.color || '#6366F1'
    }))
}

// Get live stats
export async function getLiveStats(): Promise<LiveStats> {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Active predictions (live matches)
    const { count: activePredictions } = await supabase
        .from('predictions_matched')
        .select('*', { count: 'exact', head: true })
        .in('match_status', ['live', 'ht'])

    // Unique live matches
    const { data: liveMatchesData } = await supabase
        .from('predictions_matched')
        .select('match_uuid')
        .in('match_status', ['live', 'ht'])

    const liveMatches = new Set(liveMatchesData?.map(m => m.match_uuid)).size

    // Won today
    const { count: wonToday } = await supabase
        .from('predictions_matched')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'won')
        .gte('created_at', today.toISOString())

    // Lost today
    const { count: lostToday } = await supabase
        .from('predictions_matched')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'lost')
        .gte('created_at', today.toISOString())

    return {
        activePredictions: activePredictions || 0,
        liveMatches: liveMatches || 0,
        wonToday: wonToday || 0,
        lostToday: lostToday || 0
    }
}

// Get recent finished predictions for the ticker
export async function getRecentResults(): Promise<LivePrediction[]> {
    const supabase = await createClient()

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from('predictions_matched')
        .select(`
            *,
            bot_groups!inner (
                name,
                color
            )
        `)
        .eq('match_status', 'finished')
        .in('result', ['won', 'lost'])
        .gte('updated_at', oneHourAgo)
        .order('updated_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching recent results:', error)
        return []
    }

    return (data || []).map((item: any) => ({
        ...item,
        bot_group_name: item.bot_groups?.name || 'Unknown',
        bot_group_color: item.bot_groups?.color || '#6366F1'
    }))
}
