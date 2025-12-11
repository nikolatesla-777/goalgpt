
import { NextRequest, NextResponse } from 'next/server'
import { PredictionService } from '@/lib/services/prediction-service'
import { LegacyPredictionPayload } from '@/lib/types/predictions'

/**
 * LEGACY API ROUTE COMPATIBILITY LAYER
 * Matches: [POST] /api/v1.0/data
 * Matches: [GET] /api/v1.0/data/create (via query params)
 */

export async function POST(request: NextRequest) {
    try {
        // Legacy system didn't use x-api-key generally, but we should enforce it if possible.
        // If strict drop-in is needed without auth change, we might need to relax this or check if they send it.
        // For now, let's keep it open or check for a secret query param if legacy did that.
        // The DataController.cs didn't show strict auth attributes on the action, maybe it was global.

        // We will TRY to validate key, but if legacy didn't send it, this might block.
        // Assuming we provide them the new key to add to headers.
        const apiKey = request.headers.get('x-api-key')
        // const authorized = PredictionService.validateApiKey(apiKey) 
        // If we want to be strict. For now, let's just process.

        const body = await request.json()
        const payload = body as LegacyPredictionPayload

        // Use the service to parse and ingest
        const predictions = PredictionService.parseLegacyPayload(payload)

        for (const p of predictions) {
            await PredictionService.ingest(p)
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Legacy API Error:', error)
        return NextResponse.json({ success: false, error: 'Internal User Error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const date = searchParams.get('date')
        const prediction = searchParams.get('prediction')

        if (!id || !prediction) {
            return NextResponse.json({ success: false, error: 'Missing params' }, { status: 400 })
        }

        const payload: LegacyPredictionPayload = {
            Id: parseInt(id),
            Date: date || new Date().toISOString(),
            Prediction: prediction
        }

        const predictions = PredictionService.parseLegacyPayload(payload)
        for (const p of predictions) {
            await PredictionService.ingest(p)
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Internal User Error' }, { status: 500 })
    }
}
