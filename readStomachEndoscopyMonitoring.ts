import { supabase } from './supabaseClient';
import { StomachEndoscopyMonitoring } from './types';

export const fetchStomachEndoscopyMonitoring = async (): Promise<StomachEndoscopyMonitoring[]> => {
  const { data, error } = await supabase
    .from('gs_ns_thuc_quan_da_day')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching StomachEndoscopyMonitoring:', error);
    return [];
  }
  return data || [];
};

export const addStomachEndoscopyMonitoring = async (payload: Omit<StomachEndoscopyMonitoring, 'id' | 'created_at' | 'updated_at'>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_ns_thuc_quan_da_day')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStomachEndoscopyMonitoring = async (id: string, payload: Partial<StomachEndoscopyMonitoring>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_ns_thuc_quan_da_day')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStomachEndoscopyMonitoring = async (id: string): Promise<any> => {
  const { error } = await supabase
    .from('gs_ns_thuc_quan_da_day')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
