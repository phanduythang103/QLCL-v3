import { supabase } from './supabaseClient';
export async function fetchThuVienVb() {
  const { data, error } = await supabase.from('thu_vien_vb').select('*');
  if (error) throw error;
  return data;
}
