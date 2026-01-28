import { supabase } from './supabaseClient';
import { cachedFetch, CACHE_KEYS, STATIC_DATA_TTL, invalidateCache } from './utils/cache';

export interface CoQuanBanHanh {
  id: string;
  ten_co_quan: string;
  created_at?: string;
}

// Fetch với caching - dữ liệu danh mục ít thay đổi
export async function fetchCoQuanBanHanh(): Promise<CoQuanBanHanh[]> {
  return cachedFetch(CACHE_KEYS.CO_QUAN_BAN_HANH, async () => {
    const { data, error } = await supabase
      .from('co_quan_ban_hanh')
      .select('id, ten_co_quan, created_at');
    if (error) throw error;
    return data || [];
  }, STATIC_DATA_TTL);
}

export async function addCoQuanBanHanh(record: Partial<CoQuanBanHanh>): Promise<CoQuanBanHanh> {
  const { data, error } = await supabase
    .from('co_quan_ban_hanh')
    .insert([record])
    .select('id, ten_co_quan, created_at');
  if (error) {
    console.error('Supabase Error (addCoQuanBanHanh):', error);
    throw error;
  }
  invalidateCache(CACHE_KEYS.CO_QUAN_BAN_HANH);
  return data?.[0];
}

export async function updateCoQuanBanHanh(id: string, updates: Partial<CoQuanBanHanh>): Promise<CoQuanBanHanh> {
  const { data, error } = await supabase
    .from('co_quan_ban_hanh')
    .update(updates)
    .eq('id', id)
    .select('id, ten_co_quan, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.CO_QUAN_BAN_HANH);
  return data?.[0];
}

export async function deleteCoQuanBanHanh(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('co_quan_ban_hanh')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.CO_QUAN_BAN_HANH);
  return true;
}
