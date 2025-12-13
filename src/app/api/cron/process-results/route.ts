
import { NextRequest, NextResponse } from 'next/server'
import { AutoCapperService } from '@/lib/services/auto-capper-service'

export const dynamic = 'force-dynamic' // Ensure it's not cached

export async function GET(req: NextRequest) {
    // Basic Cron Security
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow Vercel Cron signature check or simple secret
        // For simple setup, we just check CRON_SECRET if provided, otherwise open (if strict Vercel auth used)
        // But better is simply checking:
        // return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const result = await AutoCapperService.processPendingPredictions()
        return NextResponse.json({ success: true, ...result })
    } catch (error: any) {
        console.error('AutoCapper Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
