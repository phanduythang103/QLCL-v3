import { supabase } from './supabaseClient';
export async function fetchChiaSe() {
  const { data, error } = await supabase.from('chia_se').select('*');
  if (error) throw error;
  return data;
}
