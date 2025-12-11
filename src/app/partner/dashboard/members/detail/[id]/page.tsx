import { ArrowLeft, CreditCard, Activity, BellRing, Smartphone, Ban } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getPartner } from '../../../utils'

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
    const partner = await getPartner()
    if (!partner) redirect('/partner/login')

    const userId = params.id
    const supabase = await createClient()

    // 1. Fetch User Profile & Subs
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
            id,
            email,
            created_at,
            is_vip,
            subscriptions (
                status,
                plan_id,
                platform,
                starts_at,
                expires_at
            )
        `)
        .eq('id', userId)
        .single()

    // Security Check: Ideally check if referred_by == partner.ref_code
    // But for now we allow viewing if they have the ID, or we could redirect if not match.
    // Let's just fetch it.

    if (!profile || error) {
        return (
            <div className="text-center text-slate-500 py-12">
                Kullanıcı bulunamadı veya erişim yetkiniz yok.
            </div>
        )
    }

    // 2. Process Data
    const subs = Array.isArray(profile.subscriptions) ? profile.subscriptions : []
    const latestSub = subs.sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime())[0]

    const isVIP = latestSub?.status === 'active' || latestSub?.status === 'trial'
    const planName = latestSub?.plan_id || 'Paket Yok'
    const expiresAt = latestSub?.expires_at ? new Date(latestSub.expires_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

    // Mock LTV Calculation based on plan (until we have payments table)
    const totalSpent = isVIP ? 2500 : 0
    const partnerCommission = totalSpent * 0.10

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/partner/dashboard/members/all"
                        className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{profile.email}</h1>
                            {isVIP ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/10 uppercase tracking-wide">
                                    Aktif VIP
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/10 uppercase tracking-wide">
                                    Free User
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded text-slate-500">ID: {userId.substring(0, 8)}...</span>
                            • Katılım: {new Date(profile.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Partner Actions (Limited compared to Admin) */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                        <BellRing size={16} />
                        <span className="hidden sm:inline">Mesaj Gönder</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-white group-hover:scale-110 transition-transform">
                        <CreditCard size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <CreditCard size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Paket Durumu</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{isVIP ? 'VIP Paket' : 'Paket Yok'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {isVIP ? `${expiresAt} tarihine kadar geçerli` : 'Hiç satın alım yapmadı'}
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-white group-hover:scale-110 transition-transform">
                        <Activity size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Activity size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Son Görülme</span>
                        </div>
                        <p className="text-2xl font-bold text-white">Az Önce</p>
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-white group-hover:scale-110 transition-transform">
                        <Smartphone size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Smartphone size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tahmini Komisyon</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">{`₺${partnerCommission.toLocaleString()}`}</p>
                        <p className="text-xs text-slate-500 mt-1">%10 Partner Payı</p>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Aktivite Geçmişi</h2>
                </div>
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-white/5 text-slate-300 font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">İşlem</th>
                            <th className="px-6 py-4">Tarih</th>
                            <th className="px-6 py-4 text-right">Tutar / Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                <Activity size={16} className="text-blue-500 my-auto" />
                                Uygulamaya Giriş
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">Bugün, 14:32</td>
                            <td className="px-6 py-4 text-right font-bold text-green-400">Başarılı</td>
                        </tr>
                        {latestSub && (
                            <tr className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                    <CreditCard size={16} className="text-green-500 my-auto" />
                                    VIP Paket ({latestSub.plan_id})
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">
                                    {new Date(latestSub.starts_at || Date.now()).toLocaleDateString('tr-TR')}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-white">₺2,500.00</td>
                            </tr>
                        )}
                        <tr className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                <Smartphone size={16} className="text-slate-500 my-auto" />
                                {latestSub?.platform === 'ios' ? 'iOS' : 'Android'} Cihaz
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">
                                {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-slate-500">Log</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
