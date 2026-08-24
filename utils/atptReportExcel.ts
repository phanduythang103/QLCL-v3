/**
 * Xuất báo cáo chỉ số An toàn phẫu thuật/thủ thuật (IPSG.04.00 / 04.01)
 * ra Excel, khổ A4 dọc. Cấu trúc bám theo bản mẫu "BaoCao_QuyTrinh".
 */
import { ReportSheetBuilder, buildAndDownloadXlsx, slugify, S, T, N } from './xlsxReport';
import { ATPT_CRITERIA, ATPT_GROUPS, JCI_SAMPLE_NOTE } from './atptCriteria';

export interface AtptReportData {
  year: string;
  department: string;
  byMonth: { label: string; n: number; dat: number }[];
  byQuarter: { label: string; n: number; dat: number }[];
  byKhuVuc: { label: string; n: number; dat: number; minSample: number; ok: boolean }[];
  byNhom: { label: string; n: number; dat: number }[];
  /** Thống kê từng tiêu chí trong 23 tiêu chí */
  byCriteria: Record<string, { co: number; khong: number; khongApDung: number }>;
  totals: { n: number; dat: number };
}

const ratio = (part: number, total: number) => (total > 0 ? part / total : 0);

export const exportAtptReportExcel = async (d: AtptReportData) => {
  const b = new ReportSheetBuilder(6);

  b.title('BÁO CÁO KẾT QUẢ TUÂN THỦ - BẢNG KIỂM AN TOÀN PHẪU THUẬT/THỦ THUẬT (IPSG.04.00/04.01)');
  b.meta(`Năm ${d.year} · Khoa/Khu vực: ${d.department || 'Tất cả'} · Tổng số ca giám sát: ${d.totals.n}`);
  b.meta(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`);
  b.blank();

  // 1. Theo tháng
  b.banner('1. TỔNG HỢP THEO THÁNG', 3);
  const monthHeaderRow =
    b.header(['Tháng', 'Tổng số ca được giám sát\n(Mẫu số)', 'Số ca đạt\n(Tử số)', 'Tỷ lệ tuân thủ %']) + 1;
  const monthFirstRow = monthHeaderRow + 1;
  d.byMonth.forEach(m =>
    b.push([T(m.label, S.TEXT_CENTER), N(m.n, S.NUMBER), N(m.dat, S.NUMBER), N(ratio(m.dat, m.n), S.PERCENT)])
  );
  const monthLastRow = monthFirstRow + d.byMonth.length - 1;
  b.push([
    T('Tổng cộng năm', S.TOTAL_LEFT),
    N(d.totals.n, S.TOTAL_NUMBER),
    N(d.totals.dat, S.TOTAL_NUMBER),
    N(ratio(d.totals.dat, d.totals.n), S.TOTAL_PERCENT)
  ]);
  b.blank();

  // 2. Theo quý
  b.banner('2. TỔNG HỢP THEO QUÝ', 3);
  b.header(['Quý', 'Tổng số ca giám sát', 'Số ca đạt', 'Tỷ lệ tuân thủ %']);
  d.byQuarter.forEach(q =>
    b.push([T(q.label, S.TEXT_CENTER), N(q.n, S.NUMBER), N(q.dat, S.NUMBER), N(ratio(q.dat, q.n), S.PERCENT)])
  );
  b.blank();

  // 3. Theo khoa/khu vực + cỡ mẫu JCI
  b.banner('3. PHÂN TỔ THEO KHOA/KHU VỰC (KÈM KIỂM TRA CỠ MẪU TỐI THIỂU THEO JCI)', 5);
  b.header(['Khoa/Khu vực', 'Tổng số ca\n(N)', 'Số ca đạt', 'Tỷ lệ\ntuân thủ %', 'Cỡ mẫu tối thiểu\nyêu cầu (JCI)', 'Đạt cỡ mẫu\ntối thiểu?']);
  d.byKhuVuc.forEach(k =>
    b.push([
      T(k.label, S.TEXT_LEFT),
      N(k.n, S.NUMBER),
      N(k.dat, S.NUMBER),
      N(ratio(k.dat, k.n), S.PERCENT),
      N(k.minSample, S.NUMBER),
      T(k.ok ? 'Đạt' : 'Chưa đạt', S.TEXT_CENTER)
    ])
  );
  b.push([
    T('Tổng cộng', S.TOTAL_LEFT),
    N(d.totals.n, S.TOTAL_NUMBER),
    N(d.totals.dat, S.TOTAL_NUMBER),
    N(ratio(d.totals.dat, d.totals.n), S.TOTAL_PERCENT),
    N(d.byKhuVuc.reduce((s, k) => s + k.minSample, 0), S.TOTAL_NUMBER),
    T('', S.TOTAL_NUMBER)
  ]);
  b.note(JCI_SAMPLE_NOTE);
  b.blank();

  // 4. Theo nhóm PT/TT
  b.banner('4. PHÂN TỔ THEO NHÓM PHẪU THUẬT/THỦ THUẬT', 3);
  b.header(['Nhóm PT/TT', 'Tổng số ca', 'Số ca đạt', 'Tỷ lệ tuân thủ %']);
  d.byNhom.forEach(k =>
    b.push([T(k.label, S.TEXT_LEFT), N(k.n, S.NUMBER), N(k.dat, S.NUMBER), N(ratio(k.dat, k.n), S.PERCENT)], 28)
  );
  b.push([
    T('Tổng cộng', S.TOTAL_LEFT),
    N(d.totals.n, S.TOTAL_NUMBER),
    N(d.totals.dat, S.TOTAL_NUMBER),
    N(ratio(d.totals.dat, d.totals.n), S.TOTAL_PERCENT)
  ]);
  b.blank();

  // 5. Theo từng tiêu chí trong 23 tiêu chí
  b.banner('5. PHÂN TỔ THEO TỪNG TIÊU CHÍ TRONG BẢNG KIỂM (23 TIÊU CHÍ)', 5);
  b.note('"Tổng áp dụng" = Có + Không (loại trừ "Không áp dụng"). Giúp xác định tiêu chí nào hay bị bỏ sót nhất.');

  const groupBlock = (letter: string, group: keyof typeof ATPT_GROUPS) => {
    b.banner(`5${letter}. Nhóm ${ATPT_GROUPS[group]}`, 5);
    b.header(['Tiêu chí', 'Có', 'Không', 'Không\náp dụng', 'Tổng\náp dụng', 'Tỷ lệ % Có\n(trên tổng áp dụng)']);
    ATPT_CRITERIA.filter(c => c.group === group).forEach(c => {
      const s = d.byCriteria[c.id] || { co: 0, khong: 0, khongApDung: 0 };
      const apDung = s.co + s.khong;
      b.push(
        [
          T(c.label, S.TEXT_LEFT),
          N(s.co, S.NUMBER),
          N(s.khong, S.NUMBER),
          N(s.khongApDung, S.NUMBER),
          N(apDung, S.NUMBER),
          N(ratio(s.co, apDung), S.PERCENT)
        ],
        32
      );
    });
    b.blank();
  };

  groupBlock('a', 'SIGN_IN');
  groupBlock('b', 'TIME_OUT');
  groupBlock('c', 'SIGN_OUT');

  // 6. Kết quả chung
  const khongDat = d.totals.n - d.totals.dat;
  b.banner('6. KẾT QUẢ CHUNG (ĐẠT/KHÔNG ĐẠT)', 2);
  b.header(['Kết quả', 'Số lượng', 'Tỷ lệ %']);
  b.push([T('Đạt', S.TEXT_CENTER), N(d.totals.dat, S.NUMBER), N(ratio(d.totals.dat, d.totals.n), S.PERCENT)]);
  b.push([T('Không đạt', S.TEXT_CENTER), N(khongDat, S.NUMBER), N(ratio(khongDat, d.totals.n), S.PERCENT)]);
  b.note('Mục tiêu IPSG.04.00/04.01: 100% ca PT/TT xâm lấn được thực hiện đầy đủ cả 3 bước Sign-in - Time-out - Sign-out.');
  b.note('Tiêu chí được đánh "Không áp dụng" được LOẠI khỏi mẫu số khi tính tỷ lệ đạt của từng ca và của từng tiêu chí.');
  const anchorRow = b.blank() + 1;

  await buildAndDownloadXlsx({
    sheetName: 'BaoCao',
    builder: b,
    colWidths: [46, 12, 12, 13, 13, 18],
    chart: {
      title: 'Xu hướng tỷ lệ tuân thủ Bảng kiểm ATPT theo tháng',
      xTitle: 'Tháng',
      yTitle: 'Tỷ lệ tuân thủ %',
      seriesName: 'Tỷ lệ tuân thủ %',
      labels: d.byMonth.map(m => m.label),
      values: d.byMonth.map(m => Number(ratio(m.dat, m.n).toFixed(4))),
      catCol: 'A',
      valCol: 'D',
      firstRow: monthFirstRow,
      lastRow: monthLastRow,
      headerRow: monthHeaderRow,
      numFmt: '0.0%',
      min: 0,
      max: 1,
      majorUnit: 0.2,
      anchorRow
    },
    fileName: `Bao_cao_ATPT_${d.year}${d.department ? `_${slugify(d.department)}` : ''}.xlsx`
  });
};
