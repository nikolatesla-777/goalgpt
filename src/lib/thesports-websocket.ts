import mqtt from 'mqtt'
import { EventEmitter } from 'events'

// Configuration derived from User Screenshots
const PROTOCOL = 'wss'
const HOST = 'mq.thesports.com'
const PATH = '/mqtt'
// Note: MQTT over WS usually uses /mqtt path. Screenshot says "Realized by mqtt's websocket protocol".
// Domain: mq.thesports.com

const DEFAULT_TOPIC = 'thesports/football/match/v1'
// Deduced from screenshot console output: "thesports/football/match/v1"

export interface LiveMatchUpdate {
    uuid: string // match_id
    status: number // match_status
    status_short?: string // mapped status
    minute?: number
    score: {
        home: number
        away: number
    }
    stats?: {
        red_cards: { home: number, away: number }
        yellow_cards: { home: number, away: number }
        corners: { home: number, away: number }
    }
}

export class TheSportsWebSocketClient extends EventEmitter {
    private client: mqtt.MqttClient | null = null
    private isConnected = false
    private topic: string

    constructor() {
        super()
        const user = process.env.THESPORTS_API_USER
        const secret = process.env.THESPORTS_API_SECRET
        const topic = process.env.THESPORTS_WS_TOPIC || DEFAULT_TOPIC

        if (!user || !secret) {
            throw new Error('Missing TheSports API credentials (THESPORTS_API_USER, THESPORTS_API_SECRET)')
        }

        this.topic = topic
    }

    public connect() {
        if (this.client) {
            this.client.end()
        }

        const user = process.env.THESPORTS_API_USER
        const secret = process.env.THESPORTS_API_SECRET

        const connectUrl = `${PROTOCOL}://${HOST}${PATH}`
        console.log(`[TheSportsMQTT] Connecting to ${connectUrl}...`)

        this.client = mqtt.connect(connectUrl, {
            username: user,
            password: secret,
            clientId: `goalgpt_${Math.random().toString(16).slice(2, 8)}`,
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000,
        })

        this.client.on('connect', () => {
            console.log('[TheSportsMQTT] Connected')
            this.isConnected = true
            this.subscribe()
        })

        this.client.on('message', (topic, payload) => {
            this.onMessage(topic, payload)
        })

        this.client.on('error', (err) => {
            console.error('[TheSportsMQTT] Error:', err.message)
        })

        this.client.on('close', () => {
            if (this.isConnected) {
                console.log('[TheSportsMQTT] Disconnected')
                this.isConnected = false
            }
        })
    }

    private subscribe() {
        if (!this.client || !this.isConnected) return

        console.log(`[TheSportsMQTT] Subscribing to: ${this.topic}`)
        this.client.subscribe([this.topic], () => {
            console.log(`[TheSportsMQTT] Subscribed to ${this.topic}`)
        })
    }

    private onMessage(topic: string, payload: Buffer) {
        try {
            const msgStr = payload.toString()
            // Log full raw payload to analyze structure for Team Names
            if (msgStr.length < 2000) console.log(`[TheSportsMQTT] RAW:`, msgStr)


            const data = JSON.parse(msgStr)

            // Expected data structure from screenshot:
            // [{id: '...', score: [...], stats: [...]}]
            // It seems to be an ARRAY of updates.

            if (Array.isArray(data)) {
                data.forEach(matchUpdate => {
                    this.processMatchUpdate(matchUpdate)
                })
            } else {
                // Single object fallback
                this.processMatchUpdate(data)
            }

        } catch (e) {
            console.error('[TheSportsMQTT] Parse Error:', e)
        }
    }

    private processMatchUpdate(data: any) {
        // Data structure based on logs:
        // {"id":"...","score":["ID", StatusID, [HomeData...], [AwayData...], Timestamp, String]}

        let homeScore = 0
        let awayScore = 0
        let statusId = 0
        let timestamp = 0
        let minute = 0

        // Check if data.score is the main array we want
        if (data.score && Array.isArray(data.score) && data.score.length >= 5) {
            // data.score[1] is Status
            statusId = Number(data.score[1]) || 0

            // data.score[2] is Home Stats Array
            // data.score[3] is Away Stats Array
            // Based on logs: [1,1,0,0,SCORE,0,0] -> Index 4 seems to be score
            const homeArr = data.score[2]
            const awayArr = data.score[3]

            if (Array.isArray(homeArr) && homeArr.length > 4) homeScore = Number(homeArr[4]) || 0
            if (Array.isArray(awayArr) && awayArr.length > 4) awayScore = Number(awayArr[4]) || 0

            // data.score[4] is Timestamp (Period Start)
            timestamp = Number(data.score[4]) || 0

            // Calculate Minute
            if (timestamp > 0) {
                const now = Math.floor(Date.now() / 1000)
                const diff = Math.max(0, now - timestamp)
                const diffMin = Math.floor(diff / 60)

                // Status Mapping Logic for Base Minute
                // 2=1H, 4=2H, 5=ET?
                if (statusId === 2) { // 1H
                    minute = diffMin
                    if (minute > 45) minute = 45 + (minute - 45) // Logic is same but for display
                } else if (statusId === 4) { // 2H
                    minute = 45 + diffMin
                } else if (statusId === 5) { // ET
                    minute = 90 + diffMin
                }
            }
        } else {
            // Fallback or other generic updates (stats only?)
            // If just stats update, we might not get score.
            // For now, only process 'score' updates fully.
            return
        }

        console.log(`[TheSportsMQTT] Match: ${data.id} | Score: ${homeScore}-${awayScore} | Min: ${minute} | Sts: ${statusId}`)

        // Emit update event
        const update: LiveMatchUpdate = {
            uuid: String(data.id),
            status: statusId,
            status_short: this.mapStatus(statusId),
            minute: minute,
            score: {
                home: homeScore,
                away: awayScore
            }
        }

        this.emit('update', update, data)
    }

    private mapStatus(statusId: number): string {
        const map: Record<number, string> = {
            1: 'NS', 2: '1H', 3: 'HT', 4: '2H', 5: 'ET', 7: 'PEN', 8: 'FT'
        }
        return map[statusId] || 'LIVE'
    }
}
