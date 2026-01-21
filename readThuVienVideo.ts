import { supabase } from './supabaseClient';
export async function fetchThuVienVideo() {
  const { data, error } = await supabase.from('thu_vien_video').select('*');
  if (error) throw error;
  return data;
}

export async function addThuVienVideo(record) {
  const { data, error } = await supabase
    .from('thu_vien_video')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateThuVienVideo(id, updates) {
  const { data, error } = await supabase
    .from('thu_vien_video')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteThuVienVideo(id) {
  const { error } = await supabase
    .from('thu_vien_video')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
