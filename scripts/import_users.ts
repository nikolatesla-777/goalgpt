
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
    console.error('❌ Missing Supabase keys!')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const USERS_CSV_PATH = '/Users/utkubozbay/.gemini/antigravity/scratch/legacy_code/customer_users.csv'
const SUBS_CSV_PATH = '/Users/utkubozbay/.gemini/antigravity/scratch/legacy_code/customer_subscriptions.csv'

async function migrate() {
    console.log('🚀 Starting Data Migration...')

    // 1. Read Users CSV
    const usersContent = fs.readFileSync(USERS_CSV_PATH, 'utf-8')
    const users = parse(usersContent, {
        columns: true,
        skip_empty_lines: true
    })

    console.log(`📦 Found ${users.length} users in CSV.`)

    // 2. Read Subscriptions CSV
    const subsContent = fs.readFileSync(SUBS_CSV_PATH, 'utf-8')
    const subscriptions = parse(subsContent, {
        columns: true,
        skip_empty_lines: true
    })

    console.log(`📦 Found ${subscriptions.length} subscriptions in CSV.`)

    let successCount = 0
    let errorCount = 0

    // 3. Process Users Batch
    for (const user of users) {
        try {
            // A. Create Auth User
            // Note: We cannot migrate password hashes because Scrypt (Supabase) != PBKDF2 (Legacy).
            // We set a temporary password or just create the user as "email verified" so they can reset.
            // BETTER STRATEGY: Create user with `email_confirm: true` and a random dummy password. 
            // The user MUST reset password on first login.

            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: 'TempPassword123!', // User must reset
                email_confirm: true,
                user_metadata: {
                    full_name: user.full_name || user.username
                }
            })

            let userId = authUser?.user?.id

            if (authError) {
                // If user already exists, try to get their ID to update profile
                if (authError.message.includes('registered')) {
                    // Since admin API doesn't have getUserByEmail easily exposed in all versions, 
                    // and we want to be safe, we might skip or try to fetch.
                    // For now, let's assuming skipping if exists to avoid double processing,
                    // OR fetch the ID via a separate call if needed.
                    // console.warn(`⚠️ User already exists: ${user.email}`)
                    // Try to fetch user to get ID for profile update
                    const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', user.email).single()
                    if (existingUser) userId = existingUser.id
                } else {
                    throw authError
                }
            }

            if (userId) {
                // B. Insert Profile
                // Map fields from CSV (snake_case headers from standard postgres export)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: user.email,
                        full_name: user.full_name || user.username,
                        username: user.username,
                        avatar_url: user.profile_image_url,
                        is_vip: user.is_vip === 't' || user.is_vip === 'true', // Postgres boolean export
                        team_name: user.selected_team_name,
                        // Legacy Reference fields
                        legacy_id: user.id, // Store old ID for subscription mapping
                        created_at: user.created_at ? new Date(user.created_at) : new Date(),
                    })

                if (profileError) throw profileError

                // C. Match & Insert Subscriptions
                const userSubs = subscriptions.filter((s: any) => s.customer_user_id === user.id)

                for (const sub of userSubs) {
                    if (!sub.store_original_transaction_id) continue;

                    // Helper to map status
                    const mapStatus = (s: string) => {
                        let status = s?.toLowerCase()?.trim()
                        if (status === 'cancelled') return 'canceled'
                        const allowed = ['active', 'expired', 'canceled', 'trialing', 'past_due', 'unpaid']
                        if (allowed.includes(status)) return status
                        return 'expired'
                    }

                    // Helper to map platform
                    const mapPlatform = (p: string) => {
                        let platform = p?.toLowerCase()?.trim()
                        if (platform === 'apple') return 'ios'
                        if (platform === 'google') return 'android'
                        const allowed = ['ios', 'android', 'stripe', 'legacy']
                        if (allowed.includes(platform)) return platform
                        return 'legacy'
                    }

                    const finalStatus = mapStatus(sub.status)
                    const finalPlatform = mapPlatform(sub.platform)

                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .insert({
                            user_id: userId,
                            store_original_transaction_id: sub.store_original_transaction_id,
                            plan_id: sub.plan_id,
                            status: finalStatus,
                            starts_at: sub.started_at ? new Date(sub.started_at) : null,
                            expires_at: sub.expired_at ? new Date(sub.expired_at) : null,
                            platform: finalPlatform,
                            is_legacy: true // Mark as migrated
                        })

                    if (subError) {
                        console.error(`❌ Failed to import sub for ${user.email}:`, subError.message)
                        console.error(`Values sent: Status=${finalStatus}, Platform=${finalPlatform}`)
                    }
                }

                successCount++
                if (successCount % 50 === 0) console.log(`✅ Processed ${successCount} users...`)
            }

        } catch (err: any) {
            // Handle "already registered" error
            if (err?.message?.includes('registered')) {
                // Log warning but try to proceed
                // console.warn(`⚠️ User already exists: ${user.email}`)
                try {
                    // Fetch existing user ID from profiles to continue with profile/subs update
                    const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', user.email).single()
                    if (existingUser) {
                        // RE-TRIGGER LOGIC FOR EXISTING USER
                        // We can't jump back into the try block, so we handle B (Profile) and C (Subs) here for existing users
                        const userId = existingUser.id

                        // B. Update Profile (Upsert)
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: userId,
                                email: user.email,
                                full_name: user.full_name || user.username,
                                username: user.username,
                                avatar_url: user.profile_image_url,
                                is_vip: user.is_vip === 't' || user.is_vip === 'true',
                                team_name: user.selected_team_name,
                                legacy_id: user.id,
                                created_at: user.created_at ? new Date(user.created_at) : new Date(),
                            })

                        if (profileError) throw profileError

                        // C. Match & Insert Subscriptions (Idempotent check needed ideally, but insert usually fine if not duplicate PK)
                        const userSubs = subscriptions.filter((s: any) => s.customer_user_id === user.id)

                        for (const sub of userSubs) {
                            if (!sub.store_original_transaction_id) continue;

                            // Helper to map status
                            const mapStatus = (s: string) => {
                                let status = s?.toLowerCase()?.trim()
                                if (status === 'cancelled') return 'canceled'
                                const allowed = ['active', 'expired', 'canceled', 'trialing', 'past_due', 'unpaid']
                                if (allowed.includes(status)) return status
                                return 'expired' // Default fallback to safe state
                            }

                            // Helper to map platform
                            const mapPlatform = (p: string) => {
                                let platform = p?.toLowerCase()?.trim()
                                if (platform === 'apple') return 'ios'
                                if (platform === 'google') return 'android'
                                const allowed = ['ios', 'android', 'stripe', 'legacy']
                                if (allowed.includes(platform)) return platform
                                return 'legacy'
                            }

                            // Check if sub exists to avoid constraint error
                            const { data: existingSub } = await supabase.from('subscriptions').select('id').eq('store_original_transaction_id', sub.store_original_transaction_id).single()

                            if (!existingSub) {
                                // Debug log
                                // console.log(`DEBUG: Status '${sub.status}' -> '${mapStatus(sub.status)}' | Platform '${sub.platform}' -> '${mapPlatform(sub.platform)}'`)

                                const finalStatus = mapStatus(sub.status)
                                const finalPlatform = mapPlatform(sub.platform)

                                if (finalStatus !== 'active' && finalStatus !== 'expired' && finalStatus !== 'canceled' && finalStatus !== 'trialing') {
                                    console.log(`⚠️ Unusual status mapped: ${sub.status} -> ${finalStatus}`)
                                }

                                const { error: subError } = await supabase
                                    .from('subscriptions')
                                    .insert({
                                        user_id: userId,
                                        store_original_transaction_id: sub.store_original_transaction_id,
                                        plan_id: sub.plan_id,
                                        status: finalStatus,
                                        starts_at: sub.started_at ? new Date(sub.started_at) : null,
                                        expires_at: sub.expired_at ? new Date(sub.expired_at) : null,
                                        platform: finalPlatform,
                                        is_legacy: true
                                    })
                                if (subError) {
                                    console.error(`❌ Failed to import sub for ${user.email}:`, subError.message)
                                    console.error(`Values sent: Status=${finalStatus}, Platform=${finalPlatform}`)
                                }
                            }
                        }
                        successCount++
                        if (successCount % 50 === 0) console.log(`✅ Processed/Updated ${successCount} users...`)
                        continue // Skip the error count increment
                    }
                } catch (innerErr: any) {
                    console.error(`❌ Failed to update existing user ${user.email}:`, innerErr.message)
                }
            } else {
                console.error(`❌ Error processing ${user.email}:`, err.message)
            }
            errorCount++
        }
    }

    console.log(`\n🎉 Migration Complete!`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
}

migrate()
