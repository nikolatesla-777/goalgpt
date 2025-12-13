const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const legacyBots = [
    { name: '61A- MS 2.5 ÜST', displayName: '2.5 ÜST', aliases: ['61A- MS 2.5 ÜST'], desc: 'Maç Sonu 2.5 Üst Gol Tahmini' },
    { name: 'AlertCode: 16', displayName: 'DK 85 +1 Gol', aliases: ['AlertCode: 16'], desc: '85. Dakikadan Sonra Gol Beklentisi' },
    { name: 'AlertCode: 17', displayName: 'IY 2.5 ÜST', aliases: ['AlertCode: 17'], desc: 'İlk Yarı Bol Gol Beklentisi' },
    { name: 'BOT 777', displayName: 'Bot777', aliases: ['BOT 777', 'Dakika 60'], desc: '60. Dakika Özel Analiz Botu' },
    { name: 'ALERT: D', displayName: 'ALERT: D', aliases: ['ALERT: D', 'IY-1', 'IY Gol'], desc: 'İlk Yarı Gol Tahminleri (IY-1 / IY Gol)' },
    { name: 'Alert Code: D2', displayName: 'DK 70 0.5 ÜST', aliases: ['Alert Code: D2'], desc: '70. Dakika Sonrası Gol Beklentisi' },
    { name: 'Algoritma: 01', displayName: 'Algoritma: 01', aliases: ['Algoritma: 01', 'Dakika 70'], desc: '70. Dakika Algoritması' },
    { name: '61B- MS 3.5 ÜST', displayName: '3.5 ÜST', aliases: ['61B- MS 3.5 ÜST'], desc: 'Maç Sonu 3.5 Üst Gol' },
    { name: 'Code Zero', displayName: 'Code Zero', aliases: ['Code Zero', 'Dakika 20-21'], desc: '20-21. Dakika Erken Gol Sinyali' },
    { name: 'AlertCode: 15', displayName: 'AlertCode: 15', aliases: ['AlertCode: 15'], desc: 'Genel IY/MS Analiz' },
    { name: 'Alert Code: 2', displayName: 'Alert Code: 2', aliases: ['Alert Code: 2'], desc: 'Maç Sonu ve Devre Analizi' },
    { name: 'AlertCode: 31', displayName: '2.5 ÜST (Alt)', aliases: ['AlertCode: 31'], desc: 'Alternatif 2.5 Üst Botu' },
    { name: 'ALERT-85', displayName: 'ALERT-85', aliases: ['ALERT-85'], desc: '85+ Dakika Risk Analizi' },
    { name: 'AlertCode: 21', displayName: 'AlertCode: 21', aliases: ['AlertCode: 21'], desc: 'İkinci Yarı Gol Beklentisi' }
];

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🚀 Starting V2 Import with Re-Fetch Strategy...');

    for (const bot of legacyBots) {
        console.log(`\n🤖 Processing: ${bot.displayName}`);

        // STEP 1: UPSERT BOT
        let botId = null;

        // Try find first
        let { data: existing } = await supabase.from('bot_groups').select('id').eq('name', bot.name).single();

        if (existing) {
            console.log(`   Detailed: Found existing. Updating...`);
            await supabase.from('bot_groups').update({
                display_name: bot.displayName,
                description: bot.desc,
                is_active: true
            }).eq('id', existing.id);
            botId = existing.id;
        } else {
            console.log(`   Detailed: Creating new...`);
            const { data: newBot, error } = await supabase.from('bot_groups').insert({
                name: bot.name,
                display_name: bot.displayName,
                description: bot.desc,
                is_active: true,
                total_predictions: 0,
                winning_predictions: 0,
                win_rate: 0
            }).select('id').single();

            if (error) {
                console.error('   ❌ Create failed:', error.message);
                continue;
            }
            botId = newBot.id;
        }

        // STEP 2: WAIT & RE-FETCH (Safety for FK)
        // If we just created it, sometimes replica lag affects immediate FK checks (rare but possible in some setups)
        // Or if 'existing' ID was somehow stale.
        // We trust 'botId' is correct UUID string.

        // STEP 3: SYNC ALIASES
        if (botId) {
            for (const alias of bot.aliases) {
                // Check exist
                const { data: aliasExist } = await supabase.from('bot_group_match_values')
                    .select('id')
                    .eq('match_value', alias)
                    .eq('bot_group_id', botId) // Check if already assigned to THIS bot
                    .single();

                if (!aliasExist) {
                    const { error: insertError } = await supabase.from('bot_group_match_values').insert({
                        bot_group_id: botId,
                        match_value: alias,
                        match_type: 'pattern', // Confirmed Valid
                        created_at: new Date()
                    });

                    if (insertError) {
                        console.error(`   ❌ Alias Insert Failed [${alias}]:`, insertError.message);
                        // If it fails with FK again, we know it's weird.
                    } else {
                        console.log(`   ✅ Linked Alias: ${alias}`);
                    }
                } else {
                    console.log(`   ℹ️ Alias already linked: ${alias}`);
                }
            }
        }
    }
    console.log('\n🏁 Done.');
}

run();
