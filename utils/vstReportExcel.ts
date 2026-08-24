/**
 * Xuất báo cáo chỉ số Tuân thủ vệ sinh tay 5 thời điểm WHO (IPSG.05.00)
 * ra Excel, khổ A4 dọc. Cấu trúc bám theo bản mẫu "BaoCao_QuyTrinh".
 *
 * Đơn vị tính của chỉ số chính là "CƠ HỘI" vệ sinh tay (mỗi thời điểm áp dụng
 * trong 1 lượt quan sát = 1 cơ hội), KHÔNG phải theo lượt quan sát.
 */
import { ReportSheetBuilder, buildAndDownloadXlsx, slugify, S, T, N } from './xlsxReport';

/** IPSG.05.00 dùng cỡ mẫu riêng: tối thiểu 200 cơ hội/tháng TOÀN VIỆN */
export const VST_MIN_OPPORTUNITIES = 200;
/** Mục tiêu: ≥85% toàn viện cuối năm, ≥90% tại khoa/khu vực nguy cơ cao */
export const VST_TARGET = 85;
export const VST_TARGET_HIGH_RISK = 90;

export const VST_SAMPLE_NOTE =
  'IPSG.05.00 áp dụng cỡ mẫu riêng (tối thiểu 200 cơ hội/tháng TOÀN VIỆN, phân bổ theo khoa/nhóm nhân viên/thời điểm) - KHÔNG áp dụng bảng cỡ mẫu tối thiểu theo khoa của JCI như các chỉ số khác.';

export interface VstOpportunityBucket {
  label: string;
  coHoi: number;
  dat: number;
}

export interface VstMomentStat {
  label: string;
  dat: number;
  khongDat: number;
  khongApDung: number;
}

export interface VstReportData {
  year: string;
  department: string;
  byMonth: { label: string; coHoi: number; dat: number }[];
  byQuarter: { label: string; coHoi: number; dat: number }[];
  byKhoa: VstOpportunityBucket[];
  byDoiTuong: VstOpportunityBucket[];
  byMoment: VstMomentStat[];
  /** Chỉ số phụ: số lượt quan sát đạt toàn bộ / tổng số lượt */
  luot: { dat: number; khongDat: number };
  totals: { coHoi: number; dat: number };
}

const ratio = (part: number, total: number) => (total > 0 ? part / total : 0);

export const exportVstReportExcel = async (d: VstReportData) => {
  const b = new ReportSheetBuilder(6);
  const tyLeChung = ratio(d.totals.dat, d.totals.coHoi) * 100;

  b.title('BÁO CÁO KẾT QUẢ TUÂN THỦ - VỆ SINH TAY THEO 5 THỜI ĐIỂM WHO (IPSG.05.00)');
  b.meta(`Năm ${d.year} · Khoa/Phòng: ${d.department || 'Tất cả'} · Tổng số cơ hội VST: ${d.totals.coHoi}`);
  b.meta(`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`);
  b.blank();

  // 1. Theo tháng (theo cơ hội)
  b.banner('1. TỔNG HỢP THEO THÁNG (TÍNH THEO TỪNG CƠ HỘI VỆ SINH TAY)', 4);
  const monthHeaderRow =
    b.header(['Tháng', 'Tổng số cơ hội\n(Mẫu số)', 'Số cơ hội đạt\n(Tử số)', 'Tỷ lệ tuân thủ %', `Đạt cỡ mẫu tối thiểu?\n(≥${VST_MIN_OPPORTUNITIES} cơ hội/tháng)`], 42) + 1;
  const monthFirstRow = monthHeaderRow + 1;
  d.byMonth.forEach(m =>
    b.push([
      T(m.label, S.TEXT_CENTER),
      N(m.coHoi, S.NUMBER),
      N(m.dat, S.NUMBER),
      N(ratio(m.dat, m.coHoi), S.PERCENT),
      T(m.coHoi >= VST_MIN_OPPORTUNITIES ? 'Đạt' : 'Chưa đạt', S.TEXT_CENTER)
    ])
  );
  const monthLastRow = monthFirstRow + d.byMonth.length - 1;
  b.push([
    T('Tổng cộng năm', S.TOTAL_LEFT),
    N(d.totals.coHoi, S.TOTAL_NUMBER),
    N(d.totals.dat, S.TOTAL_NUMBER),
    N(ratio(d.totals.dat, d.totals.coHoi), S.TOTAL_PERCENT),
    T('', S.TOTAL_NUMBER)
  ]);
  b.blank();

  // 2. Theo quý
  b.banner('2. TỔNG HỢP THEO QUÝ', 3);
  b.header(['Quý', 'Tổng số cơ hội', 'Số cơ hội đạt', 'Tỷ lệ tuân thủ %']);
  d.byQuarter.forEach(q =>
    b.push([T(q.label, S.TEXT_CENTER), N(q.coHoi, S.NUMBER), N(q.dat, S.NUMBER), N(ratio(q.dat, q.coHoi), S.PERCENT)])
  );
  b.blank();

  const opportunityTable = (banner: string, firstHeader: string, rows: VstOpportunityBucket[]) => {
    b.banner(banner, 3);
    b.header([firstHeader, 'Tổng số cơ hội', 'Số cơ hội đạt', 'Tỷ lệ tuân thủ %']);
    const coHoi = rows.reduce((s, r) => s + r.coHoi, 0);
    const dat = rows.reduce((s, r) => s + r.dat, 0);
    rows.forEach(r =>
      b.push([T(r.label, S.TEXT_LEFT), N(r.coHoi, S.NUMBER), N(r.dat, S.NUMBER), N(ratio(r.dat, r.coHoi), S.PERCENT)])
    );
    b.push([
      T('Tổng cộng', S.TOTAL_LEFT),
      N(coHoi, S.TOTAL_NUMBER),
      N(dat, S.TOTAL_NUMBER),
      N(ratio(dat, coHoi), S.TOTAL_PERCENT)
    ]);
    b.blank();
  };

  // 3. Theo khoa/phòng
  opportunityTable('3. PHÂN TỔ THEO KHOA/PHÒNG (TÍNH THEO CƠ HỘI)', 'Khoa/Phòng', d.byKhoa);
  b.note(VST_SAMPLE_NOTE);
  b.blank();

  // 4. Theo đối tượng được giám sát
  opportunityTable('4. PHÂN TỔ THEO ĐỐI TƯỢNG ĐƯỢC GIÁM SÁT', 'Đối tượng', d.byDoiTuong);

  // 5. Theo từng thời điểm trong 5 thời điểm WHO
  b.banner('5. PHÂN TỔ THEO TỪNG THỜI ĐIỂM VỆ SINH TAY (5 THỜI ĐIỂM WHO)', 5);
  b.header(['Thời điểm', 'Đạt', 'Không đạt', 'Không\náp dụng', 'Tổng\náp dụng', 'Tỷ lệ % Đạt\n(trên tổng áp dụng)']);
  let sumDat = 0, sumKhong = 0, sumNa = 0;
  d.byMoment.forEach(m => {
    const apDung = m.dat + m.khongDat;
    sumDat += m.dat; sumKhong += m.khongDat; sumNa += m.khongApDung;
    b.push(
      [
        T(m.label, S.TEXT_LEFT),
        N(m.dat, S.NUMBER),
        N(m.khongDat, S.NUMBER),
        N(m.khongApDung, S.NUMBER),
        N(apDung, S.NUMBER),
        N(ratio(m.dat, apDung), S.PERCENT)
      ],
      30
    );
  });
  b.push([
    T('Tổng cộng (5 thời điểm)', S.TOTAL_LEFT),
    N(sumDat, S.TOTAL_NUMBER),
    N(sumKhong, S.TOTAL_NUMBER),
    N(sumNa, S.TOTAL_NUMBER),
    N(sumDat + sumKhong, S.TOTAL_NUMBER),
    N(ratio(sumDat, sumDat + sumKhong), S.TOTAL_PERCENT)
  ]);
  b.blank();

  // 6. Chỉ số phụ - tỷ lệ lượt giám sát đạt toàn bộ
  const tongLuot = d.luot.dat + d.luot.khongDat;
  b.banner('6. TỶ LỆ LƯỢT GIÁM SÁT ĐẠT TOÀN BỘ (CHỈ SỐ PHỤ)', 2);
  b.note('Mục này đo tỷ lệ LƯỢT quan sát (1 NVYT tại 1 thời điểm giám sát) đạt TẤT CẢ cơ hội áp dụng trong lượt đó - khác với chỉ số chính (mục 1-5) vốn tính theo từng cơ hội đơn lẻ.');
  b.header(['Kết quả', 'Số lượt', 'Tỷ lệ %']);
  b.push([T('Đạt', S.TEXT_CENTER), N(d.luot.dat, S.NUMBER), N(ratio(d.luot.dat, tongLuot), S.PERCENT)]);
  b.push([T('Không đạt', S.TEXT_CENTER), N(d.luot.khongDat, S.NUMBER), N(ratio(d.luot.khongDat, tongLuot), S.PERCENT)]);
  b.push([T('Tổng cộng', S.TOTAL_LEFT), N(tongLuot, S.TOTAL_NUMBER), N(tongLuot > 0 ? 1 : 0, S.TOTAL_PERCENT)]);
  b.blank();

  // 7. Kết quả chung và so sánh mục tiêu
  b.banner('7. KẾT QUẢ CHUNG VÀ SO SÁNH MỤC TIÊU', 3);
  b.header(['Nội dung', 'Giá trị', 'Mục tiêu', 'Đánh giá']);
  b.push([
    T('Tỷ lệ tuân thủ chung toàn viện (năm báo cáo)', S.TEXT_LEFT),
    N(ratio(d.totals.dat, d.totals.coHoi), S.PERCENT),
    T(`≥ ${VST_TARGET}%`, S.TEXT_CENTER),
    T(tyLeChung >= VST_TARGET ? 'Đạt mục tiêu' : 'Chưa đạt mục tiêu', S.TEXT_CENTER)
  ]);
  b.note(`Mục tiêu riêng ≥${VST_TARGET_HIGH_RISK}% áp dụng cho các khoa/khu vực nguy cơ cao (theo danh sách bệnh viện tự xác định và rà soát định kỳ) - đối chiếu với bảng phân tổ theo Khoa/Phòng ở mục 3.`);
  const anchorRow = b.blank() + 1;

  await buildAndDownloadXlsx({
    sheetName: 'BaoCao',
    builder: b,
    colWidths: [42, 14, 14, 14, 14, 18],
    chart: {
      title: 'Xu hướng tỷ lệ tuân thủ vệ sinh tay theo tháng',
      xTitle: 'Tháng',
      yTitle: 'Tỷ lệ tuân thủ %',
      seriesName: 'Tỷ lệ tuân thủ %',
      labels: d.byMonth.map(m => m.label),
      values: d.byMonth.map(m => Number(ratio(m.dat, m.coHoi).toFixed(4))),
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
    fileName: `Bao_cao_VST_5_thoi_diem_${d.year}${d.department ? `_${slugify(d.department)}` : ''}.xlsx`
  });
};
