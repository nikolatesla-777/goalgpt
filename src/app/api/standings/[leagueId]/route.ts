import { NextResponse } from 'next/server'
import { StandingsService } from '@/lib/services/standings-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/standings/[leagueId]
 * Returns league standings with form data
 * 
 * Query params:
 * - season: Optional year (defaults to current)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ leagueId: string }> }
) {
    try {
        const { leagueId } = await params
        const leagueIdNum = Number(leagueId)

        if (isNaN(leagueIdNum)) {
            return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 })
        }

        const { searchParams } = new URL(request.url)
        const season = searchParams.get('season')
        const seasonNum = season ? Number(season) : undefined

        const standings = await StandingsService.getStandings(leagueIdNum, seasonNum)

        if (!standings) {
            return NextResponse.json(
                { error: 'Standings not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(standings, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        })
    } catch (error) {
        console.error('[Standings API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch standings' },
            { status: 500 }
        )
    }
}
