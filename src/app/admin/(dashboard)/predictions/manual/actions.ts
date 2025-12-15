'use server'

import { APIFootball, APIFootballFixture, APIFootballEvent, formatTeamLogo, formatLeagueLogo, getStatusLabel, isFixtureLive, isFixtureFinished } from '@/lib/api-football'

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

export interface MatchDetailData {
    id: string
    homeTeam: { name: string, logo: string, id: string }
    awayTeam: { name: string, logo: string, id: string }
    league: { name: string, country: string, flag: string, logo: string }
    score: { home: number, away: number }
    status: { short: string, long: string, elapsed: number | null }
    startTime: string
    venue?: string
    referee?: string
    stats: { label: string, home: number | string, away: number | string, color: string }[]
    events: { time: string, type: string, team: 'home' | 'away', player?: string, detail?: string }[]
}

export interface SimplifiedMatch {
    id: string
    homeTeam: string
    awayTeam: string
    homeLogo: string
    awayLogo: string
    homeScore: number
    awayScore: number
    minute: number | string
    status: 'live' | 'ht' | 'ft' | 'ns'
    league: string
    country: string
    leagueFlag: string
    leagueLogo: string
    startTime: string
    rawTime: number
    hasAIPrediction?: boolean
}

// ----------------------------------------------------------------------
// Match Fetching
// ----------------------------------------------------------------------

/**
 * Fetch match detail by ID
 */
export async function fetchMatchDetail(matchId: string): Promise<MatchDetailData | null> {
    try {
        // Handle mock IDs
        if (matchId.startsWith('m') && matchId.length < 5) {
            return getMockMatchDetail(matchId)
        }

        const fixture = await APIFootball.getFixtureById(Number(matchId))

        if (!fixture) {
            console.error(`[FetchMatchDetail] Fixture ${matchId} not found`)
            return null
        }

        // Get statistics
        const stats = await APIFootball.getFixtureStatistics(Number(matchId))

        return transformFixtureToDetail(fixture, stats)

    } catch (error) {
        console.error('[FetchMatchDetail] Error:', error)
        return null
    }
}

/**
 * Fetch live matches
 */
export async function fetchLiveMatches(): Promise<SimplifiedMatch[]> {
    try {
        const fixtures = await APIFootball.getLiveFixtures()
        return fixtures.map(transformFixtureToSimplified)
    } catch (error) {
        console.error('[FetchLiveMatches] Error:', error)
        return []
    }
}

/**
 * Fetch today's fixtures
 */
export async function fetchTodayFixtures(): Promise<SimplifiedMatch[]> {
    try {
        const fixtures = await APIFootball.getFixturesByDate()
        return fixtures.map(transformFixtureToSimplified)
    } catch (error) {
        console.error('[FetchTodayFixtures] Error:', error)
        return []
    }
}

/**
 * Fetch simplified matches for match picker
 */
export async function fetchLiveMatchesSimplified(): Promise<SimplifiedMatch[]> {
    // Get both live and today's fixtures
    const [live, today] = await Promise.all([
        fetchLiveMatches(),
        fetchTodayFixtures()
    ])

    // Merge and deduplicate
    const merged = new Map<string, SimplifiedMatch>()
    live.forEach(m => merged.set(m.id, m))
    today.forEach(m => {
        if (!merged.has(m.id)) merged.set(m.id, m)
    })

    // Sort by status (live first) then by time
    return Array.from(merged.values()).sort((a, b) => {
        const statusOrder = { live: 0, ht: 1, ns: 2, ft: 3 }
        const statusDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4)
        if (statusDiff !== 0) return statusDiff
        return a.rawTime - b.rawTime
    })
}

/**
 * Search teams
 */
export async function searchTeams(query: string) {
    if (!query || query.length < 3) return []
    const results = await APIFootball.searchTeams(query)
    return results.map(r => ({
        id: r.team.id,
        name: r.team.name,
        logo: r.team.logo,
        country: r.team.country
    }))
}

// ----------------------------------------------------------------------
// Transform Helpers
// ----------------------------------------------------------------------

function transformFixtureToSimplified(fixture: APIFootballFixture): SimplifiedMatch {
    const status = fixture.fixture.status.short
    let mappedStatus: 'live' | 'ht' | 'ft' | 'ns' = 'ns'

    if (isFixtureLive(status)) {
        mappedStatus = status === 'HT' ? 'ht' : 'live'
    } else if (isFixtureFinished(status)) {
        mappedStatus = 'ft'
    }

    return {
        id: String(fixture.fixture.id),
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeLogo: fixture.teams.home.logo,
        awayLogo: fixture.teams.away.logo,
        homeScore: fixture.goals.home ?? 0,
        awayScore: fixture.goals.away ?? 0,
        minute: fixture.fixture.status.elapsed ?? (mappedStatus === 'ht' ? 'HT' : 0),
        status: mappedStatus,
        league: fixture.league.name,
        country: fixture.league.country || '',
        leagueFlag: fixture.league.flag || '🌍',
        leagueLogo: fixture.league.logo,
        startTime: new Date(fixture.fixture.date).toLocaleString('tr-TR'),
        rawTime: fixture.fixture.timestamp
    }
}

function transformFixtureToDetail(fixture: APIFootballFixture, statistics: any[]): MatchDetailData {
    // Map events
    const events = (fixture.events || []).map(e => ({
        time: `${e.time.elapsed}'${e.time.extra ? `+${e.time.extra}` : ''}`,
        type: mapEventType(e.type, e.detail),
        team: e.team.id === fixture.teams.home.id ? 'home' as const : 'away' as const,
        player: e.player.name || undefined,
        detail: e.detail
    }))

    // Map statistics
    const statLabels: Record<string, { label: string, color: string }> = {
        'Ball Possession': { label: 'Topla Oynama (%)', color: 'blue' },
        'Shots on Goal': { label: 'İsabetli Şut', color: 'emerald' },
        'Total Shots': { label: 'Toplam Şut', color: 'cyan' },
        'Corner Kicks': { label: 'Korner', color: 'amber' },
        'Fouls': { label: 'Faul', color: 'rose' },
        'Offsides': { label: 'Ofsayt', color: 'purple' },
        'Yellow Cards': { label: 'Sarı Kart', color: 'yellow' },
        'Red Cards': { label: 'Kırmızı Kart', color: 'red' },
        'Goalkeeper Saves': { label: 'Kaleci Kurtarışı', color: 'green' },
        'Total passes': { label: 'Toplam Pas', color: 'indigo' },
        'Passes accurate': { label: 'İsabetli Pas', color: 'teal' }
    }

    const homeStats = statistics.find(s => s.team.id === fixture.teams.home.id)?.statistics || []
    const awayStats = statistics.find(s => s.team.id === fixture.teams.away.id)?.statistics || []

    const stats = Object.entries(statLabels).map(([apiType, { label, color }]) => {
        const homeStat = homeStats.find((s: any) => s.type === apiType)
        const awayStat = awayStats.find((s: any) => s.type === apiType)
        return {
            label,
            home: homeStat?.value ?? 0,
            away: awayStat?.value ?? 0,
            color
        }
    }).filter(s => s.home !== 0 || s.away !== 0)

    return {
        id: String(fixture.fixture.id),
        homeTeam: {
            name: fixture.teams.home.name,
            logo: fixture.teams.home.logo,
            id: String(fixture.teams.home.id)
        },
        awayTeam: {
            name: fixture.teams.away.name,
            logo: fixture.teams.away.logo,
            id: String(fixture.teams.away.id)
        },
        league: {
            name: fixture.league.name,
            country: fixture.league.country,
            flag: fixture.league.flag || '🌍',
            logo: fixture.league.logo
        },
        score: {
            home: fixture.goals.home ?? 0,
            away: fixture.goals.away ?? 0
        },
        status: {
            short: fixture.fixture.status.short,
            long: getStatusLabel(fixture.fixture.status.short),
            elapsed: fixture.fixture.status.elapsed
        },
        startTime: new Date(fixture.fixture.date).toLocaleString('tr-TR'),
        venue: fixture.fixture.venue.name || undefined,
        referee: fixture.fixture.referee || undefined,
        stats,
        events
    }
}

function mapEventType(type: string, detail: string): string {
    const typeMap: Record<string, string> = {
        'Goal': detail === 'Own Goal' ? '⚽🔴 Kendi Kalesine' : detail === 'Penalty' ? '⚽🎯 Penaltı' : '⚽ Gol',
        'Card': detail === 'Yellow Card' ? '🟨 Sarı Kart' : detail === 'Red Card' ? '🟥 Kırmızı Kart' : '🟨🟥 2. Sarı',
        'subst': '🔄 Değişiklik',
        'Var': '📺 VAR'
    }
    return typeMap[type] || type
}

// ----------------------------------------------------------------------
// Mock Data
// ----------------------------------------------------------------------

function getMockMatchDetail(id: string): MatchDetailData | null {
    return {
        id,
        homeTeam: { name: 'Mock Home', logo: '', id: 'h1' },
        awayTeam: { name: 'Mock Away', logo: '', id: 'a1' },
        league: { name: 'Mock League', country: 'Turkey', flag: '🇹🇷', logo: '' },
        score: { home: 1, away: 0 },
        status: { short: '1H', long: '1. Yarı', elapsed: 35 },
        startTime: new Date().toLocaleString('tr-TR'),
        venue: 'Mock Stadium',
        stats: [
            { label: 'Topla Oynama (%)', home: 55, away: 45, color: 'blue' },
            { label: 'Şut', home: 8, away: 5, color: 'emerald' }
        ],
        events: [
            { time: "23'", type: '⚽ Gol', team: 'home', player: 'Mock Player' }
        ]
    }
}

// ----------------------------------------------------------------------
// Manual Prediction Actions
// ----------------------------------------------------------------------

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
    console.log('[Manual Action] Publishing prediction:', id)
    return { success: true }
}

export async function updateManualResult(id: string, result: 'won' | 'lost' | 'void') {
    console.log('[Manual Action] Updating result:', id, result)
    return { success: true }
}

export async function deleteManualPrediction(id: string) {
    console.log('[Manual Action] Deleting prediction:', id)
    return { success: true }
}
