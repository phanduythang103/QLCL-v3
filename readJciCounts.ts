import { supabase } from './supabaseClient';

/**
 * Số phiếu đã thu thập của từng chỉ số JCI, dùng cho lưới "Danh mục chỉ số".
 * Khoá khớp với `id` của từng chỉ số trong JCIModule.
 */
export interface JciIndicatorCounts {
  FALL_RATE: number;
  PATIENT_IDENTIFICATION: number;
  CRITICAL_RESULTS: number;
  HANDOVER_INCIDENTS: number;
  SURGERY_SAFETY: number;
  HAND_HYGIENE: number;
}

const TABLES: Record<keyof JciIndicatorCounts, string> = {
  FALL_RATE: 'jci_fall_incidents',
  PATIENT_IDENTIFICATION: 'gs_ndnb',
  CRITICAL_RESULTS: 'jci_critical_results',
  HANDOVER_INCIDENTS: 'jci_handover_incidents',
  SURGERY_SAFETY: 'giam_sat_atpt',
  HAND_HYGIENE: 'gs_vst'
};

/** Cột thời gian dùng để lọc theo khoảng ngày của từng chỉ số */
const DATE_COLS: Record<keyof JciIndicatorCounts, string> = {
  FALL_RATE: 'thoi_gian_nga',
  PATIENT_IDENTIFICATION: 'ngay_giam_sat',
  CRITICAL_RESULTS: 'thoi_gian_co_kq',
  HANDOVER_INCIDENTS: 'thoi_gian_su_co',
  SURGERY_SAFETY: 'ngay_giam_sat',
  HAND_HYGIENE: 'ngay_giam_sat'
};

/** Khoảng thời gian lọc (ISO strings); null = tất cả thời gian */
export interface JciCountRange {
  start: string;
  end: string;
}

/** Đếm bản ghi mà không tải dữ liệu về (head + count exact) */
const countRows = async (table: string, dateCol?: string, range?: JciCountRange | null): Promise<number> => {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (range && dateCol) {
    query = query.gte(dateCol, range.start).lte(dateCol, range.end);
  }

  const { count, error } = await query;

  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }
  return count || 0;
};

export const fetchJciIndicatorCounts = async (range?: JciCountRange | null): Promise<JciIndicatorCounts> => {
  const keys = Object.keys(TABLES) as (keyof JciIndicatorCounts)[];
  const results = await Promise.all(keys.map(k => countRows(TABLES[k], DATE_COLS[k], range)));
  return keys.reduce((acc, key, i) => {
    acc[key] = results[i];
    return acc;
  }, {} as JciIndicatorCounts);
};

/**
 * Thống kê từng chỉ số cho lưới "Danh mục chỉ số":
 *  - total: tổng số phiếu đã thu thập
 *  - dat:   số phiếu đạt (null với chỉ số dạng nhật ký sự cố - không có đạt/không đạt)
 * Cách xác định "đạt" bám đúng theo từng module để số liệu khớp nhau.
 */
export interface JciIndicatorStat {
  total: number;
  dat: number | null;
}

export type JciIndicatorStats = Record<keyof JciIndicatorCounts, JciIndicatorStat>;

/** Đếm bản ghi "đạt" bằng head+count với 1 điều kiện lọc cột (không tải dữ liệu). */
const countRowsWhere = async (
  table: string,
  filterCol: string,
  filterVal: any,
  dateCol?: string,
  range?: JciCountRange | null
): Promise<number> => {
  let query = supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(filterCol, filterVal);

  if (range && dateCol) {
    query = query.gte(dateCol, range.start).lte(dateCol, range.end);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`Error counting ${table} (${filterCol}=${filterVal}):`, error);
    return 0;
  }
  return count || 0;
};

/**
 * Với các chỉ số cần tính "đạt" phía client (dựa trên checklist_data), tải về
 * đúng các cột cần thiết rồi tính tổng/đạt trong JS để khớp với module.
 */
const totalAndDatFromRows = async (
  table: string,
  selectCols: string,
  isDat: (row: any) => boolean,
  dateCol: string,
  range?: JciCountRange | null
): Promise<JciIndicatorStat> => {
  let query = supabase.from(table).select(selectCols);
  if (range && dateCol) {
    query = query.gte(dateCol, range.start).lte(dateCol, range.end);
  }
  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return { total: 0, dat: 0 };
  }
  const rows = data || [];
  return { total: rows.length, dat: rows.filter(isDat).length };
};

/** NDNB đạt: tất cả tiêu chí (c1, c2) đều "Có" - khớp computeKetQua trong NdnbMonitoringModule. */
const ndnbIsDat = (row: any): boolean => {
  const cd = row?.checklist_data || {};
  return ['c1', 'c2'].every(id => cd?.[id] === true);
};

/** VST lượt đạt: mọi cơ hội áp dụng trong lượt đều đạt - khớp luotDat trong HandHygieneModule. */
const vstIsDat = (row: any): boolean => {
  const moments = row?.checklist_data?.moments || [];
  const coHoi = moments.filter((m: any) => m.co_hoi).length;
  const dat = moments.filter((m: any) => m.co_hoi && m.compliance).length;
  return coHoi > 0 && dat === coHoi;
};

export const fetchJciIndicatorStats = async (range?: JciCountRange | null): Promise<JciIndicatorStats> => {
  const [
    fallTotal,
    handoverTotal,
    ndnb,
    vst,
    atptTotal,
    atptDat,
    critTotal,
    critDat,
  ] = await Promise.all([
    // Chỉ số dạng nhật ký sự cố -> chỉ đếm tổng, không có "đạt"
    countRows(TABLES.FALL_RATE, DATE_COLS.FALL_RATE, range),
    countRows(TABLES.HANDOVER_INCIDENTS, DATE_COLS.HANDOVER_INCIDENTS, range),
    // Chỉ số tuân thủ tính "đạt" theo checklist -> tải cột cần thiết rồi tính trong JS
    totalAndDatFromRows(TABLES.PATIENT_IDENTIFICATION, 'checklist_data, ngay_giam_sat', ndnbIsDat, DATE_COLS.PATIENT_IDENTIFICATION, range),
    totalAndDatFromRows(TABLES.HAND_HYGIENE, 'checklist_data, ngay_giam_sat', vstIsDat, DATE_COLS.HAND_HYGIENE, range),
    // ATPT: kết quả đạt lưu ở cột ket_qua (ghi khi lưu phiếu)
    countRows(TABLES.SURGERY_SAFETY, DATE_COLS.SURGERY_SAFETY, range),
    countRowsWhere(TABLES.SURGERY_SAFETY, 'ket_qua', 'Đạt', DATE_COLS.SURGERY_SAFETY, range),
    // Báo động CLS: đạt khung thời gian lưu ở cột dat_khung_tg
    countRows(TABLES.CRITICAL_RESULTS, DATE_COLS.CRITICAL_RESULTS, range),
    countRowsWhere(TABLES.CRITICAL_RESULTS, 'dat_khung_tg', true, DATE_COLS.CRITICAL_RESULTS, range),
  ]);

  return {
    FALL_RATE: { total: fallTotal, dat: null },
    HANDOVER_INCIDENTS: { total: handoverTotal, dat: null },
    PATIENT_IDENTIFICATION: ndnb,
    HAND_HYGIENE: vst,
    SURGERY_SAFETY: { total: atptTotal, dat: atptDat },
    CRITICAL_RESULTS: { total: critTotal, dat: critDat },
  };
};
