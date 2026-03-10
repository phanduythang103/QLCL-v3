import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    const { data, error } = await supabase.rpc('get_tables'); // Or a generic query to list tables if we don't have get_tables
    console.log(error || data);
}
checkTables();
