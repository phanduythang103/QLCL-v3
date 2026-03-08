import { supabase } from './supabaseClient';

export interface BaoCaoTienDoCtcl {
  id?: string;
  ngay_bao_cao: string;
  don_vi_bao_cao: string;
  nguoi_bao_cao: string;
  ky_bao_cao: string;
  ke_hoach_id: string;
  muc_tieu_de_ra: string;
  ket_qua_hien_tai: string;
  hang_muc_hoan_thanh: string;
  hang_muc_dang_thuc_hien: string;
  kho_khan: string;
  de_xuat: string;
  nguoi_tao_id?: string;
  created_at?: string;
}

const BAO_CAO_TIEN_DO_SELECT_FIELDS = '*, khctcl:ke_hoach_id(ten_van_de, don_vi)';

export async function fetchBaoCaoTienDoCtcl(): Promise<BaoCaoTienDoCtcl[]> {
  const { data, error } = await supabase
    .from('bao_cao_tien_do_ctcl')
    .select(BAO_CAO_TIEN_DO_SELECT_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addBaoCaoTienDoCtcl(record: Omit<BaoCaoTienDoCtcl, 'id' | 'created_at'>): Promise<BaoCaoTienDoCtcl> {
  const { data, error } = await supabase
    .from('bao_cao_tien_do_ctcl')
    .insert([record])
    .select(BAO_CAO_TIEN_DO_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function updateBaoCaoTienDoCtcl(id: string, updates: Partial<BaoCaoTienDoCtcl>): Promise<BaoCaoTienDoCtcl> {
  const { data, error } = await supabase
    .from('bao_cao_tien_do_ctcl')
    .update(updates)
    .eq('id', id)
    .select(BAO_CAO_TIEN_DO_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function deleteBaoCaoTienDoCtcl(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('bao_cao_tien_do_ctcl')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
