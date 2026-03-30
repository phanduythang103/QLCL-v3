import { supabase } from './supabaseClient';

export interface GiamSatCdTruc {
  id?: string;
  created_at?: string;
  updated_at?: string;

  ngay_kiem_tra: string;
  nguoi_kiem_tra: string;
  don_vi_duoc_kiem_tra: string;

  // I. HANH CHINH & TO CHUC
  c1: boolean; c1_ghi_chu?: string;
  c2: boolean; c2_ghi_chu?: string;
  c3: boolean; c3_ghi_chu?: string;
  c4: boolean; c4_ghi_chu?: string;

  // II. CHUYEN MON KY THUAT
  c5: boolean; c5_ghi_chu?: string;
  c6: boolean; c6_ghi_chu?: string;
  c7: boolean; c7_ghi_chu?: string;
  c8: boolean; c8_ghi_chu?: string;

  // III. SAN SANG CHIEN DAU & CAP CUU
  c9: boolean; c9_ghi_chu?: string;
  c10: boolean; c10_ghi_chu?: string;
  c11: boolean; c11_ghi_chu?: string;

  // IV. TRAT TU NOI VU & KY LUAT
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

export async function fetchGsCdTruc(): Promise<GiamSatCdTruc[]> {
  const { data, error } = await supabase
    .from('giam_sat_cd_truc')
    .select('*')
    .order('ngay_kiem_tra', { ascending: false });

  if (error) {
    console.error('Error fetching cd_truc:', error);
    throw error;
  }
  return data || [];
}

export async function addGsCdTruc(record: GiamSatCdTruc): Promise<GiamSatCdTruc> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_cd_truc')
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    console.error('Error adding cd_truc:', error);
    throw error;
  }
  return data;
}

export async function updateGsCdTruc(id: string, record: Partial<GiamSatCdTruc>): Promise<GiamSatCdTruc> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_cd_truc')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating cd_truc:', error);
    throw error;
  }
  return data;
}

export async function deleteGsCdTruc(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_cd_truc')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting cd_truc:', error);
    throw error;
  }
}

export async function uploadCdTrucImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `cd_truc_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gs_hsba')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Error uploading cd_truc image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('gs_hsba').getPublicUrl(filePath);
  return data.publicUrl;
}
