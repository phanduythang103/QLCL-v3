import { supabase } from './supabaseClient';

export interface BcScnyknt {
  id: string;
  created_at?: string;
  ngay_bao_cao: string;
  nguoi_bao_cao: string;
  don_vi: string;
  thoi_gian_xay_ra: string;
  vi_tri_xay_ra: string;
  mo_ta_dien_bien: string;
  hau_qua: string;
  bien_phap_xu_ly: string;
  nguyen_nhan_so_bo: string;
  hinh_anh_minh_chung: string[];
}

export async function fetchBcScnyknt(): Promise<BcScnyknt[]> {
  const { data, error } = await supabase
    .from('bc_scnyknt')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching bc_scnyknt:', error);
    throw error;
  }
  return data || [];
}

export async function addBcScnyknt(report: Omit<BcScnyknt, 'id' | 'created_at'>): Promise<BcScnyknt> {
  const { data, error } = await supabase
    .from('bc_scnyknt')
    .insert([report])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding bc_scnyknt:', error);
    throw error;
  }
  return data;
}

export async function updateBcScnyknt(id: string, updates: Partial<BcScnyknt>): Promise<BcScnyknt> {
  const { data, error } = await supabase
    .from('bc_scnyknt')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating bc_scnyknt:', error);
    throw error;
  }
  return data;
}

export async function deleteBcScnyknt(id: string): Promise<void> {
  const { error } = await supabase
    .from('bc_scnyknt')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting bc_scnyknt:', error);
    throw error;
  }
}

// Function to upload multiple images to 'scyk' bucket
export async function uploadFacilityImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `facility-incidents/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('scyk')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('scyk')
      .getPublicUrl(filePath);

    return data.publicUrl;
  });

  return Promise.all(uploadPromises);
}
