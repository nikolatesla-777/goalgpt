import { NextRequest, NextResponse } from 'next/server'
import { LivescoreIngestService } from '@/lib/services/livescore-ingest'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const result = await LivescoreIngestService.syncLiveMatches()
    return NextResponse.json(result)
}
