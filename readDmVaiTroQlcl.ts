import { supabase } from './supabaseClient';
export async function fetchDmVaiTroQlcl() {
  const { data, error } = await supabase.from('dm_vai_tro_qlcl').select('*');
  if (error) throw error;
  return data;
}

export async function addDmVaiTroQlcl(record) {
  const { data, error } = await supabase
    .from('dm_vai_tro_qlcl')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateDmVaiTroQlcl(id, updates) {
  const { data, error } = await supabase
    .from('dm_vai_tro_qlcl')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteDmVaiTroQlcl(id) {
  const { error } = await supabase
    .from('dm_vai_tro_qlcl')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
