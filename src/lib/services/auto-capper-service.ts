/**
 * Auto Capper Service
 * Evaluates pending predictions based on live API-Football data
 */

import { createClient } from '@/utils/supabase/server'
import { APIFootball, APIFootballFixture, isFixtureLive, isFixtureFinished } from '@/lib/api-football'

type PredictionStatus = 'pending' | 'won' | 'lost' | 'void'

export class AutoCapperService {

    /**
     * Main entry point: Process all pending predictions and update their status
     */
    static async processPendingPredictions() {
        const supabase = await createClient()

        // 1. Fetch pending predictions that are linked to a match
        const { data: predictions, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('status', 'pending')
            .not('match_uuid', 'is', null)

        if (error || !predictions || predictions.length === 0) {
            console.log('[AutoCapper] No pending predictions to process.')
            return { processed: 0, updates: 0 }
        }

        console.log(`[AutoCapper] Processing ${predictions.length} pending predictions...`)

        let updatesCount = 0

        // 2. Get all live fixtures
        const liveFixtures = await APIFootball.getLiveFixtures()
        const liveFixtureMap = new Map(liveFixtures.map(f => [String(f.fixture.id), f]))

        // 3. Process each prediction
        for (const prediction of predictions) {
            try {
                let fixture = liveFixtureMap.get(prediction.match_uuid)

                // If not in live list, fetch individually (might be finished)
                if (!fixture) {
                    fixture = await APIFootball.getFixtureById(Number(prediction.match_uuid)) || undefined
                }

                if (!fixture) {
                    console.log(`[AutoCapper] Fixture not found: ${prediction.match_uuid}`)
                    continue
                }

                // 4. Evaluate prediction
                const result = this.evaluatePrediction(
                    prediction.analysis || prediction.raw_text,
                    fixture
                )

                if (result) {
                    console.log(`[AutoCapper] ✅ Prediction RESOLVED: ${prediction.id} -> ${result}`)

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
                console.error(`[AutoCapper] Error processing prediction ${prediction.id}:`, err)
            }
        }

        return { processed: predictions.length, updates: updatesCount }
    }

    /**
     * Core Logic: Evaluates if a prediction is Won or Lost based on match state
     */
    static evaluatePrediction(predictionText: string, fixture: APIFootballFixture): 'won' | 'lost' | 'void' | null {
        if (!predictionText || !fixture) return null

        const status = fixture.fixture.status.short
        const homeScore = fixture.goals.home ?? 0
        const awayScore = fixture.goals.away ?? 0
        const totalGoals = homeScore + awayScore

        // HT scores for IY bets
        const htHome = fixture.score.halftime.home ?? 0
        const htAway = fixture.score.halftime.away ?? 0
        const htTotal = htHome + htAway

        const isLive = isFixtureLive(status)
        const isFinished = isFixtureFinished(status)
        const isFirstHalf = status === '1H'
        const isHalfTime = status === 'HT'
        const isSecondHalf = status === '2H'

        // Handle cancelled/postponed matches
        if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status)) {
            return 'void'
        }

        // --- Logic 1: "IY X.5 ÜST" (First Half Over) ---
        const iyMatch = predictionText.match(/\bIY\s+(\d+(?:[.,]\d+)?)\s*ÜST/i)
        if (iyMatch) {
            const threshold = parseFloat(iyMatch[1].replace(',', '.'))

            // Early Win: Already over threshold in 1H
            if (isFirstHalf && totalGoals > threshold) {
                return 'won'
            }

            // HT or later: Use HT score
            if (isHalfTime || isSecondHalf || isFinished) {
                return htTotal > threshold ? 'won' : 'lost'
            }

            return null // Still in 1H, wait
        }

        // --- Logic 2: "IY X.5 ALT" (First Half Under) ---
        const iyAltMatch = predictionText.match(/\bIY\s+(\d+(?:[.,]\d+)?)\s*ALT/i)
        if (iyAltMatch) {
            const threshold = parseFloat(iyAltMatch[1].replace(',', '.'))

            // Early Loss: Already over threshold in 1H
            if (isFirstHalf && totalGoals > threshold) {
                return 'lost'
            }

            // HT or later: Use HT score
            if (isHalfTime || isSecondHalf || isFinished) {
                return htTotal < threshold ? 'won' : 'lost'
            }

            return null
        }

        // --- Logic 3: "X.5 ÜST" (Full Time Over) ---
        const overMatch = predictionText.match(/(\d+(?:[.,]\d+)?)\s*ÜST/i)
        if (overMatch && !predictionText.match(/IY/i)) {
            const threshold = parseFloat(overMatch[1].replace(',', '.'))

            // Early Win
            if (isLive && totalGoals > threshold) {
                return 'won'
            }

            // FT: Final decision
            if (isFinished) {
                return totalGoals > threshold ? 'won' : 'lost'
            }

            return null
        }

        // --- Logic 4: "X.5 ALT" (Full Time Under) ---
        const underMatch = predictionText.match(/(\d+(?:[.,]\d+)?)\s*ALT/i)
        if (underMatch && !predictionText.match(/IY/i)) {
            const threshold = parseFloat(underMatch[1].replace(',', '.'))

            // Early Loss
            if (isLive && totalGoals > threshold) {
                return 'lost'
            }

            // FT: Final decision
            if (isFinished) {
                return totalGoals < threshold ? 'won' : 'lost'
            }

            return null
        }

        // --- Logic 5: "+1 Gol" (Live Goal) ---
        if (predictionText.includes('+') && predictionText.match(/Gol/i)) {
            const bracketMatch = predictionText.match(/\(([\d.,]+)\s*ÜST\)/i)
            if (bracketMatch) {
                const threshold = parseFloat(bracketMatch[1].replace(',', '.'))

                if (totalGoals > threshold) {
                    return 'won'
                }

                if (isFinished) {
                    return 'lost'
                }
            }
            return null
        }

        // --- Logic 6: "MS 1" (Home Win) ---
        if (predictionText.match(/\bMS\s*1\b/i)) {
            if (isFinished) {
                return homeScore > awayScore ? 'won' : 'lost'
            }
            return null
        }

        // --- Logic 7: "MS X" (Draw) ---
        if (predictionText.match(/\bMS\s*X\b/i)) {
            if (isFinished) {
                return homeScore === awayScore ? 'won' : 'lost'
            }
            return null
        }

        // --- Logic 8: "MS 2" (Away Win) ---
        if (predictionText.match(/\bMS\s*2\b/i)) {
            if (isFinished) {
                return awayScore > homeScore ? 'won' : 'lost'
            }
            return null
        }

        // --- Logic 9: "KG VAR" (Both Teams to Score) ---
        if (predictionText.match(/\bKG\s*VAR\b/i)) {
            // Early Win
            if (homeScore > 0 && awayScore > 0) {
                return 'won'
            }

            if (isFinished) {
                return (homeScore > 0 && awayScore > 0) ? 'won' : 'lost'
            }

            return null
        }

        // --- Logic 10: "KG YOK" (No BTTS) ---
        if (predictionText.match(/\bKG\s*YOK\b/i)) {
            // Early Loss
            if (homeScore > 0 && awayScore > 0) {
                return 'lost'
            }

            if (isFinished) {
                return (homeScore === 0 || awayScore === 0) ? 'won' : 'lost'
            }

            return null
        }

        return null // No decision yet
    }
}
