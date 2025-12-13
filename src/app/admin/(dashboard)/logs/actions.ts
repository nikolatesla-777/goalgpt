'use server'

import { createClient } from '@supabase/supabase-js'
import { parsePredictionDetails } from '@/lib/utils/prediction-parser'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface ApiLog {
    id: number
    created_at: string
    endpoint: string
    method: string
    headers: any
    body: any
    response_status: number
    response_body: any
    ip_address: string
    decoded?: {
        teams: string
        score: string
        minute: string
        league: string
    }
}

export async function getApiLogs(limit = 50): Promise<ApiLog[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('api_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching API logs:', error)
            return []
        }

        // Map and decode if prediction exists
        const logsWithDecoding = (data || []).map((log: any) => {
            let decoded = undefined
            // Check if body has prediction field
            const rawPrediction = log.body?.prediction || log.body?.prediction_text

            if (rawPrediction && typeof rawPrediction === 'string') {
                try {
                    // Step 1: Base64 decode
                    const base64Decoded = Buffer.from(rawPrediction, 'base64').toString('utf-8')
                    // Step 2: URL decode
                    const urlDecoded = decodeURIComponent(base64Decoded)
                    // Step 3: Parse the decoded text
                    const details = parsePredictionDetails(urlDecoded)
                    decoded = {
                        teams: `${details.homeTeam || 'Unknown'} - ${details.awayTeam || 'Unknown'}`,
                        score: details.score || '-',
                        minute: details.minute || '-',
                        league: details.league || '-'
                    }
                } catch (decodeError) {
                    // If decoding fails, try parsing raw (maybe it's not encoded)
                    const details = parsePredictionDetails(rawPrediction)
                    decoded = {
                        teams: `${details.homeTeam || 'Unknown'} - ${details.awayTeam || 'Unknown'}`,
                        score: details.score || '-',
                        minute: details.minute || '-',
                        league: details.league || '-'
                    }
                }
            }

            return {
                ...log,
                decoded
            }
        })

        return logsWithDecoding as ApiLog[]
    } catch (e) {
        console.error('Server Action Error (getApiLogs):', e)
        return []
    }
}
