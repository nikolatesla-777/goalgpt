/**
 * VIP Helper Functions for Client Components
 * 
 * These functions are NOT server actions, they run on the client.
 * Use these for computing VIP status in UI components.
 */

import type { Profile, Subscription } from './actions'

/**
 * Check if a user is VIP based on profile and subscriptions
 * Priority:
 * 1. Admin VIP Override (is_vip_override = true)
 * 2. Active Subscription (status = 'active' AND expires_at > now)
 * 3. Grace Period (status = 'grace_period' AND grace_expires_at > now)
 * 4. Profile subscription_status = 'ACTIVE'
 */
export function isUserVip(profile: Partial<Profile>, subscriptions?: Subscription[]): boolean {
    // Priority 1: Admin Override
    if (profile.is_vip_override === true) {
        return true
    }

    const now = new Date()

    // Priority 2: Active Subscription
    if (subscriptions && subscriptions.length > 0) {
        const hasActiveSubscription = subscriptions.some(sub =>
            sub.status === 'active' &&
            sub.expires_at &&
            new Date(sub.expires_at) > now
        )
        if (hasActiveSubscription) {
            return true
        }

        // Priority 3: Grace Period
        const inGracePeriod = subscriptions.some(sub =>
            sub.status === 'grace_period' &&
            sub.grace_expires_at &&
            new Date(sub.grace_expires_at) > now
        )
        if (inGracePeriod) {
            return true
        }
    }

    // Fallback: Check subscription_status on profile (support both cases)
    const status = profile.subscription_status?.toUpperCase()
    if (status === 'ACTIVE' && profile.expiration_date) {
        return new Date(profile.expiration_date) > now
    }

    return false
}
