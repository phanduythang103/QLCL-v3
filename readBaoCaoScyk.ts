import { supabase } from './supabaseClient';

export interface BaoCaoScyk {
  id: string;
  hinh_thuc_bao_cao?: string;
  so_bc_ma_scyk?: string;
  ngay_bao_cao?: string;
  don_vi_bao_cao?: string;
  ho_ten_nb?: string;
  mo_ta_su_co?: string;
  trang_thai?: string;
  ho_ten_nguoi_bc?: string;
  created_at?: string;
}

// Tối ưu: Chỉ select các trường cần thiết cho danh sách
const BC_SELECT_FIELDS = 'id, hinh_thuc_bao_cao, so_bc_ma_scyk, ngay_bao_cao, don_vi_bao_cao, ho_ten_nb, mo_ta_su_co, trang_thai, ho_ten_nguoi_bc, created_at';

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

// Xóa bản ghi
export async function deleteBaoCaoScyk(id: string): Promise<boolean> {
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
