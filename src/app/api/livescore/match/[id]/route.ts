import { NextResponse } from 'next/server'
import { TheSportsAPI } from '@/lib/thesports-api'
import { STAT_TYPES, MATCH_STATUS } from '@/lib/thesports-types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/livescore/match/[id]
 * Returns detailed match data including:
 * - Basic match info
 * - Team stats
 * - Player stats
 * - H2H (analysis)
 * - Lineup
 * - Standings (optional)
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: matchId } = await params

        if (!matchId) {
            return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 })
        }

        console.log(`[Match Detail API] Fetching match: ${matchId}`)

        // Parallel fetch all data
        const [teamStats, playerStats, lineup, analysis, halfStats] = await Promise.all([
            TheSportsAPI.getTeamStats(matchId),
            TheSportsAPI.getPlayerStats(matchId),
            TheSportsAPI.getLineup(matchId),
            TheSportsAPI.getMatchAnalysis(matchId),
            TheSportsAPI.getHalfTeamStats(matchId)
        ])

        // Get team info
        const homeTeamId = teamStats?.stats?.[0]?.team_id
        const awayTeamId = teamStats?.stats?.[1]?.team_id

        let homeTeam = null
        let awayTeam = null

        if (homeTeamId) {
            homeTeam = await TheSportsAPI.getTeamInfo(homeTeamId)
        }
        if (awayTeamId) {
            awayTeam = await TheSportsAPI.getTeamInfo(awayTeamId)
        }

        // Map team stats to readable format
        const mappedStats = mapTeamStats(teamStats)

        // Map player stats
        const mappedPlayerStats = mapPlayerStats(playerStats)

        // Map lineup
        const mappedLineup = mapLineup(lineup)

        // Map H2H
        const h2h = mapH2H(analysis)

        // Map half stats
        const mappedHalfStats = mapHalfStats(halfStats)

        return NextResponse.json({
            id: matchId,
            homeTeam: {
                id: homeTeamId || null,
                name: homeTeam?.name || 'Ev Sahibi',
                logo: homeTeam?.logo || ''
            },
            awayTeam: {
                id: awayTeamId || null,
                name: awayTeam?.name || 'Deplasman',
                logo: awayTeam?.logo || ''
            },
            stats: mappedStats,
            playerStats: mappedPlayerStats,
            lineup: mappedLineup,
            h2h: h2h,
            halfStats: mappedHalfStats
        })
    } catch (error) {
        console.error('[Match Detail API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch match detail' },
            { status: 500 }
        )
    }
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapTeamStats(data: any): { label: string, home: number | string, away: number | string }[] {
    if (!data?.stats || data.stats.length < 2) return []

    const home = data.stats[0] || {}
    const away = data.stats[1] || {}

    const labels: [keyof typeof home, string][] = [
        ['shots', 'Şut'],
        ['shots_on_target', 'İsabetli Şut'],
        ['possession', 'Top Hakimiyeti (%)'],
        ['passes', 'Pas'],
        ['passes_accuracy', 'Pas İsabeti (%)'],
        ['corners', 'Korner'],
        ['offsides', 'Ofsayt'],
        ['fouls', 'Faul'],
        ['yellow_cards', 'Sarı Kart'],
        ['red_cards', 'Kırmızı Kart'],
        ['goal_kicks', 'Kale Vuruşu'],
        ['throw_ins', 'Taç Atışı']
    ]

    return labels
        .map(([key, label]) => ({
            label,
            home: home[key] ?? 0,
            away: away[key] ?? 0
        }))
        .filter(s => s.home !== 0 || s.away !== 0)
}

function mapPlayerStats(data: any): { home: any[], away: any[] } {
    const result = { home: [] as any[], away: [] as any[] }

    if (!data?.player_stats) return result

    // Get first team_id as home, rest as away
    const teamIds = new Set(data.player_stats.map((p: any) => p.team_id))
    const teamIdArray = Array.from(teamIds) as string[]

    for (const player of data.player_stats) {
        const mappedPlayer = {
            name: player.player_name || `Oyuncu ${player.player_id?.slice(-4)}`,
            goals: player.goals || 0,
            assists: player.assists || 0,
            minutes: player.minutes_played || 0,
            rating: player.rating || 0,
            shots: player.shots || 0,
            passes: player.passes || 0,
            tackles: player.tackles || 0,
            yellowCards: player.yellow_cards || 0,
            redCards: player.red_cards || 0
        }

        if (player.team_id === teamIdArray[0]) {
            result.home.push(mappedPlayer)
        } else {
            result.away.push(mappedPlayer)
        }
    }

    // Sort by rating descending
    result.home.sort((a, b) => b.rating - a.rating)
    result.away.sort((a, b) => b.rating - a.rating)

    return result
}

function mapLineup(data: any): { home: any, away: any } | null {
    if (!data || !data.home || !data.away) return null

    return {
        home: {
            formation: data.home.formation || '4-4-2',
            manager: data.home.manager?.name || null,
            lineup: (data.home.lineup || []).map((p: any) => ({
                name: p.player_name,
                number: p.shirt_number,
                position: p.position,
                grid: p.grid,
                captain: p.captain === 1
            })),
            substitutes: (data.home.substitutes || []).map((p: any) => ({
                name: p.player_name,
                number: p.shirt_number,
                position: p.position
            }))
        },
        away: {
            formation: data.away.formation || '4-4-2',
            manager: data.away.manager?.name || null,
            lineup: (data.away.lineup || []).map((p: any) => ({
                name: p.player_name,
                number: p.shirt_number,
                position: p.position,
                grid: p.grid,
                captain: p.captain === 1
            })),
            substitutes: (data.away.substitutes || []).map((p: any) => ({
                name: p.player_name,
                number: p.shirt_number,
                position: p.position
            }))
        }
    }
}

function mapH2H(data: any): any[] {
    if (!data?.h2h) return []

    return data.h2h.slice(0, 5).map((match: any) => ({
        matchId: match.match_id,
        date: new Date(match.match_time * 1000).toLocaleDateString('tr-TR'),
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        homeScore: match.home_score,
        awayScore: match.away_score
    }))
}

function mapHalfStats(data: any): { firstHalf: any, secondHalf: any } | null {
    if (!data?.p1) return null

    const statKeys: [string, string][] = [
        ['2', 'Şut'],
        ['3', 'Korner'],
        ['22', 'Tehlikeli Atak'],
        ['23', 'İsabetli Şut'],
        ['25', 'Top Hakimiyeti (%)']
    ]

    const firstHalf = statKeys.map(([key, label]) => {
        const val = data.p1?.[key]
        return {
            label,
            home: val?.[0] ?? 0,
            away: val?.[1] ?? 0
        }
    }).filter(s => s.home !== 0 || s.away !== 0)

    const secondHalf = data.p2 ? statKeys.map(([key, label]) => {
        const val = data.p2?.[key]
        return {
            label,
            home: val?.[0] ?? 0,
            away: val?.[1] ?? 0
        }
    }).filter(s => s.home !== 0 || s.away !== 0) : []

    return { firstHalf, secondHalf }
}
