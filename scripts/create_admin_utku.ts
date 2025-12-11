
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.log('Current directory:', process.cwd());
    console.error('Missing environment variables. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = 'utku@goalgpt.pro';
    const password = 'GoalGPT2024!Utku';

    console.log(`Creating super admin: ${email} ...`);

    // 1. Create Auth User
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Utku Patron'
        }
    });

    let userId = userData.user?.id;

    if (createError) {
        if (createError.message.includes('already registered')) {
            console.log('User already exists. Fetching ID...');
            const { data: list } = await supabase.auth.admin.listUsers();
            const found = list?.users.find(u => u.email === email);
            if (found) {
                userId = found.id;
                await supabase.auth.admin.updateUserById(userId, { password });
                console.log('Password reset to default.');
            } else {
                console.error('Could not find existing user ID.');
                return;
            }
        } else {
            console.error('Error creating user:', createError);
            return;
        }
    }

    if (!userId) {
        console.error('No User ID found.');
        return;
    }

    console.log(`User ID: ${userId}`);

    // 2. Set admin role
    console.log('Setting app_metadata role to "admin"...');

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
        userId,
        { app_metadata: { role: 'admin' } }
    );

    if (updateAuthError) {
        console.error('Error updating app_metadata:', updateAuthError);
    } else {
        console.log('Success! app_metadata updated.');
    }

    console.log('\n--- CREDENTIALS ---');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('-------------------\n');
}

createAdmin();
