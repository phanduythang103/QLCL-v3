import { supabase } from './supabaseClient';
import { DrugMonitoring } from './types';

export const fetchGsDrug = async () => {
  const { data, error } = await supabase
    .from('giam_sat_drug')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) throw error;
  return data as DrugMonitoring[];
};

export const addGsDrug = async (item: DrugMonitoring) => {
  const { data, error } = await supabase
    .from('giam_sat_drug')
    .insert([item])
    .select();

  if (error) throw error;
  return data?.[0] as DrugMonitoring;
};

export const updateGsDrug = async (id: string, item: Partial<DrugMonitoring>) => {
  const { data, error } = await supabase
    .from('giam_sat_drug')
    .update(item)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0] as DrugMonitoring;
};

export const deleteGsDrug = async (id: string) => {
  const { error } = await supabase
    .from('giam_sat_drug')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

import { compressFile } from './utils/compression';

export const uploadDrugImage = async (file: File) => {
  const compressedFile = await compressFile(file);
  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `drug_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('giam_sat')
    .upload(filePath, compressedFile, { cacheControl: '31536000' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('giam_sat')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
