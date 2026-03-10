import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeleteWithLogs() {
  console.log('Fetching a bao_cao_scyk record that has logs...');
  const { data: logs, error: err } = await supabase.from('scyk_tien_do_logs').select('bao_cao_id').limit(1);
  if (err) {
    console.error('Cant fetch logs', err);
    return;
  }
  if (!logs || logs.length === 0) {
    console.log('No logs found!');
    return;
  }
  
  const bao_cao_id = logs[0].bao_cao_id;
  console.log('Attempting to delete bao_cao_scyk with ID:', bao_cao_id);
  const { error: delErr } = await supabase.from('bao_cao_scyk').delete().eq('id', bao_cao_id);
  if (delErr) {
    console.error('DELETE FAILED:', JSON.stringify(delErr, null, 2));
  } else {
    console.log('DELETE SUCCEEDED!');
  }
}
testDeleteWithLogs();
