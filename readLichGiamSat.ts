import { supabase } from './supabaseClient';
export async function fetchLichGiamSat() {
  const { data, error } = await supabase.from('lich_giam_sat').select('*');
  if (error) throw error;
  return data;
}
