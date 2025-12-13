import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET() {
    try {
        const { data: bots, error } = await supabaseAdmin
            .from('bot_groups')
            .select('*')
            .order('win_rate', { ascending: false })

        if (error) {
            console.error('Error fetching bot groups:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Calculate stats
        const totalBots = bots?.length || 0
        const activeBots = bots?.filter(b => b.is_active).length || 0
        const totalPredictions = bots?.reduce((sum, b) => sum + (b.total_predictions || 0), 0) || 0
        const avgWinRate = totalBots > 0
            ? bots!.reduce((sum, b) => sum + (b.win_rate || 0), 0) / totalBots
            : 0

        return NextResponse.json({
            bots: bots || [],
            stats: {
                totalBots,
                activeBots,
                totalPredictions,
                avgWinRate: Math.round(avgWinRate * 100) / 100
            }
        })
    } catch (e) {
        console.error('API Error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
