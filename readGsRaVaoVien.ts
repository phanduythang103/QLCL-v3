import { supabase } from './supabaseClient';

export interface GiamSatRaVaoVien {
  id?: string;
  created_at?: string;
  updated_at?: string;

  ngay_giam_sat: string;
  nguoi_gs: string;
  khoa_gs: string;
  doi_tuong_gs: string[];

  // I. CHE DO VAO VIEN
  c1: boolean; c1_ghi_chu?: string;
  c2: boolean; c2_ghi_chu?: string;
  c3: boolean; c3_ghi_chu?: string;

  // II. CHE DO CHUYEN KHOA
  c4: boolean; c4_ghi_chu?: string;
  c5: boolean; c5_ghi_chu?: string;
  c6: boolean; c6_ghi_chu?: string;

  // III. CHE DO CHUYEN VIEN
  c7: boolean; c7_ghi_chu?: string;
  c8: boolean; c8_ghi_chu?: string;
  c9: boolean; c9_ghi_chu?: string;

  // IV. CHE DO RA VIEN
  c10: boolean; c10_ghi_chu?: string;
  c11: boolean; c11_ghi_chu?: string;
  c12: boolean; c12_ghi_chu?: string;

  // V. AN TOAN
  c13: boolean; c13_ghi_chu?: string;
  c14: boolean; c14_ghi_chu?: string;

  ket_luan_chung?: string;
  hinh_anh_minh_chung?: string[];

  tong_dat?: number;
  tong_tieu_chi?: number;
  ty_le_tuan_thu?: number;
}

const pickValidFields = (record: any) => {
  const fields = [
    'ngay_giam_sat', 'nguoi_gs', 'khoa_gs', 'doi_tuong_gs',
    'ket_luan_chung', 'hinh_anh_minh_chung', 'tong_dat', 'tong_tieu_chi', 'ty_le_tuan_thu'
  ];
  for (let i = 1; i <= 14; i++) {
    fields.push(`c${i}`, `c${i}_ghi_chu`);
  }
  const result: any = {};
  fields.forEach(f => {
    if (record[f] !== undefined) result[f] = record[f];
  });
  return result;
};

export async function fetchGsRaVaoVien(): Promise<GiamSatRaVaoVien[]> {
  const { data, error } = await supabase
    .from('gs_ra_vao_vien')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('Error fetching ra_vao_vien:', error);
    throw error;
  }
  return data || [];
}

export async function addGsRaVaoVien(record: GiamSatRaVaoVien): Promise<GiamSatRaVaoVien> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('gs_ra_vao_vien')
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    console.error('Error adding ra_vao_vien:', error);
    throw error;
  }
  return data;
}

export async function updateGsRaVaoVien(id: string, record: Partial<GiamSatRaVaoVien>): Promise<GiamSatRaVaoVien> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('gs_ra_vao_vien')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating ra_vao_vien:', error);
    throw error;
  }
  return data;
}

export async function deleteGsRaVaoVien(id: string): Promise<void> {
  const { error } = await supabase
    .from('gs_ra_vao_vien')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ra_vao_vien:', error);
    throw error;
  }
}

export async function uploadRaVaoVienImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `ra_vao_vien_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gs_hsba')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Error uploading ra_vao_vien image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('gs_hsba').getPublicUrl(filePath);
  return data.publicUrl;
}
