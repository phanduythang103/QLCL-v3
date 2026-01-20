import { supabase } from './supabaseClient';

export async function fetchBienBanThanhVien() {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .select('*');
  if (error) throw error;
  return data;
}
