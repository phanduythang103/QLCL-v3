import { supabase } from './supabaseClient';

export interface NkvmRecord {
  id?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  khoa_duoc_giam_sat: string;
  ten_nguoi_benh: string;
  nam_sinh?: string;
  ma_hsba?: string;
  ngay_phau_thuat?: string;
  loai_phau_thuat?: string;
  dau_hieu_lam_sang?: string;
  can_thiep?: string;
  ket_qua_vi_sinh?: string;
  phan_loai_nkvm?: string;
  created_at?: string;
}

export async function fetchNkvm(): Promise<NkvmRecord[]> {
  const { data, error } = await supabase
    .from('nkvm')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addNkvm(record: Partial<NkvmRecord>): Promise<NkvmRecord> {
  const { data, error } = await supabase
    .from('nkvm')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateNkvm(id: string, updates: Partial<NkvmRecord>): Promise<NkvmRecord> {
  const { data, error } = await supabase
    .from('nkvm')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteNkvm(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('nkvm')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
