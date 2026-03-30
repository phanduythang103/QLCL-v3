import { supabase } from './supabaseClient';

// ─── INTERFACE ────────────────────────────────────────────────────────────────
export interface GiamSatNdnbTheokt {
  id?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  khoa_duoc_giam_sat: string;
  doi_tuong_giam_sat: string;

  c1_thuoc_truyen_dich?: boolean;
  c1_ghi_chu?: string;

  c2_lay_mau_xn?: boolean;
  c2_ghi_chu?: string;

  c3_thu_thuat_pt?: boolean;
  c3_ghi_chu?: string;

  c4_ban_giao_nb?: boolean;
  c4_ghi_chu?: string;

  c5_chan_doan_ha?: boolean;
  c5_ghi_chu?: string;

  c6_cap_phat_thuoc?: boolean;
  c6_ghi_chu?: string;

  tong_dat?: number;
  tong_tieu_chi?: number;
  ty_le_tuan_thu?: number;

  nhan_xet?: string;
  hinh_anh_minh_chung?: string[];

  created_at?: string;
  updated_at?: string;
}

// Helper to filter valid record fields (Defensive Mapping)
const pickValidFields = (record: any) => {
  const fields = [
    'ngay_giam_sat', 'nguoi_giam_sat', 'khoa_duoc_giam_sat', 'doi_tuong_giam_sat',
    'nhan_xet', 'hinh_anh_minh_chung', 'tong_dat', 'tong_tieu_chi', 'ty_le_tuan_thu',
    'c1_thuoc_truyen_dich', 'c1_ghi_chu',
    'c2_lay_mau_xn', 'c2_ghi_chu',
    'c3_thu_thuat_pt', 'c3_ghi_chu',
    'c4_ban_giao_nb', 'c4_ghi_chu',
    'c5_chan_doan_ha', 'c5_ghi_chu',
    'c6_cap_phat_thuoc', 'c6_ghi_chu'
  ];
  const result: any = {};
  fields.forEach(f => {
    if (record[f] !== undefined) result[f] = record[f];
  });
  return result;
};

// ─── FETCH ────────────────────────────────────────────────────────────────────
export async function fetchGiamSatNdnbTheokt(): Promise<GiamSatNdnbTheokt[]> {
  const { data, error } = await supabase
    .from('giam_sat_ndnb_theokt')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('Error fetching ndnb_theokt:', error);
    throw error;
  }
  return data || [];
}

// ─── ADD ──────────────────────────────────────────────────────────────────────
export async function addGiamSatNdnbTheokt(record: GiamSatNdnbTheokt): Promise<GiamSatNdnbTheokt> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_ndnb_theokt')
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    console.error('Error adding ndnb_theokt:', error);
    throw error;
  }
  return data;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export async function updateGiamSatNdnbTheokt(id: string, record: Partial<GiamSatNdnbTheokt>): Promise<GiamSatNdnbTheokt> {
  const cleanData = pickValidFields(record);
  const { data, error } = await supabase
    .from('giam_sat_ndnb_theokt')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating ndnb_theokt:', error);
    throw error;
  }
  return data;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteGiamSatNdnbTheokt(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_ndnb_theokt')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ndnb_theokt:', error);
    throw error;
  }
}
