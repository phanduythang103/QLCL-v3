import { supabase } from './supabaseClient';
export async function fetchDmDonVi() {
  const { data, error } = await supabase.from('dm_don_vi').select('*');
  if (error) throw error;
  return data;
}
