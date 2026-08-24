/**
 * Xuất báo cáo chỉ số Thông báo kết quả báo động cận lâm sàng (IPSG.02.00)
 * ra Excel, khổ A4 dọc. Cấu trúc bám theo bản mẫu "BaoCao_BaoDong".
 */
import { ReportSheetBuilder, buildAndDownloadXlsx, slugify, S, T, N } from './xlsxReport';

/** Khung thời gian yêu cầu: thông báo trực tiếp trong vòng 15 phút */
export const CRITICAL_TIME_LIMIT = 15;

export interface CriticalBucket {
  label: string;
  soLuong: number;
}

export interface CriticalReportData {
  year: string;
  department: string;
  loiNgayGio: number;
  byMonth: { label: string; tong: number; dat: number }[];
  byMonthTime: { label: string; hopLe: number; tongPhut: number }[];
  byQuarter: { label: string; tong: number; dat: number }[];
  byKhoa: CriticalBucket[];
  byTenKq: CriticalBucket[];
  bySoLan: CriticalBucket[];
  totals: { tong: number; dat: number; hopLe: number; tongPhut: number };
}

const ratio = (part: number, total: number) => (total > 0 ? part / total : 0);
const avg = (tongPhut: number, hopLe: number) => (hopLe > 0 ? tongPhut / hopLe : 0);

export const exportCriticalResultsReportExcel = async (d: CriticalReportData) => {
  const b = new ReportSheetBuilder(4);

  b.title('BÁO CÁO KẾT QUẢ TUÂN THỦ - THÔNG BÁO KẾT QUẢ BÁO ĐỘNG CẬN LÂM SÀNG (IPSG.02.00)');
  b.meta(`Năm ${d.year} · Khoa điều trị: ${d.department || 'Tất cả'} · Tổng số kết quả báo động: ${d.totals.tong}`);
  b.meta(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`);
  b.meta(
    d.loiNgayGio > 0
      ? `Kiểm tra dữ liệu: phát hiện ${d.loiNgayGio} bản ghi có Ngày giờ thông báo sớm hơn Ngày giờ có kết quả - cần rà soát lại.`
      : 'Kiểm tra dữ liệu: Không phát hiện bản ghi nào có Ngày giờ thông báo sớm hơn Ngày giờ có kết quả.'
  );
  b.blank();

  // 1. Theo tháng
  b.banner('1. TỔNG HỢP THEO THÁNG', 3);
  const monthHeaderRow =
    b.header(['Tháng', 'Tổng số kết quả báo động\n(Mẫu số)', 'Số đạt khung thời gian\n(Tử số)', 'Tỷ lệ đạt %']) + 1;
  const monthFirstRow = monthHeaderRow + 1;
  d.byMonth.forEach(m =>
    b.push([T(m.label, S.TEXT_CENTER), N(m.tong, S.NUMBER), N(m.dat, S.NUMBER), N(ratio(m.dat, m.tong), S.PERCENT)])
  );
  const monthLastRow = monthFirstRow + d.byMonth.length - 1;
  b.push([
    T('Tổng cộng năm', S.TOTAL_LEFT),
    N(d.totals.tong, S.TOTAL_NUMBER),
    N(d.totals.dat, S.TOTAL_NUMBER),
    N(ratio(d.totals.dat, d.totals.tong), S.TOTAL_PERCENT)
  ]);
  b.blank();

  // 2. Thời gian trung bình theo tháng
  b.banner('2. THỜI GIAN TRUNG BÌNH THÔNG BÁO KẾT QUẢ BÁO ĐỘNG THEO THÁNG', 3);
  b.header(['Tháng', 'Số kết quả hợp lệ\n(loại dòng lỗi ngày giờ)', 'Tổng thời gian\nthông báo (phút)', 'Thời gian trung bình\n(phút)']);
  d.byMonthTime.forEach(m =>
    b.push([
      T(m.label, S.TEXT_CENTER),
      N(m.hopLe, S.NUMBER),
      N(m.tongPhut, S.NUMBER),
      N(Number(avg(m.tongPhut, m.hopLe).toFixed(2)), S.DECIMAL2)
    ])
  );
  b.push([
    T('Trung bình năm', S.TOTAL_LEFT),
    N(d.totals.hopLe, S.TOTAL_NUMBER),
    N(d.totals.tongPhut, S.TOTAL_NUMBER),
    N(Number(avg(d.totals.tongPhut, d.totals.hopLe).toFixed(2)), S.TOTAL_DECIMAL2)
  ]);
  b.note('Các bản ghi bị nghi ngờ nhập sai ngày giờ (Ngày giờ thông báo sớm hơn Ngày giờ có kết quả) được LOẠI KHỎI bảng này để không làm sai lệch số liệu trung bình.');
  b.blank();

  // 3. Theo quý
  b.banner('3. TỔNG HỢP THEO QUÝ', 3);
  b.header(['Quý', 'Tổng số kết quả báo động', 'Số đạt khung thời gian', 'Tỷ lệ đạt %']);
  d.byQuarter.forEach(q =>
    b.push([T(q.label, S.TEXT_CENTER), N(q.tong, S.NUMBER), N(q.dat, S.NUMBER), N(ratio(q.dat, q.tong), S.PERCENT)])
  );
  b.blank();

  // 4..6 - phân tổ theo dạng: Nhãn | Số lượng | Tỷ lệ %
  const breakdown = (banner: string, firstHeader: string, rows: CriticalBucket[], rowHeight?: number) => {
    b.banner(banner, 2);
    b.header([firstHeader, 'Số lượng', 'Tỷ lệ %']);
    const tong = rows.reduce((s, r) => s + r.soLuong, 0);
    rows.forEach(r =>
      b.push([T(r.label, S.TEXT_LEFT), N(r.soLuong, S.NUMBER), N(ratio(r.soLuong, tong), S.PERCENT)], rowHeight)
    );
    b.push([T('Tổng cộng', S.TOTAL_LEFT), N(tong, S.TOTAL_NUMBER), N(tong > 0 ? 1 : 0, S.TOTAL_PERCENT)]);
    b.blank();
  };

  breakdown('4. PHÂN TỔ THEO KHOA ĐIỀU TRỊ (KHOA NHẬN THÔNG BÁO)', 'Khoa điều trị', d.byKhoa);
  breakdown('5. PHÂN TỔ THEO TÊN KẾT QUẢ BÁO ĐỘNG', 'Tên kết quả báo động', d.byTenKq, 28);
  breakdown('6. PHÂN TỔ THEO SỐ LẦN LIÊN HỆ / MỨC ĐỘ LEO THANG', 'Số lần liên hệ', d.bySoLan);
  b.note('Số lần liên hệ được bóc tách tự động từ cụm từ "lần N" trong Ghi chú. Bản ghi không ghi theo cú pháp này được tính vào nhóm "Không ghi nhận số lần".');
  b.blank();

  // 7. Kết quả chung
  const khongDat = d.totals.tong - d.totals.dat;
  b.banner('7. KẾT QUẢ CHUNG (ĐẠT/KHÔNG ĐẠT KHUNG THỜI GIAN ≤15 PHÚT)', 2);
  b.header(['Kết quả', 'Số lượng', 'Tỷ lệ %']);
  b.push([T('Đạt', S.TEXT_CENTER), N(d.totals.dat, S.NUMBER), N(ratio(d.totals.dat, d.totals.tong), S.PERCENT)]);
  b.push([T('Không đạt', S.TEXT_CENTER), N(khongDat, S.NUMBER), N(ratio(khongDat, d.totals.tong), S.PERCENT)]);
  b.note('Mục tiêu IPSG.02.00: 100% kết quả báo động được thông báo trực tiếp trong vòng 15 phút.');
  b.note('Chỉ số IPSG.02.00 thu thập TOÀN BỘ (100%) kết quả báo động phát sinh trong tháng - không áp dụng lấy mẫu.');
  const anchorRow = b.blank() + 1;

  await buildAndDownloadXlsx({
    sheetName: 'BaoCao',
    builder: b,
    colWidths: [46, 18, 18, 18],
    chart: {
      title: 'Xu hướng tỷ lệ đạt khung thời gian ≤15 phút theo tháng',
      xTitle: 'Tháng',
      yTitle: 'Tỷ lệ đạt %',
      seriesName: 'Tỷ lệ đạt %',
      labels: d.byMonth.map(m => m.label),
      values: d.byMonth.map(m => Number(ratio(m.dat, m.tong).toFixed(4))),
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
    fileName: `Bao_cao_KQ_bao_dong_CLS_${d.year}${d.department ? `_${slugify(d.department)}` : ''}.xlsx`
  });
};
