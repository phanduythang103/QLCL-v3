/**
 * Bộ dựng file .xlsx báo cáo theo mẫu Ban QLCL - khổ A4 dọc.
 *
 * File được dựng thủ công (OOXML + JSZip) thay vì dùng SheetJS vì bản cộng đồng
 * của SheetJS không ghi được định dạng ô (nền, font, viền), thẻ <pageSetup>
 * (khổ giấy / hướng giấy) và biểu đồ Excel gốc - đều là những thứ bản mẫu
 * báo cáo yêu cầu.
 *
 * Dùng chung cho các chỉ số JCI: IPSG.01.00 (nhận dạng NB), AOP.02.00 (NB ngã)...
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/** Chỉ số style tương ứng cellXfs trong STYLES_XML */
export const S = {
  DEFAULT: 0,
  TITLE: 1,
  META: 2,
  SECTION: 3,
  HEADER: 4,
  TEXT_LEFT: 5,
  TEXT_CENTER: 6,
  NUMBER: 7,
  PERCENT: 8,
  TOTAL_LEFT: 9,
  TOTAL_NUMBER: 10,
  TOTAL_PERCENT: 11,
  NOTE: 12,
  DECIMAL2: 13,
  TOTAL_DECIMAL2: 14,
  INPUT: 15
} as const;

export type Cell = { v: string | number; s: number; str?: boolean } | null;

export const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const colName = (index: number) => {
  let name = '';
  let i = index;
  while (i >= 0) {
    name = String.fromCharCode(65 + (i % 26)) + name;
    i = Math.floor(i / 26) - 1;
  }
  return name;
};

export const T = (v: string, s: number): Cell => ({ v, s, str: true });
export const N = (v: number, s: number): Cell => ({ v, s });

export class ReportSheetBuilder {
  rows: { cells: Cell[]; height?: number }[] = [];
  merges: string[] = [];

  constructor(public columnCount: number) {}

  /** @returns chỉ số hàng 0-based vừa thêm */
  push(cells: Cell[], height?: number) {
    this.rows.push({ cells, height });
    return this.rows.length - 1;
  }

  blank() {
    return this.push([]);
  }

  merge(row: number, fromCol: number, toCol: number) {
    this.merges.push(`${colName(fromCol)}${row + 1}:${colName(toCol)}${row + 1}`);
  }

  /** Dòng tiêu đề lớn của báo cáo */
  title(text: string) {
    const row = this.push([T(text, S.TITLE)], 24);
    this.merge(row, 0, this.columnCount - 1);
    return row;
  }

  meta(text: string) {
    const row = this.push([T(text, S.META)]);
    this.merge(row, 0, this.columnCount - 1);
    return row;
  }

  /** Thanh tiêu đề mục nền xanh */
  banner(text: string, spanTo = this.columnCount - 1) {
    const row = this.push([T(text, S.SECTION)], 22);
    this.merge(row, 0, spanTo);
    return row;
  }

  note(text: string) {
    const row = this.push([T(text, S.NOTE)]);
    this.merge(row, 0, this.columnCount - 1);
    return row;
  }

  header(labels: string[], height = 34) {
    return this.push(labels.map(l => T(l, S.HEADER)), height);
  }

  toXml() {
    const body = this.rows
      .map((row, rIdx) => {
        const cells = row.cells
          .map((cell, cIdx) => {
            if (!cell) return '';
            const ref = `${colName(cIdx)}${rIdx + 1}`;
            if (cell.str || typeof cell.v === 'string') {
              return `<c r="${ref}" s="${cell.s}" t="inlineStr"><is><t xml:space="preserve">${esc(String(cell.v))}</t></is></c>`;
            }
            return `<c r="${ref}" s="${cell.s}"><v>${cell.v}</v></c>`;
          })
          .join('');
        const ht = row.height ? ` ht="${row.height}" customHeight="1"` : '';
        return `<row r="${rIdx + 1}"${ht}>${cells}</row>`;
      })
      .join('');

    const mergeXml = this.merges.length
      ? `<mergeCells count="${this.merges.length}">${this.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
      : '';

    return { body, mergeXml };
  }
}

export interface ChartSpec {
  /** Tiêu đề biểu đồ */
  title: string;
  xTitle: string;
  yTitle: string;
  seriesName: string;
  /** Nhãn trục X (dùng cho strCache) */
  labels: string[];
  /** Giá trị của chuỗi số liệu */
  values: number[];
  /** Cột chứa nhãn, ví dụ 'A' */
  catCol: string;
  /** Cột chứa giá trị, ví dụ 'D' */
  valCol: string;
  /** Hàng Excel (1-based) đầu và cuối của vùng dữ liệu */
  firstRow: number;
  lastRow: number;
  /** Hàng Excel (1-based) chứa tên chuỗi số liệu */
  headerRow: number;
  /** Định dạng số của trục giá trị, VD '0.0%' hoặc '0.00' */
  numFmt: string;
  /** Giới hạn trục Y (bỏ trống để Excel tự co giãn) */
  min?: number;
  max?: number;
  majorUnit?: number;
  /** Hàng 0-based trên sheet để neo biểu đồ */
  anchorRow: number;
}

export interface XlsxReportSpec {
  sheetName: string;
  builder: ReportSheetBuilder;
  /** Bề rộng từng cột, theo thứ tự A, B, C... */
  colWidths: number[];
  chart?: ChartSpec;
  fileName: string;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="0.0%"/><numFmt numFmtId="165" formatCode="0.00"/></numFmts>
<fonts count="7">
<font><sz val="11"/><name val="Times New Roman"/></font>
<font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Times New Roman"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Times New Roman"/></font>
<font><b/><sz val="11"/><name val="Times New Roman"/></font>
<font><i/><sz val="9"/><color rgb="FF808080"/><name val="Times New Roman"/></font>
<font><b/><sz val="14"/><name val="Times New Roman"/></font>
<font><sz val="11"/><color rgb="FF0070C0"/><name val="Times New Roman"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2E75B6"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDCE6F1"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FF7F7F7F"/></left><right style="thin"><color rgb="FF7F7F7F"/></right><top style="thin"><color rgb="FF7F7F7F"/></top><bottom style="thin"><color rgb="FF7F7F7F"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="16">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="164" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="165" fontId="3" fillId="4" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="6" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const contentTypes = (withChart: boolean) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${withChart ? `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>
<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>` : ''}
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const SHEET_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`;

const DRAWING_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
</Relationships>`;

const drawingXml = (anchorRow: number, columnCount: number) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<xdr:twoCellAnchor>
<xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${anchorRow}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:to><xdr:col>${columnCount}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${anchorRow + 20}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
<xdr:graphicFrame macro="">
<xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="BieuDoXuHuong"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>
<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>
<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rId1"/></a:graphicData></a:graphic>
</xdr:graphicFrame>
<xdr:clientData/>
</xdr:twoCellAnchor>
</xdr:wsDr>`;

const axisTitle = (text: string, rotated: boolean) =>
  `<c:title><c:tx><c:rich><a:bodyPr${rotated ? ' rot="-5400000" vert="horz"' : ''}/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1000" b="1"/></a:pPr><a:r><a:rPr lang="vi-VN" sz="1000" b="1"/><a:t>${esc(text)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>`;

const chartXml = (c: ChartSpec, sheetName: string) => {
  const catRef = `${sheetName}!$${c.catCol}$${c.firstRow}:$${c.catCol}$${c.lastRow}`;
  const valRef = `${sheetName}!$${c.valCol}$${c.firstRow}:$${c.valCol}$${c.lastRow}`;
  const catCache = c.labels.map((l, i) => `<c:pt idx="${i}"><c:v>${esc(l)}</c:v></c:pt>`).join('');
  const valCache = c.values.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join('');
  const scaling =
    `<c:scaling><c:orientation val="minMax"/>` +
    (c.max !== undefined ? `<c:max val="${c.max}"/>` : '') +
    (c.min !== undefined ? `<c:min val="${c.min}"/>` : '') +
    `</c:scaling>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<c:chart>
<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1400" b="1"/></a:pPr><a:r><a:rPr lang="vi-VN" sz="1400" b="1"/><a:t>${esc(c.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>
<c:autoTitleDeleted val="0"/>
<c:plotArea>
<c:layout/>
<c:lineChart>
<c:grouping val="standard"/>
<c:varyColors val="0"/>
<c:ser>
<c:idx val="0"/><c:order val="0"/>
<c:tx><c:strRef><c:f>${sheetName}!$${c.valCol}$${c.headerRow}</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${esc(c.seriesName)}</c:v></c:pt></c:strCache></c:strRef></c:tx>
<c:marker><c:symbol val="circle"/><c:size val="5"/></c:marker>
<c:cat><c:strRef><c:f>${catRef}</c:f><c:strCache><c:ptCount val="${c.labels.length}"/>${catCache}</c:strCache></c:strRef></c:cat>
<c:val><c:numRef><c:f>${valRef}</c:f><c:numCache><c:formatCode>${esc(c.numFmt)}</c:formatCode><c:ptCount val="${c.values.length}"/>${valCache}</c:numCache></c:numRef></c:val>
<c:smooth val="0"/>
</c:ser>
<c:marker val="1"/>
<c:axId val="111111111"/><c:axId val="222222222"/>
</c:lineChart>
<c:catAx>
<c:axId val="111111111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>
${axisTitle(c.xTitle, false)}
<c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>
<c:txPr><a:bodyPr rot="-2700000" vert="horz"/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"/></a:pPr><a:endParaRPr lang="vi-VN"/></a:p></c:txPr>
<c:crossAx val="222222222"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/>
</c:catAx>
<c:valAx>
<c:axId val="222222222"/>${scaling}<c:delete val="0"/><c:axPos val="l"/>
<c:majorGridlines/>
${axisTitle(c.yTitle, true)}
<c:numFmt formatCode="${esc(c.numFmt)}" sourceLinked="0"/>
<c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>
<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="900"/></a:pPr><a:endParaRPr lang="vi-VN"/></a:p></c:txPr>
<c:crossAx val="111111111"/><c:crosses val="autoZero"/><c:crossBetween val="between"/>${c.majorUnit !== undefined ? `<c:majorUnit val="${c.majorUnit}"/>` : ''}
</c:valAx>
</c:plotArea>
<c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend>
<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/>
</c:chart>
</c:chartSpace>`;
};

/** Dựng và tải file .xlsx khổ A4 dọc */
export const buildAndDownloadXlsx = async (spec: XlsxReportSpec) => {
  const { body, mergeXml } = spec.builder.toXml();
  const cols = spec.colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${cols}</cols>
<sheetData>${body}</sheetData>
${mergeXml}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="portrait" scale="100" fitToWidth="1" fitToHeight="0" horizontalDpi="300" verticalDpi="300"/>
${spec.chart ? '<drawing r:id="rId1"/>' : ''}
</worksheet>`;

  const zip = new JSZip();
  zip.file('[Content_Types].xml', contentTypes(!!spec.chart));
  zip.file('_rels/.rels', ROOT_RELS);
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${esc(spec.sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
  );
  zip.file('xl/_rels/workbook.xml.rels', WORKBOOK_RELS);
  zip.file('xl/styles.xml', STYLES_XML);
  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  if (spec.chart) {
    zip.file('xl/worksheets/_rels/sheet1.xml.rels', SHEET_RELS);
    zip.file('xl/drawings/drawing1.xml', drawingXml(spec.chart.anchorRow, spec.builder.columnCount));
    zip.file('xl/drawings/_rels/drawing1.xml.rels', DRAWING_RELS);
    zip.file('xl/charts/chart1.xml', chartXml(spec.chart, spec.sheetName));
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE'
  });

  saveAs(blob, spec.fileName);
};

export const slugify = (value: string) => value.replace(/[^\p{L}\p{N}]+/gu, '-');
