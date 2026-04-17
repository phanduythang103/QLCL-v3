import { supabase } from './supabaseClient';

export interface GiamSat5s {
  id?: string;
  created_at?: string;
  updated_at?: string;

  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  don_vi_duoc_giam_sat: string;
  khu_vuc_giam_sat?: string;

  // I. SÀNG LỌC
  tc1_diem: number;
  tc1_ghi_chu?: string;
  tc1_hinh_anh?: string[];

  tc2_diem: number;
  tc2_ghi_chu?: string;
  tc2_hinh_anh?: string[];

  tc3_diem: number;
  tc3_ghi_chu?: string;
  tc3_hinh_anh?: string[];

  // II. SẮP XẾP
  tc4_diem: number;
  tc4_ghi_chu?: string;
  tc4_hinh_anh?: string[];

  tc5_diem: number;
  tc5_ghi_chu?: string;
  tc5_hinh_anh?: string[];

  tc6_diem: number;
  tc6_ghi_chu?: string;
  tc6_hinh_anh?: string[];

  tc7_diem: number;
  tc7_ghi_chu?: string;
  tc7_hinh_anh?: string[];

  // III. SẠCH SẼ
  tc8_diem: number;
  tc8_ghi_chu?: string;
  tc8_hinh_anh?: string[];

  tc9_diem: number;
  tc9_ghi_chu?: string;
  tc9_hinh_anh?: string[];

  // IV. SĂN SÓC
  tc10_diem: number;
  tc10_ghi_chu?: string;
  tc10_hinh_anh?: string[];

  tc11_diem: number;
  tc11_ghi_chu?: string;
  tc11_hinh_anh?: string[];

  tc12_diem: number;
  tc12_ghi_chu?: string;
  tc12_hinh_anh?: string[];

  tc13_diem: number;
  tc13_ghi_chu?: string;
  tc13_hinh_anh?: string[];

  // V. SẴN SÀNG
  tc14_diem: number;
  tc14_ghi_chu?: string;
  tc14_hinh_anh?: string[];

  tc15_diem: number;
  tc15_ghi_chu?: string;
  tc15_hinh_anh?: string[];

  // Kết quả
  tong_diem?: number;
  phan_loai?: string;
  ghi_chu_chung?: string;
}

export const fetchGs5s = async () => {
  const { data, error } = await supabase
    .from('giam_sat_5s')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) throw error;
  return data as GiamSat5s[];
};

export const addGs5s = async (item: GiamSat5s) => {
  const { data, error } = await supabase
    .from('giam_sat_5s')
    .insert([item])
    .select();

  if (error) throw error;
  return data?.[0] as GiamSat5s;
};

export const updateGs5s = async (id: string, item: Partial<GiamSat5s>) => {
  const { data, error } = await supabase
    .from('giam_sat_5s')
    .update(item)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0] as GiamSat5s;
};

export const deleteGs5s = async (id: string) => {
  const { error } = await supabase
    .from('giam_sat_5s')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

import { compressFile } from './utils/compression';

export const upload5sImage = async (file: File) => {
  const compressedFile = await compressFile(file);
  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `5s_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('giam_sat')
    .upload(filePath, compressedFile, { cacheControl: '31536000' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('giam_sat')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
