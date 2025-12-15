/**
 * Momentum Engine
 * Analyzes match statistics to generate actionable insights
 */

export interface MomentumInsight {
    type: 'goal_expected' | 'home_pressure' | 'away_pressure' | 'balanced' | 'late_drama' | null
    message: string | null
    emoji: string | null
    confidence: number  // 0-100
}

interface MatchStatistics {
    possession?: { home: number; away: number }
    shotsOnTarget?: { home: number; away: number }
    totalShots?: { home: number; away: number }
    corners?: { home: number; away: number }
    dangerousAttacks?: { home: number; away: number }
}

export class MomentumEngine {

    /**
     * Analyze match statistics and generate insight
     */
    static analyze(stats: MatchStatistics | null, status: string, minute: number | null): MomentumInsight {
        // No stats = no insight (but don't filter out the match!)
        if (!stats) {
            return { type: null, message: null, emoji: null, confidence: 0 }
        }

        const insights: MomentumInsight[] = []

        // 1. Heavy Pressure Analysis
        if (stats.shotsOnTarget) {
            const homeShots = stats.shotsOnTarget.home || 0
            const awayShots = stats.shotsOnTarget.away || 0
            const totalShots = homeShots + awayShots

            if (totalShots >= 4) {
                if (homeShots >= awayShots * 2 && homeShots >= 4) {
                    insights.push({
                        type: 'home_pressure',
                        message: 'Ev Sahibi Baskılı',
                        emoji: '🏠🔥',
                        confidence: Math.min(90, 50 + homeShots * 5)
                    })
                } else if (awayShots >= homeShots * 2 && awayShots >= 4) {
                    insights.push({
                        type: 'away_pressure',
                        message: 'Deplasman Gol Arıyor',
                        emoji: '✈️🔥',
                        confidence: Math.min(90, 50 + awayShots * 5)
                    })
                }
            }
        }

        // 2. Goal Expected Analysis
        if (stats.totalShots && stats.corners) {
            const totalShots = (stats.totalShots.home || 0) + (stats.totalShots.away || 0)
            const totalCorners = (stats.corners.home || 0) + (stats.corners.away || 0)

            if (totalShots >= 15 && totalCorners >= 8) {
                insights.push({
                    type: 'goal_expected',
                    message: 'Gol Beklentisi Yüksek',
                    emoji: '🎯',
                    confidence: Math.min(85, 40 + totalShots * 2 + totalCorners * 2)
                })
            }
        }

        // 3. Late Drama Detection (75+ minute, close game)
        if (minute && minute >= 75 && status === '2H') {
            if (stats.shotsOnTarget) {
                const recentPressure = (stats.shotsOnTarget.home || 0) + (stats.shotsOnTarget.away || 0)
                if (recentPressure >= 6) {
                    insights.push({
                        type: 'late_drama',
                        message: 'Son Dakika Heyecanı',
                        emoji: '⏰🔥',
                        confidence: Math.min(80, 50 + recentPressure * 3)
                    })
                }
            }
        }

        // 4. Possession Dominance
        if (stats.possession) {
            const homePoss = stats.possession.home || 50
            const awayPoss = stats.possession.away || 50

            if (homePoss >= 65) {
                insights.push({
                    type: 'home_pressure',
                    message: 'Ev Sahibi Hakim',
                    emoji: '🏠⚡',
                    confidence: Math.min(70, homePoss)
                })
            } else if (awayPoss >= 65) {
                insights.push({
                    type: 'away_pressure',
                    message: 'Deplasman Hakim',
                    emoji: '✈️⚡',
                    confidence: Math.min(70, awayPoss)
                })
            }
        }

        // Return highest confidence insight
        if (insights.length === 0) {
            return { type: 'balanced', message: null, emoji: null, confidence: 0 }
        }

        return insights.sort((a, b) => b.confidence - a.confidence)[0]
    }

    /**
     * Parse API-Football statistics array into structured object
     */
    static parseStatistics(statsArray: { type: string; value: any }[]): MatchStatistics {
        const stats: MatchStatistics = {}

        for (const stat of statsArray) {
            const value = typeof stat.value === 'string'
                ? parseInt(stat.value.replace('%', ''))
                : stat.value

            switch (stat.type) {
                case 'Ball Possession':
                    if (!stats.possession) stats.possession = { home: 0, away: 0 }
                    break
                case 'Shots on Goal':
                    if (!stats.shotsOnTarget) stats.shotsOnTarget = { home: value, away: 0 }
                    else stats.shotsOnTarget.away = value
                    break
                case 'Total Shots':
                    if (!stats.totalShots) stats.totalShots = { home: value, away: 0 }
                    else stats.totalShots.away = value
                    break
                case 'Corner Kicks':
                    if (!stats.corners) stats.corners = { home: value, away: 0 }
                    else stats.corners.away = value
                    break
            }
        }

        return stats
    }
}
