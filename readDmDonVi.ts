import { supabase } from './supabaseClient';
import { cachedFetch, CACHE_KEYS, STATIC_DATA_TTL, invalidateCache } from './utils/cache';

export interface DmDonVi {
  id: string;
  ma_don_vi: string;
  ten_don_vi: string;
  khoi?: string;
  created_at?: string;
}

// Fetch với caching - dữ liệu danh mục ít thay đổi
export async function fetchDmDonVi(): Promise<DmDonVi[]> {
  return cachedFetch(CACHE_KEYS.DM_DON_VI, async () => {
    const { data, error } = await supabase
      .from('dm_don_vi')
      .select('id, ma_don_vi, ten_don_vi, khoi, created_at');
    if (error) throw error;

    // Sort using natural/numeric sorting for codes like A1, A2, A10
    const sorted = (data || []).sort((a, b) => {
      return a.ma_don_vi.localeCompare(b.ma_don_vi, undefined, {
        numeric: true,
        sensitivity: 'base'
      });
    });

    return sorted;
  }, STATIC_DATA_TTL);
}

export async function addDmDonVi(record: Partial<DmDonVi>): Promise<DmDonVi> {
  const { data, error } = await supabase
    .from('dm_don_vi')
    .insert([record])
    .select('id, ma_don_vi, ten_don_vi, khoi, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_DON_VI);
  return data?.[0];
}

export async function updateDmDonVi(id: string, updates: Partial<DmDonVi>): Promise<DmDonVi> {
  const { data, error } = await supabase
    .from('dm_don_vi')
    .update(updates)
    .eq('id', id)
    .select('id, ma_don_vi, ten_don_vi, khoi, created_at');
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_DON_VI);
  return data?.[0];
}

export async function deleteDmDonVi(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dm_don_vi')
    .delete()
    .eq('id', id);
  if (error) throw error;
  invalidateCache(CACHE_KEYS.DM_DON_VI);
  return true;
}
