import { supabase } from './supabaseClient';

export interface RcaChecklist {
  id: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  ma_scyk: string;
  c1_dat: boolean;
  c1_ghi_chu: string | null;
  c2_dat: boolean;
  c2_ghi_chu: string | null;
  c3_dat: boolean;
  c3_ghi_chu: string | null;
  c4_dat: boolean;
  c4_ghi_chu: string | null;
  c5_dat: boolean;
  c5_ghi_chu: string | null;
  created_at?: string;
}

export async function fetchRcaChecklist(): Promise<RcaChecklist[]> {
  const { data, error } = await supabase
    .from('rca_checklist')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching rca_checklist:', error);
    throw error;
  }
  return data || [];
}

export async function addRcaChecklist(checklist: Omit<RcaChecklist, 'id' | 'created_at'>): Promise<RcaChecklist> {
  const { data, error } = await supabase
    .from('rca_checklist')
    .insert([checklist])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding rca_checklist:', error);
    throw error;
  }
  return data;
}

export async function updateRcaChecklist(id: string, updates: Partial<RcaChecklist>): Promise<RcaChecklist> {
  const { data, error } = await supabase
    .from('rca_checklist')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating rca_checklist:', error);
    throw error;
  }
  return data;
}

export async function deleteRcaChecklist(id: string): Promise<void> {
  const { error } = await supabase
    .from('rca_checklist')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting rca_checklist:', error);
    throw error;
  }
}
