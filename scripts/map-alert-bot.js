const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMappingRule() {
    console.log('Mapping IY-1 / IY Gol to ALERT: D...');

    // 1. Get Bot ID
    const { data: bot } = await supabase
        .from('bot_groups')
        .select('id')
        .eq('name', 'ALERT: D')
        .single();

    if (!bot) {
        console.error('Bot ALERT: D not found! Please run the creation script first.');
        return;
    }

    const patterns = ['IY-1', 'IY GOL', 'İY GOL', 'FIRST HALF'];

    for (const pattern of patterns) {
        // Check if exists
        const { data: existing } = await supabase
            .from('bot_group_match_values')
            .select('id')
            .eq('bot_group_id', bot.id)
            .eq('match_value', pattern)
            .eq('match_type', 'pattern')
            .single();

        if (!existing) {
            const { error } = await supabase
                .from('bot_group_match_values')
                .insert({
                    bot_group_id: bot.id,
                    match_type: 'pattern',
                    match_value: pattern,
                    is_active: true
                });

            if (error) console.error(`Failed to add pattern ${pattern}:`, error.message);
            else console.log(`✅ Added rule: "${pattern}" -> ALERT: D`);
        } else {
            console.log(`ℹ️ Rule already exists: "${pattern}"`);
        }
    }
}

addMappingRule();
