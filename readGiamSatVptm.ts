import { supabase } from './supabaseClient';

export interface GiamSatVptm {
  id?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  don_vi_duoc_gs: string;
  ho_ten_nb: string;
  gioi_tinh: 'Nam' | 'Nữ';
  nam_sinh?: number;
  phong_benh?: string;
  giuong_benh?: string;
  c1_dau_cao?: boolean;
  c1_ghi_chu?: string;
  c2_vs_rang_mieng?: boolean;
  c2_ghi_chu?: string;
  c3_vs_tay?: boolean;
  c3_ghi_chu?: string;
  c4_dung_cu_ho_hap?: boolean;
  c4_ghi_chu?: string;
  c5_hut_dom?: boolean;
  c5_ghi_chu?: string;
  c6_bay_nuoc?: boolean;
  c6_ghi_chu?: string;
  tong_dat?: number;
  tong_tieu_chi?: number;
  ty_le_tuan_thu?: number;
  created_at?: string;
  updated_at?: string;
}

export async function fetchGiamSatVptm(): Promise<GiamSatVptm[]> {
  const { data, error } = await supabase
    .from('giam_sat_vptm')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });
  
  if (error) {
    console.error('Error fetching giam_sat_vptm:', error);
    throw error;
  }
  return data || [];
}

export async function addGiamSatVptm(record: GiamSatVptm): Promise<GiamSatVptm> {
  const { data, error } = await supabase
    .from('giam_sat_vptm')
    .insert([record])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding giam_sat_vptm:', error);
    throw error;
  }
  return data;
}

export async function updateGiamSatVptm(id: string, record: Partial<GiamSatVptm>): Promise<GiamSatVptm> {
  const { data, error } = await supabase
    .from('giam_sat_vptm')
    .update(record)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating giam_sat_vptm:', error);
    throw error;
  }
  return data;
}

export async function deleteGiamSatVptm(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_vptm')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting giam_sat_vptm:', error);
    throw error;
  }
}
