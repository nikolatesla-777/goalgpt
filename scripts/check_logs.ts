
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkLogs() {
    console.log('Checking api_logs table...');
    const { data, error } = await supabase
        .from('api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching logs:', error);
    } else {
        if (data.length === 0) {
            console.log("⚠️ No logs found yet.");
        } else {
            console.log('✅ Found API Logs:');
            data.forEach(log => {
                console.log(`[${log.created_at}] ${log.method} ${log.endpoint} -> ${log.response_status}`);
                console.log('   Body:', JSON.stringify(log.body));
                console.log('   Error:', JSON.stringify(log.response_body));
                console.log('------------------------------------------------');
            });
        }
    }
}

checkLogs();
