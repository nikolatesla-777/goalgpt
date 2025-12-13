const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPendingStatus() {
    const BOT_ID = '239c7a67-2c17-4b4c-88c0-25ac730b8e24';

    console.log('🔄 Fixing Pending Status for Bot ID:', BOT_ID);

    // 1. Update NULL status to 'pending'
    const { data, error } = await supabase
        .from('predictions_raw')
        .update({ status: 'pending' })
        .eq('bot_group_id', BOT_ID)
        .is('status', null);

    if (error) {
        console.error('❌ Error updating statuses:', error.message);
    } else {
        console.log('✅ Statuses updated to "pending"');
    }
}

fixPendingStatus();
