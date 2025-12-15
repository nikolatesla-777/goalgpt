import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { APIFootball } from '@/lib/api-football'
import { GlobalLivescoreService } from '@/lib/services/global-livescore-service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const fixtureId = id
        if (!fixtureId) {
            return NextResponse.json({ error: 'Fixture ID missing' }, { status: 400 })
        }

        // 1. Get Fixture Details (With Failover Strategy)
        let fixture = await APIFootball.getFixtureById(Number(fixtureId))

        // FAILOVER: If direct ID lookup fails (API bug), try fetching today's list
        if (!fixture) {
            console.log(`[PredictionAPI] Direct lookup failed for ${fixtureId}, trying daily list failover...`)
            const today = new Date().toISOString().split('T')[0]
            const dailyFixtures = await APIFootball.getFixturesByDate(today)
            fixture = dailyFixtures.find(f => f.fixture.id === Number(fixtureId)) || null

            // Try tomorrow if not found today (for upcoming matches)
            if (!fixture) {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                const tomorrowStr = tomorrow.toISOString().split('T')[0]
                const tomorrowFixtures = await APIFootball.getFixturesByDate(tomorrowStr)
                fixture = tomorrowFixtures.find(f => f.fixture.id === Number(fixtureId)) || null
            }
        }

        if (!fixture) {
            return NextResponse.json({ error: 'Fixture not found after failover' }, { status: 404 })
        }

        // 2. Get Predictions from Supabase (Last 3 days)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase config missing' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - 3)

        const { data: predictions, error } = await supabase
            .from('predictions_raw')
            .select('*')
            .gte('received_at', dateLimit.toISOString())
            .order('received_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // 3. Find ALL matching predictions (not just first one)
        const homeName = GlobalLivescoreService.normalizeTeamName(fixture.teams.home.name)
        const awayName = GlobalLivescoreService.normalizeTeamName(fixture.teams.away.name)

        const matchedPredictions: any[] = []
        const seenIds = new Set<string>()

        for (const p of predictions || []) {
            const pHome = GlobalLivescoreService.normalizeTeamName(p.home_team_name || '')
            const pAway = GlobalLivescoreService.normalizeTeamName(p.away_team_name || '')

            // Skip empty or very short names
            if (pHome.length < 3 || pAway.length < 3) continue

            const homeMatch = pHome.includes(homeName) || homeName.includes(pHome)
            const awayMatch = pAway.includes(awayName) || awayName.includes(pAway)

            if (homeMatch && awayMatch) {
                // Skip duplicates
                if (seenIds.has(p.id)) continue
                seenIds.add(p.id)

                // Extract prediction text for display
                let displayPrediction = p.prediction_type || ''

                if (!displayPrediction && p.raw_payload?.prediction) {
                    displayPrediction = p.raw_payload.prediction
                }

                if (!displayPrediction && p.prediction_text) {
                    // Parse from prediction_text (look for *bold* patterns)
                    const boldMatch = p.prediction_text.match(/\*([^*]+)\*(?:\s*$|\r|\n)/g)
                    if (boldMatch && boldMatch.length > 0) {
                        const lastBold = boldMatch[boldMatch.length - 1].replace(/\*/g, '').trim()
                        if (lastBold && !lastBold.includes('(') && lastBold.length < 30) {
                            displayPrediction = lastBold
                        }
                    }
                }

                // Determine bot name
                let botName = p.raw_payload?.botGroupName || p.bot_name || 'Unknown Bot'
                if (botName === 'Unknown Bot' && p.prediction_text?.includes('Minute:') && p.prediction_text?.includes('SonGol')) {
                    botName = 'Minute 65 Bot'
                }

                matchedPredictions.push({
                    ...p,
                    display_prediction: displayPrediction || 'Tahmin Mevcut',
                    bot_display_name: botName
                })
            }
        }

        if (matchedPredictions.length > 0) {
            // Return array of ALL predictions for this match
            return NextResponse.json({
                count: matchedPredictions.length,
                predictions: matchedPredictions
            })
        }

        return NextResponse.json({ count: 0, predictions: [] })

    } catch (error) {
        console.error('Error fetching prediction:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
