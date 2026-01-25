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
    tieu_chi?: string;
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
    score: number; // Điểm trung bình cộng (1-5)
    created_at: string;
}

export async function fetchAssessmentSheets(): Promise<AssessmentSheet[]> {
    const { data: rawData, error } = await supabase
        .from('kq_danh_gia_83tc')
        .select('phieu_id, ngay_danh_gia, nguoi_danh_gia, nguoi_tao_id, don_vi_duoc_danh_gia, nhom, dat_muc, phan, chuong, ma_tieu_muc, dat, created_at');

    if (error) throw error;

    const sheetsMap: Record<string, any[]> = {};

    rawData?.forEach((row: any) => {
        if (!row.phieu_id) return;
        if (!sheetsMap[row.phieu_id]) {
            sheetsMap[row.phieu_id] = [];
        }
        sheetsMap[row.phieu_id].push(row);
    });

    const sheets: AssessmentSheet[] = Object.keys(sheetsMap).map(phieuId => {
        const rows = sheetsMap[phieuId];
        const first = rows[0];

        // Group rows to calculate scores: Phan -> Chuong -> TieuChi
        const hierarchy: any = {};
        rows.forEach(r => {
            const p = r.phan || "Khác";
            const c = r.chuong || "Khác";
            // Fallback for tieu_chi: split ma_tieu_muc (e.g. A1.1-1.1 -> A1.1)
            const tc = r.ma_tieu_muc?.split('-')[0] || "Khác";

            if (!hierarchy[p]) hierarchy[p] = {};
            if (!hierarchy[p][c]) hierarchy[p][c] = {};
            if (!hierarchy[p][c][tc]) hierarchy[p][c][tc] = [];

            hierarchy[p][c][tc].push(r);
        });

        const phanScores: number[] = [];
        Object.keys(hierarchy).forEach(p => {
            const chuongScores: number[] = [];
            Object.keys(hierarchy[p]).forEach(c => {
                const tcScores: number[] = [];
                Object.keys(hierarchy[p][c]).forEach(tc => {
                    const tcItems = hierarchy[p][c][tc];
                    // Tieu Chi level = max level achieved (dat_muc format: "Mức X" or "Bản điểm")
                    let maxLevel = 0;
                    tcItems.forEach((item: any) => {
                        const levelMatch = item.dat_muc?.match(/\d+/);
                        const levelNum = levelMatch ? parseInt(levelMatch[0]) : 0;
                        if (levelNum > maxLevel) maxLevel = levelNum;
                    });
                    // Tieu chi level is 1-5 (if maxLevel is 0 but it's "Bản điểm", we can say 1? 
                    // Actually if it reached "Mức 1", score is 1. If "Mức 2", score is 2.
                    // If no level reached, score is 0? The user said "đạt mức" average.
                    tcScores.push(maxLevel);
                });
                if (tcScores.length > 0) {
                    const chuongAvg = tcScores.reduce((a, b) => a + b, 0) / tcScores.length;
                    chuongScores.push(chuongAvg);
                }
            });
            if (chuongScores.length > 0) {
                const phanAvg = chuongScores.reduce((a, b) => a + b, 0) / chuongScores.length;
                phanScores.push(phanAvg);
            }
        });

        const finalScore = phanScores.length > 0 ? phanScores.reduce((a, b) => a + b, 0) / phanScores.length : 0;

        return {
            phieu_id: phieuId,
            ngay_danh_gia: first.ngay_danh_gia,
            nguoi_danh_gia: first.nguoi_danh_gia,
            nguoi_tao_id: first.nguoi_tao_id,
            don_vi_duoc_danh_gia: first.don_vi_duoc_danh_gia,
            nhom: first.nhom,
            total_criteria: rows.length,
            passed_criteria: rows.filter((r: any) => r.dat).length,
            score: Number(finalScore.toFixed(2)),
            created_at: first.created_at
        };
    });

    return sheets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
