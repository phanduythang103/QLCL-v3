import { supabase } from './supabaseClient';

export async function fetchBaoCaoScyk() {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .select('*');
  if (error) throw error;
  return data;
}

// Thêm bản ghi mới
export async function addBaoCaoScyk(record) {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Sửa bản ghi
export async function updateBaoCaoScyk(id, updates) {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

// Xóa bản ghi
export async function deleteBaoCaoScyk(id) {
  const { error } = await supabase
    .from('bao_cao_scyk')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
