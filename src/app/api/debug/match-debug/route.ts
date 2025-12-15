import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { APIFootball } from '@/lib/api-football'

export const dynamic = 'force-dynamic'

// ==========================================================================
// NORMALIZATION FUNCTIONS (Same as live-settlement)
// ==========================================================================

function normalizeTeamName(name: string): string {
    if (!name) return ''

    let normalized = name.toLowerCase()

    if (normalized.includes('panaitolikos')) return 'panetolikos'

    normalized = normalized.replace(/münchen|munchen|munich/g, 'munchen')
    normalized = normalized.replace(/fsv\s*mainz\s*05|mainz\s*05/g, 'mainz')
    normalized = normalized.replace(/university|univ\.?/gi, 'uni')
    normalized = normalized.replace(/h&w|h\s*&\s*w/gi, 'hw')
    normalized = normalized.replace(/pérez|perez/gi, 'perez')
    normalized = normalized.replace(/nicolás|nicolas/gi, 'nicolas')
    normalized = normalized.replace(/martín|martin/gi, 'martin')

    return normalized
        .replace(/\([^)]*\)/g, '')
        .replace(/\b(fc|sk|fk|ik|fsv|vfb|vfl|sc|sv|rb|bsc|tsg|bv|tsv|ssc|united|city|town|sports|spor|calcio|ac|as|club|deportivo|atletico|real|cf|cd|05|04|03|02|01|1899|1904|1909|1860|1893|1903)\b/g, '')
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i')
        .replace(/[óòôõöø]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ä]/g, 'a')
        .replace(/[ñ]/g, 'n')
        .replace(/[çć]/g, 'c')
        .replace(/[ß]/g, 'ss')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const teamQuery = searchParams.get('team') || ''

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Fetch pending predictions
        const twoDaysAgo = new Date()
        twoDaysAgo.setHours(twoDaysAgo.getHours() - 48)

        const { data: pendingPreds } = await supabase
            .from('predictions_raw')
            .select('id, home_team_name, away_team_name, league_name')
            .or('result.eq.pending,result.is.null')
            .gte('received_at', twoDaysAgo.toISOString())
            .limit(30)

        if (!pendingPreds || pendingPreds.length === 0) {
            return NextResponse.json({ message: 'No pending predictions' })
        }

        // 2. Fetch fixtures
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const twoDaysAgoDate = new Date(Date.now() - 172800000).toISOString().split('T')[0]

        const [todayFixtures, yesterdayFixtures, oldFixtures] = await Promise.all([
            APIFootball.getFixturesByDate(today),
            APIFootball.getFixturesByDate(yesterday),
            APIFootball.getFixturesByDate(twoDaysAgoDate)
        ])

        const allFixtures = [...todayFixtures, ...yesterdayFixtures, ...oldFixtures]

        // 3. Debug matching
        const debugResults = pendingPreds.map(pred => {
            const predHome = normalizeTeamName(pred.home_team_name || '')
            const predAway = normalizeTeamName(pred.away_team_name || '')

            // Filter if teamQuery provided
            if (teamQuery) {
                const query = teamQuery.toLowerCase()
                if (!predHome.includes(query) && !predAway.includes(query)) {
                    return null
                }
            }

            // Find best match candidates
            const candidates = allFixtures
                .filter(f => {
                    const apiHome = normalizeTeamName(f.teams.home.name)
                    const apiAway = normalizeTeamName(f.teams.away.name)
                    // Loose match for debug
                    return (apiHome.includes(predHome.substring(0, 5)) || predHome.includes(apiHome.substring(0, 5))) &&
                        (apiAway.includes(predAway.substring(0, 5)) || predAway.includes(apiAway.substring(0, 5)))
                })
                .map(f => ({
                    apiHome: f.teams.home.name,
                    apiAway: f.teams.away.name,
                    league: f.league.name,
                    status: f.fixture.status.short,
                    normalized: {
                        home: normalizeTeamName(f.teams.home.name),
                        away: normalizeTeamName(f.teams.away.name)
                    }
                }))
                .slice(0, 3)

            return {
                predId: pred.id.substring(0, 8),
                predHome: pred.home_team_name,
                predAway: pred.away_team_name,
                predLeague: pred.league_name,
                normalized: {
                    home: predHome,
                    away: predAway
                },
                candidatesFound: candidates.length,
                candidates
            }
        }).filter(Boolean)

        return NextResponse.json({
            pendingCount: pendingPreds.length,
            fixtureCount: allFixtures.length,
            results: debugResults.slice(0, 15)
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
