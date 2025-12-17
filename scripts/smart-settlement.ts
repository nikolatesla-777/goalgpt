#!/usr/bin/env npx tsx
/**
 * Smart Matching & Settlement Script
 * 
 * Bu script:
 * 1. Bekleyen tahminleri alır
 * 2. TheSports API'den bugünkü maçları çeker
 * 3. Takım adına göre akıllı eşleştirme yapar
 * 4. Bitmiş maçlar için sonuç hesaplar (WON/LOST)
 * 5. Veritabanını günceller
 */

import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const proxyUrl = process.env.THESPORTS_PROXY_URL || 'http://142.93.103.128:3001'

const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================================================
// Prediction Evaluator
// =============================================================================

function evaluatePrediction(
    type: string,
    homeGoals: number,
    awayGoals: number,
    htHomeGoals: number,
    htAwayGoals: number,
    status: string
): { result: 'won' | 'lost' | 'pending', log: string } {
    const t = type.trim().toUpperCase()
    const total = homeGoals + awayGoals
    const htTotal = htHomeGoals + htAwayGoals
    const isFT = ['FT', 'AET', 'PEN'].includes(status)
    const isHT = ['HT', 'INT'].includes(status)

    // IY X.5 ÜST/ALT (İlk Yarı)
    const iyMatch = t.match(/(IY|HT)\s+(\d+\.?\d*)\s*(ÜST|UST|ALT|OVER|UNDER)/i)
    if (iyMatch) {
        const threshold = parseFloat(iyMatch[2])
        const isOver = ['ÜST', 'UST', 'OVER'].includes(iyMatch[3].toUpperCase())
        const relevantGoals = (isHT || isFT) ? htTotal : total

        if (isOver) {
            if (relevantGoals > threshold) return { result: 'won', log: `✅ IY ÜST: ${relevantGoals} > ${threshold}` }
            if (isHT || isFT) return { result: 'lost', log: `❌ IY ÜST: ${relevantGoals} <= ${threshold}` }
        } else {
            if (relevantGoals > threshold) return { result: 'lost', log: `❌ IY ALT: ${relevantGoals} > ${threshold}` }
            if (isHT || isFT) return { result: 'won', log: `✅ IY ALT: ${relevantGoals} <= ${threshold}` }
        }
        return { result: 'pending', log: `⏳ IY: ${relevantGoals} / ${threshold}` }
    }

    // MS X.5 ÜST/ALT (Maç Sonu)
    const msMatch = t.match(/(MS|FT)?\s*(\d+\.?\d*)\s*(ÜST|UST|ALT|OVER|UNDER)/i)
    if (msMatch) {
        const threshold = parseFloat(msMatch[2])
        const isOver = ['ÜST', 'UST', 'OVER'].includes(msMatch[3].toUpperCase())

        if (isOver) {
            if (total > threshold) return { result: 'won', log: `✅ MS ÜST: ${total} > ${threshold}` }
            if (isFT) return { result: 'lost', log: `❌ MS ÜST: ${total} <= ${threshold}` }
        } else {
            if (total > threshold) return { result: 'lost', log: `❌ MS ALT: ${total} > ${threshold}` }
            if (isFT) return { result: 'won', log: `✅ MS ALT: ${total} <= ${threshold}` }
        }
        return { result: 'pending', log: `⏳ MS: ${total} / ${threshold}` }
    }

    // KG VAR
    if (/KG\s*(VAR|YES)|BOTH/i.test(t)) {
        if (homeGoals > 0 && awayGoals > 0) return { result: 'won', log: '✅ KG VAR Hit' }
        if (isFT) return { result: 'lost', log: '❌ KG VAR Miss' }
        return { result: 'pending', log: '⏳ KG VAR waiting' }
    }

    // MS 1/2/0
    if (/MS\s*1$/i.test(t) || /^1$/i.test(t)) {
        if (isFT) return { result: homeGoals > awayGoals ? 'won' : 'lost', log: `MS 1: ${homeGoals}-${awayGoals}` }
        return { result: 'pending', log: '⏳ MS 1 waiting' }
    }
    if (/MS\s*2$/i.test(t) || /^2$/i.test(t)) {
        if (isFT) return { result: awayGoals > homeGoals ? 'won' : 'lost', log: `MS 2: ${homeGoals}-${awayGoals}` }
        return { result: 'pending', log: '⏳ MS 2 waiting' }
    }
    if (/MS\s*(0|X)$/i.test(t) || /DRAW/i.test(t)) {
        if (isFT) return { result: homeGoals === awayGoals ? 'won' : 'lost', log: `MS X: ${homeGoals}-${awayGoals}` }
        return { result: 'pending', log: '⏳ MS X waiting' }
    }

    return { result: 'pending', log: `⚠️ Unknown type: ${type}` }
}

// =============================================================================
// Name Matching
// =============================================================================

function normalizeTeamName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s*(fc|sc|ac|cf|afc|bk|fk|sk)\.?\s*/gi, ' ')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)[0] // First word
}

function teamsMatch(predHome: string, predAway: string, apiHome: string, apiAway: string): boolean {
    const pH = normalizeTeamName(predHome)
    const pA = normalizeTeamName(predAway)
    const aH = normalizeTeamName(apiHome)
    const aA = normalizeTeamName(apiAway)

    // Check if first words match
    return (pH === aH || pH.includes(aH) || aH.includes(pH)) &&
        (pA === aA || pA.includes(aA) || aA.includes(pA))
}

// =============================================================================
// Main Execution
// =============================================================================

async function main() {
    console.log('🎯 Smart Matching & Settlement')
    console.log('='.repeat(50))

    // 1. Get pending predictions
    const { data: predictions, error: predError } = await supabase
        .from('predictions_raw')
        .select('*')
        .eq('result', 'pending')
        .not('home_team_name', 'is', null)
        .not('home_team_name', 'eq', '')
        .order('received_at', { ascending: false })

    if (predError) {
        console.error('❌ Error fetching predictions:', predError.message)
        return
    }

    console.log(`📋 Found ${predictions?.length || 0} pending predictions`)

    if (!predictions || predictions.length === 0) {
        console.log('✅ No pending predictions to process')
        return
    }

    // 2. Get today's matches from API
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    console.log(`📅 Fetching matches for ${today}...`)

    let matches: any[] = []
    try {
        const diaryRes = await fetch(`${proxyUrl}/api/football/match/diary?date=${today}`)
        const diaryData = await diaryRes.json()
        matches = diaryData.results || []
        console.log(`📺 Got ${matches.length} matches from API`)
    } catch (err) {
        console.error('❌ Failed to fetch matches:', err)
        return
    }

    // 3. Get team names for matches (from cache or individual calls)
    const teamCache = new Map<string, string>()

    async function getTeamName(teamId: string): Promise<string> {
        if (teamCache.has(teamId)) return teamCache.get(teamId)!

        try {
            const res = await fetch(`${proxyUrl}/api/football/team/info?id=${teamId}`)
            const data = await res.json()
            const name = data.results?.[0]?.name || teamId
            teamCache.set(teamId, name)
            return name
        } catch {
            return teamId
        }
    }

    // 4. Process each prediction
    let linked = 0
    let settled = 0
    let skipped = 0

    for (const pred of predictions) {
        const predHome = pred.home_team_name || ''
        const predAway = pred.away_team_name || ''

        console.log(`\n🔍 [${pred.prediction_type}] ${predHome} vs ${predAway}`)

        // Find matching match
        let matchedMatch: any = null

        for (const match of matches) {
            const apiHome = await getTeamName(match.home_team_id)
            const apiAway = await getTeamName(match.away_team_id)

            if (teamsMatch(predHome, predAway, apiHome, apiAway)) {
                matchedMatch = { ...match, homeTeamName: apiHome, awayTeamName: apiAway }
                break
            }
        }

        if (!matchedMatch) {
            console.log('   ⏭️ No matching match found')
            skipped++
            continue
        }

        console.log(`   🔗 Matched: ${matchedMatch.homeTeamName} vs ${matchedMatch.awayTeamName}`)
        console.log(`   📊 Score: ${matchedMatch.home_scores?.[0] || 0}-${matchedMatch.away_scores?.[0] || 0} | Status: ${matchedMatch.status_id}`)

        // Update external_id if needed
        const matchId = matchedMatch.id
        if (pred.external_id !== matchId) {
            await supabase
                .from('predictions_raw')
                .update({ external_id: matchId })
                .eq('id', pred.id)
            linked++
            console.log(`   🔗 Linked external_id → ${matchId}`)
        }

        // Evaluate if match is finished
        const homeScore = matchedMatch.home_scores?.[0] || 0
        const awayScore = matchedMatch.away_scores?.[0] || 0
        const htHome = matchedMatch.home_scores?.[1] || 0
        const htAway = matchedMatch.away_scores?.[1] || 0

        // Status: 8 = FT, 3 = HT
        const statusMap: Record<number, string> = {
            1: 'NS', 2: '1H', 3: 'HT', 4: '2H', 5: 'ET', 6: 'BT', 7: 'PEN', 8: 'FT'
        }
        const status = statusMap[matchedMatch.status_id] || 'NS'

        const evaluation = evaluatePrediction(
            pred.prediction_type,
            homeScore,
            awayScore,
            htHome,
            htAway,
            status
        )

        console.log(`   📝 Result: ${evaluation.result} | ${evaluation.log}`)

        if (evaluation.result === 'won' || evaluation.result === 'lost') {
            await supabase
                .from('predictions_raw')
                .update({
                    result: evaluation.result,
                    settled_at: new Date().toISOString(),
                    match_score: `${homeScore}-${awayScore}`,
                    processing_log: evaluation.log
                })
                .eq('id', pred.id)
            settled++
            console.log(`   ✅ SETTLED: ${evaluation.result.toUpperCase()}`)
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`📊 SUMMARY:`)
    console.log(`   🔗 Linked: ${linked}`)
    console.log(`   ✅ Settled: ${settled}`)
    console.log(`   ⏭️ Skipped: ${skipped}`)
}

main().catch(console.error)
