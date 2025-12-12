
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testInsert() {
    console.log('Inserting test log...');
    const { error } = await supabase.from('api_logs').insert({
        endpoint: '/test-verification',
        method: 'TEST',
        response_status: 200,
        body: { message: 'System Verification Test' },
        ip_address: '127.0.0.1'
    });

    if (error) {
        console.error('❌ Insert Failed:', error);
        process.exit(1);
    } else {
        console.log('✅ Insert Success! Table exists and is writable.');
    }
}
testInsert();
