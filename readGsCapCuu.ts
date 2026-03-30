import { supabase } from './supabaseClient';

export interface GiamSatCapCuu {
  id?: string;
  created_at?: string;
  updated_at?: string;

  ngay_kiem_tra: string;
  nguoi_kiem_tra: string;
  don_vi_duoc_kiem_tra: string;

  // I. HANH CHINH & TIEP NHAN
  c1: boolean; c1_ghi_chu?: string;
  c2: boolean; c2_ghi_chu?: string;
  c3: boolean; c3_ghi_chu?: string;
  c4: boolean; c4_ghi_chu?: string;

  // II. CHUYEN MON & XU TRI
  c5: boolean; c5_ghi_chu?: string;
  c6: boolean; c6_ghi_chu?: string;
  c7: boolean; c7_ghi_chu?: string;
  c8: boolean; c8_ghi_chu?: string;

  // III. TRANG THIET BI, THUOC & XE CAP CUU
  c9: boolean; c9_ghi_chu?: string;
  c10: boolean; c10_ghi_chu?: string;
  c11: boolean; c11_ghi_chu?: string;

  // IV. PHUONG AN CAP CUU HANG LOAT
  c12: boolean; c12_ghi_chu?: string;
  c13: boolean; c13_ghi_chu?: string;

  ket_luan_chung?: string;
  hinh_anh_minh_chung?: string[];

  tong_dat?: number;
  tong_tieu_chi?: number;
  ty_le_tuan_thu?: number;
}

const pickValidFields = (record: any) => {
  const fields = [
    'ngay_kiem_tra', 'nguoi_kiem_tra', 'don_vi_duoc_kiem_tra',
    'ket_luan_chung', 'hinh_anh_minh_chung', 'tong_dat', 'tong_tieu_chi', 'ty_le_tuan_thu'
  ];
  for (let i = 1; i <= 13; i++) {
    fields.push(`c${i}`, `c${i}_ghi_chu`);
  }
  const result: any = {};
  fields.forEach(f => {
    if (record[f] !== undefined) result[f] = record[f];
  });
  return result;
};

export async function fetchGsCapCuu(): Promise<GiamSatCapCuu[]> {
  const { data, error } = await supabase
    .from('giam_sat_cap_cuu')
    .select('*')
    .order('ngay_kiem_tra', { ascending: false });

  if (error) {
    console.error('Error fetching cap_cuu:', error);
    throw error;
  }
  return data || [];
}

export async function addGsCapCuu(record: GiamSatCapCuu): Promise<GiamSatCapCuu> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_cap_cuu')
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    console.error('Error adding cap_cuu:', error);
    throw error;
  }
  return data;
}

export async function updateGsCapCuu(id: string, record: Partial<GiamSatCapCuu>): Promise<GiamSatCapCuu> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_cap_cuu')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating cap_cuu:', error);
    throw error;
  }
  return data;
}

export async function deleteGsCapCuu(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_cap_cuu')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting cap_cuu:', error);
    throw error;
  }
}

export async function uploadCapCuuImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `cap_cuu_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gs_hsba')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Error uploading cap_cuu image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('gs_hsba').getPublicUrl(filePath);
  return data.publicUrl;
}
