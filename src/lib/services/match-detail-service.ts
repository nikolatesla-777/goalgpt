/**
 * Match Detail Service
 * Provides lazy-loaded data for match detail screens
 */

const API_KEY = process.env.API_FOOTBALL_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MatchEvent {
    time: number
    extraTime: number | null
    type: 'Goal' | 'Card' | 'Subst' | 'Var' | string
    detail: string
    team: 'home' | 'away'
    teamId: number
    player: string | null
    assist: string | null
    comments: string | null
}

export interface TeamLineup {
    formation: string
    coach: { name: string; photo: string }
    startXI: PlayerPosition[]
    substitutes: PlayerPosition[]
}

export interface PlayerPosition {
    id: number
    name: string
    number: number
    pos: string
    photo: string
    grid: string | null
}

export interface MatchStatistic {
    type: string
    home: number | string | null
    away: number | string | null
}

export interface H2HMatch {
    id: number
    date: string
    homeTeam: { id: number; name: string; logo: string }
    awayTeam: { id: number; name: string; logo: string }
    homeScore: number
    awayScore: number
    league: string
}

export interface PlayerRating {
    id: number
    name: string
    photo: string
    position: string
    rating: number | null
    team: 'home' | 'away'
    stats: {
        minutes: number
        goals: number
        assists: number
        shots: number
        passes: number
        tackles: number
        fouls: number
        yellowCards: number
        redCards: number
    }
}

export interface TeamSeasonStats {
    team: { id: number; name: string; logo: string }
    league: string
    form: string
    fixtures: {
        played: { home: number; away: number; total: number }
        wins: { home: number; away: number; total: number }
        draws: { home: number; away: number; total: number }
        loses: { home: number; away: number; total: number }
    }
    goals: {
        for: { home: number; away: number; total: number }
        against: { home: number; away: number; total: number }
        avgFor: string
        avgAgainst: string
    }
    cleanSheet: { home: number; away: number; total: number }
    failedToScore: { home: number; away: number; total: number }
    biggestWin: { home: string; away: string }
    biggestLose: { home: string; away: string }
}

export interface MatchPrediction {
    winner: { id: number | null; name: string | null; comment: string | null }
    winOrDraw: boolean
    underOver: string | null
    goals: { home: string; away: string }
    advice: string
    percent: { home: string; draw: string; away: string }
    comparison: {
        form: { home: string; away: string }
        att: { home: string; away: string }
        def: { home: string; away: string }
        poisson: { home: string; away: string }
        h2h: { home: string; away: string }
        goals: { home: string; away: string }
        total: { home: string; away: string }
    }
}

// -----------------------------------------------------------------------------
// Service Methods
// -----------------------------------------------------------------------------

export class MatchDetailService {

    /**
     * Fetch match events (goals, cards, substitutions)
     */
    static async getEvents(fixtureId: number): Promise<MatchEvent[]> {
        try {
            const fixture = await this.fetchFixture(fixtureId)
            if (!fixture || !fixture.events) return []

            return fixture.events.map((e: any) => ({
                time: e.time.elapsed,
                extraTime: e.time.extra,
                type: e.type,
                detail: e.detail,
                team: e.team.id === fixture.teams.home.id ? 'home' : 'away',
                teamId: e.team.id,
                player: e.player?.name || null,
                assist: e.assist?.name || null,
                comments: e.comments || null
            }))
        } catch (error) {
            console.error('[MatchDetail] Events fetch error:', error)
            return []
        }
    }

    /**
     * Fetch match lineups
     */
    static async getLineups(fixtureId: number): Promise<{ home: TeamLineup | null; away: TeamLineup | null }> {
        try {
            const data = await this.apiCall(`/fixtures/lineups?fixture=${fixtureId}`)
            if (!data.response || data.response.length === 0) {
                return { home: null, away: null }
            }

            const mapLineup = (lineup: any): TeamLineup => ({
                formation: lineup.formation,
                coach: {
                    name: lineup.coach?.name || 'Unknown',
                    photo: lineup.coach?.photo || ''
                },
                startXI: lineup.startXI.map((p: any) => ({
                    id: p.player.id,
                    name: p.player.name,
                    number: p.player.number,
                    pos: p.player.pos,
                    photo: p.player.photo || '',
                    grid: p.player.grid
                })),
                substitutes: lineup.substitutes.map((p: any) => ({
                    id: p.player.id,
                    name: p.player.name,
                    number: p.player.number,
                    pos: p.player.pos,
                    photo: p.player.photo || '',
                    grid: null
                }))
            })

            return {
                home: data.response[0] ? mapLineup(data.response[0]) : null,
                away: data.response[1] ? mapLineup(data.response[1]) : null
            }
        } catch (error) {
            console.error('[MatchDetail] Lineups fetch error:', error)
            return { home: null, away: null }
        }
    }

    /**
     * Fetch match statistics
     */
    static async getStatistics(fixtureId: number): Promise<MatchStatistic[]> {
        try {
            const data = await this.apiCall(`/fixtures/statistics?fixture=${fixtureId}`)
            if (!data.response || data.response.length < 2) return []

            const homeStats = data.response[0]?.statistics || []
            const awayStats = data.response[1]?.statistics || []

            const statTypes = [
                'Ball Possession',
                'Shots on Goal',
                'Shots off Goal',
                'Total Shots',
                'Blocked Shots',
                'Shots insidebox',
                'Shots outsidebox',
                'Corner Kicks',
                'Fouls',
                'Offsides',
                'Yellow Cards',
                'Red Cards',
                'Goalkeeper Saves',
                'Total passes',
                'Passes accurate',
                'Passes %'
            ]

            return statTypes.map(type => {
                const homeStat = homeStats.find((s: any) => s.type === type)
                const awayStat = awayStats.find((s: any) => s.type === type)
                return {
                    type,
                    home: homeStat?.value ?? null,
                    away: awayStat?.value ?? null
                }
            }).filter(s => s.home !== null || s.away !== null)
        } catch (error) {
            console.error('[MatchDetail] Statistics fetch error:', error)
            return []
        }
    }

    /**
     * Fetch head-to-head history
     */
    static async getH2H(homeTeamId: number, awayTeamId: number): Promise<H2HMatch[]> {
        try {
            const data = await this.apiCall(`/fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=10`)
            if (!data.response) return []

            return data.response.map((f: any) => ({
                id: f.fixture.id,
                date: f.fixture.date,
                homeTeam: {
                    id: f.teams.home.id,
                    name: f.teams.home.name,
                    logo: f.teams.home.logo
                },
                awayTeam: {
                    id: f.teams.away.id,
                    name: f.teams.away.name,
                    logo: f.teams.away.logo
                },
                homeScore: f.goals.home ?? 0,
                awayScore: f.goals.away ?? 0,
                league: f.league.name
            }))
        } catch (error) {
            console.error('[MatchDetail] H2H fetch error:', error)
            return []
        }
    }

    /**
     * Fetch player statistics for match
     */
    static async getPlayerStats(fixtureId: number, homeTeamId: number): Promise<PlayerRating[]> {
        try {
            const data = await this.apiCall(`/fixtures/players?fixture=${fixtureId}`)
            if (!data.response) return []

            const players: PlayerRating[] = []

            for (const teamData of data.response) {
                const isHome = teamData.team.id === homeTeamId

                for (const playerData of teamData.players) {
                    const p = playerData.player
                    const s = playerData.statistics[0] || {}

                    players.push({
                        id: p.id,
                        name: p.name,
                        photo: p.photo,
                        position: s.games?.position || 'N/A',
                        rating: s.games?.rating ? parseFloat(s.games.rating) : null,
                        team: isHome ? 'home' : 'away',
                        stats: {
                            minutes: s.games?.minutes || 0,
                            goals: s.goals?.total || 0,
                            assists: s.goals?.assists || 0,
                            shots: s.shots?.total || 0,
                            passes: s.passes?.total || 0,
                            tackles: s.tackles?.total || 0,
                            fouls: s.fouls?.committed || 0,
                            yellowCards: s.cards?.yellow || 0,
                            redCards: s.cards?.red || 0
                        }
                    })
                }
            }

            // Sort by rating (highest first)
            return players.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        } catch (error) {
            console.error('[MatchDetail] Player stats fetch error:', error)
            return []
        }
    }

    /**
     * Fetch team season statistics
     */
    static async getTeamStats(teamId: number, leagueId: number, season?: number): Promise<TeamSeasonStats | null> {
        try {
            const currentSeason = season || new Date().getFullYear()
            const data = await this.apiCall(
                `/teams/statistics?team=${teamId}&league=${leagueId}&season=${currentSeason}`
            )

            if (!data.response) return null

            const r = data.response
            return {
                team: {
                    id: r.team.id,
                    name: r.team.name,
                    logo: r.team.logo
                },
                league: r.league.name,
                form: r.form,
                fixtures: {
                    played: { home: r.fixtures.played.home, away: r.fixtures.played.away, total: r.fixtures.played.total },
                    wins: { home: r.fixtures.wins.home, away: r.fixtures.wins.away, total: r.fixtures.wins.total },
                    draws: { home: r.fixtures.draws.home, away: r.fixtures.draws.away, total: r.fixtures.draws.total },
                    loses: { home: r.fixtures.loses.home, away: r.fixtures.loses.away, total: r.fixtures.loses.total }
                },
                goals: {
                    for: { home: r.goals.for.total.home, away: r.goals.for.total.away, total: r.goals.for.total.total },
                    against: { home: r.goals.against.total.home, away: r.goals.against.total.away, total: r.goals.against.total.total },
                    avgFor: r.goals.for.average.total,
                    avgAgainst: r.goals.against.average.total
                },
                cleanSheet: { home: r.clean_sheet.home, away: r.clean_sheet.away, total: r.clean_sheet.total },
                failedToScore: { home: r.failed_to_score.home, away: r.failed_to_score.away, total: r.failed_to_score.total },
                biggestWin: { home: r.biggest.wins.home, away: r.biggest.wins.away },
                biggestLose: { home: r.biggest.loses.home, away: r.biggest.loses.away }
            }
        } catch (error) {
            console.error('[MatchDetail] Team stats fetch error:', error)
            return null
        }
    }

    /**
     * Fetch match predictions from API-Football
     */
    static async getPredictions(fixtureId: number): Promise<MatchPrediction | null> {
        try {
            const data = await this.apiCall(`/predictions?fixture=${fixtureId}`)
            if (!data.response || data.response.length === 0) return null

            const r = data.response[0]
            return {
                winner: {
                    id: r.predictions.winner?.id || null,
                    name: r.predictions.winner?.name || null,
                    comment: r.predictions.winner?.comment || null
                },
                winOrDraw: r.predictions.win_or_draw,
                underOver: r.predictions.under_over,
                goals: {
                    home: r.predictions.goals.home,
                    away: r.predictions.goals.away
                },
                advice: r.predictions.advice,
                percent: {
                    home: r.predictions.percent.home,
                    draw: r.predictions.percent.draw,
                    away: r.predictions.percent.away
                },
                comparison: {
                    form: { home: r.comparison.form.home, away: r.comparison.form.away },
                    att: { home: r.comparison.att.home, away: r.comparison.att.away },
                    def: { home: r.comparison.def.home, away: r.comparison.def.away },
                    poisson: { home: r.comparison.poisson_distribution.home, away: r.comparison.poisson_distribution.away },
                    h2h: { home: r.comparison.h2h.home, away: r.comparison.h2h.away },
                    goals: { home: r.comparison.goals.home, away: r.comparison.goals.away },
                    total: { home: r.comparison.total.home, away: r.comparison.total.away }
                }
            }
        } catch (error) {
            console.error('[MatchDetail] Predictions fetch error:', error)
            return null
        }
    }

    // -----------------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------------

    private static async apiCall(endpoint: string): Promise<any> {
        if (!API_KEY) {
            console.error('[MatchDetail] API_FOOTBALL_KEY not configured')
            return { response: [] }
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: { 'x-apisports-key': API_KEY }
        })

        return response.json()
    }

    private static async fetchFixture(fixtureId: number): Promise<any> {
        const data = await this.apiCall(`/fixtures?id=${fixtureId}`)
        return data.response?.[0] || null
    }
}
