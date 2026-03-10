import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSQL() {
    console.log("Adding ngay_hieu_luc...");
    // Using a REST RPC if available or a dummy insert/delete to see if column actually exists. The best way is to execute via RPC. If no RPC 'exec_sql', we might need to rely on the user.
    // However, I can try to run standard postgres commands by passing it through the REST API.
    
    // We can't directly alter tables via standard supabase JS without RPC.
    // Let's check if the get_tables RPC from earlier conversation is available, or use another way.
    // Actually, I can use Postgres functions if they exist. Let's see if the column is already there by fetching.
    
    const { data: fetchCheck, error: fetchErr } = await supabase.from('thu_vien_vb').select('ngay_hieu_luc').limit(1);
    
    if (fetchErr) {
        console.log("Column likely missing:", fetchErr.message);
        console.log("Please run the SQL script in Supabase Dashboard.");
    } else {
        console.log("Column 'ngay_hieu_luc' exists!");
    }
}
runSQL();
