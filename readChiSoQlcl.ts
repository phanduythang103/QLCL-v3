import { supabase } from './supabaseClient';

export interface ChiSoQlcl {
  id?: number;
  ten_chi_so: string;
  nhom_chi_so?: string;
  don_vi_tinh?: string;
  gia_tri?: number;
  muc_tieu?: number;
  gia_tri_max?: number;
  thang_nam?: string;
  khoa_phong?: string;
  xu_huong?: string;
  mau_hien_thi?: string;
  ghi_chu?: string;
  trang_thai?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchChiSoQlcl(): Promise<ChiSoQlcl[]> {
  const { data, error } = await supabase
    .from('chi_so_qlcl')
    .select('*')
    .order('nhom_chi_so', { ascending: true })
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching chi_so_qlcl:', error);
    throw error;
  }
  return data || [];
}

export async function fetchChiSoByNhom(nhomChiSo: string): Promise<ChiSoQlcl[]> {
  const { data, error } = await supabase
    .from('chi_so_qlcl')
    .select('*')
    .eq('nhom_chi_so', nhomChiSo)
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching chi_so_qlcl by nhom:', error);
    throw error;
  }
  return data || [];
}

export async function fetchChiSoByThangNam(thangNam: string): Promise<ChiSoQlcl[]> {
  const { data, error } = await supabase
    .from('chi_so_qlcl')
    .select('*')
    .eq('thang_nam', thangNam)
    .order('nhom_chi_so', { ascending: true })
    .order('id', { ascending: true });
  
  if (error) {
    console.error('Error fetching chi_so_qlcl by thang_nam:', error);
    throw error;
  }
  return data || [];
}

export async function addChiSoQlcl(chiSo: ChiSoQlcl): Promise<ChiSoQlcl> {
  const { data, error } = await supabase
    .from('chi_so_qlcl')
    .insert([chiSo])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding chi_so_qlcl:', error);
    throw error;
  }
  return data;
}

export async function updateChiSoQlcl(id: number, chiSo: Partial<ChiSoQlcl>): Promise<ChiSoQlcl> {
  const { data, error } = await supabase
    .from('chi_so_qlcl')
    .update({ ...chiSo, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating chi_so_qlcl:', error);
    throw error;
  }
  return data;
}

export async function deleteChiSoQlcl(id: number): Promise<void> {
  const { error } = await supabase
    .from('chi_so_qlcl')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting chi_so_qlcl:', error);
    throw error;
  }
}
