import { supabase } from './supabaseClient';

export async function fetchBaoCaoScyk() {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .select('*');
  if (error) throw error;
  return data;
}
