import { createClient } from '@supabase/supabase-js'
import { JaroWinkler } from '@/lib/utils/jaro-winkler'

export interface BotMatchRule {
    bot_group_id: string
    match_type: 'minute' | 'alert_code' | 'pattern'
    match_value: string
    bot_group: {
        id: string
        name: string
        display_name: string
        is_public: boolean
    }
}

let RULES_CACHE: BotMatchRule[] | null = null
let CACHE_TIMESTAMP = 0
const CACHE_TTL = 1000 * 60 * 5 // 5 Minutes TTL

// Hardcoded ID for the special "ALERT: D" bot requested by user
const ALERT_D_BOT_ID = '239c7a67-2c17-4b4c-88c0-25ac730b8e24'
const ALERT_D_BOT_NAME = 'ALERT: D'

export class BotMatchingService {

    /**
     * Matches a team name against the database using Exact > Clean > Fuzzy strategy
     */
    static async matchTeam(inputName: string): Promise<{ id: string, name: string, logo?: string } | null> {
        if (!inputName) return null

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Exact Match (Fastest)
        const { data: exact } = await supabase.from('teams')
            .select('id, name, logo')
            .ilike('name', inputName.trim()) // Case insensitive
            .maybeSingle()

        if (exact) return exact

        // 2. Fuzzy Match (Expensive - fetch candidates)
        // Uses Postgres pg_trgm extension via RPC
        const { data: fuzzyDb } = await supabase.rpc('search_teams_fuzzy', { query: inputName }).limit(1).maybeSingle()
        if (fuzzyDb) return fuzzyDb

        return null
    }

    /**
     * Finds the matching Bot Group for a given prediction
     */
    static async matchBot(data: { minute?: string, alertCode?: string, fullText?: string }): Promise<{ id: string, name: string } | null> {

        // ---------------------------------------------------------
        // 0. CUSTOM HIGH PRIORITY RULES (User Requests)
        // ---------------------------------------------------------
        if (data.fullText) {
            const text = data.fullText.toUpperCase()
            // "IY-1 / IY Gol parametresinde gelen tüm tahminleri ALERT:D ile..."
            if (text.includes('IY-1') || text.includes('IY GOL') || text.includes('İY GOL') || text.includes('FIRST HALF')) {
                return { id: ALERT_D_BOT_ID, name: ALERT_D_BOT_NAME }
            }
        }

        const rules = await this.getAllRules()

        // 1. Check Minute Matches
        if (data.minute) {
            const minuteMatch = rules.find(r =>
                r.match_type === 'minute' &&
                r.match_value === data.minute?.trim() &&
                r.bot_group.is_public
            )
            if (minuteMatch) return { id: minuteMatch.bot_group.id, name: minuteMatch.bot_group.display_name }
        }

        // 2. Check Alert Code Matches
        if (data.alertCode) {
            const codeMatch = rules.find(r =>
                r.match_type === 'alert_code' &&
                r.match_value === data.alertCode?.trim() &&
                r.bot_group.is_public
            )
            if (codeMatch) return { id: codeMatch.bot_group.id, name: codeMatch.bot_group.display_name }
        }

        // 3. Check Pattern Matches (Contains)
        if (data.fullText) {
            const text = data.fullText.toLowerCase()
            const patternMatch = rules.find(r =>
                r.match_type === 'pattern' &&
                text.includes(r.match_value.toLowerCase()) &&
                r.bot_group.is_public
            )
            if (patternMatch) return { id: patternMatch.bot_group.id, name: patternMatch.bot_group.display_name }

            // 4. Legacy Code-Based Matching (Fallback)
            // These rules mirror the legacy system to ensure stability even if DB alias table is empty
            const LEGACY_BOT_MAPPINGS = [
                { name: '61A- MS 2.5 ÜST', patterns: ['61A- MS 2.5 ÜST'] },
                { name: 'AlertCode: 16', patterns: ['AlertCode: 16'] },
                { name: 'AlertCode: 17', patterns: ['AlertCode: 17'] },
                { name: 'BOT 777', patterns: ['BOT 777', 'Dakika 60'] },
                { name: 'Alert Code: D2', patterns: ['Alert Code: D2'] },
                { name: 'Algoritma: 01', patterns: ['Algoritma: 01', 'Dakika 70'] },
                { name: '61B- MS 3.5 ÜST', patterns: ['61B- MS 3.5 ÜST'] },
                { name: 'Code Zero', patterns: ['Code Zero', 'Dakika 20-21'] },
                { name: 'AlertCode: 15', patterns: ['AlertCode: 15'] },
                { name: 'Alert Code: 2', patterns: ['Alert Code: 2'] },
                { name: 'AlertCode: 31', patterns: ['AlertCode: 31'] },
                { name: 'ALERT-85', patterns: ['ALERT-85'] },
                { name: 'AlertCode: 21', patterns: ['AlertCode: 21'] }
            ]

            for (const mapping of LEGACY_BOT_MAPPINGS) {
                if (mapping.patterns.some(p => data.fullText!.includes(p))) {
                    // We need to resolve the Bot ID. Since we can't easily cache names here without refactor,
                    // we'll fetch on demand.
                    const supabase = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!
                    )
                    const { data: bot } = await supabase.from('bot_groups').select('id, display_name').eq('name', mapping.name).single()
                    if (bot) return { id: bot.id, name: bot.display_name }
                }
            }
        }

        return null
    }

    private static async getAllRules(): Promise<BotMatchRule[]> {
        const now = Date.now()
        if (RULES_CACHE && (now - CACHE_TIMESTAMP < CACHE_TTL)) {
            return RULES_CACHE
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase
            .from('bot_group_match_values')
            .select(`
                bot_group_id,
                match_type,
                match_value,
                bot_group:bot_groups (
                    id,
                    name,
                    display_name,
                    is_public,
                    is_active
                )
            `)
            .eq('is_active', true)

        if (error) {
            console.warn('⚠️ Could not fetch dynamic bot rules (Table might be missing or empty):', error.message)
            return []
        }

        const validRules = (data as any[]).filter(r => r.bot_group && r.bot_group.is_active)

        RULES_CACHE = validRules
        CACHE_TIMESTAMP = now
        return RULES_CACHE
    }

    /**
     * Clears cache (useful when admin updates rules)
     */
    static clearCache() {
        RULES_CACHE = null
    }
}
