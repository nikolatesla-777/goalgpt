const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://txutqidycaicxsxznvnl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXRxaWR5Y2FpY3hzeHpudm5sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2NjI2MCwiZXhwIjoyMDgwODQyMjYwfQ.SADT2xllXAFlPLW2KRMR0exa9y0eY3p0_ZvM9v1QSjQ'
);

// Parse team names from prediction_text
function parseTeams(text) {
    if (!text) return { home: '', away: '' };

    // Cenkler format: *Team1 - Team2 ( score )*
    const cenklerMatch = text.match(/\*([^*]+?)\s*-\s*([^*(]+?)\s*\(/);
    if (cenklerMatch) {
        return {
            home: cenklerMatch[1].trim(),
            away: cenklerMatch[2].trim()
        };
    }

    // Standard format: Team A vs Team B
    const vsMatch = text.match(/^(.+?)\s+vs\s+(.+?)\s*\(/i);
    if (vsMatch) {
        return {
            home: vsMatch[1].trim(),
            away: vsMatch[2].trim()
        };
    }

    return { home: '', away: '' };
}

// Extract league from text
function parseLeague(text) {
    if (!text) return '';
    // Look for stadium emoji
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.includes('🏟')) {
            let leaguePart = line.replace('🏟', '').trim();
            // Remove country prefix if present (Country - League)
            if (leaguePart.includes(' - ')) {
                const parts = leaguePart.split(' - ');
                return parts.slice(1).join(' - ').trim() || leaguePart;
            }
            return leaguePart;
        }
    }
    return '';
}

async function backfill() {
    console.log('=== BACKFILLING TEAM NAMES ===');

    // Get all predictions with empty team names
    const { data: rows, error } = await supabase
        .from('predictions_raw')
        .select('id, prediction_text, home_team_name, away_team_name, league_name');

    if (error) {
        console.log('Error fetching:', error.message);
        return;
    }

    if (!rows || rows.length === 0) {
        console.log('No records found');
        return;
    }

    console.log('Found', rows.length, 'total records');

    let updated = 0;
    for (const row of rows) {
        // Only update if team names are empty
        if (row.home_team_name && row.away_team_name) continue;

        const parsed = parseTeams(row.prediction_text);
        const league = parseLeague(row.prediction_text);

        if (parsed.home || parsed.away) {
            const updateData = {};
            if (parsed.home && !row.home_team_name) updateData.home_team_name = parsed.home;
            if (parsed.away && !row.away_team_name) updateData.away_team_name = parsed.away;
            if (league && (!row.league_name || row.league_name.startsWith('🏟') || row.league_name.startsWith('⏰'))) {
                updateData.league_name = league;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('predictions_raw')
                    .update(updateData)
                    .eq('id', row.id);

                if (!updateError) {
                    updated++;
                    console.log('✅ Updated:', parsed.home, 'vs', parsed.away, '| League:', league || 'N/A');
                } else {
                    console.log('❌ Error:', updateError.message);
                }
            }
        }
    }

    console.log('\n=== BACKFILL COMPLETE ===');
    console.log('Updated', updated, 'records');
}

backfill();
