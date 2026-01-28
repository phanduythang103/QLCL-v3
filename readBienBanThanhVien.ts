import { supabase } from './supabaseClient';

export interface BienBanThanhVien {
  id: number;
  bien_ban_id: number;
  ho_ten: string;
  chuc_vu?: string;
  don_vi?: string;
  vai_tro: string;
  ky_ten?: boolean;
  created_at?: string;
}

// Tối ưu: Chỉ select các trường cần thiết
const BBTV_SELECT_FIELDS = 'id, bien_ban_id, ho_ten, chuc_vu, don_vi, vai_tro, ky_ten, created_at';

export async function fetchBienBanThanhVien(): Promise<BienBanThanhVien[]> {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .select(BBTV_SELECT_FIELDS);
  if (error) throw error;
  return data || [];
}

export async function addBienBanThanhVien(record: Partial<BienBanThanhVien>): Promise<BienBanThanhVien> {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .insert([record])
    .select(BBTV_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function updateBienBanThanhVien(id: string, updates: Partial<BienBanThanhVien>): Promise<BienBanThanhVien> {
  const { data, error } = await supabase
    .from('bien_ban_thanh_vien')
    .update(updates)
    .eq('id', id)
    .select(BBTV_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function deleteBienBanThanhVien(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('bien_ban_thanh_vien')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
