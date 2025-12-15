import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/lineups
 * Lazy loaded lineups data
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const fixtureId = Number(id)

        if (isNaN(fixtureId)) {
            return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 })
        }

        const lineups = await MatchDetailService.getLineups(fixtureId)

        return NextResponse.json(lineups, {
            headers: { 'Cache-Control': 'public, s-maxage=60' }
        })
    } catch (error) {
        console.error('[Lineups API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch lineups' }, { status: 500 })
    }
}
