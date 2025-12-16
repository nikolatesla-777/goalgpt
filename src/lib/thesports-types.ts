/**
 * TheSports API Types
 * Complete type definitions for all 19 API endpoints
 */

// =============================================================================
// Common Types
// =============================================================================

export interface TheSportsApiResponse<T> {
    code: number
    msg?: string
    query?: {
        total: number
        type: string
        page?: number
    }
    results: T
}

// =============================================================================
// Match Types
// =============================================================================

/** Score array format: [total, 1st half, 2nd half, extra time, penalties, ...] */
export type ScoreArray = [number, number, number, number, number, number, number]

export interface TheSportsDiaryMatch {
    id: string
    season_id: string
    competition_id: string
    home_team_id: string
    away_team_id: string
    status_id: number
    match_time: number // Unix timestamp
    venue_id: string
    referee_id: string
    neutral: number
    note: string
    home_scores: ScoreArray
    away_scores: ScoreArray
    home_position: string
    away_position: string
    coverage: {
        mlive: number  // 1 = has live data
        lineup: number // 1 = has lineup
    }
    round: {
        stage_id: string
        round_num: number
        group_num: number
    }
    environment?: {
        weather: number
        pressure: string
        temperature: string
        wind: string
        humidity: string
    }
    related_id?: string
    agg_score?: [number, number]
    ended?: number
    updated_at: number
}

export interface TheSportsDetailLiveMatch {
    id: string
    /** Score: [id, status_id, home_scores[], away_scores[], timestamp, note] */
    score: [string, number, number[], number[], number, string]
    stats: TheSportsMatchStat[]
    incidents: TheSportsIncident[]
    tlive: TheSportsTimelineEvent[]
}

export interface TheSportsMatchStat {
    type: number
    home: number
    away: number
}

export interface TheSportsIncident {
    type: number
    position: number
    time: number
    player_id?: string
    player_name?: string
    assist1_id?: string
    assist1_name?: string
    home_score?: number
    away_score?: number
    reason_type?: number
}

export interface TheSportsTimelineEvent {
    time: number
    type: number
    data: any
}

// =============================================================================
// Stat Type Constants
// =============================================================================

export const STAT_TYPES = {
    1: 'goals',
    2: 'shots',
    3: 'corners',
    4: 'yellow_cards',
    6: 'fouls',
    7: 'offsides',
    8: 'red_cards',
    9: 'saves',
    21: 'yellow_cards',
    22: 'dangerous_attacks',
    23: 'shots_on_target',
    24: 'shots_off_target',
    25: 'possession',
    32: 'penalties',
    37: 'offsides'
} as const

// =============================================================================
// Team & Competition Types
// =============================================================================

export interface TheSportsTeam {
    id: string
    name: string
    short_name: string
    logo: string
    country_id: string
    national: number // 1 = national team
    venue_id?: string
    manager_id?: string
    founded?: number
}

export interface TheSportsCompetition {
    id: string
    name: string
    short_name: string
    logo: string
    country_id: string
    country_name?: string
    type: number // 1 = league, 2 = cup
}

// =============================================================================
// Trend Types
// =============================================================================

export interface TheSportsTrendLive {
    match_id: string
    trend: {
        count: number
        per: number
        data: number[][] // Momentum values per minute
    }
}

export interface TheSportsTrendDetail {
    match_id: string
    home: {
        attack: number
        defense: number
        form: number
    }
    away: {
        attack: number
        defense: number
        form: number
    }
}

// =============================================================================
// Stats Types
// =============================================================================

export interface TheSportsTeamStats {
    id: string
    stats: {
        team_id: string
        goals: number
        penalty: number
        assists: number
        red_cards: number
        yellow_cards: number
        shots: number
        shots_on_target: number
        dribble: number
        dribble_succ: number
        clearances: number
        blocked_shots: number
        interceptions: number
        tackles: number
        passes: number
        passes_accuracy: number
        key_passes: number
        crosses: number
        crosses_accuracy: number
        long_balls: number
        long_balls_accuracy: number
        duels: number
        duels_won: number
        aerials: number
        aerials_won: number
        fouls: number
        was_fouled: number
        offsides: number
        corners: number
        throw_ins: number
        goal_kicks: number
        ball_safe: number
        possession: number
    }[]
}

export interface TheSportsPlayerStats {
    id: string
    player_stats: {
        player_id: string
        team_id: string
        first: number // 1 = starter
        goals: number
        penalty: number
        assists: number
        minutes_played: number
        red_cards: number
        yellow_cards: number
        shots: number
        shots_on_target: number
        dribble: number
        dribble_succ: number
        clearances: number
        blocked_shots: number
        interceptions: number
        tackles: number
        passes: number
        passes_accuracy: number
        key_passes: number
        crosses: number
        crosses_accuracy: number
        long_balls: number
        long_balls_accuracy: number
        duels: number
        duels_won: number
        aerials: number
        aerials_won: number
        fouls: number
        was_fouled: number
        offsides: number
        touches: number
        rating: number
    }[]
}

export interface TheSportsHalfTeamStats {
    id: string
    ft: Record<string, [number, number]>  // Full time: { stat_type: [home, away] }
    p1: Record<string, [number, number]>  // 1st half
    p2?: Record<string, [number, number]> // 2nd half
}

// =============================================================================
// Lineup Types
// =============================================================================

export interface TheSportsLineup {
    id: string
    confirmed: number
    home: TheSportsTeamLineup
    away: TheSportsTeamLineup
}

export interface TheSportsTeamLineup {
    formation: string // e.g., "4-3-3"
    manager: {
        id: string
        name: string
        logo: string
    }
    lineup: TheSportsLineupPlayer[]
    substitutes: TheSportsLineupPlayer[]
}

export interface TheSportsLineupPlayer {
    player_id: string
    player_name: string
    player_logo: string
    shirt_number: number
    position: string // GK, DF, MF, FW
    grid: string // "1:1" format
    captain: number
    rating: number
}

// =============================================================================
// Table Types
// =============================================================================

export interface TheSportsTableLive {
    season_id: string
    promotions: {
        id: string
        name: string
        color: string
    }[]
    tables: {
        id: string
        conference: string
        group: number
        stage_id: string
        rows: TheSportsTableRow[]
    }[]
}

export interface TheSportsTableRow {
    team_id: string
    promotion_id: string
    points: number
    position: number
    deduct_points: number
    note: string
    total: number
    won: number
    draw: number
    loss: number
    goals: number
    goals_against: number
    goal_diff: number
    home_points: number
    home_position: number
    home_total: number
    home_won: number
    home_draw: number
    home_loss: number
    home_goals: number
    home_goals_against: number
    away_points: number
    away_position: number
    away_total: number
    away_won: number
    away_draw: number
    away_loss: number
    away_goals: number
    away_goals_against: number
}

// =============================================================================
// Analysis Types
// =============================================================================

export interface TheSportsMatchAnalysis {
    id: string
    h2h: TheSportsH2H[]
    home_last: TheSportsDiaryMatch[]
    away_last: TheSportsDiaryMatch[]
}

export interface TheSportsH2H {
    match_id: string
    home_team_id: string
    away_team_id: string
    home_score: number
    away_score: number
    match_time: number
    competition_id: string
}

// =============================================================================
// Compensation (Form) Types
// =============================================================================

export interface TheSportsCompensation {
    id: string
    history: {
        home: TheSportsFormRecord
        away: TheSportsFormRecord
    }
    recent: {
        home: TheSportsFormRecord
        away: TheSportsFormRecord
    }
}

export interface TheSportsFormRecord {
    won_count: number
    drawn_count: number
    lost_count: number
    rate: number // Win rate as decimal
}

// =============================================================================
// Goal Line (Odds) Types
// =============================================================================

export interface TheSportsGoalLine {
    id: string
    company_id: string
    initial: {
        handicap: number
        home_odds: number
        away_odds: number
    }
    current: {
        handicap: number
        home_odds: number
        away_odds: number
    }
    updated_at: number
}

// =============================================================================
// Status Mapping
// =============================================================================

export const MATCH_STATUS = {
    1: { short: 'NS', long: 'Not Started', isLive: false, isFinished: false },
    2: { short: '1H', long: 'First Half', isLive: true, isFinished: false },
    3: { short: 'HT', long: 'Halftime', isLive: true, isFinished: false },
    4: { short: '2H', long: 'Second Half', isLive: true, isFinished: false },
    5: { short: 'ET', long: 'Extra Time', isLive: true, isFinished: false },
    6: { short: 'BT', long: 'Break Time', isLive: true, isFinished: false },
    7: { short: 'PEN', long: 'Penalties', isLive: true, isFinished: false },
    8: { short: 'FT', long: 'Full Time', isLive: false, isFinished: true },
    9: { short: 'PST', long: 'Postponed', isLive: false, isFinished: false },
    10: { short: 'CANC', long: 'Cancelled', isLive: false, isFinished: true },
    11: { short: 'ABD', long: 'Abandoned', isLive: false, isFinished: true },
    12: { short: 'INT', long: 'Interrupted', isLive: true, isFinished: false },
    13: { short: 'SUSP', long: 'Suspended', isLive: false, isFinished: false }
} as const

export type MatchStatusId = keyof typeof MATCH_STATUS
