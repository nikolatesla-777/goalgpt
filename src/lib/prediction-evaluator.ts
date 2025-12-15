
export type PredictionResult = 'won' | 'lost' | 'pending' | 'void'
export type MatchStatus = 'LIVE' | 'FT' | 'NS' | 'ABD' // Simplified status

export class PredictionEvaluator {

    /**
     * MAIN EVALUATION ENGINE
     */
    static evaluate(
        predictionTypeRaw: string,
        homeGoals: number,
        awayGoals: number,
        htHomeGoals: number,
        htAwayGoals: number,
        status: string // '1H', 'HT', '2H', 'FT' etc.
    ): { result: PredictionResult, log: string } {

        const type = predictionTypeRaw.trim().toUpperCase()
        const totalGoals = homeGoals + awayGoals
        const htTotalGoals = htHomeGoals + htAwayGoals

        // Status Flags
        const isHT = ['HT', 'INT'].includes(status)
        const isFT = ['FT', 'AET', 'PEN'].includes(status)
        const isLive = !isFT && status !== 'NS' && status !== 'ABD'

        // 1. TRY DYNAMIC PARSER (Cenkler Formula: "IY 0.5 ÜST" etc.)
        const dynamicResult = this.evaluateDynamic(type, { total: totalGoals, ht: htTotalGoals }, { isHT, isFT, isLive });
        if (dynamicResult) {
            return dynamicResult;
        }

        // 2. FALLBACK TO LEGACY SWITCH-CASE (Old text types)
        return this.evaluateLegacy(type, totalGoals, isFT, homeGoals, awayGoals);
    }

    /**
     * DYNAMIC PARSER for Standardized Types
     * Format: [PERIOD] [THRESHOLD] [DIRECTION]
     * Examples: "IY 0.5 ÜST", "MS 2.5 ALT", "IY 1.5 ÜST"
     */
    private static evaluateDynamic(
        type: string,
        goals: { total: number, ht: number },
        status: { isHT: boolean, isFT: boolean, isLive: boolean }
    ): { result: PredictionResult, log: string } | null {

        // Regex: (IY|MS) (Number) (ÜST|ALT|UST|OVER|UNDER)
        const regex = /^(IY|MS|HT|FT)\s+(\d+(\.\d+)?)\s+(ÜST|ALT|UST|OVER|UNDER)$/i;
        const match = type.match(regex);

        if (!match) return null; // Not a standardized format

        const period = match[1].toUpperCase(); // IY or MS
        const threshold = parseFloat(match[2]);
        const directionRaw = match[4].toUpperCase();
        const isOver = ['ÜST', 'UST', 'OVER'].includes(directionRaw);

        // Determine relevant goals and completion status based on Period
        let relevantGoals = 0;
        let isPeriodFinished = false;

        if (period === 'IY' || period === 'HT') {
            relevantGoals = (status.isHT || status.isFT || period === 'HT') ? goals.ht : goals.total; // If still 1H, use total (equal to 1H goals)
            isPeriodFinished = status.isHT || status.isFT; // HT or FT means 1st Half is done
        } else {
            // MS / FT
            relevantGoals = goals.total;
            isPeriodFinished = status.isFT;
        }

        // --- EVALUATION LOGIC ---

        // 1. ÜST (OVER) CHECK
        if (isOver) {
            // Early Win Check (Anytime)
            if (relevantGoals > threshold) {
                return { result: 'won', log: `✅ Early Win: ${relevantGoals} > ${threshold} (${period})` };
            }
            // Loss Check (Only when period is finished)
            if (isPeriodFinished && relevantGoals <= threshold) {
                return { result: 'lost', log: `❌ Loss: ${relevantGoals} <= ${threshold} (${period} End)` };
            }
        }
        // 2. ALT (UNDER) CHECK
        else {
            // Early Loss Check (Anytime)
            if (relevantGoals > threshold) {
                return { result: 'lost', log: `❌ Early Loss: ${relevantGoals} > ${threshold} (${period})` };
            }
            // Win Check (Only when period is finished)
            if (isPeriodFinished && relevantGoals <= threshold) {
                return { result: 'won', log: `✅ Win: ${relevantGoals} <= ${threshold} (${period} End)` };
            }
        }

        return { result: 'pending', log: `⏳ Pending: ${relevantGoals} / ${threshold} (${period})` };
    }

    /**
     * LEGACY EVALUATOR (For old text formats like "KG VAR", "MS 1")
     */
    private static evaluateLegacy(
        type: string,
        totalGoals: number,
        isFT: boolean,
        homeGoals: number,
        awayGoals: number
    ): { result: PredictionResult, log: string } {
        let result: PredictionResult = 'pending';
        let log = '';

        // Normalize common variations
        const t = type.replace('İ', 'I').replace('Ü', 'U');

        // KG VAR
        if (/KG\s*(VAR|YES)|BOTH TEAMS/i.test(t)) {
            if (homeGoals > 0 && awayGoals > 0) {
                return { result: 'won', log: '✅ KG Var Hit' };
            }
            if (isFT) {
                return { result: 'lost', log: '❌ KG Var Miss' };
            }
        }

        // MS 1 / MS 2 / MS 0
        if (/(MS|FT)\s*1/i.test(t)) {
            if (isFT) return { result: homeGoals > awayGoals ? 'won' : 'lost', log: `FT: ${homeGoals}-${awayGoals}` };
        }
        else if (/(MS|FT)\s*2/i.test(t)) {
            if (isFT) return { result: awayGoals > homeGoals ? 'won' : 'lost', log: `FT: ${homeGoals}-${awayGoals}` };
        }
        else if (/(MS|FT)\s*0|DRAW/i.test(t)) {
            if (isFT) return { result: homeGoals === awayGoals ? 'won' : 'lost', log: `FT: ${homeGoals}-${awayGoals}` };
        }

        return { result: 'pending', log: 'Waiting for match status...' };
    }
}
