import { supabase } from './supabaseClient';

export async function fetchBaoCaoScyk() {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .select('*');
  if (error) throw error;
  return data;
}

// Thêm bản ghi mới
export async function addBaoCaoScyk(record: any) {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Sửa bản ghi
export async function updateBaoCaoScyk(id: string, updates: any) {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

// Xóa bản ghi
export async function deleteBaoCaoScyk(id: string) {
  const { error } = await supabase
    .from('bao_cao_scyk')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
export async function fetchLatestBaoCaoScykByYear(year: string) {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .select('so_bc_ma_scyk')
    .ilike('so_bc_ma_scyk', `SCYK-${year}-%`)
    .order('so_bc_ma_scyk', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0];
}
