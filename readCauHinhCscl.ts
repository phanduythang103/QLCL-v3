import { supabase } from './supabaseClient';
import { IndicatorConfig } from './types';

export async function fetchIndicatorConfigs(): Promise<IndicatorConfig[]> {
  const { data, error } = await supabase
    .from('cau_hinh_cscl')
    .select('*')
    .order('ten_chi_so', { ascending: true });
  
  if (error) {
    console.error('Error fetching cau_hinh_cscl:', error);
    throw error;
  }
  return data || [];
}

export async function addIndicatorConfig(config: Partial<IndicatorConfig>): Promise<IndicatorConfig> {
  const { data, error } = await supabase
    .from('cau_hinh_cscl')
    .insert([config])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding cau_hinh_cscl:', error);
    throw error;
  }
  return data;
}

export async function updateIndicatorConfig(id: string, config: Partial<IndicatorConfig>): Promise<IndicatorConfig> {
  const { data, error } = await supabase
    .from('cau_hinh_cscl')
    .update(config)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating cau_hinh_cscl:', error);
    throw error;
  }
  return data;
}

export async function deleteIndicatorConfig(id: string): Promise<void> {
  const { error } = await supabase
    .from('cau_hinh_cscl')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting cau_hinh_cscl:', error);
    throw error;
  }
}
