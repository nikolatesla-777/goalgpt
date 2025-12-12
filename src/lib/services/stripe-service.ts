
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-01-27.acacia', // Use latest or matching version
    typescript: true,
});

// Initialize Supabase Admin for DB updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class StripeService {

    /**
     * Create a Stripe Customer for a given user
     */
    static async createCustomer(userId: string, email: string) {
        try {
            // 1. Check if user already has a stripe_customer_id in Supabase
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('stripe_customer_id')
                .eq('id', userId)
                .single();

            if (profile?.stripe_customer_id) {
                return profile.stripe_customer_id;
            }

            // 2. Create new customer in Stripe
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    supabase_user_id: userId
                }
            });

            // 3. Save stripe_customer_id to Supabase
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customer.id })
                .eq('id', userId);

            return customer.id;

        } catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw error;
        }
    }

    /**
     * Create a Checkout Session for a specific price
     */
    static async createCheckoutSession(params: {
        userId: string;
        email: string;
        priceId: string;
        successUrl: string;
        cancelUrl: string;
        mode?: 'payment' | 'subscription';
    }) {
        const customerId = await this.createCustomer(params.userId, params.email);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: params.priceId,
                    quantity: 1,
                },
            ],
            mode: params.mode || 'subscription',
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: {
                userId: params.userId
            }
        });

        return session;
    }

    /**
     * Manage Subscription (Customer Portal)
     */
    static async createPortalSession(userId: string, returnUrl: string) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (!profile?.stripe_customer_id) {
            throw new Error('No Stripe customer found for this user.');
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: returnUrl,
        });

        return session.url;
    }

    /**
     * Verify Webhook Signature
     */
    static constructEvent(payload: string, signature: string, secret: string) {
        return stripe.webhooks.constructEvent(payload, signature, secret);
    }
}
