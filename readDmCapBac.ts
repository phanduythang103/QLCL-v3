import { supabase } from './supabaseClient';
import { cachedFetch, CACHE_KEYS, STATIC_DATA_TTL, invalidateCache } from './utils/cache';

export interface DmCapBac {
  id: string;
  ten_cap_bac: string;
  thu_tu?: number;
}

// Fetch với caching - dữ liệu danh mục ít thay đổi
export async function fetchDmCapBac(): Promise<DmCapBac[]> {
  return cachedFetch(CACHE_KEYS.DM_CAP_BAC, async () => {
    const { data, error } = await supabase
      .from('dm_cap_bac')
      .select('id, ten_cap_bac, thu_tu')
      .order('thu_tu', { ascending: true });

    if (error) throw error;
    return data || [];
  }, STATIC_DATA_TTL);
}

export async function addDmCapBac(record: { ten_cap_bac: string; thu_tu?: number }): Promise<DmCapBac> {
    const { data, error } = await supabase
        .from('dm_cap_bac')
        .insert([record])
        .select('id, ten_cap_bac, thu_tu');
    if (error) throw error;
    invalidateCache(CACHE_KEYS.DM_CAP_BAC);
    return data?.[0];
}

export async function updateDmCapBac(id: string, updates: { ten_cap_bac?: string; thu_tu?: number }): Promise<DmCapBac> {
    const { data, error } = await supabase
        .from('dm_cap_bac')
        .update(updates)
        .eq('id', id)
        .select('id, ten_cap_bac, thu_tu');
    if (error) throw error;
    invalidateCache(CACHE_KEYS.DM_CAP_BAC);
    return data?.[0];
}

export async function deleteDmCapBac(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('dm_cap_bac')
        .delete()
        .eq('id', id);
    if (error) throw error;
    invalidateCache(CACHE_KEYS.DM_CAP_BAC);
    return true;
}
