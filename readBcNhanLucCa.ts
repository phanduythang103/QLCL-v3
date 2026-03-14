import { supabase } from './supabaseClient';

export interface BcNhanLucCa {
  id?: string;
  created_at?: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  khoa_bao_cao: string;
  
  // Ca sáng
  sang_dd: number;
  sang_nb: number;
  sang_ty_le: number;
  sang_an_toan: string;
  
  // Ca chiều
  chieu_dd: number;
  chieu_nb: number;
  chieu_ty_le: number;
  chieu_an_toan: string;
  
  // Ca đêm
  dem_dd: number;
  dem_nb: number;
  dem_ty_le: number;
  dem_an_toan: string;
}

export const fetchBcNhanLucCa = async () => {
  const { data, error } = await supabase
    .from('bc_nhan_luc_ca')
    .select('*')
    .order('ngay_bao_cao', { ascending: false });

  if (error) throw error;
  return data as BcNhanLucCa[];
};

export const addBcNhanLucCa = async (item: BcNhanLucCa) => {
  const { data, error } = await supabase
    .from('bc_nhan_luc_ca')
    .insert([item])
    .select();

  if (error) throw error;
  return data?.[0] as BcNhanLucCa;
};

export const updateBcNhanLucCa = async (id: string, item: Partial<BcNhanLucCa>) => {
  const { data, error } = await supabase
    .from('bc_nhan_luc_ca')
    .update(item)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0] as BcNhanLucCa;
};

export const deleteBcNhanLucCa = async (id: string) => {
  const { error } = await supabase
    .from('bc_nhan_luc_ca')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
