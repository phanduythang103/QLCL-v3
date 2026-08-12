import { supabase } from './supabaseClient';
import { EpiduralInjectionMonitoring } from './types';

export const fetchEpiduralInjectionMonitoring = async (): Promise<EpiduralInjectionMonitoring[]> => {
  const { data, error } = await supabase
    .from('gs_tiem_nmc')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching EpiduralInjectionMonitoring:', error);
    return [];
  }
  return data || [];
};

export const addEpiduralInjectionMonitoring = async (payload: Omit<EpiduralInjectionMonitoring, 'id' | 'created_at' | 'updated_at'>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_tiem_nmc')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEpiduralInjectionMonitoring = async (id: string, payload: Partial<EpiduralInjectionMonitoring>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_tiem_nmc')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEpiduralInjectionMonitoring = async (id: string): Promise<any> => {
  const { error } = await supabase
    .from('gs_tiem_nmc')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
