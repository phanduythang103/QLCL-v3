import { supabase } from './supabaseClient';
import { BronchoscopyMonitoring } from './types';

export const fetchBronchoscopyMonitoring = async (): Promise<BronchoscopyMonitoring[]> => {
  const { data, error } = await supabase
    .from('gs_nspq_sinh_thiet')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching BronchoscopyMonitoring:', error);
    return [];
  }
  return data || [];
};

export const addBronchoscopyMonitoring = async (payload: Omit<BronchoscopyMonitoring, 'id' | 'created_at' | 'updated_at'>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_nspq_sinh_thiet')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBronchoscopyMonitoring = async (id: string, payload: Partial<BronchoscopyMonitoring>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_nspq_sinh_thiet')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBronchoscopyMonitoring = async (id: string): Promise<any> => {
  const { error } = await supabase
    .from('gs_nspq_sinh_thiet')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
