
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCounts() {
    const { count: rawCount, error: rawError } = await supabase
        .from('predictions_raw')
        .select('*', { count: 'exact', head: true });

    const { count: mappedCount, error: mappedError } = await supabase
        .from('ts_prediction_mapped')
        .select('*', { count: 'exact', head: true });

    // Check for predictions in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: recentError } = await supabase
        .from('predictions_raw')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', oneHourAgo);

    console.log('--- DATA INTEGRITY REPORT ---');
    console.log(`Total Raw Predictions: ${rawCount}`);
    console.log(`Total Mapped Predictions: ${mappedCount}`);
    console.log(`Previews (Last 1 Hour): ${recentCount}`);

    if (rawError) console.error('Raw Error:', rawError);
    if (mappedError) console.error('Mapped Error:', mappedError);
}

checkCounts();
