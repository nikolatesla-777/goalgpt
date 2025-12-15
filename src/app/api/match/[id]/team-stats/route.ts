import { NextResponse } from 'next/server'
import { MatchDetailService } from '@/lib/services/match-detail-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/match/[id]/team-stats
 * Team season statistics for both teams
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(request.url)
        const homeTeamId = Number(searchParams.get('home'))
        const awayTeamId = Number(searchParams.get('away'))
        const leagueId = Number(searchParams.get('league'))

        if (isNaN(homeTeamId) || isNaN(awayTeamId) || isNaN(leagueId)) {
            return NextResponse.json(
                { error: 'home, away, and league IDs required' },
                { status: 400 }
            )
        }

        // Fetch both team stats in parallel
        const [homeStats, awayStats] = await Promise.all([
            MatchDetailService.getTeamStats(homeTeamId, leagueId),
            MatchDetailService.getTeamStats(awayTeamId, leagueId)
        ])

        return NextResponse.json(
            { home: homeStats, away: awayStats },
            { headers: { 'Cache-Control': 'public, s-maxage=3600' } }  // 1 hour cache
        )
    } catch (error) {
        console.error('[Team Stats API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch team stats' }, { status: 500 })
    }
}
