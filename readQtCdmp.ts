import { supabase } from './supabaseClient';
import { PleuralAspirationMonitoring } from './types';

export const fetchQtCdmp = async (): Promise<PleuralAspirationMonitoring[]> => {
  const { data, error } = await supabase
    .from('qt_cdmp')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PleuralAspirationMonitoring[];
};

export const addQtCdmp = async (record: Partial<PleuralAspirationMonitoring>) => {
  const { data, error } = await supabase
    .from('qt_cdmp')
    .insert([record])
    .select();

  if (error) throw error;
  return data;
};

export const updateQtCdmp = async (id: string, record: Partial<PleuralAspirationMonitoring>) => {
  const { data, error } = await supabase
    .from('qt_cdmp')
    .update(record)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

export const deleteQtCdmp = async (id: string) => {
  const { error } = await supabase
    .from('qt_cdmp')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
