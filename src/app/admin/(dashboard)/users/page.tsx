import { Search, Smartphone, Calendar, CreditCard, Link as LinkIcon, Filter, User } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
    const supabase = await createClient()
    const query = searchParams?.q || ''

    // Build Query
    let dbQuery = supabase
        .from('profiles')
        .select(`
            id,
            email,
            created_at,
            full_name,
            referred_by,
            subscriptions (
                status,
                plan_id,
                platform,
                starts_at
            )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

    if (query) {
        dbQuery = dbQuery.ilike('email', `%${query}%`)
    }

    const { data: profiles, error } = await dbQuery

    if (error) {
        console.error('Error fetching users:', error)
    }

    // Process Data
    const users = (profiles || []).map(profile => {
        const subs = Array.isArray(profile.subscriptions) ? profile.subscriptions : []
        // Get active or latest sub
        const activeSub = subs.find(s => s.status === 'active' || s.status === 'trial')
        const latestSub = subs.sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime())[0]

        const displaySub = activeSub || latestSub
        const status = activeSub ? 'active' : (latestSub ? 'expired' : 'free')

        return {
            id: profile.id,
            email: profile.email,
            platform: displaySub?.platform === 'ios' ? 'iOS' : (displaySub?.platform === 'android' ? 'Android' : 'Web'),
            plan: displaySub?.plan_id || 'Free',
            joined: new Date(profile.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
            ref: profile.referred_by,
            status: status
        }
    })

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Global Kullanıcı Yönetimi 🌍</h1>
                <p className="text-slate-400 text-sm mt-1">Uygulamayı kullanan herkesi (Referanslı/Referanssız) burada arayabilirsin.</p>
            </div>

            {/* Search Bar (Server Side Form) */}
            <form className="flex gap-4">
                <div className="flex-1 relative">
                    <input
                        name="q"
                        type="text"
                        defaultValue={query}
                        placeholder="E-posta veya kullanıcı adı ile ara..."
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-slate-700"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                </div>
                <button type="submit" className="px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-2">
                    <Filter size={20} />
                    <span className="hidden sm:inline">Ara</span>
                </button>
            </form>

            {/* Results List */}
            <div className="space-y-4">
                {users.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Kullanıcı bulunamadı.
                    </div>
                )}

                {users.map((user) => (
                    <div key={user.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors group relative overflow-hidden">
                        {/* Active Indicator Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${user.status === 'active' ? 'bg-green-500' :
                            user.status === 'expired' ? 'bg-red-500' : 'bg-slate-700'
                            }`} />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-2">
                            {/* User Info */}
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-3">
                                    {user.email}
                                    {user.status === 'active' && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase border border-green-500/20">Premium</span>}
                                </h3>
                                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <Smartphone size={14} />
                                        {user.platform}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        {user.joined}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <CreditCard size={14} />
                                        {user.plan}
                                    </div>
                                </div>
                            </div>

                            {/* Referrer Info */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 min-w-[200px]">
                                <div className={`p-2 rounded-lg ${user.ref ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                                    <LinkIcon size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Referans</p>
                                    {user.ref ? (
                                        <p className="text-sm font-bold text-blue-400 hover:underline cursor-pointer">@{user.ref}</p>
                                    ) : (
                                        <p className="text-sm font-bold text-slate-600">Organik (Yok)</p>
                                    )}
                                </div>
                            </div>

                            {/* Action */}
                            <Link href={`/admin/users/${user.id}`} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition-colors border border-white/5">
                                Detaylar
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
