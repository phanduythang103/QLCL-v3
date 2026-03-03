import { supabase } from './supabaseClient';

export interface ThanhVienDoan {
    ho_ten: string;
    chuc_vu: string;
    don_vi: string;
    vai_tro: 'CHU_TRI' | 'THANH_VIEN' | 'THU_KY' | 'NGUOI_CHUNG_KIEN';
}

export interface NguoiThamDu {
    ho_ten: string;
    chuc_vu: string;
    don_vi: string;
}

export interface BienBanXacMinh {
    id: string;
    created_at?: string;

    // Thông tin chung
    thoi_gian_bat_dau: string; // Hồi ... giờ ... ngày ...
    dia_diem: string;

    // Thành phần đoàn
    thanh_phan: ThanhVienDoan[];
    nguoi_tham_du: NguoiThamDu[];

    // Nội dung
    noi_dung_xac_minh: string;
    ket_qua_xac_minh: string; // Phần quan trọng nhất
    y_kien_tham_gia: string;

    // Liên kết báo cáo (Optional)
    scyk_id?: string;
    ma_baocao_scyk?: string; // Cache mã để hiển thị

    // File đính kèm (Lưu trên bucket scyk)
    file_url?: string;    // Signed URL hoặc path file PDF trên bucket
    file_name?: string;   // Tên file PDF
}

// Columns to select
const BBM_SELECT_FIELDS = '*';

// Lấy danh sách biên bản
export async function fetchBienBanXacMinh(): Promise<BienBanXacMinh[]> {
    const { data, error } = await supabase
        .from('bien_ban_xac_minh_su_co')
        .select(BBM_SELECT_FIELDS)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bien_ban_xac_minh_su_co:', error);
        return [];
    }
    return data || [];
}

// Lấy 1 biên bản theo ID
export async function fetchBienBanXacMinhById(id: string): Promise<BienBanXacMinh | null> {
    const { data, error } = await supabase
        .from('bien_ban_xac_minh_su_co')
        .select(BBM_SELECT_FIELDS)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching one bien_ban:', error);
        return null;
    }
    return data;
}

// Thêm biên bản mới
export async function addBienBanXacMinh(record: Partial<BienBanXacMinh>): Promise<BienBanXacMinh | null> {
    const { data, error } = await supabase
        .from('bien_ban_xac_minh_su_co')
        .insert([record])
        .select(BBM_SELECT_FIELDS);

    if (error) {
        throw error;
    }
    return data?.[0] || null;
}

// Cập nhật biên bản
export async function updateBienBanXacMinh(id: string, updates: Partial<BienBanXacMinh>): Promise<BienBanXacMinh | null> {
    const { data, error } = await supabase
        .from('bien_ban_xac_minh_su_co')
        .update(updates)
        .eq('id', id)
        .select(BBM_SELECT_FIELDS);

    if (error) {
        throw error;
    }
    return data?.[0] || null;
}

// Xóa biên bản
export async function deleteBienBanXacMinh(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('bien_ban_xac_minh_su_co')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}
