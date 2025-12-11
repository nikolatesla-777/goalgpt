import { NextRequest, NextResponse } from 'next/server'
import { DataProvider } from '@/lib/providers/data-provider'
import { SEGMENT_RULES } from '@/lib/types/segments'
import type { SegmentType } from '@/lib/types/segments'

// =============================================================================
// CRON JOB: SEGMENT UPDATER
// =============================================================================

/**
 * Bu endpoint günlük çalışarak:
 * 1. 7 günden eski new_user'ları free_user'a geçirir
 * 2. Trial süresi bitenleri trial_expired'a geçirir
 * 3. 30+ gün churned olanları winback_target'a geçirir
 * 
 * Vercel Cron veya external cron service tarafından çağrılır.
 * 
 * Güvenlik: CRON_SECRET header'ı ile korunur
 */

export async function GET(request: NextRequest) {
    // Auth check
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = {
        newToFree: 0,
        trialToExpired: 0,
        churnedToWinback: 0,
        errors: [] as string[]
    }

    try {
        const now = new Date()

        // =========================================================================
        // 1. NEW_USER → FREE_USER (7 gün kuralı)
        // =========================================================================

        const sevenDaysAgo = new Date(now.getTime() - SEGMENT_RULES.NEW_USER_DAYS * 24 * 60 * 60 * 1000)

        const { data: newUsers } = await DataProvider.getUsers({
            segment: 'new_user' as SegmentType
        })

        for (const user of newUsers) {
            if (user.created_at < sevenDaysAgo) {
                // Kullanıcı hala new_user ama 7 günden eski
                // Trial başlattı mı, satın aldı mı kontrol et
                if (user.subscription) {
                    // Subscription var → hesaplanmış segment'e geç
                    // Bu durumda webhook zaten segment'i güncellemiş olmalı
                    continue
                }

                // Hiçbir işlem yapmamış → free_user
                await DataProvider.updateUserSegment(user.id, 'free_user')
                results.newToFree++
            }
        }

        // =========================================================================
        // 2. TRIAL_USER → TRIAL_EXPIRED
        // =========================================================================

        const { data: trialUsers } = await DataProvider.getUsers({
            segment: 'trial_user' as SegmentType
        })

        for (const user of trialUsers) {
            if (user.subscription?.trial_end && user.subscription.trial_end < now) {
                // Trial süresi dolmuş
                await DataProvider.updateUserSegment(user.id, 'trial_expired')
                results.trialToExpired++
            }
        }

        // =========================================================================
        // 3. CHURNED_USER → WINBACK_TARGET (30+ gün)
        // =========================================================================

        const thirtyDaysAgo = new Date(now.getTime() - SEGMENT_RULES.WINBACK_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)

        const { data: churnedUsers } = await DataProvider.getUsers({
            segment: 'churned_user' as SegmentType
        })

        for (const user of churnedUsers) {
            if (user.subscription?.expiration_date && user.subscription.expiration_date < thirtyDaysAgo) {
                // 30+ gün önce churn olmuş
                await DataProvider.updateUserSegment(user.id, 'winback_target')
                results.churnedToWinback++
            }
        }

    } catch (error) {
        results.errors.push(String(error))
    }

    const totalUpdated = results.newToFree + results.trialToExpired + results.churnedToWinback

    console.log(`[CRON] Segment update completed: ${totalUpdated} users updated`, results)

    return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        updated: totalUpdated,
        details: results
    })
}

// POST için de aynı handler (bazı cron servisleri POST kullanır)
export async function POST(request: NextRequest) {
    return GET(request)
}
