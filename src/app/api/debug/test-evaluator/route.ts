import { NextResponse } from 'next/server'
import { PredictionEvaluator } from '@/lib/prediction-evaluator'

export async function GET() {
    const results = []

    // SCENARIO 1: Early Win (2.5 ÜST at 60' with 2-1)
    const s1 = PredictionEvaluator.evaluate('2.5 ÜST', 2, 1, 1, 0, '2H')
    results.push({
        scenario: '2.5 ÜST | Score: 2-1 | Status: 2H',
        expected: 'won',
        actual: s1.result,
        log: s1.log,
        passed: s1.result === 'won'
    })

    // SCENARIO 2: MS 1 Pending (MS 1 at 60' with 1-0)
    const s2 = PredictionEvaluator.evaluate('MS 1', 1, 0, 1, 0, '2H')
    results.push({
        scenario: 'MS 1 | Score: 1-0 | Status: 2H',
        expected: 'pending',
        actual: s2.result,
        log: s2.log,
        passed: s2.result === 'pending'
    })

    // SCENARIO 3: KG VAR Early Win (1-1 at 1H)
    const s3 = PredictionEvaluator.evaluate('KG VAR', 1, 1, 1, 1, '1H')
    results.push({
        scenario: 'KG VAR | Score: 1-1 | Status: 1H',
        expected: 'won',
        actual: s3.result,
        log: s3.log,
        passed: s3.result === 'won'
    })

    // SCENARIO 4: FT Check (MS 1 at FT with 2-0)
    const s4 = PredictionEvaluator.evaluate('EV SAHIBI', 2, 0, 1, 0, 'FT')
    results.push({
        scenario: 'EV SAHIBI | Score: 2-0 | Status: FT',
        expected: 'won',
        actual: s4.result,
        log: s4.log,
        passed: s4.result === 'won'
    })

    return NextResponse.json({
        total: results.length,
        passed: results.filter(r => r.passed).length,
        results
    })
}
