import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPermissions() {
    console.log('🔧 Setting up permissions table...');

    try {
        // Check if table exists by trying to query it
        const { data, error } = await supabase
            .from('phan_quyen')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Table phan_quyen does not exist or has an error:', error.message);
            console.log('\n📋 Please run the SQL script: supabase-sql/phan_quyen.sql');
            console.log('   in your Supabase SQL Editor to create the table.');
            return;
        }

        console.log('✅ Table phan_quyen exists');

        // Initialize default permissions
        console.log('🔄 Initializing default permissions...');

        const modules = [
            'DASHBOARD', 'HR', 'DOCS', 'ASSESSMENT', 'INCIDENTS',
            'IMPROVEMENT', 'INDICATORS', 'SUPERVISION', 'REPORTS', 'SETTINGS'
        ];

        const roles = ['admin', 'council', 'network', 'staff'];

        const defaultPermissions = [];

        for (const role of roles) {
            for (const module of modules) {
                defaultPermissions.push({
                    role_id: role,
                    module: module,
                    can_view: true,
                    can_create: role === 'admin',
                    can_update: role === 'admin' || role === 'council' || role === 'network',
                    can_delete: role === 'admin',
                });
            }
        }

        const { error: upsertError } = await supabase
            .from('phan_quyen')
            .upsert(defaultPermissions, {
                onConflict: 'role_id,module',
                ignoreDuplicates: true,
            });

        if (upsertError) {
            console.error('❌ Error initializing permissions:', upsertError);
            return;
        }

        console.log('✅ Default permissions initialized');

        // Verify data
        const { data: allPerms, error: fetchError } = await supabase
            .from('phan_quyen')
            .select('*');

        if (fetchError) {
            console.error('❌ Error fetching permissions:', fetchError);
            return;
        }

        console.log(`\n📊 Total permissions in database: ${allPerms?.length || 0}`);

        // Group by role
        const byRole = (allPerms || []).reduce((acc: any, perm: any) => {
            if (!acc[perm.role_id]) acc[perm.role_id] = [];
            acc[perm.role_id].push(perm);
            return acc;
        }, {});

        Object.keys(byRole).forEach(role => {
            console.log(`   ${role}: ${byRole[role].length} modules`);
        });

        console.log('\n✅ Permission setup complete!');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

setupPermissions();
