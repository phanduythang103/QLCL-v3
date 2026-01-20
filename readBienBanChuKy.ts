import { supabase } from './supabaseClient';

export async function fetchBienBanChuKy() {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .select('*');
  if (error) throw error;
  return data;
}
