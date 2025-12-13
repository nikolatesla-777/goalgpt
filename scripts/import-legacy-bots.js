const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Data extracted from the screenshot
const legacyBots = [
    { name: '61A- MS 2.5 ÜST', displayName: '2.5 ÜST', aliases: ['61A- MS 2.5 ÜST'], desc: 'Maç Sonu 2.5 Üst Gol Tahmini' },
    { name: 'AlertCode: 16', displayName: 'DK 85 +1 Gol', aliases: ['AlertCode: 16'], desc: '85. Dakikadan Sonra Gol Beklentisi' },
    { name: 'AlertCode: 17', displayName: 'IY 2.5 ÜST', aliases: ['AlertCode: 17'], desc: 'İlk Yarı Bol Gol Beklentisi' },
    { name: 'BOT 777', displayName: 'Bot777', aliases: ['BOT 777', 'Dakika 60'], desc: '60. Dakika Özel Analiz Botu' },
    // ALERT: D is handled separately but let's allow upsert to ensure aliases
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

async function importBots() {
    console.log('🚀 Starting Legacy Bot Import...');

    for (const bot of legacyBots) {
        console.log(`\nProcessing: ${bot.displayName}...`);

        // 1. Upsert Bot Group
        // We check existence by name to avoid duplicates if ID is unknown, 
        // or we could let Supabase generate new IDs.
        // For 'ALERT: D', we want to keep the existing ID if possible, but the name match will handle it.

        // First, try to find existing bot by name
        const { data: existingBot, error: findError } = await supabase
            .from('bot_groups')
            .select('id')
            .eq('name', bot.name)
            .single();

        let botId;

        if (existingBot) {
            console.log(`  -> Update Existing Bot: ${existingBot.id}`);
            botId = existingBot.id;
            const { error: updateError } = await supabase
                .from('bot_groups')
                .update({
                    display_name: bot.displayName,
                    description: bot.desc,
                    is_active: true
                })
                .eq('id', botId);

            if (updateError) console.error('  ❌ Update Error:', updateError.message);
        } else {
            console.log(`  -> Create New Bot`);
            const { data: newBot, error: createError } = await supabase
                .from('bot_groups')
                .insert({
                    name: bot.name,
                    display_name: bot.displayName,
                    description: bot.desc,
                    is_active: true,
                    total_predictions: 0,
                    winning_predictions: 0,
                    win_rate: 0
                })
                .select('id')
                .single();

            if (createError) {
                console.error('  ❌ Create Error:', createError.message);
                continue;
            }
            botId = newBot.id;
        }

        // 2. Insert Aliases (Match Values)
        if (botId && bot.aliases.length > 0) {
            console.log(`  -> syncing aliases: ${bot.aliases.join(', ')}`);

            for (const alias of bot.aliases) {
                // Check if alias exists
                const { data: existingAlias } = await supabase
                    .from('bot_group_match_values')
                    .select('id')
                    .eq('match_value', alias)
                    .single();

                if (!existingAlias) {
                    const { error: aliasError } = await supabase
                        .from('bot_group_match_values')
                        .insert({
                            bot_group_id: botId,
                            match_value: alias,
                            match_type: 'pattern', // Correct enum value
                            created_at: new Date()
                        });
                    if (aliasError) console.error(`  ❌ Alias Error (${alias}):`, aliasError.message);
                    else console.log(`     ✅ Added alias: ${alias}`);
                } else {
                    console.log(`     ℹ️ Alias exists: ${alias}`);
                }
            }
        }
    }

    console.log('\n✅ Import Completed!');
}

importBots();
