import { supabase } from './supabaseClient';

export interface NhanSuQlcl {
  id: string;
  ho_ten: string;
  cap_bac?: string;
  chuc_vu?: string;
  don_vi?: string;
  so_dien_thoai?: string;
  email?: string;
  co_chung_chi: boolean;
  vai_tro_qlcl: string[];  // 'COUNCIL', 'BOARD', 'NETWORK'
  ghi_chu?: string;
  trang_thai: string;
  created_at?: string;
}

// Lấy toàn bộ danh sách nhân sự QLCL
export async function fetchNhanSuQlcl(): Promise<NhanSuQlcl[]> {
  const { data, error } = await supabase
    .from('nhan_su_qlcl')
    .select('*')
    .order('ho_ten');
  if (error) throw error;
  return data || [];
}

// Thêm nhân sự mới
export async function addNhanSuQlcl(record: Omit<NhanSuQlcl, 'id' | 'created_at'>): Promise<NhanSuQlcl> {
  const { data, error } = await supabase
    .from('nhan_su_qlcl')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

// Sửa thông tin nhân sự
export async function updateNhanSuQlcl(id: string, updates: Partial<NhanSuQlcl>): Promise<NhanSuQlcl> {
  const { data, error } = await supabase
    .from('nhan_su_qlcl')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

// Xóa nhân sự
export async function deleteNhanSuQlcl(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('nhan_su_qlcl')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
