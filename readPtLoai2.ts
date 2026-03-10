import { supabase } from './supabaseClient';
import { PtLoai2 } from './types';

export const fetchPtLoai2 = async (): Promise<PtLoai2[]> => {
  const { data, error } = await supabase
    .from('pt_loai_2')
    .select('*')
    .order('ngay_bao_cao', { ascending: false });

  if (error) {
    console.error('Error fetching PT Loai 2:', error);
    throw error;
  }
  return data as PtLoai2[];
};

export const addPtLoai2 = async (ptData: Partial<PtLoai2>) => {
  const { data, error } = await supabase
    .from('pt_loai_2')
    .insert([ptData])
    .select();

  if (error) {
    console.error('Error adding PT Loai 2:', error);
    throw error;
  }
  return data;
};

export const updatePtLoai2 = async (id: string, ptData: Partial<PtLoai2>) => {
  const { data, error } = await supabase
    .from('pt_loai_2')
    .update(ptData)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating PT Loai 2:', error);
    throw error;
  }
  return data;
};

export const deletePtLoai2 = async (id: string) => {
  const { data, error } = await supabase
    .from('pt_loai_2')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting PT Loai 2:', error);
    throw error;
  }
  return data;
};
