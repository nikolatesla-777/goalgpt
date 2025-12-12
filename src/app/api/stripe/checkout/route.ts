
import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/services/stripe-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { priceId, successUrl, cancelUrl } = body;

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!priceId) {
            return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
        }

        // Create Checkout Session
        const session = await StripeService.createCheckoutSession({
            userId: user.id,
            email: user.email!,
            priceId: priceId,
            successUrl: successUrl || `${req.nextUrl.origin}/success`,
            cancelUrl: cancelUrl || `${req.nextUrl.origin}/cancel`,
            mode: 'subscription'
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });

    } catch (error: any) {
        console.error('Checkout API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
