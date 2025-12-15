
export interface ParsedPredictionDetails {
    minute: string
    score: string
    alertCode: string
    externalId: string
    league: string
    country: string
    homeTeam: string
    awayTeam: string
}

export function parsePredictionDetails(text: string): ParsedPredictionDetails {
    let minute = ''
    let score = ''
    let alertCode = ''
    let externalId = ''
    let league = ''
    let country = ''
    let homeTeam = ''
    let awayTeam = ''

    if (!text) return { minute, score, alertCode, externalId, league, country, homeTeam, awayTeam }

    // 1. Try to extract ID at the start (e.g., 00080 "...")
    const idMatch = text.match(/^(\d+)\s+"/)
    if (idMatch) externalId = idMatch[1]

    // 2. Minute Extraction
    // Formats: "65.dk", "65'", "Iy", "Ms", "⏰ 10", "Devre Arası"
    const minMatch = text.match(/(\d+)\s*['’]|(\d+)\s*\.?dk|⏰\s*(\d+)/i)
    if (minMatch) {
        minute = minMatch[1] || minMatch[2] || minMatch[3]
    }

    // Check for period markers
    if (text.toLowerCase().includes('iy ') || text.toLowerCase().includes('devre')) minute = minute || 'IY'
    if (text.toLowerCase().includes('ms ') || text.toLowerCase().includes('maç sonu')) minute = 'MS'

    // 3. Score Extraction
    // Look for patterns like ( 1 - 0 ) or (1-0)
    const scoreMatch = text.match(/\(\s*(\d+)\s*-\s*(\d+)\s*\)/)
    if (scoreMatch) {
        score = `${scoreMatch[1]}-${scoreMatch[2]}`
    }

    // 4. Alert Code
    const codeMatch = text.match(/AlertCode:\s*([\w\d-]+)/i)
    if (codeMatch) {
        alertCode = codeMatch[1]
    } else {
        const explicitCode = text.match(/\b([A-Z][0-9]{3})\b/) // Like A101
        if (explicitCode) alertCode = explicitCode[1]
    }

    // 5. League/Country Extraction
    // format: 🏟 Romania - Liga 2 Seria
    const leagueMatch = text.match(/🏟\s*(.+)/)
    if (leagueMatch) {
        const fullString = leagueMatch[1].trim()
        if (fullString.includes('-')) {
            const parts = fullString.split('-')
            country = parts[0].trim()
            league = parts.slice(1).join('-').trim()
        } else {
            league = fullString
        }
    }

    // 6. Teams Extraction (Heuristic)
    // Try Cenkler format first: *Team1 - Team2  ( score )*
    // Example: 00079⚽ *Corvinul Hunedoara - Tunari  ( 0 - 0 )*
    const cenklerMatch = text.match(/\*([^*]+?)\s*-\s*([^*(]+?)\s*\(/)
    if (cenklerMatch) {
        homeTeam = cenklerMatch[1].trim()
        awayTeam = cenklerMatch[2].trim()
    }

    // Try quotes format: "Home - Away"
    if (!homeTeam) {
        const teamsMatch = text.match(/"([^"]+)\s*-\s*([^"]+)\s*(?:\(|$)/)
        if (teamsMatch) {
            homeTeam = teamsMatch[1].trim()
            awayTeam = teamsMatch[2].trim()
        }
    }

    // Fallback: Try to find text before score ( ... )
    if (!homeTeam) {
        const beforeScore = text.split('(')[0]
        // Remove ID and emoji prefix
        const cleanName = beforeScore.replace(/^\d+[⚽\s]+/, '').replace(/["\*]/g, '').trim()
        if (cleanName.includes('-')) {
            const parts = cleanName.split('-')
            homeTeam = parts[0].trim()
            awayTeam = parts.slice(1).join('-').trim()
        }
    }

    return { minute, score, alertCode, externalId, league, country, homeTeam, awayTeam }
}

export function formatTeamLogoUrl(teamId: string | number | null | undefined): string | null {
    // API-Football format
    if (!teamId) return null
    return `https://media.api-sports.io/football/teams/${teamId}.png`
}
