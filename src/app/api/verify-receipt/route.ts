
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateReceipt } from '@/lib/payment-validator'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Missing Supabase Keys')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { user_id, receipt_data, platform, product_id, package_name } = body

        if (!user_id || !receipt_data || !platform) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Validate Receipt (Server-to-Server)
        const validation: any = await validateReceipt(receipt_data, platform as 'ios' | 'android', product_id, package_name)

        if (!validation.valid) {
            return NextResponse.json({ error: 'Invalid Receipt', details: validation.error || validation.data }, { status: 402 })
        }

        // 2. Receipt Valid -> Extract Expiration Date
        let newExpirationDate = null
        let autoRenew = false

        if (platform === 'ios') {
            // Apple Latest Receipt Info
            const latestInfo = validation.data.latest_receipt_info?.[0] || validation.data.receipt // simplified
            // Depends on if it's a verifyReceipt response or decoded.
            // node-iap 'verifyPayment' usually returns the verifyReceipt response body.
            // latest_receipt_info array contains transaction history on sandbox.
            // We take the LAST item usually, but node-iap might sort it.
            // For safety, let's grab the one with max expires_date_ms

            const transactions = validation.data.latest_receipt_info || [validation.data.receipt]
            const latest = transactions.reduce((prev: any, current: any) => {
                return (Number(prev.expires_date_ms) > Number(current.expires_date_ms)) ? prev : current
            })

            if (latest?.expires_date_ms) {
                newExpirationDate = new Date(Number(latest.expires_date_ms))
            }
        }
        else if (platform === 'android') {
            // Google Purchase Resource
            // expiryTimeMillis
            if (validation?.data?.expiryTimeMillis) {
                newExpirationDate = new Date(Number(validation.data.expiryTimeMillis))
            }
            autoRenew = validation?.data?.autoRenewing
        }

        // 3. Update Database (Ghost Payment Fix)
        // Only give access if we have a valid future date
        const status = newExpirationDate && newExpirationDate > new Date() ? 'ACTIVE' : 'EXPIRED'

        const { error: dbError } = await supabase
            .from('profiles')
            .update({
                subscription_status: status,
                expiration_date: newExpirationDate,
                platform: platform,
                auto_renew_status: autoRenew,
                is_vip: status === 'ACTIVE',
                updated_at: new Date()
            })
            .eq('id', user_id)

        if (dbError) {
            console.error('DB Update Failed:', dbError)
            return NextResponse.json({ error: 'Database Update Failed' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            status: status,
            expiration_date: newExpirationDate
        })

    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
    }
}
