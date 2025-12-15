'use client'

import { useState } from 'react'
import {
    Search,
    Download,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from 'lucide-react'

// Raw prediction log entries (as received from AI system)
interface PredictionLog {
    id: number
    kayitTarihi: string
    kontrolTarihi: string
    botGrup: string
    lig: string
    evTakim: string
    evLogo: string
    skor: string
    deplasTakim: string
    deplasLogo: string
    dakika: string
    tahmin: string
    kontrol: 'success' | 'pending' | 'error'
    cleanText: string
    not: string
}

const sampleLogs: PredictionLog[] = [
    {
        id: 1,
        kayitTarihi: '2025-12-09 23:12',
        kontrolTarihi: '2025-12-09',
        botGrup: 'ALERT: D',
        lig: 'Bolivia Primera Division',
        evTakim: 'Jorge Wilstermann',
        evLogo: '🇧🇴',
        skor: '0 - 0',
        deplasTakim: 'San Jose de Oruro',
        deplasLogo: '🇧🇴',
        dakika: "10'",
        tahmin: 'IY 0.5 ÜST',
        kontrol: 'success',
        cleanText: 'Jorge Wilstermann - San Jose de Oruro ( 0 - 0 ) Bolivia Primera Division 10 IY Gol AlertCode: IY-1 Ev: 16.5 Dep: 13.5 [Canlı Skor]|https://live7.nowgoal29.com/match/live-2907479',
        not: ''
    },
    {
        id: 2,
        kayitTarihi: '2025-12-09 21:30',
        kontrolTarihi: '2025-12-09',
        botGrup: 'BOT 007',
        lig: 'UEFA Champions League',
        evTakim: 'Barcelona',
        evLogo: '🇪🇸',
        skor: '2 - 1',
        deplasTakim: 'Eintracht Frankfurt',
        deplasLogo: '🇩🇪',
        dakika: "65'",
        tahmin: '+1 Gol - (3.5 ÜST)',
        kontrol: 'success',
        cleanText: 'Barcelona - Eintracht Frankfurt ( 2 - 1 ) UEFA Champions League Minute: 65 SonGol dk: 52 3.5 ÜST',
        not: ''
    },
    {
        id: 3,
        kayitTarihi: '2025-12-09 21:29',
        kontrolTarihi: '2025-12-09',
        botGrup: 'Algoritma: 01',
        lig: 'UEFA Womens Champions League',
        evTakim: 'Paris Saint Germain (W)',
        evLogo: '🇫🇷',
        skor: '0 - 0',
        deplasTakim: 'Oud-Heverlee Leuven (W)',
        deplasLogo: '🇧🇪',
        dakika: "71'",
        tahmin: '+1 Gol - (0.5 ÜST)',
        kontrol: 'success',
        cleanText: 'Paris Saint Germain (W) - Oud-Heverlee Leuven (W) ( 0 - 0 ) UEFA Womens Champions League 71 0.5 ÜST AlertCode: D2 [Canlı Skor]|https://live7.nowgoal29.com/match/live-2884798',
        not: ''
    },
    {
        id: 4,
        kayitTarihi: '2025-12-09 20:45',
        kontrolTarihi: '2025-12-09',
        botGrup: 'AlertCode: 17',
        lig: 'Süper Lig',
        evTakim: 'Galatasaray',
        evLogo: '🇹🇷',
        skor: '1 - 1',
        deplasTakim: 'Fenerbahçe',
        deplasLogo: '🇹🇷',
        dakika: "55'",
        tahmin: '+1 Gol - (2.5 ÜST)',
        kontrol: 'success',
        cleanText: 'Galatasaray - Fenerbahce ( 1 - 1 ) Super Lig Minute: 55 SonGol dk: 48 2.5 ÜST AlertCode: 17',
        not: ''
    },
    {
        id: 5,
        kayitTarihi: '2025-12-09 19:30',
        kontrolTarihi: '2025-12-09',
        botGrup: 'ALERT: D',
        lig: 'Premier League',
        evTakim: 'Manchester United',
        evLogo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        skor: '0 - 1',
        deplasTakim: 'Liverpool',
        deplasLogo: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        dakika: "40'",
        tahmin: 'MS 2',
        kontrol: 'success',
        cleanText: 'Manchester United - Liverpool ( 0 - 1 ) Premier League Minute: 40 MS 2 AlertCode: D [Canlı Skor]|https://live7.nowgoal29.com/match/live-2881234',
        not: ''
    },
    {
        id: 6,
        kayitTarihi: '2025-12-09 18:15',
        kontrolTarihi: '2025-12-09',
        botGrup: 'Algoritma: 01',
        lig: 'Bundesliga',
        evTakim: 'Bayern Munich',
        evLogo: '🇩🇪',
        skor: '2 - 0',
        deplasTakim: 'Borussia Dortmund',
        deplasLogo: '🇩🇪',
        dakika: "62'",
        tahmin: '+1 Gol',
        kontrol: 'success',
        cleanText: 'Bayern Munich - Borussia Dortmund ( 2 - 0 ) Bundesliga Minute: 62 +1 Gol AlertCode: A01',
        not: ''
    },
    {
        id: 7,
        kayitTarihi: '2025-12-09 17:00',
        kontrolTarihi: '2025-12-09',
        botGrup: 'BOT 007',
        lig: 'La Liga',
        evTakim: 'Real Madrid',
        evLogo: '🇪🇸',
        skor: '1 - 0',
        deplasTakim: 'Athletic Bilbao',
        deplasLogo: '🇪🇸',
        dakika: "28'",
        tahmin: '+2 Gol',
        kontrol: 'pending',
        cleanText: 'Real Madrid - Athletic Bilbao ( 1 - 0 ) La Liga Minute: 28 +2 Gol AlertCode: B7 [Format Error: missing AlertCode]',
        not: 'Format uyarısı: AlertCode eksik'
    },
    {
        id: 8,
        kayitTarihi: '2025-12-09 16:30',
        kontrolTarihi: '',
        botGrup: 'Unknown',
        lig: '',
        evTakim: '',
        evLogo: '',
        skor: '',
        deplasTakim: '',
        deplasLogo: '',
        dakika: '',
        tahmin: '',
        kontrol: 'error',
        cleanText: 'PARSE_ERROR: Invalid Base64 encoding - data corrupted or incomplete transmission',
        not: 'Parse hatası - veri bozuk'
    },
    {
        id: 9,
        kayitTarihi: '2025-12-09 15:45',
        kontrolTarihi: '2025-12-09',
        botGrup: 'Alert Code: 2',
        lig: 'Serie A',
        evTakim: 'AC Milan',
        evLogo: '🇮🇹',
        skor: '0 - 0',
        deplasTakim: 'Inter Milan',
        deplasLogo: '🇮🇹',
        dakika: "35'",
        tahmin: '+1 Gol - (0.5 ÜST)',
        kontrol: 'success',
        cleanText: 'AC Milan - Inter Milan ( 0 - 0 ) Serie A Minute: 35 0.5 ÜST AlertCode: 2 [Canlı Skor]|https://live7.nowgoal29.com/match/live-2879999',
        not: ''
    },
    {
        id: 10,
        kayitTarihi: '2025-12-09 14:20',
        kontrolTarihi: '',
        botGrup: 'ALERT: D',
        lig: 'Ligue 1',
        evTakim: 'PSG',
        evLogo: '🇫🇷',
        skor: '2 - 0',
        deplasTakim: 'Lyon',
        deplasLogo: '🇫🇷',
        dakika: "50'",
        tahmin: '+2 Gol',
        kontrol: 'pending',
        cleanText: 'PSG - Lyon ( 2 - 0 ) Ligue 1 Minute: 50 +2 Gol AlertCode: D [Kontrol Bekliyor]',
        not: 'API-Football eşleştirmesi bekliyor'
    },
]

const botOptions = ['Tümü', 'ALERT: D', 'Algoritma: 01', 'BOT 007', 'Alert Code: 2', 'AlertCode: 17']

export default function PredictionLogsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBot, setSelectedBot] = useState('Tümü')
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'pending' | 'error'>('all')
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedRows(newExpanded)
    }

    // Filter logs
    const filteredLogs = sampleLogs.filter(log => {
        const matchesSearch = !searchQuery ||
            log.cleanText.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.evTakim.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.deplasTakim.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.botGrup.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesBot = selectedBot === 'Tümü' || log.botGrup === selectedBot
        const matchesStatus = statusFilter === 'all' || log.kontrol === statusFilter

        return matchesSearch && matchesBot && matchesStatus
    })

    // Stats
    const stats = {
        total: sampleLogs.length,
        success: sampleLogs.filter(l => l.kontrol === 'success').length,
        pending: sampleLogs.filter(l => l.kontrol === 'pending').length,
        error: sampleLogs.filter(l => l.kontrol === 'error').length,
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Tahmin Logları</h1>
                    <p className="text-slate-400">AI sisteminden gelen ham tahmin verilerini inceleyin</p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition-colors">
                    <Download size={16} />
                    Dışa Aktar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                    <div className="text-xs text-slate-500">Toplam Log</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={20} className="text-green-400" />
                        <div className="text-2xl font-bold text-green-400">{stats.success}</div>
                    </div>
                    <div className="text-xs text-green-400/70">Başarılı</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2">
                        <RefreshCw size={20} className="text-yellow-400" />
                        <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                    </div>
                    <div className="text-xs text-yellow-400/70">Bekliyor</div>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-400" />
                        <div className="text-2xl font-bold text-red-400">{stats.error}</div>
                    </div>
                    <div className="text-xs text-red-400/70">Hata</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Takım, bot grup, tahmin ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20"
                    />
                </div>

                <div className="relative">
                    <select
                        value={selectedBot}
                        onChange={(e) => setSelectedBot(e.target.value)}
                        className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-white/20 cursor-pointer min-w-[150px]"
                    >
                        {botOptions.map(bot => (
                            <option key={bot} value={bot} className="bg-[#1a1a1a]">{bot}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>

                <div className="flex gap-2">
                    {(['all', 'success', 'pending', 'error'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                ? status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                        status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            'bg-white/10 text-white border border-white/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {status === 'all' ? 'Tümü' : status === 'success' ? 'Başarılı' : status === 'pending' ? 'Bekliyor' : 'Hata'}
                        </button>
                    ))}
                </div>

                <div className="relative ml-auto">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-white/20 cursor-pointer"
                    >
                        <option value={10} className="bg-[#1a1a1a]">10</option>
                        <option value={25} className="bg-[#1a1a1a]">25</option>
                        <option value={50} className="bg-[#1a1a1a]">50</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[40px]">#</th>
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[140px]">Tarih</th>
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[120px]">Bot Grup</th>
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[180px]">Lig</th>
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[150px]">Ev Takım</th>
                                <th className="text-center px-4 py-4 text-sm font-medium text-slate-400 w-[70px]">Skor</th>
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[150px]">Deplasman Takım</th>
                                <th className="text-center px-4 py-4 text-sm font-medium text-slate-400 w-[60px]">Dakika</th>
                                <th className="text-left px-4 py-4 text-sm font-medium text-slate-400 w-[130px]">Tahmin</th>
                                <th className="text-center px-4 py-4 text-sm font-medium text-slate-400 w-[70px]">Kontrol</th>
                                <th className="text-center px-4 py-4 text-sm font-medium text-slate-400 w-[60px]">Not</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLogs.slice(0, itemsPerPage).map((log) => (
                                <>
                                    <tr
                                        key={log.id}
                                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${log.kontrol === 'error' ? 'bg-red-500/5' :
                                            log.kontrol === 'pending' ? 'bg-yellow-500/5' : ''
                                            }`}
                                        onClick={() => toggleRow(log.id)}
                                    >
                                        <td className="px-4 py-4 text-sm text-slate-500">{log.id}</td>

                                        <td className="px-4 py-4">
                                            <div className="text-sm text-white">Kayıt Tarihi: {log.kayitTarihi.split(' ')[0]}</div>
                                            <div className="text-xs text-slate-500">{log.kayitTarihi.split(' ')[1]}</div>
                                            {log.kontrolTarihi && (
                                                <div className="text-xs text-slate-600 mt-1">Kontrol: {log.kontrolTarihi}</div>
                                            )}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-white font-medium">{log.botGrup}</span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-white">{log.lig || '-'}</span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{log.evLogo}</span>
                                                <span className="text-sm text-white">{log.evTakim || '-'}</span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-bold text-white">{log.skor || '-'}</span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{log.deplasLogo}</span>
                                                <span className="text-sm text-white">{log.deplasTakim || '-'}</span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm text-slate-400">{log.dakika || '-'}</span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span className="text-sm text-cyan-400 font-medium">{log.tahmin || '-'}</span>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            {log.kontrol === 'success' ? (
                                                <div className="w-8 h-8 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <CheckCircle2 size={18} className="text-green-400" />
                                                </div>
                                            ) : log.kontrol === 'pending' ? (
                                                <div className="w-8 h-8 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                    <RefreshCw size={18} className="text-yellow-400" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                                                    <XCircle size={18} className="text-red-400" />
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <button
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                onClick={(e) => { e.stopPropagation(); toggleRow(log.id) }}
                                            >
                                                {expandedRows.has(log.id) ? (
                                                    <ChevronUp size={16} className="text-slate-400" />
                                                ) : (
                                                    <ChevronDown size={16} className="text-slate-400" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded CleanText Row */}
                                    {expandedRows.has(log.id) && (
                                        <tr key={`${log.id}-expanded`} className="bg-black/20">
                                            <td colSpan={11} className="px-4 py-3">
                                                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                                                    <div className="text-xs text-slate-500 mb-2 font-bold">CleanText:</div>
                                                    <div className="text-sm text-slate-300 font-mono break-all">
                                                        {log.cleanText}
                                                    </div>
                                                    {log.cleanText.includes('http') && (
                                                        <a
                                                            href={log.cleanText.split('|')[1]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300"
                                                        >
                                                            <ExternalLink size={12} />
                                                            Canlı Skor Linki
                                                        </a>
                                                    )}
                                                    {log.not && (
                                                        <div className="mt-3 pt-3 border-t border-white/5">
                                                            <span className="text-xs text-yellow-400">⚠️ {log.not}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 mb-1">Bilgi</h4>
                        <p className="text-xs text-slate-400">
                            Bu sayfa AI sisteminden gelen ham tahmin verilerini gösterir. Her satıra tıklayarak CleanText detayını görebilirsiniz.
                            <br />
                            <span className="text-green-400">Başarılı:</span> Veri parse edildi ve tahmin oluşturuldu |
                            <span className="text-yellow-400 ml-1">Bekliyor:</span> API-Football eşleştirmesi bekliyor |
                            <span className="text-red-400 ml-1">Hata:</span> Parse veya format hatası
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
