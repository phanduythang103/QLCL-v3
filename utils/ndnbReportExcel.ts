/**
 * Xuất báo cáo quy trình Nhận dạng người bệnh (IPSG.01.00) ra Excel, khổ A4 dọc.
 * Phần dựng OOXML nằm ở ./xlsxReport
 */
import { ReportSheetBuilder, buildAndDownloadXlsx, slugify, S, T, N } from './xlsxReport';

export interface NdnbReportData {
  year: string;
  department: string;
  byMonth: { label: string; n: number; dat: number }[];
  byQuarter: { label: string; n: number; dat: number }[];
  byKhoa: { khoa: string; n: number; dat: number; minSample: number; ok: boolean }[];
  byCriteria: { label: string; co: number; khong: number }[];
  byThoiDiem: { label: string; luot: number }[];
  totals: { n: number; dat: number };
}

const ratio = (dat: number, n: number) => (n > 0 ? dat / n : 0);

export const exportNdnbReportExcel = async (d: NdnbReportData) => {
  const b = new ReportSheetBuilder(6);

  b.title('BÁO CÁO QUY TRÌNH NHẬN DẠNG NGƯỜI BỆNH (IPSG.01.00)');
  b.meta(`Năm ${d.year} · Đơn vị: ${d.department || 'Tất cả'} · Tổng số lượt giám sát: ${d.totals.n}`);
  b.meta(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`);
  b.blank();

  // 1. Theo tháng
  b.banner('1. TỔNG HỢP THEO THÁNG', 3);
  const monthHeaderRow = b.header(['Tháng', 'Tổng lượt quan sát\n(Mẫu số)', 'Số lượt đạt\n(Tử số)', 'Tỷ lệ tuân thủ %']) + 1;
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
  b.header(['Quý', 'Tổng lượt quan sát', 'Số lượt đạt', 'Tỷ lệ tuân thủ %']);
  d.byQuarter.forEach(q =>
    b.push([T(q.label, S.TEXT_CENTER), N(q.n, S.NUMBER), N(q.dat, S.NUMBER), N(ratio(q.dat, q.n), S.PERCENT)])
  );
  b.blank();

  // 3. Theo khoa/phòng + cỡ mẫu tối thiểu JCI
  b.banner('3. TỔNG HỢP THEO KHOA/PHÒNG (KÈM KIỂM TRA CỠ MẪU TỐI THIỂU THEO JCI)', 5);
  b.header(['Khoa/Phòng', 'Tổng quan sát\n(N)', 'Số đạt', 'Tỷ lệ\ntuân thủ %', 'Cỡ mẫu tối thiểu\nyêu cầu (JCI)', 'Đạt cỡ mẫu\ntối thiểu?']);
  d.byKhoa.forEach(k =>
    b.push([
      T(k.khoa, S.TEXT_LEFT),
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
    N(d.byKhoa.reduce((s, k) => s + k.minSample, 0), S.TOTAL_NUMBER),
    T('', S.TOTAL_NUMBER)
  ]);
  b.note('Ghi chú cỡ mẫu (theo hướng dẫn JCI): N≥640 → 128; N=320-639 → 20%N; N=64-319 → 64; N<64 → 100%N (lấy toàn bộ mẫu).');
  b.blank();

  // 4. Theo từng tiêu chí câu hỏi
  b.banner('4. TỔNG HỢP THEO KẾT QUẢ TỪNG TIÊU CHÍ CÂU HỎI', 3);
  b.header(['Tiêu chí', 'Có (đạt)', 'Không (không đạt)', 'Tỷ lệ % Có']);
  d.byCriteria.forEach(c =>
    b.push(
      [T(c.label, S.TEXT_LEFT), N(c.co, S.NUMBER), N(c.khong, S.NUMBER), N(ratio(c.co, c.co + c.khong), S.PERCENT)],
      30
    )
  );
  b.blank();

  // 5. Theo thời điểm nhận dạng
  b.banner('5. TỔNG HỢP THEO THỜI ĐIỂM NHẬN DẠNG NGƯỜI BỆNH', 2);
  b.header(['Thời điểm', 'Số lượt', 'Tỷ lệ %']);
  const tongThoiDiem = d.byThoiDiem.reduce((s, t) => s + t.luot, 0);
  d.byThoiDiem.forEach(t =>
    b.push([T(t.label, S.TEXT_LEFT), N(t.luot, S.NUMBER), N(ratio(t.luot, tongThoiDiem), S.PERCENT)])
  );
  b.push([
    T('Tổng cộng', S.TOTAL_LEFT),
    N(tongThoiDiem, S.TOTAL_NUMBER),
    N(tongThoiDiem > 0 ? 1 : 0, S.TOTAL_PERCENT)
  ]);
  b.blank();

  // 6. Kết quả chung
  const khongDat = d.totals.n - d.totals.dat;
  b.banner('6. KẾT QUẢ CHUNG (ĐẠT/KHÔNG ĐẠT)', 2);
  b.header(['Kết quả', 'Số lượng', 'Tỷ lệ %']);
  b.push([T('Đạt', S.TEXT_CENTER), N(d.totals.dat, S.NUMBER), N(ratio(d.totals.dat, d.totals.n), S.PERCENT)]);
  b.push([T('Không đạt', S.TEXT_CENTER), N(khongDat, S.NUMBER), N(ratio(khongDat, d.totals.n), S.PERCENT)]);
  b.note('Mục tiêu IPSG.01.00: 100% lượt nhân viên y tế kiểm tra đúng thông tin định danh bằng hai thông số.');
  const anchorRow = b.blank() + 1;

  await buildAndDownloadXlsx({
    sheetName: 'BaoCao',
    builder: b,
    colWidths: [34, 15, 14, 14, 17, 15],
    chart: {
      title: 'Xu hướng tỷ lệ tuân thủ định danh theo tháng',
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
    fileName: `Bao_cao_quy_trinh_NDNB_${d.year}${d.department ? `_${slugify(d.department)}` : ''}.xlsx`
  });
};
