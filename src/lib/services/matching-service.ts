
import { LiveMatchService } from './live-match-service'
import { createClient } from '@supabase/supabase-js'

// Service Role Client for writing to aliases table
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export class MatchingService {

    /**
     * Main entry point to find the correct API-Football Fixture ID
     * @param rawHome Raw home team name from Cenkler
     * @param rawAway Raw away team name from Cenkler
     * @param minute Match minute from Cenkler (crucial for context)
     */
    static async resolveMatch(rawHome: string, rawAway: string, minute: number): Promise<{
        fixtureId: number | null,
        homeTeamId: number | null,
        awayTeamId: number | null,
        confidence: number,
        source: 'memory' | 'live_context' | 'fuzzy' | 'none'
    }> {
        // 1. MEMORY CHECK (Database Lookup)
        const memoryMatch = await this.checkMemory(rawHome, rawAway);
        if (memoryMatch) {
            // If we have team IDs, we still need to find the CURRENT fixture ID for these teams
            // But having IDs makes it 100% accurate
            const fixtureId = await LiveMatchService.findFixtureByTeamIds(memoryMatch.homeId, memoryMatch.awayId);
            return {
                fixtureId: fixtureId ? parseInt(fixtureId) : null,
                homeTeamId: memoryMatch.homeId,
                awayTeamId: memoryMatch.awayId,
                confidence: 1.0,
                source: 'memory'
            };
        }

        // 2. LIVE CONTEXT CHECK (The User's "Smart Logic")
        // If not in memory, look at LIVE matches match minute & name similarity
        const liveMatch = await this.findInLiveContext(rawHome, rawAway, minute);

        if (liveMatch) {
            // 3. LEARN & MEMORIZE
            // Save this new mapping to DB so next time it hits Memory Check
            await this.memorizeMapping(rawHome, liveMatch.teams.home.name, liveMatch.teams.home.id, 0.95);
            await this.memorizeMapping(rawAway, liveMatch.teams.away.name, liveMatch.teams.away.id, 0.95);

            return {
                fixtureId: liveMatch.fixture.id,
                homeTeamId: liveMatch.teams.home.id,
                awayTeamId: liveMatch.teams.away.id,
                confidence: 0.95,
                source: 'live_context'
            };
        }

        // 4. FALLBACK: Simple Fuzzy (No Minute Check - maybe API is slightly off or halftime)
        // ... (Optional implementation if Live Context is too strict)

        return { fixtureId: null, homeTeamId: null, awayTeamId: null, confidence: 0, source: 'none' };
    }

    private static async checkMemory(rawHome: string, rawAway: string): Promise<{ homeId: number, awayId: number } | null> {
        // Check local DB "team_aliases"
        const { data: homeAlias } = await supabaseAdmin.from('team_aliases').select('team_id').eq('raw_name', rawHome).maybeSingle();
        const { data: awayAlias } = await supabaseAdmin.from('team_aliases').select('team_id').eq('raw_name', rawAway).maybeSingle();

        if (homeAlias?.team_id && awayAlias?.team_id) {
            return { homeId: homeAlias.team_id, awayId: awayAlias.team_id };
        }
        return null;
    }

    private static async findInLiveContext(rawHome: string, rawAway: string, minute: number) {
        // Fetch ALL live fixtures from API-Football
        // Optimization: Cache this call if high throughput
        const liveFixtures = await LiveMatchService.getLiveFixtures();

        if (!liveFixtures || liveFixtures.length === 0) return null;

        for (const fixture of liveFixtures) {
            const apiMinute = fixture.fixture.status.elapsed || 0;
            const apiHome = fixture.teams.home.name;
            const apiAway = fixture.teams.away.name;

            // A. Minute Check (+/- 10 mins tolerance)
            // Live data might be slightly delayed vs Bot
            if (Math.abs(apiMinute - minute) > 10) {
                // But wait! If it's HT (45), bot might say 45 or 46.
                // If minute is VERY different, skip.
                continue;
            }

            // B. Name Check (First 4-5 chars OR Fuzzy)
            // User Rule: "ilk 4-5 harfinden doğru takımı yakalamaya calısacaksın"
            const homeMatch = this.checkNameMatch(rawHome, apiHome);
            const awayMatch = this.checkNameMatch(rawAway, apiAway);

            if (homeMatch && awayMatch) {
                return fixture;
            }
        }
        return null;
    }

    private static checkNameMatch(raw: string, official: string): boolean {
        const r = this.normalize(raw);
        const o = this.normalize(official);

        // Rule 1: Starts with same 4 chars
        if (r.substring(0, 4) === o.substring(0, 4)) return true;

        // Rule 2: Contains (e.g. "Bayern" in "Bayern Munich")
        if (o.includes(r) || r.includes(o)) return true;

        // Rule 3: Fuzzy (Levenshtein simplified - match 70% chars)
        // ... (Can be added if needed)

        return false;
    }

    private static normalize(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private static async memorizeMapping(raw: string, official: string, id: number, confidence: number) {
        // Fire and forget insert
        try {
            await supabaseAdmin.from('team_aliases').upsert({
                raw_name: raw,
                mapped_name: official,
                team_id: id,
                confidence: confidence
            }, { onConflict: 'raw_name' });
        } catch (e) {
            console.error('Failed to memorize alias:', e);
        }
    }
}
