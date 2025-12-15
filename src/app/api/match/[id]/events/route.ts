import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/events
 * Match events (goals, cards, substitutions)
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

        const events = await MatchDetailService.getEvents(fixtureId)

        return NextResponse.json({ events }, {
            headers: { 'Cache-Control': 'public, s-maxage=15' }
        })
    } catch (error) {
        console.error('[Events API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }
}
