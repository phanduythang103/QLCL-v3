import { supabase } from './supabaseClient';

export interface TyLeDD {
  id: string;
  created_at: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  khoa: string;
  so_nb_noi_tru: number;
  so_dd_chuyen_mon: number;
  ty_so_dd_nb: number;
  so_dd_khong_chuyen_mon: number;
}

export interface TyLeDDInput {
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  khoa: string;
  so_nb_noi_tru: number;
  so_dd_chuyen_mon: number;
  so_dd_khong_chuyen_mon: number;
}

export const fetchTyLeDD = async (): Promise<TyLeDD[]> => {
  const { data, error } = await supabase
    .from('ty_le_dd')
    .select('*')
    .order('ngay_bao_cao', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addTyLeDD = async (input: TyLeDDInput) => {
  const ratio = input.so_nb_noi_tru > 0 ? (input.so_dd_chuyen_mon / input.so_nb_noi_tru) : 0;
  const { data, error } = await supabase
    .from('ty_le_dd')
    .insert([{ ...input, ty_so_dd_nb: ratio }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTyLeDD = async (id: string, input: TyLeDDInput) => {
  const ratio = input.so_nb_noi_tru > 0 ? (input.so_dd_chuyen_mon / input.so_nb_noi_tru) : 0;
  const { data, error } = await supabase
    .from('ty_le_dd')
    .update({ ...input, ty_so_dd_nb: ratio })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTyLeDD = async (id: string) => {
  const { error } = await supabase
    .from('ty_le_dd')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
