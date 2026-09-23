/**
 * So khớp khoa/đơn vị giữa bản ghi và từ khoá lọc.
 *
 * Dữ liệu khoa trong DB không đồng nhất: có bản ghi lưu đủ "MÃ - Tên khoa"
 * (A21 - Vật lý - Xạ trị), có bản ghi chỉ lưu tên (Hóa trị) hoặc chỉ mã (B5).
 * Trong khi đó `users.department` luôn ở dạng "MÃ - Tên". So khớp thẳng chuỗi
 * khiến phiếu hợp lệ bị lọc mất, danh sách hiện trống.
 */

/** Hạ chữ thường, gộp khoảng trắng thừa. */
const normalize = (s?: string): string => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Tách "MÃ - Tên khoa" thành [mã, tên]; chuỗi không có mã trả về ['', chuỗi]. */
const splitDept = (s?: string): [string, string] => {
  const n = normalize(s);
  const m = n.match(/^([^\s-]+)\s*-\s*(.+)$/);
  return m ? [m[1], m[2]] : ['', n];
};

/** Từ khoá lọc rỗng / "tất cả" / "all" nghĩa là không lọc. */
export const isAllDepartments = (filterValue?: string): boolean => {
  const n = normalize(filterValue);
  return !n || n === 'tất cả' || n === 'all';
};

/**
 * `true` khi khoa của bản ghi khớp từ khoá lọc: khớp nguyên chuỗi (substring),
 * khớp mã khoa, hoặc khớp phần tên khoa - nên "A20 - Hóa trị" vẫn tìm được
 * bản ghi lưu "Hóa trị" và ngược lại.
 */
export const matchesDepartment = (recordValue?: string, filterValue?: string): boolean => {
  if (isAllDepartments(filterValue)) return true;

  const record = normalize(recordValue);
  const filter = normalize(filterValue);
  if (!record) return false;
  if (record.includes(filter) || filter.includes(record)) return true;

  const [recCode, recName] = splitDept(recordValue);
  const [filCode, filName] = splitDept(filterValue);

  if (recCode && filCode && recCode === filCode) return true;
  if (recName && filName && (recName.includes(filName) || filName.includes(recName))) return true;
  if (recCode && recCode === filName) return true;
  if (filCode && filCode === recName) return true;

  return false;
};

export default matchesDepartment;
