import { DataProvider } from '../providers/data-provider'
import { AIPredictionPayload, LegacyPredictionPayload, PredictionIngestResult } from '../types/predictions'

import { TeamMatchingService } from './team-matching-service'
import { BotMatchingService } from './bot-matching-service'
import { LiveMatchService } from './live-match-service'
import { UniversalParser } from './universal-parser'
import { MatchingService } from './matching-service'

export class PredictionService {

    /**
     * Validate incoming API KEY
     */
    static validateApiKey(key: string | null): boolean {
        const VALID_KEY = process.env.GOALGPT_API_KEY || 'fake-api-key-dev-123'
        return key === VALID_KEY
    }

    /**
     * Ingest a new prediction (supports both structured and legacy)
     */
    static async ingest(payload: AIPredictionPayload): Promise<PredictionIngestResult> {
        try {
            // 2. Intelligent Team Matching & Live Context (Active Learning)
            // This replaces the old simple matching service
            const matchResult = await MatchingService.resolveMatch(
                payload.homeTeam,
                payload.awayTeam,
                Number(payload.minute || 0)
            )

            const { homeTeamId: homeId, awayTeamId: awayId, fixtureId, source } = matchResult

            console.log(`🧠 Match Resolved [${source}]: ${payload.homeTeam}(${homeId}) vs ${payload.awayTeam}(${awayId}) -> LiveFixture: ${fixtureId || 'None'}`)

            // 3. Bot Matching
            let extractedAlertCode = ''
            if (payload.analysis && payload.analysis.includes('Alert Code:')) {
                extractedAlertCode = payload.analysis.split('Alert Code:')[1].trim()
            }

            const botMatch = await BotMatchingService.matchBot({
                minute: Number(payload.minute || 0),
                alertCode: extractedAlertCode,
                fullText: payload.rawText
            })

            if (botMatch) {
                console.log(`🤖 Bot Identified: ${botMatch.name} (${botMatch.id})`)
            } else {
                console.log('🤖 No specific bot matched (using default)')
            }


            // 4. Link to Live Match (API-Football)
            // Use resolved fixtureId from MatchingService if available, otherwise fallback
            let liveMatchId: string | null = fixtureId ? String(fixtureId) : null

            if (!liveMatchId && payload.homeTeam && payload.awayTeam) {
                // Fallback: Try looking up by name only (legacy support)
                liveMatchId = await LiveMatchService.findMatchForPrediction(
                    payload.homeTeam,
                    payload.awayTeam
                )
            }

            const enrichedPayload = {
                ...payload,
                homeTeamId: homeId,
                awayTeamId: awayId,
                botGroupId: botMatch?.id || null,
                botGroupName: botMatch?.name || null,
                matchUuid: liveMatchId || null
            }

            await DataProvider.addPrediction(enrichedPayload as any)

            // 3. Simulate Notification Flow
            if (this.shouldTriggerNotification(payload)) {
                this.simulateNotification(payload)
            }

            return {
                success: true,
                id: payload.matchId,
                message: 'Prediction ingested successfully'
            }
        } catch (error) {
            console.error('Prediction ingest error:', error)
            return { success: false, message: 'Internal server error' }
        }
    }

    /**
     * Parse Legacy Payload (Ported from Deno Edge Function)
     */
    static parseLegacyPayload(legacy: LegacyPredictionPayload): AIPredictionPayload[] {
        const decodedText = this.base64Decode(legacy.Prediction)
        const isGroup = decodedText.includes('→') || decodedText.includes('GÜNÜN')
        const timestamp = new Date(legacy.Date).getTime()

        if (isGroup) {
            return this.parseGroupPrediction(decodedText).map(item => ({
                matchId: `${legacy.Id}-${item.home_team_name}-${item.away_team_name}`,
                homeTeam: item.home_team_name,
                awayTeam: item.away_team_name,
                league: 'Unknown',
                prediction: item.prediction_type,
                odds: 0,
                confidence: 0,
                analysis: item.raw_text,
                timestamp: timestamp,
                originalId: legacy.Id,
                rawText: item.raw_text
            }))
        } else {
            const parsed = this.parseSinglePrediction(decodedText)

            // Calculate our own prediction based on score and minute
            const calculated = this.calculatePrediction(
                parsed.match_score,
                parsed.match_minute
            )

            return [{
                matchId: String(legacy.Id),
                homeTeam: parsed.home_team_name,
                awayTeam: parsed.away_team_name,
                league: parsed.league_name,
                prediction: parsed.prediction_type,
                odds: 0,
                confidence: 0,
                analysis: parsed.alert_code ? `Alert Code: ${parsed.alert_code}` : '',
                timestamp: timestamp,
                originalId: legacy.Id,
                rawText: parsed.raw_text,
                // Enhanced parsed fields
                minute: parsed.match_minute,
                matchScore: parsed.match_score,
                botName: parsed.bot_name,
                botDisplayName: parsed.bot_display_name || (parsed.match_minute ? `${parsed.match_minute}. Dakika Botu` : null),
                lastGoalMinute: parsed.last_goal_minute,
                // Calculated prediction fields
                originalPrediction: parsed.prediction_type, // Cenklerden gelen
                calculatedPrediction: calculated?.calculated_prediction || null,
                predictionPeriod: calculated?.prediction_period || null,
                predictionThreshold: calculated?.prediction_threshold || null,
                predictionDirection: calculated?.prediction_direction || null,
                goalsAtPrediction: calculated?.goals_at_prediction || null,
            }]
        }
    }

    // =========================================================================
    // PREDICTION CALCULATION SYSTEM
    // Calculates our own prediction based on match score and minute
    // =========================================================================

    /**
     * Calculate prediction from match score and minute
     * Algorithm:
     * 1. Parse match score → total goals
     * 2. Add 0.5 to get threshold (+1 gol beklentisi)
     * 3. Determine period (IY/MS) based on minute
     * 4. Return structured prediction
     */
    static calculatePrediction(matchScore: string | null, minute: number | null): {
        calculated_prediction: string;
        prediction_period: 'IY' | 'MS';
        prediction_threshold: number;
        prediction_direction: 'ÜST' | 'ALT';
        goals_at_prediction: number;
    } | null {
        if (!matchScore || minute === null) {
            return null
        }

        // Parse score: "2-1" → [2, 1]
        const scoreMatch = matchScore.match(/(\d+)\s*-\s*(\d+)/)
        if (!scoreMatch) {
            return null
        }

        const homeGoals = parseInt(scoreMatch[1], 10)
        const awayGoals = parseInt(scoreMatch[2], 10)
        const totalGoals = homeGoals + awayGoals

        // Calculate threshold: total + 0.5 (expecting +1 goal)
        const threshold = totalGoals + 0.5

        // Determine period based on minute
        // IY: minute <= 45
        // MS: minute > 45
        const period: 'IY' | 'MS' = minute <= 45 ? 'IY' : 'MS'

        // Direction is always ÜST (expecting more goals)
        const direction: 'ÜST' | 'ALT' = 'ÜST'

        // Build calculated prediction string
        const calculatedPrediction = `${period} ${threshold} ${direction}`

        return {
            calculated_prediction: calculatedPrediction,
            prediction_period: period,
            prediction_threshold: threshold,
            prediction_direction: direction,
            goals_at_prediction: totalGoals
        }
    }

    // --- Private Helpers (Ported) ---

    private static base64Decode(str: string): string {
        try {
            const decoded = Buffer.from(str, 'base64').toString('utf-8')
            try {
                return decodeURIComponent(decoded)
            } catch {
                return decoded
            }
        } catch {
            return str
        }
    }

    private static parseSinglePrediction(text: string): any {
        const parsed = UniversalParser.parse(text);

        if (!parsed) {
            console.warn('PredictionService: Failed to parse text via UniversalParser');
            return {
                raw_text: text,
                home_team_name: '',
                away_team_name: '',
                league_name: '',
                prediction_type: '',
                match_minute: null,
                match_score: null,
                is_valid: false
            }
        }

        return {
            raw_text: text,
            home_team_name: parsed.home_team,
            away_team_name: parsed.away_team,
            league_name: parsed.league_name,
            prediction_type: parsed.prediction_type,
            alert_code: parsed.bot_id ? `Bot-${parsed.bot_id}` : '',
            match_minute: parsed.match_minute,
            match_score: parsed.match_score,
            last_goal_minute: parsed.last_goal_minute,

            // Determine technical and display names
            bot_name: `Minute ${parsed.match_minute}`,
            bot_display_name: this.getBotDisplayName(parsed.match_minute)
        }
    }

    private static getBotDisplayName(minute: number): string {
        // ALERT D logic is handled by BotMatchingService usually, but here we set defaults
        if (minute >= 20 && minute <= 24) return 'Code Zero'
        if (minute >= 65 && minute <= 69) return 'BOT 007'
        return `${minute}. Dakika Botu`
    }

    private static parseGroupPrediction(text: string): any[] {
        const predictions: any[] = []
        const lines = text.trim().split('\n')

        for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.includes('GÜNÜN') || trimmed.includes('⚽') || !trimmed) continue

            // Match format: "Team A - Team B → Prediction"
            const groupRegex = /^(.+?)\s*-\s*(.+?)\s*→\s*(.+)$/
            const match = groupRegex.exec(trimmed)

            if (match) {
                predictions.push({
                    home_team_name: match[1].trim(),
                    away_team_name: match[2].trim(),
                    prediction_type: match[3].trim(),
                    raw_text: trimmed,
                })
            }
        }
        return predictions
    }

    // --- Notification Simulation Logic ---

    private static shouldTriggerNotification(p: AIPredictionPayload): boolean {
        return true
    }

    private static simulateNotification(p: AIPredictionPayload) {
        let title = `${p.homeTeam} - ${p.awayTeam}`
        if (p.minute) title = `${p.minute}' ${title}`

        const sender = p.botGroupName || p.botId || 'GoalGPT AI'
        const body = `${sender}: ${p.prediction}`

        const logPayload = {
            event: 'NOTIFICATION_SIMULATION',
            timestamp: new Date().toISOString(),
            target: 'All Active Devices (Simulated)',
            content: {
                title: title,
                body: body,
                sound: 'default',
                badge: 1
            },
            metadata: {
                matchId: p.matchId,
                predictionId: p.matchId
            }
        }

        console.log(JSON.stringify(logPayload, null, 2))
    }
}
