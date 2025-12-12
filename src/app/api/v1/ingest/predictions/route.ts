
import { NextRequest, NextResponse } from 'next/server'
import { PredictionService } from '@/lib/services/prediction-service'
import { AIPredictionPayload, LegacyPredictionPayload } from '@/lib/types/predictions'
import { LoggerService } from '@/lib/services/logger-service'

export async function POST(request: NextRequest) {
    let body: any = {}
    let responseBody: any = {}
    let status = 200

    try {
        // 1. Parse Body
        try {
            body = await request.json()
        } catch (e) {
            status = 400
            responseBody = { success: false, message: 'Invalid JSON body' }

            // Log Log Log
            await LoggerService.logApiRequest({
                endpoint: '/api/v1/ingest/predictions',
                method: 'POST',
                headers: Object.fromEntries(request.headers),
                body: null, // Body parse failed
                response_status: status,
                response_body: responseBody,
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
            })

            return NextResponse.json(responseBody, { status })
        }

        // 2. Determine Format (Case Insensitive)
        const isLegacy = ('Id' in body && 'Prediction' in body) || ('id' in body && 'prediction' in body)

        // 3. API Key validation
        const apiKey = request.headers.get('x-api-key')

        if (!isLegacy && !PredictionService.validateApiKey(apiKey)) {
            status = 401
            responseBody = { success: false, message: 'Unauthorized: Invalid API Key' }
        } else {
            // 4. Process Logic
            let predictions: AIPredictionPayload[] = []

            if (isLegacy) {
                console.log('📦 Legacy format detected - processing...')

                // Normalize keys to PascalCase
                const legacyPayload: LegacyPredictionPayload = {
                    Id: body.Id || body.id,
                    Date: body.Date || body.date,
                    Prediction: body.Prediction || body.prediction
                }

                predictions = PredictionService.parseLegacyPayload(legacyPayload)
            } else {
                predictions = [body as AIPredictionPayload]
            }

            let successCount = 0
            for (const p of predictions) {
                const result = await PredictionService.ingest(p)
                if (result.success) successCount++
            }

            console.log(`✅ Ingested ${successCount} predictions (${isLegacy ? 'legacy' : 'standard'} format)`)

            responseBody = {
                success: true,
                message: 'Prediction received',
                count: successCount,
                type: isLegacy ? 'legacy' : 'standard'
            }
        }

        // Log Success/Fail handled above
        await LoggerService.logApiRequest({
            endpoint: '/api/v1/ingest/predictions',
            method: 'POST',
            headers: Object.fromEntries(request.headers),
            body: body,
            response_status: status,
            response_body: responseBody,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
        })

        return NextResponse.json(responseBody, { status })

    } catch (error) {
        console.error('API Error:', error)
        status = 500
        responseBody = { success: false, message: 'Internal Server Error' }

        await LoggerService.logApiRequest({
            endpoint: '/api/v1/ingest/predictions',
            method: 'POST',
            headers: Object.fromEntries(request.headers),
            body: body,
            response_status: status,
            response_body: responseBody,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
        })

        return NextResponse.json(responseBody, { status })
    }
}
