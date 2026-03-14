import { supabase } from './supabaseClient';

export interface Scnyknt {
  id: string;
  created_at?: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  vi_tri_giam_sat: string;
  c1_dat: boolean;
  c1_ghi_chu?: string;
  c2_dat: boolean;
  c2_ghi_chu?: string;
  c3_dat: boolean;
  c3_ghi_chu?: string;
  c4_dat: boolean;
  c4_ghi_chu?: string;
  c5_dat: boolean;
  c5_ghi_chu?: string;
  c6_dat: boolean;
  c6_ghi_chu?: string;
}

export async function fetchScnyknt(): Promise<Scnyknt[]> {
  const { data, error } = await supabase
    .from('scnyknt')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching scnyknt:', error);
    throw error;
  }
  return data || [];
}

export async function addScnyknt(item: Omit<Scnyknt, 'id' | 'created_at'>): Promise<Scnyknt> {
  const { data, error } = await supabase
    .from('scnyknt')
    .insert([item])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding scnyknt:', error);
    throw error;
  }
  return data;
}

export async function updateScnyknt(id: string, updates: Partial<Scnyknt>): Promise<Scnyknt> {
  const { data, error } = await supabase
    .from('scnyknt')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating scnyknt:', error);
    throw error;
  }
  return data;
}

export async function deleteScnyknt(id: string): Promise<void> {
  const { error } = await supabase
    .from('scnyknt')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting scnyknt:', error);
    throw error;
  }
}
