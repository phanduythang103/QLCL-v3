import { supabase } from './supabaseClient';
export async function fetchThuVienVideo() {
  const { data, error } = await supabase.from('thu_vien_video').select('*');
  if (error) throw error;
  return data;
}
