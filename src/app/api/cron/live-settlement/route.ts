
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { APIFootball, APIFootballFixture } from '@/lib/api-football'
import { PredictionEvaluator } from '@/lib/prediction-evaluator'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max for Vercel Pro

/**
 * LIVE SETTLEMENT ENDPOINT
 * 
 * Runs frequently to check pending predictions against live match scores.
 * Uses PredictionEvaluator for dynamic "Cenkler Formula" resolution.
 */
export async function GET(request: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch ALL PENDING predictions from last 48 hours
        const twoDaysAgo = new Date()
        twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

        const { data: pendingPreds, error } = await supabase
            .from('predictions_raw')
            .select('*')
            .or('result.eq.pending,result.is.null')
            .gte('received_at', twoDaysAgo.toISOString())

        if (error || !pendingPreds || pendingPreds.length === 0) {
            return NextResponse.json({ message: 'No pending predictions found', count: 0 })
        }

        console.log(`[Live Settlement] Found ${pendingPreds.length} pending predictions`)

        // 2. Fetch LIVE + FINISHED fixtures from API-Football (3 days window)
        // We look at yesterday/today/tomorrow to catch all timezones
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // Parallel fetch for speed
        const [todayFixtures, yesterdayFixtures] = await Promise.all([
            APIFootball.getFixturesByDate(today),
            APIFootball.getFixturesByDate(yesterday)
        ])

        const allFixtures = [...todayFixtures, ...yesterdayFixtures]

        console.log(`[Live Settlement] Loaded ${allFixtures.length} fixtures context`)

        const updates: any[] = []
        let matchedCount = 0
        let settledCount = 0

        // 3. Process each pending prediction
        for (const pred of pendingPreds) {

            // Find Match (Robust Logic)
            const matchedFixture = findMatchingFixture(pred, allFixtures)

            if (!matchedFixture) {
                // If match not found, skip silently (maybe it's next week)
                continue
            }

            matchedCount++

            // Evaluate
            const evaluation = PredictionEvaluator.evaluate(
                pred.prediction_type || '', // "IY 0.5 ÜST"
                matchedFixture.goals.home ?? 0,
                matchedFixture.goals.away ?? 0,
                matchedFixture.score.halftime.home ?? 0,
                matchedFixture.score.halftime.away ?? 0,
                matchedFixture.fixture.status.short // '1H', 'HT', 'FT' etc.
            )

            // If result determined (WON/LOST), update DB
            if (evaluation.result === 'won' || evaluation.result === 'lost') {
                updates.push(
                    supabase.from('predictions_raw')
                        .update({
                            result: evaluation.result,
                            result_log: evaluation.log,
                            status: 'finished', // Internal flow status
                            resulted_at: new Date().toISOString(),
                            result_score: `${matchedFixture.goals.home ?? 0}-${matchedFixture.goals.away ?? 0}`
                        })
                        .eq('id', pred.id)
                )
                settledCount++
            }
        }

        // 4. Batch Execute Updates
        if (updates.length > 0) {
            await Promise.all(updates)
            console.log(`[Live Settlement] ✅ Settled ${settledCount} predictions`)
        }

        return NextResponse.json({
            success: true,
            processed: pendingPreds.length,
            matched: matchedCount,
            settled: settledCount
        })

    } catch (error) {
        console.error('[Live Settlement] Strategy Error:', error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
    }
}

/**
 * HELPER: Find matching fixture
 */
function findMatchingFixture(pred: any, fixtures: APIFootballFixture[]): APIFootballFixture | null {
    // 1. Try Match ID first (External ID or stored Fixture ID)
    // Note: pred.external_id comes from Cenkler (Timestamp-based), NOT Fixture ID.
    // If we stored mapped ID (Phase 3), we should use it. But here we fetch from `predictions_raw`.
    // We don't have fixture_id column in raw table yet (maybe add it later?).

    // 2. Name Matching Logic (Simplified implementation of MatchingService)
    const pHome = normalize(pred.home_team_name)
    const pAway = normalize(pred.away_team_name)

    return fixtures.find(f => {
        const fHome = normalize(f.teams.home.name)
        const fAway = normalize(f.teams.away.name)

        // Exact Check
        if (fHome === pHome && fAway === pAway) return true

        // Includes Check
        if ((fHome.includes(pHome) || pHome.includes(fHome)) &&
            (fAway.includes(pAway) || pAway.includes(fAway))) return true

        return false
    }) || null
}

function normalize(s: string): string {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}
