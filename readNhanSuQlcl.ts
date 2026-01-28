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

// Tối ưu: Chỉ select các trường cần thiết
const NS_SELECT_FIELDS = 'id, ho_ten, cap_bac, chuc_vu, don_vi, so_dien_thoai, email, co_chung_chi, vai_tro_qlcl, ghi_chu, trang_thai, created_at';

// Lấy toàn bộ danh sách nhân sự QLCL
export async function fetchNhanSuQlcl(): Promise<NhanSuQlcl[]> {
  const { data, error } = await supabase
    .from('nhan_su_qlcl')
    .select(NS_SELECT_FIELDS)
    .order('ho_ten');
  if (error) throw error;
  return data || [];
}

// Thêm nhân sự mới
export async function addNhanSuQlcl(record: Omit<NhanSuQlcl, 'id' | 'created_at'>): Promise<NhanSuQlcl> {
  const { data, error } = await supabase
    .from('nhan_su_qlcl')
    .insert([record])
    .select(NS_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

// Sửa thông tin nhân sự
export async function updateNhanSuQlcl(id: string, updates: Partial<NhanSuQlcl>): Promise<NhanSuQlcl> {
  const { data, error } = await supabase
    .from('nhan_su_qlcl')
    .update(updates)
    .eq('id', id)
    .select(NS_SELECT_FIELDS);
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
