const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfillAlertBot() {
    const BOT_ID = '239c7a67-2c17-4b4c-88c0-25ac730b8e24';
    const PATTERNS = ['IY-1', 'IY Gol', 'İY GOL', 'FIRST HALF'];

    console.log('🔄 Backfilling ALERT: D predictions...');

    // 1. Fetch recent predictions with NO bot ID or ALL to be safe
    const { data: predictions, error } = await supabase
        .from('predictions_raw')
        .select('id, prediction_text, raw_payload')
        .order('received_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Scanning ${predictions.length} recent predictions...`);

    let updateCount = 0;

    for (const p of predictions) {
        if (!p.prediction_text) continue;

        const text = (typeof p.prediction_text === 'string' ? p.prediction_text : JSON.stringify(p.prediction_text)).toUpperCase();
        const rawPayload = JSON.stringify(p.raw_payload || {}).toUpperCase();

        let matched = false;
        for (const pattern of PATTERNS) {
            if (text.includes(pattern.toUpperCase()) || rawPayload.includes(pattern.toUpperCase())) {
                matched = true;
                break;
            }
        }

        if (matched) {
            // Update this record
            const { error: updateError } = await supabase
                .from('predictions_raw')
                .update({ bot_group_id: BOT_ID })
                .eq('id', p.id);

            if (!updateError) {
                updateCount++;
                // console.log(`✅ Updated prediction ${p.id}`);
            } else {
                console.error(`❌ Failed to update ${p.id}:`, updateError.message);
            }
        }
    }

    console.log(`🎉 Backfill Complete! Updated ${updateCount} records.`);

    // Also update the bot stats
    if (updateCount > 0) {
        const { data: bot } = await supabase.from('bot_groups').select('total_predictions').eq('id', BOT_ID).single();
        const currentTotal = bot ? bot.total_predictions : 0;

        await supabase
            .from('bot_groups')
            .update({ total_predictions: currentTotal + updateCount })
            .eq('id', BOT_ID);

        console.log(`📈 Updated Bot total_predictions to ${currentTotal + updateCount}`);
    }
}

backfillAlertBot();
