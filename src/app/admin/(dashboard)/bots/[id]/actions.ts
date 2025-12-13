'use server'

import { createClient } from '@supabase/supabase-js'

// Using Service Role to bypass RLS and ensure we see everything for the Admin Panel
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GetBotOptions {
    page?: number
    limit?: number
    search?: string
    date?: string // YYYY-MM-DD
    status?: string // 'all', 'won', 'lost', 'pending'
}

export async function getBotWithPredictions(botId: string, options: GetBotOptions = {}) {
    const { page = 1, limit = 10, search = '', date = '', status = 'all' } = options
    const from = (page - 1) * limit
    const to = from + limit - 1

    try {
        // 1. Fetch Bot Details (Once)
        const { data: bot, error: botError } = await supabaseAdmin
            .from('bot_groups')
            .select('*')
            .eq('id', botId)
            .single()

        if (botError) throw new Error(`Bot fetch error: ${botError.message}`)

        // 2. Build Predictions Query
        let query = supabaseAdmin
            .from('predictions_raw')
            .select('*', { count: 'exact' }) // Request total count
            .eq('bot_group_id', botId)
            .order('received_at', { ascending: false })

        // Apply Filters
        if (search) {
            query = query.or(`home_team_name.ilike.%${search}%,away_team_name.ilike.%${search}%`)
        }

        if (date) {
            const startDate = new Date(date)
            const endDate = new Date(date)
            endDate.setHours(23, 59, 59, 999)

            query = query
                .gte('received_at', startDate.toISOString())
                .lte('received_at', endDate.toISOString())
        }

        if (status && status !== 'all') {
            // Mapping UI status to DB status
            // DB likely uses 'pending', 'won', 'lost'
            if (status === 'won') query = query.eq('status', 'won')
            else if (status === 'lost') query = query.eq('status', 'lost')
            else if (status === 'pending') query = query.eq('status', 'pending')
        }

        // Apply Pagination
        const { data: predictions, count, error: predError } = await query.range(from, to)

        if (predError) throw new Error(`Predictions fetch error: ${predError.message}`)

        return {
            bot,
            predictions: predictions || [],
            totalCount: count || 0,
            error: null
        }
    } catch (error: any) {
        console.error('Server Action Error:', error)
        return {
            bot: null,
            predictions: [],
            totalCount: 0,
            error: error.message
        }
    }
}
