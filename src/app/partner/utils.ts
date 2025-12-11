
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getPartner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/partner/login')
    }

    const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, tier, ref_code, payment_info, profile:profiles(full_name, email)')
        .eq('id', user.id)
        .single()

    if (partnerError || !partner) {
        return null
    }

    const profileData = Array.isArray(partner.profile) ? partner.profile[0] : partner.profile

    return {
        ...partner,
        profile: profileData
    } as any
}
