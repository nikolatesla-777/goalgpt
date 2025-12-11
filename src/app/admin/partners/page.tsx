
import { createAdminClient } from '@/utils/supabase/server'
import PartnerClientTable, { Partner } from './components/PartnerClientTable'

export default async function AdminPartnersPage() {
    // 1. Initialize Supabase Admin Client (Bypasses RLS)
    const supabase = await createAdminClient()

    // 2. Fetch Partners with Profile info
    const { data: partners, error } = await supabase
        .from('partners')
        .select(`
            id,
            ref_code,
            tier,
            commission_rate,
            balance,
            total_earnings,
            profile:profiles!inner(full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching partners:', error)
        return (
            <div className="p-8 text-red-500">
                Veriler yüklenirken bir hata oluştu: {error.message}
            </div>
        )
    }

    // 3. Transform data to match component interface
    // Note: Supabase types might need assertion or mapping if not auto-generated
    const formattedPartners: Partner[] = (partners || []).map((p: any) => ({
        id: p.id,
        ref_code: p.ref_code,
        tier: p.tier,
        commission_rate: p.commission_rate,
        balance: p.balance,
        total_earnings: p.total_earnings,
        status: 'active', // Default
        profile: {
            full_name: p.profile.full_name,
            email: p.profile.email,
            avatar_url: p.profile.avatar_url
        }
    }))

    return <PartnerClientTable initialPartners={formattedPartners} />
}
