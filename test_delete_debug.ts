import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDelete() {
  console.log('Fetching a bao_cao_scyk record to delete...');
  const { data: records, error: err } = await supabase.from('bao_cao_scyk').select('id').limit(1);
  if (err || !records || records.length === 0) {
    console.error('Cant fetch records', err);
    return;
  }
  
  const id = records[0].id;
  console.log('Attempting to delete bao_cao_scyk with ID:', id);
  
  try {
      // Manual cascade
      console.log('1. Deleting scyk_tien_do_logs...');
      const r1 = await supabase.from('scyk_tien_do_logs').delete().eq('bao_cao_id', id);
      console.log(r1.error ? r1.error : 'Success');

      console.log('2. Deleting tim_hieu_phan_tich_scyk...');
      const r2 = await supabase.from('tim_hieu_phan_tich_scyk').delete().eq('scyk_id', id);
      console.log(r2.error ? r2.error : 'Success');

      console.log('3. Deleting bien_ban_xac_minh_su_co...');
      const r3 = await supabase.from('bien_ban_xac_minh_su_co').delete().eq('scyk_id', id);
      console.log(r3.error ? r3.error : 'Success');

      console.log('4. Deleting bao_cao_scyk...');
      const r4 = await supabase.from('bao_cao_scyk').delete().eq('id', id);
      console.log(r4.error ? r4.error : 'Success');
      
  } catch (e) {
      console.error('Caught exception:', e);
  }
}
debugDelete();
