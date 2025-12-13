const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanFakeStats() {
    console.log('Cleaning fake statistics from ALL bots...');

    const { data, error } = await supabase
        .from('bot_groups')
        .update({
            total_predictions: 0,
            winning_predictions: 0,
            win_rate: 0
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Safety filter (all)
        .select();

    if (error) {
        console.error('Error cleaning stats:', error);
    } else {
        console.log(`Successfully reset stats for ${data.length} bots to 0.`);
    }
}

cleanFakeStats();
