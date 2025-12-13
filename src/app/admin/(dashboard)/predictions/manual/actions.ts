'use server'

import { TheSportsApi } from '@/lib/thesports-api'
import type { FixtureDto as TheSportsMatch } from '@/lib/thesports-api'

// Re-export types for client components
export type { TheSportsMatch }

// Sample data for development/demo (used when API is not available)
const sampleLiveMatches: TheSportsMatch[] = [
    {
        id: 'm1',
        homeTeamId: 'h1',
        awayTeamId: 'a1',
        homeTeamName: 'Persekama Kab Madiun 0',
        awayTeamName: 'PS Mojokerto Putra',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 0,
        awayScore: 3,
        status: 'finished',
        minute: 90,
        startTime: Date.now() / 1000,
        competitionId: 'c1',
        competitionName: 'Indonesia Liga 3',
        competitionLogo: '',
        countryId: 'ID',
        countryName: 'Indonesia',
        countryFlag: '🇮🇩',
    },
    {
        id: 'm2',
        homeTeamId: 'h2',
        awayTeamId: 'a2',
        homeTeamName: 'Barcelona',
        awayTeamName: 'Real Madrid',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 2,
        awayScore: 1,
        status: 'live',
        minute: 67,
        startTime: Date.now() / 1000,
        competitionId: 'c2',
        competitionName: 'La Liga',
        competitionLogo: '',
        countryId: 'ES',
        countryName: 'Spain',
        countryFlag: '🇪🇸',
    },
    {
        id: 'm3',
        homeTeamId: 'h3',
        awayTeamId: 'a3',
        homeTeamName: 'Bayern Munich',
        awayTeamName: 'Dortmund',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 1,
        awayScore: 1,
        status: 'ht',
        minute: 45,
        startTime: Date.now() / 1000,
        competitionId: 'c3',
        competitionName: 'Bundesliga',
        competitionLogo: '',
        countryId: 'DE',
        countryName: 'Germany',
        countryFlag: '🇩🇪',
    },
    {
        id: 'm4',
        homeTeamId: 'h4',
        awayTeamId: 'a4',
        homeTeamName: 'Galatasaray',
        awayTeamName: 'Fenerbahçe',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 1,
        awayScore: 0,
        status: 'live',
        minute: 35,
        startTime: Date.now() / 1000,
        competitionId: 'c4',
        competitionName: 'Süper Lig',
        competitionLogo: '',
        countryId: 'TR',
        countryName: 'Turkey',
        countryFlag: '🇹🇷',
    },
    {
        id: 'm5',
        homeTeamId: 'h5',
        awayTeamId: 'a5',
        homeTeamName: 'Manchester United',
        awayTeamName: 'Liverpool',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 0,
        awayScore: 2,
        status: 'live',
        minute: 78,
        startTime: Date.now() / 1000,
        competitionId: 'c5',
        competitionName: 'Premier League',
        competitionLogo: '',
        countryId: 'GB',
        countryName: 'England',
        countryFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    },
    {
        id: 'm6',
        homeTeamId: 'h6',
        awayTeamId: 'a6',
        homeTeamName: 'AC Milan',
        awayTeamName: 'Inter',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 0,
        awayScore: 0,
        status: 'live',
        minute: 15,
        startTime: Date.now() / 1000,
        competitionId: 'c6',
        competitionName: 'Serie A',
        competitionLogo: '',
        countryId: 'IT',
        countryName: 'Italy',
        countryFlag: '🇮🇹',
    },
    {
        id: 'm7',
        homeTeamId: 'h7',
        awayTeamId: 'a7',
        homeTeamName: 'PSG',
        awayTeamName: 'Lyon',
        homeTeamLogo: '',
        awayTeamLogo: '',
        homeScore: 3,
        awayScore: 1,
        status: 'finished',
        minute: 90,
        startTime: Date.now() / 1000,
        competitionId: 'c7',
        competitionName: 'Ligue 1',
        competitionLogo: '',
        countryId: 'FR',
        countryName: 'France',
        countryFlag: '🇫🇷',
    },
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
        homeTeam: m.homeTeamName,
        awayTeam: m.awayTeamName,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        minute: m.minute,
        status: mapStatus(m.status),
        league: m.competitionName,
        leagueFlag: m.countryFlag,
        startTime: new Date(m.startTime * 1000).toLocaleString('tr-TR'),
    }))
}

function mapStatus(status: TheSportsMatch['status']): 'live' | 'ht' | 'ft' {
    switch (status) {
        case 'live': return 'live'
        case 'ht': return 'ht'
        case 'finished': return 'ft'
        default: return 'ft'
    }
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
