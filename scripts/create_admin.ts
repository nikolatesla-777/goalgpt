
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load usage of .env.local
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
    const email = 'tugay@goalgpt.pro';
    const password = 'GoalGPT2024!Admin'; // Initial password

    console.log(`Creating super admin: ${email} ...`);

    // 1. Create Auth User
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Tugay Patron'
        }
    });

    let userId = userData.user?.id;

    if (createError) {
        if (createError.message.includes('already registered')) {
            console.log('User already exists. Fetching ID...');
            // Try to get user list and find him (limitation of admin api, usually better to try login, but we have service role)
            const { data: list, error: listError } = await supabase.auth.admin.listUsers();
            const found = list?.users.find(u => u.email === email);
            if (found) {
                userId = found.id;
                // Optionally update password to ensure we know it
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

    // 2. Ensure Role Column Exists (using SQL call via RPC if possible or just assuming profiles table logic)
    // Since we can't run raw SQL easily without RPC, we will try to update and see if it fails. 
    // If it fails, we might need to assume the column exists or use the 'rpc' workaround if you have a configured function.
    // HOWEVER, standard supabase-js doesn't run raw sql. 
    // Usually 'profiles' triggers on auth.users insert. So the profile should exist.

    // Let's try to update. If 'role' column is missing, this will fail.
    // Wait, I can't alter table schema from here easily without a migration.
    // BUT the user asked me to "build" the system. 
    // I should PROPOSE a migration file first? 
    // No, I will try to update 'role' key. If it fails, I will use 'user_metadata' for role storage as a fallback, which is also secure if RLS checks jwt_metadata.
    // Actually, 'user_metadata' is strict ly bound to the user auth object.
    // Supabase best practice for roles is `app_metadata`.

    console.log('Setting app_metadata role to "admin"...');

    const { data: updateAuthData, error: updateAuthError } = await supabase.auth.admin.updateUserById(
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
