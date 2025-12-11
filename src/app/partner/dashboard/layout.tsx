import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getPartner } from '../utils'
import PartnerDashboardShell from './components/PartnerDashboardShell'

export default async function PartnerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Get Partner (handles auth & normalization)
    const partner = await getPartner()

    if (!partner) {
        redirect('/partner/login')
    }

    return (
        <PartnerDashboardShell partner={partner}>
            {children}
        </PartnerDashboardShell>
    )
}
