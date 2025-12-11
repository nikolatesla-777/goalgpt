
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPartners() {
    console.log('🔍 Checking Partners Table...');
    const { data, error } = await supabase
        .from('partners')
        .select(`
      id,
      ref_code,
      tier,
      commission_rate,
      balance,
      profile:profiles(full_name, email)
    `);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Found ${data.length} partners:`);
    console.dir(data, { depth: null, colors: true });
}

checkPartners();
