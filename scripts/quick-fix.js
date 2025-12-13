const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://txutqidycaicxsxznvnl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXRxaWR5Y2FpY3hzeHpudm5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2NjI2MCwiZXhwIjoyMDgwODQyMjYwfQ.SADT2xllXAFlPLW2KRMR0exa9y0eY3p0_ZvM9v1QSjQ'
);

// Regex matching Cenkler format with support for hyphens in names
const CENKLER_REGEX = /\*([^*]+?)\s*-\s*([^*(]+?)\s*\(/;

async function quickFix() {
    console.log('=== QUICK FIX: Updating last 50 predictions ===');

    // Fetch last 50 records by received_at (newest first)
    const { data: rows, error } = await supabase
        .from('predictions_raw')
        .select('id, prediction_text, home_team_name, away_team_name')
        .order('received_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching:', error.message);
        return;
    }

    console.log(`Found ${rows.length} records to check.`);
    let updatedCount = 0;

    for (const row of rows) {
        // Only update if team names are missing
        if (row.home_team_name && row.away_team_name) continue;

        if (!row.prediction_text) continue;

        const m = row.prediction_text.match(CENKLER_REGEX);
        if (m) {
            const home = m[1].trim();
            const away = m[2].trim();

            const { error: updateError } = await supabase
                .from('predictions_raw')
                .update({
                    home_team_name: home,
                    away_team_name: away,
                    status: 'pending' // Reset status to trigger UI update if needed
                })
                .eq('id', row.id);

            if (!updateError) {
                updatedCount++;
                console.log(`✅ Fixed: ${home} vs ${away}`);
            } else {
                console.error(`❌ Failed to update ${row.id}: ${updateError.message}`);
            }
        }
    }

    console.log(`\nJob Create: Updated ${updatedCount} records.`);
}

quickFix();
