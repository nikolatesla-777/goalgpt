
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve('/Users/utkubozbay/.gemini/antigravity/scratch/goalgpt/web/.env.local')));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAuthErrors() {
    try {
        console.log('Querying api_logs for 401 errors...');

        // Last 24 hours to catch "yesterday night"
        const now = new Date();
        const timeWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const logs = await supabase
            .from('api_logs')
            .select('*')
            .eq('response_status', 401)
            .gte('created_at', timeWindow.toISOString())
            .order('created_at', { ascending: false })
            .limit(20);

        console.log(`Found ${logs.data?.length || 0} failed requests:`);

        logs.data?.forEach(log => {
            // CAREFUL: Headers might be sensitive. Just checking for x-api-key presence/value pattern.
            const headers = log.headers || {};
            const receivedKey = headers['x-api-key'] || headers['X-Api-Key'] || 'MISSING';

            console.log(`[${log.created_at}] Status: 401 | Key Received: '${receivedKey}' | IP: ${log.ip_address}`);
        });

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

analyzeAuthErrors();
