
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.parse(fs.readFileSync(path.resolve('/Users/utkubozbay/.gemini/antigravity/scratch/goalgpt/web/.env.local')));

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebhookLogs() {
    try {
        console.log('Querying webhook_logs (if exists)...');

        // Try to select from a hypothetical webhook_logs table or similar
        // Since I don't know the name yet, I'll try standard names or lists tables if I could (but I can't easily list tables with this client without sql)

        // I'll try 'webhook_logs'
        const { data, error } = await supabase
            .from('webhook_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error querying webhook_logs:', error.message);
        } else {
            console.log(`Found ${data.length} webhook logs:`);
            data.forEach(log => console.log(`[${log.created_at}] ${log.source} - ${log.event}`));
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkWebhookLogs();
