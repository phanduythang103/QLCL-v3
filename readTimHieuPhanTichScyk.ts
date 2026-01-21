import { supabase } from './supabaseClient';
export async function fetchTimHieuPhanTichScyk() {
  const { data, error } = await supabase.from('tim_hieu_phan_tich_scyk').select('*');
  if (error) throw error;
  return data;
}

export async function addTimHieuPhanTichScyk(record) {
  const { data, error } = await supabase
    .from('tim_hieu_phan_tich_scyk')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateTimHieuPhanTichScyk(id, updates) {
  const { data, error } = await supabase
    .from('tim_hieu_phan_tich_scyk')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteTimHieuPhanTichScyk(id) {
  const { error } = await supabase
    .from('tim_hieu_phan_tich_scyk')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
