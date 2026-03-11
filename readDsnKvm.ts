import { supabase } from './supabaseClient';

export interface DsnKvmRecord {
  id?: string;
  ngay_bao_cao: string;
  khoa: string;
  tong_so_ca_pt: number;
  so_ca_nkvm_nong: number;
  so_ca_nkvm_sau: number;
  so_ca_nkvm_co_quan: number;
  tong_so_ca_nkvm?: number;
  ty_le_nkvm?: number;
  created_at?: string;
}

export async function fetchDsnKvm(): Promise<DsnKvmRecord[]> {
  const { data, error } = await supabase
    .from('dsnkvm')
    .select('*')
    .order('ngay_bao_cao', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addDsnKvm(record: Partial<DsnKvmRecord>): Promise<DsnKvmRecord> {
  const { data, error } = await supabase
    .from('dsnkvm')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateDsnKvm(id: string, updates: Partial<DsnKvmRecord>): Promise<DsnKvmRecord> {
  const { data, error } = await supabase
    .from('dsnkvm')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteDsnKvm(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dsnkvm')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
