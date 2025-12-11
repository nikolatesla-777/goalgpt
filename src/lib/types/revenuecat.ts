// ============================================================================
// REVENUECAT WEBHOOK TYPES
// TypeScript definitions for RevenueCat webhook events
// ============================================================================

// RevenueCat Event Types
export type RevenueCatEventType =
    | 'TEST'
    | 'INITIAL_PURCHASE'
    | 'NON_RENEWING_PURCHASE'
    | 'RENEWAL'
    | 'PRODUCT_CHANGE'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'BILLING_ISSUE'
    | 'SUBSCRIBER_ALIAS'
    | 'SUBSCRIPTION_EXTENDED'
    | 'SUBSCRIPTION_PAUSED'
    | 'EXPIRATION'
    | 'TRANSFER';

// Store Types
export type StoreType = 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';

// Environment Types
export type EnvironmentType = 'SANDBOX' | 'PRODUCTION';

// ============================================================================
// SEGMENT TYPES
// ============================================================================

export type SegmentType =
    // Registration & Onboarding
    | 'new_user'
    | 'new_registration'
    // Trial
    | 'trial_user'
    | 'trial_started'
    | 'trial_expired'
    | 'trial_converted'
    // Paying Customers
    | 'first_purchase'
    | 'paying_customer'
    | 'active_subscriber'
    | 'loyal_subscriber'
    // Issues & Churn
    | 'payment_error'
    | 'grace_period'
    | 'subscription_cancel'
    | 'churned'
    | 'churned_user'
    // Special States
    | 'paused_user'
    | 'refunded_user'
    | 'win_back'
    | 'winback_target'
    | 'promo_user'
    | 'free_user';

// ============================================================================
// WEBHOOK PAYLOAD TYPES
// ============================================================================

// Subscriber Info from RevenueCat
export interface RevenueCatSubscriber {
    original_app_user_id: string;
    aliases: string[];
    first_seen: string;
    management_url: string | null;
    non_subscriptions: Record<string, any>;
    original_application_version: string | null;
    original_purchase_date: string | null;
    other_purchases: Record<string, any>;
    subscriptions: Record<string, RevenueCatSubscription>;
    entitlements: Record<string, RevenueCatEntitlement>;
}

export interface RevenueCatSubscription {
    auto_resume_date: string | null;
    billing_issues_detected_at: string | null;
    expires_date: string;
    grace_period_expires_date: string | null;
    is_sandbox: boolean;
    original_purchase_date: string;
    ownership_type: string;
    period_type: string; // 'normal' | 'trial' | 'intro'
    purchase_date: string;
    refunded_at: string | null;
    store: StoreType;
    store_transaction_id: string;
    unsubscribe_detected_at: string | null;
}

export interface RevenueCatEntitlement {
    expires_date: string;
    grace_period_expires_date: string | null;
    product_identifier: string;
    purchase_date: string;
}

// Main Webhook Event Payload
export interface RevenueCatWebhookEvent {
    api_version: string;
    event: {
        type: RevenueCatEventType;
        id: string;
        app_id: string;
        app_user_id: string;
        original_app_user_id: string;
        aliases: string[];
        product_id: string;
        entitlement_ids: string[];
        presented_offering_id: string | null;
        period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
        purchased_at_ms: number;
        expiration_at_ms: number | null;
        environment: EnvironmentType;
        store: StoreType;
        is_family_share: boolean;
        country_code: string;
        subscriber_attributes: Record<string, {
            value: string;
            updated_at_ms: number;
        }>;
        transaction_id: string;
        original_transaction_id: string;
        currency: string;
        price: number;
        price_in_purchased_currency: number;
        takehome_percentage: number;
        commission_percentage: number;
        // Cancellation specific
        cancel_reason?: string;
        // Trial specific
        is_trial_conversion?: boolean;
        // Renewal specific
        renewal_number?: number;
    };
}

// ============================================================================
// DATABASE RECORD TYPES
// ============================================================================

export interface UserSegmentRecord {
    id: string;
    user_id: string;
    segment: SegmentType;
    previous_segment: SegmentType | null;
    reason: string | null;
    event_type: RevenueCatEventType | null;
    metadata: Record<string, any>;
    created_at: string;
}

export interface UserFlowStateRecord {
    id: string;
    user_id: string;
    current_segment: SegmentType;
    flow_steps: FlowStepCompleted[];
    last_step_completed: string | null;
    step_completed_at: string | null;
    updated_at: string;
}

export interface FlowStepCompleted {
    step_id: string;
    completed_at: string;
}

export interface RevenueCatEventRecord {
    id: string;
    event_id: string;
    user_id: string | null;
    app_user_id: string;
    event_type: RevenueCatEventType;
    product_id: string | null;
    price: number | null;
    currency: string | null;
    price_in_try: number | null;
    store: StoreType;
    environment: EnvironmentType;
    is_trial: boolean;
    is_trial_conversion: boolean;
    expiration_at: string | null;
    original_transaction_id: string | null;
    presented_offering_id: string | null;
    country_code: string | null;
    raw_payload: RevenueCatWebhookEvent;
    processed: boolean;
    processed_at: string | null;
    error_message: string | null;
    created_at: string;
}

// ============================================================================
// SEGMENT CHANGE REQUEST
// ============================================================================

export interface SegmentChangeRequest {
    user_id: string;
    new_segment: SegmentType;
    reason: string;
    event_type?: RevenueCatEventType;
    metadata?: Record<string, any>;
}

// ============================================================================
// EVENT TO SEGMENT MAPPING
// ============================================================================

export const EVENT_TO_SEGMENT_MAP: Record<RevenueCatEventType, {
    segment: SegmentType;
    conditions?: Record<string, any>;
}[]> = {
    'INITIAL_PURCHASE': [
        { segment: 'trial_started', conditions: { is_trial: true } },
        { segment: 'first_purchase', conditions: { is_trial: false } }
    ],
    'NON_RENEWING_PURCHASE': [
        { segment: 'first_purchase' }
    ],
    'RENEWAL': [
        { segment: 'loyal_subscriber', conditions: { consecutive_months_gte: 6 } },
        { segment: 'active_subscriber' }
    ],
    'PRODUCT_CHANGE': [
        { segment: 'active_subscriber' }
    ],
    'CANCELLATION': [
        { segment: 'subscription_cancel' }
    ],
    'UNCANCELLATION': [
        { segment: 'win_back' }
    ],
    'BILLING_ISSUE': [
        { segment: 'grace_period' }
    ],
    'SUBSCRIPTION_EXTENDED': [
        { segment: 'active_subscriber' }
    ],
    'SUBSCRIPTION_PAUSED': [
        { segment: 'paused_user' }
    ],
    'EXPIRATION': [
        { segment: 'trial_expired', conditions: { was_trial: true } },
        { segment: 'churned' }
    ],
    'TEST': [
        { segment: 'new_user' } // Test event'leri için değişiklik yapma
    ],
    'SUBSCRIBER_ALIAS': [
        { segment: 'new_user' } // Alias event'leri için segment değişmez
    ],
    'TRANSFER': [
        { segment: 'active_subscriber' } // Transfer sonrası aktif kabul et
    ]
};

// ============================================================================
// CURRENCY CONVERSION (Basic - production'da API kullan)
// ============================================================================

export const CURRENCY_TO_TRY: Record<string, number> = {
    'USD': 34.50,
    'EUR': 37.00,
    'GBP': 43.50,
    'TRY': 1.00,
    'JPY': 0.23,
    'CAD': 25.00,
    'AUD': 22.00,
    'CHF': 39.00,
    'CNY': 4.75,
    'SEK': 3.20,
    'NZD': 20.50,
};

export function convertToTRY(amount: number, currency: string): number {
    const rate = CURRENCY_TO_TRY[currency] || CURRENCY_TO_TRY['USD'];
    return Math.round(amount * rate * 100) / 100;
}
