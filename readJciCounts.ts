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
