
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve('/Users/utkubozbay/.gemini/antigravity/scratch/goalgpt/web/.env.local')));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    try {
        console.log('Querying api_logs (Deep Search)...');

        // Check last 6 hours to be safe about timezones
        const now = new Date();
        const timeWindow = new Date(now.getTime() - 6 * 60 * 60 * 1000);

        // 1. Check API Logs (Any endpoint)
        const logs = await supabase
            .from('api_logs')
            .select('created_at, method, endpoint, response_status, ip_address, user_agent, body')
            .gte('created_at', timeWindow.toISOString())
            .order('created_at', { ascending: false })
            .limit(50);

        console.log(`--- Broad API Logs Search (Last 6h: ${timeWindow.toISOString()}) ---`);
        console.log(`Found: ${logs.data?.length || 0} records`);

        logs.data?.forEach(log => {
            // Try to extract some identifier from body if possible
            let preview = '';
            try {
                if (log.body) preview = JSON.stringify(log.body).substring(0, 50);
            } catch (e) { }

            console.log(`[${log.created_at}] ${log.method} ${log.endpoint} (${log.response_status}) IP:${log.ip_address} UA:${log.user_agent} ${preview}`);
        });

        // 2. Check Raw Predictions
        console.log('\nQuerying predictions_raw (Last 6h)...');
        const preds = await supabase
            .from('predictions_raw')
            .select('*')
            .gte('created_at', timeWindow.toISOString())
            .order('created_at', { ascending: false })
            .limit(10);

        console.log(`Found: ${preds.data?.length || 0} records`);
        preds.data?.forEach(p => {
            console.log(`[${p.created_at}] Source:${p.source} Data:${JSON.stringify(p.data).substring(0, 100)}...`);
        });

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkLogs();
