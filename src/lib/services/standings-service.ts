/**
 * Standings Service
 * Fetches and caches league standings from API-Football
 */

import { APIFootball } from '@/lib/api-football'
import { createClient } from '@supabase/supabase-js'

// Supabase client for caching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cache duration: 60 minutes
const CACHE_DURATION_MS = 60 * 60 * 1000

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface TeamStanding {
    rank: number
    teamId: number
    teamName: string
    teamLogo: string
    points: number
    goalsDiff: number
    form: string | null  // "WWLDW"
    description: string | null  // "Promotion", "Relegation", etc.
    all: StandingStats
    home: StandingStats
    away: StandingStats
}

export interface StandingStats {
    played: number
    win: number
    draw: number
    lose: number
    goals: { for: number; against: number }
}

export interface StandingsResponse {
    leagueId: number
    leagueName: string
    leagueLogo: string
    season: number
    standings: TeamStanding[]
    cachedAt: string
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

export class StandingsService {

    /**
     * Get standings for a league with caching
     */
    static async getStandings(leagueId: number, season?: number): Promise<StandingsResponse | null> {
        const currentSeason = season || new Date().getFullYear()

        // 1. Check cache first
        const cached = await this.getCachedStandings(leagueId, currentSeason)
        if (cached) {
            console.log(`[Standings] Cache hit for league ${leagueId}`)
            return cached
        }

        console.log(`[Standings] Cache miss - fetching from API for league ${leagueId}`)

        // 2. Fetch from API
        const standings = await this.fetchFromAPI(leagueId, currentSeason)
        if (!standings) return null

        // 3. Cache the result
        await this.cacheStandings(leagueId, currentSeason, standings)

        return standings
    }

    /**
     * Fetch standings from API-Football
     */
    private static async fetchFromAPI(leagueId: number, season: number): Promise<StandingsResponse | null> {
        try {
            const API_KEY = process.env.API_FOOTBALL_KEY
            if (!API_KEY) {
                console.error('[Standings] API_FOOTBALL_KEY not configured')
                return null
            }

            const url = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`
            const response = await fetch(url, {
                headers: { 'x-apisports-key': API_KEY }
            })

            const data = await response.json()

            if (!data.response || data.response.length === 0) {
                console.log(`[Standings] No standings found for league ${leagueId}`)
                return null
            }

            const leagueData = data.response[0].league
            const standingsData = leagueData.standings[0] // First group (for leagues with groups)

            const standings: TeamStanding[] = standingsData.map((s: any) => ({
                rank: s.rank,
                teamId: s.team.id,
                teamName: s.team.name,
                teamLogo: s.team.logo,
                points: s.points,
                goalsDiff: s.goalsDiff,
                form: s.form,
                description: s.description,
                all: {
                    played: s.all.played,
                    win: s.all.win,
                    draw: s.all.draw,
                    lose: s.all.lose,
                    goals: { for: s.all.goals.for, against: s.all.goals.against }
                },
                home: {
                    played: s.home.played,
                    win: s.home.win,
                    draw: s.home.draw,
                    lose: s.home.lose,
                    goals: { for: s.home.goals.for, against: s.home.goals.against }
                },
                away: {
                    played: s.away.played,
                    win: s.away.win,
                    draw: s.away.draw,
                    lose: s.away.lose,
                    goals: { for: s.away.goals.for, against: s.away.goals.against }
                }
            }))

            return {
                leagueId: leagueData.id,
                leagueName: leagueData.name,
                leagueLogo: leagueData.logo,
                season: leagueData.season,
                standings,
                cachedAt: new Date().toISOString()
            }
        } catch (error) {
            console.error('[Standings] API fetch error:', error)
            return null
        }
    }

    /**
     * Get cached standings from Supabase
     */
    private static async getCachedStandings(leagueId: number, season: number): Promise<StandingsResponse | null> {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { data, error } = await supabase
                .from('standings_cache')
                .select('*')
                .eq('league_id', leagueId)
                .eq('season', season)
                .single()

            if (error || !data) return null

            // Check if cache is still valid
            const cachedAt = new Date(data.cached_at).getTime()
            const now = Date.now()

            if (now - cachedAt > CACHE_DURATION_MS) {
                console.log(`[Standings] Cache expired for league ${leagueId}`)
                return null
            }

            return data.standings_data as StandingsResponse
        } catch (error) {
            // Table might not exist, that's ok
            return null
        }
    }

    /**
     * Cache standings to Supabase
     */
    private static async cacheStandings(leagueId: number, season: number, standings: StandingsResponse): Promise<void> {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey)

            await supabase
                .from('standings_cache')
                .upsert({
                    league_id: leagueId,
                    season: season,
                    standings_data: standings,
                    cached_at: new Date().toISOString()
                }, {
                    onConflict: 'league_id,season'
                })
        } catch (error) {
            console.error('[Standings] Cache write error:', error)
        }
    }

    /**
     * Parse form string to array of results
     * "WWLDW" -> ['W', 'W', 'L', 'D', 'W']
     */
    static parseForm(form: string | null): ('W' | 'L' | 'D')[] {
        if (!form) return []
        return form.split('').filter(c => ['W', 'L', 'D'].includes(c)) as ('W' | 'L' | 'D')[]
    }

    /**
     * Get description color
     */
    static getDescriptionColor(description: string | null): string {
        if (!description) return 'transparent'

        const lowerDesc = description.toLowerCase()

        if (lowerDesc.includes('champions league') || lowerDesc.includes('promotion')) {
            return '#00ff87' // Green
        }
        if (lowerDesc.includes('europa league') || lowerDesc.includes('conference')) {
            return '#3b82f6' // Blue
        }
        if (lowerDesc.includes('relegation')) {
            return '#ef4444' // Red
        }
        if (lowerDesc.includes('playoff')) {
            return '#f59e0b' // Orange
        }

        return 'transparent'
    }
}
