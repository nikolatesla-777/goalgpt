/**
 * Live Match Service
 * Matches Cenkler predictions with API-Football fixtures
 */

import { APIFootball, APIFootballFixture } from '@/lib/api-football'
import { createClient } from '@supabase/supabase-js'

// Supabase client for team lookup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export class LiveMatchService {

    /**
     * Find a live or upcoming match that matches the team names
     * Uses 3-tier matching: DB lookup → API search → fuzzy match
     */
    static async findMatchForPrediction(homeTeamName: string, awayTeamName: string): Promise<string | null> {
        if (!homeTeamName || !awayTeamName) return null

        console.log(`[LiveMatchService] Finding match for: ${homeTeamName} vs ${awayTeamName}`)

        try {
            // Step 1: Get today's fixtures
            const fixtures = await APIFootball.getFixturesByDate()

            if (!fixtures || fixtures.length === 0) {
                console.log('[LiveMatchService] No fixtures found for today')
                return null
            }

            console.log(`[LiveMatchService] Found ${fixtures.length} fixtures for today`)

            // Step 2: Try to match by team names
            const match = this.findBestMatch(fixtures, homeTeamName, awayTeamName)

            if (match) {
                console.log(`[LiveMatchService] ✅ Match found: ${match.teams.home.name} vs ${match.teams.away.name} (ID: ${match.fixture.id})`)
                return String(match.fixture.id)
            }

            // Step 3: If no match today, try tomorrow (for late-night games)
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowStr = tomorrow.toISOString().split('T')[0]

            const tomorrowFixtures = await APIFootball.getFixturesByDate(tomorrowStr)
            const tomorrowMatch = this.findBestMatch(tomorrowFixtures, homeTeamName, awayTeamName)

            if (tomorrowMatch) {
                console.log(`[LiveMatchService] ✅ Match found (tomorrow): ${tomorrowMatch.teams.home.name} vs ${tomorrowMatch.teams.away.name}`)
                return String(tomorrowMatch.fixture.id)
            }

            console.log(`[LiveMatchService] ⚠️ No match found for: ${homeTeamName} vs ${awayTeamName}`)
            return null

        } catch (error) {
            console.error('[LiveMatchService] Error finding match:', error)
            return null
        }
    }

    /**
     * Find best matching fixture from a list
     */
    private static findBestMatch(
        fixtures: APIFootballFixture[],
        homeTeam: string,
        awayTeam: string
    ): APIFootballFixture | null {
        if (!fixtures || fixtures.length === 0) return null

        const normalizedHome = this.normalizeTeamName(homeTeam)
        const normalizedAway = this.normalizeTeamName(awayTeam)

        for (const fixture of fixtures) {
            const fixtureHome = this.normalizeTeamName(fixture.teams.home.name)
            const fixtureAway = this.normalizeTeamName(fixture.teams.away.name)

            // Exact match (normalized)
            if (fixtureHome === normalizedHome && fixtureAway === normalizedAway) {
                return fixture
            }

            // Partial match (one team contains the other)
            if (this.fuzzyMatch(fixtureHome, normalizedHome) &&
                this.fuzzyMatch(fixtureAway, normalizedAway)) {
                return fixture
            }
        }

        return null
    }

    /**
     * Normalize team name for matching
     */
    private static normalizeTeamName(name: string): string {
        return name
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '') // Remove special chars
            .replace(/fc|sc|sk|fk|ac|as|cf|cd|ud|rc|real|sporting/gi, '') // Remove common prefixes
            .trim()
    }

    /**
     * Fuzzy match - check if names are similar enough
     */
    private static fuzzyMatch(a: string, b: string): boolean {
        // Direct inclusion
        if (a.includes(b) || b.includes(a)) return true

        // Levenshtein-like: at least 70% overlap
        const shorter = a.length < b.length ? a : b
        const longer = a.length >= b.length ? a : b

        let matches = 0
        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) matches++
        }

        const similarity = matches / shorter.length
        return similarity > 0.7
    }

    /**
     * Search for a team by name using API-Football
     */
    static async searchTeam(query: string): Promise<{ id: number; name: string; logo: string } | null> {
        if (!query || query.length < 3) return null

        try {
            const results = await APIFootball.searchTeams(query)

            if (results && results.length > 0) {
                const team = results[0].team
                return {
                    id: team.id,
                    name: team.name,
                    logo: team.logo
                }
            }

            return null
        } catch (error) {
            console.error('[LiveMatchService] Team search error:', error)
            return null
        }
    }

    /**
     * Get all live fixtures
     */
    static async getLiveFixtures(): Promise<APIFootballFixture[]> {
        return APIFootball.getLiveFixtures()
    }

    /**
     * Get fixture details by ID
     */
    static async getFixtureDetails(fixtureId: number): Promise<APIFootballFixture | null> {
        return APIFootball.getFixtureById(fixtureId)
    }

    /**
     * Find fixture ID when we already know the exact Team IDs (from Intelligent Matching Memory)
     */
    static async findFixtureByTeamIds(homeId: number, awayId: number): Promise<string | null> {
        const fixtures = await this.getLiveFixtures()
        if (!fixtures) return null

        const match = fixtures.find(f =>
            f.teams.home.id === homeId &&
            f.teams.away.id === awayId
        )

        return match ? String(match.fixture.id) : null
    }
}
