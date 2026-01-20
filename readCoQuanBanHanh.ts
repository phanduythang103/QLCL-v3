import { supabase } from './supabaseClient';
export async function fetchCoQuanBanHanh() {
  const { data, error } = await supabase.from('co_quan_ban_hanh').select('*');
  if (error) throw error;
  return data;
}
