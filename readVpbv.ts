import { supabase } from './supabaseClient';

export interface VpbvRecord {
    id?: string;
    ngay_bao_cao: string;
    ma_ba?: string | null;
    khoa: string;
    ho_ten_nb: string;
    gioi_tinh: 'Nam' | 'Nữ';
    nam_sinh?: number | null;
    ngay_nhap_vien?: string | null;
    ngay_khoi_phat_vp?: string | null;
    chan_doan_nkbv?: string;
    chan_doan_xac_dinh?: string | null;
    ket_qua_vsv?: string | null;
    tinh_trang?: string;
    ngay_may_tho_cong_don?: number;
    ghi_chu?: string | null;
    created_at?: string;
    updated_at?: string;
}

export async function fetchVpbv(): Promise<VpbvRecord[]> {
    const { data, error } = await supabase
        .from('danh_sach_vpbv')
        .select('*')
        .order('ngay_bao_cao', { ascending: false });
    
    if (error) {
        console.error('Error fetching vpbv:', error);
        throw error;
    }
    return data || [];
}

export async function addVpbv(record: VpbvRecord): Promise<VpbvRecord> {
    const { data, error } = await supabase
        .from('danh_sach_vpbv')
        .insert([record])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding vpbv:', error);
        throw error;
    }
    return data;
}

export async function updateVpbv(id: string, record: Partial<VpbvRecord>): Promise<VpbvRecord> {
    const { data, error } = await supabase
        .from('danh_sach_vpbv')
        .update(record)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating vpbv:', error);
        throw error;
    }
    return data;
}

export async function deleteVpbv(id: string): Promise<void> {
    const { error } = await supabase
        .from('danh_sach_vpbv')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting vpbv:', error);
        throw error;
    }
}
