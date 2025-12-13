'use server'

import { TheSportsApi } from '@/lib/thesports-api'
import type { FixtureDto as TheSportsMatch } from '@/lib/thesports-api'

// Re-export types for client components
export type { TheSportsMatch }

// Sample data generator for development/demo
function getMockMatches(): TheSportsMatch[] {
    const now = Math.floor(Date.now() / 1000)
    return [
        // Live - Super Lig
        {
            id: 'm1', home_team_id: 'h1', away_team_id: 'a1',
            home: { name: 'Galatasaray', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Galatasaray_Sports_Club_Logo.png' },
            away: { name: 'Fenerbahçe', logo: 'https://upload.wikimedia.org/wikipedia/tr/8/86/Fenerbah%C3%A7e_SK.png' },
            scores: { home: 1, away: 1 }, status: { id: 2, name: '1H' }, minute: 34,
            time: now, competition: { id: 'c1', name: 'Süper Lig' }, country: { id: 'TR', name: 'Türkiye' }
        },
        // Live - Premier League
        {
            id: 'm2', home_team_id: 'h2', away_team_id: 'a2',
            home: { name: 'Liverpool', logo: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' },
            away: { name: 'Arsenal', logo: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg' },
            scores: { home: 2, away: 0 }, status: { id: 4, name: '2H' }, minute: 78,
            time: now, competition: { id: 'c2', name: 'Premier League' }, country: { id: 'EN', name: 'England' }
        },
        // Upcoming - La Liga
        {
            id: 'm3', home_team_id: 'h3', away_team_id: 'a3',
            home: { name: 'Real Madrid', logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg' },
            away: { name: 'Barcelona', logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg' },
            scores: { home: 0, away: 0 }, status: { id: 1, name: 'NS' }, minute: 0,
            time: now + 3600, competition: { id: 'c3', name: 'La Liga' }, country: { id: 'ES', name: 'Spain' }
        },
        // Finished - Serie A
        {
            id: 'm4', home_team_id: 'h4', away_team_id: 'a4',
            home: { name: 'Juventus', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg' },
            away: { name: 'AC Milan', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg' },
            scores: { home: 1, away: 2 }, status: { id: 8, name: 'FT' }, minute: 90,
            time: now - 7200, competition: { id: 'c4', name: 'Serie A' }, country: { id: 'IT', name: 'Italy' }
        },
        // More Super Lig
        {
            id: 'm5', home_team_id: 'h5', away_team_id: 'a5',
            home: { name: 'Beşiktaş', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Logo_of_Be%C5%9Fikta%C5%9F_JK.svg' },
            away: { name: 'Trabzonspor', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Trabzonspor_Amblem.svg' },
            scores: { home: 0, away: 0 }, status: { id: 1, name: 'NS' }, minute: 0,
            time: now + 7200, competition: { id: 'c1', name: 'Süper Lig' }, country: { id: 'TR', name: 'Türkiye' }
        }
    ]
}

/**
 * Fetch matches from TheSports API
 * Now fetches ALL today's matches (scheduled + live + finished)
 */
export async function fetchLiveMatches(): Promise<TheSportsMatch[]> {
    const apiUser = process.env.THESPORTS_API_USER
    const apiSecret = process.env.THESPORTS_API_SECRET

    console.log('[TheSports] Fetching fixtures...')
    console.log('[TheSports] API Credentials:', apiUser ? 'User OK' : 'USER MISSING', apiSecret ? 'Secret OK' : 'SECRET MISSING')

    if (!apiSecret || !apiUser) {
        console.error('[TheSports] ❌ API credentials missing! Add THESPORTS_API_USER and THESPORTS_API_SECRET to env.')
        return getMockMatches() // Only fallback if NO credentials at all
    }

    try {
        const matches = await TheSportsApi.getFixturesByDate()
        console.log('[TheSports] ✅ API Response:', matches.length, 'matches found')

        // If API returns matches, use them
        if (matches.length > 0) {
            return matches
        }

        // If 0 matches, log warning and return empty (not mock)
        console.warn('[TheSports] ⚠️ API returned 0 matches for today')
        return []

    } catch (error: any) {
        console.error('[TheSports] ❌ API Error:', error?.message || error)
        return [] // Return empty on error, let UI show "No matches"
    }
}

/**
 * Map TheSportsMatch to simpler format for manual prediction page
 * Note: /diary endpoint returns team IDs, not names. Team names need separate lookup.
 */
export interface SimplifiedMatch {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo: string
    awayLogo: string
    homeScore: number
    awayScore: number
    minute: number
    status: 'live' | 'ht' | 'ft' | 'ns'
    league: string
    leagueFlag: string
    startTime: string
    rawTime: number
}

export async function fetchLiveMatchesSimplified(): Promise<SimplifiedMatch[]> {
    const matches = await fetchLiveMatches()

    if (matches.length === 0) {
        console.log('[Mapping] No matches to process')
        return []
    }

    console.log('[Mapping] Processing', matches.length, 'matches from API')

    // 1. Collect all unique team IDs and competition IDs
    const teamIds = new Set<string>()
    const competitionIds = new Set<string>()

    matches.forEach((m: any) => {
        if (m.home_team_id) teamIds.add(m.home_team_id)
        if (m.away_team_id) teamIds.add(m.away_team_id)
        if (m.competition_id) competitionIds.add(m.competition_id)
    })

    console.log('[Mapping] Fetching', teamIds.size, 'teams and', competitionIds.size, 'competitions')

    // 2. Batch fetch team and competition data from Supabase
    const teamMap = new Map<string, { name: string, logo: string }>()
    const competitionMap = new Map<string, { name: string, country_id: string }>()

    try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Fetch teams in batches of 500
        const teamIdArray = Array.from(teamIds)
        const batchSize = 500

        for (let i = 0; i < teamIdArray.length; i += batchSize) {
            const batch = teamIdArray.slice(i, i + batchSize)
            const { data: teams, error } = await supabase
                .from('teams')
                .select('external_id, name, logo')
                .in('external_id', batch)

            if (!error && teams) {
                teams.forEach(t => {
                    teamMap.set(t.external_id, { name: t.name, logo: t.logo || '' })
                })
            }
        }

        // Fetch competitions
        const compIdArray = Array.from(competitionIds)
        for (let i = 0; i < compIdArray.length; i += batchSize) {
            const batch = compIdArray.slice(i, i + batchSize)
            const { data: comps, error } = await supabase
                .from('ts_competitions')
                .select('external_id, name, country_id')
                .in('external_id', batch)

            if (!error && comps) {
                comps.forEach(c => {
                    competitionMap.set(c.external_id, { name: c.name, country_id: c.country_id || '' })
                })
            }
        }

        console.log('[Mapping] Retrieved', teamMap.size, 'teams and', competitionMap.size, 'competitions')
    } catch (e) {
        console.error('[Mapping] Failed to fetch from DB:', e)
    }

    // 3. Map matches with team and competition names
    return matches.map((m: any) => {
        try {
            const rawTime = m.match_time || m.time || Math.floor(Date.now() / 1000)
            const startTime = new Date(rawTime * 1000).toLocaleString('tr-TR')
            const statusId = m.status_id ?? m.status?.id ?? 1
            const homeScore = Array.isArray(m.home_scores) ? m.home_scores[0] : (m.scores?.home || 0)
            const awayScore = Array.isArray(m.away_scores) ? m.away_scores[0] : (m.scores?.away || 0)

            // Get team info from our cache map
            const homeTeamInfo = teamMap.get(m.home_team_id)
            const awayTeamInfo = teamMap.get(m.away_team_id)
            const competitionInfo = competitionMap.get(m.competition_id)

            return {
                id: m.id || `unknown-${Math.random()}`,
                homeTeam: homeTeamInfo?.name || m.home?.name || m.home_team_id?.substring(0, 10) || 'Home',
                awayTeam: awayTeamInfo?.name || m.away?.name || m.away_team_id?.substring(0, 10) || 'Away',
                homeLogo: homeTeamInfo?.logo || m.home?.logo || '',
                awayLogo: awayTeamInfo?.logo || m.away?.logo || '',
                homeScore,
                awayScore,
                minute: m.minute || 0,
                status: mapStatusById(statusId),
                league: competitionInfo?.name || m.competition?.name || m.competition_id?.substring(0, 10) || 'League',
                leagueFlag: m.country?.name || '',
                startTime,
                rawTime,
            }
        } catch (e) {
            console.error('Error mapping match:', m.id, e)
            return null
        }
    }).filter(Boolean) as SimplifiedMatch[]
}

function mapStatusById(statusId: number): 'live' | 'ht' | 'ft' | 'ns' {
    // TheSports status IDs:
    // 1=Not Started, 2=First Half, 3=Half Time, 4=Second Half, 5=Extra Time
    // 6=Penalties, 7=Break, 8=Finished, 9=Postponed, 10=Cancelled, etc.
    if (statusId === 1 || statusId === 0) return 'ns'
    if (statusId === 8 || statusId === 10 || statusId === 11 || statusId === 9) return 'ft'
    if (statusId === 3) return 'ht'
    if ([2, 4, 5, 6, 7].includes(statusId)) return 'live'
    return 'ns'
}

// ============================================================================
// MANUAL PREDICTION ACTIONS
// ============================================================================

export interface ManualPrediction {
    id: string
    home_team_name: string
    away_team_name: string
    competition_name: string
    match_date: string
    prediction_type: string
    prediction_odds: number
    status: 'draft' | 'published' | 'finished'
    result?: 'pending' | 'won' | 'lost' | 'void'
    confidence: number
    analysis: string
    is_vip: boolean
}

export async function publishManualPrediction(id: string) {
    // In a real app, this would update Supabase
    console.log('[Mock Action] Publishing prediction:', id)
    return { success: true }
}

export async function updateManualResult(id: string, result: 'won' | 'lost' | 'void') {
    // In a real app, this would update Supabase
    console.log('[Mock Action] Updating result:', id, result)
    return { success: true }
}

export async function deleteManualPrediction(id: string) {
    // In a real app, this would delete from Supabase
    console.log('[Mock Action] Deleting prediction:', id)
    return { success: true }
}
