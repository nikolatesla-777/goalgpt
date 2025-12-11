
import { NextRequest, NextResponse } from 'next/server'
import { PredictionService } from '@/lib/services/prediction-service'
import { AIPredictionPayload, LegacyPredictionPayload } from '@/lib/types/predictions'

export async function POST(request: NextRequest) {
    try {
        // 1. Parse Body first to detect format
        const body = await request.json()

        // 2. Determine if Legacy Format (Id, Date, Prediction)
        const isLegacy = 'Id' in body && 'Prediction' in body

        // 3. API Key validation (optional for legacy, recommended for new)
        const apiKey = request.headers.get('x-api-key')

        // If NOT legacy format, require API key
        // If legacy format, skip API key check for backward compatibility
        if (!isLegacy && !PredictionService.validateApiKey(apiKey)) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized: Invalid API Key' },
                { status: 401 }
            )
        }

        // 4. Process based on format
        let predictions: AIPredictionPayload[] = []

        if (isLegacy) {
            // Legacy Payload (Id, Date, Prediction as Base64)
            console.log('📦 Legacy format detected - processing...')
            const legacyPayload = body as LegacyPredictionPayload
            predictions = PredictionService.parseLegacyPayload(legacyPayload)
        } else {
            // New Payload (structured JSON)
            predictions = [body as AIPredictionPayload]
        }

        // 5. Ingest All
        let successCount = 0
        for (const p of predictions) {
            const result = await PredictionService.ingest(p)
            if (result.success) successCount++
        }

        console.log(`✅ Ingested ${successCount} predictions (${isLegacy ? 'legacy' : 'standard'} format)`)

        // 6. Response
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
