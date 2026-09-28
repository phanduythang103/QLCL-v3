import { supabase } from './supabaseClient';
import { GsVst } from './types';
import { fetchAllRows } from './utils/fetchAllRows';

export const fetchGsVst = async () => {
  // Phân trang: bảng sắp chạm mốc 1.000 phiếu, gọi 1 lượt sẽ bị cắt bớt âm thầm
  return await fetchAllRows<GsVst>('gs_vst', { orderBy: 'ngay_giam_sat' });
};

export const addGsVst = async (item: GsVst) => {
  const { data, error } = await supabase
    .from('gs_vst')
    .insert([item])
    .select();

  if (error) throw error;
  return data?.[0] as GsVst;
};

export const updateGsVst = async (id: string, item: Partial<GsVst>) => {
  const { data, error } = await supabase
    .from('gs_vst')
    .update(item)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0] as GsVst;
};

export const deleteGsVst = async (id: string) => {
  const { error } = await supabase
    .from('gs_vst')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

import { compressFile } from './utils/compression';

export const uploadVstImage = async (file: File) => {
  const compressedFile = await compressFile(file);
  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `hand_hygiene/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vst')
    .upload(filePath, compressedFile, { cacheControl: '31536000' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('vst')
    .getPublicUrl(filePath);

  return publicUrl;
};
