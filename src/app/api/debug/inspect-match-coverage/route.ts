import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Note: Route path doesn't have [id], fixing this below by using searchParams
    // Wait, I will use search param ?id=...
) {
    const { searchParams } = new URL(request.url)
    const fixtureId = searchParams.get('id')

    if (!fixtureId) return NextResponse.json({ error: 'Missing id param' })

    const apiKey = process.env.API_FOOTBALL_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API Key' })

    try {
        // 1. Get Fixture to find League ID and Season
        const fixRes = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
            headers: { 'x-rapidapi-key': apiKey },
            next: { revalidate: 0 }
        })
        const fixData = await fixRes.json()

        if (!fixData.response?.[0]) {
            return NextResponse.json({ error: 'Fixture not found', raw: fixData })
        }

        const league = fixData.response[0].league
        const leagueId = league.id
        const season = league.season

        // 2. Get League Coverage
        const leagueRes = await fetch(`https://v3.football.api-sports.io/leagues?id=${leagueId}&season=${season}`, {
            headers: { 'x-rapidapi-key': apiKey },
            next: { revalidate: 0 }
        })
        const leagueData = await leagueRes.json()

        const coverage = leagueData.response?.[0]?.seasons?.find((s: any) => s.year === season)?.coverage

        return NextResponse.json({
            fixtureId,
            league: {
                id: leagueId,
                name: league.name,
                country: league.country,
                season: season
            },
            coverage_report: {
                events: coverage?.fixtures?.events,
                lineups: coverage?.fixtures?.lineups,
                statistics_fixtures: coverage?.fixtures?.statistics_fixtures, // THIS IS THE KEY
                statistics_players: coverage?.fixtures?.statistics_players
            },
            full_coverage: coverage
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
