import { supabase } from './supabaseClient';
export async function fetchCoQuanBanHanh() {
  const { data, error } = await supabase.from('co_quan_ban_hanh').select('*');
  if (error) throw error;
  return data;
}

export async function addCoQuanBanHanh(record) {
  const { data, error } = await supabase
    .from('co_quan_ban_hanh')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateCoQuanBanHanh(id, updates) {
  const { data, error } = await supabase
    .from('co_quan_ban_hanh')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteCoQuanBanHanh(id) {
  const { error } = await supabase
    .from('co_quan_ban_hanh')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
