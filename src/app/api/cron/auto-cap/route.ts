import { NextResponse } from 'next/server'
import { AutoCapperService } from '@/lib/services/auto-capper-service'

// Vercel Cron: This endpoint is called every minute by Vercel Cron
// Configure in vercel.json: "crons": [{ "path": "/api/cron/auto-cap", "schedule": "* * * * *" }]

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30 seconds max

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In development, allow without secret
    if (process.env.NODE_ENV === 'development') return true

    // Vercel Cron sends Authorization header
    if (authHeader === `Bearer ${cronSecret}`) return true

    return false
}

export async function GET(request: Request) {
    // Verify this is a legitimate cron call
    if (!verifyCronSecret(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[AutoCap Cron] Starting prediction evaluation...')
    const startTime = Date.now()

    try {
        const result = await AutoCapperService.processPendingPredictions()

        const duration = Date.now() - startTime
        console.log(`[AutoCap Cron] Completed in ${duration}ms - Processed: ${result.processed}, Updated: ${result.updates}`)

        return NextResponse.json({
            success: true,
            processed: result.processed,
            updated: result.updates,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('[AutoCap Cron] Error:', error)
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 })
    }
}
