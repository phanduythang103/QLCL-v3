import { supabase } from './supabaseClient';
export async function fetchTimHieuPhanTichScyk() {
  const { data, error } = await supabase.from('tim_hieu_phan_tich_scyk').select('*');
  if (error) throw error;
  return data;
}
