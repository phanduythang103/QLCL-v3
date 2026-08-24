/**
 * Xuất báo cáo chỉ số Sự cố liên quan đến bàn giao thông tin người bệnh
 * (IPSG.02.01 / QPS.03.04) ra Excel, khổ A4 dọc.
 * Cấu trúc bám theo bản mẫu "BaoCao_SuCo" của Ban QLCL.
 */
import { ReportSheetBuilder, buildAndDownloadXlsx, slugify, S, T, N } from './xlsxReport';

export interface HandoverBucket {
  label: string;
  soLuong: number;
}

export interface HandoverReportData {
  year: string;
  department: string;
  byMonth: { label: string; soSuCo: number; luotKham: number }[];
  byQuarter: { label: string; soSuCo: number; luotKham: number }[];
  byKhoa: HandoverBucket[];
  byMucDo: HandoverBucket[];
  byLoaiHinh: HandoverBucket[];
  byDenNb: HandoverBucket[];
  byRca: HandoverBucket[];
  totals: { soSuCo: number; luotKham: number };
}

/** Tỷ suất trên 1.000 lượt khám, điều trị */
export const handoverRate = (soSuCo: number, luotKham: number) =>
  luotKham > 0 ? (soSuCo / luotKham) * 1000 : 0;

const ratio = (part: number, total: number) => (total > 0 ? part / total : 0);

export const exportHandoverReportExcel = async (d: HandoverReportData) => {
  const b = new ReportSheetBuilder(4);

  b.title('BÁO CÁO CHỈ SỐ SỰ CỐ LIÊN QUAN ĐẾN BÀN GIAO THÔNG TIN NGƯỜI BỆNH (IPSG.02.01 / QPS.03.04)');
  b.meta(`Năm ${d.year} · Khoa/Phòng: ${d.department || 'Tất cả'} · Tổng số sự cố: ${d.totals.soSuCo}`);
  b.meta(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`);
  b.blank();

  // 1. Mẫu số - tổng lượt khám, điều trị theo tháng
  b.banner('1. TỔNG SỐ LƯỢT KHÁM, ĐIỀU TRỊ THEO THÁNG (MẪU SỐ - NHẬP TỪ PHÒNG KẾ HOẠCH TỔNG HỢP)', 1);
  b.header(['Tháng', 'Tổng lượt khám, điều trị\n(nội trú + ngoại trú)']);
  d.byMonth.forEach(m => b.push([T(m.label, S.TEXT_CENTER), N(m.luotKham, S.INPUT)]));
  b.push([T('Tổng cộng năm', S.TOTAL_LEFT), N(d.totals.luotKham, S.TOTAL_NUMBER)]);
  b.note('Nguồn: Phòng Kế hoạch tổng hợp.');
  b.blank();

  // 2. Tổng hợp sự cố bàn giao theo tháng
  b.banner('2. TỔNG HỢP SỰ CỐ BÀN GIAO THEO THÁNG', 3);
  const monthHeaderRow =
    b.header(['Tháng', 'Tử số\n(Số sự cố ghi nhận)', 'Mẫu số\n(Tổng lượt khám)', 'Tỷ suất /1.000 lượt']) + 1;
  const monthFirstRow = monthHeaderRow + 1;
  d.byMonth.forEach(m =>
    b.push([
      T(m.label, S.TEXT_CENTER),
      N(m.soSuCo, S.NUMBER),
      N(m.luotKham, S.NUMBER),
      N(Number(handoverRate(m.soSuCo, m.luotKham).toFixed(2)), S.DECIMAL2)
    ])
  );
  const monthLastRow = monthFirstRow + d.byMonth.length - 1;
  b.push([
    T('Tổng cộng năm', S.TOTAL_LEFT),
    N(d.totals.soSuCo, S.TOTAL_NUMBER),
    N(d.totals.luotKham, S.TOTAL_NUMBER),
    N(Number(handoverRate(d.totals.soSuCo, d.totals.luotKham).toFixed(2)), S.TOTAL_DECIMAL2)
  ]);
  b.blank();

  // 3. Theo quý
  b.banner('3. TỔNG HỢP THEO QUÝ', 3);
  b.header(['Quý', 'Tử số', 'Mẫu số', 'Tỷ suất /1.000 lượt']);
  d.byQuarter.forEach(q =>
    b.push([
      T(q.label, S.TEXT_CENTER),
      N(q.soSuCo, S.NUMBER),
      N(q.luotKham, S.NUMBER),
      N(Number(handoverRate(q.soSuCo, q.luotKham).toFixed(2)), S.DECIMAL2)
    ])
  );
  b.blank();

  // 4..8 - các bảng phân tổ cùng dạng: Nhãn | Số lượng | Tỷ lệ %
  const breakdown = (banner: string, firstHeader: string, rows: HandoverBucket[], rowHeight?: number) => {
    b.banner(banner, 2);
    b.header([firstHeader, 'Số lượng', 'Tỷ lệ %']);
    const tong = rows.reduce((s, r) => s + r.soLuong, 0);
    rows.forEach(r =>
      b.push([T(r.label, S.TEXT_LEFT), N(r.soLuong, S.NUMBER), N(ratio(r.soLuong, tong), S.PERCENT)], rowHeight)
    );
    b.push([T('Tổng cộng', S.TOTAL_LEFT), N(tong, S.TOTAL_NUMBER), N(tong > 0 ? 1 : 0, S.TOTAL_PERCENT)]);
    b.blank();
  };

  breakdown('4. PHÂN TỔ THEO KHOA/PHÒNG LIÊN QUAN', 'Khoa/Phòng', d.byKhoa);
  b.note('Một sự cố liên quan đến 2 đơn vị được tính cho cả khoa bàn giao và khoa tiếp nhận, nên tổng ở mục này có thể lớn hơn tổng số sự cố.');
  breakdown('5. PHÂN TỔ THEO MỨC ĐỘ NGHIÊM TRỌNG', 'Mức độ nghiêm trọng', d.byMucDo);
  breakdown('6. PHÂN TỔ THEO LOẠI HÌNH BÀN GIAO LIÊN QUAN', 'Loại hình bàn giao liên quan', d.byLoaiHinh, 30);
  breakdown('7. PHÂN TỔ THEO ĐẾN NGƯỜI BỆNH / NEAR-MISS', 'Loại', d.byDenNb);
  breakdown('8. TỶ LỆ ĐÃ PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (RCA)', 'Đã phân tích RCA', d.byRca);
  b.note('Ghi chú: QPS.03.04 ME2 yêu cầu phân tích chuyên sâu/RCA đối với sự cố an toàn người bệnh hàng tháng.');
  b.note('Chỉ số sự cố bàn giao (QPS.03.04) thu thập TOÀN BỘ (100%) sự cố được báo cáo qua hệ thống báo cáo sự cố y khoa trực tuyến - không áp dụng lấy mẫu.');
  const anchorRow = b.blank() + 1;

  await buildAndDownloadXlsx({
    sheetName: 'BaoCao',
    builder: b,
    colWidths: [44, 18, 18, 20],
    chart: {
      title: 'Xu hướng tỷ suất sự cố bàn giao /1.000 lượt theo tháng',
      xTitle: 'Tháng',
      yTitle: 'Tỷ suất /1.000 lượt',
      seriesName: 'Tỷ suất/1.000 lượt',
      labels: d.byMonth.map(m => m.label),
      values: d.byMonth.map(m => Number(handoverRate(m.soSuCo, m.luotKham).toFixed(2))),
      catCol: 'A',
      valCol: 'D',
      firstRow: monthFirstRow,
      lastRow: monthLastRow,
      headerRow: monthHeaderRow,
      numFmt: '0.00',
      min: 0,
      anchorRow
    },
    fileName: `Bao_cao_su_co_ban_giao_${d.year}${d.department ? `_${slugify(d.department)}` : ''}.xlsx`
  });
};
