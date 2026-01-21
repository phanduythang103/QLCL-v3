import { supabase } from './supabaseClient';

export interface LichGiamSat {
  id?: string;
  tu_ngay?: string;
  den_ngay?: string;
  nd_giam_sat?: string;
  nhan_vien_gs?: string;
  dv_duoc_gs?: string;
  trang_thai?: string;
  created_at?: string;
  // Alias fields for component compatibility
  ngay_giam_sat?: string;
  gio_bat_dau?: string;
  noi_dung?: string;
  khoa_phong?: string;
  don_vi?: string;
}

export async function fetchLichGiamSat(): Promise<LichGiamSat[]> {
  const { data, error } = await supabase.from('lich_giam_sat').select('*').order('tu_ngay', { ascending: false });
  if (error) throw error;
  // Map fields for component compatibility
  return (data || []).map(item => ({
    ...item,
    ngay_giam_sat: item.tu_ngay,
    noi_dung: item.nd_giam_sat,
    don_vi: item.dv_duoc_gs
  }));
}

export async function addLichGiamSat(record) {
  const { data, error } = await supabase
    .from('lich_giam_sat')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateLichGiamSat(id, updates) {
  const { data, error } = await supabase
    .from('lich_giam_sat')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteLichGiamSat(id) {
  const { error } = await supabase
    .from('lich_giam_sat')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
