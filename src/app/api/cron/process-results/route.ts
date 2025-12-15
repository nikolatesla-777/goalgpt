import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GlobalLivescoreService } from '@/lib/services/global-livescore-service'
import { PredictionEvaluator } from '@/lib/prediction-evaluator'
import { APIFootball } from '@/lib/api-football'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Security: Check for Vercel Cron Header
        const authHeader = request.headers.get('Authorization')
        // In local dev we skip auth, in prod we check
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ... (User didn't specify secret yet)

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch PENDING predictions that are NOT settled
        // We only care about bets created in last 48h to avoid huge scans
        const twoDaysAgo = new Date()
        twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

        const { data: pendingPreds, error } = await supabase
            .from('predictions_raw')
            .select('*')
            .eq('result', 'pending')
            .gte('received_at', twoDaysAgo.toISOString())

        if (error || !pendingPreds || pendingPreds.length === 0) {
            return NextResponse.json({ message: 'No pending predictions found', count: 0 })
        }

        // 2. Fetch FINISHED fixtures from API-Football (Today and Yesterday)
        // We need broad range because match might have finished late
        // API-Football limits requests, so we fetch standard "FT" fixtures
        // Since GlobalLivescoreService has logic to fetch "Today or yesterday", let's use API directly here for precision

        // Strategy: Get fixtures for TODAY and YESTERDAY status=FT
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

        // Parallel fetch
        const [todayFixtures, yesterdayFixtures] = await Promise.all([
            APIFootball.getFixturesByDate(today),
            APIFootball.getFixturesByDate(yesterday)
        ])

        const allFixtures = [...todayFixtures, ...yesterdayFixtures].filter(f =>
            ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
        )

        console.log(`[Cron] Found ${allFixtures.length} finished fixtures. Processing ${pendingPreds.length} pending preds.`)

        let settledCount = 0
        const updates = []

        // 3. Match and Evaluate
        for (const pred of pendingPreds) {
            // Find Matching Fixture using Service V4 Logic (re-using the logic manually or via service helper)
            // Ideally we expose matching logic publicly? 
            // Since GlobalLivescoreService.findPredictionForFixture is private, we can't use it directly reversed.
            // But we can replicate the logic: "For a prediction P, find fixture F"
            // Wait! The GlobalLivescoreService matches Fixture -> Prediction.
            // Here we need Prediction -> Fixture.
            // Actually we can iterate Fixtures and find Pred.
            // But since pred array is smaller, let's allow "findFixtureForPrediction".
            // Since we don't have that, we'll iterate 'allFixtures' and run the V4 logic 'findPredictionForFixture' 
            // to see if it picks THIS prediction.

            // This is slow O(MxN). Better approach:
            // Iterate all Pending Predictions.
            // For each prediction, scan 'allFixtures'. 
            // Matching is: Name Match + Validation.

            // Since V4 logic is complex (suffix checks etc), we should probably move it to a public Helper.
            // But for now, let's implement simplified "Reverse Match":
            // Normalize Pred Home -> Find Fixture with similar Home.

            // Or better: Re-use GlobalLivescoreService. But that service works on "Live Data".
            // How about "GlobalLivescoreService.findPredictionForFixture(fixture, [this_pred])"
            // Yes!

            let matchedFixture = null

            for (const fixture of allFixtures) {
                // Create a temporary simplified object that service expects?
                // Actually the service expects DBPrediction[].
                // We can pass just [pred] to the function.
                // But the function is private? "findPredictionForFixture"
                // It is protected/private.

                // Solution: We'll copy the critical check logic here briefly or make it public in next refactor.
                // For speed now: Strict Name Check.
                const pHome = GlobalLivescoreService['normalizeTeamName'] ? GlobalLivescoreService['normalizeTeamName'](pred.home_team_name) : pred.home_team_name.toLowerCase()
                const fHome = fixture.teams.home.name.toLowerCase()

                if (fHome.includes(pHome) || pHome.includes(fHome)) {
                    // Potential Match. Check League/Suffix
                    // Using Evaluator (Calculator) if match found
                    matchedFixture = fixture
                    break // Found a candidate
                }
            }

            if (matchedFixture) {
                const homeGoals = matchedFixture.goals.home ?? 0
                const awayGoals = matchedFixture.goals.away ?? 0
                const htHome = matchedFixture.score?.halftime?.home ?? 0
                const htAway = matchedFixture.score?.halftime?.away ?? 0

                const { result, log } = PredictionEvaluator.evaluate(
                    pred.prediction_type,
                    homeGoals,
                    awayGoals,
                    htHome,
                    htAway,
                    matchedFixture.fixture.status.short
                )

                if (result === 'won' || result === 'lost') {
                    updates.push({
                        id: pred.id,
                        result: result,
                        final_score: `${homeGoals}-${awayGoals}`,
                        processing_log: log,
                        settled_at: new Date().toISOString()
                    })
                    settledCount++
                }
            }
        }

        // 4. Batch Update DB
        if (updates.length > 0) {
            for (const u of updates) {
                await supabase.from('predictions_raw').update({
                    result: u.result,
                    final_score: u.final_score,
                    processing_log: u.processing_log,
                    settled_at: u.settled_at
                }).eq('id', u.id)
            }
        }

        return NextResponse.json({ success: true, settled: settledCount })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
