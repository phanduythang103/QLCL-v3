import { supabase } from './supabaseClient';

export interface BienBanChuKy {
  id: number;
  bien_ban_id: number;
  thanh_vien_id: number;
  duong_dan_file?: string;
  thoi_gian_ky?: string;
  created_at?: string;
}

// Tối ưu: Chỉ select các trường cần thiết
const BB_SELECT_FIELDS = 'id, bien_ban_id, thanh_vien_id, duong_dan_file, thoi_gian_ky, created_at';

export async function fetchBienBanChuKy(): Promise<BienBanChuKy[]> {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .select(BB_SELECT_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addBienBanChuKy(record: Partial<BienBanChuKy>): Promise<BienBanChuKy> {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .insert([record])
    .select(BB_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function updateBienBanChuKy(id: string, updates: Partial<BienBanChuKy>): Promise<BienBanChuKy> {
  const { data, error } = await supabase
    .from('bien_ban_chu_ky')
    .update(updates)
    .eq('id', id)
    .select(BB_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function deleteBienBanChuKy(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('bien_ban_chu_ky')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
