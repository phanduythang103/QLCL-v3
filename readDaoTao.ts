import { supabase } from './supabaseClient';

export interface DaoTao {
  id?: string;
  tieu_de: string;
  noi_dung: string;
  link?: string;
  link_embed?: string;
  file_dinh_kem?: string;
  file_ten_goc?: string;
  file_ten_nen?: string;
  file_mime_type?: string;
  file_kich_thu_goc?: number;
  file_kich_thu_nen?: number;
  nguoi_tao_id?: string;
  nguoi_tao_name?: string;
  ngay_tao?: string;
  updated_at?: string;
  created_at?: string;
}

export async function fetchDaoTao(): Promise<DaoTao[]> {
  const query = supabase
    .from('dao_tao')
    .select('*')
    .order('ngay_tao', { ascending: false });

  const { data, error } = await Promise.race([
    query,
    new Promise<never>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error('Tải dữ liệu đào tạo quá lâu, vui lòng thử lại.')), 15000);
    }),
  ]);

  if (error) throw error;
  return data || [];
}

export async function addDaoTao(record: Omit<DaoTao, 'id'>): Promise<DaoTao> {
  const { data, error } = await supabase
    .from('dao_tao')
    .insert([record])
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function updateDaoTao(id: string, updates: Partial<DaoTao>): Promise<DaoTao> {
  const { data, error } = await supabase
    .from('dao_tao')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteDaoTao(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('dao_tao')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
