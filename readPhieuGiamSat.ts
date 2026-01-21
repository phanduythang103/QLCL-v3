import { supabase } from './supabaseClient';

export interface PhieuGiamSat {
  id?: number;
  ten_phieu: string;
  loai_giam_sat?: string;
  khoa_phong?: string;
  ngay_kiem_tra?: string;
  nguoi_kiem_tra?: string;
  ty_le_tuan_thu?: number;
  ket_qua?: string;
  noi_dung_chi_tiet?: any;
  ghi_chu?: string;
  trang_thai?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchPhieuGiamSat(): Promise<PhieuGiamSat[]> {
  const { data, error } = await supabase
    .from('phieu_giam_sat')
    .select('*')
    .order('ngay_kiem_tra', { ascending: false });
  
  if (error) {
    console.error('Error fetching phieu_giam_sat:', error);
    throw error;
  }
  return data || [];
}

export async function fetchPhieuGiamSatByLoai(loai: string): Promise<PhieuGiamSat[]> {
  const { data, error } = await supabase
    .from('phieu_giam_sat')
    .select('*')
    .eq('loai_giam_sat', loai)
    .order('ngay_kiem_tra', { ascending: false });
  
  if (error) {
    console.error('Error fetching phieu_giam_sat by loai:', error);
    throw error;
  }
  return data || [];
}

export async function addPhieuGiamSat(item: PhieuGiamSat): Promise<PhieuGiamSat> {
  const { data, error } = await supabase
    .from('phieu_giam_sat')
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding phieu_giam_sat:', error);
    throw error;
  }
  return data;
}

export async function updatePhieuGiamSat(id: number, item: Partial<PhieuGiamSat>): Promise<PhieuGiamSat> {
  const { data, error } = await supabase
    .from('phieu_giam_sat')
    .update({ ...item, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating phieu_giam_sat:', error);
    throw error;
  }
  return data;
}

export async function deletePhieuGiamSat(id: number): Promise<void> {
  const { error } = await supabase
    .from('phieu_giam_sat')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting phieu_giam_sat:', error);
    throw error;
  }
}
