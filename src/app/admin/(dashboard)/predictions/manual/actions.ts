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
    const apiSecret = process.env.THESPORTS_API_SECRET

    if (!apiSecret) {
        console.log('TheSports API not configured, using sample data')
        return sampleLiveMatches
    }

    try {
        const matches = await TheSportsApi.getLiveMatches()
        return matches.length > 0 ? matches : sampleLiveMatches
    } catch (error) {
        console.error('Error fetching live matches:', error)
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
    homeScore: number
    awayScore: number
    minute: number
    status: 'live' | 'ht' | 'ft'
    league: string
    leagueFlag: string
    startTime: string
}

export async function fetchLiveMatchesSimplified(): Promise<SimplifiedMatch[]> {
    const matches = await fetchLiveMatches()

    return matches.map(m => ({
        id: m.id,
        homeTeam: m.home?.name || 'Unknown',
        awayTeam: m.away?.name || 'Unknown',
        homeScore: m.scores?.home || 0,
        awayScore: m.scores?.away || 0,
        minute: m.minute,
        status: mapStatus(m.status),
        league: m.competition?.name || 'Unknown',
        leagueFlag: m.country?.name || '',
        startTime: new Date(m.time * 1000).toLocaleString('tr-TR'),
    }))
}

function mapStatus(status: { id: number, name: string }): 'live' | 'ht' | 'ft' {
    const id = status?.id
    if (id === 8 || id === 10 || id === 11) return 'ft'
    if (id === 3) return 'ht'
    if ([2, 4, 5].includes(id)) return 'live'
    return 'ft'
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
