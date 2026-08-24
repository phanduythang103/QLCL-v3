/**
 * Xuất báo cáo chỉ số Tỷ suất người bệnh ngã (AOP.02.00) ra Excel, khổ A4 dọc.
 * Cấu trúc bám theo bản mẫu "BaoCao_SuCo" của Ban QLCL.
 */
import { ReportSheetBuilder, buildAndDownloadXlsx, slugify, S, T, N } from './xlsxReport';

/** Mốc tham chiếu quốc tế AHRQ: 0,5 ca ngã / 1.000 ngày nằm viện */
export const FALL_BENCHMARK = 0.5;

export interface FallBucket {
  label: string;
  soCa: number;
}

export interface FallReportData {
  year: string;
  department: string;
  byMonth: { label: string; soCa: number; ngayNamVien: number }[];
  byQuarter: { label: string; soCa: number; ngayNamVien: number }[];
  byKhoa: FallBucket[];
  byMucNguyCo: FallBucket[];
  byThangDiem: FallBucket[];
  byDiaDiem: FallBucket[];
  byTonThuong: FallBucket[];
  byCanThiep: FallBucket[];
  byTaiDanhGia: FallBucket[];
  byDanhGiaMoiTruong: FallBucket[];
  totals: { soCa: number; ngayNamVien: number };
}

/** Tỷ suất trên 1.000 ngày nằm viện */
export const fallRate = (soCa: number, ngayNamVien: number) =>
  ngayNamVien > 0 ? (soCa / ngayNamVien) * 1000 : 0;

export const benchmarkLabel = (soCa: number, ngayNamVien: number) => {
  if (ngayNamVien <= 0) return 'Chưa có mẫu số';
  return fallRate(soCa, ngayNamVien) <= FALL_BENCHMARK ? 'Đạt mốc' : 'Vượt mốc';
};

const ratio = (part: number, total: number) => (total > 0 ? part / total : 0);

export const exportFallReportExcel = async (d: FallReportData) => {
  const b = new ReportSheetBuilder(5);

  b.title('BÁO CÁO CHỈ SỐ TỶ SUẤT NGƯỜI BỆNH NGÃ (AOP.02.00)');
  b.meta(`Năm ${d.year} · Khoa điều trị: ${d.department || 'Tất cả'} · Tổng số ca ngã: ${d.totals.soCa}`);
  b.meta(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`);
  b.blank();

  // 1. Mẫu số - tổng số ngày nằm viện theo tháng
  b.banner('1. TỔNG SỐ NGÀY NẰM VIỆN THEO THÁNG (MẪU SỐ - NHẬP TỪ PHÒNG KHTH)', 1);
  b.header(['Tháng', 'Tổng số ngày nằm\nviện thực tế (nội trú)']);
  d.byMonth.forEach(m => b.push([T(m.label, S.TEXT_CENTER), N(m.ngayNamVien, S.INPUT)]));
  b.push([T('Tổng cộng năm', S.TOTAL_LEFT), N(d.totals.ngayNamVien, S.TOTAL_NUMBER)]);
  b.blank();

  // 2. Tổng hợp sự cố ngã theo tháng
  b.banner('2. TỔNG HỢP SỰ CỐ NGÃ THEO THÁNG', 4);
  const monthHeaderRow =
    b.header(['Tháng', 'Tử số\n(Số ca ngã)', 'Mẫu số\n(Tổng ngày\nnằm viện)', 'Tỷ suất /1.000\nngày nằm viện', 'So với mốc tham\nchiếu (0,5/1.000 ngày)'], 42) + 1;
  const monthFirstRow = monthHeaderRow + 1;
  d.byMonth.forEach(m =>
    b.push([
      T(m.label, S.TEXT_CENTER),
      N(m.soCa, S.NUMBER),
      N(m.ngayNamVien, S.NUMBER),
      N(Number(fallRate(m.soCa, m.ngayNamVien).toFixed(2)), S.DECIMAL2),
      T(benchmarkLabel(m.soCa, m.ngayNamVien), S.TEXT_CENTER)
    ])
  );
  const monthLastRow = monthFirstRow + d.byMonth.length - 1;
  b.push([
    T('Tổng cộng năm', S.TOTAL_LEFT),
    N(d.totals.soCa, S.TOTAL_NUMBER),
    N(d.totals.ngayNamVien, S.TOTAL_NUMBER),
    N(Number(fallRate(d.totals.soCa, d.totals.ngayNamVien).toFixed(2)), S.TOTAL_DECIMAL2),
    T(benchmarkLabel(d.totals.soCa, d.totals.ngayNamVien), S.TOTAL_NUMBER)
  ]);
  b.blank();

  // 3. Theo quý
  b.banner('3. TỔNG HỢP THEO QUÝ', 4);
  b.header(['Quý', 'Tử số', 'Mẫu số', 'Tỷ suất /1.000 ngày', 'So với mốc tham chiếu']);
  d.byQuarter.forEach(q =>
    b.push([
      T(q.label, S.TEXT_CENTER),
      N(q.soCa, S.NUMBER),
      N(q.ngayNamVien, S.NUMBER),
      N(Number(fallRate(q.soCa, q.ngayNamVien).toFixed(2)), S.DECIMAL2),
      T(benchmarkLabel(q.soCa, q.ngayNamVien), S.TEXT_CENTER)
    ])
  );
  b.blank();

  // 4..10 - các bảng phân tổ đều cùng dạng: Nhãn | Số ca ngã | Tỷ lệ %
  const breakdown = (
    banner: string,
    firstHeader: string,
    rows: FallBucket[],
    opts: { totalRow?: boolean; rowHeight?: number } = {}
  ) => {
    const { totalRow = true, rowHeight } = opts;
    b.banner(banner, 2);
    b.header([firstHeader, 'Số ca ngã', 'Tỷ lệ %']);
    const tong = rows.reduce((s, r) => s + r.soCa, 0);
    rows.forEach(r =>
      b.push([T(r.label, S.TEXT_LEFT), N(r.soCa, S.NUMBER), N(ratio(r.soCa, tong), S.PERCENT)], rowHeight)
    );
    if (totalRow) {
      b.push([
        T('Tổng cộng', S.TOTAL_LEFT),
        N(tong, S.TOTAL_NUMBER),
        N(tong > 0 ? 1 : 0, S.TOTAL_PERCENT)
      ]);
    }
    b.blank();
  };

  breakdown('4. PHÂN TỔ THEO KHOA ĐIỀU TRỊ', 'Khoa điều trị', d.byKhoa);
  breakdown('5. PHÂN TỔ THEO MỨC ĐỘ NGUY CƠ NGÃ (TẠI LẦN ĐÁNH GIÁ GẦN NHẤT)', 'Mức độ nguy cơ', d.byMucNguyCo);
  breakdown('5b. PHÂN TỔ THEO THANG ĐIỂM ÁP DỤNG (NHÓM NGƯỜI BỆNH)', 'Thang điểm áp dụng', d.byThangDiem, { rowHeight: 30 });
  breakdown('6. PHÂN TỔ THEO ĐỊA ĐIỂM/HOÀN CẢNH XẢY RA NGÃ', 'Địa điểm/hoàn cảnh', d.byDiaDiem);
  breakdown('7. PHÂN TỔ THEO MỨC ĐỘ TỔN THƯƠNG', 'Mức độ tổn thương', d.byTonThuong);
  breakdown('8. TỶ LỆ CAN THIỆP ĐANG ÁP DỤNG TRƯỚC KHI NGÃ', 'Can thiệp trước khi ngã', d.byCanThiep);
  breakdown('9. TỶ LỆ ĐÃ TÁI ĐÁNH GIÁ + ĐIỀU CHỈNH CAN THIỆP SAU NGÃ', 'Đã tái đánh giá', d.byTaiDanhGia);
  breakdown('10. TỶ LỆ ĐÃ ĐÁNH GIÁ MÔI TRƯỜNG TẠI CHỖ SAU NGÃ', 'Đã đánh giá môi trường', d.byDanhGiaMoiTruong);

  b.note('Mốc tham chiếu quốc tế: 0,5 ca ngã/1.000 ngày nằm viện (Agency for Healthcare Research and Quality - AHRQ, U.S. Department of Health and Human Services).');
  b.note('Chỉ số AOP.02.00 thu thập TOÀN BỘ (100%) trường hợp ngã đã thực sự xảy ra - không áp dụng lấy mẫu, không tính near-miss (suýt ngã, được hỗ trợ kịp thời).');
  const anchorRow = b.blank() + 1;

  await buildAndDownloadXlsx({
    sheetName: 'BaoCao',
    builder: b,
    colWidths: [38, 16, 16, 16, 20],
    chart: {
      title: 'Xu hướng tỷ suất người bệnh ngã theo tháng',
      xTitle: 'Tháng',
      yTitle: 'Tỷ suất /1.000 ngày nằm viện',
      seriesName: 'Tỷ suất /1.000 ngày nằm viện',
      labels: d.byMonth.map(m => m.label),
      values: d.byMonth.map(m => Number(fallRate(m.soCa, m.ngayNamVien).toFixed(2))),
      catCol: 'A',
      valCol: 'D',
      firstRow: monthFirstRow,
      lastRow: monthLastRow,
      headerRow: monthHeaderRow,
      numFmt: '0.00',
      min: 0,
      anchorRow
    },
    fileName: `Bao_cao_ty_suat_NB_nga_${d.year}${d.department ? `_${slugify(d.department)}` : ''}.xlsx`
  });
};
