import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  console.log('Fetching a bao_cao_scyk record...');
  const { data: records, error: err } = await supabase.from('bao_cao_scyk').select('id').limit(1);
  if (err || !records || records.length === 0) {
    console.error('Cant fetch records', err);
    return;
  }
  
  const id = records[0].id;
  console.log('Testing delete on ID:', id);
  // Manual cascade just in case
  await supabase.from('scyk_tien_do_logs').delete().eq('bao_cao_id', id);
  await supabase.from('tim_hieu_phan_tich_scyk').delete().eq('scyk_id', id);
  await supabase.from('bien_ban_xac_minh_su_co').delete().eq('scyk_id', id);

  // Try to delete and get row count
  const { data, error, count } = await supabase
    .from('bao_cao_scyk')
    .delete()
    .eq('id', id)
    .select(); // selecting deleted rows is one way to check affected rows

  console.log('Delete result:');
  console.log('Error:', error);
  console.log('Returned data (deleted rows):', data);
}
checkRLS();
