import { supabase } from './supabaseClient';

export interface ThuVienVb {
  id: string;
  so_hieu_vb: string;
  ten_vb: string;
  loai_vb: string;
  co_quan_ban_hanh: string;
  hieu_luc: string;
  trang_thai: string;
  file_van_ban?: string;
  created_at?: string;
}

// Select tất cả các cột có sẵn trong database
export async function fetchThuVienVb(): Promise<ThuVienVb[]> {
  const { data, error } = await supabase
    .from('thu_vien_vb')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addThuVienVb(record: Partial<ThuVienVb>): Promise<ThuVienVb> {
  const { data, error } = await supabase
    .from('thu_vien_vb')
    .insert([record])
    .select('*');
  if (error) throw error;
  return data?.[0];
}

export async function updateThuVienVb(id: string, updates: Partial<ThuVienVb>): Promise<ThuVienVb> {
  const { data, error } = await supabase
    .from('thu_vien_vb')
    .update(updates)
    .eq('id', id)
    .select('*');
  if (error) throw error;
  return data?.[0];
}

export async function deleteThuVienVb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('thu_vien_vb')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
