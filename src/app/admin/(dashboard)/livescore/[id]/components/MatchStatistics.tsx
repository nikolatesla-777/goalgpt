'use client'

import { useState } from 'react'
import { BarChart2 } from 'lucide-react'

interface MergedStat {
    type: string
    home: string | number | null
    away: string | number | null
}

interface MatchStatisticsProps {
    stats: MergedStat[]
    homeTeamName?: string
    awayTeamName?: string
}

type HalfFilter = 'all' | 'first' | 'second'

export function MatchStatistics({ stats, homeTeamName, awayTeamName }: MatchStatisticsProps) {
    const [activeHalf, setActiveHalf] = useState<HalfFilter>('all')

    // API-Football does not provide half-time stats separately
    // So we show "Veri Yok" for 1st and 2nd half filters
    const showStats = activeHalf === 'all'

    if (!stats || stats.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BarChart2 className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-slate-600 font-medium text-sm">İstatistik Bulunamadı</h3>
            </div>
        )
    }

    const parseValue = (val: string | number | null) => {
        if (val === null) return 0
        if (typeof val === 'number') return val
        return parseFloat(val.toString().replace('%', '')) || 0
    }

    const translateType = (t: string) => {
        const dict: Record<string, string> = {
            'Ball Possession': 'Topla Oynama',
            'Total Shots': 'Toplam Şut',
            'Shots on Goal': 'İsabetli Şut',
            'Shots off Goal': 'İsabetsiz Şut',
            'Blocked Shots': 'Engellenen Şut',
            'Corner Kicks': 'Kornerler',
            'Offsides': 'Ofsayt',
            'Fouls': 'Fauller',
            'Yellow Cards': 'Sarı Kart',
            'Red Cards': 'Kırmızı Kart',
            'Goalkeeper Saves': 'Kaleci Kurtarışı',
            'Total passes': 'Toplam Pas',
            'Passes accurate': 'İsabetli Pas',
            'Passes %': 'Pas İsabeti %',
            'expected_goals': 'Gol Beklentisi (xG)',
            'Shots insidebox': 'Ceza Sahası İçi Şut',
            'Shots outsidebox': 'Ceza Sahası Dışı Şut',
            'goals_prevented': 'Önlenen Gol'
        }
        return dict[t] || t
    }

    const tabs: { key: HalfFilter; label: string }[] = [
        { key: 'all', label: 'TÜMÜ' },
        { key: 'first', label: '1. YARI' },
        { key: 'second', label: '2. YARI' }
    ]

    return (
        <div className="mt-4">
            {/* Half Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveHalf(tab.key)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeHalf === tab.key
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Header */}
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
                İSTATİSTİK
            </h3>

            {/* Content */}
            {showStats ? (
                <div className="space-y-5">
                    {stats.map((stat, i) => {
                        const homeValRaw = stat.home ?? 0
                        const awayValRaw = stat.away ?? 0
                        const type = stat.type

                        const homeValNum = parseValue(homeValRaw)
                        const awayValNum = parseValue(awayValRaw)

                        const total = homeValNum + awayValNum

                        let homePercent = 0
                        let awayPercent = 0

                        if (total > 0) {
                            homePercent = (homeValNum / total) * 100
                            awayPercent = (awayValNum / total) * 100
                        } else if (String(homeValRaw).includes('%') || type === 'Ball Possession') {
                            homePercent = homeValNum
                            awayPercent = awayValNum
                        }

                        return (
                            <div key={i}>
                                {/* Values & Label */}
                                <div className="flex items-center justify-between mb-1.5 text-sm">
                                    <span className="font-bold text-slate-800 w-14 text-left">{homeValRaw}</span>
                                    <span className="text-slate-500 text-xs font-medium text-center flex-1">{translateType(type)}</span>
                                    <span className="font-bold text-slate-800 w-14 text-right">{awayValRaw}</span>
                                </div>

                                {/* Bar Container */}
                                <div className="flex gap-1" style={{ height: '10px' }}>
                                    {/* Home Bar Track (Left) */}
                                    <div
                                        className="flex-1 bg-slate-200 rounded-l-full overflow-hidden flex justify-end"
                                        style={{ height: '10px' }}
                                    >
                                        <div
                                            className="bg-teal-500 rounded-l-full"
                                            style={{
                                                width: `${homePercent}%`,
                                                height: '10px',
                                                minWidth: homePercent > 0 ? '4px' : '0'
                                            }}
                                        />
                                    </div>

                                    {/* Away Bar Track (Right) */}
                                    <div
                                        className="flex-1 bg-slate-200 rounded-r-full overflow-hidden flex justify-start"
                                        style={{ height: '10px' }}
                                    >
                                        <div
                                            className="bg-orange-500 rounded-r-full"
                                            style={{
                                                width: `${awayPercent}%`,
                                                height: '10px',
                                                minWidth: awayPercent > 0 ? '4px' : '0'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <BarChart2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">
                        {activeHalf === 'first' ? '1. Yarı' : '2. Yarı'} istatistikleri mevcut değil
                    </p>
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                    <span>{homeTeamName || 'Ev Sahibi'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>{awayTeamName || 'Deplasman'}</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                </div>
            </div>
        </div>
    )
}
