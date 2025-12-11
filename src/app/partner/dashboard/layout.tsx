import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PartnerDashboardShell from './components/PartnerDashboardShell'

export default async function PartnerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Auth Check
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/partner/login')
    }

    // 2. Partner Role Check
    const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, tier, profile:profiles(full_name, email)')
        .eq('id', user.id)
        .single()

    if (partnerError || !partner) {
        // Logged in but not a partner
        await supabase.auth.signOut()
        redirect('/partner/login')
    }

    return (
        <PartnerDashboardShell partner={partner}>
            {children}
        </PartnerDashboardShell>
    )
}
