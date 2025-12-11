import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface LegacyUser {
    UserId: string
    Email: string
    RegistrationDate: string
    LastLoginDate: string
    Platform?: string
    SubscriptionStatus?: string
    ExpirationDate?: string
    OriginalTransactionId?: string
}

async function getExistingEmails(): Promise<Set<string>> {
    console.log('📥 Fetching existing emails from Supabase...')

    const emails = new Set<string>()
    let offset = 0
    const limit = 1000

    while (true) {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching emails:', error)
            break
        }

        if (!data || data.length === 0) break

        for (const row of data) {
            if (row.email) {
                emails.add(row.email.toLowerCase().trim())
            }
        }

        offset += limit
        if (data.length < limit) break
    }

    console.log(`✅ Found ${emails.size} existing emails in DB`)
    return emails
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

function mapPlatform(platform: string | undefined): string {
    if (!platform) return 'unknown'
    const p = platform.toLowerCase()
    if (p.includes('ios') || p.includes('apple')) return 'ios'
    if (p.includes('android') || p.includes('google')) return 'android'
    return 'unknown'
}

function mapSubscriptionStatus(status: string | undefined, expDate: string | undefined): string {
    if (!status) return 'unknown'
    const s = status.toLowerCase()

    if (s.includes('active') || s.includes('premium') || s === 'vip') {
        // Check if expired
        if (expDate) {
            const exp = new Date(expDate)
            if (exp < new Date()) return 'expired'
        }
        return 'active'
    }
    if (s.includes('trial')) return 'trial'
    if (s.includes('expired') || s.includes('cancelled') || s.includes('canceled')) return 'expired'
    if (s.includes('free')) return 'free'

    return 'unknown'
}

async function migrateUser(user: LegacyUser): Promise<{ success: boolean; error?: string }> {
    const email = user.Email?.toLowerCase()?.trim()

    if (!email || !validateEmail(email)) {
        return { success: false, error: 'Invalid email' }
    }

    const password = Math.random().toString(36).slice(-12) + 'Aa1!'

    try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                legacy_user_id: user.UserId,
                migrated_at: new Date().toISOString()
            }
        })

        if (authError) {
            if (authError.message.includes('already been registered')) {
                return { success: false, error: 'Duplicate email' }
            }
            return { success: false, error: authError.message }
        }

        if (!authData.user) {
            return { success: false, error: 'No user returned' }
        }

        // Create profile
        const platform = mapPlatform(user.Platform)
        const subscriptionStatus = mapSubscriptionStatus(user.SubscriptionStatus, user.ExpirationDate)

        const { error: profileError } = await supabase.from('profiles').upsert({
            id: authData.user.id,
            email,
            legacy_user_id: user.UserId,
            platform,
            subscription_status: subscriptionStatus,
            expiration_date: user.ExpirationDate ? new Date(user.ExpirationDate).toISOString() : null,
            original_transaction_id: user.OriginalTransactionId || null,
            created_at: user.RegistrationDate ? new Date(user.RegistrationDate).toISOString() : new Date().toISOString(),
            last_seen_at: user.LastLoginDate ? new Date(user.LastLoginDate).toISOString() : null,
        }, { onConflict: 'id' })

        if (profileError) {
            return { success: false, error: profileError.message }
        }

        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

async function main() {
    console.log('🚀 Starting Migration Completion Script')
    console.log('='.repeat(50))

    // Load source data
    console.log('📂 Loading source data...')
    const sourceData: LegacyUser[] = JSON.parse(
        fs.readFileSync('/Users/utkubozbay/.gemini/antigravity/scratch/goalgpt/data/exported_users.json', 'utf8')
    )
    console.log(`✅ Loaded ${sourceData.length} users from source`)

    // Get existing emails
    const existingEmails = await getExistingEmails()

    // Find missing users
    const missingUsers: LegacyUser[] = []
    const invalidEmails: { userId: string; email: string }[] = []
    const duplicatesInSource: { email: string; count: number }[] = []
    const seenEmails = new Map<string, number>()

    for (const user of sourceData) {
        const email = user.Email?.toLowerCase()?.trim()

        if (!email || !validateEmail(email)) {
            invalidEmails.push({ userId: user.UserId, email: user.Email || '' })
            continue
        }

        // Track duplicates in source
        seenEmails.set(email, (seenEmails.get(email) || 0) + 1)

        if (!existingEmails.has(email)) {
            missingUsers.push(user)
            existingEmails.add(email) // Prevent adding same user twice
        }
    }

    // Count duplicates
    for (const [email, count] of seenEmails) {
        if (count > 1) {
            duplicatesInSource.push({ email, count })
        }
    }

    console.log('')
    console.log('📊 ANALYSIS')
    console.log('='.repeat(50))
    console.log(`Missing users to migrate: ${missingUsers.length}`)
    console.log(`Invalid emails (skipped): ${invalidEmails.length}`)
    console.log(`Duplicate emails in source: ${duplicatesInSource.length}`)

    // Save analysis
    fs.writeFileSync(
        '/Users/utkubozbay/.gemini/antigravity/scratch/goalgpt/data/migration_analysis.json',
        JSON.stringify({
            totalSource: sourceData.length,
            existingInDB: existingEmails.size - missingUsers.length,
            missingCount: missingUsers.length,
            invalidEmailCount: invalidEmails.length,
            duplicateCount: duplicatesInSource.length,
            sampleInvalidEmails: invalidEmails.slice(0, 10),
            sampleDuplicates: duplicatesInSource.slice(0, 10)
        }, null, 2)
    )

    if (missingUsers.length === 0) {
        console.log('✅ No missing users to migrate!')
        return
    }

    console.log('')
    console.log('🔄 MIGRATING MISSING USERS')
    console.log('='.repeat(50))

    let success = 0
    let failed = 0
    const errors: { email: string; error: string }[] = []
    const startTime = Date.now()

    for (let i = 0; i < missingUsers.length; i++) {
        const user = missingUsers[i]
        const result = await migrateUser(user)

        if (result.success) {
            success++
        } else {
            failed++
            errors.push({ email: user.Email, error: result.error || 'Unknown error' })
        }

        // Progress log every 100 users
        if ((i + 1) % 100 === 0 || i === missingUsers.length - 1) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
            const rate = (success / parseFloat(elapsed)).toFixed(1)
            console.log(`Progress: ${i + 1}/${missingUsers.length} | ✅ ${success} | ❌ ${failed} | ${elapsed}s | ${rate}/s`)
        }

        // Small delay to avoid rate limiting
        if ((i + 1) % 10 === 0) {
            await new Promise(r => setTimeout(r, 100))
        }
    }

    console.log('')
    console.log('📊 FINAL RESULTS')
    console.log('='.repeat(50))
    console.log(`✅ Successfully migrated: ${success}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏱️ Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`)

    // Save errors
    fs.writeFileSync(
        '/Users/utkubozbay/.gemini/antigravity/scratch/goalgpt/data/migration_errors.json',
        JSON.stringify(errors, null, 2)
    )
    console.log('💾 Errors saved to: migration_errors.json')
}

main().catch(console.error)
