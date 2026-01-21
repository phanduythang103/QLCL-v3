import { supabase } from './supabaseClient';
export async function fetchChiaSe() {
  const { data, error } = await supabase.from('chia_se').select('*');
  if (error) throw error;
  return data;
}

export async function addChiaSe(record) {
  const { data, error } = await supabase
    .from('chia_se')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateChiaSe(id, updates) {
  const { data, error } = await supabase
    .from('chia_se')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteChiaSe(id) {
  const { error } = await supabase
    .from('chia_se')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
