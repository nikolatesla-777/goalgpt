// ============================================================================
// ADMIN MEMBER DETAIL API ROUTE
// /api/admin/members/[id]
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SegmentType } from '@/lib/types/revenuecat';
import { SEGMENT_FLOWS, getSegmentFlow } from '@/app/admin/members/detail/[id]/segment-flows';

// Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/members/[id]
 * Tek bir üyenin detaylı bilgilerini getir
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;

        // 1. User profile
        const { data: user, error: userError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // 2. Segment history
        const { data: segmentHistory } = await supabaseAdmin
            .from('user_segments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        // 3. Revenue transactions
        const { data: transactions } = await supabaseAdmin
            .from('revenue_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        // 4. RevenueCat events
        const { data: events } = await supabaseAdmin
            .from('revenuecat_events')
            .select('id, event_type, product_id, price, currency, store, environment, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        // 5. User flow state
        const { data: flowState } = await supabaseAdmin
            .from('user_flow_states')
            .select('*')
            .eq('user_id', userId)
            .single();

        // 6. Admin actions log
        const { data: actionsLog } = await supabaseAdmin
            .from('segment_actions_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        // 7. Get segment flow definition
        const segmentFlow = getSegmentFlow(user.current_segment || 'new_user');

        return NextResponse.json({
            success: true,
            data: {
                user,
                segmentHistory: segmentHistory || [],
                transactions: transactions || [],
                events: events || [],
                flowState,
                actionsLog: actionsLog || [],
                segmentFlow
            }
        });

    } catch (error) {
        console.error('[Admin Member Detail API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/members/[id]
 * Üye bilgilerini güncelle (segment dahil)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const body = await request.json();

        // Segment değişikliği varsa logla
        if (body.current_segment) {
            const { data: currentUser } = await supabaseAdmin
                .from('profiles')
                .select('current_segment')
                .eq('id', userId)
                .single();

            if (currentUser && currentUser.current_segment !== body.current_segment) {
                await supabaseAdmin
                    .from('user_segments')
                    .insert({
                        user_id: userId,
                        segment: body.current_segment,
                        previous_segment: currentUser.current_segment,
                        reason: body.segment_reason || 'Admin tarafından değiştirildi',
                        metadata: { admin_change: true }
                    });
            }
        }

        // Profile güncelle
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({
                ...body,
                segment_updated_at: body.current_segment ? new Date().toISOString() : undefined
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('[Admin Member Detail API] Update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/members/[id]/action
 * Üye üzerinde aksiyon gerçekleştir (email, push, promo vs)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        const body = await request.json();

        const { action_type, action_title, action_data, admin_id } = body;

        if (!action_type) {
            return NextResponse.json(
                { error: 'action_type is required' },
                { status: 400 }
            );
        }

        // Log the action
        await supabaseAdmin
            .from('segment_actions_log')
            .insert({
                user_id: userId,
                admin_id,
                action_type,
                action_title,
                action_data: action_data || {}
            });

        // TODO: Actually perform the action (send email, push, create promo, etc.)
        // Bu kısım harici servislerle entegre edilecek

        return NextResponse.json({
            success: true,
            message: `Action '${action_type}' logged successfully`
        });

    } catch (error) {
        console.error('[Admin Member Action API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
