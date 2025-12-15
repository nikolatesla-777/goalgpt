import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/predictions
 * Match predictions from API-Football
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

        const predictions = await MatchDetailService.getPredictions(fixtureId)

        if (!predictions) {
            return NextResponse.json(
                { error: 'Predictions not available for this match' },
                { status: 404 }
            )
        }

        return NextResponse.json(predictions, {
            headers: { 'Cache-Control': 'public, s-maxage=1800' }  // 30 min cache
        })
    } catch (error) {
        console.error('[Predictions API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 })
    }
}
