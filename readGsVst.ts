import { supabase } from './supabaseClient';
import { GsVst } from './types';

export const fetchGsVst = async () => {
  const { data, error } = await supabase
    .from('gs_vst')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) throw error;
  return data as GsVst[];
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

export const uploadVstImage = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('vst')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('vst')
    .getPublicUrl(filePath);

  return publicUrl;
};
