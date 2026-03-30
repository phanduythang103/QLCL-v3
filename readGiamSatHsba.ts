import { supabase } from './supabaseClient';

// ─── INTERFACE ────────────────────────────────────────────────────────────────
export interface GiamSatHsba {
  id?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  khoa_duoc_giam_sat: string;
  ma_hsba: string;

  c1?: boolean; c1_ghi_chu?: string;
  c2?: boolean; c2_ghi_chu?: string;
  c3?: boolean; c3_ghi_chu?: string;
  c4?: boolean; c4_ghi_chu?: string;
  c5?: boolean; c5_ghi_chu?: string;
  c6?: boolean; c6_ghi_chu?: string;
  c7?: boolean; c7_ghi_chu?: string;
  c8?: boolean; c8_ghi_chu?: string;
  c9?: boolean; c9_ghi_chu?: string;
  c10?: boolean; c10_ghi_chu?: string;
  c11?: boolean; c11_ghi_chu?: string;
  c12?: boolean; c12_ghi_chu?: string;
  c13?: boolean; c13_ghi_chu?: string;
  c14?: boolean; c14_ghi_chu?: string;

  nhan_xet?: string;
  hinh_anh_minh_chung?: string[];

  tong_dat?: number;
  tong_tieu_chi?: number;
  ty_le_tuan_thu?: number;

  created_at?: string;
  updated_at?: string;
}

// ─── DEFENSIVE MAPPING ────────────────────────────────────────────────────────
const pickValidFields = (record: any) => {
  const fields = [
    'ngay_giam_sat', 'nguoi_giam_sat', 'khoa_duoc_giam_sat', 'ma_hsba',
    'nhan_xet', 'hinh_anh_minh_chung', 'tong_dat', 'tong_tieu_chi', 'ty_le_tuan_thu'
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

// ─── FETCH ────────────────────────────────────────────────────────────────────
export async function fetchGiamSatHsba(): Promise<GiamSatHsba[]> {
  const { data, error } = await supabase
    .from('giam_sat_hsba')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('Error fetching hsba:', error);
    throw error;
  }
  return data || [];
}

// ─── ADD ──────────────────────────────────────────────────────────────────────
export async function addGiamSatHsba(record: GiamSatHsba): Promise<GiamSatHsba> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_hsba')
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    console.error('Error adding hsba:', error);
    throw error;
  }
  return data;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateGiamSatHsba(id: string, record: Partial<GiamSatHsba>): Promise<GiamSatHsba> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_hsba')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating hsba:', error);
    throw error;
  }
  return data;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteGiamSatHsba(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_hsba')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting hsba:', error);
    throw error;
  }
}

// ─── UPLOAD IMAGE ─────────────────────────────────────────────────────────────
export async function uploadHsbaImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `hsba_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gs_hsba')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Error uploading HSBA image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('gs_hsba').getPublicUrl(filePath);
  return data.publicUrl;
}
