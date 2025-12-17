'use client'

import { useState, useEffect } from 'react'
import LiveScoreBoard from './LiveScoreBoard'
import { SimplifiedMatch } from '@/app/admin/(dashboard)/predictions/manual/actions'

export default function LiveScorePage() {
    const [matches, setMatches] = useState<(SimplifiedMatch & { hasAIPrediction: boolean })[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                const res = await fetch('/api/livescore', {
                    cache: 'no-store',
                    signal: AbortSignal.timeout(60000) // 60 second timeout
                })

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }

                const data = await res.json()

                // Flatten grouped data
                const flatMatches: (SimplifiedMatch & { hasAIPrediction: boolean })[] = []

                for (const country of data.countries || []) {
                    for (const league of country.leagues || []) {
                        for (const match of league.matches || []) {
                            flatMatches.push({
                                id: match.id,
                                homeTeam: match.home.name,
                                awayTeam: match.away.name,
                                homeLogo: match.home.logo,
                                awayLogo: match.away.logo,
                                homeScore: match.home.score,
                                awayScore: match.away.score,
                                minute: match.minute || 0,
                                status: match.isLive ? (match.status === 'HT' ? 'ht' : 'live') : (match.status === 'FT' ? 'ft' : 'ns'),
                                league: league.name,
                                country: country.name,
                                leagueFlag: country.flag,
                                leagueLogo: league.logo,
                                startTime: match.startTime,
                                rawTime: match.timestamp,
                                hasAIPrediction: match.hasAIPrediction || false
                            })
                        }
                    }
                }

                // Sort: live first, then by time
                flatMatches.sort((a, b) => {
                    if (a.status === 'live' && b.status !== 'live') return -1
                    if (a.status !== 'live' && b.status === 'live') return 1
                    return (a.rawTime || 0) - (b.rawTime || 0)
                })

                setMatches(flatMatches)
            } catch (err: any) {
                console.error('[LiveScorePage] Error:', err)
                setError(err?.message || 'Veri yüklenirken hata oluştu')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-white mb-2">Maçlar Yükleniyor...</h2>
                    <p className="text-gray-400">TheSports API'den veri çekiliyor, lütfen bekleyin.</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="bg-red-900/30 border border-red-500 rounded-xl p-6 text-center max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ API Bağlantı Hatası</h2>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <p className="text-sm text-gray-500 mb-4">TheSports API'ye bağlanılamıyor. Rate limit veya VPS proxy sorunu olabilir.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        🔄 Yeniden Dene
                    </button>
                </div>
            </div>
        )
    }

    // Empty state
    if (matches.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-6 text-center max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">📭 Maç Bulunamadı</h2>
                    <p className="text-gray-300">Şu anda canlı veya günün programında maç bulunmuyor.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        🔄 Yenile
                    </button>
                </div>
            </div>
        )
    }

    return <LiveScoreBoard initialMatches={matches} />
}
