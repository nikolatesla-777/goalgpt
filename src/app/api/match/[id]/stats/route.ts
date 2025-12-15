import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/stats
 * Lazy loaded statistics data
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

        const statistics = await MatchDetailService.getStatistics(fixtureId)

        return NextResponse.json({ statistics }, {
            headers: { 'Cache-Control': 'public, s-maxage=30' }
        })
    } catch (error) {
        console.error('[Stats API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }
}
