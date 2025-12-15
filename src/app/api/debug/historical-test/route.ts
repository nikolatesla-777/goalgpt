import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { APIFootball } from '@/lib/api-football'
import { PredictionEvaluator } from '@/lib/prediction-evaluator'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const targetTeams = ['Viktoria Plzen', 'Aarhus', 'Twente', 'Ferencvarosi', 'Man Utd']
    const report = []

    // 1. Fetch Predictions
    const { data: preds } = await supabase
        .from('predictions_raw')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50) // Inspect last 50 predictions

    if (!preds) return NextResponse.json({ error: 'No predictions found' })

    // Filter for targets
    const relevantPreds = preds.filter(p =>
        targetTeams.some(t =>
            (p.home_team_name && p.home_team_name.includes(t)) ||
            (p.away_team_name && p.away_team_name.includes(t))
        )
    )

    // 2. Fetch Todays Results
    const todayFixtures = await APIFootball.getFixturesByDate()

    for (const pred of relevantPreds) {
        // Find match
        const h = pred.home_team_name.toLowerCase()
        const fixture = todayFixtures.find(f =>
            f.teams.home.name.toLowerCase().includes(h) ||
            f.teams.away.name.toLowerCase().includes(h)
        )

        if (fixture) {
            const status = fixture.fixture.status.short
            const homeScore = fixture.goals.home ?? 0
            const awayScore = fixture.goals.away ?? 0
            const htHome = fixture.score.halftime.home ?? 0
            const htAway = fixture.score.halftime.away ?? 0

            // Normalize & Evaluate
            // Note: Visual shows "IY GOL", so we expect Evaluator to map it to "IY 0.5 UST"
            const { result, log } = PredictionEvaluator.evaluate(
                pred.prediction_type,
                homeScore,
                awayScore,
                htHome,
                htAway,
                status
            )

            report.push({
                match: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
                prediction: pred.prediction_type,
                normalized: PredictionEvaluator.normalizeType(pred.prediction_type),
                prediction_minute: pred.match_minute || 'Unknown',
                current_status: status,
                current_score: `${homeScore}-${awayScore}`,
                ht_score: `${htHome}-${htAway}`,
                system_decision: result,
                logic_log: log
            })
        } else {
            report.push({
                match: `${pred.home_team_name} vs ...`,
                status: 'Not found in API today'
            })
        }
    }

    return NextResponse.json({
        total_found: relevantPreds.length,
        report
    })
}
