import { supabase } from './supabaseClient';
import { EndoscopyMonitoring } from './types';

export const fetchEndoscopyMonitoring = async (): Promise<EndoscopyMonitoring[]> => {
  const { data, error } = await supabase
    .from('gs_ns_dai_tru_trang')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching EndoscopyMonitoring:', error);
    return [];
  }
  return data || [];
};

export const addEndoscopyMonitoring = async (payload: Omit<EndoscopyMonitoring, 'id' | 'created_at' | 'updated_at'>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_ns_dai_tru_trang')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateEndoscopyMonitoring = async (id: string, payload: Partial<EndoscopyMonitoring>): Promise<any> => {
  const { data, error } = await supabase
    .from('gs_ns_dai_tru_trang')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEndoscopyMonitoring = async (id: string): Promise<any> => {
  const { error } = await supabase
    .from('gs_ns_dai_tru_trang')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
