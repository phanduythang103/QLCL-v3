/**
 * Utility: Tạo PDF Biên bản xác minh sự cố y khoa → upload Supabase bucket 'scyk'
 *
 * Khổ A4: 210 x 297 mm
 * Lề: trên 20mm, dưới 20mm, trái 25mm, phải 20mm
 * Content area: 165mm x 257mm
 *
 * Approach:
 *  1. Render HTML (width=624px = 165mm, NO padding) vào iframe ẩn
 *  2. html2canvas → 1 canvas dài (toàn bộ nội dung)
 *  3. Chia canvas thành slice theo từng trang A4
 *  4. Đặt mỗi slice vào PDF tại (leftMargin, topMargin) → margin đều ở mọi trang
 */

import { supabase } from '../supabaseClient';

export interface BienBanPdfData {
  id?: string;
  scyk_id?: string;
  thoi_gian_bat_dau: string;
  dia_diem?: string;
  thanh_phan?: Array<{ ho_ten: string; chuc_vu?: string; don_vi?: string; vai_tro: string }>;
  nguoi_tham_du?: Array<{ ho_ten: string; chuc_vu?: string; don_vi?: string }>;
  noi_dung_xac_minh?: string;
  ket_qua_xac_minh?: string;
  y_kien_tham_gia?: string;
  ma_baocao_scyk?: string;
}

// ─── PDF Layout Constants ─────────────────────────────────────────────────────
// A4: 210 x 297 mm. Margins: top=20, bottom=20, left=25, right=20
const MM_LEFT = 25;   // mm
const MM_TOP = 20;   // mm
const MM_RIGHT = 20;   // mm
const MM_BOTTOM = 20;   // mm
const MM_PAGE_W = 210;  // mm
const MM_PAGE_H = 297;  // mm
const MM_CONT_W = MM_PAGE_W - MM_LEFT - MM_RIGHT;  // 165mm content width
const MM_CONT_H = MM_PAGE_H - MM_TOP - MM_BOTTOM; // 257mm content height per page

// HTML render width = 165mm @ 96dpi = 165 * 96/25.4 ≈ 624px
const HTML_W = 624; // px  (content width only, no padding)
// Scale for html2canvas (2x for sharp text)
const SCALE = 2;
// ─────────────────────────────────────────────────────────────────────────────

function loadScript(src: string, globalKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any)[globalKey]) { resolve(); return; }
    const ex = document.querySelector(`script[src="${src}"]`);
    if (ex) { ex.addEventListener('load', () => resolve()); ex.addEventListener('error', reject); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Cannot load: ${src}`));
    document.head.appendChild(s);
  });
}

function dottedLines(n: number, content?: string): string {
  if (content && content.trim())
    return `<div style="white-space:pre-wrap;text-align:justify;line-height:22px;min-height:${n * 22}px;">${content}</div>`;
  return Array.from({ length: n }, () =>
    `<div style="border-bottom:1px dotted #555;height:22px;margin-top:2px;"></div>`
  ).join('');
}

/** HTML nội dung (width=624px, KHÔNG có padding — margin được thêm bởi jsPDF) */
function buildHTML(data: BienBanPdfData): string {
  const dt = data.thoi_gian_bat_dau ? new Date(data.thoi_gian_bat_dau) : null;
  const gio = dt ? String(dt.getHours()).padStart(2, '0') : '......';
  const phut = dt ? String(dt.getMinutes()).padStart(2, '0') : '......';
  const ngay = dt ? String(dt.getDate()).padStart(2, '0') : '......';
  const thang = dt ? String(dt.getMonth() + 1).padStart(2, '0') : '......';
  const nam = dt ? String(dt.getFullYear()) : '..........';
  const dia = data.dia_diem || '...........................................................................';
  const ma = data.ma_baocao_scyk || '';

  const thanhPhanHTML = (data.thanh_phan || []).map(m => {
    const role = m.vai_tro === 'CHU_TRI' ? 'chủ trì xác minh sự cố y khoa.'
      : m.vai_tro === 'THU_KY' ? 'thư ký biên bản xác minh.'
        : m.vai_tro === 'NGUOI_CHUNG_KIEN' ? 'là người chứng kiến.'
          : 'thành viên đoàn xác minh sự cố y khoa.';
    return `
<table style="width:100%;border-collapse:collapse;margin-bottom:5px;">
  <tr>
    <td style="width:50%;padding:0;vertical-align:top;">Ông/bà: <strong>${m.ho_ten || '..............................'}</strong></td>
    <td style="padding:0;vertical-align:top;">Chức vụ: ${m.chuc_vu || '..............................'}</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:0;">Đơn vị: ${m.don_vi || '................................'} ${role}</td>
  </tr>
</table>`;
  }).join('');

  const thamDuHTML = (data.nguoi_tham_du || []).length > 0
    ? (data.nguoi_tham_du || []).map(m =>
      `<table style="width:100%;border-collapse:collapse;margin-bottom:5px;">
  <tr>
    <td style="width:50%;padding:0;vertical-align:top;">Ông/bà: <strong>${m.ho_ten || '..............................'}</strong></td>
    <td style="padding:0;vertical-align:top;">Chức vụ: ${m.chuc_vu || '..............................'}</td>
  </tr>
  <tr>
    <td colspan="2" style="padding:0;">Đơn vị: ${m.don_vi || '................................'}</td>
  </tr>
</table>`
    ).join('')
    : `<p style="font-style:italic;color:#555;">(Không có)</p>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html,body{
    width:${HTML_W}px;
    font-family:'Times New Roman',Times,serif;
    font-size:19px;         /* 14pt @ 96dpi: 14×96/72 ≈ 18.67px → 19px */
    line-height:1.55;
    color:#000;
    background:#fff;
    margin:0;padding:0;
  }
  p{margin:0;padding:0;word-wrap:break-word;overflow-wrap:break-word;}
  .c{text-align:center;}
  .b{font-weight:bold;}
  .u{text-decoration:underline;}
  .up{text-transform:uppercase;}
  .s{margin-top:10px;}
</style>
</head>
<body>

<div class="c b">
  <p class="up" style="font-size:19px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
  <p class="u" style="font-size:17px;">Độc lập – Tự do – Hạnh phúc</p>
</div>

<p class="c b up" style="font-size:20px;margin-top:18px;">BIÊN BẢN XÁC MINH SỰ CỐ Y KHOA</p>
${ma ? `<p class="c" style="margin-top:2px;">(${ma})</p>` : ''}

<div class="s">
  <p>Hồi ${gio} giờ ${phut} ngày ${ngay} tháng ${thang} năm ${nam} tại ${dia}</p>
  <p class="b" style="margin-top:6px;">Chúng tôi gồm:</p>
  ${thanhPhanHTML}
  <p class="b" style="margin-top:6px;">Với sự tham dự của (1):</p>
  ${thamDuHTML}
</div>

<div class="s">
  <p>Tiến hành xác minh về việc:</p>
  <div style="margin-top:4px;">${dottedLines(5, data.noi_dung_xac_minh)}</div>
</div>

<p class="c b up" style="font-size:14px;margin:14px 0 6px;">KẾT QUẢ XÁC MINH</p>
${dottedLines(10, data.ket_qua_xac_minh)}

<div class="s">
  <p>Biên bản kết thúc vào hồi.......... giờ .......... ngày ......... tháng ...... năm .....................</p>
</div>

<div class="s">
  <p>Ý kiến của những người tham gia xác minh (nếu có):</p>
  <div style="margin-top:4px;">${dottedLines(4, data.y_kien_tham_gia)}</div>
</div>

<div class="s">
  <p>Biên bản này gồm có .....trang, được lập thành ......bản có nội dung và giá trị pháp lý như nhau.</p>
  <p style="margin-top:4px;">Biên bản này được đọc cho những người có tên phía trên nghe, công nhận đúng sự việc và cùng ký tên xác nhận dưới đây.</p>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr 1fr;margin-top:20px;text-align:center;">
  <div><p class="b up" style="font-size:12px;">THÀNH VIÊN ĐOÀN</p><p style="font-style:italic;font-size:11px;">(Ký và ghi rõ họ tên)</p><div style="height:65px;"></div></div>
  <div><p class="b up" style="font-size:12px;">NGƯỜI LÀM CHỨNG</p><p style="font-style:italic;font-size:11px;">(Ký và ghi rõ họ tên)</p><div style="height:65px;"></div></div>
  <div><p class="b up" style="font-size:12px;">CHỦ TRÌ ĐOÀN</p><p style="font-style:italic;font-size:11px;">(Ký và ghi rõ họ tên)</p><div style="height:65px;"></div></div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;margin-top:20px;text-align:center;">
  <div><p class="b up" style="font-size:12px;">NHỮNG NGƯỜI THAM DỰ</p><p style="font-style:italic;font-size:11px;">(Ký và ghi rõ họ tên)</p><div style="height:65px;"></div></div>
  <div><p class="b up" style="font-size:12px;">NGƯỜI LẬP BIÊN BẢN</p><p style="font-style:italic;font-size:11px;">(Ký và ghi rõ họ tên)</p><div style="height:65px;"></div></div>
</div>

</body>
</html>`;
}

export async function exportBienBanToPdf(data: BienBanPdfData): Promise<{ fileUrl: string; fileName: string }> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas');

  const { jsPDF } = (window as any).jspdf;
  const html2canvas = (window as any).html2canvas;

  // Tạo iframe ẩn
  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${HTML_W}px;height:1200px;border:none;z-index:-9999;visibility:hidden;`;
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument || iframe.contentWindow!.document;
    doc.open(); doc.write(buildHTML(data)); doc.close();
    await new Promise(r => setTimeout(r, 600));

    // Render toàn bộ nội dung thành 1 canvas dài (không có padding)
    const canvas = await html2canvas(doc.body, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: HTML_W,
      windowWidth: HTML_W,
      scrollX: 0,
      scrollY: 0,
    });

    // ── Chia trang với margin đúng ────────────────────────────────────────
    // 1px canvas (scale=2) = MM_CONT_W / (HTML_W * SCALE) mm
    const mmPerPx = MM_CONT_W / (HTML_W * SCALE);              // mm mỗi pixel canvas
    const pxPerPage = Math.floor(MM_CONT_H / mmPerPx);          // pixels canvas mỗi trang content

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let srcY = 0;
    let pageNum = 0;

    while (srcY < canvas.height) {
      if (pageNum > 0) pdf.addPage();

      const sliceH = Math.min(pxPerPage, canvas.height - srcY);

      // Tạo canvas tạm cho trang này (luôn cao = pxPerPage để không co ảnh)
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      tmp.height = pxPerPage;
      const ctx = tmp.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, tmp.width, tmp.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const sliceData = tmp.toDataURL('image/jpeg', 0.95);

      // Đặt ảnh tại (leftMargin, topMargin) với kích thước content area
      pdf.addImage(sliceData, 'JPEG', MM_LEFT, MM_TOP, MM_CONT_W, MM_CONT_H);

      srcY += pxPerPage;
      pageNum++;
    }

    const pdfBlob = pdf.output('blob');

    // Tên file
    const dt = data.thoi_gian_bat_dau ? new Date(data.thoi_gian_bat_dau) : new Date();
    const dateStr = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
    const maSCYK = (data.ma_baocao_scyk || data.scyk_id || 'BBXM').replace(/[\/\s]/g, '_');
    const fileName = `BBXM_${maSCYK}_${dateStr}.pdf`;
    const filePath = `bien_ban/${data.id || Date.now()}/${fileName}`;

    const { error } = await supabase.storage
      .from('scyk')
      .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });
    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from('scyk').getPublicUrl(filePath);
    return { fileUrl: urlData?.publicUrl || filePath, fileName };

  } finally {
    if (document.body.contains(iframe)) document.body.removeChild(iframe);
  }
}
