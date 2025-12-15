
export interface StandardizedPrediction {
    raw_text: string;
    bot_id: string | null;
    league_name: string | null;
    home_team: string; // Normalized
    away_team: string; // Normalized
    match_minute: number;
    match_score: string; // "0-0"
    last_goal_minute: number | null;

    // Calculated Fields
    prediction_type: string; // "IY 0.5 ÜST"
    period: 'IY' | 'MS';
    threshold: number;
    direction: 'ÜST' | 'ALT';

    // Metadata
    is_valid: boolean;
    error?: string;
}

export class UniversalParser {
    /**
     * Main entry point to parser any Cenkler-format text
     */
    static parse(text: string): StandardizedPrediction | null {
        if (!text) return null;

        // 1. Extract Basic Fields
        const botId = this.extractBotId(text);
        const league = this.extractLeague(text);
        const teams = this.extractTeams(text);
        const minute = this.extractMinute(text);
        const score = this.extractScore(text);
        const lastGoalMinute = this.extractLastGoalMinute(text);

        if (!teams || minute === null || !score) {
            console.warn('UniversalParser: Missing critical fields', { teams, minute, score });
            return null;
        }

        // 2. Calculate Prediction (The Matrix Logic 🧮)
        const calculation = this.calculatePrediction(score, minute);

        if (!calculation) {
            console.warn('UniversalParser: Calculation failed for', { score, minute });
            return null;
        }

        return {
            raw_text: text,
            bot_id: botId,
            league_name: league,
            home_team: teams.home,
            away_team: teams.away,
            match_minute: minute,
            match_score: score,
            last_goal_minute: lastGoalMinute,

            prediction_type: calculation.prediction,
            period: calculation.period,
            threshold: calculation.threshold,
            direction: 'ÜST', // Always ÜST for Cenkler

            is_valid: true
        };
    }

    private static extractBotId(text: string): string | null {
        const match = text.match(/^(\d+)/);
        return match ? match[1] : null;
    }

    private static extractLeague(text: string): string | null {
        const lines = text.split('\n');
        // Simple heuristic: Line 2 is often league if not "Minute:"
        if (lines.length > 1 && !lines[1].includes('Minute:') && !lines[1].includes('⏰')) {
            return lines[1].trim();
        }
        // One-liner fallback (Osaka style)
        if (text.includes(') ')) {
            const parts = text.split(') ');
            if (parts[1]) {
                const leaguePart = parts[1].split(/Minute:|⏰/i)[0];
                return leaguePart.trim();
            }
        }
        return null; // Can be improved
    }

    private static extractTeams(text: string): { home: string, away: string } | null {
        // Pattern: *Home - Away ( Score )*
        const match = text.match(/\*([^*]+?)\s*-\s*([^*(]+?)\s*\(/);
        if (match) {
            return {
                home: match[1].trim(),
                away: match[2].trim()
            };
        }
        return null;
    }

    private static extractMinute(text: string): number | null {
        const match = text.match(/(?:Minute:|⏰)\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
    }

    private static extractScore(text: string): string | null {
        const match = text.match(/\(\s*(\d+)\s*-\s*(\d+)\s*\)/);
        return match ? `${match[1]}-${match[2]}` : null;
    }

    private static extractLastGoalMinute(text: string): number | null {
        const match = text.match(/SonGol\s*dk:\s*(\d+|-\s*)/i);
        if (match && match[1].trim() !== '-') {
            return parseInt(match[1], 10);
        }
        return null;
    }

    private static calculatePrediction(score: string, minute: number): {
        prediction: string,
        period: 'IY' | 'MS',
        threshold: number
    } | null {
        const [homeStr, awayStr] = score.split('-');
        const totalGoals = parseInt(homeStr) + parseInt(awayStr);

        if (isNaN(totalGoals)) return null;

        const threshold = totalGoals + 0.5;
        const period: 'IY' | 'MS' = minute <= 45 ? 'IY' : 'MS';

        return {
            prediction: `${period} ${threshold} ÜST`,
            period,
            threshold
        };
    }
}
