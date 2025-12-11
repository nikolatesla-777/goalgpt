import { Search, SlidersHorizontal, Smartphone, UserX } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPartner } from '../../../utils'
import { createClient } from '@/utils/supabase/server'

// Helper to translate status
const getStatusLabel = (status: string) => {
    switch (status) {
        case 'active': return 'AKTİF VIP'
        case 'free': return 'FREE'
        case 'cancelled': return 'İptal'
        case 'expired': return 'Süre Bitti'
        default: return status.toUpperCase()
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20'
        case 'free': return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
        case 'expired': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
}

export default async function MembersPage({ params }: { params: { status: string } }) {
    const partner = await getPartner()
    if (!partner) redirect('/partner/login')

    const status = params.status
    const supabase = await createClient()

    // 1. Fetch Users referred by this partner
    // We assume 'profiles' has a 'referred_by' column. 
    // And we join with subscriptions to get status.
    // Note: This matches the user's plan request.
    const { data: members, error } = await supabase
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
        .eq('referred_by', partner.ref_code)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Members Error:', error)
    }

    // 2. Process Data
    let processedMembers = (members || []).map(m => {
        // Determine primary status from subscription
        // If has active subscription -> active
        // If has expired subscription -> expired
        // Else -> free

        // Get latest subscription
        // Sort subscriptions by starts_at desc if array
        const subs = Array.isArray(m.subscriptions) ? m.subscriptions : []
        const latestSub = subs.sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime())[0]

        let derivedStatus = 'free'
        let planName = 'Yok'
        let platform = '-'

        if (latestSub) {
            platform = latestSub.platform === 'ios' ? 'iOS' : (latestSub.platform === 'android' ? 'Android' : 'Web')
            planName = latestSub.plan_id // Could map to friendly name if needed

            if (latestSub.status === 'active' || latestSub.status === 'trial') {
                derivedStatus = 'active'
            } else if (latestSub.status === 'expired') {
                derivedStatus = 'expired'
            } else if (latestSub.status === 'cancelled') {
                derivedStatus = 'cancelled'
            }
        }

        // Override logic: if 'new' (registered in last 3 days) and free
        const daysSinceJoin = Math.floor((new Date().getTime() - new Date(m.created_at).getTime()) / (1000 * 3600 * 24))
        if (derivedStatus === 'free' && daysSinceJoin <= 3) {
            derivedStatus = 'new'
        }

        return {
            id: m.id,
            email: m.email,
            joinedAt: new Date(m.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
            status: derivedStatus,
            plan: planName,
            platform: platform,
            totalSpent: 0 // Would calculate from payments logic later
        }
    })

    // 3. Filter by Status Params
    if (status !== 'all') {
        processedMembers = processedMembers.filter(m => m.status === status)
    }

    // Title Logic
    const getTitle = () => {
        switch (status) {
            case 'active': return 'Aktif Aboneler'
            case 'free': return 'Ücretsiz (Potansiyel)'
            case 'cancelled': return 'İptal Edenler'
            case 'expired': return 'Süresi Bitenler'
            case 'new': return 'Yeni Kayıtlar'
            default: return 'Tüm Üyeler'
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        {getTitle()}
                        <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-white/10 text-slate-400 border border-white/5">
                            {processedMembers.length}
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {status === 'all'
                            ? 'Referans kodunuzla kayıt olan tüm kullanıcılar.'
                            : `${getTitle()} listeleniyor.`}
                    </p>
                </div>
            </div>

            {/* Note: Client-side Filter UI removed as it redirects, 
                but we can keep search inputs if we make them work via URL params (search params).
                For now, keeping simple list as per server component conversion.
            */}

            {/* Users List Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="text-[10px] uppercase bg-white/5 text-slate-500 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">#</th>
                                <th className="px-6 py-4">OYUNCU</th>
                                <th className="px-6 py-4">PLATFORM</th>
                                <th className="px-6 py-4">DURUM</th>
                                <th className="px-6 py-4">PAKET</th>
                                <th className="px-6 py-4">KAYIT</th>
                                <th className="px-6 py-4 text-right">KAZANÇ (LTV)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {processedMembers.map((user, index) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                    {/* Rank Column */}
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-8 h-8 mx-auto rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                                            {index + 1}
                                        </div>
                                    </td>

                                    {/* User Column */}
                                    <td className="px-6 py-4 font-bold text-white">
                                        <Link href={`/partner/dashboard/members/detail/${user.id}`} className="flex flex-col hover:text-blue-400 transition-colors">
                                            <span className="text-sm">{user.email}</span>
                                            <span className="text-[10px] text-slate-500 font-normal mt-0.5">ID: {user.id.substring(0, 8)}...</span>
                                        </Link>
                                    </td>

                                    {/* Platform Column */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.platform === 'iOS'
                                                ? <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-slate-300 text-xs"><Smartphone size={12} /> iOS</div>
                                                : (user.platform === 'Android'
                                                    ? <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/10 text-green-400 text-xs"><Smartphone size={12} /> Android</div>
                                                    : <span className="text-xs text-slate-600">-</span>
                                                )
                                            }
                                        </div>
                                    </td>

                                    {/* Status Column */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center justify-center min-w-[80px] px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(user.status)}`}>
                                            {getStatusLabel(user.status)}
                                        </span>
                                    </td>

                                    {/* Plan Column */}
                                    <td className="px-6 py-4 text-white font-medium text-xs">
                                        {user.plan || '-'}
                                    </td>

                                    {/* Date Column */}
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {user.joinedAt}
                                    </td>

                                    {/* LTV Column - Partner sees this as potential earnings base */}
                                    <td className="px-6 py-4 text-right font-bold text-white font-mono text-xs">
                                        {user.totalSpent > 0 ? `₺${user.totalSpent.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}

                            {processedMembers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                                                <UserX size={24} />
                                            </div>
                                            <p>Bu kriterde kullanıcı bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
