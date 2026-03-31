import { supabase } from './supabaseClient';

export interface Data83tc {
    id?: number;
    phan: string | null;
    chuong: string | null;
    tieu_chi: string | null;
    muc: string | null;
    ma_tieu_muc: string | null;
    tieu_muc: string | null;
    phu_trach: string | null;
    don_vi_phoi_hop: string | null;
    created_at?: string;
}

const SELECT_FIELDS = '*';

/**
 * Fetch all items from data83tc table
 */
export async function fetchData83tc(): Promise<Data83tc[]> {
    const { data, error } = await supabase
        .from('data83tc')
        .select(SELECT_FIELDS)
        .order('id', { ascending: true });
    if (error) throw error;
    return data || [];
}

/**
 * Update a single record
 */
export async function updateData83tc(id: number, updates: Partial<Data83tc>): Promise<Data83tc> {
    const { data, error } = await supabase
        .from('data83tc')
        .update(updates)
        .eq('id', id)
        .select(SELECT_FIELDS);
    if (error) throw error;
    return data?.[0];
}

/**
 * Perform a batch update on multiple record IDs
 */
export async function batchUpdateData83tc(ids: number[], updates: Partial<Data83tc>): Promise<boolean> {
    if (ids.length === 0) return true;
    
    // Check Auth State
    const { data: { user } } = await supabase.auth.getUser();
    console.log('--- Batch Update Request ---');
    console.log('Current User ID:', user?.id || 'NOT LOGGED IN');
    console.log('IDs:', ids);
    console.log('Updates:', updates);

    const { data, error, count } = await supabase
        .from('data83tc')
        .update(updates, { count: 'exact' })
        .in('id', ids)
        .select();

    if (error) {
        console.error('❌ Supabase Batch Update Error:', error.message, error.details);
        throw error;
    }

    console.log('✅ Batch Update Success. Rows affected:', data?.length || 0);
    return true;
}

/**
 * Bulk insert records (optional, for Excel import)
 */
export async function addData83tcBulk(records: Partial<Data83tc>[]): Promise<boolean> {
    if (records.length === 0) return true;
    const { error } = await supabase
        .from('data83tc')
        .insert(records);
    if (error) throw error;
    return true;
}
