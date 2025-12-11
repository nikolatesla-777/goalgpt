
import { NextRequest, NextResponse } from 'next/server'
import { PredictionService } from '@/lib/services/prediction-service'
import { AIPredictionPayload, LegacyPredictionPayload } from '@/lib/types/predictions'

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate
        const apiKey = request.headers.get('x-api-key')
        if (!PredictionService.validateApiKey(apiKey)) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Invalid API Key' },
                { status: 401 }
            )
        }

        // 2. Parse Body
        const body = await request.json()

        // 3. Determine Payload Type & Process
        let predictions: AIPredictionPayload[] = []
        let isLegacy = false

        if ('Id' in body && 'Prediction' in body) {
            // Legacy Payload
            isLegacy = true
            const legacyPayload = body as LegacyPredictionPayload
            predictions = PredictionService.parseLegacyPayload(legacyPayload)
        } else {
            // New Payload
            predictions = [body as AIPredictionPayload]
        }

        // 4. Ingest All
        let successCount = 0
        for (const p of predictions) {
            const result = await PredictionService.ingest(p)
            if (result.success) successCount++
        }

        // 5. Response (Legacy compatible format if needed)
        return NextResponse.json({
            success: true,
            message: 'Prediction received',
            count: successCount,
            type: isLegacy ? 'legacy' : 'standard'
        }, { status: 200 })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json(
            { success: false, message: 'Invalid request body or internal error' },
            { status: 400 }
        )
    }
}
