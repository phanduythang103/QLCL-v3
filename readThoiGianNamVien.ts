import { supabase } from './supabaseClient';

export interface ThoiGianNamVien {
  id: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  don_vi: string;
  tong_luot_ra_vien: number;
  tong_ngay_dieu_tri: number;
  ngay_tb: number;
  muc_tieu: number;
  chenh_lech: number;
  nguoi_tao_id: string | null;
  created_at: string;
}

export type ThoiGianNamVienInput = Omit<ThoiGianNamVien, 'id' | 'ngay_tb' | 'chenh_lech' | 'nguoi_tao_id' | 'created_at'>;

/**
 * Tính toán các chỉ số tự động
 */
export const calcNamVienStats = (input: ThoiGianNamVienInput) => {
  const luot = input.tong_luot_ra_vien || 0;
  const ngay = input.tong_ngay_dieu_tri || 0;
  const target = input.muc_tieu || 0;
  
  const ngay_tb = luot > 0 ? Number((ngay / luot).toFixed(2)) : 0;
  const chenh_lech = Number((ngay_tb - target).toFixed(2));

  return { ngay_tb, chenh_lech };
};

export async function fetchThoiGianNamVien(): Promise<ThoiGianNamVien[]> {
  const { data, error } = await supabase
    .from('thoi_gian_nam_vien')
    .select('*')
    .order('ngay_bao_cao', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addThoiGianNamVien(input: ThoiGianNamVienInput) {
  const { ngay_tb, chenh_lech } = calcNamVienStats(input);
  
  const { data, error } = await supabase
    .insert([{ 
      ...input, 
      ngay_tb, 
      chenh_lech 
    }])
    .select();

  if (error) throw error;
  return data;
}

export async function updateThoiGianNamVien(id: string, input: ThoiGianNamVienInput) {
  const { ngay_tb, chenh_lech } = calcNamVienStats(input);

  const { data, error } = await supabase
    .from('thoi_gian_nam_vien')
    .update({ 
      ...input, 
      ngay_tb, 
      chenh_lech 
    })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

export async function deleteThoiGianNamVien(id: string) {
  const { error } = await supabase
    .from('thoi_gian_nam_vien')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
