/**
 * TheSports API Proxy Server
 * Runs on VPS to proxy TheSports API requests from whitelisted IP
 * 
 * Run with: pm2 start scripts/proxy-server.ts --name thesports-proxy --interpreter npx -- tsx
 */

import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
config({ path: '.env.local' })

const app = express()
const PORT = process.env.PROXY_PORT || 3001

app.use(cors())
app.use(express.json())

const THESPORTS_BASE = 'https://api.thesports.com/v1'
const USER = process.env.THESPORTS_API_USER
const SECRET = process.env.THESPORTS_API_SECRET

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', ip: '142.93.103.128' })
})

// Live matches - detail
app.get('/api/football/match/detail_live', async (req, res) => {
    try {
        const url = `${THESPORTS_BASE}/football/match/detail_live?user=${USER}&secret=${SECRET}`
        console.log(`[Proxy] Requesting: /football/match/detail_live`)
        const response = await fetch(url)
        const data = await response.json()
        res.json(data)
    } catch (error: any) {
        console.error('[Proxy] Error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

// Matches by date (diary)
app.get('/api/football/match/diary', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0]
        const url = `${THESPORTS_BASE}/football/match/diary?user=${USER}&secret=${SECRET}&date=${date}`
        console.log(`[Proxy] Requesting: /football/match/diary?date=${date}`)
        const response = await fetch(url)
        const data = await response.json()
        res.json(data)
    } catch (error: any) {
        console.error('[Proxy] Error:', error.message)
        res.status(500).json({ error: error.message })
    }
})

// Team info
app.get('/api/football/team/info', async (req, res) => {
    try {
        const id = req.query.id
        const url = `${THESPORTS_BASE}/football/team/info?user=${USER}&secret=${SECRET}&id=${id}`
        console.log(`[Proxy] Requesting: /football/team/info?id=${id}`)
        const response = await fetch(url)
        const data = await response.json()
        res.json(data)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

// Competition info
app.get('/api/football/competition/info', async (req, res) => {
    try {
        const id = req.query.id
        const url = `${THESPORTS_BASE}/football/competition/info?user=${USER}&secret=${SECRET}&id=${id}`
        const response = await fetch(url)
        const data = await response.json()
        res.json(data)
    } catch (error: any) {
        res.status(500).json({ error: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`🚀 TheSports Proxy Server running on port ${PORT}`)
    console.log(`📡 Whitelisted IP: 142.93.103.128`)
    console.log(`📋 Endpoints: /api/football/match/detail_live, /api/football/match/diary`)
})
