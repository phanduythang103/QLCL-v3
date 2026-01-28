import { supabase } from './supabaseClient';
import { cachedFetch, CACHE_KEYS, STATIC_DATA_TTL, invalidateCache } from './utils/cache';

export interface DmChucVu {
  id: string;
  ten_chuc_vu: string;
  created_at?: string;
}

// Fetch với caching - dữ liệu danh mục ít thay đổi
export async function fetchDmChucVu(): Promise<DmChucVu[]> {
  return cachedFetch(CACHE_KEYS.DM_CHUC_VU, async () => {
    const { data, error } = await supabase
      .from('dm_chuc_vu')
      .select('id, ten_chuc_vu, created_at');
    if (error) throw error;
    return data || [];
  }, STATIC_DATA_TTL);
}

export async function addDmChucVu(record: Partial<DmChucVu>): Promise<DmChucVu> {
  const { data, error } = await supabase
    .from('dm_chuc_vu')
    .insert([record])
    .select('id, ten_chuc_vu, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_CHUC_VU);
  return data?.[0];
}

export async function updateDmChucVu(id: string, updates: Partial<DmChucVu>): Promise<DmChucVu> {
  const { data, error } = await supabase
    .from('dm_chuc_vu')
    .update(updates)
    .eq('id', id)
    .select('id, ten_chuc_vu, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_CHUC_VU);
  return data?.[0];
}

export async function deleteDmChucVu(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dm_chuc_vu')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_CHUC_VU);
  return true;
}
