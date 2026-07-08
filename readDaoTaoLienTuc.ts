import { supabase } from './supabaseClient';

export interface BaiHocLienTuc {
  id: string;
  tieu_de: string;
  mo_ta?: string;
  file_path: string;
  file_name: string;
  file_type: string;
  trang_thai: 'NHAP' | 'XUAT_BAN';
  nguoi_tao_id?: string;
  nguoi_tao_name?: string;
  created_at?: string;
  bai_kiem_tra?: BaiKiemTra | null;
}

export interface CauHoi {
  noi_dung: string;
  lua_chon: string[];
  dap_an_dung: number;
  giai_thich?: string;
}

export interface BaiKiemTra {
  id: string;
  bai_hoc_id: string;
  tieu_de: string;
  diem_dat: number;
  thoi_gian_phut: number;
  cau_hoi: CauHoi[];
}

function normalizeQuestions(value: unknown): CauHoi[] {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { return []; }
  }
  if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
    parsed = (parsed as { cau_hoi?: unknown }).cau_hoi;
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item: any) => {
    let choices = item && item.lua_chon != null ? item.lua_chon : item && item.luaChon != null ? item.luaChon : item && item.options != null ? item.options : [];
    if (typeof choices === 'string') {
      try { choices = JSON.parse(choices); } catch { choices = choices.split('|'); }
    }
    const rawContent = item && item.noi_dung != null ? item.noi_dung : item && item.cau_hoi != null ? item.cau_hoi : item && item.question != null ? item.question : '';
    const noiDung = String(rawContent).trim();
    const luaChon = Array.isArray(choices) ? choices.map(String).filter(Boolean) : [];
    const rawAnswer = item && item.dap_an_dung != null ? item.dap_an_dung : item && item.dapAnDung != null ? item.dapAnDung : item && item.correct_answer != null ? item.correct_answer : 0;
    const answer = Number(rawAnswer);
    return noiDung && luaChon.length >= 2 && answer >= 0 && answer < luaChon.length ? [{ ...item, noi_dung: noiDung, lua_chon: luaChon, dap_an_dung: answer }] : [];
  });
}

export async function fetchBaiHocLienTuc() {
  const { data, error } = await supabase.from('dtlt_bai_hoc').select('*, bai_kiem_tra:dtlt_bai_kiem_tra(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    bai_kiem_tra: (() => {
      const quiz = Array.isArray(item.bai_kiem_tra) ? item.bai_kiem_tra[0] || null : item.bai_kiem_tra;
      return quiz ? { ...quiz, cau_hoi: normalizeQuestions(quiz.cau_hoi) } : null;
    })(),
  })) as BaiHocLienTuc[];
}

export async function addBaiHocLienTuc(record: Omit<BaiHocLienTuc, 'id' | 'bai_kiem_tra'>) {
  const { data, error } = await supabase.from('dtlt_bai_hoc').insert(record).select().single();
  if (error) throw error;
  return data as BaiHocLienTuc;
}

export async function addBaiKiemTra(record: Omit<BaiKiemTra, 'id'>) {
  const { data, error } = await supabase.from('dtlt_bai_kiem_tra').upsert(record, { onConflict: 'bai_hoc_id' }).select().single();
  if (error) throw error;
  return data as BaiKiemTra;
}

export async function deleteBaiHocLienTuc(id: string) {
  const { error } = await supabase.from('dtlt_bai_hoc').delete().eq('id', id);
  if (error) throw error;
}

export async function batDauHoc(record: { bai_hoc_id: string; user_id: string; user_name?: string; bat_dau_luc: string }) {
  const { data, error } = await supabase.from('dtlt_lich_su_hoc').insert({ ...record, thoi_gian_giay: 0, hoan_thanh: false }).select().single();
  if (error) throw error;
  return data as { id: string; bat_dau_luc: string };
}

export async function ketThucHoc(id: string, batDauLuc: string) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(batDauLuc).getTime()) / 1000));
  const { error } = await supabase.from('dtlt_lich_su_hoc').update({
    ket_thuc_luc: new Date().toISOString(), thoi_gian_giay: seconds, hoan_thanh: true,
  }).eq('id', id);
  if (error) throw error;
}

export async function luuKetQuaKiemTra(record: Record<string, unknown>) {
  const { error } = await supabase.from('dtlt_ket_qua_kiem_tra').insert(record);
  if (error) throw error;
}

export async function fetchLichSuDaoTao(userId?: string) {
  let hoc = supabase.from('dtlt_lich_su_hoc').select('*, bai_hoc:dtlt_bai_hoc(tieu_de)').order('bat_dau_luc', { ascending: false });
  let thi = supabase.from('dtlt_ket_qua_kiem_tra').select('*, bai_hoc:dtlt_bai_hoc(tieu_de)').order('nop_bai_luc', { ascending: false });
  if (userId) { hoc = hoc.eq('user_id', userId); thi = thi.eq('user_id', userId); }
  const [hocResult, thiResult] = await Promise.all([hoc, thi]);
  if (hocResult.error) throw hocResult.error;
  if (thiResult.error) throw thiResult.error;
  return { lichSuHoc: hocResult.data || [], ketQua: thiResult.data || [] };
}
