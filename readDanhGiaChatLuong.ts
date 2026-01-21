import { supabase } from './supabaseClient';

// --- Bo 83 Tieu Chi ---
export interface Bo83TieuChi {
  id?: number;
  ma_tieu_chi: string;
  nhom: string;
  ten_nhom?: string;
  ten_tieu_chi: string;
  don_vi_phu_trach?: string;
  diem_tu_cham?: number;
  diem_doan_cham?: number;
  so_minh_chung?: number;
  trang_thai?: string;
  nam_danh_gia?: string;
  ghi_chu?: string;
  ngay_cap_nhat?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchBo83TieuChi(): Promise<Bo83TieuChi[]> {
  const { data, error } = await supabase
    .from('bo_83_tieu_chi')
    .select('*')
    .order('ma_tieu_chi', { ascending: true });
  
  if (error) {
    console.error('Error fetching bo_83_tieu_chi:', error);
    throw error;
  }
  return data || [];
}

export async function fetchBo83ByNhom(nhom: string): Promise<Bo83TieuChi[]> {
  const { data, error } = await supabase
    .from('bo_83_tieu_chi')
    .select('*')
    .eq('nhom', nhom)
    .order('ma_tieu_chi', { ascending: true });
  
  if (error) {
    console.error('Error fetching bo_83_tieu_chi by nhom:', error);
    throw error;
  }
  return data || [];
}

export async function addBo83TieuChi(item: Bo83TieuChi): Promise<Bo83TieuChi> {
  const { data, error } = await supabase
    .from('bo_83_tieu_chi')
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding bo_83_tieu_chi:', error);
    throw error;
  }
  return data;
}

export async function updateBo83TieuChi(id: number, item: Partial<Bo83TieuChi>): Promise<Bo83TieuChi> {
  const { data, error } = await supabase
    .from('bo_83_tieu_chi')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating bo_83_tieu_chi:', error);
    throw error;
  }
  return data;
}

export async function deleteBo83TieuChi(id: number): Promise<void> {
  const { error } = await supabase
    .from('bo_83_tieu_chi')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting bo_83_tieu_chi:', error);
    throw error;
  }
}

// --- Bo Tieu Chuan ---
export interface BoTieuChuan {
  id?: number;
  ma_tieu_chuan: string;
  ten_tieu_chuan: string;
  don_vi_phu_trach?: string;
  tan_suat?: string;
  trang_thai?: string;
  ghi_chu?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchBoTieuChuan(): Promise<BoTieuChuan[]> {
  const { data, error } = await supabase
    .from('bo_tieu_chuan')
    .select('*')
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching bo_tieu_chuan:', error);
    throw error;
  }
  return data || [];
}

export async function addBoTieuChuan(item: BoTieuChuan): Promise<BoTieuChuan> {
  const { data, error } = await supabase
    .from('bo_tieu_chuan')
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding bo_tieu_chuan:', error);
    throw error;
  }
  return data;
}

export async function updateBoTieuChuan(id: number, item: Partial<BoTieuChuan>): Promise<BoTieuChuan> {
  const { data, error } = await supabase
    .from('bo_tieu_chuan')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating bo_tieu_chuan:', error);
    throw error;
  }
  return data;
}

export async function deleteBoTieuChuan(id: number): Promise<void> {
  const { error } = await supabase
    .from('bo_tieu_chuan')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting bo_tieu_chuan:', error);
    throw error;
  }
}

// --- Ket Qua Danh Gia ---
export interface KetQuaDanhGia {
  id?: number;
  bo_tieu_chuan_id?: number;
  ten_tieu_chuan?: string;
  don_vi_duoc_danh_gia: string;
  ngay_danh_gia: string;
  diem_so?: number;
  ket_qua?: string;
  nguoi_danh_gia?: string;
  ghi_chu?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchKetQuaDanhGia(): Promise<KetQuaDanhGia[]> {
  const { data, error } = await supabase
    .from('ket_qua_danh_gia')
    .select('*')
    .order('ngay_danh_gia', { ascending: false });
  
  if (error) {
    console.error('Error fetching ket_qua_danh_gia:', error);
    throw error;
  }
  return data || [];
}

export async function addKetQuaDanhGia(item: KetQuaDanhGia): Promise<KetQuaDanhGia> {
  const { data, error } = await supabase
    .from('ket_qua_danh_gia')
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding ket_qua_danh_gia:', error);
    throw error;
  }
  return data;
}

export async function deleteKetQuaDanhGia(id: number): Promise<void> {
  const { error } = await supabase
    .from('ket_qua_danh_gia')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting ket_qua_danh_gia:', error);
    throw error;
  }
}
