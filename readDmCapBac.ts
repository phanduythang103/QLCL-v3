import { supabase } from './supabaseClient';

export async function fetchDmCapBac() {
    const { data, error } = await supabase
        .from('dm_cap_bac')
        .select('*')
        .order('thu_tu', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function addDmCapBac(record: { ten_cap_bac: string; thu_tu?: number }) {
    const { data, error } = await supabase
        .from('dm_cap_bac')
        .insert([record])
        .select();
    if (error) throw error;
    return data?.[0];
}

export async function updateDmCapBac(id: string, updates: { ten_cap_bac?: string; thu_tu?: number }) {
    const { data, error } = await supabase
        .from('dm_cap_bac')
        .update(updates)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data?.[0];
}

export async function deleteDmCapBac(id: string) {
    const { error } = await supabase
        .from('dm_cap_bac')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
}
