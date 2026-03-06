import { supabase } from './supabaseClient';

export interface GiaiPhapToChuc {
  tt: number;
  hanh_dong: string;
  nguoi_phu_trach: string;
  thoi_han: string;
  ket_qua: string;
}

export interface Khctcl {
  id?: string;
  ngay_lap_ke_hoach: string;
  don_vi: string;
  nguoi_lap_ke_hoach: string;
  ten_van_de: string;
  ly_do_thuc_hien: string;
  muc_tieu: string;
  giai_phap_to_chuc: GiaiPhapToChuc[];
  ngay_bat_dau?: string;
  ngay_ket_thuc?: string;
  trang_thai: string;
  nguoi_tao_id?: string;
  created_at?: string;
}

const KHCTCL_SELECT_FIELDS = 'id, ngay_lap_ke_hoach, don_vi, nguoi_lap_ke_hoach, ten_van_de, ly_do_thuc_hien, muc_tieu, giai_phap_to_chuc, ngay_bat_dau, ngay_ket_thuc, trang_thai, nguoi_tao_id, created_at';

export async function fetchKhctcl(): Promise<Khctcl[]> {
  const { data, error } = await supabase
    .from('khctcl')
    .select(KHCTCL_SELECT_FIELDS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addKhctcl(record: Omit<Khctcl, 'id' | 'created_at'>): Promise<Khctcl> {
  const { data, error } = await supabase
    .from('khctcl')
    .insert([record])
    .select(KHCTCL_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function updateKhctcl(id: string, updates: Partial<Khctcl>): Promise<Khctcl> {
  const { data, error } = await supabase
    .from('khctcl')
    .update(updates)
    .eq('id', id)
    .select(KHCTCL_SELECT_FIELDS);
  if (error) throw error;
  return data?.[0];
}

export async function deleteKhctcl(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('khctcl')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
