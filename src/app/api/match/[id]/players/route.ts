import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/players
 * Player ratings and stats for match
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const fixtureId = Number(id)
        const { searchParams } = new URL(request.url)
        const homeTeamId = Number(searchParams.get('home'))

        if (isNaN(fixtureId)) {
            return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 })
        }

        const players = await MatchDetailService.getPlayerStats(fixtureId, homeTeamId)

        return NextResponse.json({ players }, {
            headers: { 'Cache-Control': 'public, s-maxage=60' }
        })
    } catch (error) {
        console.error('[Players API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500 })
    }
}
