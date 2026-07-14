import { supabase } from './supabaseClient';

export interface RcaTimelineRow {
  id?: string;
  rca_id?: string;
  thu_tu: number;
  thoi_diem?: string;
  vi_tri?: string;
  lam_sang?: string;
  can_lam_sang_xu_tri?: string;
  la_thoi_diem_su_co?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RcaAnalysisRecord {
  id?: string;
  scyk_id: string;
  bien_ban_xac_minh_id?: number | null;
  trang_thai?: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'CLOSED';
  ngay_phan_tich?: string;
  nguoi_phan_tich?: string;
  nhom_phan_tich?: any[];
  ma_scyk?: string;
  so_benh_an?: string;
  ma_nguoi_benh?: string;
  gioi?: string;
  tuoi?: number | null;
  thoi_gian_vao_vien?: string;
  khoa_xay_ra_su_co?: string;
  vao_khoa_luc?: string;
  khoa_tiep_nhan_sau?: string;
  khoa_tiep_nhan_luc?: string;
  thoi_diem_su_co?: string;
  tinh_bao_cao?: string;
  tien_su_benh_su?: string;
  chan_doan_ban_dau?: string;
  dien_bien_su_co?: string;
  xu_tri_su_co?: string;
  dien_tien_sau_su_co?: string;
  loai_su_co?: string;
  muc_do_ton_hai?: string;
  phan_loai_nguy_co?: string;
  kha_nang_phong_ngua?: string;
  phan_tich_chan_doan_tiep_nhan?: string;
  phan_tich_theo_doi_truoc_su_co?: string;
  phan_tich_cap_cuu_khi_su_co?: string;
  phan_tich_hoi_suc_sau_su_co?: string;
  ket_luan_phu_hop_xu_tri?: string;
  yeu_to_nguoi_benh?: string;
  yeu_to_nhan_vien?: string;
  yeu_to_moi_truong_thiet_bi?: string;
  yeu_to_quy_trinh_nhiem_vu?: string;
  yeu_to_to_chuc_quan_ly?: string;
  nguyen_nhan_goc_re?: string;
  van_de_phat_hien_them?: string;
  bai_hoc_kinh_nghiem?: string[];
  khuyen_nghi_he_thong?: string;
  khuyen_nghi_cong_cu_quy_trinh?: string;
  khuyen_nghi_phan_mem_cntt?: string;
  khuyen_nghi_kiem_tra_giam_sat?: string;
  xem_xet_trach_nhiem_hanh_chinh_hs?: string;
  xem_xet_trach_nhiem_chuyen_mon_theo_doi?: string;
  nguon_bao_cao?: Record<string, any>;
  nguon_bien_ban_xac_minh?: Record<string, any>;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export type RcaAnalysisWithTimeline = RcaAnalysisRecord & {
  timeline?: RcaTimelineRow[];
};

export interface RcaPrefillSuggestion extends Partial<RcaAnalysisRecord> {
  noi_dung_xac_minh?: string;
  y_kien_tham_gia?: string;
}

const RCA_SELECT = '*';
const RCA_COLUMNS = [
  'scyk_id', 'bien_ban_xac_minh_id', 'trang_thai', 'ngay_phan_tich', 'nguoi_phan_tich', 'nhom_phan_tich',
  'ma_scyk', 'so_benh_an', 'ma_nguoi_benh', 'gioi', 'tuoi', 'thoi_gian_vao_vien', 'khoa_xay_ra_su_co',
  'vao_khoa_luc', 'khoa_tiep_nhan_sau', 'khoa_tiep_nhan_luc', 'thoi_diem_su_co', 'tinh_bao_cao',
  'tien_su_benh_su', 'chan_doan_ban_dau', 'dien_bien_su_co', 'xu_tri_su_co', 'dien_tien_sau_su_co',
  'loai_su_co', 'muc_do_ton_hai', 'phan_loai_nguy_co', 'kha_nang_phong_ngua',
  'phan_tich_chan_doan_tiep_nhan', 'phan_tich_theo_doi_truoc_su_co', 'phan_tich_cap_cuu_khi_su_co',
  'phan_tich_hoi_suc_sau_su_co', 'ket_luan_phu_hop_xu_tri', 'yeu_to_nguoi_benh', 'yeu_to_nhan_vien',
  'yeu_to_moi_truong_thiet_bi', 'yeu_to_quy_trinh_nhiem_vu', 'yeu_to_to_chuc_quan_ly', 'nguyen_nhan_goc_re',
  'van_de_phat_hien_them', 'bai_hoc_kinh_nghiem', 'khuyen_nghi_he_thong', 'khuyen_nghi_cong_cu_quy_trinh',
  'khuyen_nghi_phan_mem_cntt', 'khuyen_nghi_kiem_tra_giam_sat', 'xem_xet_trach_nhiem_hanh_chinh_hs',
  'xem_xet_trach_nhiem_chuyen_mon_theo_doi', 'nguon_bao_cao', 'nguon_bien_ban_xac_minh', 'created_by', 'updated_by'
] as const;

function sanitizeRcaRecord(record: Partial<RcaAnalysisRecord>): Partial<RcaAnalysisRecord> {
  const cleaned: Partial<RcaAnalysisRecord> = {};
  for (const column of RCA_COLUMNS) {
    if (Object.prototype.hasOwnProperty.call(record, column)) {
      (cleaned as any)[column] = (record as any)[column];
    }
  }
  return cleaned;
}

export async function fetchRcaAnalyses(): Promise<RcaAnalysisRecord[]> {
  const { data, error } = await supabase
    .from('rca_phan_tich_scyk')
    .select(RCA_SELECT)
    .order('ngay_phan_tich', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRcaTimeline(rcaId: string): Promise<RcaTimelineRow[]> {
  const { data, error } = await supabase
    .from('rca_dau_chan_nguoi_benh')
    .select('*')
    .eq('rca_id', rcaId)
    .order('thu_tu', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchRcaWithTimeline(id: string): Promise<RcaAnalysisWithTimeline | null> {
  const { data, error } = await supabase
    .from('rca_phan_tich_scyk')
    .select(RCA_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const timeline = await fetchRcaTimeline(id);
  return { ...data, timeline };
}

export async function fetchRcaPrefillSuggestion(scykId: string): Promise<RcaPrefillSuggestion | null> {
  const { data, error } = await supabase
    .from('rca_scyk_goi_y_tu_dien')
    .select('*')
    .eq('scyk_id', scykId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function addRcaAnalysis(record: RcaAnalysisRecord): Promise<RcaAnalysisRecord> {
  const { data, error } = await supabase
    .from('rca_phan_tich_scyk')
    .insert([sanitizeRcaRecord(record)])
    .select(RCA_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function updateRcaAnalysis(id: string, updates: Partial<RcaAnalysisRecord>): Promise<RcaAnalysisRecord> {
  const { data, error } = await supabase
    .from('rca_phan_tich_scyk')
    .update(sanitizeRcaRecord(updates))
    .eq('id', id)
    .select(RCA_SELECT)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRcaAnalysis(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('rca_phan_tich_scyk')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function replaceRcaTimeline(rcaId: string, rows: RcaTimelineRow[]): Promise<RcaTimelineRow[]> {
  const { error: deleteError } = await supabase
    .from('rca_dau_chan_nguoi_benh')
    .delete()
    .eq('rca_id', rcaId);
  if (deleteError) throw deleteError;

  const cleanedRows = rows
    .map((row, index) => ({
      rca_id: rcaId,
      thu_tu: index + 1,
      thoi_diem: row.thoi_diem || null,
      vi_tri: row.vi_tri || null,
      lam_sang: row.lam_sang || null,
      can_lam_sang_xu_tri: row.can_lam_sang_xu_tri || null,
      la_thoi_diem_su_co: Boolean(row.la_thoi_diem_su_co),
    }))
    .filter(row => row.thoi_diem || row.vi_tri || row.lam_sang || row.can_lam_sang_xu_tri);

  if (cleanedRows.length === 0) return [];

  const { data, error } = await supabase
    .from('rca_dau_chan_nguoi_benh')
    .insert(cleanedRows)
    .select('*')
    .order('thu_tu', { ascending: true });
  if (error) throw error;
  return data || [];
}