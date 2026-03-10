import { supabase } from './supabaseClient';
import { KtcmTheoTuyen } from './types';

export const fetchKtcmTheoTuyen = async (): Promise<KtcmTheoTuyen[]> => {
  const { data, error } = await supabase
    .from('ktcm_theo_tuyen')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Lỗi khi lấy dữ liệu KTCM theo tuyến:', error);
    throw error;
  }
  return data as KtcmTheoTuyen[];
};

export const addKtcmTheoTuyen = async (record: Omit<KtcmTheoTuyen, 'id' | 'created_at' | 'ty_le'>): Promise<KtcmTheoTuyen> => {
  const { data, error } = await supabase
    .from('ktcm_theo_tuyen')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Lỗi khi thêm mới KTCM theo tuyến:', error);
    throw error;
  }
  return data as KtcmTheoTuyen;
};

export const updateKtcmTheoTuyen = async (id: string, updates: Partial<Omit<KtcmTheoTuyen, 'id' | 'created_at' | 'ty_le'>>): Promise<KtcmTheoTuyen> => {
  const { data, error } = await supabase
    .from('ktcm_theo_tuyen')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Lỗi khi cập nhật KTCM theo tuyến:', error);
    throw error;
  }
  return data as KtcmTheoTuyen;
};

export const deleteKtcmTheoTuyen = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('ktcm_theo_tuyen')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Lỗi khi xóa KTCM theo tuyến:', error);
    throw error;
  }
};
