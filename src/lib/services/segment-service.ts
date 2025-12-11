// ============================================================================
// SEGMENT SERVICE
// Segment hesaplama ve yönetimi için yardımcı servis
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { SegmentType, RevenueCatEventType } from '../types/revenuecat';

// Supabase admin client setup
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// ============================================================================
// SEGMENT DEFINITIONS
// ============================================================================

export interface SegmentDefinition {
    id: SegmentType;
    label: string;
    labelTr: string;
    description: string;
    color: string;
    icon: string;
    priority: number; // Segment önceliği (düşük = önemli)
}

export const SEGMENT_DEFINITIONS: Record<SegmentType, SegmentDefinition> = {
    // Registration & Onboarding
    new_user: {
        id: 'new_user',
        label: 'New User',
        labelTr: 'Yeni Kullanıcı',
        description: 'Henüz kayıt olmamış veya yeni kayıt olmuş kullanıcı',
        color: 'bg-slate-100 text-slate-700',
        icon: '👤',
        priority: 10
    },
    new_registration: {
        id: 'new_registration',
        label: 'New Registration',
        labelTr: 'Yeni Kayıt',
        description: 'Kayıt olmuş ama henüz abonelik başlamamış',
        color: 'bg-blue-100 text-blue-700',
        icon: '🆕',
        priority: 9
    },
    // Trial
    trial_user: {
        id: 'trial_user',
        label: 'Trial User',
        labelTr: 'Deneme Kullanıcısı',
        description: 'Deneme süresinde olan kullanıcı',
        color: 'bg-cyan-100 text-cyan-700',
        icon: '🎯',
        priority: 6
    },
    trial_started: {
        id: 'trial_started',
        label: 'Trial Started',
        labelTr: 'Deneme Başladı',
        description: 'Deneme süresi yeni başlamış kullanıcı',
        color: 'bg-cyan-100 text-cyan-700',
        icon: '🎯',
        priority: 6
    },
    trial_expired: {
        id: 'trial_expired',
        label: 'Trial Expired',
        labelTr: 'Deneme Bitmiş',
        description: 'Deneme süresi dolmuş, dönüşüm olmamış',
        color: 'bg-orange-100 text-orange-700',
        icon: '⏰',
        priority: 4
    },
    trial_converted: {
        id: 'trial_converted',
        label: 'Trial Converted',
        labelTr: 'Dönüşüm',
        description: 'Denemeden ödemeye geçiş yapmış',
        color: 'bg-emerald-100 text-emerald-700',
        icon: '✅',
        priority: 3
    },
    // Paying Customers
    first_purchase: {
        id: 'first_purchase',
        label: 'First Purchase',
        labelTr: 'İlk Satış',
        description: 'İlk ödemeyi yapmış kullanıcı',
        color: 'bg-green-100 text-green-700',
        icon: '💰',
        priority: 5
    },
    paying_customer: {
        id: 'paying_customer',
        label: 'Paying Customer',
        labelTr: 'Ödeme Yapan',
        description: 'Aktif ödeme yapan müşteri',
        color: 'bg-green-100 text-green-700',
        icon: '💳',
        priority: 3
    },
    active_subscriber: {
        id: 'active_subscriber',
        label: 'Active Subscriber',
        labelTr: 'Aktif Abone',
        description: 'Aktif aboneliği olan kullanıcı',
        color: 'bg-green-100 text-green-700',
        icon: '✅',
        priority: 2
    },
    loyal_subscriber: {
        id: 'loyal_subscriber',
        label: 'Loyal Subscriber',
        labelTr: 'Sadık Abone',
        description: '6+ ay kesintisiz abone',
        color: 'bg-yellow-100 text-yellow-700',
        icon: '⭐',
        priority: 1
    },
    // Issues & Churn
    payment_error: {
        id: 'payment_error',
        label: 'Payment Error',
        labelTr: 'Ödeme Hatası',
        description: 'Ödeme hatası yaşayan kullanıcı',
        color: 'bg-orange-100 text-orange-700',
        icon: '⚠️',
        priority: 2
    },
    grace_period: {
        id: 'grace_period',
        label: 'Grace Period',
        labelTr: 'Ödeme Bekleniyor',
        description: 'Grace period içindeki kullanıcı',
        color: 'bg-amber-100 text-amber-700',
        icon: '⏳',
        priority: 2
    },
    subscription_cancel: {
        id: 'subscription_cancel',
        label: 'Subscription Cancel',
        labelTr: 'İptal',
        description: 'Aboneliğini iptal etmiş kullanıcı',
        color: 'bg-red-100 text-red-700',
        icon: '❌',
        priority: 3
    },
    churned: {
        id: 'churned',
        label: 'Churned',
        labelTr: 'Süresi Bitti',
        description: 'Aboneliği sona ermiş kullanıcı',
        color: 'bg-slate-200 text-slate-700',
        icon: '💀',
        priority: 4
    },
    churned_user: {
        id: 'churned_user',
        label: 'Churned User',
        labelTr: 'Ayrılan Kullanıcı',
        description: 'Aboneliğini sonlandırmış kullanıcı',
        color: 'bg-slate-200 text-slate-700',
        icon: '💀',
        priority: 4
    },
    // Special States
    paused_user: {
        id: 'paused_user',
        label: 'Paused User',
        labelTr: 'Duraklatılmış',
        description: 'Aboneliği duraklatılmış (Google Play)',
        color: 'bg-slate-100 text-slate-600',
        icon: '⏸️',
        priority: 5
    },
    refunded_user: {
        id: 'refunded_user',
        label: 'Refunded User',
        labelTr: 'Geri Ödeme',
        description: 'Geri ödeme almış kullanıcı',
        color: 'bg-red-100 text-red-700',
        icon: '💸',
        priority: 3
    },
    win_back: {
        id: 'win_back',
        label: 'Win Back',
        labelTr: 'Geri Döndü',
        description: 'İptalden geri dönen kullanıcı',
        color: 'bg-purple-100 text-purple-700',
        icon: '🔄',
        priority: 2
    },
    winback_target: {
        id: 'winback_target',
        label: 'Winback Target',
        labelTr: 'Geri Kazanım Hedefi',
        description: '30+ gün churned, geri kazanım hedefi',
        color: 'bg-indigo-100 text-indigo-700',
        icon: '🎯',
        priority: 3
    },
    promo_user: {
        id: 'promo_user',
        label: 'Promo User',
        labelTr: 'Promokod',
        description: 'Promokod ile gelen kullanıcı',
        color: 'bg-pink-100 text-pink-700',
        icon: '🎁',
        priority: 5
    },
    free_user: {
        id: 'free_user',
        label: 'Free User',
        labelTr: 'Free',
        description: 'Ücretsiz kullanıcı',
        color: 'bg-slate-50 text-slate-500',
        icon: '👤',
        priority: 10
    }
};

// ============================================================================
// SEGMENT SERVICE CLASS
// ============================================================================

export class SegmentService {

    /**
     * Kullanıcının segment'ini belirle (mevcut verilere göre)
     */
    static calculateSegmentFromUser(user: {
        subscription_status?: string;
        total_payments?: number;
        consecutive_months?: number;
        trial_started_at?: string;
        churned_at?: string;
        grace_period_started_at?: string;
        paused_at?: string;
        refunded_at?: string;
        winback_at?: string;
        ltv?: number;
    }): SegmentType {
        // Paused
        if (user.paused_at) return 'paused_user';

        // Refunded
        if (user.refunded_at) return 'refunded_user';

        // Grace period
        if (user.subscription_status === 'GRACE_PERIOD' || user.grace_period_started_at) {
            return 'grace_period';
        }

        // Active states
        if (user.subscription_status === 'ACTIVE') {
            if (user.consecutive_months && user.consecutive_months >= 6) {
                return 'loyal_subscriber';
            }
            if (user.winback_at) {
                return 'win_back';
            }
            return 'active_subscriber';
        }

        // Trial
        if (user.subscription_status === 'TRIAL') {
            return 'trial_started';
        }

        // Expired states
        if (user.subscription_status === 'EXPIRED') {
            // Trial expire mı yoksa paid expire mı?
            if (user.trial_started_at && (!user.total_payments || user.total_payments === 0)) {
                return 'trial_expired';
            }

            // 30+ gün churned ise winback target
            if (user.churned_at) {
                const churnedDate = new Date(user.churned_at);
                const daysSinceChurn = Math.floor((Date.now() - churnedDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceChurn >= 30) {
                    return 'winback_target';
                }
            }

            return 'churned';
        }

        // New user / no subscription
        if (!user.subscription_status && !user.ltv) {
            return 'new_registration';
        }

        return 'free_user';
    }

    /**
     * Segment güncelle ve logla
     */
    static async updateUserSegment(
        userId: string,
        newSegment: SegmentType,
        reason: string,
        eventType?: RevenueCatEventType,
        metadata?: Record<string, any>
    ): Promise<void> {
        // Mevcut segment'i al
        const { data: user } = await getSupabaseAdmin()
            .from('profiles')
            .select('current_segment')
            .eq('id', userId)
            .single();

        const previousSegment = user?.current_segment;

        // Segment değişti mi kontrol et
        if (previousSegment === newSegment) {
            console.log(`[SegmentService] Segment unchanged for user ${userId}: ${newSegment}`);
            return;
        }

        // Profile güncelle
        await getSupabaseAdmin()
            .from('profiles')
            .update({
                current_segment: newSegment,
                segment_updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        // Segment geçmişine ekle
        await getSupabaseAdmin()
            .from('user_segments')
            .insert({
                user_id: userId,
                segment: newSegment,
                previous_segment: previousSegment,
                reason,
                event_type: eventType,
                metadata: metadata || {}
            });

        console.log(`[SegmentService] Segment updated: ${userId} ${previousSegment} -> ${newSegment}`);
    }

    /**
     * Tüm segment tanımlarını getir
     */
    static getSegmentDefinitions(): Record<SegmentType, SegmentDefinition> {
        return SEGMENT_DEFINITIONS;
    }

    /**
     * Segment label'ını getir
     */
    static getSegmentLabel(segment: SegmentType, language: 'en' | 'tr' = 'tr'): string {
        const def = SEGMENT_DEFINITIONS[segment];
        return language === 'tr' ? def?.labelTr : def?.label;
    }

    /**
     * Segment rengini getir
     */
    static getSegmentColor(segment: SegmentType): string {
        return SEGMENT_DEFINITIONS[segment]?.color || 'bg-slate-100 text-slate-700';
    }

    /**
     * Winback hedeflerini bul (cron job için)
     * 30+ gün churned olan kullanıcıları winback_target olarak işaretle
     */
    static async markWinbackTargets(): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: users, error } = await getSupabaseAdmin()
            .from('profiles')
            .select('id')
            .eq('subscription_status', 'EXPIRED')
            .in('current_segment', ['churned', 'churned_user'])
            .lt('churned_at', thirtyDaysAgo.toISOString());

        if (error || !users) return 0;

        for (const user of users) {
            await this.updateUserSegment(
                user.id,
                'winback_target',
                '30+ gün churned - Geri kazanım hedefi',
                undefined,
                { auto_marked: true }
            );
        }

        return users.length;
    }

    /**
     * Segment istatistiklerini getir
     */
    static async getSegmentStats(): Promise<Record<SegmentType, number>> {
        const { data } = await getSupabaseAdmin()
            .from('profiles')
            .select('current_segment');

        const stats: Record<string, number> = {};

        (data || []).forEach((profile: any) => {
            const segment = profile.current_segment || 'free_user';
            stats[segment] = (stats[segment] || 0) + 1;
        });

        return stats as Record<SegmentType, number>;
    }
}

// Export segment definitions for client-side use
export { SEGMENT_DEFINITIONS as segmentDefinitions };
