import { NextResponse } from 'next/server'
import { APIFootball, getStatusLabel } from '@/lib/api-football'

export const dynamic = 'force-dynamic'

/**
 * GET /api/livescore/match/[id]
 * Returns detailed match data including events, stats
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

        // Fetch fixture with events
        const fixture = await APIFootball.getFixtureById(fixtureId)

        if (!fixture) {
            return NextResponse.json({ error: 'Match not found' }, { status: 404 })
        }

        // Fetch statistics
        const stats = await APIFootball.getFixtureStatistics(fixtureId)

        // Map events
        const events = (fixture.events || []).map(e => ({
            time: `${e.time.elapsed}'${e.time.extra ? `+${e.time.extra}` : ''}`,
            type: mapEventType(e.type, e.detail),
            team: e.team.id === fixture.teams.home.id ? 'home' : 'away',
            player: e.player.name || null,
            detail: e.detail
        }))

        // Map statistics
        const statLabels: Record<string, string> = {
            'Ball Possession': 'Topla Oynama (%)',
            'Shots on Goal': 'İsabetli Şut',
            'Total Shots': 'Toplam Şut',
            'Corner Kicks': 'Korner',
            'Fouls': 'Faul',
            'Offsides': 'Ofsayt',
            'Yellow Cards': 'Sarı Kart',
            'Red Cards': 'Kırmızı Kart',
            'Goalkeeper Saves': 'Kaleci Kurtarışı',
            'Total passes': 'Toplam Pas',
            'Passes accurate': 'İsabetli Pas'
        }

        const homeStats = stats.find((s: any) => s.team.id === fixture.teams.home.id)?.statistics || []
        const awayStats = stats.find((s: any) => s.team.id === fixture.teams.away.id)?.statistics || []

        const mappedStats = Object.entries(statLabels).map(([apiType, label]) => {
            const homeStat = homeStats.find((s: any) => s.type === apiType)
            const awayStat = awayStats.find((s: any) => s.type === apiType)
            return {
                label,
                home: homeStat?.value ?? 0,
                away: awayStat?.value ?? 0
            }
        }).filter(s => s.home !== 0 || s.away !== 0)

        return NextResponse.json({
            id: String(fixture.fixture.id),
            homeTeam: {
                name: fixture.teams.home.name,
                logo: fixture.teams.home.logo,
                id: String(fixture.teams.home.id)
            },
            awayTeam: {
                name: fixture.teams.away.name,
                logo: fixture.teams.away.logo,
                id: String(fixture.teams.away.id)
            },
            league: {
                id: fixture.league.id,
                name: fixture.league.name,
                country: fixture.league.country,
                logo: fixture.league.logo
            },
            score: {
                home: fixture.goals.home ?? 0,
                away: fixture.goals.away ?? 0
            },
            status: {
                short: fixture.fixture.status.short,
                long: getStatusLabel(fixture.fixture.status.short),
                elapsed: fixture.fixture.status.elapsed
            },
            startTime: new Date(fixture.fixture.date).toLocaleString('tr-TR'),
            venue: fixture.fixture.venue.name || null,
            referee: fixture.fixture.referee || null,
            stats: mappedStats,
            events
        })
    } catch (error) {
        console.error('[Match Detail API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch match detail' },
            { status: 500 }
        )
    }
}

function mapEventType(type: string, detail: string): string {
    const typeMap: Record<string, string> = {
        'Goal': detail === 'Own Goal' ? '⚽🔴 Kendi Kalesine' : detail === 'Penalty' ? '⚽🎯 Penaltı' : '⚽ Gol',
        'Card': detail === 'Yellow Card' ? '🟨 Sarı Kart' : detail === 'Red Card' ? '🟥 Kırmızı Kart' : '🟨🟥 2. Sarı',
        'subst': '🔄 Değişiklik',
        'Var': '📺 VAR'
    }
    return typeMap[type] || type
}
