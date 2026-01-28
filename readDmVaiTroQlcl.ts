import { supabase } from './supabaseClient';
import { cachedFetch, CACHE_KEYS, STATIC_DATA_TTL, invalidateCache } from './utils/cache';

export interface DmVaiTroQlcl {
  id: string;
  vai_tro: string;
  created_at?: string;
}

// Fetch với caching - dữ liệu danh mục ít thay đổi
export async function fetchDmVaiTroQlcl(): Promise<DmVaiTroQlcl[]> {
  return cachedFetch(CACHE_KEYS.DM_VAI_TRO_QLCL, async () => {
    const { data, error } = await supabase
      .from('dm_vai_tro_qlcl')
      .select('id, vai_tro, created_at');
    if (error) throw error;
    return data || [];
  }, STATIC_DATA_TTL);
}

export async function addDmVaiTroQlcl(record: Partial<DmVaiTroQlcl>): Promise<DmVaiTroQlcl> {
  const { data, error } = await supabase
    .from('dm_vai_tro_qlcl')
    .insert([record])
    .select('id, vai_tro, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_VAI_TRO_QLCL);
  return data?.[0];
}

export async function updateDmVaiTroQlcl(id: string, updates: Partial<DmVaiTroQlcl>): Promise<DmVaiTroQlcl> {
  const { data, error } = await supabase
    .from('dm_vai_tro_qlcl')
    .update(updates)
    .eq('id', id)
    .select('id, vai_tro, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_VAI_TRO_QLCL);
  return data?.[0];
}

export async function deleteDmVaiTroQlcl(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dm_vai_tro_qlcl')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_VAI_TRO_QLCL);
  return true;
}
