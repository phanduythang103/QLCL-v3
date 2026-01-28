import { supabase } from './supabaseClient';

export interface KeHoachCaiTien {
  id: string;
  tieu_de: string;
  don_vi: string;
  trang_thai: string;
  tien_do: number;
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  muc_tieu?: string;
  van_de?: string;
  giai_phap?: string;
  ket_qua?: string;
  nguoi_phu_trach?: string;
  ghi_chu?: string;
  created_at?: string;
}

// Tối ưu: Chỉ select các trường cần thiết
const KHCT_SELECT_FIELDS = 'id, tieu_de, don_vi, trang_thai, tien_do, ngay_bat_dau, ngay_ket_thuc, muc_tieu, van_de, giai_phap, ket_qua, nguoi_phu_trach, ghi_chu, created_at';

// Lấy toàn bộ kế hoạch cải tiến
export async function fetchKeHoachCaiTien(): Promise<KeHoachCaiTien[]> {
  const { data, error } = await supabase
    .from('ke_hoach_cai_tien')
    .select(KHCT_SELECT_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Thêm kế hoạch mới
export async function addKeHoachCaiTien(record: Omit<KeHoachCaiTien, 'id' | 'created_at'>): Promise<KeHoachCaiTien> {
  const { data, error } = await supabase
    .from('ke_hoach_cai_tien')
    .insert([record])
    .select(KHCT_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

// Cập nhật kế hoạch
export async function updateKeHoachCaiTien(id: string, updates: Partial<KeHoachCaiTien>): Promise<KeHoachCaiTien> {
  const { data, error } = await supabase
    .from('ke_hoach_cai_tien')
    .update(updates)
    .eq('id', id)
    .select(KHCT_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

// Xóa kế hoạch
export async function deleteKeHoachCaiTien(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ke_hoach_cai_tien')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
