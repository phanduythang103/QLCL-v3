import { supabase } from './supabaseClient';
import { SurgerySafety } from './types';

export const fetchSurgerySafety = async () => {
  const { data, error } = await supabase
    .from('giam_sat_atpt')
    .select('*')
    .order('ngay_giam_sat', { ascending: false });

  if (error) throw error;
  return data as SurgerySafety[];
};

export const addSurgerySafety = async (item: SurgerySafety) => {
  const { data, error } = await supabase
    .from('giam_sat_atpt')
    .insert([item])
    .select();

  if (error) throw error;
  return data?.[0] as SurgerySafety;
};

export const updateSurgerySafety = async (id: string, item: Partial<SurgerySafety>) => {
  const { data, error } = await supabase
    .from('giam_sat_atpt')
    .update(item)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0] as SurgerySafety;
};

export const deleteSurgerySafety = async (id: string) => {
  const { error } = await supabase
    .from('giam_sat_atpt')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
