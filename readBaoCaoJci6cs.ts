import { supabase } from './supabaseClient';
import type { CapBaoCao, KyLoai } from './utils/jci6csReport';

/** Báo cáo tổng hợp 06 chỉ số chất lượng đã xuất (file Word lưu dạng base64). */
export interface BaoCaoJci6cs {
  id: string;
  ky_loai: KyLoai;
  ky_so: number;
  nam: number;
  cap_bao_cao: CapBaoCao;
  don_vi: string | null;
  ten_bao_cao: string;
  ten_file: string;
  file_base64?: string;
  so_lieu?: any;
  nguoi_tao: string | null;
  created_at: string;
}

const TABLE = 'bao_cao_jci_6cs';
const LIST_COLS = 'id, ky_loai, ky_so, nam, cap_bao_cao, don_vi, ten_bao_cao, ten_file, nguoi_tao, created_at';

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export const base64ToBlob = (b64: string): Blob => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
};

/** Danh sách báo cáo (không tải nội dung file). `donVi` = null: lấy tất cả. */
export const fetchBaoCaoJci6cs = async (donVi: string | null): Promise<BaoCaoJci6cs[]> => {
  let query = supabase.from(TABLE).select(LIST_COLS).order('created_at', { ascending: false }).limit(200);
  if (donVi !== null) query = query.eq('cap_bao_cao', 'khoa').eq('don_vi', donVi);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as BaoCaoJci6cs[];
};

export const addBaoCaoJci6cs = async (item: Omit<BaoCaoJci6cs, 'id' | 'created_at'>): Promise<BaoCaoJci6cs> => {
  const { data, error } = await supabase.from(TABLE).insert([item]).select(LIST_COLS).single();
  if (error) throw new Error(error.message);
  return data as BaoCaoJci6cs;
};

export const fetchBaoCaoJci6csFile = async (id: string): Promise<string> => {
  const { data, error } = await supabase.from(TABLE).select('file_base64').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data?.file_base64 || '';
};

export const deleteBaoCaoJci6cs = async (id: string): Promise<void> => {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/** Số liệu + nội dung đã nhập của báo cáo (dùng cho form sửa). */
export const fetchBaoCaoJci6csData = async (id: string): Promise<any> => {
  const { data, error } = await supabase.from(TABLE).select('so_lieu').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data?.so_lieu || null;
};

/** Lưu nội dung đã sửa và file Word tạo lại từ nội dung đó. */
export const updateBaoCaoJci6cs = async (
  id: string,
  patch: Pick<BaoCaoJci6cs, 'so_lieu' | 'file_base64' | 'ten_file'>
): Promise<void> => {
  const { error } = await supabase.from(TABLE).update(patch).eq('id', id);
  if (error) throw new Error(error.message);
};

/** Báo cáo đã có của cùng đơn vị, cùng cấp và cùng kỳ (mỗi đơn vị chỉ 1 báo cáo/kỳ). */
export const findBaoCaoJci6cs = async (
  key: Pick<BaoCaoJci6cs, 'ky_loai' | 'ky_so' | 'nam' | 'cap_bao_cao' | 'don_vi'>
): Promise<BaoCaoJci6cs | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(LIST_COLS)
    .eq('ky_loai', key.ky_loai)
    .eq('ky_so', key.ky_so)
    .eq('nam', key.nam)
    .eq('cap_bao_cao', key.cap_bao_cao)
    .eq('don_vi', key.don_vi || '')
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0] as BaoCaoJci6cs) || null;
};
