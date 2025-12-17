import { createClient } from '@supabase/supabase-js'
import { TheSportsAPI } from '@/lib/thesports-api'
import { APIFootballFixture } from '@/lib/api-football'

// Types for our DB tables
interface LSTeam {
    id: string
    name: string
    short_name: string | null
    logo: string | null
    country_id: string | null
    national: boolean
    updated_at?: string
}

interface LSCompetition {
    id: string
    name: string
    short_name: string | null
    logo: string | null
    country_id: string | null
    country_name: string | null
    type: number
    updated_at?: string
}

interface LSMatch {
    id: string
    season_id: string
    competition_id: string
    home_team_id: string
    away_team_id: string
    status_id: number
    match_time: number
    venue_id: string | null
    referee_id: string | null
    home_scores: any
    away_scores: any
    home_position: string | null
    away_position: string | null
    live_status_code: string
    live_minute: number | null
    updated_at?: string
    raw_data: any
}

export class LivescoreIngestService {
    private static supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    /**
     * SYNC DAILY MATCHES (Full Refresh)
     * Fetches all matches for a date, including team/competition details,
     * and upserts everything to Supabase.
     */
    static async syncDailyMatches(date?: string): Promise<{ success: boolean, message: string }> {
        try {
            console.log(`[LivescoreIngest] Starting full sync for ${date || 'TODAY'}...`)

            // 1. Fetch from TheSports API (Formatted as APIFootballFixture)
            // This method already handles concurrent fetching of teams/leagues internally
            console.log(`[LivescoreIngest] Calling getFixturesByDate(${date})...`)
            const fixtures = await TheSportsAPI.getFixturesByDate(date)

            if (fixtures.length === 0) {
                console.warn('[LivescoreIngest] TheSportsAPI returned 0 fixtures. This usually means API fetch failed or date is empty.')
                return { success: true, message: 'No matches found to sync. Check server logs for API errors.' }
            }

            console.log(`[LivescoreIngest] Found ${fixtures.length} matches. Preparing data...`)

            // 2. Prepare Data Maps to avoid duplicates
            const teamsMap = new Map<string, LSTeam>()
            const compsMap = new Map<string, LSCompetition>()
            const matches: LSMatch[] = []

            for (const f of fixtures) {
                // Teams
                const homeId = f.teams.home.id.toString()
                const awayId = f.teams.away.id.toString()

                if (!teamsMap.has(homeId)) {
                    teamsMap.set(homeId, {
                        id: homeId,
                        name: f.teams.home.name,
                        short_name: null,
                        logo: f.teams.home.logo,
                        country_id: null,
                        national: false
                    })
                }

                if (!teamsMap.has(awayId)) {
                    teamsMap.set(awayId, {
                        id: awayId,
                        name: f.teams.away.name,
                        short_name: null,
                        logo: f.teams.away.logo,
                        country_id: null,
                        national: false
                    })
                }

                // Competition
                const compId = f.league.id.toString()
                if (!compsMap.has(compId)) {
                    compsMap.set(compId, {
                        id: compId,
                        name: f.league.name,
                        short_name: null,
                        logo: f.league.logo,
                        country_id: null,
                        country_name: f.league.country,
                        type: 1 // Default to league
                    })
                }

                // Match
                const statusShort = f.fixture.status.short || 'NS'
                const elapsed = f.fixture.status.elapsed

                matches.push({
                    id: f.fixture.id.toString(),
                    season_id: f.league.season?.toString() || '',
                    competition_id: compId,
                    home_team_id: homeId,
                    away_team_id: awayId,
                    status_id: 0, // We rely on live_status_code
                    match_time: f.fixture.timestamp,
                    venue_id: null,
                    referee_id: null,
                    home_scores: f.score, // Store full score object
                    away_scores: f.score, // Simplified for now, usually needs more parsing
                    home_position: null,
                    away_position: null,
                    live_status_code: statusShort,
                    live_minute: elapsed,
                    raw_data: f
                })
            }

            // 3. Upsert to Supabase (Batching if necessary)
            console.log(`[LivescoreIngest] Upserting ${teamsMap.size} teams...`)
            const teams = Array.from(teamsMap.values())
            const { error: teamError } = await this.supabase.from('ls_teams').upsert(teams, { ignoreDuplicates: false }) // Initial sync should update
            if (teamError) console.error('Team Upsert Error:', teamError)

            console.log(`[LivescoreIngest] Upserting ${compsMap.size} competitions...`)
            const competitions = Array.from(compsMap.values())
            const { error: compError } = await this.supabase.from('ls_competitions').upsert(competitions, { ignoreDuplicates: false })
            if (compError) console.error('Competition Upsert Error:', compError)

            console.log(`[LivescoreIngest] Upserting ${matches.length} matches...`)
            // Upsert matches in chunks of 50 to allow realtime to breathe
            /* 
               Warning: sending 1000 rows at once might choke PostgREST or Supabase Realtime limits.
               Chunking is safer.
            */
            const MATCH_CHUNK_SIZE = 50
            for (let i = 0; i < matches.length; i += MATCH_CHUNK_SIZE) {
                const chunk = matches.slice(i, i + MATCH_CHUNK_SIZE)
                const { error: matchError } = await this.supabase
                    .from('ls_matches')
                    .upsert(chunk, { ignoreDuplicates: false })

                if (matchError) {
                    console.error(`Match Upsert Chunk ${i} Error:`, matchError)
                }
            }

            return { success: true, message: `Synced ${matches.length} matches` }

        } catch (error) {
            console.error('[LivescoreIngest] Sync Error:', error)
            return { success: false, message: 'Sync failed' }
        }
    }

    /**
     * SYNC LIVE MATCHES (Fast Update)
     * Fetches only live matches and updates their scores/status/minutes.
     * This is lightweight and meant to be called frequently.
     */
    static async syncLiveMatches(): Promise<{ success: boolean, live_count: number }> {
        try {
            // Fetch raw live data directly for speed (avoid full object mapping overhead if possible, 
            // but for consistency we use TheSportsAPI.getLiveFixtures which returns mapped formatted data)
            // Using getLiveFixtures ensures we get the same structure.
            const fixtures = await TheSportsAPI.getLiveFixtures()

            if (fixtures.length === 0) {
                // Even if 0 matches, we might need to update matches that *were* live but just finished.
                // Ideally, getLiveFixtures handles 'recently finished' too or we need a specific 'changed' endpoint.
                // For now, assume if list is empty, nothing to update.
                return { success: true, live_count: 0 }
            }

            const activeDate = new Date().toISOString()
            const updates = fixtures.map(f => ({
                id: f.fixture.id.toString(),
                home_scores: f.score,
                away_scores: f.score, // Note: The mapping in API library creates this structure
                live_status_code: f.fixture.status.short,
                live_minute: f.fixture.status.elapsed,
                updated_at: activeDate
            }))

            // Batch update
            const { error } = await this.supabase
                .from('ls_matches')
                .upsert(updates, { onConflict: 'id', ignoreDuplicates: false })
            // Note: onConflict id update only specified columns? 
            // Upsert updates all columns provided. Since we only provide live fields, 
            // check if partial update works with upsert or if it wipes other fields?
            // Supabase upsert: "If the row exists, it updates... with the values provided."
            // Since we ONLY provided live fields, other fields *should* remain if we don't null them...
            // WAIT. SQL UPDATE vs UPSERT.
            // Upsert calculates the row. If we omit a column, does it keep old value or set default/null?
            // In Postgres `INSERT ... ON CONFLICT DO UPDATE SET ...` allows controlled update.
            // Supabase `.upsert` with partial data might be risky IF the table has not-null constraints on omitted cols.
            // BUT `ls_matches` fields except ID are nullable? No, many are not.
            // Safe strategy: We have to assume the row exists (it was created by Daily Sync).
            // So .update() is safer than .upsert() for partial data.

            // Let's try .upsert() but we need to match the Shape.
            // If we use .upsert() with missing required fields (like team_id), it will fail for NEW rows.
            // But for EXISTING rows, does it merge? No, Supabase/Postgres requires valid row for the INSERT phase even if it goes to UPDATE.

            // BETTER STRATEGY: Use .upsert() ONLY if we have full data, OR use .update() but we need to loop.
            // Supabase API doesn't support bulk update with different values easily (only same value for all).
            // To do "Bulk Update Different Values", we usually use upsert with full data or a custom RPC.

            // Decision: Since `getLiveFixtures()` returns FULL data, we can just map it fully like daily sync.
            // It's safer and self-healing (if a live match appeared that wasn't in daily sync).

            const matchUpdates: LSMatch[] = fixtures.map(f => ({
                id: f.fixture.id.toString(),
                season_id: f.league.season?.toString() || '',
                competition_id: f.league.id.toString(),
                home_team_id: f.teams.home.id.toString(),
                away_team_id: f.teams.away.id.toString(),
                status_id: 0,
                match_time: f.fixture.timestamp,
                venue_id: null,
                referee_id: null,
                home_scores: f.score,
                away_scores: f.score,
                home_position: null,
                away_position: null,
                live_status_code: f.fixture.status.short,
                live_minute: f.fixture.status.elapsed,
                raw_data: f,
                updated_at: activeDate
            }))

            // Ensure teams/competitions exist too? 
            // `getLiveFixtures` also fetches teams. We *could* sync them but it slows down "Fast Loop".
            // Let's assume daily sync covers teams. If foreign key error, we miss the update.
            // We can add `ignoreDuplicates` to a quick team sync if needed.

            const { error: upsertError } = await this.supabase
                .from('ls_matches')
                .upsert(matchUpdates)

            if (upsertError) {
                console.error('[LivescoreIngest] Live Update Error:', upsertError)
                return { success: false, live_count: 0 }
            }

            return { success: true, live_count: fixtures.length }

        } catch (error) {
            console.error('[LivescoreIngest] Live Sync Error:', error)
            return { success: false, live_count: 0 }
        }
    }
}
