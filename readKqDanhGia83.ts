import { supabase } from './supabaseClient';

export interface KqDanhGia83 {
    id?: string;
    phieu_id?: string; // Nhóm các tiêu chí vào cùng 1 phiếu
    nguoi_tao_id?: string; // ID người tạo từ users
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

export interface AssessmentSheet {
    phieu_id: string;
    ngay_danh_gia: string;
    nguoi_danh_gia: string;
    nguoi_tao_id: string;
    don_vi_duoc_danh_gia: string;
    nhom?: string;
    total_criteria: number;
    passed_criteria: number;
    created_at: string;
}

export async function fetchAssessmentSheets(): Promise<AssessmentSheet[]> {
    // Vì ta gom nhóm dữ liệu thô, nêntruy vấn unique phieu_id cùng metadata
    const { data: rawData, error } = await supabase
        .from('kq_danh_gia_83tc')
        .select('phieu_id, ngay_danh_gia, nguoi_danh_gia, nguoi_tao_id, don_vi_duoc_danh_gia, nhom, dat, created_at');

    if (error) throw error;

    const sheetsMap: Record<string, AssessmentSheet> = {};

    rawData?.forEach((row: any) => {
        if (!row.phieu_id) return;
        if (!sheetsMap[row.phieu_id]) {
            sheetsMap[row.phieu_id] = {
                phieu_id: row.phieu_id,
                ngay_danh_gia: row.ngay_danh_gia,
                nguoi_danh_gia: row.nguoi_danh_gia,
                nguoi_tao_id: row.nguoi_tao_id,
                don_vi_duoc_danh_gia: row.don_vi_duoc_danh_gia,
                nhom: row.nhom,
                total_criteria: 0,
                passed_criteria: 0,
                created_at: row.created_at
            };
        }
        sheetsMap[row.phieu_id].total_criteria += 1;
        if (row.dat) sheetsMap[row.phieu_id].passed_criteria += 1;
    });

    return Object.values(sheetsMap).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchKqByPhieuId(phieuId: string): Promise<KqDanhGia83[]> {
    const { data, error } = await supabase
        .from('kq_danh_gia_83tc')
        .select('*')
        .eq('phieu_id', phieuId);
    if (error) throw error;
    return data || [];
}

export async function deletePhieuDanhGia(phieuId: string): Promise<void> {
    const { error } = await supabase
        .from('kq_danh_gia_83tc')
        .delete()
        .eq('phieu_id', phieuId);
    if (error) throw error;
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
