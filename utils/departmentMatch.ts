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

/** Chuỗi dạng mã khoa (B1, A12, 232...): có chữ số, không có khoảng trắng. */
const isCodeLike = (s: string): boolean => /\d/.test(s) && !/\s/.test(s);

/**
 * Tách "MÃ - Tên khoa" thành [mã, tên]; chuỗi không có mã trả về ['', chuỗi].
 * Phần trước dấu "-" là mã khi trông như mã ("B5-Gây mê", "B6 - Tai - Mũi - Họng"), hoặc khi
 * có khoảng trắng quanh dấu "-" và phần sau không còn " - " ("KKB - Khoa Khám bệnh").
 * Nhờ vậy tên có gạch nối như "Gan-Mật-Tụy", "Tai - Mũi - Họng" không bị tách nhầm.
 */
const splitDept = (s?: string): [string, string] => {
  const n = normalize(s);
  const m = n.match(/^([^\s-]+)(\s*)-(\s*)(.+)$/);
  if (!m) return ['', n];
  const [, code, before, after, name] = m;
  const spaced = !!before && !!after && !name.includes(' - ');
  return isCodeLike(code) || spaced ? [code, name] : ['', n];
};

/** Giá trị khoa có kèm mã ("A12 - Thận - lọc máu"). */
export const hasDeptCode = (s?: string): boolean => !!splitDept(s)[0];

/** Từ khoá lọc rỗng / "tất cả" / "all" nghĩa là không lọc. */
export const isAllDepartments = (filterValue?: string): boolean => {
  const n = normalize(filterValue);
  return !n || n === 'tất cả' || n === 'all';
};

/**
 * Khoá so sánh tên khoa: bỏ dấu nối "-", "&", ",", "/" và chữ "và" giữa các vế,
 * nên "Thận - lọc máu", "Thận và Lọc máu", "Thận & lọc máu" cùng là một khoa.
 */
const nameKey = (s: string): string =>
  normalize(s.replace(/[-–&,/]/g, ' ').replace(/(^|\s)và(?=\s|$)/g, ' '));

/**
 * Hai tên khoa trùng nhau hoặc tên này chứa tên kia. Không so chuỗi con với mã khoa:
 * "b11 - hồi sức ngoại" chứa "b1" nhưng B1 (Chấn thương chung) là khoa khác.
 */
const namesOverlap = (a: string, b: string): boolean => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (isCodeLike(a) || isCodeLike(b)) return false;
  const [ka, kb] = [nameKey(a), nameKey(b)];
  const [shorter, longer] = ka.length <= kb.length ? [ka, kb] : [kb, ka];
  return shorter.length >= 3 && longer.includes(shorter);
};

/**
 * Hai giá trị khoa chỉ cùng một khoa (dùng để gộp dòng tổng hợp) - chặt hơn
 * `matchesDepartment`: tên phải trùng hẳn (sau `nameKey`), không chấp nhận tên chứa tên.
 */
export const sameDepartment = (a?: string, b?: string): boolean => {
  if (!normalize(a) || !normalize(b)) return false;
  const [codeA, nameA] = splitDept(a);
  const [codeB, nameB] = splitDept(b);
  if (codeA && codeB) return codeA === codeB;
  if (codeA && nameB === codeA) return true;
  if (codeB && nameA === codeB) return true;
  return nameKey(nameA) === nameKey(nameB);
};

/**
 * `true` khi khoa của bản ghi khớp từ khoá lọc:
 *  - cả hai có mã ("B1 - ...", "B11 - ...") -> chỉ so mã;
 *  - một bên chỉ lưu mã hoặc tên -> khớp đúng mã, hoặc khớp phần tên khoa
 *    (nên "A20 - Hóa trị" vẫn tìm được bản ghi lưu "Hóa trị" và ngược lại).
 */
export const matchesDepartment = (recordValue?: string, filterValue?: string): boolean => {
  if (isAllDepartments(filterValue)) return true;

  const record = normalize(recordValue);
  const filter = normalize(filterValue);
  if (!record) return false;
  if (record === filter) return true;

  const [recCode, recName] = splitDept(recordValue);
  const [filCode, filName] = splitDept(filterValue);

  if (recCode && filCode) return recCode === filCode;
  if (filCode) return recName === filCode || namesOverlap(recName, filName);
  if (recCode) return filName === recCode || namesOverlap(recName, filName);
  return namesOverlap(recName, filName);
};

export default matchesDepartment;
