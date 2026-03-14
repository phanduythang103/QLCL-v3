import { supabase } from './supabaseClient';

export interface CongSuatGiuong {
  id: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  don_vi: string;
  so_giuong: number;
  tong_ngay_dieu_tri_thuc_te: number;
  so_ngay_trong_ky: number;
  cong_suat: number;
  ghi_chu: string | null;
  nguoi_tao_id: string | null;
  created_at: string;
}

export type CongSuatGiuongInput = Omit<CongSuatGiuong, 'id' | 'cong_suat' | 'nguoi_tao_id' | 'created_at'>;

/**
 * Tính toán công suất sử dụng giường
 * Công thức: (Tổng ngày điều trị thực tế / (Số giường * Số ngày trong kỳ)) * 100
 */
export const calcCongSuat = (input: CongSuatGiuongInput): number => {
  const { tong_ngay_dieu_tri_thuc_te, so_giuong, so_ngay_trong_ky } = input;
  const divider = so_giuong * so_ngay_trong_ky;
  if (divider === 0) return 0;
  return Number(((tong_ngay_dieu_tri_thuc_te / divider) * 100).toFixed(2));
};

export async function fetchCongSuatGiuong(): Promise<CongSuatGiuong[]> {
  const { data, error } = await supabase
    .from('cong_suat_giuong')
    .select('*')
    .order('ngay_bao_cao', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addCongSuatGiuong(input: CongSuatGiuongInput) {
  const cong_suat = calcCongSuat(input);
  const { data, error } = await supabase
    .from('cong_suat_giuong')
    .insert([{ ...input, cong_suat }]);

  if (error) throw error;
  return data;
}

export async function updateCongSuatGiuong(id: string, input: CongSuatGiuongInput) {
  const cong_suat = calcCongSuat(input);
  const { data, error } = await supabase
    .from('cong_suat_giuong')
    .update({ ...input, cong_suat })
    .eq('id', id);

  if (error) throw error;
  return data;
}

export async function deleteCongSuatGiuong(id: string) {
  const { error } = await supabase
    .from('cong_suat_giuong')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
