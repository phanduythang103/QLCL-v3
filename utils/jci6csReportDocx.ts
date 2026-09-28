import {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, VerticalAlign, PageOrientation, Header, PageNumber, TableLayoutType,
} from 'docx';
import {
  Jci6csReportData, IndicatorId, INDICATOR_ORDER, INDICATOR_META, CAP_BAO_CAO_LABEL,
  describePeriod, formatMetricValue, fmtNum, periodMonths, mkMonth, defaultKienNghi,
  DANH_GIA_OPTIONS, danhGiaChecksOf, datMucTieuFromChecks, xuHuongOf,
} from './jci6csReport';

/**
 * Xuất "Báo cáo kết quả đo lường 06 chỉ số chất lượng" ra Word theo mẫu BVQY103:
 * A4 ngang, lề trên/trái/dưới 2 cm, lề phải 1,6 cm, bảng tự lặp lại dòng tiêu đề.
 */

const FONT = 'Times New Roman';
const SYMBOL_FONT = 'Segoe UI Symbol';
const CM = 567; // twips / cm
const PAGE_W = 16838; // A4 ngang
const MARGIN = { top: 2 * CM, left: 2 * CM, bottom: 2 * CM, right: Math.round(1.6 * CM) };
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right;
const BODY_SIZE = 26; // 13pt
const TABLE_SIZE = 22; // 11pt

const box = (checked: boolean) => (checked ? '☒' : '☐');

type RunSpec = string | { text: string; bold?: boolean; italics?: boolean; underline?: boolean; symbol?: boolean; size?: number; break?: boolean };

/** Tách ký tự ô vuông ra font Segoe UI Symbol để hiển thị đúng như mẫu. */
const runs = (parts: RunSpec[], base: { bold?: boolean; italics?: boolean; size?: number } = {}): TextRun[] => {
  const out: TextRun[] = [];
  parts.forEach(p => {
    const spec = typeof p === 'string' ? { text: p } : p;
    const pieces = spec.text.split(/([☐☒])/);
    pieces.forEach((piece, i) => {
      if (!piece && !(spec.break && i === 0)) return;
      const isBox = piece === '☐' || piece === '☒';
      out.push(new TextRun({
        text: piece,
        font: isBox || spec.symbol ? SYMBOL_FONT : FONT,
        size: spec.size ?? base.size ?? BODY_SIZE,
        bold: spec.bold ?? base.bold,
        italics: spec.italics ?? base.italics,
        underline: spec.underline ? {} : undefined,
        break: spec.break && i === 0 ? 1 : undefined,
      }));
    });
  });
  return out;
};

const para = (parts: RunSpec[], opts: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bold?: boolean; italics?: boolean; size?: number; before?: number; after?: number; indent?: number } = {}) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 60, line: 276 },
    indent: opts.indent ? { firstLine: opts.indent } : undefined,
    children: runs(parts, { bold: opts.bold, italics: opts.italics, size: opts.size }),
  });

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };
const LINE = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const gridBorders = { top: LINE, bottom: LINE, left: LINE, right: LINE, insideHorizontal: LINE, insideVertical: LINE };

/** Ô bảng: mỗi phần tử của `lines` là một đoạn; phần tử là mảng RunSpec. */
const cell = (lines: (RunSpec[] | string)[], opts: { width: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; bold?: boolean; italics?: boolean; shade?: string; columnSpan?: number; size?: number } ) =>
  new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    columnSpan: opts.columnSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.shade ? { fill: opts.shade, color: 'auto', type: 'clear' as any } : undefined,
    margins: { top: 40, bottom: 40, left: 70, right: 70 },
    children: lines.map(l => new Paragraph({
      alignment: opts.align ?? AlignmentType.LEFT,
      spacing: { before: 0, after: 0, line: 252 },
      children: runs(typeof l === 'string' ? [l] : l, { bold: opts.bold, italics: opts.italics, size: opts.size ?? TABLE_SIZE }),
    })),
  });

/** Co giãn độ rộng cột của mẫu cho vừa vùng nội dung. */
const scale = (widths: number[]) => {
  const total = widths.reduce((s, w) => s + w, 0);
  const out = widths.map(w => Math.floor((w / total) * CONTENT_W));
  out[out.length - 1] += CONTENT_W - out.reduce((s, w) => s + w, 0);
  return out;
};

const HEADER_SHADE = 'D9E2F3';

/** Nội dung nhập từ form: mỗi dòng xuống thành một đoạn trong ô. */
const lines = (text?: string) => (text || '').split(/\r?\n/);

const grid = (widths: number[], header: TableRow, body: TableRow[]) =>
  new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: gridBorders,
    rows: [header, ...body],
  });

const headerRow = (widths: number[], labels: string[]) =>
  new TableRow({
    tableHeader: true, // tự lặp lại dòng tiêu đề khi bảng sang trang
    cantSplit: true,
    children: labels.map((l, i) => cell([l], { width: widths[i], align: AlignmentType.CENTER, bold: true, shade: HEADER_SHADE })),
  });


// ---------------------------------------------------------------------------

const buildHeaderBlock = (data: Jci6csReportData): Table => {
  const d = new Date(data.ngayLap);
  const w = scale([5800, 8770]);
  const left: (RunSpec[] | string)[] = data.cap === 'toan_vien'
    ? [[{ text: 'HỌC VIỆN QUÂN Y', size: 26 }], [{ text: 'BỆNH VIỆN QUÂN Y 103', bold: true, underline: true, size: 26 }]]
    : [[{ text: 'BỆNH VIỆN QUÂN Y 103', size: 26 }], [{ text: (data.donVi || '……').toUpperCase(), bold: true, underline: true, size: 26 }]];
  left.push([{ text: `Số: ${data.soVanBan?.trim() || '……/BC-……'}`, size: 26 }]);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: w,
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: [new TableRow({
      children: [
        cell(left, { width: w[0], align: AlignmentType.CENTER, size: 26 }),
        cell([
          [{ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 26 }],
          [{ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, underline: true, size: 28 }],
          [{ text: `Hà Nội, ngày ${String(d.getDate()).padStart(2, '0')} tháng ${String(d.getMonth() + 1).padStart(2, '0')} năm ${d.getFullYear()}`, italics: true, size: 26 }],
        ], { width: w[1], align: AlignmentType.CENTER }),
      ],
    })],
  });
};

const resultTable = (data: Jci6csReportData): Table => {
  const w = scale([481, 3394, 1795, 948, 948, 1147, 1147, 1899, 1496, 1315]);
  const header = headerRow(w, ['TT', 'Chỉ số (mã)', 'Mục tiêu', 'Tử số', 'Mẫu số', 'Kết quả kỳ này', 'Kết quả kỳ trước', 'Cỡ mẫu (thực tế / yêu cầu)', 'Đánh giá', 'Ghi chú']);
  const center = AlignmentType.CENTER;

  const body = INDICATOR_ORDER.map((id, idx) => {
    const r = data.indicators[id];
    const m = INDICATOR_META[id];
    const cur = r.current;
    const ketQua: (RunSpec[] | string)[] = [cur.mau === null && m.unit !== 'pct'
      ? (m.unit === 'per1000lk' ? '— /1.000 lượt' : '— /1.000 ngày')
      : m.unit === 'pct' ? formatMetricValue(id, cur.rate)
        : `${formatMetricValue(id, cur.rate)} /1.000 ${m.unit === 'per1000lk' ? 'lượt' : 'ngày'}`];
    if (id === 'CLS') ketQua.push(`TB: ${cur.avgMinutes != null ? fmtNum(cur.avgMinutes) : '……'} phút`);

    let danhGia: (RunSpec[] | string)[];
    if (r.khongApDung) {
      danhGia = ['Không áp dụng (KAD)'];
    } else {
      // Như mẫu: mỗi ô một dòng; riêng nhóm có tiền tố (Sentinel event) in cả nhóm trên một dòng
      const checks = danhGiaChecksOf(r);
      const opts = DANH_GIA_OPTIONS[id];
      danhGia = [];
      [...new Set(opts.map(o => o.group))].forEach(g => {
        const group = opts.filter(o => o.group === g);
        const items = group.map(o => `${box(!!checks[o.key])} ${o.label}`);
        if (group[0].prefix) danhGia.push(`${group[0].prefix} ${items.join(' ')}`);
        else danhGia.push(...items);
      });
    }

    const thucTe = m.unit === 'pct' ? fmtNum(cur.mau ?? 0, 0) + (id === 'VST' ? ' cơ hội' : id === 'ATPT' ? ' ca' : id === 'CLS' ? ' KQ' : ' lượt')
      : id === 'HANDOVER' ? `${cur.tu} sự cố` : `${cur.tu} ca ngã`;
    const yeuCau = r.sampleRequired ? `${m.yeuCau} → ${r.sampleRequired}` : m.yeuCau;

    const ghiChu = [...r.notes];
    if (r.kad && !r.khongApDung) ghiChu.unshift('KAD - không có số liệu');

    if (r.khongApDung) {
      return new TableRow({
        cantSplit: true,
        children: [
          cell([String(idx + 1)], { width: w[0], align: center }),
          cell([[{ text: m.code, bold: true }], m.ten], { width: w[1] }),
          cell(m.mucTieu.split('; '), { width: w[2], align: center }),
          cell(['—'], { width: w[3], align: center }),
          cell(['—'], { width: w[4], align: center }),
          cell(['KAD'], { width: w[5], align: center, bold: true }),
          cell(['—'], { width: w[6], align: center }),
          cell(['Không áp dụng'], { width: w[7] }),
          cell(danhGia, { width: w[8] }),
          cell(ghiChu, { width: w[9], italics: true, size: 20 }),
        ],
      });
    }

    return new TableRow({
      cantSplit: true,
      children: [
        cell([String(idx + 1)], { width: w[0], align: center }),
        cell([[{ text: m.code, bold: true }], m.ten], { width: w[1] }),
        cell(m.mucTieu.split('; ').map(s => s), { width: w[2], align: center }),
        cell([fmtNum(cur.tu, 0)], { width: w[3], align: center }),
        cell([cur.mau === null ? '—' : fmtNum(cur.mau, 0)], { width: w[4], align: center }),
        cell(ketQua, { width: w[5], align: center, bold: true }),
        cell([formatMetricValue(id, r.previous.rate) + (r.previous.rate === null && m.unit !== 'pct' ? ` (${r.previous.tu})` : '')], { width: w[6], align: center }),
        cell([`Thực tế: ${thucTe}`, `Yêu cầu: ${yeuCau}`], { width: w[7] }),
        cell(danhGia, { width: w[8] }),
        cell(ghiChu.length ? ghiChu : [''], { width: w[9], italics: true, size: 20 }),
      ],
    });
  });

  const t = data.tongHop;
  // Đạt mục tiêu đếm theo ô Đánh giá đã tích (người dùng có thể tích lại trên form)
  const datMucTieu = INDICATOR_ORDER.filter(id => datMucTieuFromChecks(data.indicators[id])).length;
  body.push(new TableRow({
    cantSplit: true,
    children: [cell([[
      { text: 'Tổng hợp: ', bold: true },
      `đạt mục tiêu ${datMucTieu}/6 chỉ số;  đủ cỡ mẫu ${t.duCoMau}/6 chỉ số;  chỉ số không áp dụng (KAD): ${t.kad.length ? t.kad.join(', ') : 'không'};  nộp số liệu đúng hạn (trước ngày 03): ${box(t.dungHan)} Có  ${box(!t.dungHan)} Không`,
    ]], { width: CONTENT_W, columnSpan: 10 })],
  }));

  return grid(w, header, body);
};

const monthlyTable = (data: Jci6csReportData): Table => {
  const w = scale([2400, ...Array(12).fill(800), 2570]);
  const header = headerRow(w, ['Chỉ số', ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`), 'Xu hướng']);
  const isMonthReport = data.period.loai === 'thang';
  const body = INDICATOR_ORDER.map(id => {
    const vals = isMonthReport ? Array(12).fill(null) : data.indicators[id].monthly;
    const trend = xuHuongOf(data, id);
    return new TableRow({
      cantSplit: true,
      children: [
        cell([INDICATOR_META[id].trendLabel], { width: w[0] }),
        ...vals.map((v: number | null, i: number) => cell([v === null ? '' : fmtNum(v, INDICATOR_META[id].unit === 'pct' ? 1 : 2)], { width: w[i + 1], align: AlignmentType.CENTER, size: 20 })),
        cell([`${box(trend === 'tang')} Tăng  ${box(trend === 'giam')} Giảm  ${box(trend === 'on_dinh')} Ổn định`], { width: w[13], size: 20 }),
      ],
    });
  });
  return grid(w, header, body);
};

const tonTaiTable = (data: Jci6csReportData): Table => {
  const w = scale([481, 2299, 5983, 2296, 3511]);
  const header = headerRow(w, ['TT', 'Chỉ số', 'Nội dung tồn tại (nêu số liệu cụ thể)', 'Khoa/đơn vị liên quan', 'Nguyên nhân chủ yếu']);
  const rows = INDICATOR_ORDER.map((id, idx) => {
    const r = data.indicators[id];
    const m = INDICATOR_META[id];
    return new TableRow({
      cantSplit: true,
      children: [
        cell([String(idx + 1)], { width: w[0], align: AlignmentType.CENTER }),
        cell([[{ text: m.code.split('/')[0], bold: true }], m.tonTaiTen], { width: w[1] }),
        cell(lines(r.tonTai), { width: w[2] }),
        cell(lines(r.khoaLienQuan), { width: w[3] }),
        cell(lines(r.nguyenNhan), { width: w[4] }),
      ],
    });
  });
  rows.push(new TableRow({
    cantSplit: true,
    children: [
      cell(['7'], { width: w[0], align: AlignmentType.CENTER }),
      cell([[{ text: 'Chung', bold: true }], 'Quy trình đo lường'], { width: w[1] }),
      cell(lines(data.chung), { width: w[2] }),
      cell(lines(data.chungKhoa), { width: w[3] }),
      cell(lines(data.chungNguyenNhan), { width: w[4] }),
    ],
  }));
  return grid(w, header, rows);
};

const kienNghiTable = (data: Jci6csReportData): Table => {
  const w = scale([481, 4289, 1497, 1996, 1497, 2993, 1817]);
  const header = headerRow(w, ['TT', 'Giải pháp / hành động khắc phục', 'Chỉ số liên quan', 'Đơn vị chủ trì', 'Thời hạn', 'Kết quả cần đạt / minh chứng', 'Đề nghị BGĐ, Hội đồng QLCL']);
  const items = data.kienNghi ?? defaultKienNghi(data);
  const rows = items.map((k, i) => new TableRow({
    cantSplit: true,
    children: [
      cell([String(i + 1)], { width: w[0], align: AlignmentType.CENTER }),
      cell(lines(k.giaiPhap), { width: w[1] }),
      cell(k.chiSo.split('/'), { width: w[2], align: AlignmentType.CENTER }),
      cell(lines(k.chuTri), { width: w[3] }),
      cell([k.thoiHan], { width: w[4], align: AlignmentType.CENTER }),
      cell(lines(k.ketQua), { width: w[5] }),
      cell(lines(k.deNghi), { width: w[6] }),
    ],
  }));
  if (!rows.length) {
    rows.push(new TableRow({ children: w.map((cw, c) => cell([c === 0 ? '1' : ''], { width: cw, align: AlignmentType.CENTER })) }));
  }
  return grid(w, header, rows);
};

const signatureBlock = (data: Jci6csReportData): Table => {
  const w = scale([7001, 7002]);
  const right = data.cap === 'toan_vien' ? 'GIÁM ĐỐC' : 'CHỈ HUY / TRƯỞNG ĐƠN VỊ';
  const blank = ['', '', '', ''];
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: w,
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: [new TableRow({
      cantSplit: true,
      children: [
        cell([[{ text: 'NGƯỜI LẬP BÁO CÁO', bold: true }], [{ text: '(Ký, ghi rõ họ tên)', italics: true }], ...blank, [{ text: data.nguoiLap || '…………………', bold: true }]], { width: w[0], align: AlignmentType.CENTER, size: BODY_SIZE }),
        cell([[{ text: right, bold: true }], [{ text: '(Ký, ghi rõ họ tên, đóng dấu)', italics: true }], ...blank, [{ text: data.nguoiKy?.trim() || '……………………', bold: !!data.nguoiKy?.trim() }]], { width: w[1], align: AlignmentType.CENTER, size: BODY_SIZE }),
      ],
    })],
  });
};

export const buildJci6csDocx = async (data: Jci6csReportData): Promise<Blob> => {
  const p = data.period;
  const kyThang = p.loai === 'thang' ? `Tháng ${String(p.so).padStart(2, '0')}/${p.nam}` : 'Tháng ……/20……';
  const kyQuy = p.loai === 'quy' ? `Quý ${p.so}/${p.nam}` : 'Quý ……/20……';
  const kyNam = p.loai === 'nam' ? `Năm ${p.nam}` : 'Năm 20……';
  const tenDonVi = data.cap === 'toan_vien' ? 'Bệnh viện Quân y 103' : (data.donVi || '……………');
  const center = AlignmentType.CENTER;
  const months = periodMonths(p).map(mkMonth);

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
    sections: [{
      properties: {
        titlePage: true, // trang đầu không đánh số trang như mẫu
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
          margin: { ...MARGIN, header: 709, footer: 709 },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: center, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: BODY_SIZE })] })] }),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      children: [
        buildHeaderBlock(data),
        para([''], {}),
        para([{ text: 'BÁO CÁO', bold: true, size: 28 }], { align: center, after: 0 }),
        para([{ text: 'Kết quả đo lường 06 chỉ số chất lượng an toàn người bệnh theo tiêu chuẩn JCI', bold: true, size: 28 }], { align: center }),
        para([''], {}),
        para([
          { text: 'Kỳ báo cáo: ', bold: true },
          `${box(p.loai === 'thang')} ${kyThang}     ${box(p.loai === 'quy')} ${kyQuy}     ${box(p.loai === 'nam')} ${kyNam}`,
        ], { align: center }),
        para([
          { text: 'Cấp báo cáo: ', bold: true },
          (['khoa', 'co_quan', 'toan_vien'] as const).map(c => `${box(data.cap === c)} ${CAP_BAO_CAO_LABEL[c]}`).join('     '),
        ], { align: center }),
        para([''], {}),
        para([{ text: 'Kính gửi: ', bold: true, italics: true }, { text: data.kinhGui || '……………………………….', italics: true }], { align: center }),
        para([''], {}),
        para([`Thực hiện Chỉ thị số 4508/CT-BVQY103 ngày 25/8/2026 của Giám đốc Bệnh viện, ${tenDonVi} báo cáo kết quả đo lường 06 chỉ số chất lượng ${describePeriod(p).toLowerCase()} (kỳ trước: ${describePeriod(data.previous).toLowerCase()}) như sau:`], { indent: 567 }),
        para([{ text: 'I. BÁO CÁO KẾT QUẢ ĐO LƯỜNG 06 CHỈ SỐ CHẤT LƯỢNG', bold: true }], { before: 120 }),
        para([{ text: '1.1. Kết quả kỳ báo cáo', bold: true, italics: true }]),
        resultTable(data),
        // Báo cáo tháng bỏ hẳn mục 1.2 theo mẫu (chỉ báo cáo quý/năm mới có diễn biến theo tháng)
        ...(p.loai === 'thang' ? [] : [
          para([{ text: '1.2. Diễn biến theo tháng trong kỳ ', bold: true, italics: true }, { text: `(tháng ${months.join(', ')}/${p.nam})`, italics: true }], { before: 160 }),
          monthlyTable(data),
        ]),
        para([{ text: 'II. NHỮNG ĐIỂM TỒN TẠI', bold: true }], { before: 160 }),
        tonTaiTable(data),
        para([{ text: 'III. KIẾN NGHỊ, ĐỀ XUẤT GIẢI PHÁP KHẮC PHỤC', bold: true }], { before: 160 }),
        kienNghiTable(data),
        para([''], {}),
        signatureBlock(data),
      ],
    }],
  });

  return Packer.toBlob(doc);
};

export const jci6csFileName = (data: Pick<Jci6csReportData, 'period' | 'cap' | 'donVi'>): string => {
  const p = data.period;
  const ky = p.loai === 'thang' ? `T${String(p.so).padStart(2, '0')}_${p.nam}` : p.loai === 'quy' ? `Q${p.so}_${p.nam}` : `Nam_${p.nam}`;
  const donVi = data.cap === 'toan_vien' ? 'ToanVien' : (data.donVi || 'DonVi').split(' - ')[0].replace(/[^\p{L}\p{N}]+/gu, '');
  return `BC_06_chi_so_JCI_${ky}_${donVi}.docx`;
};
