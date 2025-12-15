import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get recent predictions grouped by bot
    const { data: allPredictions, error } = await supabase
        .from('predictions_raw')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(200)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by bot
    const botStats: Record<string, {
        name: string
        total: number
        won: number
        lost: number
        pending: number
        winRate: string
        recentPredictions: any[]
    }> = {}

    for (const pred of allPredictions || []) {
        // Determine bot name from various sources
        let botName = 'Unknown'

        // Check raw_payload for bot indicators
        const rawText = pred.prediction_text || pred.raw_payload?.rawText || ''

        if (pred.raw_payload?.botGroupName) {
            botName = pred.raw_payload.botGroupName
        } else if (rawText.includes('Minute:') && rawText.includes('SonGol')) {
            botName = 'Minute 65 / SonGol Bot'
        } else if (rawText.includes('AlertCode:')) {
            botName = 'Alert Bot (Unknown Group)'
        } else if (pred.bot_group_id) {
            botName = `Bot Group: ${pred.bot_group_id.substring(0, 8)}...`
        }

        if (!botStats[botName]) {
            botStats[botName] = {
                name: botName,
                total: 0,
                won: 0,
                lost: 0,
                pending: 0,
                winRate: '0%',
                recentPredictions: []
            }
        }

        botStats[botName].total++

        if (pred.result === 'won') botStats[botName].won++
        else if (pred.result === 'lost') botStats[botName].lost++
        else botStats[botName].pending++

        // Keep last 5 predictions for each bot
        if (botStats[botName].recentPredictions.length < 5) {
            botStats[botName].recentPredictions.push({
                match: `${pred.home_team_name} vs ${pred.away_team_name}`,
                prediction: pred.prediction_type || pred.raw_payload?.prediction || 'N/A',
                result: pred.result || 'pending',
                date: pred.received_at
            })
        }
    }

    // Calculate win rates
    for (const bot of Object.values(botStats)) {
        const decided = bot.won + bot.lost
        if (decided > 0) {
            bot.winRate = `${((bot.won / decided) * 100).toFixed(1)}%`
        }
    }

    // Sort by total predictions
    const sortedBots = Object.values(botStats).sort((a, b) => b.total - a.total)

    return NextResponse.json({
        totalPredictions: allPredictions?.length || 0,
        bots: sortedBots
    })
}
