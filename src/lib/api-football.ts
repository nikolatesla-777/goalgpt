/**
 * API-Football Client
 * https://www.api-football.com/documentation-v3
 * 
 * Base URL: https://v3.football.api-sports.io
 * Auth: x-apisports-key header
 */

const BASE_URL = 'https://v3.football.api-sports.io'
const API_KEY = process.env.API_FOOTBALL_KEY

if (!API_KEY) {
    console.warn('⚠️ API_FOOTBALL_KEY missing in environment variables.')
}

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface APIFootballTeam {
    id: number
    name: string
    code: string | null
    country: string
    founded: number | null
    national: boolean
    logo: string
}

export interface APIFootballFixture {
    fixture: {
        id: number
        referee: string | null
        timezone: string
        date: string
        timestamp: number
        venue: {
            id: number | null
            name: string | null
            city: string | null
        }
        status: {
            long: string
            short: string  // NS, 1H, HT, 2H, FT, AET, PEN, etc.
            elapsed: number | null
            extra: number | null
        }
    }
    league: {
        id: number
        name: string
        country: string
        logo: string
        flag: string | null
        season: number
        round: string
    }
    teams: {
        home: {
            id: number
            name: string
            logo: string
            winner: boolean | null
        }
        away: {
            id: number
            name: string
            logo: string
            winner: boolean | null
        }
    }
    goals: {
        home: number | null
        away: number | null
    }
    score: {
        halftime: { home: number | null; away: number | null }
        fulltime: { home: number | null; away: number | null }
        extratime: { home: number | null; away: number | null }
        penalty: { home: number | null; away: number | null }
    }
    events?: APIFootballEvent[]
}

export interface APIFootballEvent {
    time: {
        elapsed: number
        extra: number | null
    }
    team: {
        id: number
        name: string
        logo: string
    }
    player: {
        id: number | null
        name: string | null
    }
    assist: {
        id: number | null
        name: string | null
    }
    type: string  // Goal, Card, subst, Var
    detail: string  // Normal Goal, Yellow Card, Red Card, etc.
    comments: string | null
}

export interface APIFootballStatistic {
    team: {
        id: number
        name: string
        logo: string
    }
    statistics: {
        type: string
        value: string | number | null
    }[]
}

// -----------------------------------------------------------------------------
// API Client
// -----------------------------------------------------------------------------

async function apiRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
    if (!API_KEY) {
        console.error('❌ API_FOOTBALL_KEY is not configured!')
        return []
    }

    const url = new URL(`${BASE_URL}${endpoint}`)
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value)
        })
    }

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-apisports-key': API_KEY
            },
            next: { revalidate: 0 } // No cache for live data
        })

        if (!response.ok) {
            console.error(`API-Football Error: ${response.status} ${response.statusText}`)
            return []
        }

        const data = await response.json()

        if (data.errors && Object.keys(data.errors).length > 0) {
            console.error('API-Football returned errors:', data.errors)
            return []
        }

        return data.response || []
    } catch (error) {
        console.error('API-Football request failed:', error)
        return []
    }
}

// -----------------------------------------------------------------------------
// Public Methods
// -----------------------------------------------------------------------------

export class APIFootball {

    /**
     * Search teams by name
     * GET /teams?search={query}
     * Minimum 3 characters required
     */
    static async searchTeams(query: string): Promise<{ team: APIFootballTeam; venue: any }[]> {
        if (!query || query.length < 3) {
            console.warn('Team search requires at least 3 characters')
            return []
        }
        return apiRequest('/teams', { search: query })
    }

    /**
     * Get team by exact ID
     * GET /teams?id={id}
     */
    static async getTeamById(id: number): Promise<{ team: APIFootballTeam; venue: any } | null> {
        const results = await apiRequest<{ team: APIFootballTeam; venue: any }>('/teams', { id: String(id) })
        return results[0] || null
    }

    /**
     * Get fixtures by date
     * GET /fixtures?date={YYYY-MM-DD}&timezone={timezone}
     */
    static async getFixturesByDate(date?: string, timezone: string = 'Europe/Istanbul'): Promise<APIFootballFixture[]> {
        const dateStr = date || new Date().toISOString().split('T')[0]
        return apiRequest('/fixtures', { date: dateStr, timezone })
    }

    /**
     * Get all live fixtures
     * GET /fixtures?live=all
     * Returns fixtures with events included
     */
    static async getLiveFixtures(): Promise<APIFootballFixture[]> {
        return apiRequest('/fixtures', { live: 'all' })
    }

    /**
     * Get live fixtures filtered by league IDs
     * GET /fixtures?live={league1-league2-...}
     */
    static async getLiveFixturesByLeagues(leagueIds: number[]): Promise<APIFootballFixture[]> {
        if (leagueIds.length === 0) return this.getLiveFixtures()
        return apiRequest('/fixtures', { live: leagueIds.join('-') })
    }

    /**
     * Get single fixture by ID with full details
     * GET /fixtures?id={id}
     * Returns events, lineups, statistics, players
     */
    static async getFixtureById(id: number): Promise<APIFootballFixture | null> {
        const results = await apiRequest<APIFootballFixture>('/fixtures', { id: String(id) })
        return results[0] || null
    }

    /**
     * Get fixture events
     * GET /fixtures/events?fixture={id}
     */
    static async getFixtureEvents(fixtureId: number): Promise<APIFootballEvent[]> {
        return apiRequest('/fixtures/events', { fixture: String(fixtureId) })
    }

    /**
     * Get fixture statistics
     * GET /fixtures/statistics?fixture={id}
     */
    static async getFixtureStatistics(fixtureId: number): Promise<APIFootballStatistic[]> {
        return apiRequest('/fixtures/statistics', { fixture: String(fixtureId) })
    }

    /**
     * Get next X fixtures for a team
     * GET /fixtures?team={id}&next={count}
     */
    static async getTeamNextFixtures(teamId: number, count: number = 5): Promise<APIFootballFixture[]> {
        return apiRequest('/fixtures', { team: String(teamId), next: String(count) })
    }

    /**
     * Get last X fixtures for a team
     * GET /fixtures?team={id}&last={count}
     */
    static async getTeamLastFixtures(teamId: number, count: number = 5): Promise<APIFootballFixture[]> {
        return apiRequest('/fixtures', { team: String(teamId), last: String(count) })
    }

    /**
     * Check API status / quota
     * GET /status
     */
    static async getStatus(): Promise<any> {
        const results = await apiRequest<any>('/status')
        return results[0] || null
    }
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format team logo URL from API-Football
 * Already in correct format: https://media.api-sports.io/football/teams/{id}.png
 */
export function formatTeamLogo(teamId: number): string {
    return `https://media.api-sports.io/football/teams/${teamId}.png`
}

/**
 * Format league logo URL from API-Football
 */
export function formatLeagueLogo(leagueId: number): string {
    return `https://media.api-sports.io/football/leagues/${leagueId}.png`
}

/**
 * Check if a fixture is currently live
 */
export function isFixtureLive(status: string): boolean {
    const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT']
    return liveStatuses.includes(status)
}

/**
 * Check if a fixture is finished
 */
export function isFixtureFinished(status: string): boolean {
    const finishedStatuses = ['FT', 'AET', 'PEN']
    return finishedStatuses.includes(status)
}

/**
 * Map API-Football status to readable Turkish
 */
export function getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
        'TBD': 'Belirlenecek',
        'NS': 'Başlamadı',
        '1H': '1. Yarı',
        'HT': 'Devre Arası',
        '2H': '2. Yarı',
        'ET': 'Uzatma',
        'BT': 'Uzatma Arası',
        'P': 'Penaltılar',
        'SUSP': 'Askıya Alındı',
        'INT': 'Kesintiye Uğradı',
        'FT': 'Bitti',
        'AET': 'Uzatmada Bitti',
        'PEN': 'Penaltılarla Bitti',
        'PST': 'Ertelendi',
        'CANC': 'İptal Edildi',
        'ABD': 'Terk Edildi',
        'AWD': 'Hükmen',
        'WO': 'Hükmen'
    }
    return statusMap[status] || status
}
