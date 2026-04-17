import { supabase } from './supabaseClient';
import { fetchDmDonVi, type DmDonVi } from './readDmDonVi';
import { fetchData83tc, type Data83tc } from './readData83tc';

export { fetchDmDonVi as fetchDonVi, type DmDonVi as DonVi } from './readDmDonVi';
export { fetchData83tc, type Data83tc };

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
    to_danh_gia?: string; // New field for team assessments

    // Kết quả
    dat: boolean;
    khong_dat: boolean;
    khong_danh_gia: boolean;
    dat_muc: string;
    ghi_chu?: string;

    // Minh chứng
    hinh_anh_minh_chung?: string[]; // Mảng URLs

    muc_dat_duoc?: number; // Mức đạt được (1-5)

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
    let allRawData: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data: rawData, error } = await supabase
            .from('kq_danh_gia_83tc')
            .select('phieu_id, ngay_danh_gia, nguoi_danh_gia, nguoi_tao_id, don_vi_duoc_danh_gia, nhom, dat_muc, phan, chuong, ma_tieu_muc, dat, created_at, muc_dat_duoc')
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!rawData || rawData.length === 0) break;

        allRawData = allRawData.concat(rawData);
        if (rawData.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    const sheetsMap: Record<string, any[]> = {};
    allRawData.forEach((row: any) => {
        if (!row.phieu_id) return;
        if (!sheetsMap[row.phieu_id]) {
            sheetsMap[row.phieu_id] = [];
        }
        sheetsMap[row.phieu_id].push(row);
    });

    // Fetch Configured Criteria for Denominators
    const allConfig = await fetchData83tc();

    const sheets: AssessmentSheet[] = Object.keys(sheetsMap).map(phieuId => {
        const rows = sheetsMap[phieuId];
        const first = rows[0];
        const unitName = first.don_vi_duoc_danh_gia || "";
        const unitCode = unitName.split('-')[0].trim();

        // 1. Identify "Assigned Criteria" for this unit
        const assignedCriteria = allConfig.filter((c: Data83tc) => {
            if (!c.phu_trach) return false;
            return c.phu_trach.split(',').map((s: string) => s.trim()).includes(unitCode);
        });

        // 2. Identify unique "Criteria (Tiêu chí)" names assigned to this unit
        const assignedTieuChiNames = [...new Set(assignedCriteria.map((c: Data83tc) => c.tieu_chi).filter(Boolean))];

        // 3. Group assignment into Hierarchy: Phan -> Chuong -> TieuChi
        const assignmentHierarchy: any = {};
        assignedCriteria.forEach((c: Data83tc) => {
            const p = c.phan || "Khác";
            const ch = c.chuong || "Khác";
            const tc = c.tieu_chi || "Khác";
            if (!assignmentHierarchy[p]) assignmentHierarchy[p] = {};
            if (!assignmentHierarchy[p][ch]) assignmentHierarchy[p][ch] = new Set();
            assignmentHierarchy[p][ch].add(tc);
        });

        // 4. Map Results from DB to Criteria Names
        const resultsByTc: Record<string, number> = {};
        rows.forEach(r => {
            const tcName = r.tieu_chi;
            if (!tcName) return;
            const level = r.muc_dat_duoc || 1;
            if (!resultsByTc[tcName] || level > resultsByTc[tcName]) {
                resultsByTc[tcName] = level;
            }
        });

        // 5. Hierarchical Averaging
        const phanScores: number[] = [];
        console.group(`Sheet Calculation: ${phieuId} for unit ${unitCode}`);
        Object.keys(assignmentHierarchy).forEach(p => {
            const chuongScores: number[] = [];
            Object.keys(assignmentHierarchy[p]).forEach(ch => {
                const tcNamesInChuong = Array.from(assignmentHierarchy[p][ch] as Set<string>);
                const tcLevels = tcNamesInChuong.map(name => resultsByTc[name] || 1);

                if (tcLevels.length > 0) {
                    const chuongAvg = tcLevels.reduce((a, b) => a + b, 0) / tcLevels.length;
                    chuongScores.push(chuongAvg);
                    console.log(`  - Chapter ${ch}: ${chuongAvg.toFixed(2)} (${tcLevels.length} items)`);
                }
            });

            if (chuongScores.length > 0) {
                const phanAvg = chuongScores.reduce((a, b) => a + b, 0) / chuongScores.length;
                phanScores.push(phanAvg);
                console.log(`- Part ${p}: ${phanAvg.toFixed(2)} (${chuongScores.length} chapters)`);
            }
        });

        // Use a fixed denominator of 5 for Parts as per "83 criteria" standard
        const TOTAL_PARTS_CONFIGURED = 5;
        const finalScore = phanScores.length > 0 ? phanScores.reduce((a, b) => a + b, 0) / TOTAL_PARTS_CONFIGURED : 0;
        console.log(`Final Sheet Score (divided by ${TOTAL_PARTS_CONFIGURED} parts): ${finalScore.toFixed(2)}`);
        console.groupEnd();

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
    let allData: KqDanhGia83[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('kq_danh_gia_83tc')
            .select('*')
            .eq('phieu_id', phieuId)
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return allData;
}

export async function deletePhieuDanhGia(phieuId: string): Promise<void> {
    const { error } = await supabase
        .from('kq_danh_gia_83tc')
        .delete()
        .eq('phieu_id', phieuId);
    if (error) throw error;
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
    let allData: KqDanhGia83[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        let query = supabase.from('kq_danh_gia_83tc').select('*');

        if (filters?.don_vi) query = query.eq('don_vi_duoc_danh_gia', filters.don_vi);
        if (filters?.ngay) query = query.eq('ngay_danh_gia', filters.ngay);

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error('Error fetching kq_danh_gia_83tc:', error);
            throw error;
        }
        if (!data || data.length === 0) break;

        allData = allData.concat(data);
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    return allData;
}

import { compressFile } from './utils/compression';

/**
 * Upload ảnh minh chứng lên bucket minh_chung_83tc
 */
export async function uploadEvidenceImage(file: File): Promise<string> {
    const compressedFile = await compressFile(file);
    const fileExt = compressedFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `83tc/${fileName}`;

    const { data, error } = await supabase.storage
        .from('minh_chung_83tc')
        .upload(filePath, compressedFile, { cacheControl: '31536000' });

    if (error) {
        throw error;
    }

    // Lấy public URL
    const { data: { publicUrl } } = supabase.storage
        .from('minh_chung_83tc')
        .getPublicUrl(filePath);

    return publicUrl;
}
