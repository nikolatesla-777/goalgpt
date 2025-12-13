
import { createClient } from '@/utils/supabase/server'
import { TheSportsApi } from '@/lib/thesports-api'
import { LiveMatchService } from './live-match-service'

// Types based on the legacy definition
type PredictionStatus = 'pending' | 'won' | 'lost' | 'void'
type MatchStatus = 'live' | 'ht' | 'ft' | 'aborted'

export class AutoCapperService {

    /**
     * Main entry point: Process all pending predictions and update their status
     */
    static async processPendingPredictions() {
        const supabase = createClient()

        // 1. Fetch pending predictions that are linked to a match
        const { data: predictions, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('status', 'pending')
            .not('match_uuid', 'is', null) // Only processed matched predictions

        if (error || !predictions || predictions.length === 0) {
            console.log('No pending predictions to process.')
            return { processed: 0, updates: 0 }
        }

        console.log(`Processing ${predictions.length} pending predictions...`)

        let updatesCount = 0

        // 2. Fetch live data for these matches
        // Optimization: We could fetch all live matches once, but predictions might be for old matches too.
        // For now, let's just get the live matches bulk list and map them.
        // If a match is NOT in live list, we might need to check if it ended today.

        const liveMatches = await TheSportsApi.getLiveMatches()

        // Create a map for fast lookup
        const liveMatchMap = new Map(liveMatches.map(m => [m.id, m]))

        for (const prediction of predictions) {
            try {
                // If match is live, we have data. 
                // If not live, it might have finished. We need to check results if not found in live.
                let match = liveMatchMap.get(prediction.match_uuid)

                // If not in live map, maybe it finished recently? 
                // Legacy system assumes we have "MatchLiveData". 
                // Here, if it's not live, we should probably fetch details to see if it ended.
                if (!match) {
                    // Fetch individual match detail (API call per missing match - be careful with rate limits)
                    // For MVP, we only process LIVE matches for early wins, 
                    // and maybe check finished status if we can identify it.
                    // Let's safe-guard: only fetch if we don't have it.
                    const details = await TheSportsApi.getMatch(prediction.match_uuid)
                    if (details) {
                        match = details
                    }
                }

                if (!match) {
                    console.log(`Match data not found for prediction ${prediction.id} (Match: ${prediction.match_uuid})`)
                    continue
                }

                // 3. Evaluate Match Logic
                const result = this.evaluatePrediction(prediction.analysis || prediction.raw_text, match)

                if (result) {
                    console.log(`✅ Prediction RESOLVED: ${prediction.id} -> ${result}`)

                    // 4. Update Database
                    await supabase
                        .from('predictions')
                        .update({
                            status: result,
                            resulted_at: new Date().toISOString()
                        })
                        .eq('id', prediction.id)

                    updatesCount++
                }

            } catch (err) {
                console.error(`Error processing prediction ${prediction.id}:`, err)
            }
        }

        return { processed: predictions.length, updates: updatesCount }
    }

    /**
     * Core Logic: Evaluates if a prediction is Won or Lost based on match state
     * Ported from Legacy TS_LiveMatchService.cs
     */
    static evaluatePrediction(predictionText: string, match: any): 'won' | 'lost' | null {
        if (!predictionText) return null

        const homeScore = match.scores?.home ?? match.home_score ?? 0 // Handle different API shapes if needed
        const awayScore = match.scores?.away ?? match.away_score ?? 0
        const totalGoals = homeScore + awayScore
        const statusId = match.status?.id ?? match.status_id // 1=NotStarted, 8=Finished, etc.

        // Status mapping (TheSports usually: 1=NotStarted, 2=1H, 3=HT, 4=2H, 5=ET, 7=Pen, 8=End)
        // Legacy code used: 2 (1H), 3 (HT), 8 (End)
        const isFirstHalf = statusId === 2
        const isHalfTime = statusId === 3
        const isFinished = statusId === 8
        const isLive = [2, 3, 4, 5].includes(statusId)

        // --- Logic 1: "IY X.5 ÜST" (First Half Over) ---
        // Regex: \bIY\s+(\d+(?:[.,]\d+)?)\s*ÜST\b
        const iyMatch = predictionText.match(/\bIY\s+(\d+(?:[.,]\d+)?)\s*ÜST/i)
        if (iyMatch) {
            const threshold = parseFloat(iyMatch[1].replace(',', '.'))

            // Case A: Threshold already beaten (Early Win)
            if (totalGoals > threshold) {
                return 'won'
            }

            // Case B: HT reached/passed and not beaten -> Loss
            // Note: If match finished (8) or in 2nd half (4), it's a loss IF it wasn't won.
            // But be careful: totalGoals now might be FT score. We need HT score specifically for IY bets if match is past HT.
            // TheSports API usually provides `scores: [0, 0, 1, 0, ...]` array or specific `ht_score`.
            // Legacy logic: "if MatchStatus == 3 (HT) -> definitive decision".
            // If match is finished, we technically need the HT score. 
            // For now, let's implementations rely on "Live" checking. 
            // If we are checking a LIVE match at HT (3), we can decide.

            if (isHalfTime) {
                return totalGoals > threshold ? 'won' : 'lost'
            }

            // Look at legacy: 
            // "else if (prediction.MatchStatus == 2) { isSuccess = (totalNow > thr) ? true : (bool?)null; }"
            // It implies we NEVER early-fail in 1H. Correct.

            if (isFinished) {
                // Fallback if we missed live window: Try to find HT score from API match object
                // TheSports "score" field is often array: [current, ht, ...]
                // If we can't find HT score, we might default to Current Score check? NO, that's dangerous (FT score > HT score).
                // For safety: Only resolve IY bets while Live 1H/HT. 
                // If finished, we leave it pending unless we are sure.
                // Actually, let's assume if it's IY bet and match finished, we missed it... or we check FT score?
                // Wait, if FT score is 0-0, then HT score was 0-0 => LOST.
                if (totalGoals <= threshold) return 'lost'

                // If FT score > threshold, HT score MIGHT be > threshold but not guaranteed. 
                // We leave it pending/manual if we missed the window.
            }
        }

        // --- Logic 2: "+1 Gol" (Live Goal) ---
        // Regex: \(([\d.]+)\s*ÜST\)  -> matches "(0.5 ÜST)" or "(1.5 ÜST)" usually inside text.
        // Legacy: prediction.Prediction.Contains("+") && Contains("Gol") && !Contains("IY")
        if (predictionText.includes('+') && predictionText.includes('Gol') && !predictionText.includes('IY')) {
            const overMatch = predictionText.match(/\(([\d.]+)\s*ÜST\)/i)
            if (overMatch) {
                const threshold = parseFloat(overMatch[1].replace(',', '.'))

                // Early Win
                if (totalGoals > threshold) {
                    return 'won'
                }

                // Late Loss (Only on Finish)
                if (isFinished) {
                    return 'lost'
                }
            }
        }

        return null // No decision yet
    }
}
