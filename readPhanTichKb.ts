import { supabase } from './supabaseClient';

export interface PhanTichRow {
  stt: number;
  nguyen_nhan: string;
  tan_suat: string; // 'Thường xuyên' | 'Trung bình' | 'Ít' | 'Hiếm'
  giai_phap: string;
  nguoi_thuc_hien: string;
}

export interface PhanTichKb {
  id: string;
  created_at: string;
  ngay_phan_tich: string;
  nguoi_phan_tich: string;
  ma_bn: string;   // Khoá liên kết với gs_kham_benh.ma_bn
  noi_dung: PhanTichRow[];
  ghi_chu: string | null;
}

export type PhanTichKbInput = Omit<PhanTichKb, 'id' | 'created_at'>;

export async function fetchPhanTichKb(): Promise<PhanTichKb[]> {
  const { data, error } = await supabase
    .from('phan_tich_kb')
    .select('*')
    .order('ngay_phan_tich', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addPhanTichKb(input: PhanTichKbInput): Promise<void> {
  const { error } = await supabase.from('phan_tich_kb').insert([input]);
  if (error) throw error;
}

export async function updatePhanTichKb(id: string, input: Partial<PhanTichKbInput>): Promise<void> {
  const { error } = await supabase.from('phan_tich_kb').update(input).eq('id', id);
  if (error) throw error;
}

export async function deletePhanTichKb(id: string): Promise<void> {
  const { error } = await supabase.from('phan_tich_kb').delete().eq('id', id);
  if (error) throw error;
}
