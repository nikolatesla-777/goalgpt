/**
 * Global Livescore Service
 * Fetches ALL matches worldwide and groups by Country > League
 * "Allah ne verdiyse" strategy - No filtering!
 * NOW WITH AI PREDICTION MERGE FROM SUPABASE
 */

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

// Normalize team name for matching
function normalizeTeamName(name: string): string {
    if (!name) return ''

    // Start with lowercase
    let normalized = name.toLowerCase()

    // Manual Fixes for Common Mismatches
    if (normalized.includes('panaitolikos')) return 'panetolikos'

    // German team name normalization (before stripping special chars)
    normalized = normalized.replace(/münchen|munchen|munich/g, 'munchen')
    normalized = normalized.replace(/mainz\s*05|fsv mainz/g, 'mainz')

    // Apply full normalization pipeline
    return normalized
        .replace(/\([^)]*\)/g, '') // Remove parentheses content
        .replace(/\b(fc|sk|fk|ik|fsv|vfb|vfl|sc|sv|rb|bsc|tsg|bv|tsv|ssc|united|city|town|sports|spor|calcio|ac|as|1899|1904|1909|1860)\b/g, '') // Remove common prefixes
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i')
        .replace(/[óòôõöø]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ä]/g, 'a')
        .replace(/[ñ]/g, 'n')
        .replace(/[çć]/g, 'c')
        .replace(/[ß]/g, 'ss')
        .replace(/[^a-z0-9]/g, '') // Remove ALL non-alphanumeric (including spaces)
        .trim()
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

export class GlobalLivescoreService {

    /**
     * Fetch predictions from Supabase predictions_raw table
     */
    private static async fetchPredictionsFromDB(): Promise<DBPrediction[]> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.log('[GlobalLivescore] Supabase not configured, skipping predictions')
            return []
        }

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
                    bot_groups (
                        name,
                        display_name
                    )
                `)
                .gte('received_at', twoDaysAgo.toISOString())

            if (error) {
                console.error('[GlobalLivescore] Supabase error:', error)
                return []
            }

            console.log(`[GlobalLivescore] Fetched ${predictions?.length || 0} predictions from DB`)

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
    /**
     * Public helper for team name normalization
     */
    public static normalizeTeamName(name: string): string {
        return normalizeTeamName(name)
    }

    /**
     * Helper to detect age/gender suffixes
     */
    public static hasExclusionSuffix(name: string): string | null {
        if (name.includes('(w)') || name.includes(' women') || name.includes(' ladies')) return 'w'
        return null
    }

    /**
     * Check if leagues are incompatible
     */
    public static isLeagueMismatch(predLeague: string | undefined, apiLeague: string, apiCountry: string): boolean {
        if (!predLeague) return false // No info, assume match

        const pl = predLeague.toLowerCase()
        const al = apiLeague.toLowerCase()
        const ac = apiCountry.toLowerCase()

        // 1. Gender/Age Mismatch in League Name
        if ((pl.includes('women') || pl.includes('(w)') || pl.includes('ladies')) &&
            !(al.includes('women') || al.includes('(w)') || al.includes('ladies'))) return true

        if ((pl.includes('u21') || pl.includes('youth') || pl.includes('reserve')) &&
            !(al.includes('u21') || al.includes('youth') || al.includes('reserve'))) return true

        // 2. Country Context Mismatch (Hard to do perfectly without country in pred, but try known keywords)
        // Example: If pred league says "Scotland" but api country is "Andorra"
        if (pl.includes('scotland') && ac !== 'scotland') return true
        if (pl.includes('england') && ac !== 'england') return true
        if (pl.includes('germany') && ac !== 'germany') return true

        // Greece Bypass: Allow "Super League" ambiguity if country is Greece
        if (ac === 'greece' && pl.includes('greece')) return false

        return false
    }

    // -------------------------------------------------------------------------
    // AUTO-SETTLEMENT ENGINE (HYBRID)
    // -------------------------------------------------------------------------

    /**
     * Process live settlements (Early Win Check)
     * This is called during the fetch cycle to settle bets instantly
     */
    private static async processLiveSettlements(fixtures: any[]) {
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

            if (!supabaseUrl || !supabaseServiceKey) {
                console.log('[GlobalLivescore] Supabase not configured for settlement, skipping.')
                return
            }

            // Filter only LIVE matches that have a PENDING prediction
            const candidates = fixtures.filter(f =>
                f.hasAIPrediction &&
                f.aiPredictionData &&
                f.aiPredictionData.result === 'pending' && // Only pending bets
                ['1H', 'HT', '2H', 'ET', 'P', 'FT', 'AET', 'PEN'].includes(f.fixture.status.short) // Live AND Finished matches
            )

            if (candidates.length === 0) return

            const updates = []

            for (const match of candidates) {
                const pred = match.aiPredictionData
                if (!pred) continue // Should not happen due to filter

                const homeGoals = match.goals.home ?? 0
                const awayGoals = match.goals.away ?? 0
                // Safe access to halftime score (might be null in some API responses)
                const htHome = match.score?.halftime?.home ?? 0
                const htAway = match.score?.halftime?.away ?? 0
                const status = match.fixture.status.short

                // Evaluate using the library
                const { result, log } = PredictionEvaluator.evaluate(
                    pred.prediction,
                    homeGoals,
                    awayGoals,
                    htHome,
                    htAway,
                    status
                )

                // If DECIDED (Won OR Lost), update DB immediately
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

            // Batch Update
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
     * MATCHING ALGORITHM V4 (SEQUENTIAL WATERFALL)
     * 1. Live Status Check (Gatekeeper)
     * 2. Broad Name Search (Candidate Collection)
     * 3. League & Context Filter (Validation)
     * 4. Final Decision (Uniqueness)
     */
    public static findPredictionForFixture(
        fixture: APIFootballFixture,
        predictions: DBPrediction[]
    ): DBPrediction | null {
        // STEP 1: CONTEXT VALIDATION
        // We match against any fixture provided (Live, NS, or FT)
        // No status filtering here required as we want to show icons for all matches.

        const apiHomeRaw = fixture.teams.home.name
        const apiAwayRaw = fixture.teams.away.name
        const apiHome = normalizeTeamName(apiHomeRaw)
        const apiAway = normalizeTeamName(apiAwayRaw)

        // Prepare API words once
        const apiHomeWords = apiHome.split(' ').filter(w => w.length >= 4)
        const apiAwayWords = apiAway.split(' ').filter(w => w.length >= 4)

        const apiHomeSuffix = this.hasExclusionSuffix(apiHomeRaw)
        const apiAwaySuffix = this.hasExclusionSuffix(apiAwayRaw)
        const apiLeagueName = fixture.league.name
        const apiCountry = fixture.league.country || ''

        // STEP 2: BROAD TEAM SEARCH (COLLECT CANDIDATES)
        const nameCandidates: DBPrediction[] = []

        for (const pred of predictions) {
            const predHomeRaw = pred.home_team_name || ''
            const predAwayRaw = pred.away_team_name || ''
            const predHome = normalizeTeamName(predHomeRaw)
            const predAway = normalizeTeamName(predAwayRaw)

            // CRITICAL FIX: Ignore short/empty names to prevent "includes('')" bug
            if (predHome.length < 3 || predAway.length < 3) continue

            const predHomeWords = predHome.split(' ').filter(w => w.length >= 4)
            const predAwayWords = predAway.split(' ').filter(w => w.length >= 4)

            // DUAL MATCH RULE: Both Home AND Away must match loosely
            // Fix: Check length before includes
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

        // PRE-OPTIMIZATION: If no name matches, return early
        if (nameCandidates.length === 0) return null

        // STEP 3: LEAGUE & CONTEXT FILTER (VALIDATION)
        const validCandidates = nameCandidates.filter(pred => {
            const predHomeRaw = pred.home_team_name || ''
            const predAwayRaw = pred.away_team_name || ''

            // 3.1 Suffix Guard
            const predHomeSuffix = this.hasExclusionSuffix(predHomeRaw)
            const predAwaySuffix = this.hasExclusionSuffix(predAwayRaw)

            if (apiHomeSuffix !== predHomeSuffix) return false
            if (apiAwaySuffix !== predAwaySuffix) return false

            // 3.2 League Context & Country Mismatch
            if (this.isLeagueMismatch(pred.league_name, apiLeagueName, apiCountry)) return false

            return true
        })

        // STEP 4: RESULT DECISION (UNIQUENESS)
        // Only return if exactly one candidate remains to ensure accuracy
        if (validCandidates.length === 1) {
            return validCandidates[0]
        }

        // If 0, no match.
        // If >1, ambiguous match (safety: return null to avoid wrong icon).
        return null
    }

    /**
     * Fetch ALL fixtures for today + live matches
     * Group by Country > League
     * Enrich with Momentum insights AND AI Predictions
     */
    static async fetchGlobalLivescore(includeFinished: boolean = true): Promise<LivescoreResponse> {
        console.log('[GlobalLivescore] Fetching all fixtures...')

        // STEP 1: Fetch fixtures for 3 days (Yesterday, Today, Tomorrow) + Live
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        const formatDate = (d: Date) => d.toISOString().split('T')[0]

        const [yesterdayFixtures, todayFixtures, tomorrowFixtures, liveFixtures] = await Promise.all([
            TheSportsAPI.getFixturesByDate(formatDate(yesterday)),
            TheSportsAPI.getFixturesByDate(formatDate(today)),
            TheSportsAPI.getFixturesByDate(formatDate(tomorrow)),
            TheSportsAPI.getLiveFixtures()
        ])

        // STEP 2: Fetch Supabase predictions
        const dbPredictions = await this.fetchPredictionsFromDB()

        // Merge and deduplicate fixtures
        const fixtureMap = new Map<number | string, APIFootballFixture>()
        yesterdayFixtures.forEach(f => fixtureMap.set(f.fixture.id, f))
        todayFixtures.forEach(f => fixtureMap.set(f.fixture.id, f))
        tomorrowFixtures.forEach(f => fixtureMap.set(f.fixture.id, f))
        liveFixtures.forEach(f => fixtureMap.set(f.fixture.id, f))

        let allFixtures = Array.from(fixtureMap.values())

        // Filter finished if requested
        if (!includeFinished) {
            allFixtures = allFixtures.filter(f => !isFixtureFinished(f.fixture.status.short))
        }

        console.log(`[GlobalLivescore] Total fixtures: ${allFixtures.length}`)

        // STEP 3: THE MERGE - Enrich fixtures with AI predictions
        let matchedCount = 0
        const enrichedFixtures = allFixtures.map(fixture => {
            const prediction = this.findPredictionForFixture(fixture, dbPredictions)

            if (prediction) {
                matchedCount++
                console.log(`[MERGE] Match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} | API_ID: ${fixture.fixture.id} | Found in DB: TRUE | has_ai_prediction: TRUE`)
            }

            return {
                ...fixture,
                hasAIPrediction: !!prediction,
                aiPredictionData: prediction ? {
                    id: prediction.id, // Important for updates
                    bot_name: prediction.bot_name || 'ALERT D',
                    prediction: prediction.prediction_type || 'N/A',
                    minute: prediction.match_minute ? parseInt(prediction.match_minute) : null,
                    confidence: prediction.confidence || 75,
                    result: prediction.result || 'pending',
                    home: prediction.home_team_name,
                    away: prediction.away_team_name
                } : null
            }
        })

        console.log(`[GlobalLivescore] Matched ${matchedCount} fixtures with AI predictions`)

        // AWAIT Settlement to ensure it runs in Serverless environment
        // Fire-and-forget is unreliable in Vercel/Next.js API routes
        try {
            await this.processLiveSettlements(enrichedFixtures)
        } catch (err) {
            console.error('Settlement error:', err)
        }

        // Enrich with momentum insights
        const withInsights = await this.enrichWithInsights(enrichedFixtures as any)

        // Group by Country > League
        const grouped = this.groupByCountryAndLeague(withInsights as any)

        const liveCount = allFixtures.filter(f => isFixtureLive(f.fixture.status.short)).length

        return {
            timestamp: new Date().toISOString(),
            liveCount,
            totalCount: allFixtures.length,
            countries: grouped
        }
    }

    /**
     * Enrich fixtures with Momentum Engine insights
     */
    private static async enrichWithInsights(
        fixtures: APIFootballFixture[]
    ): Promise<(APIFootballFixture & { insight: MomentumInsight })[]> {
        return fixtures.map(fixture => {
            let insight: MomentumInsight = { type: null, message: null, emoji: null, confidence: 0 }

            // Only analyze live matches with potential stats in events
            if (isFixtureLive(fixture.fixture.status.short)) {
                // For now, generate basic insight from score differential
                const homeScore = fixture.goals.home ?? 0
                const awayScore = fixture.goals.away ?? 0
                const minute = fixture.fixture.status.elapsed

                if (minute && minute >= 60 && homeScore === awayScore) {
                    insight = {
                        type: 'goal_expected',
                        message: 'Beraberlik Baskısı',
                        emoji: '⚡',
                        confidence: 60
                    }
                } else if (minute && minute >= 75 && Math.abs(homeScore - awayScore) === 1) {
                    insight = {
                        type: 'late_drama',
                        message: 'Gerilim Yüksek',
                        emoji: '🔥',
                        confidence: 70
                    }
                } else if (homeScore + awayScore >= 3 && minute && minute < 60) {
                    insight = {
                        type: 'goal_expected',
                        message: 'Gol Şov',
                        emoji: '🎯',
                        confidence: 75
                    }
                }
            }

            return { ...fixture, insight }
        })
    }

    /**
     * Group fixtures by Country > League
     */
    private static groupByCountryAndLeague(
        fixtures: (APIFootballFixture & { insight: MomentumInsight })[]
    ): CountryGroup[] {
        const countryMap = new Map<string, CountryGroup>()

        for (const fixture of fixtures) {
            const countryName = fixture.league.country
            const countryFlag = fixture.league.flag || '🌍'

            // Get or create country
            if (!countryMap.has(countryName)) {
                countryMap.set(countryName, {
                    name: countryName,
                    code: countryName.substring(0, 2).toUpperCase(),
                    flag: countryFlag,
                    leagues: []
                })
            }

            const country = countryMap.get(countryName)!

            // Find or create league
            let league = country.leagues.find(l => l.id === fixture.league.id)
            if (!league) {
                league = {
                    id: fixture.league.id,
                    name: fixture.league.name,
                    logo: fixture.league.logo,
                    round: fixture.league.round,
                    matches: []
                }
                country.leagues.push(league)
            }

            // Add match card
            league.matches.push(this.fixtureToMatchCard(fixture))
        }

        // Sort: Countries with live matches first, then alphabetically
        const countries = Array.from(countryMap.values())
        countries.sort((a, b) => {
            const aLiveCount = a.leagues.reduce((sum, l) => sum + l.matches.filter(m => m.isLive).length, 0)
            const bLiveCount = b.leagues.reduce((sum, l) => sum + l.matches.filter(m => m.isLive).length, 0)

            if (aLiveCount !== bLiveCount) return bLiveCount - aLiveCount
            return a.name.localeCompare(b.name)
        })

        // Sort matches within leagues by time
        for (const country of countries) {
            for (const league of country.leagues) {
                league.matches.sort((a, b) => a.timestamp - b.timestamp)
            }
        }

        return countries
    }

    /**
     * Convert fixture to MatchCard
     */
    private static fixtureToMatchCard(fixture: APIFootballFixture & { insight: MomentumInsight; hasAIPrediction?: boolean; aiPredictionData?: AIPredictionData | null }): MatchCard {
        const status = fixture.fixture.status.short

        return {
            id: String(fixture.fixture.id),
            status,
            statusLabel: getStatusLabel(status),
            minute: fixture.fixture.status.elapsed,
            startTime: new Date(fixture.fixture.date).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: fixture.fixture.timestamp,
            home: {
                id: fixture.teams.home.id,
                name: fixture.teams.home.name,
                logo: fixture.teams.home.logo,
                score: fixture.goals.home ?? 0
            },
            away: {
                id: fixture.teams.away.id,
                name: fixture.teams.away.name,
                logo: fixture.teams.away.logo,
                score: fixture.goals.away ?? 0
            },
            insight: fixture.insight.type ? fixture.insight : null,
            isLive: isFixtureLive(status),
            hasAIPrediction: fixture.hasAIPrediction || false,
            aiPredictionData: fixture.aiPredictionData || null
        }
    }
}
