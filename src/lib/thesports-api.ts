import { APIFootballFixture, APIFootballTeam } from './api-football'
export * from './api-football'

const BASE_URL = process.env.THESPORTS_API_URL || 'https://api.thesports.com/v1'

interface TheSportsMatch {
    id: string
    match_time: number // timestamp
    status_id: number
    home_team_id: string
    home_team_name: string
    home_team_logo: string
    away_team_id: string
    away_team_name: string
    away_team_logo: string
    league_id: string
    league_name: string
    score: string // "1-0"
    half_score: string // "1-0"
}

export class TheSportsAPI {

    /**
     * Get Live Matches
     * Endpoint: /football/match/detail_live
     */
    static async getLiveFixtures(): Promise<APIFootballFixture[]> {
        const data = await this.request<TheSportsMatch>('/football/match/detail_live')
        return data.map(this.mapToAPIFootballFixture)
    }

    /**
     * Get Fixtures by Date
     * Endpoint: /football/match/list
     */
    static async getFixturesByDate(date?: string): Promise<APIFootballFixture[]> {
        // TheSports expects timestamp or different format likely.
        // Assuming /football/match/list?date=YYYY-MM-DD
        const dateStr = date || new Date().toISOString().split('T')[0]
        const data = await this.request<TheSportsMatch>('/football/match/list', { date: dateStr })
        return data.map(this.mapToAPIFootballFixture)
    }

    // Helper: Map TheSports -> APIFootballFixture
    private static mapToAPIFootballFixture(m: TheSportsMatch): APIFootballFixture {
        const [homeGoal, awayGoal] = (m.score || '0-0').split('-').map(Number)
        const [htHome, htAway] = (m.half_score || '0-0').split('-').map(Number)

        return {
            fixture: {
                id: m.id, // Keep as string (TheSports uses alphanumeric)
                referee: null,
                timezone: 'UTC',
                date: new Date(m.match_time * 1000).toISOString(),
                timestamp: m.match_time,
                venue: { id: null, name: null, city: null },
                status: {
                    long: TheSportsAPI.getStatusLabel(m.status_id),
                    short: TheSportsAPI.mapStatus(m.status_id),
                    elapsed: null, // TheSports might provide this in 'minute' field?
                    extra: null
                }
            },
            league: {
                id: m.league_id, // Keep as string
                name: m.league_name,
                country: '',
                logo: '',
                flag: null,
                season: new Date().getFullYear(),
                round: ''
            },
            teams: {
                home: {
                    id: Number(m.home_team_id),
                    name: m.home_team_name,
                    logo: m.home_team_logo,
                    winner: null
                },
                away: {
                    id: Number(m.away_team_id),
                    name: m.away_team_name,
                    logo: m.away_team_logo,
                    winner: null
                }
            },
            goals: {
                home: isNaN(homeGoal) ? 0 : homeGoal,
                away: isNaN(awayGoal) ? 0 : awayGoal
            },
            score: {
                halftime: { home: htHome, away: htAway },
                fulltime: { home: null, away: null },
                extratime: { home: null, away: null },
                penalty: { home: null, away: null }
            }
        }
    }

    private static mapStatus(statusId: number): string {
        // TheSports Status IDs (Typical)
        // 1: Not Started, 2: First Half, 3: Halftime, 4: Second Half, 5: Overtime, 7: Pens, 8: End
        const map: Record<number, string> = {
            1: 'NS',
            2: '1H',
            3: 'HT',
            4: '2H',
            5: 'ET',
            7: 'PEN',
            8: 'FT'
        }
        return map[statusId] || 'NS'
    }

    private static getStatusLabel(statusId: number): string {
        return `Status ${statusId}`
    }

    // Generic Request
    private static async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T[]> {
        const user = process.env.THESPORTS_API_USER
        const secret = process.env.THESPORTS_API_SECRET

        if (!user || !secret) {
            console.error('❌ Missing TheSports Credentials')
            return []
        }

        const url = new URL(`${BASE_URL}${endpoint}`)
        url.searchParams.append('user', user)
        url.searchParams.append('secret', secret)

        Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

        try {
            console.log(`[TheSportsAPI] Requesting: ${url.toString()}`)
            // Using fetch
            const res = await fetch(url.toString())
            if (!res.ok) {
                console.error(`TheSports API Error: ${res.status} ${res.statusText}`)
                const text = await res.text()
                console.error('Response:', text)
                return []
            }
            const json = await res.json()
            console.log(`[TheSportsAPI] Response type: ${Array.isArray(json) ? 'Array' : typeof json}`)
            console.log('Snippet:', JSON.stringify(json).slice(0, 500))

            // TheSports usually returns [ ... ] or { results: [...] }
            // Let's assume generic array or check structure
            if (Array.isArray(json)) return json
            if (json.results && Array.isArray(json.results)) return json.results

            // Check for error field
            if (json.code !== undefined && json.code !== 200) { // Check for common error structure
                console.error('[TheSportsAPI] API Error Code:', json)
            }

            console.warn('[TheSportsAPI] Unknown Object Keys:', Object.keys(json))
            return []
        } catch (e) {
            console.error('TheSports Request Exception:', e)
            return []
        }
    }
}
