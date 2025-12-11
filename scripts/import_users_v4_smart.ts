
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing API Keys in .env.local')
    process.exit(1)
}

// Initialize Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function importData() {
    console.log('🚀 Starting Smart Data Migration (GoalGPT 2.0)...')

    // READ CSV FILES
    const usersPath = '/Users/utkubozbay/.gemini/antigravity/scratch/legacy_code/customer_users.csv'
    const subsPath = '/Users/utkubozbay/.gemini/antigravity/scratch/legacy_code/customer_subscriptions.csv'

    if (!fs.existsSync(usersPath) || !fs.existsSync(subsPath)) {
        console.error('❌ CSV files not found!')
        process.exit(1)
    }

    const usersContent = fs.readFileSync(usersPath, 'utf-8')
    const users = parse(usersContent, { columns: true, skip_empty_lines: true })

    const subsContent = fs.readFileSync(subsPath, 'utf-8')
    const subscriptions = parse(subsContent, { columns: true, skip_empty_lines: true })

    console.log(`📦 Found ${users.length} users and ${subscriptions.length} subscriptions.`)

    let successCount = 0
    let errorCount = 0
    let skippedCount = 0

    // HELPER: Map Platform (Strict Enum: 'apple', 'google')
    // CSV contains 'ios'/'android', DB expects 'apple'/'google'
    const mapPlatform = (p: string) => {
        let platform = p?.toLowerCase()?.trim()
        if (platform === 'ios' || platform === 'apple') return 'apple'
        if (platform === 'android' || platform === 'google') return 'google'
        return 'apple' // Fallback
    }

    // HELPER: Map Status with Date Validation (Strict Enum: 'active', 'expired', 'grace_period', 'trial')
    const determineStatus = (csvStatus: string, expireDateStr: string) => {
        const now = new Date()
        const expireDate = expireDateStr ? new Date(expireDateStr) : null

        if (!expireDate) return 'expired'
        if (expireDate < now) return 'expired'

        const status = csvStatus?.toLowerCase()?.trim()
        if (status === 'active' || status === 'trialing') return 'active'
        if (status === 'grace_period') return 'grace_period'

        return 'expired'
    }

    // PROCESS USERS
    for (const user of users) {
        if (!user.email) continue

        try {
            let userId = null

            // 1. Create User in Auth (or fetch if exists)
            const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: 'tempPassword123!', // User must reset
                email_confirm: true,
                user_metadata: {
                    username: user.username,
                    full_name: user.full_name,
                    source: 'migration_v2'
                }
            })

            if (authError) {
                if (authError.message.includes('registered')) {
                    // Fetch existing
                    const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', user.email).single()
                    if (existingUser) userId = existingUser.id
                    else {
                        // Edge case: Auth exists but profile doesn't? 
                        // Try to get auth user id by listUsers (expensive) or just skip for now logic.
                        // Ideally we query auth schema by service role but direct access restricted.
                        // console.warn(`⚠️ User exists in Auth but not Profile (or fetch failed): ${user.email}`)
                        skippedCount++
                        continue
                    }
                } else {
                    console.error(`❌ Auth Error for ${user.email}:`, authError.message)
                    errorCount++
                    continue
                }
            } else {
                userId = createdUser.user.id
            }

            // JOIN SUBSCRIPTIONS
            // Find ALL subscriptions for this user to build history
            const userSubs = subscriptions.filter((s: any) => s.customer_user_id === user.id)

            // Determine CURRENT State
            // We look for the "latest" subscription based on expiration_date
            let latestSub = null
            let maxExpire = new Date(0)

            for (const sub of userSubs) {
                if (!sub.expired_at) continue
                const exp = new Date(sub.expired_at)
                if (exp > maxExpire) {
                    maxExpire = exp
                    latestSub = sub
                }
            }

            // Calculate Profile Fields based on Latest Sub
            let profileStatus = 'expired' // Default to expired (lowercase)
            let profileExpireDate = null
            let profilePlatform = null
            let profileAutoRenew = false

            if (latestSub) {
                profileExpireDate = new Date(latestSub.expired_at)
                profileStatus = determineStatus(latestSub.status, latestSub.expired_at)
                profilePlatform = mapPlatform(latestSub.platform)
                profileAutoRenew = latestSub.auto_renew_status === 'true' || latestSub.auto_renew_status === '1'
            }

            // 2. UPSERT PROFILE
            // Now strictly following "GoalGPT 2.0" Schema
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: user.email,
                    username: user.username,
                    full_name: user.full_name,
                    legacy_id: user.id, // Keep for reference

                    // NEW FIELDS
                    subscription_status: profileStatus, // ACTIVE, EXPIRED, etc.
                    expiration_date: profileExpireDate,
                    platform: profilePlatform || 'apple', // Default to Apple
                    auto_renew_status: profileAutoRenew,
                    is_vip: profileStatus === 'active', // Helper flag for permissions

                    updated_at: new Date()
                })

            if (profileError) {
                console.error(`❌ Profile Error ${user.email}:`, profileError.message)
                errorCount++
                continue
            }

            // 3. GENERATE REVENUE TRANSACTIONS (Financial History)
            // Loop through ALL user subs and create transaction logs if they have IDs
            for (const sub of userSubs) {
                if (!sub.store_original_transaction_id) continue

                // Avoid duplicates in revenue table
                const { data: existingTx } = await supabase
                    .from('revenue_transactions')
                    .select('id')
                    .eq('transaction_id', sub.store_original_transaction_id)
                    .single()

                if (!existingTx) {
                    // Infer amount/currency roughly if missing, or use default (Legacy data might lack price)
                    // Assuming standard pricing if missing: $9.99
                    const amount = 9.99
                    const currency = 'USD'

                    await supabase.from('revenue_transactions').insert({
                        user_id: userId,
                        store_transaction_id: sub.store_original_transaction_id, // Updated column name
                        amount: amount,
                        currency: currency,
                        amount_in_try: amount * 35,
                        // Strict Enum: 'initial_purchase', 'renewal', 'refund', 'trial_conversion'
                        transaction_type: sub.is_trial === 'true' ? 'trial_conversion' : 'renewal',
                        store: mapPlatform(sub.platform), // Returns 'apple'/'google'
                        created_at: sub.started_at ? new Date(sub.started_at) : new Date()
                    })
                }
            }

            successCount++
            if (successCount % 50 === 0) console.log(`✅ Processed ${successCount} users...`)

        } catch (err: any) {
            console.error(`❌ Exception for ${user.email}:`, err.message)
            errorCount++
        }
    }

    console.log(`\n🎉 Migration Complete!`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`⏭️ Skipped: ${skippedCount}`)
}

importData()
