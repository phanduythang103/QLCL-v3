import { supabase } from './supabaseClient';

export interface KqDanhGia83 {
    id?: string;
    ngay_danh_gia: string;
    nguoi_danh_gia: string;
    don_vi_duoc_danh_gia: string;

    // Thông tin từ data83
    phan?: string;
    chuong?: string;
    ma_tieu_muc: string;
    tieu_muc?: string;
    nhom?: string;

    // Kết quả
    dat: boolean;
    khong_dat: boolean;
    khong_danh_gia: boolean;
    dat_muc: string;
    ghi_chu?: string;

    // Minh chứng
    hinh_anh_minh_chung?: string[]; // Mảng URLs

    created_at?: string;
    updated_at?: string;
}

export interface DonVi {
    id: string;
    ma_don_vi: string;
    ten_don_vi: string;
    khoi: string;
}

export async function fetchDonVi(): Promise<DonVi[]> {
    const { data, error } = await supabase
        .from('dm_don_vi')
        .select('*')
        .order('ten_don_vi', { ascending: true });

    if (error) {
        console.error('Error fetching don_vi:', error);
        throw error;
    }
    return data || [];
}

export async function saveKqDanhGia83Bulk(items: KqDanhGia83[]): Promise<KqDanhGia83[]> {
    const { data, error } = await supabase
        .from('kq_danh_gia_83tc')
        .insert(items)
        .select();

    if (error) {
        console.error('Error saving kq_danh_gia_83tc:', error);
        throw error;
    }
    return data || [];
}

export async function fetchKqDanhGia83(filters?: { don_vi?: string, ngay?: string }): Promise<KqDanhGia83[]> {
    let query = supabase.from('kq_danh_gia_83tc').select('*');

    if (filters?.don_vi) query = query.eq('don_vi_duoc_danh_gia', filters.don_vi);
    if (filters?.ngay) query = query.eq('ngay_danh_gia', filters.ngay);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching kq_danh_gia_83tc:', error);
        throw error;
    }
    return data || [];
}

/**
 * Upload ảnh minh chứng lên bucket minh_chung_83tc
 */
export async function uploadEvidenceImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `83tc/${fileName}`;

    const { data, error } = await supabase.storage
        .from('minh_chung_83tc')
        .upload(filePath, file);

    if (error) {
        throw error;
    }

    // Lấy public URL
    const { data: { publicUrl } } = supabase.storage
        .from('minh_chung_83tc')
        .getPublicUrl(filePath);

    return publicUrl;
}
