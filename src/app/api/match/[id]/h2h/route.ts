import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/h2h
 * Head-to-head history between teams
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)

        const homeTeamId = Number(searchParams.get('home'))
        const awayTeamId = Number(searchParams.get('away'))

        if (isNaN(homeTeamId) || isNaN(awayTeamId)) {
            return NextResponse.json(
                { error: 'home and away team IDs required' },
                { status: 400 }
            )
        }

        const h2h = await MatchDetailService.getH2H(homeTeamId, awayTeamId)

        return NextResponse.json({ matches: h2h }, {
            headers: { 'Cache-Control': 'public, s-maxage=300' }
        })
    } catch (error) {
        console.error('[H2H API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch H2H' }, { status: 500 })
    }
}
