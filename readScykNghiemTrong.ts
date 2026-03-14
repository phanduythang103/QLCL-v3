import { supabase } from './supabaseClient';

export interface ScykNghiemTrong {
  id: string;
  ma_scyk: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  ngay_xay_ra: string;
  don_vi: string;
  tom_tat_noi_dung_su_co: string;
  phan_loai_nc3: string;
  hau_qua_doi_voi_nguoi_benh: string;
  trang_thai_xu_ly: 'Đang RCA' | 'Đã kết luận';
  created_at?: string;
}

export async function fetchScykNghiemTrong(): Promise<ScykNghiemTrong[]> {
  const { data, error } = await supabase
    .from('scyk_nghiem_trong')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching scyk_nghiem_trong:', error);
    throw error;
  }
  return data || [];
}

export async function addScykNghiemTrong(report: Omit<ScykNghiemTrong, 'id' | 'created_at'>): Promise<ScykNghiemTrong> {
  const { data, error } = await supabase
    .from('scyk_nghiem_trong')
    .insert([report])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding scyk_nghiem_trong:', error);
    throw error;
  }
  return data;
}

export async function updateScykNghiemTrong(id: string, updates: Partial<ScykNghiemTrong>): Promise<ScykNghiemTrong> {
  const { data, error } = await supabase
    .from('scyk_nghiem_trong')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating scyk_nghiem_trong:', error);
    throw error;
  }
  return data;
}

export async function deleteScykNghiemTrong(id: string): Promise<void> {
  const { error } = await supabase
    .from('scyk_nghiem_trong')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting scyk_nghiem_trong:', error);
    throw error;
  }
}
