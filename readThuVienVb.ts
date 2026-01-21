import { supabase } from './supabaseClient';
export async function fetchThuVienVb() {
  const { data, error } = await supabase.from('thu_vien_vb').select('*');
  if (error) throw error;
  return data;
}

export async function addThuVienVb(record) {
  const { data, error } = await supabase
    .from('thu_vien_vb')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateThuVienVb(id, updates) {
  const { data, error } = await supabase
    .from('thu_vien_vb')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteThuVienVb(id) {
  const { error } = await supabase
    .from('thu_vien_vb')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
