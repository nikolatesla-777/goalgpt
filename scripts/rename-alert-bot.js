const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBotName() {
    const BOT_ID = '239c7a67-2c17-4b4c-88c0-25ac730b8e24';

    console.log('🔄 Updating Bot Name for ID:', BOT_ID);

    const { error } = await supabase
        .from('bot_groups')
        .update({
            name: 'ALERT: D',
            display_name: 'ALERT: D',
            description: 'İlk Yarı Gol Tahminleri (IY-1 / IY Gol)'
        })
        .eq('id', BOT_ID);

    if (error) {
        console.error('❌ Error updating bot name:', error.message);
    } else {
        console.log('✅ Bot name updated to "ALERT: D"');
    }
}

updateBotName();
