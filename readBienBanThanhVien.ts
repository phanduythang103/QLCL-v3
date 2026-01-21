import { supabase } from './supabaseClient';

export async function fetchBienBanThanhVien() {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .select('*');
  if (error) throw error;
  return data;
}

export async function addBienBanThanhVien(record) {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateBienBanThanhVien(id, updates) {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteBienBanThanhVien(id) {
  const { error } = await supabase
    .from('bien_ban_thanh_vien')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
