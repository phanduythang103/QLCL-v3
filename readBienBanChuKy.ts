import { supabase } from './supabaseClient';

export async function fetchBienBanChuKy() {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .select('*');
  if (error) throw error;
  return data;
}

export async function addBienBanChuKy(record) {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateBienBanChuKy(id, updates) {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteBienBanChuKy(id) {
  const { error } = await supabase
    .from('bien_ban_chu_ky')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
