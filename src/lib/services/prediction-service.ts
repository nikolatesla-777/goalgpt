
import { DataProvider } from '../providers/data-provider'
import { AIPredictionPayload, LegacyPredictionPayload, PredictionIngestResult } from '../types/predictions'

import { TeamMatchingService } from './team-matching-service'
import { BotMatchingService } from './bot-matching-service'
import { LiveMatchService } from './live-match-service'

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
            // 2. Resolve Team IDs (Smart Mapping)
            // Ported from Legacy Logic
            const { homeId, awayId } = await TeamMatchingService.matchTeamIds(payload.homeTeam, payload.awayTeam)

            console.log(`🧠 Smart Mapping: ${payload.homeTeam} -> ${homeId || '??'}, ${payload.awayTeam} -> ${awayId || '??'}`)

            // 3. Bot Matching (New Logic)
            // Extract alert code from analysis or raw text if available
            // In legacy, alert code often came in payload, here we might need to regex it out again if not explicit
            // `payload.analysis` often contains "Alert Code: XYZ" from our parser
            let extractedAlertCode = ''
            if (payload.analysis && payload.analysis.includes('Alert Code:')) {
                extractedAlertCode = payload.analysis.split('Alert Code:')[1].trim()
            }

            const botMatch = await BotMatchingService.matchBot({
                minute: payload.minute,
                alertCode: extractedAlertCode,
                fullText: payload.rawText
            })

            if (botMatch) {
                console.log(`🤖 Bot Identified: ${botMatch.name} (${botMatch.id})`)
            } else {
                console.log('🤖 No specific bot matched (using default)')
            }

            // 4. Link to Live Match (TheSports) - NEW
            let theSportsMatchId: string | null = null

            // Note: TeamMatchingService returns whatever ID is in our 'teams' table.
            // Our 'sync-teams.js' populates 'external_id' column with TheSports ID, BUT
            // 'TeamMatchingService.matchTeamIds' logic returns 'external_id' (legacy logic implies this).
            // Let's verify TeamService output:
            // "return { homeId: this.findBestMatch(...), ... }" -> findBestMatch returns team.external_id
            // So 'homeId' IS the TheSports ID (or legacy ID). Assuming it's compatible.

            if (homeId && awayId) {
                theSportsMatchId = await LiveMatchService.findMatchForPrediction(homeId, awayId)
            }

            // Extending payload type on the fly for Supabase Provider:
            const enrichedPayload = {
                ...payload,
                homeTeamId: homeId,
                awayTeamId: awayId,
                botGroupId: botMatch?.id || null,
                botGroupName: botMatch?.name || null,
                matchUuid: theSportsMatchId || null
            }

            await DataProvider.addPrediction(enrichedPayload as any)

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
            const decoded = Buffer.from(str, 'base64').toString('utf-8')
            try {
                // Legacy sometimes sends URL encoded text inside Base64 (e.g. %E2%9A%BD)
                return decodeURIComponent(decoded)
            } catch {
                return decoded
            }
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

            // Try Cenkler format first: 00079⚽ *Team1 - Team2  ( 0 - 0 )*
            const cenklerMatch = trimmed.match(/\*([^*]+?)\s*-\s*([^*(]+?)\s*\(/)
            if (cenklerMatch) {
                result.home_team_name = cenklerMatch[1].trim()
                result.away_team_name = cenklerMatch[2].trim()
                continue
            }

            // Standard format: Team A - Team B (1-0)
            const matchRegex = /^(.+?)\s*-\s*(.+?)\s*\((\d+-\d+)\)$/
            const matchResult = matchRegex.exec(trimmed)
            if (matchResult) {
                result.home_team_name = matchResult[1].trim()
                result.away_team_name = matchResult[2].trim()
                continue
            }

            // Extract league from 🏟 line
            if (trimmed.startsWith('🏟')) {
                const leaguePart = trimmed.replace('🏟', '').trim()
                if (leaguePart.includes('-')) {
                    const parts = leaguePart.split('-')
                    result.league_name = parts.slice(1).join('-').trim() || leaguePart
                } else {
                    result.league_name = leaguePart
                }
                continue
            }

            if (trimmed.toLowerCase().startsWith('alertcode:') || trimmed.toLowerCase().startsWith('alert code:')) {
                result.alert_code = trimmed.replace(/alert\s*code:\s*/i, '').trim()
                continue
            }

            // Prediction type logic (e.g., IY Gol, +1 Gol, MS 1, etc.)
            if (trimmed.startsWith('❗')) {
                result.prediction_type = trimmed.replace('❗', '').trim()
                continue
            }

            if (trimmed.match(/^(\+?\d|IY|MS|KG|ÜST|ALT)/i)) {
                result.prediction_type = trimmed
                continue
            }

            if (trimmed && !result.league_name && !trimmed.includes(':') && !trimmed.includes('-') && !trimmed.startsWith('⏰') && !trimmed.startsWith('👉')) {
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
