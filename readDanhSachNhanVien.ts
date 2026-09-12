import { supabase } from './supabaseClient';

export type DoiTuongNhanVien = 'Điều dưỡng' | 'Bác sỹ';

export interface DanhSachNhanVien {
  id: string;
  khoa_don_vi?: string | null;
  ho_ten: string;
  doi_tuong: string; // 'Điều dưỡng' | 'Bác sỹ'
  created_at?: string;
}

export async function fetchDanhSachNhanVien(): Promise<DanhSachNhanVien[]> {
  const { data, error } = await supabase
    .from('danh_sach_nhan_vien')
    .select('id, khoa_don_vi, ho_ten, doi_tuong, created_at');
  if (error) throw error;

  return (data || []).sort((a: any, b: any) =>
    (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi', { sensitivity: 'base' })
  );
}

export async function addDanhSachNhanVien(record: Partial<DanhSachNhanVien>): Promise<DanhSachNhanVien> {
  const { data, error } = await supabase
    .from('danh_sach_nhan_vien')
    .insert([record])
    .select('id, khoa_don_vi, ho_ten, doi_tuong, created_at');
  if (error) throw error;
  return data?.[0];
}

export async function updateDanhSachNhanVien(id: string, updates: Partial<DanhSachNhanVien>): Promise<DanhSachNhanVien> {
  const { data, error } = await supabase
    .from('danh_sach_nhan_vien')
    .update(updates)
    .eq('id', id)
    .select('id, khoa_don_vi, ho_ten, doi_tuong, created_at');
  if (error) throw error;
  return data?.[0];
}

export async function deleteDanhSachNhanVien(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('danh_sach_nhan_vien')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
