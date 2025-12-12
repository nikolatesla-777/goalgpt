
import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/services/stripe-service';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase Admin for DB updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = StripeService.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;

            case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice;
                await handlePaymentSucceeded(invoice);
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscription);
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (error) {
        console.error('Error handling webhook event:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
}

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    // Retrieve the user ID from metadata
    const userId = session.metadata?.userId;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    console.log(`[Stripe] Checkout Completed for User: ${userId}`);

    if (userId) {
        // Update Supabase Profile
        await supabaseAdmin
            .from('profiles')
            .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                stripe_subscription_status: 'active', // Assume active on success
                // Also update the main segment/status to reflect Premium immediately
                current_segment: 'active_subscriber',
                subscription_status: 'ACTIVE',
                auto_renew_status: true,
                platform: 'web_stripe'
            })
            .eq('id', userId);
    }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string;
    const customerId = invoice.customer as string;

    // We might want to extend the expiration date here if we track dates
    console.log(`[Stripe] Payment Succeeded for Sub: ${subscriptionId}`);

    // Find user by customer ID if we don't have userID handy
    // (Usually profiles table has unique stripe_customer_id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;

    console.log(`[Stripe] Subscription Deleted/Canceled: ${subscription.id}`);

    // Update Profile -> 'subscription_cancel' or 'churned'
    await supabaseAdmin
        .from('profiles')
        .update({
            stripe_subscription_status: 'canceled',
            subscription_status: 'EXPIRED', // Or churned
            current_segment: 'churned'
        })
        .eq('stripe_customer_id', customerId);
}
