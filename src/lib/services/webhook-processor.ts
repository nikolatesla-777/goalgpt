// ============================================================================
// WEBHOOK PROCESSOR SERVICE
// RevenueCat webhook event'lerini işleyen ana servis
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
    RevenueCatWebhookEvent,
    RevenueCatEventType,
    SegmentType,
    convertToTRY,
    SegmentChangeRequest
} from '../types/revenuecat';

// Supabase admin client (service role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// MAIN PROCESSOR CLASS
// ============================================================================

export class WebhookProcessor {

    /**
     * Ana işleme fonksiyonu - tüm event'leri buradan geçir
     */
    static async processEvent(payload: RevenueCatWebhookEvent): Promise<{
        success: boolean;
        segment?: SegmentType;
        error?: string;
    }> {
        const event = payload.event;

        console.log(`[WebhookProcessor] Processing event: ${event.type} for user: ${event.app_user_id}`);

        try {
            // 1. Event'i kaydet (audit log)
            const eventRecord = await this.saveEventLog(payload);

            // 2. Kullanıcıyı bul veya oluştur
            const user = await this.findOrCreateUser(event.app_user_id, event);

            if (!user) {
                throw new Error(`User not found and could not be created: ${event.app_user_id}`);
            }

            // 3. Event tipine göre handler çağır
            const newSegment = await this.handleEventByType(event, user);

            // 4. Event'i işlenmiş olarak işaretle
            await this.markEventProcessed(eventRecord.id);

            console.log(`[WebhookProcessor] Event processed successfully. New segment: ${newSegment}`);

            return { success: true, segment: newSegment };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[WebhookProcessor] Error processing event:`, errorMessage);

            // Hata logla
            await this.logError(payload.event.id, errorMessage);

            return { success: false, error: errorMessage };
        }
    }

    /**
     * Event tipine göre uygun handler'ı çağır
     */
    private static async handleEventByType(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        switch (event.type) {
            case 'INITIAL_PURCHASE':
                return await this.handleInitialPurchase(event, user);

            case 'RENEWAL':
                return await this.handleRenewal(event, user);

            case 'CANCELLATION':
                return await this.handleCancellation(event, user);

            case 'UNCANCELLATION':
                return await this.handleUncancellation(event, user);

            case 'BILLING_ISSUE':
                return await this.handleBillingIssue(event, user);

            case 'EXPIRATION':
                return await this.handleExpiration(event, user);

            case 'SUBSCRIPTION_PAUSED':
                return await this.handleSubscriptionPaused(event, user);

            case 'NON_RENEWING_PURCHASE':
                return await this.handleNonRenewingPurchase(event, user);

            case 'PRODUCT_CHANGE':
                return await this.handleProductChange(event, user);

            case 'SUBSCRIPTION_EXTENDED':
                return await this.handleSubscriptionExtended(event, user);

            case 'TEST':
                console.log('[WebhookProcessor] Test event received');
                return user.current_segment || 'new_user';

            default:
                console.log(`[WebhookProcessor] Unhandled event type: ${event.type}`);
                return user.current_segment || 'new_user';
        }
    }

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * INITIAL_PURCHASE - İlk satın alma veya trial başlangıç
     */
    private static async handleInitialPurchase(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const isTrial = event.period_type === 'TRIAL';
        const priceInTry = convertToTRY(event.price, event.currency);

        // Segment belirle
        let newSegment: SegmentType = isTrial ? 'trial_started' : 'first_purchase';

        // User profile güncelle
        const updates: any = {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            subscription_status: isTrial ? 'TRIAL' : 'ACTIVE',
            platform: event.store === 'APP_STORE' ? 'ios' : 'android',
            expiration_date: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
            auto_renew_status: true,
        };

        if (isTrial) {
            updates.trial_started_at = new Date(event.purchased_at_ms).toISOString();
            updates.is_trial_used = true;
        } else {
            updates.total_payments = (user.total_payments || 0) + 1;
            updates.last_payment_at = new Date(event.purchased_at_ms).toISOString();
            updates.ltv = (user.ltv || 0) + priceInTry;
            updates.consecutive_months = 1;
        }

        await this.updateUserProfile(user.id, updates);

        // Segment değişikliği logla
        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: isTrial ? 'Trial başladı' : 'İlk satın alma',
            event_type: 'INITIAL_PURCHASE',
            metadata: { product_id: event.product_id, price: event.price, currency: event.currency }
        });

        // Revenue transaction kaydet (trial değilse)
        if (!isTrial) {
            await this.saveRevenueTransaction(user.id, event, priceInTry);
        }

        return newSegment;
    }

    /**
     * RENEWAL - Abonelik yenileme
     */
    private static async handleRenewal(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const priceInTry = convertToTRY(event.price, event.currency);
        const consecutiveMonths = (user.consecutive_months || 0) + 1;

        // 6+ ay ise loyal_subscriber
        const newSegment: SegmentType = consecutiveMonths >= 6 ? 'loyal_subscriber' : 'active_subscriber';

        const updates = {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            subscription_status: 'ACTIVE',
            expiration_date: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
            auto_renew_status: true,
            total_payments: (user.total_payments || 0) + 1,
            last_payment_at: new Date(event.purchased_at_ms).toISOString(),
            ltv: (user.ltv || 0) + priceInTry,
            consecutive_months: consecutiveMonths,
            // Reset churn/grace fields
            churned_at: null,
            grace_period_started_at: null,
        };

        await this.updateUserProfile(user.id, updates);

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: `Yenileme #${consecutiveMonths}`,
            event_type: 'RENEWAL',
            metadata: { consecutive_months: consecutiveMonths, renewal_number: event.renewal_number }
        });

        await this.saveRevenueTransaction(user.id, event, priceInTry);

        return newSegment;
    }

    /**
     * CANCELLATION - Abonelik iptali
     */
    private static async handleCancellation(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const newSegment: SegmentType = 'subscription_cancel';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            auto_renew_status: false,
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: event.cancel_reason || 'Kullanıcı iptal etti',
            event_type: 'CANCELLATION',
            metadata: { cancel_reason: event.cancel_reason }
        });

        return newSegment;
    }

    /**
     * UNCANCELLATION - İptal geri alma (win back)
     */
    private static async handleUncancellation(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const newSegment: SegmentType = 'win_back';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            auto_renew_status: true,
            winback_at: new Date().toISOString(),
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: 'İptal geri alındı',
            event_type: 'UNCANCELLATION'
        });

        return newSegment;
    }

    /**
     * BILLING_ISSUE - Ödeme hatası (grace period)
     */
    private static async handleBillingIssue(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const newSegment: SegmentType = 'grace_period';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            subscription_status: 'GRACE_PERIOD',
            grace_period_started_at: new Date().toISOString(),
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: 'Ödeme hatası - Grace period başladı',
            event_type: 'BILLING_ISSUE'
        });

        return newSegment;
    }

    /**
     * EXPIRATION - Abonelik süresi doldu
     */
    private static async handleExpiration(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        // Trial ise trial_expired, değilse churned
        const wasTrial = user.subscription_status === 'TRIAL' || user.trial_started_at && !user.total_payments;
        const newSegment: SegmentType = wasTrial ? 'trial_expired' : 'churned';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            subscription_status: 'EXPIRED',
            auto_renew_status: false,
            churned_at: new Date().toISOString(),
            trial_ended_at: wasTrial ? new Date().toISOString() : user.trial_ended_at,
            consecutive_months: 0, // Reset
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: wasTrial ? 'Deneme süresi doldu' : 'Abonelik süresi doldu',
            event_type: 'EXPIRATION'
        });

        return newSegment;
    }

    /**
     * SUBSCRIPTION_PAUSED - Abonelik duraklatıldı (sadece Google Play)
     */
    private static async handleSubscriptionPaused(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const newSegment: SegmentType = 'paused_user';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            paused_at: new Date().toISOString(),
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: 'Abonelik duraklatıldı',
            event_type: 'SUBSCRIPTION_PAUSED'
        });

        return newSegment;
    }

    /**
     * NON_RENEWING_PURCHASE - Tek seferlik satın alma
     */
    private static async handleNonRenewingPurchase(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const priceInTry = convertToTRY(event.price, event.currency);
        const newSegment: SegmentType = 'first_purchase';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            total_payments: (user.total_payments || 0) + 1,
            last_payment_at: new Date(event.purchased_at_ms).toISOString(),
            ltv: (user.ltv || 0) + priceInTry,
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: 'Tek seferlik satın alma',
            event_type: 'NON_RENEWING_PURCHASE'
        });

        await this.saveRevenueTransaction(user.id, event, priceInTry);

        return newSegment;
    }

    /**
     * PRODUCT_CHANGE - Plan değişikliği
     */
    private static async handleProductChange(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const newSegment: SegmentType = 'active_subscriber';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            expiration_date: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: 'Plan değişikliği',
            event_type: 'PRODUCT_CHANGE',
            metadata: { new_product: event.product_id }
        });

        return newSegment;
    }

    /**
     * SUBSCRIPTION_EXTENDED - Abonelik uzatıldı
     */
    private static async handleSubscriptionExtended(
        event: RevenueCatWebhookEvent['event'],
        user: any
    ): Promise<SegmentType> {
        const newSegment: SegmentType = 'active_subscriber';

        await this.updateUserProfile(user.id, {
            current_segment: newSegment,
            segment_updated_at: new Date().toISOString(),
            subscription_status: 'ACTIVE',
            expiration_date: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
        });

        await this.logSegmentChange({
            user_id: user.id,
            new_segment: newSegment,
            reason: 'Abonelik uzatıldı',
            event_type: 'SUBSCRIPTION_EXTENDED'
        });

        return newSegment;
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Event'i veritabanına kaydet (audit log)
     */
    private static async saveEventLog(payload: RevenueCatWebhookEvent) {
        const event = payload.event;

        const { data, error } = await supabaseAdmin
            .from('revenuecat_events')
            .insert({
                event_id: event.id,
                app_user_id: event.app_user_id,
                event_type: event.type,
                product_id: event.product_id,
                price: event.price,
                currency: event.currency,
                price_in_try: convertToTRY(event.price, event.currency),
                store: event.store,
                environment: event.environment,
                is_trial: event.period_type === 'TRIAL',
                is_trial_conversion: event.is_trial_conversion || false,
                expiration_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
                original_transaction_id: event.original_transaction_id,
                presented_offering_id: event.presented_offering_id,
                country_code: event.country_code,
                raw_payload: payload,
            })
            .select()
            .single();

        if (error) {
            console.error('[WebhookProcessor] Error saving event log:', error);
            throw error;
        }

        return data;
    }

    /**
     * Kullanıcıyı bul veya oluştur
     */
    private static async findOrCreateUser(appUserId: string, event: RevenueCatWebhookEvent['event']) {
        // Önce mevcut kullanıcıyı ara
        let { data: user } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', appUserId)
            .single();

        if (!user) {
            // Email ile de dene
            const email = event.subscriber_attributes?.['$email']?.value;
            if (email) {
                const { data: userByEmail } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('email', email)
                    .single();

                user = userByEmail;
            }
        }

        // Hala bulunamadıysa yeni kayıt oluştur (opsiyonel)
        // Not: Genellikle kullanıcı zaten kayıtlı olmalı
        if (!user) {
            console.warn(`[WebhookProcessor] User not found: ${appUserId}`);
            // Burada yeni kullanıcı oluşturabilirsin veya hata fırlatabilirsin
        }

        return user;
    }

    /**
     * Kullanıcı profilini güncelle
     */
    private static async updateUserProfile(userId: string, updates: Record<string, any>) {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            console.error('[WebhookProcessor] Error updating user profile:', error);
            throw error;
        }
    }

    /**
     * Segment değişikliğini logla
     */
    private static async logSegmentChange(request: SegmentChangeRequest) {
        // Önce mevcut segment'i al
        const { data: user } = await supabaseAdmin
            .from('profiles')
            .select('current_segment')
            .eq('id', request.user_id)
            .single();

        const { error } = await supabaseAdmin
            .from('user_segments')
            .insert({
                user_id: request.user_id,
                segment: request.new_segment,
                previous_segment: user?.current_segment,
                reason: request.reason,
                event_type: request.event_type,
                metadata: request.metadata || {},
            });

        if (error) {
            console.error('[WebhookProcessor] Error logging segment change:', error);
        }
    }

    /**
     * Revenue transaction kaydet
     */
    private static async saveRevenueTransaction(
        userId: string,
        event: RevenueCatWebhookEvent['event'],
        priceInTry: number
    ) {
        const transactionType = event.type === 'INITIAL_PURCHASE' ? 'INITIAL_PURCHASE' :
            event.type === 'RENEWAL' ? 'RENEWAL' :
                event.is_trial_conversion ? 'TRIAL_CONVERSION' : 'INITIAL_PURCHASE';

        await supabaseAdmin
            .from('revenue_transactions')
            .insert({
                user_id: userId,
                transaction_id: event.original_transaction_id,
                amount: event.price,
                currency: event.currency,
                amount_in_try: priceInTry,
                transaction_type: transactionType,
                store: event.store === 'APP_STORE' ? 'APPLE' : 'GOOGLE',
            });
    }

    /**
     * Event'i işlenmiş olarak işaretle
     */
    private static async markEventProcessed(eventId: string) {
        await supabaseAdmin
            .from('revenuecat_events')
            .update({
                processed: true,
                processed_at: new Date().toISOString(),
            })
            .eq('id', eventId);
    }

    /**
     * Hata logla
     */
    private static async logError(eventId: string, errorMessage: string) {
        await supabaseAdmin
            .from('revenuecat_events')
            .update({
                error_message: errorMessage,
            })
            .eq('event_id', eventId);
    }
}
