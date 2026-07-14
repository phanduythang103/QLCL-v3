import { supabase } from './supabaseClient';

export interface BaoCaoScyk {
  id: string;
  hinh_thuc_bao_cao?: string;
  so_bc_ma_scyk?: string;
  ngay_bao_cao?: string;
  don_vi_bao_cao?: string;
  ho_ten_nb?: string;
  ma_bn?: string;
  so_benh_an?: string;
  thoi_gian_vao_vien?: string;
  ngay_sinh?: string;
  gioi?: string;
  mo_ta_su_co?: string;
  trang_thai?: string;
  tien_do_xu_ly?: string;
  ho_ten_nguoi_bc?: string;
  khoa_phong?: string;
  doi_tuong_xay_ra_sc?: string;
  noi_xay_ra_sc?: string;
  vi_tri_cu_the?: string;
  ngay_xay_ra_sc?: string;
  thoi_gian?: string;
  phan_loai_ban_dau?: string;
  muc_do_anh_huong?: string;
  nhom_bao_cao?: string;
  nhom_su_co?: string;
  dieu_tri_xy_ly_ban_dau_da_thuc_hien?: string;
  de_xuat_giai_phap_ban_dau?: string;
  thong_bao_bs_dieu_tri?: string;
  thong_bao_nguoi_nha?: string;
  thong_bao_nguoi_benh?: string;
  ghi_nhan_vao_hsba?: string;
  nguoi_bao_cao_sdt?: string;
  nguoi_bao_cao_email?: string;
  nguoi_bao_cao_doi_tuong?: string;
  nguoi_bao_cao_chuc_danh_khac?: string;
  hinh_anh_minh_chung?: string[];
  created_at?: string;
}

// Tối ưu: Chỉ select các trường cần thiết cho danh sách
const BC_SELECT_FIELDS = '*';

export async function fetchBaoCaoScyk(): Promise<BaoCaoScyk[]> {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .select(BC_SELECT_FIELDS)
    .order('ngay_bao_cao', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Thêm bản ghi mới
export async function addBaoCaoScyk(record: Partial<BaoCaoScyk>): Promise<BaoCaoScyk> {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .insert([record])
    .select(BC_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

// Sửa bản ghi
export async function updateBaoCaoScyk(id: string, updates: Partial<BaoCaoScyk>): Promise<BaoCaoScyk> {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .update(updates)
    .eq('id', id)
    .select(BC_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

// Xóa bản ghi (và các bảng liên kết)
export async function deleteBaoCaoScyk(id: string): Promise<boolean> {
  // 1. Xóa các liên kết (tránh lỗi foreign key constraint nếu không có ON DELETE CASCADE)
  await supabase.from('scyk_tien_do_logs').delete().eq('bao_cao_id', id);
  await supabase.from('tim_hieu_phan_tich_scyk').delete().eq('scyk_id', id);
  await supabase.from('bien_ban_xac_minh_su_co').delete().eq('scyk_id', id);

  // 2. Xóa bản ghi cha
  const { error } = await supabase
    .from('bao_cao_scyk')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
export async function fetchLatestBaoCaoScykByYear(year: string) {
  const { data, error } = await supabase
    .from('bao_cao_scyk')
    .select('so_bc_ma_scyk')
    .ilike('so_bc_ma_scyk', `SCYK-${year}-%`)
    .order('so_bc_ma_scyk', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0];
}
