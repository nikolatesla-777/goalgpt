'use server'

import { createClient } from '@/lib/supabase-server'

// =============================================================================
// TYPES (Re-exported for use in other files)
// =============================================================================

export type Profile = {
    id: string
    email: string | null
    username: string | null
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    address: string | null
    user_code: string | null
    is_active: boolean
    is_online: boolean
    is_vip: boolean
    last_seen_at: string | null
    two_fa_enabled: boolean
    email_verified_at: string | null
    phone_verified_at: string | null
    mobile_push_allowed: boolean
    web_push_allowed: boolean
    language: string
    registration_platform: 'ios' | 'android' | 'web' | null
    registration_source: string | null
    registration_ip: string | null
    registration_country: string | null
    last_login_at: string | null
    last_login_ip: string | null
    last_login_country: string | null
    last_login_platform: string | null
    is_vip_override: boolean
    vip_override_by: string | null
    vip_override_at: string | null
    vip_override_reason: string | null
    subscription_status: string | null
    expiration_date: string | null
    platform: 'ios' | 'android' | null
    auto_renew: boolean
    is_trial_used: boolean
    trial_start_date: string | null
    created_at: string
    updated_at: string | null
    deleted_at: string | null
}

export type Subscription = {
    id: string
    user_id: string
    plan_id: string | null
    status: string
    started_at: string | null
    expires_at: string | null
    cancelled_at: string | null
    grace_expires_at: string | null
    auto_renew_enabled: boolean
    store: string
    product_id: string | null
    transaction_id: string | null
    original_transaction_id: string | null
    amount: number | null
    currency: string | null
    platform: string | null
    created_at: string
}

export type SubscriptionEvent = {
    id: string
    user_id: string | null
    subscription_id: string | null
    store: string
    event_type: string
    description: string | null
    transaction_id: string | null
    original_transaction_id: string | null
    created_at: string
}

export type MemberSegment =
    | 'all_users'
    | 'active_subscribers'
    | 'first_time_buyers'
    | 'new_registrations'
    | 'trials_started'
    | 'billing_issues'
    | 'trial_converted'
    | 'win_back'
    | 'loyal_auto_renew'
    | 'voluntary_cancel'
    | 'churned'

export type DateRange = {
    startDate: string | null
    endDate: string | null
}

export type SegmentStats = {
    all_users: number
    active_subscribers: number
    first_time_buyers: number
    new_registrations: number
    trials_started: number
    billing_issues: number
    trial_converted: number
    win_back: number
    loyal_auto_renew: number
    voluntary_cancel: number
    churned: number
}

export type MemberFilters = {
    segment: MemberSegment
    dateRange: DateRange
    search?: string
    platform?: 'ios' | 'android' | 'all'
}

// =============================================================================
// GET MEMBERS BY SEGMENT
// =============================================================================

export async function getMembersBySegment(
    filters: MemberFilters,
    page: number = 1,
    limit: number = 25
): Promise<{ members: Profile[], total: number, error?: string }> {
    const supabase = await createClient()
    const offset = (page - 1) * limit
    const { segment, dateRange, search, platform } = filters

    try {
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .is('deleted_at', null)

        // Apply segment-specific filters
        switch (segment) {
            case 'active_subscribers':
                query = query.eq('subscription_status', 'active')
                break

            case 'new_registrations':
                if (dateRange.startDate) {
                    query = query.gte('created_at', dateRange.startDate)
                }
                if (dateRange.endDate) {
                    query = query.lte('created_at', dateRange.endDate)
                }
                break

            case 'trials_started':
                query = query.eq('is_trial_used', true)
                if (dateRange.startDate) {
                    query = query.gte('trial_start_date', dateRange.startDate)
                }
                if (dateRange.endDate) {
                    query = query.lte('trial_start_date', dateRange.endDate)
                }
                break

            case 'billing_issues':
                query = query.eq('subscription_status', 'grace_period')
                break

            case 'loyal_auto_renew':
                query = query
                    .eq('subscription_status', 'active')
                    .eq('auto_renew', true)
                break

            case 'voluntary_cancel':
                query = query
                    .eq('subscription_status', 'active')
                    .eq('auto_renew', false)
                break

            case 'churned':
                query = query.eq('subscription_status', 'expired')
                if (dateRange.startDate) {
                    query = query.gte('expiration_date', dateRange.startDate)
                }
                if (dateRange.endDate) {
                    query = query.lte('expiration_date', dateRange.endDate)
                }
                break

            case 'all_users':
            default:
                break
        }

        // Apply search filter
        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        // Apply platform filter
        if (platform && platform !== 'all') {
            query = query.eq('platform', platform)
        }

        // Pagination and ordering - sort by most recent activity first
        query = query
            .order('updated_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            console.error('Error fetching members by segment:', error)
            return { members: [], total: 0, error: error.message }
        }

        return { members: data || [], total: count || 0 }
    } catch (err) {
        console.error('Unexpected error:', err)
        return { members: [], total: 0, error: 'Unexpected error' }
    }
}

// =============================================================================
// GET SEGMENT STATS
// =============================================================================

export async function getSegmentStats(): Promise<SegmentStats> {
    const supabase = await createClient()

    const defaultStats: SegmentStats = {
        all_users: 0, active_subscribers: 0, first_time_buyers: 0,
        new_registrations: 0, trials_started: 0, billing_issues: 0,
        trial_converted: 0, win_back: 0, loyal_auto_renew: 0,
        voluntary_cancel: 0, churned: 0
    }

    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const [
            { count: allUsers },
            { count: activeSubscribers },
            { count: billingIssues },
            { count: loyalAutoRenew },
            { count: voluntaryCancel },
            { count: churned },
            { count: trialsStarted },
            { count: newRegistrations }
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'grace_period').is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').eq('auto_renew', true).is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active').eq('auto_renew', false).is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'expired').is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_trial_used', true).is('deleted_at', null),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo).is('deleted_at', null)
        ])

        return {
            all_users: allUsers || 0,
            active_subscribers: activeSubscribers || 0,
            first_time_buyers: 0,
            new_registrations: newRegistrations || 0,
            trials_started: trialsStarted || 0,
            billing_issues: billingIssues || 0,
            trial_converted: 0,
            win_back: 0,
            loyal_auto_renew: loyalAutoRenew || 0,
            voluntary_cancel: voluntaryCancel || 0,
            churned: churned || 0
        }
    } catch (err) {
        console.error('Error getting segment stats:', err)
        return defaultStats
    }
}

// =============================================================================
// GET MEMBER BY ID
// =============================================================================

export async function getMemberById(id: string): Promise<{ member: Profile | null, error?: string }> {
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (error) return { member: null, error: error.message }
    return { member: data }
}

// =============================================================================
// UPDATE MEMBER
// =============================================================================

export async function updateMember(id: string, updates: Partial<Profile>): Promise<{ success: boolean, error?: string }> {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// =============================================================================
// TOGGLE VIP OVERRIDE
// =============================================================================

export async function toggleVipOverride(userId: string, enable: boolean, reason?: string): Promise<{ success: boolean, error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const updates = enable
        ? { is_vip_override: true, vip_override_at: new Date().toISOString(), vip_override_by: user?.id || null, vip_override_reason: reason || 'Manual VIP grant' }
        : { is_vip_override: false, vip_override_at: null, vip_override_by: null, vip_override_reason: null }

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// =============================================================================
// DELETE MEMBER (SOFT)
// =============================================================================

export async function deleteMember(id: string): Promise<{ success: boolean, error?: string }> {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
}

// =============================================================================
// GET SUBSCRIPTIONS & EVENTS
// =============================================================================

export async function getMemberSubscriptions(userId: string): Promise<Subscription[]> {
    const supabase = await createClient()
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    return data || []
}

export async function getMemberEvents(userId: string): Promise<SubscriptionEvent[]> {
    const supabase = await createClient()
    const { data } = await supabase.from('subscription_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
    return data || []
}
