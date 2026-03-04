import { supabase } from './supabaseClient';
import { BcCqy } from './types';

export const fetchBcCqy = async () => {
    const { data, error } = await supabase
        .from('bc_cqy')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as BcCqy[];
};

export const addBcCqy = async (item: Omit<BcCqy, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('bc_cqy')
        .insert([item])
        .select();
    if (error) throw error;
    return data?.[0] as BcCqy;
};

export const updateBcCqy = async (id: string, item: Partial<BcCqy>) => {
    const { data, error } = await supabase
        .from('bc_cqy')
        .update(item)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data?.[0] as BcCqy;
};

export const deleteBcCqy = async (id: string) => {
    const { error } = await supabase
        .from('bc_cqy')
        .delete()
        .eq('id', id);
    if (error) throw error;
};
