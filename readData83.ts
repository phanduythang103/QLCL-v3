import { supabase } from './supabaseClient';

export interface Data83 {
    id?: number;
    phan?: string;
    chuong?: string;
    tieu_chi?: string;
    muc?: string;
    ma_tieu_muc?: string;
    tieu_muc?: string;
    nhom?: string;
    created_at?: string;
    updated_at?: string;
}

export async function fetchData83(): Promise<Data83[]> {
    const { data, error } = await supabase
        .from('data83')
        .select('id, phan, chuong, tieu_chi, muc, ma_tieu_muc, tieu_muc, nhom, created_at, updated_at')
        .order('ma_tieu_muc', { ascending: true })
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching data83:', error);
        throw error;
    }
    return data || [];
}

export async function fetchData83ByMaTieuMuc(maTieuMuc: string): Promise<Data83[]> {
    const { data, error } = await supabase
        .from('data83')
        .select('*')
        .eq('ma_tieu_muc', maTieuMuc)
        .order('id', { ascending: true });

    if (error) {
        console.error('Error fetching data83 by ma_tieu_muc:', error);
        throw error;
    }
    return data || [];
}

export async function addData83(item: Data83): Promise<Data83> {
    const { data, error } = await supabase
        .from('data83')
        .insert([item])
        .select()
        .single();

    if (error) {
        console.error('Error adding data83:', error);
        throw error;
    }
    return data;
}

export async function addData83Bulk(items: Data83[]): Promise<Data83[]> {
    const cleanedItems = items.map(item => {
        const { id, ...rest } = item;
        return rest;
    });

    const { data, error } = await supabase
        .from('data83')
        .insert(cleanedItems)
        .select();

    if (error) {
        console.error('Chi tiết lỗi Supabase (data83):', error.message, error.details, error.hint);
        throw error;
    }
    return data || [];
}

export async function updateData83(id: number, item: Partial<Data83>): Promise<Data83> {
    const { data, error } = await supabase
        .from('data83')
        .update({ ...item, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating data83:', error);
        throw error;
    }
    return data;
}

export async function deleteData83(id: number): Promise<void> {
    const { error } = await supabase
        .from('data83')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting data83:', error);
        throw error;
    }
}
