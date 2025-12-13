import { createClient } from '@supabase/supabase-js'

export interface Team {
    external_id: string
    name: string
}

// Simple In-Memory Cache for Teams to avoid DB spam on every prediction
// In a serverless env, this might reset often, but helps for bursts.
let TEAMS_CACHE: Team[] | null = null
let CACHE_TIMESTAMP = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 Hour

export class TeamMatchingService {

    /**
     * Finds the best matching Home and Away team IDs from the database
     */
    static async matchTeamIds(homeName: string, awayName: string): Promise<{ homeId: string | null, awayId: string | null }> {
        const teams = await this.getAllTeams()

        return {
            homeId: this.findBestMatch(teams, homeName),
            awayId: this.findBestMatch(teams, awayName)
        }
    }

    private static async getAllTeams(): Promise<Team[]> {
        const now = Date.now()
        if (TEAMS_CACHE && (now - CACHE_TIMESTAMP < CACHE_TTL)) {
            return TEAMS_CACHE
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase
            .from('ts_teams')
            .select('external_id, name')

        if (error) {
            console.error('❌ Failed to fetch teams for matching:', error)
            return []
        }

        TEAMS_CACHE = data || []
        CACHE_TIMESTAMP = now
        return TEAMS_CACHE
    }

    private static findBestMatch(teams: Team[], inputName: string): string | null {
        if (!inputName) return null

        // 1. Exact Match (Fast)
        const exact = teams.find(t => t.name.toLowerCase() === inputName.toLowerCase())
        if (exact) return exact.external_id

        // 2. Fuzzy Match (Jaro-Winkler)
        let bestScore = 0.0
        let bestId: string | null = null
        const cleanInput = this.cleanName(inputName)

        for (const team of teams) {
            const cleanTeam = this.cleanName(team.name)
            const score = this.jaroWinkler(cleanInput, cleanTeam)

            if (score > bestScore && score >= 0.70) {
                bestScore = score
                bestId = team.external_id
            }
        }

        // Return best match only if it's "good enough"
        return bestId
    }

    private static cleanName(s: string): string {
        return s
            .replace(/ FC| SC| FK| AFC/gi, '')
            .trim()
            .toLowerCase()
    }

    // --- Jaro-Winkler Implementation (Ported Logic) ---
    // Source equivalent to F23.StringSimilarity logic

    private static jaroWinkler(s1: string, s2: string): number {
        const jaro = this.jaroDistance(s1, s2)
        const p = 0.1 // Standard scaling factor

        // Count common prefix
        let l = 0
        for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
            if (s1[i] === s2[i]) l++
            else break
        }

        return jaro + l * p * (1 - jaro)
    }

    private static jaroDistance(s1: string, s2: string): number {
        if (s1 === s2) return 1.0

        const len1 = s1.length
        const len2 = s2.length
        if (len1 === 0 || len2 === 0) return 0.0

        const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1
        const s1Matches = new Array(len1).fill(false)
        const s2Matches = new Array(len2).fill(false)

        let matches = 0
        let transpositions = 0

        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchDistance)
            const end = Math.min(i + matchDistance + 1, len2)

            for (let j = start; j < end; j++) {
                if (s2Matches[j]) continue
                if (s1[i] !== s2[j]) continue
                s1Matches[i] = true
                s2Matches[j] = true
                matches++
                break
            }
        }

        if (matches === 0) return 0.0

        let k = 0
        for (let i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue
            while (!s2Matches[k]) k++
            if (s1[i] !== s2[k]) transpositions++
            k++
        }

        return ((matches / len1) + (matches / len2) + ((matches - transpositions / 2.0) / matches)) / 3.0
    }
}
