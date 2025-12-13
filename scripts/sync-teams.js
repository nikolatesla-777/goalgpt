const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// TheSports Config
const API_URL = process.env.THESPORTS_API_URL || 'https://api.thesports.com/v1/football';
const API_USER = process.env.THESPORTS_API_USER;
const API_SECRET = process.env.THESPORTS_API_SECRET;

if (!supabaseUrl || !supabaseKey || !API_USER || !API_SECRET) {
    console.error('❌ Missing environment variables (Supabase or TheSports)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchTeams(page = 1) {
    try {
        const endpoint = `${API_URL}/team/additional/list`;
        const response = await axios.get(endpoint, {
            params: {
                user: API_USER,
                secret: API_SECRET,
                page: page
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Status Code: ${error.response?.status} - ${error.message}`);
        return null; // Stop on error
    }
}

async function sync() {
    console.log('🚀 Starting Team Sync from TheSports...');

    let page = 1;
    let hasMore = true;
    let totalImported = 0;

    // Safety limit to avoid infinite loop during dev
    const MAX_PAGES = 50;

    while (hasMore && page <= MAX_PAGES) {
        console.log(`\n📄 Fetching Page ${page}...`);
        const data = await fetchTeams(page);

        // TheSports API response format normalization
        // Adjust this based on actual API response debug
        const results = data?.results || data;

        if (!results || results.length === 0) {
            console.log('   Stopping: No more results.');
            hasMore = false;
            break;
        }

        console.log(`   Found ${results.length} teams. Upserting...`);

        const batch = results.map(t => ({
            external_id: t.id,
            name: t.name,
            logo: t.logo,
            country: t.country,
            country_id: t.country_id,
            stadium: t.stadium,
            city: t.city,
            founded: t.founded,
            competition_external_id: t.competition_id,
            external_updated_at: Math.floor(Date.now() / 1000), // Approximate sync time
            updated_at: new Date()
        }));

        const { error } = await supabase.from('teams').upsert(batch, { onConflict: 'external_id' });

        if (error) {
            console.error('   ❌ Database Upsert Error:', error.message);
            // If table doesn't exist, we must stop and notify user
            if (error.message.includes('relation "teams" does not exist')) {
                console.error('   🚨 CRITICAL: Tables does not exist. Please run migration.');
                process.exit(1);
            }
        } else {
            totalImported += results.length;
            console.log(`   ✅ Batch success. Total: ${totalImported}`);
        }

        page++;
        // Be nice to API limits
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n🏁 Sync Complete. Total Teams: ${totalImported}`);
}

sync();
