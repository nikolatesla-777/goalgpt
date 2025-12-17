/**
 * Global Livescore Service
 * Fetches ALL matches worldwide and groups by Country > League
 * "Allah ne verdiyse" strategy - No filtering!
 * NOW WITH AI PREDICTION MERGE FROM SUPABASE
 */

import { unstable_cache } from 'next/cache'
import { APIFootballFixture, isFixtureLive, isFixtureFinished, getStatusLabel } from '@/lib/api-football'
import { TheSportsAPI } from '@/lib/thesports-api'
import { MomentumEngine, MomentumInsight } from './momentum-engine'
import { createClient } from '@supabase/supabase-js'
import { PredictionEvaluator } from '@/lib/prediction-evaluator'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AIPredictionData {
    bot_name: string
    prediction: string
    minute: number | null
    confidence: number
}

export interface MatchCard {
    id: string
    status: string
    statusLabel: string
    minute: number | null
    startTime: string
    timestamp: number
    home: {
        id: number
        name: string
        logo: string
        score: number
    }
    away: {
        id: number
        name: string
        logo: string
        score: number
    }
    insight: MomentumInsight | null
    isLive: boolean
    hasAIPrediction: boolean
    aiPredictionData: AIPredictionData | null
}

export interface LeagueGroup {
    id: number
    name: string
    logo: string
    round: string
    matches: MatchCard[]
}

export interface CountryGroup {
    name: string
    code: string
    flag: string
    leagues: LeagueGroup[]
}

export interface LivescoreResponse {
    timestamp: string
    liveCount: number
    totalCount: number
    countries: CountryGroup[]
}

// -----------------------------------------------------------------------------
// DB Prediction Type
// -----------------------------------------------------------------------------
interface DBPrediction {
    id: string
    home_team_name: string
    away_team_name: string
    prediction_type: string
    match_minute: string | null
    confidence: number | null
    bot_name: string | null
    league_name?: string
    result?: string
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function normalizeTeamName(name: string): string {
    if (!name) return ''
    let normalized = name.toLowerCase()

    // Manual Fixes
    if (normalized.includes('panaitolikos')) return 'panetolikos'

    normalized = normalized.replace(/münchen|munchen|munich/g, 'munchen')
    normalized = normalized.replace(/mainz\s*05|fsv mainz/g, 'mainz')

    return normalized
        .replace(/\([^)]*\)/g, '')
        .replace(/\b(fc|sk|fk|ik|fsv|vfb|vfl|sc|sv|rb|bsc|tsg|bv|tsv|ssc|united|city|town|sports|spor|calcio|ac|as|1899|1904|1909|1860)\b/g, '')
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i')
        .replace(/[óòôõöø]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ä]/g, 'a')
        .replace(/[ñ]/g, 'n')
        .replace(/[çć]/g, 'c')
        .replace(/[ß]/g, 'ss')
        .replace(/[^a-z0-9]/g, '')
        .trim()
}

// -----------------------------------------------------------------------------
// CACHED FETCH WRAPPER
// Uses Next.js unstable_cache to persist data across requests/functions
// -----------------------------------------------------------------------------

/**
 * Fetch ALL fixtures for today + live matches
 * CACHED via Next.js Data Cache (30s)
 * Exported directly for use in Server Components and API Routes
 */
export const getCachedGlobalLivescore = unstable_cache(
    async (includeFinished: boolean) => {
        return await GlobalLivescoreService.fetchStart(includeFinished)
    },
    ['global-livescore-v2'],
    {
        revalidate: 30, // 30 seconds cache
        tags: ['livescore']
    }
)

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

export class GlobalLivescoreService {

    /**
     * Fetch ALL fixtures for today + live matches
     * Uses the exported cached function
     */
    static async fetchGlobalLivescore(includeFinished: boolean = true): Promise<LivescoreResponse> {
        return await getCachedGlobalLivescore(includeFinished)
    }

    /**
     * Internal Fetch Logic (Uncached)
     * Public so the standalone cache function can call it
     */
    /**
     * Internal Fetch Logic (DB-First)
     * Fetches globally synced matches from Supabase
     */
    public static async fetchStart(includeFinished: boolean): Promise<LivescoreResponse> {
        console.log('[GlobalLivescore] Fetching fixtures from DB...')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) return { timestamp: new Date().toISOString(), liveCount: 0, totalCount: 0, countries: [] }

        try {
            const supabase = createClient(supabaseUrl, supabaseKey)

            // Today's range (UTC)
            // Adjust based on how we want to show 'Daily' matches. Usually 00:00 to 23:59 UTC or local.
            // For now, let's fetch EVERYTHING in the `ls_matches` table that corresponds to "Active Display Window"
            // Since we sync by date, the table might contain multiple days if not cleaned.
            // Assumption: Sync only puts relevant matches or we filter by date here.
            // Let's filter by match_time for today +/- 24h to be safe, or just fetch all if volume is low.
            // Better: Fetch all from `ls_matches`.

            let query = supabase
                .from('ls_matches')
                .select(`
                    *,
                    competition:ls_competitions(*),
                    home_team:ls_teams!home_team_id(*),
                    away_team:ls_teams!away_team_id(*)
                `)

            // If we need performance, we can add filters.

            const { data: fixtures, error } = await query

            if (error) {
                console.error('[GlobalLivescore] DB Error:', error)
                return { timestamp: new Date().toISOString(), liveCount: 0, totalCount: 0, countries: [] }
            }

            if (!fixtures) return { timestamp: new Date().toISOString(), liveCount: 0, totalCount: 0, countries: [] }

            // Map DB result to APIFootballFixture format internally for reuse
            const mappedFixtures: any[] = fixtures.map((f: any) => ({
                fixture: {
                    id: f.id,
                    timestamp: f.match_time,
                    status: {
                        short: f.live_status_code || 'NS',
                        elapsed: f.live_minute,
                        long: getStatusLabel(f.live_status_code || 'NS')
                    },
                    date: new Date(f.match_time * 1000).toISOString()
                },
                league: {
                    id: Number(f.competition_id),
                    name: f.competition?.name || 'Unknown',
                    country: f.competition?.country_name || 'World',
                    logo: f.competition?.logo || '',
                    flag: null,
                    section: f.competition?.country_name || 'World', // fallback
                    round: f.raw_data?.league?.round // Try to extract from raw if needed
                },
                teams: {
                    home: {
                        id: Number(f.home_team_id),
                        name: f.home_team?.name || 'Home',
                        logo: f.home_team?.logo || ''
                    },
                    away: {
                        id: Number(f.away_team_id),
                        name: f.away_team?.name || 'Away',
                        logo: f.away_team?.logo || ''
                    }
                },
                goals: {
                    home: f.home_scores?.[0] ?? 0,
                    away: f.away_scores?.[0] ?? 0
                },
                score: {
                    halftime: {
                        home: f.home_scores?.[1] ?? 0,
                        away: f.away_scores?.[1] ?? 0
                    }
                },
                statistics: f.raw_data?.statistics // Use raw if available
            }))

            // STEP 2: Fetch Supabase predictions (Keep existing logic)
            const dbPredictions = await this.fetchPredictionsFromDB()

            // Filter finished if needed
            let finalFixtures = mappedFixtures
            if (!includeFinished) {
                finalFixtures = finalFixtures.filter(f => !isFixtureFinished(f.fixture.status.short))
            }

            console.log(`[GlobalLivescore] Loaded ${finalFixtures.length} matches from DB`)

            // STEP 3: THE MERGE - Enrich fixtures with AI predictions
            let matchedCount = 0
            const enrichedFixtures = finalFixtures.map(fixture => {
                const prediction = this.findPredictionForFixture(fixture, dbPredictions)
                if (prediction) matchedCount++

                // Calculate Momentum Insight
                const stats = fixture.statistics ? MomentumEngine.parseStatistics(fixture.statistics) : null
                const insight = MomentumEngine.analyze(stats, fixture.fixture.status.short, fixture.fixture.status.elapsed)

                return {
                    fixture,
                    prediction,
                    insight
                }
            })

            // Auto-settlement logic (fire and forget)
            this.processLiveSettlements(enrichedFixtures.map(e => ({
                ...e.fixture,
                hasAIPrediction: !!e.prediction,
                aiPredictionData: e.prediction ? {
                    id: e.prediction.id,
                    prediction: e.prediction.prediction_type,
                    bot_name: e.prediction.bot_name || 'System',
                    minute: e.prediction.match_minute ? parseInt(e.prediction.match_minute) : null,
                    confidence: e.prediction.confidence || 0,
                    result: e.prediction.result || 'pending',
                    home: e.fixture.teams.home.name,
                    away: e.fixture.teams.away.name
                } : null
            })))

            // Group by Country > League
            const grouped = this.groupByCountryAndLeague(enrichedFixtures)
            const liveCount = finalFixtures.filter(f => isFixtureLive(f.fixture.status.short)).length

            return {
                timestamp: new Date().toISOString(),
                liveCount,
                totalCount: finalFixtures.length,
                countries: grouped
            }

        } catch (e) {
            console.error('[GlobalLivescore] Service Error:', e)
            return { timestamp: new Date().toISOString(), liveCount: 0, totalCount: 0, countries: [] }
        }
    }

    /**
     * Group multiple fixtures into Country > League
     */
    private static groupByCountryAndLeague(
        fixtures: { fixture: APIFootballFixture, prediction: DBPrediction | null, insight: MomentumInsight | null }[]
    ): CountryGroup[] {
        const countryMap = new Map<string, CountryGroup>()

        for (const item of fixtures) {
            const f = item.fixture
            const p = item.prediction
            const insight = item.insight

            const countryName = f.league.country || 'World'
            const countryFlag = f.league.flag || ''
            const leagueName = f.league.name
            const leagueId = f.league.id
            const leagueLogo = f.league.logo

            if (!countryMap.has(countryName)) {
                countryMap.set(countryName, {
                    name: countryName,
                    code: f.league.country?.substring(0, 3).toUpperCase() || 'WLD',
                    flag: countryFlag,
                    leagues: []
                })
            }

            const countryGroup = countryMap.get(countryName)!
            let leagueGroup = countryGroup.leagues.find(l => l.name === leagueName)

            if (!leagueGroup) {
                leagueGroup = {
                    id: Number(leagueId),
                    name: leagueName,
                    logo: leagueLogo,
                    round: f.league.round,
                    matches: []
                }
                countryGroup.leagues.push(leagueGroup)
            }

            // Convert to UI MatchCard
            const matchCard: MatchCard = {
                id: f.fixture.id.toString(),
                status: f.fixture.status.short,
                statusLabel: getStatusLabel(f.fixture.status.short),
                minute: f.fixture.status.elapsed,
                startTime: new Date(f.fixture.timestamp * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: f.fixture.timestamp,
                home: {
                    id: f.teams.home.id,
                    name: f.teams.home.name,
                    logo: f.teams.home.logo,
                    score: f.goals.home ?? 0
                },
                away: {
                    id: f.teams.away.id,
                    name: f.teams.away.name,
                    logo: f.teams.away.logo,
                    score: f.goals.away ?? 0
                },
                insight: insight,
                isLive: isFixtureLive(f.fixture.status.short),
                hasAIPrediction: !!p,
                aiPredictionData: p ? {
                    bot_name: p.bot_name || 'System',
                    prediction: p.prediction_type,
                    minute: p.match_minute ? parseInt(p.match_minute) : null,
                    confidence: p.confidence || 0
                } : null
            }

            if (leagueGroup) {
                leagueGroup.matches.push(matchCard)
            }
        }

        // Sort matches within leagues
        for (const country of countryMap.values()) {
            for (const league of country.leagues) {
                league.matches.sort((a, b) => {
                    if (a.isLive && !b.isLive) return -1
                    if (!a.isLive && b.isLive) return 1
                    return a.timestamp - b.timestamp
                })
            }
        }

        return Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    }

    /**
     * Process live settlements (Early Win Check)
     */
    private static async processLiveSettlements(fixtures: any[]) {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

            if (!supabaseUrl || !supabaseServiceKey) {
                console.log('[GlobalLivescore] Supabase not configured for settlement, skipping.')
                return
            }

            const candidates = fixtures.filter(f =>
                f.hasAIPrediction &&
                f.aiPredictionData &&
                f.aiPredictionData.result === 'pending' &&
                ['1H', 'HT', '2H', 'ET', 'P', 'FT', 'AET', 'PEN'].includes(f.fixture.status.short)
            )

            if (candidates.length === 0) return

            const updates = []

            for (const match of candidates) {
                const pred = match.aiPredictionData
                if (!pred) continue

                const homeGoals = match.goals.home ?? 0
                const awayGoals = match.goals.away ?? 0
                const htHome = match.score?.halftime?.home ?? 0
                const htAway = match.score?.halftime?.away ?? 0
                const status = match.fixture.status.short

                const { result, log } = PredictionEvaluator.evaluate(
                    pred.prediction,
                    homeGoals,
                    awayGoals,
                    htHome,
                    htAway,
                    status
                )

                if (result === 'won' || result === 'lost') {
                    updates.push({
                        id: pred.id,
                        result: result,
                        final_score: `${homeGoals}-${awayGoals}`,
                        processing_log: log,
                        settled_at: new Date().toISOString()
                    })
                    const emoji = result === 'won' ? '✅' : '❌'
                    console.log(`[Auto-Settlement] LIVE DECISION ${emoji}: ${pred.home} vs ${pred.away} | ${pred.prediction} | Result: ${result}`)
                }
            }

            if (updates.length > 0) {
                const supabase = createClient(supabaseUrl, supabaseServiceKey)
                for (const update of updates) {
                    await supabase
                        .from('predictions_raw')
                        .update({
                            result: update.result,
                            final_score: update.final_score,
                            processing_log: update.processing_log,
                            settled_at: update.settled_at
                        })
                        .eq('id', update.id)
                }
            }

        } catch (error) {
            console.error('[GlobalLivescore] Auto-settlement error:', error)
        }
    }

    /**
     * Fetch predictions from Supabase
     */
    private static async fetchPredictionsFromDB(): Promise<DBPrediction[]> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) return []

        try {
            const supabase = createClient(supabaseUrl, supabaseKey)
            const twoDaysAgo = new Date()
            twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

            const { data: predictions, error } = await supabase
                .from('predictions_raw')
                .select(`
                    id,
                    home_team_name,
                    away_team_name,
                    league_name,
                    prediction_type,
                    match_minute,
                    confidence,
                    result,
                    bot_groups ( name, display_name )
                `)
                .gte('received_at', twoDaysAgo.toISOString())

            if (error) {
                console.error('[GlobalLivescore] Supabase error:', error)
                return []
            }

            return (predictions || []).map(p => ({
                id: p.id,
                home_team_name: p.home_team_name,
                away_team_name: p.away_team_name,
                league_name: p.league_name,
                prediction_type: p.prediction_type,
                match_minute: p.match_minute,
                confidence: p.confidence,
                result: p.result || 'pending',
                bot_name: (p.bot_groups as any)?.display_name || (p.bot_groups as any)?.name || 'ALERT D'
            }))
        } catch (err) {
            console.error('[GlobalLivescore] DB fetch error:', err)
            return []
        }
    }

    /**
     * Find matching prediction for a fixture
     */
    public static findPredictionForFixture(
        fixture: APIFootballFixture,
        predictions: DBPrediction[]
    ): DBPrediction | null {
        const apiHomeRaw = fixture.teams.home.name
        const apiAwayRaw = fixture.teams.away.name
        const apiHome = normalizeTeamName(apiHomeRaw)
        const apiAway = normalizeTeamName(apiAwayRaw)

        const apiHomeWords = apiHome.split(' ').filter(w => w.length >= 4)
        const apiAwayWords = apiAway.split(' ').filter(w => w.length >= 4)

        const apiHomeSuffix = this.hasExclusionSuffix(apiHomeRaw)
        const apiAwaySuffix = this.hasExclusionSuffix(apiAwayRaw)
        const apiLeagueName = fixture.league.name
        const apiCountry = fixture.league.country || ''

        const nameCandidates: DBPrediction[] = []

        for (const pred of predictions) {
            const predHomeRaw = pred.home_team_name || ''
            const predAwayRaw = pred.away_team_name || ''
            const predHome = normalizeTeamName(predHomeRaw)
            const predAway = normalizeTeamName(predAwayRaw)

            if (predHome.length < 3 || predAway.length < 3) continue

            const predHomeWords = predHome.split(' ').filter(w => w.length >= 4)
            const predAwayWords = predAway.split(' ').filter(w => w.length >= 4)

            const homeMatch =
                (apiHomeWords.length > 0 && apiHomeWords.some(w => predHomeWords.includes(w))) ||
                (predHomeWords.length > 0 && predHomeWords.some(w => apiHomeWords.includes(w))) ||
                (apiHome.length >= 3 && predHome.length >= 3 && apiHome.includes(predHome)) ||
                (predHome.length >= 3 && apiHome.length >= 3 && predHome.includes(apiHome))

            const awayMatch =
                (apiAwayWords.length > 0 && apiAwayWords.some(w => predAwayWords.includes(w))) ||
                (predAwayWords.length > 0 && predAwayWords.some(w => apiAwayWords.includes(w))) ||
                (apiAway.length >= 3 && predAway.length >= 3 && apiAway.includes(predAway)) ||
                (predAway.length >= 3 && apiAway.length >= 3 && predAway.includes(apiAway))

            if (homeMatch && awayMatch) {
                nameCandidates.push(pred)
            }
        }

        if (nameCandidates.length === 0) return null

        const validCandidates = nameCandidates.filter(pred => {
            const predHomeRaw = pred.home_team_name || ''
            const predAwayRaw = pred.away_team_name || ''

            const predHomeSuffix = this.hasExclusionSuffix(predHomeRaw)
            const predAwaySuffix = this.hasExclusionSuffix(predAwayRaw)

            if (apiHomeSuffix !== predHomeSuffix) return false
            if (apiAwaySuffix !== predAwaySuffix) return false
            if (this.isLeagueMismatch(pred.league_name, apiLeagueName, apiCountry)) return false

            return true
        })

        if (validCandidates.length === 1) return validCandidates[0]
        return null
    }

    public static normalizeTeamName(name: string): string {
        return normalizeTeamName(name)
    }

    public static hasExclusionSuffix(name: string): string | null {
        if (name.includes('(w)') || name.includes(' women') || name.includes(' ladies')) return 'w'
        return null
    }

    public static isLeagueMismatch(predLeague: string | undefined, apiLeague: string, apiCountry: string): boolean {
        if (!predLeague) return false

        const pl = predLeague.toLowerCase()
        const al = apiLeague.toLowerCase()
        const ac = apiCountry.toLowerCase()

        if ((pl.includes('women') || pl.includes('(w)') || pl.includes('ladies')) &&
            !(al.includes('women') || al.includes('(w)') || al.includes('ladies'))) return true

        if ((pl.includes('u21') || pl.includes('youth') || pl.includes('reserve')) &&
            !(al.includes('u21') || al.includes('youth') || al.includes('reserve'))) return true

        if (pl.includes('scotland') && ac !== 'scotland') return true
        if (pl.includes('england') && ac !== 'england') return true
        if (pl.includes('germany') && ac !== 'germany') return true

        if (ac === 'greece' && pl.includes('greece')) return false

        return false
    }
}
