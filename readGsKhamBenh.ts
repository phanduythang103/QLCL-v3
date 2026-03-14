import { supabase } from './supabaseClient';

export interface GsKhamBenh {
  id: string;
  created_at: string;
  ngay_giam_sat: string;
  nguoi_giam_sat: string;
  ma_bn: string;
  gio_dang_ky: string | null;
  gio_kham: string | null;
  gio_ket_qua_xn: string | null;
  gio_ket_qua_cdha: string | null;
  gio_bs_ket_luan: string | null;
  gio_nhan_thuoc: string | null;
  tong_thoi_gian?: number | null; // phút, tính bằng TypeScript
  ghi_chu: string | null;
}

export type GsKhamBenhInput = Omit<GsKhamBenh, 'id' | 'created_at' | 'tong_thoi_gian'>;

/** Tính tổng thời gian khám (phút) từ hai chuỗi HH:mm hoặc HH:mm:ss */
export function calcTongThoiGian(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const [fh, fm] = from.split(':').map(Number);
  const [th, tm] = to.split(':').map(Number);
  const diff = (th * 60 + tm) - (fh * 60 + fm);
  return diff >= 0 ? diff : diff + 1440;
}

export async function fetchGsKhamBenh(): Promise<GsKhamBenh[]> {
  const { data, error } = await supabase
    .from('gs_kham_benh')
    .select('id, created_at, ngay_giam_sat, nguoi_giam_sat, ma_bn, gio_dang_ky, gio_kham, gio_ket_qua_xn, gio_ket_qua_cdha, gio_bs_ket_luan, gio_nhan_thuoc, ghi_chu')
    .order('ngay_giam_sat', { ascending: false });

  if (error) {
    console.error('[fetchGsKhamBenh] error:', error);
    throw error;
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    tong_thoi_gian: calcTongThoiGian(r.gio_dang_ky as string | null, r.gio_nhan_thuoc as string | null),
  })) as GsKhamBenh[];
}

export async function addGsKhamBenh(input: GsKhamBenhInput): Promise<void> {
  const { error } = await supabase.from('gs_kham_benh').insert([input]);
  if (error) { console.error('[addGsKhamBenh] error:', error); throw error; }
}

export async function updateGsKhamBenh(id: string, input: Partial<GsKhamBenhInput>): Promise<void> {
  const { error } = await supabase.from('gs_kham_benh').update(input).eq('id', id);
  if (error) { console.error('[updateGsKhamBenh] error:', error); throw error; }
}

export async function deleteGsKhamBenh(id: string): Promise<void> {
  const { error } = await supabase.from('gs_kham_benh').delete().eq('id', id);
  if (error) { console.error('[deleteGsKhamBenh] error:', error); throw error; }
}
