import { Activity, Trophy, Calendar, MapPin, TrendingUp, Info } from 'lucide-react'

// This will be a server component that receives params
export default function MatchDetailPage({ params }: { params: { id: string } }) {
    // In a real implementation, you would fetch match details here
    // const match = await fetchMatchDetail(params.id)

    return (
        <div className="min-h-screen bg-[#fafafa] p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Back Link */}
                <a href="/admin/livescore" className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors">
                    ← LiveScore Merkezine Dön
                </a>

                {/* Match Header Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🇪🇸</span>
                            <span className="font-bold text-slate-700">La Liga • 12. Hafta</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            CANLI • 67'
                        </div>
                    </div>

                    <div className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Home */}
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-4xl shadow-inner">
                                BA
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 text-center">Barcelona</h2>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-6xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
                                <span>2</span>
                                <span className="text-slate-300">-</span>
                                <span>1</span>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                2. Yarı Oynanıyor
                            </span>
                        </div>

                        {/* Away */}
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-4xl shadow-inner">
                                RE
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 text-center">Real Madrid</h2>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Stats */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Maç İstatistikleri
                            </h3>

                            <div className="space-y-6">
                                <StatBar label="Topla Oynama" home={65} away={35} color="blue" />
                                <StatBar label="Şut" home={12} away={4} color="emerald" />
                                <StatBar label="İsabetli Şut" home={5} away={1} color="emerald" />
                                <StatBar label="Korner" home={8} away={2} color="amber" />
                                <StatBar label="Faul" home={10} away={14} color="red" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-purple-500" />
                                Maç Hakkında
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Stadyum" value="Camp Nou (Barcelona)" icon={<MapPin className="w-4 h-4" />} />
                                <InfoItem label="Hakem" value="Jesus Gil Manzano" icon={<Trophy className="w-4 h-4" />} />
                                <InfoItem label="Tarih" value="13.12.2025 19:45" icon={<Calendar className="w-4 h-4" />} />
                                <InfoItem label="Hava Durumu" value="12°C, Açık" icon={<Activity className="w-4 h-4" />} />
                            </div>
                        </div>
                    </div>

                    {/* Standings / Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-orange-500" />
                                Puan Durumu
                            </h3>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-xs">
                                        <th className="py-2 text-left">#</th>
                                        <th className="py-2 text-left">Takım</th>
                                        <th className="py-2 text-center">P</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className={i === 1 ? 'bg-blue-50/50' : ''}>
                                            <td className="py-3 font-semibold text-slate-500">{i}.</td>
                                            <td className="py-3 font-medium text-slate-700">Team Name {i}</td>
                                            <td className="py-3 font-bold text-slate-800 text-center">{80 - i * 2}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                            <h4 className="font-bold text-lg mb-2">Biliyor muydunuz?</h4>
                            <p className="text-sm text-blue-100">
                                Barcelona bu sezon evinde oynadığı son 10 maçın 9'unu kazandı.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatBar({ label, home, away, color }: { label: string, home: number, away: number, color: string }) {
    const total = home + away
    const homePercent = (home / total) * 100

    return (
        <div>
            <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                <span>{home}</span>
                <span className="text-slate-400 font-normal text-xs uppercase tracking-wider">{label}</span>
                <span>{away}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${homePercent}%` }} className={`bg-${color}-500 h-full`} />
                <div className="flex-1 bg-slate-200" />
            </div>
        </div>
    )
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon: any }) {
    return (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                {icon}
                <span>{label}</span>
            </div>
            <div className="font-semibold text-slate-700 text-sm truncate" title={value}>
                {value}
            </div>
        </div>
    )
}
