/**
 * TheSports API Proxy Server - FULL VERSION
 * All 19 endpoints with caching and error handling
 * 
 * Run: pm2 start "npx tsx scripts/proxy-server.ts" --name thesports-proxy
 */

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { config } from 'dotenv'
config({ path: '.env.local' })

const app = express()
const PORT = process.env.PROXY_PORT || 3001

app.use(cors())
app.use(express.json())

// =============================================================================
// Configuration
// =============================================================================

const THESPORTS_BASE = 'https://api.thesports.com/v1'
const USER = process.env.THESPORTS_API_USER
const SECRET = process.env.THESPORTS_API_SECRET

if (!USER || !SECRET) {
    console.error('❌ Missing THESPORTS_API_USER or THESPORTS_API_SECRET')
    process.exit(1)
}

// =============================================================================
// In-Memory Caches (with TTL)
// =============================================================================

interface CacheEntry<T> {
    data: T
    expires: number
}

const caches = {
    teams: new Map<string, CacheEntry<any>>(),
    competitions: new Map<string, CacheEntry<any>>(),
    diary: new Map<string, CacheEntry<any>>(),
    tables: new Map<string, CacheEntry<any>>(),
    general: new Map<string, CacheEntry<any>>()
}

const TTL = {
    teams: 24 * 60 * 60 * 1000,        // 24 hours
    competitions: 24 * 60 * 60 * 1000, // 24 hours
    diary: 5 * 60 * 1000,              // 5 minutes
    tables: 10 * 60 * 1000,            // 10 minutes
    live: 0,                           // No caching for live data
    general: 5 * 60 * 1000             // 5 minutes
}

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key)
    if (entry && entry.expires > Date.now()) {
        return entry.data
    }
    cache.delete(key)
    return null
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number): void {
    if (ttl > 0) {
        cache.set(key, { data, expires: Date.now() + ttl })
    }
}

// =============================================================================
// Helper: Make TheSports API Request
// =============================================================================

async function thesportsRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${THESPORTS_BASE}${endpoint}`)
    url.searchParams.append('user', USER!)
    url.searchParams.append('secret', SECRET!)

    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))

    console.log(`[Proxy] → ${endpoint}`)

    const res = await fetch(url.toString())

    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()

    if (data.code !== 0) {
        console.error(`[Proxy] API Error:`, data)
        throw new Error(data.msg || `API Error Code: ${data.code}`)
    }

    return data
}

// =============================================================================
// Error Handler Middleware
// =============================================================================

function asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res).catch(err => {
            console.error('[Proxy] Error:', err.message)
            res.status(500).json({ error: err.message, code: -1 })
        })
    }
}

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        ip: '142.93.103.128',
        cache: {
            teams: caches.teams.size,
            competitions: caches.competitions.size,
            diary: caches.diary.size,
            tables: caches.tables.size
        }
    })
})

// =============================================================================
// MATCH APIS (6 endpoints)
// =============================================================================

// 1. Recent Match List (paginated)
app.get('/api/football/match/recent/list', asyncHandler(async (req, res) => {
    const page = (req.query.page as string) || '1'
    const data = await thesportsRequest('/football/match/recent/list', { page })
    res.json(data)
}))

// 2. Diary - Matches by date (YYYYMMDD format)
app.get('/api/football/match/diary', asyncHandler(async (req, res) => {
    let date = (req.query.date as string) || ''

    // Convert YYYY-MM-DD to YYYYMMDD
    if (date.includes('-')) {
        date = date.replace(/-/g, '')
    }

    // Default to today
    if (!date) {
        date = new Date().toISOString().split('T')[0].replace(/-/g, '')
    }

    // Check cache
    const cached = getCached(caches.diary, date)
    if (cached) {
        return res.json(cached)
    }

    const data = await thesportsRequest('/football/match/diary', { date })
    setCache(caches.diary, date, data, TTL.diary)
    res.json(data)
}))

// 3. Season Recent Matches
app.get('/api/football/match/season/recent', asyncHandler(async (req, res) => {
    const season_id = req.query.season_id as string
    if (!season_id) {
        return res.status(400).json({ error: 'season_id required' })
    }
    const data = await thesportsRequest('/football/match/season/recent', { season_id })
    res.json(data)
}))

// 4. Detail Live - Real-time match data (NO CACHE)
app.get('/api/football/match/detail_live', asyncHandler(async (req, res) => {
    const data = await thesportsRequest('/football/match/detail_live')
    res.json(data)
}))

// 5. Live History - Match timeline
app.get('/api/football/match/live/history', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/live/history', { id })
    res.json(data)
}))

// 6. Match Analysis (H2H, etc)
app.get('/api/football/match/analysis', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/analysis', { id })
    res.json(data)
}))

// =============================================================================
// TREND APIS (2 endpoints)
// =============================================================================

// 7. Trend Live - All live match trends
app.get('/api/football/match/trend/live', asyncHandler(async (req, res) => {
    const data = await thesportsRequest('/football/match/trend/live')
    res.json(data)
}))

// 8. Trend Detail - Single match trend
app.get('/api/football/match/trend/detail', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/trend/detail', { id })
    res.json(data)
}))

// =============================================================================
// STATS APIS (6 endpoints)
// =============================================================================

// 9. Team Stats List
app.get('/api/football/match/team_stats/list', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/team_stats/list', { id })
    res.json(data)
}))

// 10. Team Stats Detail
app.get('/api/football/match/team_stats/detail', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/team_stats/detail', { id })
    res.json(data)
}))

// 11. Player Stats List
app.get('/api/football/match/player_stats/list', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/player_stats/list', { id })
    res.json(data)
}))

// 12. Player Stats Detail
app.get('/api/football/match/player_stats/detail', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/player_stats/detail', { id })
    res.json(data)
}))

// 13. Half Team Stats List (1st half vs 2nd half)
app.get('/api/football/match/half/team_stats/list', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/half/team_stats/list', { id })
    res.json(data)
}))

// 14. Half Team Stats Detail
app.get('/api/football/match/half/team_stats/detail', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/half/team_stats/detail', { id })
    res.json(data)
}))

// =============================================================================
// LINEUP API (1 endpoint)
// =============================================================================

// 15. Lineup Detail
app.get('/api/football/match/lineup/detail', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/lineup/detail', { id })
    res.json(data)
}))

// =============================================================================
// TABLE APIS (2 endpoints)
// =============================================================================

// 16. Table Live - Current standings
app.get('/api/football/table/live', asyncHandler(async (req, res) => {
    const cacheKey = 'all'
    const cached = getCached(caches.tables, cacheKey)
    if (cached) {
        return res.json(cached)
    }

    const data = await thesportsRequest('/football/table/live')
    setCache(caches.tables, cacheKey, data, TTL.tables)
    res.json(data)
}))

// 17. Season Table Detail
app.get('/api/football/season/recent/table/detail', asyncHandler(async (req, res) => {
    const season_id = req.query.season_id as string
    if (!season_id) {
        return res.status(400).json({ error: 'season_id required' })
    }
    const data = await thesportsRequest('/football/season/recent/table/detail', { season_id })
    res.json(data)
}))

// =============================================================================
// OTHER APIS (2 endpoints)
// =============================================================================

// 18. Compensation List (Form & H2H)
app.get('/api/football/compensation/list', asyncHandler(async (req, res) => {
    const page = (req.query.page as string) || '1'
    const data = await thesportsRequest('/football/compensation/list', { page })
    res.json(data)
}))

// 19. Goal Line Detail (Odds)
app.get('/api/football/match/goal/line/detail', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }
    const data = await thesportsRequest('/football/match/goal/line/detail', { id })
    res.json(data)
}))

// =============================================================================
// BASIC DATA APIS (for resolving IDs)
// =============================================================================

// Team Info (with caching)
app.get('/api/football/team/info', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }

    const cached = getCached(caches.teams, id)
    if (cached) {
        return res.json(cached)
    }

    const data = await thesportsRequest('/football/team/info', { id })
    setCache(caches.teams, id, data, TTL.teams)
    res.json(data)
}))

// Competition Info (with caching)
app.get('/api/football/competition/info', asyncHandler(async (req, res) => {
    const id = req.query.id as string
    if (!id) {
        return res.status(400).json({ error: 'id required' })
    }

    const cached = getCached(caches.competitions, id)
    if (cached) {
        return res.json(cached)
    }

    const data = await thesportsRequest('/football/competition/info', { id })
    setCache(caches.competitions, id, data, TTL.competitions)
    res.json(data)
}))

// Bulk Team Lookup
app.post('/api/football/team/bulk', asyncHandler(async (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'ids must be an array' })
    }

    const results: Record<string, any> = {}
    const missing: string[] = []

    // Check cache
    for (const id of ids) {
        const cached = getCached(caches.teams, id)
        if (cached) {
            results[id] = cached
        } else {
            missing.push(id)
        }
    }

    // Fetch missing (in batches)
    for (const id of missing) {
        try {
            const data = await thesportsRequest('/football/team/info', { id })
            setCache(caches.teams, id, data, TTL.teams)
            results[id] = data
        } catch (e) {
            console.error(`Failed to fetch team ${id}`)
        }
    }

    res.json({ results, cached: ids.length - missing.length, fetched: missing.length })
}))

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`🚀 TheSports Proxy Server running on port ${PORT}`)
    console.log('📡 Whitelisted IP: 142.93.103.128')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📋 Available Endpoints (19 + 3 utility):')
    console.log('')
    console.log('   MATCH:')
    console.log('   - GET /api/football/match/recent/list')
    console.log('   - GET /api/football/match/diary?date=YYYYMMDD')
    console.log('   - GET /api/football/match/season/recent?season_id=xxx')
    console.log('   - GET /api/football/match/detail_live')
    console.log('   - GET /api/football/match/live/history?id=xxx')
    console.log('   - GET /api/football/match/analysis?id=xxx')
    console.log('')
    console.log('   TREND:')
    console.log('   - GET /api/football/match/trend/live')
    console.log('   - GET /api/football/match/trend/detail?id=xxx')
    console.log('')
    console.log('   STATS:')
    console.log('   - GET /api/football/match/team_stats/list?id=xxx')
    console.log('   - GET /api/football/match/team_stats/detail?id=xxx')
    console.log('   - GET /api/football/match/player_stats/list?id=xxx')
    console.log('   - GET /api/football/match/player_stats/detail?id=xxx')
    console.log('   - GET /api/football/match/half/team_stats/list?id=xxx')
    console.log('   - GET /api/football/match/half/team_stats/detail?id=xxx')
    console.log('')
    console.log('   LINEUP:')
    console.log('   - GET /api/football/match/lineup/detail?id=xxx')
    console.log('')
    console.log('   TABLE:')
    console.log('   - GET /api/football/table/live')
    console.log('   - GET /api/football/season/recent/table/detail?season_id=xxx')
    console.log('')
    console.log('   OTHER:')
    console.log('   - GET /api/football/compensation/list')
    console.log('   - GET /api/football/match/goal/line/detail?id=xxx')
    console.log('')
    console.log('   UTILITY:')
    console.log('   - GET /api/football/team/info?id=xxx')
    console.log('   - GET /api/football/competition/info?id=xxx')
    console.log('   - POST /api/football/team/bulk (body: { ids: [...] })')
    console.log('═══════════════════════════════════════════════════════════')
})
