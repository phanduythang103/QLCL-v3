import { supabase } from './supabaseClient';

// ─── INTERFACE ────────────────────────────────────────────────────────────────
export interface GiamSatNdnb {
  id?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  khoa_duoc_giam_sat: string;
  doi_tuong_giam_sat: string;

  c1_nhan_dien_2_thong_tin?: boolean;
  c1_ghi_chu?: string;

  c2_cau_hoi_mo?: boolean;
  c2_ghi_chu?: string;

  c3_vong_nhan_dien?: boolean;
  c3_ghi_chu?: string;

  c4_doi_chieu_ho_so?: boolean;
  c4_ghi_chu?: string;

  c5_xac_nhan_nguoi_than?: boolean;
  c5_ghi_chu?: string;

  c6_dan_nhan_benh_pham?: boolean;
  c6_ghi_chu?: string;

  c7_ban_giao_nguoi_benh?: boolean;
  c7_ghi_chu?: string;

  tong_dat?: number;
  tong_tieu_chi?: number;
  ty_le_tuan_thu?: number;

  nhan_xet?: string;
  hinh_anh_minh_chung?: string[];

  created_at?: string;
  updated_at?: string;
}

// ─── FETCH ────────────────────────────────────────────────────────────────────
export async function fetchGiamSatNdnb(): Promise<GiamSatNdnb[]> {
  const { data, error } = await supabase
    .from('giam_sat_ndnb')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('Error fetching giam_sat_ndnb:', error);
    throw error;
  }
  return data || [];
}

// Helper to filter valid record fields
const pickValidFields = (record: any) => {
  const fields = [
    'ngay_giam_sat', 'nguoi_giam_sat', 'khoa_duoc_giam_sat', 'doi_tuong_giam_sat',
    'nhan_xet', 'hinh_anh_minh_chung', 'tong_dat', 'tong_tieu_chi', 'ty_le_tuan_thu',
    'c1_nhan_dien_2_thong_tin', 'c1_ghi_chu',
    'c2_cau_hoi_mo', 'c2_ghi_chu',
    'c3_vong_nhan_dien', 'c3_ghi_chu',
    'c4_doi_chieu_ho_so', 'c4_ghi_chu',
    'c5_xac_nhan_nguoi_than', 'c5_ghi_chu',
    'c6_dan_nhan_benh_pham', 'c6_ghi_chu',
    'c7_ban_giao_nguoi_benh', 'c7_ghi_chu'
  ];
  const result: any = {};
  fields.forEach(f => {
    if (record[f] !== undefined) result[f] = record[f];
  });
  return result;
};

// ─── ADD ──────────────────────────────────────────────────────────────────────
export async function addGiamSatNdnb(record: GiamSatNdnb): Promise<GiamSatNdnb> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_ndnb')
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    console.error('Error adding giam_sat_ndnb:', error);
    throw error;
  }
  return data;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateGiamSatNdnb(id: string, record: Partial<GiamSatNdnb>): Promise<GiamSatNdnb> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_ndnb')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating giam_sat_ndnb:', error);
    throw error;
  }
  return data;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteGiamSatNdnb(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_ndnb')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting giam_sat_ndnb:', error);
    throw error;
  }
}

// ─── UPLOAD IMAGE ─────────────────────────────────────────────────────────────
import { compressFile } from './utils/compression';

export async function uploadNdnbImage(file: File): Promise<string> {
  const compressedFile = await compressFile(file);
  const ext = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `ndnb_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('giam_sat')
    .upload(filePath, compressedFile, { cacheControl: '31536000', upsert: false });

  if (uploadError) {
    console.error('Error uploading NDNB image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('giam_sat').getPublicUrl(filePath);
  return data.publicUrl;
}
