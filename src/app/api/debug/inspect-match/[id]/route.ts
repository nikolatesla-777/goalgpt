import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GlobalLivescoreService } from '@/lib/services/global-livescore-service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const fixtureId = id
    const report: any = { fixtureId, steps: [] }

    try {
        // 1. Manual API Fetch to see RAW Response
        report.steps.push('Fetching fixture via RAW fetch...')
        const apiKey = process.env.API_FOOTBALL_KEY
        if (!apiKey) {
            report.error = 'API Key Missing in Env'
            return NextResponse.json(report)
        }

        const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`, {
            headers: {
                'x-rapidapi-host': 'v3.football.api-sports.io',
                'x-rapidapi-key': apiKey
            },
            next: { revalidate: 0 }
        })

        const apiData = await res.json()
        report.apiRawResponse = {
            status: res.status,
            ok: res.ok,
            results: apiData.results,
            errors: apiData.errors,
            responseLength: apiData.response ? apiData.response.length : 0
        }

        if (apiData.response && apiData.response.length > 0) {
            report.fixture = {
                home: apiData.response[0].teams.home.name,
                away: apiData.response[0].teams.away.name,
                id: apiData.response[0].fixture.id
            }
        } else {
            report.error = 'API returned empty response'
            // Still proceed to test Logic with HARDCODED values if API fails
            report.steps.push('Using Hardcoded Fixture for Logic Testing...')
            report.fixture = {
                home: "Dender", // As seen in find-fixture
                away: "Club Brugge KV",
                id: Number(fixtureId)
            }
        }

        // 2. Get Recent Predictions (General)
        report.steps.push('Fetching last 100 predictions...')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        const supabase = createClient(supabaseUrl!, supabaseKey!)

        const { data: predictions } = await supabase
            .from('predictions_raw')
            .select('*')
            .order('received_at', { ascending: false })
            .limit(100)

        report.predictionsCount = predictions?.length || 0

        // 3. Try Strict Matching (V4)
        report.steps.push('Running Service Matching Logic...')
        let matchedPrediction = null
        let matchMethod = 'NONE'

        if (predictions && report.fixture.id) {
            // Reconstruct full fixture object for service
            const fullFixture = {
                fixture: { id: report.fixture.id, status: { short: 'FT' } }, // Status doesn't matter for matching
                teams: {
                    home: { name: report.fixture.home },
                    away: { name: report.fixture.away }
                },
                league: { name: apiData.response[0]?.league?.name || '' }
            }

            matchedPrediction = GlobalLivescoreService.findPredictionForFixture(
                fullFixture as any,
                (predictions || []) as any[]
            )

            if (matchedPrediction) {
                matchMethod = 'STRICT_SERVICE'
            } else {
                // FALLBACK Logic
                const homeName = GlobalLivescoreService.normalizeTeamName(report.fixture.home)
                const awayName = GlobalLivescoreService.normalizeTeamName(report.fixture.away)

                for (const p of predictions) {
                    const pHome = GlobalLivescoreService.normalizeTeamName(p.home_team_name || '')
                    const pAway = GlobalLivescoreService.normalizeTeamName(p.away_team_name || '')

                    const homeMatch = pHome.includes(homeName) || homeName.includes(pHome)
                    const awayMatch = pAway.includes(awayName) || awayName.includes(pAway)

                    if (homeMatch && awayMatch) {
                        matchedPrediction = p
                        matchMethod = 'FALLBACK_NAME'
                        break
                    }
                }
            }
        }

        return NextResponse.json({
            ...report,
            matchResult: {
                found: !!matchedPrediction,
                method: matchMethod,
                prediction: matchedPrediction
            }
        }, { status: 200 })

    } catch (e: any) {
        report.error = 'Exception: ' + e.message
        return NextResponse.json(report, { status: 500 })
    }
}
