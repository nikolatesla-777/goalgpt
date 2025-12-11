
import { DataProvider } from '../providers/data-provider'
import { AIPredictionPayload, LegacyPredictionPayload, PredictionIngestResult } from '../types/predictions'

export class PredictionService {

    /**
     * Validate incoming API KEY
     */
    static validateApiKey(key: string | null): boolean {
        // Allow both the new key and potentially legacy keys if we want to migrate smoothly
        // For now, sticking to the one we defined
        const VALID_KEY = process.env.GOALGPT_API_KEY || 'fake-api-key-dev-123'
        return key === VALID_KEY
    }

    /**
     * Ingest a new prediction (supports both structured and legacy)
     */
    static async ingest(payload: AIPredictionPayload): Promise<PredictionIngestResult> {
        try {
            // 2. Add to Data Provider
            await DataProvider.addPrediction(payload)

            // 3. Simulate Notification Flow (Log to console for Vercel logs)
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
                matchId: `${legacy.Id}-${item.home_team_name}-${item.away_team_name}`, // Composite ID
                homeTeam: item.home_team_name,
                awayTeam: item.away_team_name,
                league: 'Unknown', // Group format doesn't technically specify league per item usually
                prediction: item.prediction_type,
                odds: 0, // Not in simple group text
                confidence: 0,
                analysis: item.raw_text,
                timestamp: timestamp,
                originalId: legacy.Id,
                rawText: item.raw_text
            }))
        } else {
            const parsed = this.parseSinglePrediction(decodedText)
            return [{
                matchId: String(legacy.Id),
                homeTeam: parsed.home_team_name,
                awayTeam: parsed.away_team_name,
                league: parsed.league_name,
                prediction: parsed.prediction_type,
                odds: 0, // Legacy text often doesn't have odds explicitly unless parsed further
                confidence: 0,
                analysis: parsed.alert_code ? `Alert Code: ${parsed.alert_code}` : '',
                timestamp: timestamp,
                originalId: legacy.Id,
                rawText: parsed.raw_text
            }]
        }
    }

    // --- Private Helpers (Ported) ---

    private static base64Decode(str: string): string {
        try {
            return Buffer.from(str, 'base64').toString('utf-8')
        } catch {
            return str
        }
    }

    private static parseSinglePrediction(text: string): any {
        const lines = text.trim().split('\n')
        const result: any = {
            raw_text: text,
            home_team_name: '',
            away_team_name: '',
            league_name: '',
            prediction_type: '',
            alert_code: '',
        }

        for (const line of lines) {
            const trimmed = line.trim()
            const matchRegex = /^(.+?)\s*-\s*(.+?)\s*\((\d+-\d+)\)$/ // Team A - Team B (1-0)
            const matchResult = matchRegex.exec(trimmed)

            if (matchResult) {
                result.home_team_name = matchResult[1].trim()
                result.away_team_name = matchResult[2].trim()
                continue
            }

            if (trimmed.toLowerCase().startsWith('alertcode:') || trimmed.toLowerCase().startsWith('alert code:')) {
                result.alert_code = trimmed.replace(/alert\s*code:\s*/i, '').trim()
                continue
            }

            // Prediction type logic
            if (trimmed.match(/^\+?\d|^IY|^MS|^KG|^ÜST|^ALT/i)) {
                result.prediction_type = trimmed
                continue
            }

            if (trimmed && !result.league_name && !trimmed.includes(':') && !trimmed.includes('-')) {
                result.league_name = trimmed
            }
        }
        return result
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
    } // End of parseLegacyPayload

    // --- Notification Simulation Logic ---

    private static shouldTriggerNotification(p: AIPredictionPayload): boolean {
        // Simple rule: Trigger if confidence > 0 (all predictions in legacy seemed to notify)
        return true
    }

    private static simulateNotification(p: AIPredictionPayload) {
        // Replicating Legacy 'PredictionPublishedComposer.cs'
        // Title: Min' Home - Away (Score) -> We might not have score? legacy payload has it in raw text
        // Body: "{Sender}: {Prediction}"

        let title = `${p.homeTeam} - ${p.awayTeam}`
        if (p.minute) title = `${p.minute}' ${title}`
        // if (score) title += ` (${score})` -> parsed from raw text in simulation if needed

        // Sender fallback
        const sender = p.botId || 'GoalGPT AI'
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
