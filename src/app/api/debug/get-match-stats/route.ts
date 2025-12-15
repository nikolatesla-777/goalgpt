import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const fixtureId = searchParams.get('id')

    if (!fixtureId) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const apiKey = process.env.API_FOOTBALL_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API Key' }, { status: 500 })

    try {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures/statistics?fixture=${fixtureId}`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey
            },
            next: { revalidate: 0 }
        })
        const data = await res.json()
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
