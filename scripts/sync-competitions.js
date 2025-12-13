const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_URL = 'https://api.thesports.com/v1';
const API_USER = process.env.THESPORTS_API_USER;
const API_SECRET = process.env.THESPORTS_API_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncCountries() {
    console.log('🌍 Syncing Countries...');
    try {
        const resp = await axios.get(`${API_URL}/football/country/list`, {
            params: { user: API_USER, secret: API_SECRET }
        });
        const results = resp.data.results || [];
        console.log(`   Found ${results.length} countries`);

        const batch = results.map(c => ({
            external_id: c.id,
            name: c.name,
            logo: c.logo
        }));

        const { error } = await supabase.from('ts_countries').upsert(batch, { onConflict: 'external_id' });
        if (error) {
            console.error('   ❌ Error:', error.message);
            if (error.message.includes('does not exist')) {
                console.log('   ⚠️ Table ts_countries not found. Please run migration first.');
            }
        } else {
            console.log('   ✅ Countries synced!');
        }
    } catch (e) {
        console.error('   ❌ API Error:', e.message);
    }
}

async function syncCompetitions() {
    console.log('🏆 Syncing Competitions...');
    let page = 1;
    let total = 0;
    let hasMore = true;

    while (hasMore && page <= 50) {
        try {
            const resp = await axios.get(`${API_URL}/football/competition/additional/list`, {
                params: { user: API_USER, secret: API_SECRET, page }
            });
            const results = resp.data.results || [];

            if (results.length === 0) {
                hasMore = false;
                break;
            }

            const batch = results.map(c => ({
                external_id: c.id,
                name: c.name,
                short_name: c.short_name,
                logo: c.logo,
                country_id: c.country_id,
                type: c.type
            }));

            const { error } = await supabase.from('ts_competitions').upsert(batch, { onConflict: 'external_id' });
            if (error) {
                console.error('   ❌ Error:', error.message);
                if (error.message.includes('does not exist')) {
                    console.log('   ⚠️ Table ts_competitions not found. Please run migration first.');
                    return;
                }
            } else {
                total += results.length;
                console.log(`   Page ${page}: ${results.length} competitions. Total: ${total}`);
            }

            page++;
            await new Promise(r => setTimeout(r, 150));
        } catch (e) {
            console.error('   ❌ API Error:', e.message);
            break;
        }
    }
    console.log(`   ✅ Competitions synced! Total: ${total}`);
}

async function run() {
    console.log('🚀 Starting Sync...\n');
    await syncCountries();
    console.log('');
    await syncCompetitions();
    console.log('\n🏁 All done!');
}

run();
