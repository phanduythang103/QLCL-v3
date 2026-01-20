import { supabase } from './supabaseClient';
export async function fetchDmVaiTroQlcl() {
  const { data, error } = await supabase.from('dm_vai_tro_qlcl').select('*');
  if (error) throw error;
  return data;
}
