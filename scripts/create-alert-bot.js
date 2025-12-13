const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBot() {
    console.log('Checking for ALERT: D bot...');

    // Check if exists
    const { data: existing } = await supabase
        .from('bot_groups')
        .select('id')
        .eq('name', 'ALERT: D')
        .single();

    if (existing) {
        console.log('Bot already exists with ID:', existing.id);
        return existing.id;
    }

    // Create new
    const { data: newBot, error } = await supabase
        .from('bot_groups')
        .insert({
            name: 'ALERT: D',
            display_name: 'ALERT: D', // Matching user screenshot
            description: 'IY-1 / IY Gol',
            total_predictions: 3078, // Matching screenshot stats
            winning_predictions: 2247,
            win_rate: 73.0,
            is_active: true,
            is_public: true,
            color: 'emerald' // Matching green color
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating bot:', error);
        return null;
    }

    console.log('Created new bot with ID:', newBot.id);
    return newBot.id;
}

createBot();
