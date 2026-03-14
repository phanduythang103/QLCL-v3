import { supabase } from './supabaseClient';

export interface HieuSuatPhongMo {
    id: string;
    ngay_bao_cao: string;
    nguoi_bao_cao: string;
    phong_mo_so: string;
    chuyen_khoa: string;
    gio_mo_thuc_te: number;
    gio_hoat_dong_dinh_muc: number;
    hieu_suat: number;
    danh_gia: string;
    ghi_chu: string | null;
    created_at: string;
    updated_at: string;
}

export interface HieuSuatPhongMoInput {
    ngay_bao_cao: string;
    nguoi_bao_cao: string;
    phong_mo_so: string;
    chuyen_khoa: string;
    gio_mo_thuc_te: number;
    gio_hoat_dong_dinh_muc: number;
    ghi_chu?: string | null;
}

/**
 * Calculates efficiency and evaluation status
 */
export const calcOREfficiency = (input: HieuSuatPhongMoInput) => {
    const actual = Number(input.gio_mo_thuc_te) || 0;
    const standard = Number(input.gio_hoat_dong_dinh_muc) || 1; // Avoid div by zero
    const efficiency = (actual / standard) * 100;
    const rounded = Math.round(efficiency * 100) / 100;

    let evaluation = 'Bình thường';
    if (rounded < 75) evaluation = 'Lãng phí nguồn lực';
    else if (rounded > 90) evaluation = 'Nguy cơ áp lực do quá tải';

    return {
        hieu_suat: rounded,
        danh_gia: evaluation
    };
};

export const fetchHieuSuatPhongMo = async (): Promise<HieuSuatPhongMo[]> => {
    const { data, error } = await supabase
        .from('hieu_suat_phong_mo')
        .select('*')
        .order('ngay_bao_cao', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const addHieuSuatPhongMo = async (input: HieuSuatPhongMoInput) => {
    const { hieu_suat, danh_gia } = calcOREfficiency(input);
    const { data, error } = await supabase
        .from('hieu_suat_phong_mo')
        .insert([{ ...input, hieu_suat, danh_gia }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateHieuSuatPhongMo = async (id: string, input: HieuSuatPhongMoInput) => {
    const { hieu_suat, danh_gia } = calcOREfficiency(input);
    const { data, error } = await supabase
        .from('hieu_suat_phong_mo')
        .update({ ...input, hieu_suat, danh_gia, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteHieuSuatPhongMo = async (id: string) => {
    const { error } = await supabase
        .from('hieu_suat_phong_mo')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
