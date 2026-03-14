import { supabase } from './supabaseClient';

export interface DowntimeDetail {
    stt: number;
    milestone: string;
    time_min: number;
    reason: string;
}

export interface ThoiGianChetPM {
    id: string;
    ngay_bao_cao: string;
    nguoi_bao_cao: string;
    phong_mo_so: string;
    chuyen_khoa: string;
    chi_tiet: DowntimeDetail[];
    total_downtime: number;
    created_at: string;
    updated_at: string;
}

export interface ThoiGianChetPMInput {
    ngay_bao_cao: string;
    nguoi_bao_cao: string;
    phong_mo_so: string;
    chuyen_khoa: string;
    chi_tiet: DowntimeDetail[];
}

export const DEFAULT_MILESTONES = [
    "Thời gian chờ NB từ khoa lâm sàng đưa xuống",
    "Thời gian chuẩn bị/vệ sinh phòng mổ giữa 2 ca",
    "Thời gian chờ bác sĩ phẫu thuật/gây mê",
    "Thời gian chuẩn bị dụng cụ phẫu thuật",
    "Yếu tố khác"
];

export const fetchThoiGianChetPM = async (): Promise<ThoiGianChetPM[]> => {
    const { data, error } = await supabase
        .from('phan_tich_thoi_gian_chet_pm')
        .select('*')
        .order('ngay_bao_cao', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const addThoiGianChetPM = async (input: ThoiGianChetPMInput) => {
    const total = input.chi_tiet.reduce((sum, item) => sum + (Number(item.time_min) || 0), 0);
    const { data, error } = await supabase
        .from('phan_tich_thoi_gian_chet_pm')
        .insert([{ ...input, total_downtime: total }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateThoiGianChetPM = async (id: string, input: ThoiGianChetPMInput) => {
    const total = input.chi_tiet.reduce((sum, item) => sum + (Number(item.time_min) || 0), 0);
    const { data, error } = await supabase
        .from('phan_tich_thoi_gian_chet_pm')
        .update({ ...input, total_downtime: total, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteThoiGianChetPM = async (id: string) => {
    const { error } = await supabase
        .from('phan_tich_thoi_gian_chet_pm')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
