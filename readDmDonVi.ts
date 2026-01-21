import { supabase } from './supabaseClient';
export async function fetchDmDonVi() {
  const { data, error } = await supabase.from('dm_don_vi').select('*');
  if (error) throw error;
  return data;
}

export async function addDmDonVi(record) {
  const { data, error } = await supabase
    .from('dm_don_vi')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateDmDonVi(id, updates) {
  const { data, error } = await supabase
    .from('dm_don_vi')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteDmDonVi(id) {
  const { error } = await supabase
    .from('dm_don_vi')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
