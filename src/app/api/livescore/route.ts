import { NextResponse } from 'next/server'
import { GlobalLivescoreService } from '@/lib/services/global-livescore-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        // Fetch data from the unified service
        const data = await GlobalLivescoreService.fetchGlobalLivescore(true)

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store'
            }
        })
    } catch (error) {
        console.error('Error in livescore API:', error)
        return NextResponse.json({ error: 'Failed to fetch livescore data' }, { status: 500 })
    }
}
