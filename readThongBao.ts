import { supabase } from './supabaseClient';

export interface ThongBao {
    id: string;
    nguoi_tao_id: string;
    nguoi_tao_name: string;
    ngay_tao: string;
    noi_dung: string;
    don_vi_thuc_hien: string[];
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    ghi_chu: string;
    file_dinh_kem: string;
}

export const fetchThongBao = async () => {
    const { data, error } = await supabase
        .from('thong_bao')
        .select('*')
        .order('ngay_tao', { ascending: false });
    if (error) throw error;
    return data;
};

export const addThongBao = async (thongBao: Partial<ThongBao>) => {
    const { data, error } = await supabase
        .from('thong_bao')
        .insert([thongBao])
        .select();
    if (error) throw error;
    return data[0];
};

export const updateThongBao = async (id: string, thongBao: Partial<ThongBao>) => {
    const { data, error } = await supabase
        .from('thong_bao')
        .update(thongBao)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteThongBao = async (id: string) => {
    const { error } = await supabase
        .from('thong_bao')
        .delete()
        .eq('id', id);
    if (error) throw error;
};

import { compressFile } from './utils/compression';

export const uploadCVFile = async (file: File) => {
    // Compress before upload
    const compressedFile = await compressFile(file);

    const fileExt = compressedFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `notifications/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('cv_file')
        .upload(filePath, compressedFile, { cacheControl: '31536000' });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('cv_file')
        .getPublicUrl(filePath);

    return publicUrl;
};
