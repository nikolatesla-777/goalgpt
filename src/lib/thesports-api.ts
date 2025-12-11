/**
 * TheSports API Service
 * 
 * This module provides integration with TheSports.com API for fetching
 * live football match data. Used by manual prediction creator and AI bot system.
 * 
 * API Documentation: https://api.thesports.com/v1/football
 * 
 * Note: API credentials are stored in environment variables:
 * - THESPORTS_API_URL
 * - THESPORTS_API_USER
 * - THESPORTS_API_SECRET
 */

// Types matching TheSports API response structure
export interface TheSportsMatch {
    id: string                    // TheSports match ID
    homeTeamId: string
    awayTeamId: string
    homeTeamName: string
    awayTeamName: string
    homeTeamLogo: string
    awayTeamLogo: string
    homeScore: number
    awayScore: number
    status: 'scheduled' | 'live' | 'ht' | 'finished' | 'postponed'
    minute: number
    startTime: number             // Unix timestamp
    competitionId: string
    competitionName: string
    competitionLogo: string
    countryId: string
    countryName: string
    countryFlag: string
}

export interface TheSportsTeam {
    id: string
    name: string
    shortName: string
    logo: string
    countryId: string
}

export interface TheSportsCompetition {
    id: string
    name: string
    shortName: string
    logo: string
    countryId: string
    countryName: string
    countryFlag: string
}

// API Response types
interface ApiResponse<T> {
    code: number
    message: string
    data: T
}

// Environment variables (to be set in .env.local)
const API_BASE_URL = process.env.THESPORTS_API_URL || 'https://api.thesports.com/v1/football'
const API_USER = process.env.THESPORTS_API_USER || 'goalgpt'
const API_SECRET = process.env.THESPORTS_API_SECRET || ''

/**
 * Make authenticated request to TheSports API
 */
async function apiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`)

    // Add auth params
    url.searchParams.set('user', API_USER)
    url.searchParams.set('secret', API_SECRET)

    // Add additional params
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        next: { revalidate: 30 } // Cache for 30 seconds
    })

    if (!response.ok) {
        throw new Error(`TheSports API error: ${response.status}`)
    }

    const data: ApiResponse<T> = await response.json()

    if (data.code !== 0) {
        throw new Error(`TheSports API error: ${data.message}`)
    }

    return data.data
}

/**
 * Get all live matches (currently in-play)
 */
export async function getLiveMatches(): Promise<TheSportsMatch[]> {
    try {
        const data = await apiRequest<any[]>('/match/live')

        // Transform API response to our format
        return data.map(match => ({
            id: match.id,
            homeTeamId: match.home_team_id,
            awayTeamId: match.away_team_id,
            homeTeamName: match.home_team?.name || 'Unknown',
            awayTeamName: match.away_team?.name || 'Unknown',
            homeTeamLogo: match.home_team?.logo || '',
            awayTeamLogo: match.away_team?.logo || '',
            homeScore: match.home_score || 0,
            awayScore: match.away_score || 0,
            status: mapMatchStatus(match.status_id),
            minute: match.match_time || 0,
            startTime: match.match_time_utc || 0,
            competitionId: match.competition_id,
            competitionName: match.competition?.name || 'Unknown League',
            competitionLogo: match.competition?.logo || '',
            countryId: match.competition?.country_id || '',
            countryName: match.competition?.country?.name || 'Unknown',
            countryFlag: getCountryFlag(match.competition?.country_id || ''),
        }))
    } catch (error) {
        console.error('Error fetching live matches:', error)
        return []
    }
}

/**
 * Get matches for a specific date
 */
export async function getMatchesByDate(date: Date): Promise<TheSportsMatch[]> {
    try {
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
        const data = await apiRequest<any[]>('/match/diary', { date: dateStr })

        return data.map(match => ({
            id: match.id,
            homeTeamId: match.home_team_id,
            awayTeamId: match.away_team_id,
            homeTeamName: match.home_team?.name || 'Unknown',
            awayTeamName: match.away_team?.name || 'Unknown',
            homeTeamLogo: match.home_team?.logo || '',
            awayTeamLogo: match.away_team?.logo || '',
            homeScore: match.home_score || 0,
            awayScore: match.away_score || 0,
            status: mapMatchStatus(match.status_id),
            minute: match.match_time || 0,
            startTime: match.match_time_utc || 0,
            competitionId: match.competition_id,
            competitionName: match.competition?.name || 'Unknown League',
            competitionLogo: match.competition?.logo || '',
            countryId: match.competition?.country_id || '',
            countryName: match.competition?.country?.name || 'Unknown',
            countryFlag: getCountryFlag(match.competition?.country_id || ''),
        }))
    } catch (error) {
        console.error('Error fetching matches by date:', error)
        return []
    }
}

/**
 * Get match details by ID
 */
export async function getMatchById(matchId: string): Promise<TheSportsMatch | null> {
    try {
        const data = await apiRequest<any>('/match/detail', { id: matchId })

        return {
            id: data.id,
            homeTeamId: data.home_team_id,
            awayTeamId: data.away_team_id,
            homeTeamName: data.home_team?.name || 'Unknown',
            awayTeamName: data.away_team?.name || 'Unknown',
            homeTeamLogo: data.home_team?.logo || '',
            awayTeamLogo: data.away_team?.logo || '',
            homeScore: data.home_score || 0,
            awayScore: data.away_score || 0,
            status: mapMatchStatus(data.status_id),
            minute: data.match_time || 0,
            startTime: data.match_time_utc || 0,
            competitionId: data.competition_id,
            competitionName: data.competition?.name || 'Unknown League',
            competitionLogo: data.competition?.logo || '',
            countryId: data.competition?.country_id || '',
            countryName: data.competition?.country?.name || 'Unknown',
            countryFlag: getCountryFlag(data.competition?.country_id || ''),
        }
    } catch (error) {
        console.error('Error fetching match by ID:', error)
        return null
    }
}

/**
 * Search matches by team name
 */
export async function searchMatches(query: string): Promise<TheSportsMatch[]> {
    try {
        const data = await apiRequest<any[]>('/match/search', { keyword: query })

        return data.map(match => ({
            id: match.id,
            homeTeamId: match.home_team_id,
            awayTeamId: match.away_team_id,
            homeTeamName: match.home_team?.name || 'Unknown',
            awayTeamName: match.away_team?.name || 'Unknown',
            homeTeamLogo: match.home_team?.logo || '',
            awayTeamLogo: match.away_team?.logo || '',
            homeScore: match.home_score || 0,
            awayScore: match.away_score || 0,
            status: mapMatchStatus(match.status_id),
            minute: match.match_time || 0,
            startTime: match.match_time_utc || 0,
            competitionId: match.competition_id,
            competitionName: match.competition?.name || 'Unknown League',
            competitionLogo: match.competition?.logo || '',
            countryId: match.competition?.country_id || '',
            countryName: match.competition?.country?.name || 'Unknown',
            countryFlag: getCountryFlag(match.competition?.country_id || ''),
        }))
    } catch (error) {
        console.error('Error searching matches:', error)
        return []
    }
}

// Helper: Map TheSports status_id to our status type
function mapMatchStatus(statusId: number): TheSportsMatch['status'] {
    // TheSports status_id mapping:
    // 1 = Not started, 2 = Live, 3 = HT, 4 = Finished, 5 = Postponed, etc.
    switch (statusId) {
        case 1:
            return 'scheduled'
        case 2:
            return 'live'
        case 3:
            return 'ht'
        case 4:
            return 'finished'
        case 5:
            return 'postponed'
        default:
            return 'scheduled'
    }
}

// Helper: Get country flag emoji from country ID
function getCountryFlag(countryId: string): string {
    // Common country ID to flag mappings
    const flagMap: Record<string, string> = {
        'TR': '🇹🇷',
        'GB': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        'ES': '🇪🇸',
        'DE': '🇩🇪',
        'IT': '🇮🇹',
        'FR': '🇫🇷',
        'PT': '🇵🇹',
        'NL': '🇳🇱',
        'BE': '🇧🇪',
        'BR': '🇧🇷',
        'AR': '🇦🇷',
        'US': '🇺🇸',
        'EU': '🇪🇺',
        'ID': '🇮🇩',
        'JP': '🇯🇵',
        'KR': '🇰🇷',
        'CN': '🇨🇳',
        'SA': '🇸🇦',
        'RU': '🇷🇺',
        'UA': '🇺🇦',
        'PL': '🇵🇱',
        'GR': '🇬🇷',
        'SE': '🇸🇪',
        'NO': '🇳🇴',
        'DK': '🇩🇰',
        'AT': '🇦🇹',
        'CH': '🇨🇭',
        'CZ': '🇨🇿',
        'MX': '🇲🇽',
        'AU': '🇦🇺',
        // Add more as needed
    }

    return flagMap[countryId] || '🏳️'
}
