'use server'

import { createClient } from '@supabase/supabase-js'
import { parsePredictionDetails, formatTeamLogoUrl } from '@/lib/utils/prediction-parser'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface AdminPrediction {
    id: string
    date: string
    time: string
    botName: string
    league: string
    leagueFlag: string
    homeTeam: string
    awayTeam: string
    homeTeamId: string | number | null
    awayTeamId: string | number | null
    country?: string | null
    homeScore: number
    awayScore: number
    matchStatus: 'live' | 'ht' | 'ft'
    minute: number
    predictionMinute: string
    predictionScore: string
    prediction: string
    result: 'pending' | 'live_won' | 'won' | 'lost'
    isVip: boolean
    rawText: string
}

export async function getAdminPredictions(limit = 100): Promise<AdminPrediction[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('predictions_raw')
            .select('*')
            .order('received_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching admin predictions:', error)
            return []
        }

        return (data || []).map((row: any) => {
            const rawText = row.prediction_text || ''
            // Parse robustly using the same logic as Live Flow
            const details = parsePredictionDetails(rawText)

            const payload = row.raw_payload || {}

            // Priority: Payload -> Parsed -> DB Column -> Default
            const league = row.league_name || payload.parsedLeague || details.league || 'Unknown'
            const country = payload.country || details.country || null

            // Bot Name
            let botName = 'AI Bot'
            if (payload.botGroupName) botName = payload.botGroupName
            else if (rawText.match(/AlertCode:\s*([^\s]+)/)) {
                botName = rawText.match(/AlertCode:\s*([^\s]+)/)[1]
            }

            let leagueFlag = '⚽'
            if (country) leagueFlag = '🏳️'

            const dateObj = new Date(row.received_at)

            return {
                id: row.external_id || row.id.toString(),
                date: dateObj.toLocaleDateString('tr-TR'),
                time: dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                botName: botName,
                league: league,
                leagueFlag: leagueFlag,
                homeTeam: row.home_team_name || details.homeTeam || 'Unknown Home',
                awayTeam: row.away_team_name || details.awayTeam || 'Unknown Away',
                homeTeamId: payload.homeTeamId || null, // Eventually from DB if we backfill
                awayTeamId: payload.awayTeamId || null,
                country: country,
                homeScore: 0,
                awayScore: 0,
                matchStatus: 'live',
                minute: row.match_minute || parseInt(details.minute) || 0,
                predictionMinute: details.minute ? `${details.minute}'` : '0\'',
                predictionScore: details.score || payload.parsedScore || '0 - 0',
                prediction: row.prediction_type,
                result: row.status === 'won' ? 'won' : row.status === 'lost' ? 'lost' : 'pending',
                isVip: true,
                rawText: rawText
            }
        })
    } catch (e) {
        console.error('Server Action Error:', e)
        return []
    }
}
