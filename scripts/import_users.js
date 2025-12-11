
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase keys!')
    console.error('URL:', SUPABASE_URL)
    console.error('KEY:', SUPABASE_SERVICE_KEY ? '******' : 'MISSING')
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
    console.log('🚀 Starting Data Migration (JS Mode)...')

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

    // 0. Pre-fetch existing users to handle re-runs
    console.log('🔄 Fetching existing users from Supabase Auth...')
    const emailToIdMap = new Map()
    let hasMore = true
    let page = 1
    const perPage = 1000

    while (hasMore) {
        const { data: { users: pageUsers }, error } = await supabase.auth.admin.listUsers({
            page: page,
            perPage: perPage
        })

        if (error) {
            console.error('❌ Error fetching users:', error)
            break
        }

        if (!pageUsers || pageUsers.length === 0) {
            hasMore = false
            break
        }

        pageUsers.forEach(u => {
            if (u.email) emailToIdMap.set(u.email.toLowerCase(), u.id)
        })

        console.log(`   Fetched page ${page} (${pageUsers.length} users)...`)
        page++
    }
    console.log(`✅ Indexed ${emailToIdMap.size} existing users.`)

    // 3. Process Users Batch
    for (const user of users) {
        try {
            const normalizedEmail = user.email.toLowerCase()
            let userId = emailToIdMap.get(normalizedEmail)

            // A. Create or Get Auth User
            if (!userId) {
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email: user.email,
                    password: 'TempPassword123!',
                    email_confirm: true,
                    user_metadata: {
                        full_name: user.full_name || user.username
                    }
                })

                if (authError) throw authError
                userId = authUser.user.id
            }

            if (userId) {
                // B. Insert Profile
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
                        legacy_id: user.id || null,
                        created_at: user.created_at ? new Date(user.created_at) : new Date(),
                    })

                if (profileError) throw profileError

                // C. Match & Insert Subscriptions (Subscriptions are immutable history, so insert is fine, maybe verify duplicates?)
                // Actuallyupserting subscriptions might be safer if we run multiple times. 
                // But subscription ID is auto-generated. We check duplicates by 'store_original_transaction_id' usually.
                // Let's check if sub exists? 

                const userSubs = subscriptions.filter(s => s.customer_user_id === user.id)

                for (const sub of userSubs) {
                    if (!sub.store_original_transaction_id) continue;

                    let status = sub.status?.toLowerCase().trim()

                    // Map Legacy Status
                    const statusMap = {
                        'active': 'active',
                        'expired': 'expired',
                        'canceled': 'canceled',
                        'cancelled': 'canceled',
                        'trial': 'trialing',
                        'trialing': 'trialing',
                        'grace': 'active',
                        'grace_period': 'active',
                        'past_due': 'past_due',
                        'unpaid': 'unpaid',
                        'on_hold': 'unpaid',
                        'paused': 'unpaid',
                        'revoked': 'canceled'
                    }

                    let mappedStatus = statusMap[status] || 'expired'

                    // Check if sub exists to avoid duplicates on re-run
                    // We use `store_original_transaction_id` as unique key for verification
                    const { data: existingSub } = await supabase
                        .from('subscriptions')
                        .select('id')
                        .eq('store_original_transaction_id', sub.store_original_transaction_id)
                        .maybeSingle()

                    if (existingSub) continue; // Skip if already imported

                    const { error: subError } = await supabase
                        .from('subscriptions')
                        .insert({
                            user_id: userId,
                            store_original_transaction_id: sub.store_original_transaction_id,
                            plan_id: sub.plan_id,
                            status: mappedStatus,
                            starts_at: sub.started_at ? new Date(sub.started_at) : null,
                            expires_at: sub.expired_at ? new Date(sub.expired_at) : null,
                            platform: sub.platform,
                            is_legacy: true
                        })

                    if (subError) console.error(`❌ Failed to import sub for ${user.email}:`, subError.message)
                }

                successCount++
                if (successCount % 50 === 0) console.log(`✅ Processed ${successCount} users...`)
            }

        } catch (err) {
            console.error(`❌ Error processing ${user.email}:`, err.message)
            errorCount++
        }
    }

    console.log(`\n🎉 Migration Complete!`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
}

migrate()
