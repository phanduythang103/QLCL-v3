import { supabase } from './supabaseClient';

export interface LichSuBaoCao {
  id?: number;
  ten_bao_cao: string;
  loai_bao_cao?: string;
  ky_bao_cao?: string;
  nguoi_tao?: string;
  ngay_tao?: string;
  duong_dan?: string;
  trang_thai?: string;
  ghi_chu?: string;
  created_at?: string;
}

export async function fetchLichSuBaoCao(): Promise<LichSuBaoCao[]> {
  const { data, error } = await supabase
    .from('lich_su_bao_cao')
    .select('*')
    .order('ngay_tao', { ascending: false });
  
  if (error) {
    console.error('Error fetching lich_su_bao_cao:', error);
    throw error;
  }
  return data || [];
}

export async function addLichSuBaoCao(item: LichSuBaoCao): Promise<LichSuBaoCao> {
  const { data, error } = await supabase
    .from('lich_su_bao_cao')
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding lich_su_bao_cao:', error);
    throw error;
  }
  return data;
}

export async function deleteLichSuBaoCao(id: number): Promise<void> {
  const { error } = await supabase
    .from('lich_su_bao_cao')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting lich_su_bao_cao:', error);
    throw error;
  }
}
