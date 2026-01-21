import { supabase } from './supabaseClient';
export async function fetchDmChucVu() {
  const { data, error } = await supabase.from('dm_chuc_vu').select('*');
  if (error) throw error;
  return data;
}

export async function addDmChucVu(record) {
  const { data, error } = await supabase
    .from('dm_chuc_vu')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateDmChucVu(id, updates) {
  const { data, error } = await supabase
    .from('dm_chuc_vu')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteDmChucVu(id) {
  const { error } = await supabase
    .from('dm_chuc_vu')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
