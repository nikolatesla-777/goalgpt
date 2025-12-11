
import { NextResponse } from 'next/server'
import { DataProvider } from '@/lib/providers/data-provider'

export const dynamic = 'force-dynamic' // Ensure Vercel doesn't cache this

export async function GET() {
    try {
        const predictions = await DataProvider.getPredictions(50) // Get last 50
        return NextResponse.json({ success: true, data: predictions })
    } catch (error) {
        console.error('Live Fetch Error:', error)
        return NextResponse.json({ success: false, data: [] })
    }
}
