import { NextResponse } from 'next/server'
import { APIFootball } from '@/lib/api-football'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get('team')

    if (!team) {
        return NextResponse.json({ error: 'Missing team parameter' }, { status: 400 })
    }

    try {
        const today = new Date().toISOString().split('T')[0]
        const fixtures = await APIFootball.getFixturesByDate(today)

        const found = fixtures.filter(f =>
            f.teams.home.name.toLowerCase().includes(team.toLowerCase()) ||
            f.teams.away.name.toLowerCase().includes(team.toLowerCase())
        )

        return NextResponse.json({
            query: team,
            count: found.length,
            fixtures: found.map(f => ({
                id: f.fixture.id,
                home: f.teams.home.name,
                away: f.teams.away.name,
                league: f.league.name,
                status: f.fixture.status.short
            }))
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
