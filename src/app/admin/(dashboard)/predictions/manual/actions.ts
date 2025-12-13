'use server'

import { TheSportsApi } from '@/lib/thesports-api'
import type { FixtureDto as TheSportsMatch } from '@/lib/thesports-api'

// Re-export types for client components
export type { TheSportsMatch }

// Sample data for development/demo (used when API is not available)
const sampleLiveMatches: TheSportsMatch[] = [
    {
        id: 'm1',
        home_team_id: 'h1',
        away_team_id: 'a1',
        home: { name: 'Persekama Kab Madiun', logo: '' },
        away: { name: 'PS Mojokerto Putra', logo: '' },
        scores: { home: 0, away: 3 },
        status: { id: 8, name: 'Finished' },
        minute: 90,
        time: Math.floor(Date.now() / 1000),
        competition: { id: 'c1', name: 'Indonesia Liga 3' },
        country: { id: 'ID', name: 'Indonesia' },
    },
    {
        id: 'm2',
        home_team_id: 'h2',
        away_team_id: 'a2',
        home: { name: 'Barcelona', logo: '' },
        away: { name: 'Real Madrid', logo: '' },
        scores: { home: 2, away: 1 },
        status: { id: 2, name: '1H' },
        minute: 67,
        time: Math.floor(Date.now() / 1000),
        competition: { id: 'c2', name: 'La Liga' },
        country: { id: 'ES', name: 'Spain' },
    },
    {
        id: 'm3',
        home_team_id: 'h3',
        away_team_id: 'a3',
        home: { name: 'Bayern Munich', logo: '' },
        away: { name: 'Dortmund', logo: '' },
        scores: { home: 1, away: 1 },
        status: { id: 3, name: 'HT' },
        minute: 45,
        time: Math.floor(Date.now() / 1000),
        competition: { id: 'c3', name: 'Bundesliga' },
        country: { id: 'DE', name: 'Germany' },
    }
]

/**
 * Fetch live matches from TheSports API
 * Falls back to sample data if API is not configured
 */
export async function fetchLiveMatches(): Promise<TheSportsMatch[]> {
    // Check if API is configured
    const apiUser = process.env.THESPORTS_API_USER
    const apiSecret = process.env.THESPORTS_API_SECRET

    console.log('[DEBUG] Fetching Live Matches...')
    console.log('[DEBUG] Env Vars -> User:', apiUser ? '***' : 'MISSING', 'Secret:', apiSecret ? '***' : 'MISSING')

    if (!apiSecret || !apiUser) {
        console.warn('[DEBUG] TheSports API credentials missing, using sample data')
        return sampleLiveMatches
    }

    try {
        // Fetch ALL matches for today, not just live ones
        // This ensures the table is populated even if no matches are currently live
        const matches = await TheSportsApi.getFixturesByDate() // defaults to today

        console.log('[DEBUG] API Response Count:', matches.length)

        if (matches.length === 0) {
            console.warn('[DEBUG] API returned 0 matches for TODAY.')
            // If genuinely 0 matches for the whole day, maybe fallback to sample? 
            // Or just show empty. Let's return empty to be honest.
            return matches
        }
        return matches
    } catch (error) {
        console.error('[DEBUG] Error fetching matches:', error)
        return sampleLiveMatches
    }
}

/**
 * Map TheSportsMatch to simpler format for manual prediction page
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

    return matches.map(m => {
        try {
            const rawTime = m.time || Math.floor(Date.now() / 1000)
            const startTime = new Date(rawTime * 1000).toLocaleString('tr-TR')

            return {
                id: m.id || `unknown-${Math.random()}`,
                homeTeam: m.home?.name || 'Unknown',
                awayTeam: m.away?.name || 'Unknown',
                homeLogo: m.home?.logo || '',
                awayLogo: m.away?.logo || '',
                homeScore: m.scores?.home || 0,
                awayScore: m.scores?.away || 0,
                minute: m.minute || 0,
                status: mapStatus(m.status),
                league: m.competition?.name || 'Unknown',
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

function mapStatus(status: { id: number, name: string }): 'live' | 'ht' | 'ft' | 'ns' {
    const id = status?.id
    // Common statuses: 1=Not Started, 8=Finished, 2-7=Live, 3=HT
    if (id === 1 || id === 0) return 'ns'
    if (id === 8 || id === 10 || id === 11 || id === 9) return 'ft' // 9 = Postponed usually? Let's verify. For now treat as finished/inactive.
    if (id === 3) return 'ht'
    if ([2, 4, 5, 6, 7].includes(id)) return 'live'
    return 'ns' // Default to Not Started instead of Finished to be safe? Or 'ns' to avoid confusion.
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
