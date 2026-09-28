import { supabase } from '../supabaseClient';

/**
 * Tải TOÀN BỘ bản ghi của một bảng, không bị cắt ở 1.000 dòng.
 *
 * PostgREST (Supabase) mặc định chỉ trả tối đa 1.000 dòng mỗi lượt gọi và
 * KHÔNG báo lỗi khi cắt bớt - bảng vượt ngưỡng sẽ âm thầm mất phiếu trên giao
 * diện (gs_ndnb từng mất 19 phiếu theo cách này). Hàm này gọi nhiều lượt bằng
 * `.range()` cho tới khi lấy hết.
 */
const PAGE_SIZE = 1000;

export interface FetchAllOptions {
  /** Cột sắp xếp; bắt buộc có để phân trang ổn định, không lặp/sót dòng. */
  orderBy: string;
  ascending?: boolean;
  /** Danh sách cột cần lấy, mặc định lấy hết. */
  columns?: string;
}

export const fetchAllRows = async <T = any>(
  table: string,
  { orderBy, ascending = false, columns = '*' }: FetchAllOptions
): Promise<T[]> => {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending })
      // Thứ tự phụ theo id để 2 bản ghi cùng ngày không đổi chỗ giữa các trang
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data || []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
};

export default fetchAllRows;
