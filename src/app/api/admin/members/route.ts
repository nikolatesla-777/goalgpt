// ============================================================================
// ADMIN MEMBERS API ROUTE
// /api/admin/members
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SegmentType } from '@/lib/types/revenuecat';

// Supabase admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/members
 * Tüm üyeleri segment filtreleri ile getir
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Query parameters
        const segment = searchParams.get('segment') as SegmentType | 'all' | null;
        const search = searchParams.get('search');
        const platform = searchParams.get('platform');
        const dateRange = searchParams.get('dateRange');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Base query
        let query = supabaseAdmin
            .from('profiles')
            .select(`
                id,
                email,
                full_name,
                avatar_url,
                phone,
                current_segment,
                subscription_status,
                platform,
                expiration_date,
                auto_renew_status,
                ltv,
                total_payments,
                last_payment_at,
                consecutive_months,
                created_at,
                segment_updated_at
            `, { count: 'exact' });

        // Segment filter
        if (segment && segment !== 'all') {
            // Gelir getiren filter (revenue_members)
            if ((segment as string) === 'revenue_members') {
                query = query.gt('ltv', 0);
            }
            // Oto yenileme filter
            else if ((segment as string) === 'auto_renew') {
                query = query.eq('auto_renew_status', true);
            }
            // Diğer segment filtreleri
            else {
                query = query.eq('current_segment', segment);
            }
        }

        // Platform filter
        if (platform && platform !== 'all') {
            query = query.eq('platform', platform);
        }

        // Search filter
        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // Date range filter
        if (dateRange) {
            const now = new Date();
            let startDate: Date;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'yesterday':
                    startDate = new Date(now.setDate(now.getDate() - 1));
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'last_7_days':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'this_month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                default:
                    startDate = new Date(0); // All time
            }

            if (dateRange !== 'all_time') {
                query = query.gte('created_at', startDate.toISOString());
            }
        }

        // Sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);

        const { data: members, error, count } = await query;

        if (error) {
            console.error('[Admin Members API] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Segment counts (for sidebar stats)
        const segmentCounts = await getSegmentCounts();

        return NextResponse.json({
            success: true,
            data: members,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            },
            segmentCounts
        });

    } catch (error) {
        console.error('[Admin Members API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Segment bazlı kullanıcı sayılarını getir
 */
async function getSegmentCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('current_segment');

    if (error || !data) return {};

    const counts: Record<string, number> = {
        all: data.length,
        revenue_members: 0,
        auto_renew: 0,
    };

    data.forEach((profile: any) => {
        const segment = profile.current_segment || 'free_user';
        counts[segment] = (counts[segment] || 0) + 1;
    });

    // Revenue members ve auto_renew için ayrı sorgular
    const { count: revenueCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('ltv', 0);

    const { count: autoRenewCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('auto_renew_status', true);

    counts.revenue_members = revenueCount || 0;
    counts.auto_renew = autoRenewCount || 0;

    return counts;
}
