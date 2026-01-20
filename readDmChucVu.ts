import { supabase } from './supabaseClient';
export async function fetchDmChucVu() {
  const { data, error } = await supabase.from('dm_chuc_vu').select('*');
  if (error) throw error;
  return data;
}
