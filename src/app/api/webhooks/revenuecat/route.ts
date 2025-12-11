// ============================================================================
// REVENUECAT WEBHOOK API ROUTE
// /api/webhooks/revenuecat
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { WebhookProcessor } from '@/lib/services/webhook-processor';
import { RevenueCatWebhookEvent } from '@/lib/types/revenuecat';

// RevenueCat webhook secret for validation
const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/revenuecat
 * RevenueCat'ten gelen tüm webhook event'lerini işler
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authorization header kontrolü (opsiyonel ama önerilir)
        const authHeader = request.headers.get('Authorization');

        if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            console.error('[Webhook] Unauthorized request');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Body'yi parse et
        const payload: RevenueCatWebhookEvent = await request.json();

        // 3. Temel validasyon
        if (!payload.event || !payload.event.type) {
            console.error('[Webhook] Invalid payload - missing event data');
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            );
        }

        // 4. Sandbox/Production ayrımı (opsiyonel - sandbox'u logla ama işleme)
        if (payload.event.environment === 'SANDBOX') {
            console.log('[Webhook] Sandbox event received:', payload.event.type);
            // Sandbox event'leri de işleyebilirsin veya sadece logla
        }

        console.log(`[Webhook] Received event: ${payload.event.type} for user: ${payload.event.app_user_id}`);

        // 5. WebhookProcessor ile event'i işle
        const result = await WebhookProcessor.processEvent(payload);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Event processed successfully',
                segment: result.segment
            });
        } else {
            // İşleme başarısız ama 200 dön (RevenueCat tekrar denemez)
            // Production'da 500 dönerek retry isteyebilirsin
            console.error('[Webhook] Processing failed:', result.error);
            return NextResponse.json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('[Webhook] Unexpected error:', error);

        // 500 döndüğünde RevenueCat retry yapar
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/webhooks/revenuecat
 * Webhook endpoint'in aktif olduğunu kontrol için
 */
export async function GET() {
    return NextResponse.json({
        status: 'active',
        message: 'RevenueCat webhook endpoint is ready',
        timestamp: new Date().toISOString()
    });
}
