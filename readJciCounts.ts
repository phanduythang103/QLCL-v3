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

/** Đếm bản ghi mà không tải dữ liệu về (head + count exact) */
const countRows = async (table: string): Promise<number> => {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(`Error counting ${table}:`, error);
    return 0;
  }
  return count || 0;
};

export const fetchJciIndicatorCounts = async (): Promise<JciIndicatorCounts> => {
  const keys = Object.keys(TABLES) as (keyof JciIndicatorCounts)[];
  const results = await Promise.all(keys.map(k => countRows(TABLES[k])));
  return keys.reduce((acc, key, i) => {
    acc[key] = results[i];
    return acc;
  }, {} as JciIndicatorCounts);
};
