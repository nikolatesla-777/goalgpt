'use server'

import { createClient } from '@supabase/supabase-js'
import { parsePredictionDetails } from '@/lib/utils/prediction-parser'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface AdminPrediction {
    id: string
    // TARİH: 15.12.25 alt satır 05:21
    dateFormatted: string      // "15.12.25"
    timeFormatted: string      // "05:21"
    // BOT: Parser'dan gelen bot ismi
    botName: string            // "Code Zero", "BOT 007", "ALERT: D"
    // LİG: Ülke + Lig adı
    league: string
    leagueFlag: string
    // TAKIMLAR: Tam isim
    homeTeam: string
    awayTeam: string
    homeTeamId: string | number | null
    awayTeamId: string | number | null
    // SKOR: Anlık skor + maç durumu
    currentScore: string       // "6-0"
    matchStatus: 'live' | 'ht' | 'ft' | 'pending'  // Canlı/Devre arası/Bitti
    matchStatusText: string    // "MS", "IY", "CANLI", ""
    // TAHMİN: İki satırlı gösterim
    prediction: string         // "IY 0.5 ÜST"
    predictionMinute: number   // 10
    predictionScore: string    // "0-0"
    // DURUM
    result: 'pending' | 'won' | 'lost'
    isVip: boolean
    rawText: string
}

// Bot Display Name Mapping (dakikaya göre)
function getBotDisplayName(minute: number | null, botGroupName: string | null, rawText: string): string {
    // Öncelik 1: Cenklerden gelen botGroupName (ALERT: D gibi)
    if (botGroupName) return botGroupName

    // Öncelik 2: AlertCode'dan
    const alertMatch = rawText.match(/AlertCode:\s*([^\s]+)/i)
    if (alertMatch) return `ALERT: ${alertMatch[1]}`

    // Öncelik 3: Dakikaya göre mapping
    if (minute !== null) {
        if (minute >= 20 && minute <= 24) return 'Code Zero'
        if (minute >= 65 && minute <= 69) return 'BOT 007'
        return `${minute}. Dakika Botu`
    }

    return 'AI Bot'
}

// Parse prediction type from raw text (extracted from PredictionService)
function parsePredictionFromRawText(text: string): string {
    if (!text) return ''

    // 1. First try extracting from *bold* patterns (last one is usually the prediction)
    const boldMatches = text.match(/\*([^*]+)\*/g)
    if (boldMatches && boldMatches.length > 0) {
        for (let i = boldMatches.length - 1; i >= 0; i--) {
            const content = boldMatches[i].replace(/\*/g, '').trim()
            // Skip if it looks like a match header (contains "-" and "(")
            if (!content.includes('(') && !content.includes(')') && content.length < 30) {
                // Check if it looks like a prediction
                if (/\d+\.?\d*\s*(ÜST|UST|ALT|OVER|UNDER)/i.test(content) ||
                    /IY\s*(GOL|0\.5|1\.5)/i.test(content) ||
                    /KG\s*(VAR|YOK)/i.test(content) ||
                    content.match(/^[\d.]+\s+(ÜST|UST)$/i)) {
                    return content
                }
            }
        }
    }

    // 2. Try ❗ prefix pattern
    const exclamationMatch = text.match(/❗\s*([^\n]+)/i)
    if (exclamationMatch) {
        const pred = exclamationMatch[1].trim()
        if (pred.length < 30) return pred
    }

    // 3. Try common prediction patterns anywhere in text
    const patterns = [
        /(\d+\.?\d*)\s*(ÜST|UST|ALT|OVER|UNDER)/i,
        /IY\s*(GOL|0\.5|1\.5)/i,
        /KG\s*(VAR|YOK)/i
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[0]
    }

    // 4. Default based on minute (if IY period, assume IY Gol)
    const minuteMatch = text.match(/(?:Minute:|⏰)\s*(\d+)/i)
    if (minuteMatch) {
        const minute = parseInt(minuteMatch[1], 10)
        if (minute <= 45) return 'IY Gol'
    }

    return ''
}

// Calculate prediction display format using minute and score
// Same logic as prediction-service.ts calculatePrediction
function calculatePredictionDisplay(pred: string, minute: number | null, score: string): string {
    if (!pred) return ''

    const p = pred.trim()

    // Check if it's a generic prediction that needs calculation
    const isGenericPrediction = /^(IY|HT)\s*(GOL|0\.5)/i.test(p) ||
        /İLK\s*YARI\s*GOL/i.test(p)

    if (isGenericPrediction && minute !== null && score) {
        // Parse score: "0-0" → [0, 0]
        const scoreMatch = score.match(/(\d+)\s*-\s*(\d+)/)
        if (scoreMatch) {
            const homeGoals = parseInt(scoreMatch[1], 10)
            const awayGoals = parseInt(scoreMatch[2], 10)
            const totalGoals = homeGoals + awayGoals

            // Calculate threshold: total + 0.5
            const threshold = totalGoals + 0.5

            // Determine period: IY if minute <= 45, else MS
            const period = minute <= 45 ? 'IY' : 'MS'

            return `${period} ${threshold} ÜST`
        }
    }

    // Normalize Turkish characters: UST → ÜST
    if (/\d+\.5\s*UST$/i.test(p)) {
        return p.replace(/UST$/i, 'ÜST')
    }

    return p
}

// Country flag mapping
function getCountryFlag(country: string | null | undefined, league: string | null): string {
    const c = (country || league || '').toLowerCase()

    if (c.includes('romania')) return '🇷🇴'
    if (c.includes('australia')) return '🇦🇺'
    if (c.includes('malaysia')) return '🇲🇾'
    if (c.includes('ethiopia')) return '🇪🇹'
    if (c.includes('austria')) return '🇦🇹'
    if (c.includes('hong kong')) return '🇭🇰'
    if (c.includes('france')) return '🇫🇷'
    if (c.includes('usa') || c.includes('united states') || c.includes('mls')) return '🇺🇸'
    if (c.includes('england') || c.includes('premier league')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿'
    if (c.includes('spain') || c.includes('la liga')) return '🇪🇸'
    if (c.includes('germany') || c.includes('bundesliga')) return '🇩🇪'
    if (c.includes('italy') || c.includes('serie a')) return '🇮🇹'
    if (c.includes('turkey') || c.includes('türkiye') || c.includes('turkiye')) return '🇹🇷'
    if (c.includes('japan')) return '🇯🇵'
    if (c.includes('argentina')) return '🇦🇷'
    if (c.includes('bolivia')) return '🇧🇴'
    if (c.includes('portugal')) return '🇵🇹'
    if (c.includes('israel')) return '🇮🇱'
    if (c.includes('algeria')) return '🇩🇿'
    if (c.includes('cyprus')) return '🇨🇾'
    if (c.includes('scotland')) return '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
    if (c.includes('andorra')) return '🇦🇩'
    if (c.includes('ghana')) return '🇬🇭'
    if (c.includes('korea')) return '🇰🇷'
    if (c.includes('china')) return '🇨🇳'
    if (c.includes('brazil')) return '🇧🇷'
    if (c.includes('netherlands') || c.includes('holland')) return '🇳🇱'
    if (c.includes('belgium')) return '🇧🇪'

    return '⚽'
}

export async function getAdminPredictions(limit = 100): Promise<AdminPrediction[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('predictions_raw')
            .select('*')
            .order('received_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching admin predictions:', error)
            return []
        }

        return (data || []).map((row: any) => {
            const rawText = row.prediction_text || ''
            const details = parsePredictionDetails(rawText)
            const payload = row.raw_payload || {}

            // TARİH: 15.12.25 formatı
            const dateObj = new Date(row.received_at)
            const day = dateObj.getDate().toString().padStart(2, '0')
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
            const year = dateObj.getFullYear().toString().slice(-2)
            const hours = dateObj.getHours().toString().padStart(2, '0')
            const minutes = dateObj.getMinutes().toString().padStart(2, '0')

            // BOT: Parser'dan gelen veya mapping'den
            const predMinute = row.match_minute || payload.minute || parseInt(details.minute) || null
            const botName = getBotDisplayName(predMinute, payload.botGroupName, rawText)

            // LİG
            const league = row.league_name || payload.league || details.league || 'Unknown'
            const country = details.country || ''
            const leagueFlag = getCountryFlag(country, league)

            // SKOR ve MATCH STATUS
            const hasResult = row.result === 'won' || row.result === 'lost'
            const finalScore = row.final_score || null

            // Tahmin anındaki skor (parse'dan veya payload'dan)
            const predictionTimeScore = payload.matchScore || details.score || '0-0'

            // Anlık/Final skor
            let currentScore = predictionTimeScore
            let matchStatus: 'live' | 'ht' | 'ft' | 'pending' = 'pending'
            let matchStatusText = ''

            if (hasResult && finalScore) {
                currentScore = finalScore
                matchStatus = 'ft'
                matchStatusText = 'MS'
            } else if (!hasResult) {
                matchStatus = 'pending'
                matchStatusText = ''
            }

            // TAHMİN formatı - ÖNCELİKLE DB'den, yoksa raw text'ten parse et
            let prediction = row.prediction_type || payload.prediction || ''
            if (!prediction) {
                prediction = parsePredictionFromRawText(rawText)
            }
            // Calculate proper prediction using minute and score (IY Gol → IY 0.5 ÜST)
            prediction = calculatePredictionDisplay(prediction, predMinute, predictionTimeScore)

            const predictionMinuteNum = predMinute || 0
            const predictionScoreStr = predictionTimeScore.replace(/\s/g, '')

            // RESULT
            const result = (row.result === 'won' || row.status === 'won') ? 'won' :
                (row.result === 'lost' || row.status === 'lost') ? 'lost' : 'pending'

            return {
                id: row.external_id || row.id.toString(),
                dateFormatted: `${day}.${month}.${year}`,
                timeFormatted: `${hours}:${minutes}`,
                botName: botName,
                league: league,
                leagueFlag: leagueFlag,
                homeTeam: row.home_team_name || details.homeTeam || 'Unknown',
                awayTeam: row.away_team_name || details.awayTeam || 'Unknown',
                homeTeamId: payload.homeTeamId || null,
                awayTeamId: payload.awayTeamId || null,
                currentScore: currentScore,
                matchStatus: matchStatus,
                matchStatusText: matchStatusText,
                prediction: prediction,
                predictionMinute: predictionMinuteNum,
                predictionScore: predictionScoreStr,
                result: result,
                isVip: true,
                rawText: rawText
            }
        })
    } catch (e) {
        console.error('Server Action Error:', e)
        return []
    }
}
