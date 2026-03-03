import { supabase } from './supabaseClient';

export interface ScykTienDoLog {
    id?: string;
    bao_cao_id: string;
    trang_thai?: string;
    ghi_chu?: string;
    nguoi_cap_nhat?: string;
    thoi_gian_cap_nhat?: string;
}

// Thêm log mới
export async function addScykTienDoLog(record: Omit<ScykTienDoLog, 'id' | 'thoi_gian_cap_nhat'>): Promise<ScykTienDoLog> {
    const { data, error } = await supabase
        .from('scyk_tien_do_logs')
        .insert([record])
        .select('*');
    if (error) throw error;
    return data?.[0];
}

// Lấy lịch sử log theo bao_cao_id
export async function fetchScykTienDoLogs(bao_cao_id: string): Promise<ScykTienDoLog[]> {
    const { data, error } = await supabase
        .from('scyk_tien_do_logs')
        .select('*')
        .eq('bao_cao_id', bao_cao_id)
        .order('thoi_gian_cap_nhat', { ascending: false });
    if (error) throw error;
    return data || [];
}

// Lấy log mới nhất cho tất cả sự cố (1 query duy nhất)
export async function fetchLatestLogPerIncident(): Promise<Record<string, ScykTienDoLog>> {
    const { data, error } = await supabase
        .from('scyk_tien_do_logs')
        .select('*')
        .order('thoi_gian_cap_nhat', { ascending: false });
    if (error) throw error;

    // Group by bao_cao_id, keep only latest per incident
    const latestMap: Record<string, ScykTienDoLog> = {};
    for (const log of (data || [])) {
        if (!latestMap[log.bao_cao_id]) {
            latestMap[log.bao_cao_id] = log;
        }
    }
    return latestMap;
}
