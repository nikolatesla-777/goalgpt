/**
 * TheSports API Client - Complete Service
 * Provides access to all 19 API endpoints through VPS proxy
 */

import type {
    TheSportsApiResponse,
    TheSportsDiaryMatch,
    TheSportsDetailLiveMatch,
    TheSportsTeam,
    TheSportsCompetition,
    TheSportsTrendLive,
    TheSportsTrendDetail,
    TheSportsTeamStats,
    TheSportsPlayerStats,
    TheSportsHalfTeamStats,
    TheSportsLineup,
    TheSportsTableLive,
    TheSportsMatchAnalysis,
    TheSportsCompensation,
    TheSportsGoalLine,
    MATCH_STATUS
} from './thesports-types'

import { APIFootballFixture } from './api-football'
export * from './api-football'
export * from './thesports-types'

// =============================================================================
// Configuration
// =============================================================================

function getProxyUrl(): string {
    return process.env.THESPORTS_PROXY_URL || 'http://142.93.103.128:3001'
}

// =============================================================================
// In-Memory Cache for Team/Competition Names
// =============================================================================

const teamCache = new Map<string, TheSportsTeam>()
const competitionCache = new Map<string, TheSportsCompetition>()

// =============================================================================
// Base Fetch Helper
// =============================================================================

async function fetchFromProxy<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    const baseUrl = getProxyUrl()
    const url = new URL(`${baseUrl}/api${endpoint}`)

    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
            url.searchParams.append(k, v)
        }
    })

    try {
        console.log(`[TheSportsAPI] → ${endpoint}`)
        const res = await fetch(url.toString())

        if (!res.ok) {
            console.error(`[TheSportsAPI] HTTP ${res.status}`)
            return null
        }

        const data = await res.json()

        if (data.code !== 0 && data.code !== undefined) {
            console.error(`[TheSportsAPI] Error:`, data)
            return null
        }

        return data as T
    } catch (err) {
        console.error(`[TheSportsAPI] Fetch error:`, err)
        return null
    }
}

// =============================================================================
// TheSports API Service Class
// =============================================================================

export class TheSportsAPI {

    // =========================================================================
    // MATCH APIs
    // =========================================================================

    /**
     * Get recent matches (paginated)
     */
    static async getRecentMatches(page: number = 1): Promise<TheSportsDiaryMatch[]> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsDiaryMatch[]>>(
            '/football/match/recent/list',
            { page: page.toString() }
        )
        return data?.results || []
    }

    /**
     * Get matches by date (YYYYMMDD format)
     */
    static async getDiary(date?: string): Promise<TheSportsDiaryMatch[]> {
        let dateStr = date || new Date().toISOString().split('T')[0]
        dateStr = dateStr.replace(/-/g, '') // Convert to YYYYMMDD

        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsDiaryMatch[]>>(
            '/football/match/diary',
            { date: dateStr }
        )
        return data?.results || []
    }

    /**
     * Get season's recent matches
     */
    static async getSeasonRecent(seasonId: string): Promise<TheSportsDiaryMatch[]> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsDiaryMatch[]>>(
            '/football/match/season/recent',
            { season_id: seasonId }
        )
        return data?.results || []
    }

    /**
     * Get all live matches with real-time data
     */
    static async getDetailLive(): Promise<TheSportsDetailLiveMatch[]> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsDetailLiveMatch[]>>(
            '/football/match/detail_live'
        )
        return data?.results || []
    }

    /**
     * Get match timeline/history
     */
    static async getLiveHistory(matchId: string): Promise<any> {
        const data = await fetchFromProxy<TheSportsApiResponse<any>>(
            '/football/match/live/history',
            { id: matchId }
        )
        return data?.results || {}
    }

    /**
     * Get match analysis (H2H, recent form)
     */
    static async getMatchAnalysis(matchId: string): Promise<TheSportsMatchAnalysis | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsMatchAnalysis>>(
            '/football/match/analysis',
            { id: matchId }
        )
        return data?.results || null
    }

    // =========================================================================
    // TREND APIs
    // =========================================================================

    /**
     * Get all live match trends
     */
    static async getTrendLive(): Promise<TheSportsTrendLive[]> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsTrendLive[]>>(
            '/football/match/trend/live'
        )
        return data?.results || []
    }

    /**
     * Get single match trend detail
     */
    static async getTrendDetail(matchId: string): Promise<TheSportsTrendDetail | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsTrendDetail>>(
            '/football/match/trend/detail',
            { id: matchId }
        )
        return data?.results || null
    }

    // =========================================================================
    // STATS APIs
    // =========================================================================

    /**
     * Get team stats for a match
     */
    static async getTeamStats(matchId: string): Promise<TheSportsTeamStats | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsTeamStats[]>>(
            '/football/match/team_stats/list',
            { id: matchId }
        )
        return data?.results?.[0] || null
    }

    /**
     * Get detailed team stats
     */
    static async getTeamStatsDetail(matchId: string): Promise<any> {
        const data = await fetchFromProxy<TheSportsApiResponse<any>>(
            '/football/match/team_stats/detail',
            { id: matchId }
        )
        return data?.results || null
    }

    /**
     * Get player stats for a match
     */
    static async getPlayerStats(matchId: string): Promise<TheSportsPlayerStats | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsPlayerStats[]>>(
            '/football/match/player_stats/list',
            { id: matchId }
        )
        return data?.results?.[0] || null
    }

    /**
     * Get detailed player stats
     */
    static async getPlayerStatsDetail(matchId: string): Promise<any> {
        const data = await fetchFromProxy<TheSportsApiResponse<any>>(
            '/football/match/player_stats/detail',
            { id: matchId }
        )
        return data?.results || null
    }

    /**
     * Get half-time team stats
     */
    static async getHalfTeamStats(matchId: string): Promise<TheSportsHalfTeamStats | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsHalfTeamStats[]>>(
            '/football/match/half/team_stats/list',
            { id: matchId }
        )
        return data?.results?.[0] || null
    }

    /**
     * Get detailed half-time stats
     */
    static async getHalfTeamStatsDetail(matchId: string): Promise<any> {
        const data = await fetchFromProxy<TheSportsApiResponse<any>>(
            '/football/match/half/team_stats/detail',
            { id: matchId }
        )
        return data?.results || null
    }

    // =========================================================================
    // LINEUP API
    // =========================================================================

    /**
     * Get match lineup
     */
    static async getLineup(matchId: string): Promise<TheSportsLineup | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsLineup>>(
            '/football/match/lineup/detail',
            { id: matchId }
        )
        return data?.results || null
    }

    // =========================================================================
    // TABLE APIs
    // =========================================================================

    /**
     * Get live standings for all leagues
     */
    static async getTableLive(): Promise<TheSportsTableLive[]> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsTableLive[]>>(
            '/football/table/live'
        )
        return data?.results || []
    }

    /**
     * Get season table details
     */
    static async getSeasonTableDetail(seasonId: string): Promise<any> {
        const data = await fetchFromProxy<TheSportsApiResponse<any>>(
            '/football/season/recent/table/detail',
            { season_id: seasonId }
        )
        return data?.results || null
    }

    // =========================================================================
    // OTHER APIs
    // =========================================================================

    /**
     * Get compensation/form data
     */
    static async getCompensation(page: number = 1): Promise<TheSportsCompensation[]> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsCompensation[]>>(
            '/football/compensation/list',
            { page: page.toString() }
        )
        return data?.results || []
    }

    /**
     * Get goal line (odds) data
     */
    static async getGoalLine(matchId: string): Promise<TheSportsGoalLine[] | null> {
        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsGoalLine[]>>(
            '/football/match/goal/line/detail',
            { id: matchId }
        )
        return data?.results || null
    }

    // =========================================================================
    // UTILITY: Team & Competition Info
    // =========================================================================

    /**
     * Get team info (cached)
     */
    static async getTeamInfo(teamId: string): Promise<TheSportsTeam | null> {
        // Check cache first
        if (teamCache.has(teamId)) {
            return teamCache.get(teamId)!
        }

        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsTeam[]>>(
            '/football/team/info',
            { id: teamId }
        )

        if (data?.results?.[0]) {
            teamCache.set(teamId, data.results[0])
            return data.results[0]
        }

        return null
    }

    /**
     * Get competition info (cached)
     */
    static async getCompetitionInfo(competitionId: string): Promise<TheSportsCompetition | null> {
        // Check cache first
        if (competitionCache.has(competitionId)) {
            return competitionCache.get(competitionId)!
        }

        const data = await fetchFromProxy<TheSportsApiResponse<TheSportsCompetition[]>>(
            '/football/competition/info',
            { id: competitionId }
        )

        if (data?.results?.[0]) {
            competitionCache.set(competitionId, data.results[0])
            return data.results[0]
        }

        return null
    }

    /**
     * Bulk fetch team info
     */
    static async getTeamsBulk(teamIds: string[]): Promise<Map<string, TheSportsTeam>> {
        const result = new Map<string, TheSportsTeam>()
        const toFetch: string[] = []

        // Check cache
        for (const id of teamIds) {
            if (teamCache.has(id)) {
                result.set(id, teamCache.get(id)!)
            } else {
                toFetch.push(id)
            }
        }

        // Fetch missing via bulk endpoint
        if (toFetch.length > 0) {
            const baseUrl = getProxyUrl()
            try {
                const res = await fetch(`${baseUrl}/api/football/team/bulk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: toFetch })
                })
                const data = await res.json()

                if (data.results) {
                    for (const [id, teamData] of Object.entries(data.results)) {
                        const team = (teamData as any).results?.[0]
                        if (team) {
                            teamCache.set(id, team)
                            result.set(id, team)
                        }
                    }
                }
            } catch (err) {
                console.error('[TheSportsAPI] Bulk fetch error:', err)
            }
        }

        return result
    }

    // =========================================================================
    // LEGACY COMPATIBILITY - Maps to APIFootballFixture format
    // =========================================================================

    /**
     * Get live fixtures in APIFootballFixture format (legacy compatibility)
     */
    static async getLiveFixtures(): Promise<APIFootballFixture[]> {
        const diary = await this.getDiary()
        const liveData = await this.getDetailLive()

        // Create lookup for live data
        const liveMap = new Map<string, TheSportsDetailLiveMatch>()
        liveData.forEach(m => liveMap.set(m.id, m))

        // Get unique team and competition IDs
        const teamIds = new Set<string>()
        const compIds = new Set<string>()

        diary.forEach(m => {
            teamIds.add(m.home_team_id)
            teamIds.add(m.away_team_id)
            compIds.add(m.competition_id)
        })

        // Fetch team and competition info
        await this.getTeamsBulk(Array.from(teamIds))

        for (const compId of Array.from(compIds)) {
            await this.getCompetitionInfo(compId)
        }

        // Map to APIFootballFixture
        return diary.map(match => {
            const live = liveMap.get(match.id)
            const homeTeam = teamCache.get(match.home_team_id)
            const awayTeam = teamCache.get(match.away_team_id)
            const competition = competitionCache.get(match.competition_id)

            // Use live scores if available
            const homeScores = live?.score?.[2] || match.home_scores || [0]
            const awayScores = live?.score?.[3] || match.away_scores || [0]
            const statusId = live?.score?.[1] || match.status_id

            return this.mapToAPIFootballFixture(
                match,
                homeTeam,
                awayTeam,
                competition,
                homeScores,
                awayScores,
                statusId
            )
        })
    }

    /**
     * Get fixtures by date in APIFootballFixture format
     */
    static async getFixturesByDate(date?: string): Promise<APIFootballFixture[]> {
        const diary = await this.getDiary(date)

        // Get unique team and competition IDs
        const teamIds = new Set<string>()
        const compIds = new Set<string>()

        diary.forEach(m => {
            teamIds.add(m.home_team_id)
            teamIds.add(m.away_team_id)
            compIds.add(m.competition_id)
        })

        // Fetch info
        await this.getTeamsBulk(Array.from(teamIds))
        for (const compId of Array.from(compIds)) {
            await this.getCompetitionInfo(compId)
        }

        return diary.map(match => {
            const homeTeam = teamCache.get(match.home_team_id)
            const awayTeam = teamCache.get(match.away_team_id)
            const competition = competitionCache.get(match.competition_id)

            return this.mapToAPIFootballFixture(
                match,
                homeTeam,
                awayTeam,
                competition,
                match.home_scores,
                match.away_scores,
                match.status_id
            )
        })
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    private static mapToAPIFootballFixture(
        match: TheSportsDiaryMatch,
        homeTeam: TheSportsTeam | undefined,
        awayTeam: TheSportsTeam | undefined,
        competition: TheSportsCompetition | undefined,
        homeScores: number[],
        awayScores: number[],
        statusId: number
    ): APIFootballFixture {
        const homeGoal = homeScores[0] || 0
        const awayGoal = awayScores[0] || 0
        const htHome = homeScores[1] || 0
        const htAway = awayScores[1] || 0

        return {
            fixture: {
                id: match.id,
                referee: null,
                timezone: 'UTC',
                date: new Date(match.match_time * 1000).toISOString(),
                timestamp: match.match_time,
                venue: { id: null, name: null, city: null },
                status: {
                    long: this.getStatusLabel(statusId),
                    short: this.mapStatus(statusId),
                    elapsed: null,
                    extra: null
                }
            },
            league: {
                id: match.competition_id,
                name: competition?.name || 'Unknown League',
                country: competition?.country_name || '',
                logo: competition?.logo || '',
                flag: null,
                season: new Date().getFullYear(),
                round: match.round?.round_num ? `Round ${match.round.round_num}` : ''
            },
            teams: {
                home: {
                    id: parseInt(match.home_team_id) || 0,
                    name: homeTeam?.name || 'Home Team',
                    logo: homeTeam?.logo || '',
                    winner: null
                },
                away: {
                    id: parseInt(match.away_team_id) || 0,
                    name: awayTeam?.name || 'Away Team',
                    logo: awayTeam?.logo || '',
                    winner: null
                }
            },
            goals: {
                home: homeGoal,
                away: awayGoal
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
        const map: Record<number, string> = {
            1: 'NS', 2: '1H', 3: 'HT', 4: '2H', 5: 'ET',
            6: 'BT', 7: 'PEN', 8: 'FT', 9: 'PST', 10: 'CANC',
            11: 'ABD', 12: 'INT', 13: 'SUSP'
        }
        return map[statusId] || 'NS'
    }

    private static getStatusLabel(statusId: number): string {
        const map: Record<number, string> = {
            1: 'Not Started', 2: 'First Half', 3: 'Halftime',
            4: 'Second Half', 5: 'Extra Time', 6: 'Break',
            7: 'Penalties', 8: 'Match Finished', 9: 'Postponed',
            10: 'Cancelled', 11: 'Abandoned', 12: 'Interrupted', 13: 'Suspended'
        }
        return map[statusId] || 'Unknown'
    }
}
