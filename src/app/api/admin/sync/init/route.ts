import { NextRequest, NextResponse } from 'next/server'
import { LivescoreIngestService } from '@/lib/services/livescore-ingest'

export const dynamic = 'force-dynamic' // No caching

export async function GET(req: NextRequest) {
    try {
        // Clean up Authorization check for local testing ease
        // const authHeader = req.headers.get('authorization')
        // if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) { ... }

        const { searchParams } = new URL(req.url)
        const date = searchParams.get('date') || undefined

        const result = await LivescoreIngestService.syncDailyMatches(date)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error', details: error }, { status: 500 })
    }
}
