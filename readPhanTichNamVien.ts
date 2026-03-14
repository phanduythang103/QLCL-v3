import { supabase } from './supabaseClient';

export interface PhanTichNamVienKeoDai {
  id: string;
  ngay_phan_tich: string;
  nguoi_phan_tich: string;
  ma_bn: string;
  chan_doan: string;
  ngay_vao_vien: string;
  so_ngay_dieu_tri: number;
  ly_do_keo_dai: string;
  giai_phap_de_xuat: string | null;
  nguoi_tao_id: string | null;
  created_at: string;
}

export type PhanTichNamVienKeoDaiInput = Omit<PhanTichNamVienKeoDai, 'id' | 'nguoi_tao_id' | 'created_at'>;

export async function fetchPhanTichNamVienKeoDai(): Promise<PhanTichNamVienKeoDai[]> {
  const { data, error } = await supabase
    .from('phan_tich_nam_vien_keo_dai')
    .select('*')
    .order('ngay_phan_tich', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addPhanTichNamVienKeoDai(input: PhanTichNamVienKeoDaiInput) {
  const { data, error } = await supabase
    .insert([input])
    .select();

  if (error) throw error;
  return data;
}

export async function updatePhanTichNamVienKeoDai(id: string, input: PhanTichNamVienKeoDaiInput) {
  const { data, error } = await supabase
    .update(input)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

export async function deletePhanTichNamVienKeoDai(id: string) {
  const { error } = await supabase
    .from('phan_tich_nam_vien_keo_dai')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
