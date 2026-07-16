import { supabase } from './supabaseClient';

export interface GiamSatChungItem {
  id: string;
  label: string;
  is_pass: boolean;
  note: string;
}

export interface GiamSatChung {
  id?: string;
  created_at?: string;
  updated_at?: string;

  ngay_giam_sat: string;
  nguoi_gs: string;
  khoa_gs: string;
  doi_tuong_gs?: string;

  noi_dung_gs: GiamSatChungItem[];

  ket_luan?: string;
  hinh_anh?: string[];

  tong_dat?: number;
  tong_muc?: number;
  ty_le?: number;
}

const pickValidFields = (record: any) => {
  const fields = [
    'ngay_giam_sat', 'nguoi_gs', 'khoa_gs', 'doi_tuong_gs', 'noi_dung_gs',
    'ket_luan', 'hinh_anh', 'tong_dat', 'tong_muc', 'ty_le'
  ];
  const result: any = {};
  fields.forEach(f => {
    if (record[f] !== undefined) result[f] = record[f];
  });
  return result;
};

const omitField = (record: any, field: string) => {
  const next = { ...record };
  delete next[field];
  return next;
};

const isMissingColumnError = (error: any, column: string) => {
  const message = [error?.code, error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return message.includes(column.toLowerCase()) && (
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('pgrst204') ||
    message.includes('42703')
  );
};

export async function fetchGsChung(): Promise<GiamSatChung[]> {
  const { data, error } = await supabase
    .from('giam_sat_chung')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('Error fetching gs_chung:', error);
    throw error;
  }
  return data || [];
}

export async function addGsChung(record: GiamSatChung): Promise<GiamSatChung> {
  const cleanData = pickValidFields(record);
  let { data, error } = await supabase
    .from('giam_sat_chung')
    .insert([cleanData])
    .select()
    .single();

  if (error && isMissingColumnError(error, 'doi_tuong_gs')) {
    ({ data, error } = await supabase
      .from('giam_sat_chung')
      .insert([omitField(cleanData, 'doi_tuong_gs')])
      .select()
      .single());
  }

  if (error) {
    console.error('Error adding gs_chung:', error);
    throw error;
  }
  return data;
}

export async function updateGsChung(id: string, record: Partial<GiamSatChung>): Promise<GiamSatChung> {
  const cleanData = pickValidFields(record);
  let { data, error } = await supabase
    .from('giam_sat_chung')
    .update(cleanData)
    .eq('id', id)
    .select()
    .single();

  if (error && isMissingColumnError(error, 'doi_tuong_gs')) {
    ({ data, error } = await supabase
      .from('giam_sat_chung')
      .update(omitField(cleanData, 'doi_tuong_gs'))
      .eq('id', id)
      .select()
      .single());
  }

  if (error) {
    console.error('Error updating gs_chung:', error);
    throw error;
  }
  return data;
}

export async function deleteGsChung(id: string): Promise<void> {
  const { error } = await supabase
    .from('giam_sat_chung')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting gs_chung:', error);
    throw error;
  }
}

import { compressFile } from './utils/compression';

export async function uploadGsChungImage(file: File): Promise<string> {
  // Compress before upload
  const compressedFile = await compressFile(file);

  const ext = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `general_monitoring/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gs_hsba')
    .upload(filePath, compressedFile, { cacheControl: '31536000', upsert: false });

  if (uploadError) {
    console.error('Error uploading gs_chung image:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from('gs_hsba').getPublicUrl(filePath);
  return data.publicUrl;
}
