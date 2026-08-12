import { supabase } from './supabaseClient';
import { GiamSatNdnb } from './types';
import { compressFile } from './utils/compression';

export async function fetchGiamSatNdnb(): Promise<GiamSatNdnb[]> {
  const { data, error } = await supabase
    .from('gs_ndnb')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('Error fetching gs_ndnb:', error);
    throw error;
  }
  return data || [];
}

export async function addGiamSatNdnb(record: Omit<GiamSatNdnb, 'id' | 'created_at' | 'updated_at'>): Promise<GiamSatNdnb> {
  const { data, error } = await supabase
    .from('gs_ndnb')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Error adding gs_ndnb:', error);
    throw error;
  }
  return data;
}

export async function updateGiamSatNdnb(id: string, record: Partial<GiamSatNdnb>): Promise<GiamSatNdnb> {
  const { data, error } = await supabase
    .from('gs_ndnb')
    .update({ ...record, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating gs_ndnb:', error);
    throw error;
  }
  return data;
}

export async function deleteGiamSatNdnb(id: string): Promise<void> {
  const { error } = await supabase
    .from('gs_ndnb')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting gs_ndnb:', error);
    throw error;
  }
}

export async function uploadNdnbImage(file: File): Promise<string> {
  const compressedFile = await compressFile(file);
  const ext = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `ndnb_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('giam_sat')
    .upload(filePath, compressedFile, { cacheControl: '31536000', upsert: false });

  if (uploadError) {
    console.error('Error uploading NDNB image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('giam_sat').getPublicUrl(filePath);
  return data.publicUrl;
}
