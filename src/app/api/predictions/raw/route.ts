import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        )

        const { data, error, count } = await supabase
            .from('predictions_raw')
            .select('*', { count: 'exact' })
            .order('received_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching predictions:', error)
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            )
        }

        // Map database fields to frontend format
        const predictions = (data || []).map(row => ({
            id: row.id,
            matchId: row.external_id,
            homeTeam: row.home_team_name,
            awayTeam: row.away_team_name,
            league: row.league_name || 'Unknown',
            prediction: row.prediction_type || '',
            analysis: row.prediction_text || '',
            confidence: row.confidence || 0,
            minute: row.match_minute,
            status: row.status,
            receivedAt: row.received_at,
            rawPayload: row.raw_payload
        }))

        return NextResponse.json({
            success: true,
            data: predictions,
            total: count,
            limit
        })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        )
    }
}
