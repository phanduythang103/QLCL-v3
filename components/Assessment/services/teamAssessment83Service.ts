import { supabase } from '../../../supabaseClient';
import { KqDanhGia83, AssessmentSheet } from '../types';
import { fetchData83tc } from '../../../readData83tc';

export const teamAssessment83Service = {
    /**
     * Save multiple criteria results for a team assessment
     */
    saveResultsBulk: async (items: any[]): Promise<any[]> => {
        const { data, error } = await supabase
            .from('kq_danh_gia_83tc_to')
            .insert(items)
            .select();

        if (error) {
            console.error('Error saving team assessment:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * Fetch all assessment sheets (summarized) from the team table
     */
    fetchSheets: async (teamName?: string): Promise<AssessmentSheet[]> => {
        let query = supabase.from('kq_danh_gia_83tc_to').select('*');

        if (teamName) {
            query = query.eq('to_danh_gia', teamName);
        }

        const { data: allRawData, error } = await query;
        if (error) throw error;
        if (!allRawData) return [];

        // Group rows by phieu_id
        const sheetsMap: Record<string, any[]> = {};
        allRawData.forEach((row: any) => {
            if (!row.phieu_id) return;
            if (!sheetsMap[row.phieu_id]) sheetsMap[row.phieu_id] = [];
            sheetsMap[row.phieu_id].push(row);
        });

        const allConfig = await fetchData83tc();

        const sheets: AssessmentSheet[] = Object.keys(sheetsMap).map(phieuId => {
            const rows = sheetsMap[phieuId];
            const first = rows[0];

            // Logic similar to readKqDanhGia83 but tailored for team reporting
            return {
                phieu_id: phieuId,
                ngay_danh_gia: first.ngay_danh_gia,
                nguoi_danh_gia: first.nguoi_danh_gia,
                nguoi_tao_id: first.nguoi_tao_id,
                don_vi_duoc_danh_gia: first.don_vi_duoc_danh_gia,
                nhom: first.to_danh_gia, // Use team name as group
                total_criteria: rows.length,
                passed_criteria: rows.filter((r: any) => r.dat).length,
                score: 0, // Simplified score for now
                created_at: first.created_at
            };
        });

        return sheets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    /**
     * Fetch detailed results for a specific assessment sheet
     */
    fetchResultsByPhieuId: async (phieuId: string): Promise<KqDanhGia83[]> => {
        const { data, error } = await supabase
            .from('kq_danh_gia_83tc_to')
            .select('*')
            .eq('phieu_id', phieuId);

        if (error) throw error;
        return (data || []) as KqDanhGia83[];
    },

    /**
     * Delete an entire assessment sheet
     */
    deleteSheet: async (phieuId: string): Promise<void> => {
        const { error } = await supabase
            .from('kq_danh_gia_83tc_to')
            .delete()
            .eq('phieu_id', phieuId);
        if (error) throw error;
    },

    /**
     * Aggregates multiple assessment forms for a team/unit/date
     * into a single result following the "lowest score wins" rule.
     */
    aggregateResultsByTeam: async (teamName: string, unitName: string, date: string): Promise<KqDanhGia83[]> => {
        const { data: rawData, error } = await supabase
            .from('kq_danh_gia_83tc_to')
            .select('*')
            .eq('to_danh_gia', teamName)
            .eq('don_vi_duoc_danh_gia', unitName)
            .eq('ngay_danh_gia', date);

        if (error) throw error;
        if (!rawData || rawData.length === 0) return [];

        // Group results by ma_tieu_muc
        const grouped: Record<string, KqDanhGia83[]> = {};
        rawData.forEach((item: KqDanhGia83) => {
            if (!grouped[item.ma_tieu_muc]) grouped[item.ma_tieu_muc] = [];
            grouped[item.ma_tieu_muc].push(item);
        });

        // Compute lowest result for each ma_tieu_muc
        const aggregated: KqDanhGia83[] = Object.keys(grouped).map(ma => {
            const items = grouped[ma];

            // Check if any item is "Chưa đạt"
            const hasFail = items.some(i => i.dat_muc === "Chưa đạt");
            const lowestMuc = Math.min(...items.map(i => i.muc_dat_duoc || 1));

            // Representative item for metadata (phan, chuong, etc.)
            const rep = items[0];

            return {
                ...rep,
                dat_muc: hasFail ? "Chưa đạt" : (items.every(i => i.dat_muc === "Không đánh giá") ? "Không đánh giá" : "Đạt"),
                dat: !hasFail && items.some(i => i.dat_muc === "Đạt"),
                khong_dat: hasFail,
                muc_dat_duoc: lowestMuc,
                ghi_chu: `[TỔNG HỢP TỪ ${items.length} PHIẾU] ` + items.map(i => i.ghi_chu).filter(Boolean).join('; ')
            } as KqDanhGia83;
        });

        return aggregated;
    }
};
