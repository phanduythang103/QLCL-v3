import { supabase } from '../supabaseClient';
import { matchesDepartment } from './departmentMatch';
import { ATPT_CRITERIA } from './atptCriteria';

/**
 * Tính số liệu cho "Báo cáo kết quả đo lường 06 chỉ số chất lượng" (mẫu BVQY103).
 * Cách tính "đạt" bám đúng từng module giám sát để số liệu báo cáo khớp màn hình.
 */

export type KyLoai = 'thang' | 'quy' | 'nam';
export type CapBaoCao = 'khoa' | 'co_quan' | 'toan_vien';

export const CAP_BAO_CAO_LABEL: Record<CapBaoCao, string> = {
  khoa: 'Khoa/đơn vị',
  co_quan: 'Cơ quan/đầu mối chỉ số',
  toan_vien: 'Toàn viện',
};

export interface ReportPeriod {
  loai: KyLoai;
  so: number; // tháng 1-12 / quý 1-4 / 0 với năm
  nam: number;
}

/** Khoá tháng tuyệt đối: năm*12 + (tháng-1) */
type MonthKey = number;
const mk = (y: number, m1: number): MonthKey => y * 12 + (m1 - 1);
const mkYear = (k: MonthKey) => Math.floor(k / 12);
const mkMonth = (k: MonthKey) => (k % 12) + 1;

export const periodMonths = (p: ReportPeriod): MonthKey[] => {
  if (p.loai === 'thang') return [mk(p.nam, p.so)];
  if (p.loai === 'quy') return [0, 1, 2].map(i => mk(p.nam, (p.so - 1) * 3 + 1 + i));
  return Array.from({ length: 12 }, (_, i) => mk(p.nam, i + 1));
};

export const previousPeriod = (p: ReportPeriod): ReportPeriod => {
  if (p.loai === 'thang') return p.so === 1 ? { loai: 'thang', so: 12, nam: p.nam - 1 } : { ...p, so: p.so - 1 };
  if (p.loai === 'quy') return p.so === 1 ? { loai: 'quy', so: 4, nam: p.nam - 1 } : { ...p, so: p.so - 1 };
  return { loai: 'nam', so: 0, nam: p.nam - 1 };
};

export const nextPeriod = (p: ReportPeriod): ReportPeriod => {
  if (p.loai === 'thang') return p.so === 12 ? { loai: 'thang', so: 1, nam: p.nam + 1 } : { ...p, so: p.so + 1 };
  if (p.loai === 'quy') return p.so === 4 ? { loai: 'quy', so: 1, nam: p.nam + 1 } : { ...p, so: p.so + 1 };
  return { loai: 'nam', so: 0, nam: p.nam + 1 };
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export const describePeriod = (p: ReportPeriod): string =>
  p.loai === 'thang' ? `Tháng ${pad2(p.so)}/${p.nam}` : p.loai === 'quy' ? `Quý ${p.so}/${p.nam}` : `Năm ${p.nam}`;

/** Ngày cuối cùng của kỳ (dd/mm/yyyy) */
export const periodEndDate = (p: ReportPeriod): Date => {
  const months = periodMonths(p);
  const last = months[months.length - 1];
  return new Date(mkYear(last), mkMonth(last), 0);
};

// ---------------------------------------------------------------------------
// Tải dữ liệu thô
// ---------------------------------------------------------------------------

const PAGE_SIZE = 1000;

/** Tải toàn bộ bản ghi trong [start, end) - phân trang vì PostgREST cắt ở 1.000 dòng. */
const fetchAll = async (table: string, cols: string, dateCol: string, start: string, end: string): Promise<any[]> => {
  const rows: any[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .gte(dateCol, start)
      .lt(dateCol, end)
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Lỗi tải dữ liệu ${table}: ${error.message}`);
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
};

/** Khoá tháng của cột DATE ('YYYY-MM-DD') hoặc TIMESTAMPTZ (theo giờ địa phương). */
const monthKeyOf = (value: string | null | undefined, isDateOnly: boolean): MonthKey | null => {
  if (!value) return null;
  if (isDateOnly) {
    const m = String(value).match(/^(\d{4})-(\d{2})/);
    return m ? mk(Number(m[1]), Number(m[2])) : null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : mk(d.getFullYear(), d.getMonth() + 1);
};

const notifyMinutes = (row: any): number | null => {
  if (!row.thoi_gian_co_kq || !row.thoi_gian_thong_bao) return null;
  const from = new Date(row.thoi_gian_co_kq).getTime();
  const to = new Date(row.thoi_gian_thong_bao).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 60000);
};

const ndnbIsDat = (row: any) => ['c1', 'c2'].every(id => row?.checklist_data?.[id] === true);

const vstCounts = (row: any) => {
  const moments: any[] = row?.checklist_data?.moments || [];
  const fromMoments = {
    coHoi: moments.filter(m => m.co_hoi).length,
    dat: moments.filter(m => m.co_hoi && m.compliance).length,
  };
  // Cột tổng hợp ghi khi lưu phiếu; phiếu cũ thiếu cột thì tính lại từ checklist
  return row.tong_co_hoi > 0 ? { coHoi: row.tong_co_hoi, dat: row.so_lan_tuan_thu || 0 } : fromMoments;
};

interface RawData {
  ndnb: any[];
  cls: any[];
  handover: any[];
  atpt: any[];
  vst: any[];
  fall: any[];
  luotKham: Map<MonthKey, number>;
  ngayNamVien: Map<MonthKey, number>;
}

const loadRaw = async (fromKey: MonthKey, toKeyExclusive: MonthKey): Promise<RawData> => {
  const dStart = `${mkYear(fromKey)}-${pad2(mkMonth(fromKey))}-01`;
  const dEnd = `${mkYear(toKeyExclusive)}-${pad2(mkMonth(toKeyExclusive))}-01`;
  const tStart = new Date(mkYear(fromKey), mkMonth(fromKey) - 1, 1).toISOString();
  const tEnd = new Date(mkYear(toKeyExclusive), mkMonth(toKeyExclusive) - 1, 1).toISOString();

  const years: number[] = [];
  for (let y = mkYear(fromKey); y <= mkYear(toKeyExclusive); y++) years.push(y);

  const [ndnb, cls, handover, atpt, vst, fall, visits, days] = await Promise.all([
    fetchAll('gs_ndnb', 'id, ngay_giam_sat, khoa_duoc_giam_sat, checklist_data, thoi_diem_dinh_danh', 'ngay_giam_sat', dStart, dEnd),
    fetchAll('jci_critical_results', 'id, thoi_gian_co_kq, thoi_gian_thong_bao, khoa_thong_bao, khoa_dieu_tri, ten_kq_bao_dong, dat_khung_tg', 'thoi_gian_co_kq', tStart, tEnd),
    fetchAll('jci_handover_incidents', 'id, thoi_gian_su_co, khoa_lien_quan, khoa_ban_giao, khoa_tiep_nhan, loai_hinh_ban_giao, muc_do_nghiem_trong, da_phan_tich_rca', 'thoi_gian_su_co', tStart, tEnd),
    fetchAll('giam_sat_atpt', 'id, ngay_giam_sat, khoa_phau_thuat, ket_qua, checklist_23', 'ngay_giam_sat', dStart, dEnd),
    fetchAll('gs_vst', 'id, ngay_giam_sat, khoa_duoc_giam_sat, checklist_data, tong_co_hoi, so_lan_tuan_thu', 'ngay_giam_sat', dStart, dEnd),
    fetchAll('jci_fall_incidents', 'id, thoi_gian_nga, khoa_dieu_tri, muc_nguy_co, muc_do_ton_thuong, da_tai_danh_gia, da_danh_gia_mt', 'thoi_gian_nga', tStart, tEnd),
    supabase.from('jci_handover_visits').select('nam, thang, so_luot_kham').in('nam', years),
    supabase.from('jci_fall_patient_days').select('nam, thang, so_ngay_nam_vien').in('nam', years),
  ]);

  const toMap = (res: any, col: string) => {
    const map = new Map<MonthKey, number>();
    (res.data || []).forEach((r: any) => map.set(mk(r.nam, r.thang), Number(r[col]) || 0));
    return map;
  };

  const tag = (rows: any[], col: string, isDate: boolean) =>
    rows.map(r => ({ ...r, _mk: monthKeyOf(r[col], isDate) })).filter(r => r._mk !== null);

  return {
    ndnb: tag(ndnb, 'ngay_giam_sat', true),
    cls: tag(cls, 'thoi_gian_co_kq', false),
    handover: tag(handover, 'thoi_gian_su_co', false),
    atpt: tag(atpt, 'ngay_giam_sat', true),
    vst: tag(vst, 'ngay_giam_sat', true),
    fall: tag(fall, 'thoi_gian_nga', false),
    luotKham: toMap(visits, 'so_luot_kham'),
    ngayNamVien: toMap(days, 'so_ngay_nam_vien'),
  };
};

// ---------------------------------------------------------------------------
// Tính chỉ số
// ---------------------------------------------------------------------------

export type IndicatorId = 'NDNB' | 'CLS' | 'HANDOVER' | 'ATPT' | 'VST' | 'FALL';
export const INDICATOR_ORDER: IndicatorId[] = ['NDNB', 'CLS', 'HANDOVER', 'ATPT', 'VST', 'FALL'];

export interface Metric {
  tu: number;
  mau: number | null; // null = không có mẫu số (VD: mẫu số chỉ có ở cấp toàn viện)
  rate: number | null; // % hoặc /1.000
  avgMinutes?: number | null;
  sentinel?: number;
}

export interface IndicatorResult {
  id: IndicatorId;
  current: Metric;
  previous: Metric;
  monthly: (number | null)[]; // 12 tháng của năm báo cáo (chỉ tháng trong kỳ có giá trị)
  kad: boolean; // không áp dụng - không có số liệu trong kỳ
  datMucTieu: boolean | null; // null khi KAD
  duCoMau: boolean | null;
  sampleRequired: number | null;
  danhGia: string; // mô tả kết quả đánh giá (dùng trong popup / JSON)
  notes: string[];
  tonTai: string; // nội dung tồn tại tự tổng hợp (sửa được trên form)
  khoaLienQuan: string;
  nguyenNhan?: string; // đơn vị tự nhập trên form
  khongApDung?: boolean; // đơn vị chọn "không áp dụng" khi tạo báo cáo
  danhGiaChecks?: Record<string, boolean>; // ô đánh giá người dùng tích lại (thiếu -> theo kết quả tự tính)
  xuHuong?: TrendValue | null; // xu hướng người dùng tích lại (undefined -> tự tính theo tháng)
}

/** Một dòng mục III - Kiến nghị, đề xuất giải pháp khắc phục. */
export interface KienNghiRow {
  giaiPhap: string;
  chiSo: string;
  chuTri: string;
  thoiHan: string;
  ketQua: string;
  deNghi: string;
}

export interface Jci6csReportData {
  period: ReportPeriod;
  previous: ReportPeriod;
  cap: CapBaoCao;
  donVi: string; // khoa/cơ quan lập báo cáo
  kinhGui: string;
  nguoiLap: string;
  ngayLap: string; // ISO
  indicators: Record<IndicatorId, IndicatorResult>;
  tongHop: { datMucTieu: number; duCoMau: number; kad: string[]; dungHan: boolean };
  chung: string; // tồn tại chung về quy trình đo lường
  chungKhoa?: string;
  chungNguyenNhan?: string;
  kienNghi?: KienNghiRow[]; // báo cáo cũ chưa có -> dựng mặc định bằng defaultKienNghi
  soVanBan?: string; // "……/BC-……"
  nguoiKy?: string; // chỉ huy / trưởng đơn vị
}

const pct = (tu: number, mau: number): number | null => (mau > 0 ? (tu / mau) * 100 : null);
const per1000 = (tu: number, mau: number | null): number | null => (mau && mau > 0 ? (tu / mau) * 1000 : null);

const sumMonths = (map: Map<MonthKey, number>, keys: MonthKey[]): number | null => {
  let total = 0;
  let missing = false;
  keys.forEach(k => {
    const v = map.get(k);
    if (v && v > 0) total += v;
    else missing = true;
  });
  return missing ? null : total;
};

const fmtNum = (v: number, digits = 1) =>
  v.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: digits });

/** Đếm theo nhóm, trả về "A (3), B (2)" - lấy tối đa `limit` nhóm nhiều nhất. */
const topCounts = (values: string[], limit = 3, sep = ', '): string => {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k, n]) => `${k} (${n})`)
    .join(sep);
};

/** Khoa có tỷ lệ dưới ngưỡng (dùng cho báo cáo cấp toàn viện/cơ quan). */
const deptsBelow = (rows: any[], deptOf: (r: any) => string, counts: (r: any) => { tu: number; mau: number }, threshold: number): string[] => {
  const by = new Map<string, { tu: number; mau: number }>();
  rows.forEach(r => {
    const d = (deptOf(r) || '').trim();
    if (!d) return;
    const c = counts(r);
    const cur = by.get(d) || { tu: 0, mau: 0 };
    by.set(d, { tu: cur.tu + c.tu, mau: cur.mau + c.mau });
  });
  return [...by.entries()]
    .filter(([, v]) => v.mau > 0 && (v.tu / v.mau) * 100 < threshold)
    .sort((a, b) => a[1].tu / a[1].mau - b[1].tu / b[1].mau)
    .map(([d, v]) => `${d} (${fmtNum((v.tu / v.mau) * 100)}%)`);
};

export interface BuildReportInput {
  period: ReportPeriod;
  cap: CapBaoCao;
  donVi: string;
  kinhGui: string;
  nguoiLap: string;
  khongApDung?: IndicatorId[]; // chỉ số đơn vị chọn không áp dụng (mặc định: áp dụng tất cả)
}

export const buildJci6csReport = async (input: BuildReportInput): Promise<Jci6csReportData> => {
  const { period, cap, donVi } = input;
  const prev = previousPeriod(period);
  const curKeys = periodMonths(period);
  const prevKeys = periodMonths(prev);
  const yearKeys = Array.from({ length: 12 }, (_, i) => mk(period.nam, i + 1));
  const nMonths = curKeys.length;

  const fromKey = Math.min(prevKeys[0], yearKeys[0]);
  const toKey = curKeys[curKeys.length - 1] + 1;
  const raw = await loadRaw(fromKey, toKey);

  // Cấp khoa: chỉ lấy bản ghi của khoa; cơ quan/toàn viện: toàn bộ bệnh viện
  const isKhoa = cap === 'khoa';
  const inDept = (...vals: (string | undefined)[]) => !isKhoa || vals.some(v => v && matchesDepartment(v, donVi));

  const ndnb = raw.ndnb.filter(r => inDept(r.khoa_duoc_giam_sat));
  const cls = raw.cls.filter(r => inDept(r.khoa_dieu_tri, r.khoa_thong_bao));
  const handover = raw.handover.filter(r => inDept(r.khoa_ban_giao, r.khoa_tiep_nhan, r.khoa_lien_quan));
  const atpt = raw.atpt.filter(r => inDept(r.khoa_phau_thuat));
  const vst = raw.vst.filter(r => inDept(r.khoa_duoc_giam_sat));
  const fall = raw.fall.filter(r => inDept(r.khoa_dieu_tri));

  const inKeys = (keys: MonthKey[]) => { const s = new Set(keys); return (r: any) => s.has(r._mk); };

  // Hàm tính Metric cho từng chỉ số trên một tập tháng
  const metricFns: Record<IndicatorId, (keys: MonthKey[]) => Metric> = {
    NDNB: keys => {
      const rows = ndnb.filter(inKeys(keys));
      const tu = rows.filter(ndnbIsDat).length;
      return { tu, mau: rows.length, rate: pct(tu, rows.length) };
    },
    CLS: keys => {
      const rows = cls.filter(inKeys(keys));
      const tu = rows.filter(r => r.dat_khung_tg === true).length;
      const mins = rows.map(notifyMinutes).filter((m): m is number => m !== null && m >= 0);
      return {
        tu, mau: rows.length, rate: pct(tu, rows.length),
        avgMinutes: mins.length ? mins.reduce((s, m) => s + m, 0) / mins.length : null,
      };
    },
    HANDOVER: keys => {
      const rows = handover.filter(inKeys(keys));
      const mau = isKhoa ? null : sumMonths(raw.luotKham, keys);
      return {
        tu: rows.length, mau, rate: per1000(rows.length, mau),
        sentinel: rows.filter(r => String(r.muc_do_nghiem_trong || '').startsWith('NC3')).length,
      };
    },
    ATPT: keys => {
      const rows = atpt.filter(inKeys(keys));
      const tu = rows.filter(r => r.ket_qua === 'Đạt').length;
      return { tu, mau: rows.length, rate: pct(tu, rows.length) };
    },
    VST: keys => {
      const rows = vst.filter(inKeys(keys));
      let tu = 0; let mau = 0;
      rows.forEach(r => { const c = vstCounts(r); tu += c.dat; mau += c.coHoi; });
      return { tu, mau, rate: pct(tu, mau) };
    },
    FALL: keys => {
      const rows = fall.filter(inKeys(keys));
      const mau = isKhoa ? null : sumMonths(raw.ngayNamVien, keys);
      return { tu: rows.length, mau, rate: per1000(rows.length, mau) };
    },
  };

  const curSet = inKeys(curKeys);
  const periodRows = {
    NDNB: ndnb.filter(curSet), CLS: cls.filter(curSet), HANDOVER: handover.filter(curSet),
    ATPT: atpt.filter(curSet), VST: vst.filter(curSet), FALL: fall.filter(curSet),
  };

  const result = {} as Record<IndicatorId, IndicatorResult>;
  const curSetKeys = new Set(curKeys);

  INDICATOR_ORDER.forEach(id => {
    const current = metricFns[id](curKeys);
    const previous = metricFns[id](prevKeys);
    const monthly = yearKeys.map(k => (curSetKeys.has(k) ? metricFns[id]([k]).rate : null));
    const notes: string[] = [];
    let kad = false;
    let datMucTieu: boolean | null = null;
    let duCoMau: boolean | null = null;
    let sampleRequired: number | null = null;
    let danhGia = '';
    let tonTai = '';
    let khoaLienQuan = '';
    const rows = periodRows[id];
    const khoaSelf = isKhoa ? donVi : '';

    switch (id) {
      case 'NDNB':
      case 'ATPT': {
        kad = !current.mau;
        sampleRequired = 128 * nMonths;
        if (!kad) {
          datMucTieu = (current.rate ?? 0) >= 100;
          duCoMau = (current.mau ?? 0) >= sampleRequired;
          danhGia = datMucTieu ? 'Đạt' : 'Không đạt';
        }
        const issues: string[] = [];
        if (kad) issues.push('Không có phiếu giám sát trong kỳ.');
        else {
          const khong = (current.mau ?? 0) - current.tu;
          if (!datMucTieu) issues.push(`Tỷ lệ tuân thủ ${fmtNum(current.rate ?? 0)}% (${current.tu}/${current.mau}), ${khong} lượt không đạt, chưa đạt mục tiêu 100%.`);
          if (id === 'NDNB') {
            const missC1 = rows.filter(r => r?.checklist_data?.c1 !== true).length;
            const missC2 = rows.filter(r => r?.checklist_data?.c2 !== true).length;
            if (missC1 || missC2) issues.push(`Câu hỏi bị bỏ sót: họ tên ${missC1} lượt, ngày sinh ${missC2} lượt.`);
            const thoiDiem = topCounts(rows.filter(r => !ndnbIsDat(r)).map(r => r.thoi_diem_dinh_danh));
            if (thoiDiem) issues.push(`Thời điểm định danh sai sót nhiều: ${thoiDiem}.`);
          } else {
            const missed: string[] = [];
            rows.forEach(r => ATPT_CRITERIA.forEach(c => { if (r?.checklist_23?.[c.id] === 'Không') missed.push(`${c.id} - ${c.short}`); }));
            const top = topCounts(missed);
            if (top) issues.push(`Tiêu chí bị bỏ sót nhiều nhất: ${top}.`);
          }
          if (!duCoMau) issues.push(`Cỡ mẫu ${current.mau}/${sampleRequired}, chưa đủ theo bậc thang JCI.`);
        }
        tonTai = issues.join(' ') || 'Đạt mục tiêu 100%, đủ cỡ mẫu.';
        if (!kad && !datMucTieu) {
          const deptOf = id === 'NDNB' ? (r: any) => r.khoa_duoc_giam_sat : (r: any) => r.khoa_phau_thuat;
          const isDat = id === 'NDNB' ? ndnbIsDat : (r: any) => r.ket_qua === 'Đạt';
          khoaLienQuan = khoaSelf || deptsBelow(rows, deptOf, r => ({ tu: isDat(r) ? 1 : 0, mau: 1 }), 100).join('; ');
        }
        break;
      }
      case 'CLS': {
        kad = !current.mau;
        if (!kad) {
          datMucTieu = (current.rate ?? 0) >= 100;
          duCoMau = true; // thu thập 100% KQ báo động
          danhGia = datMucTieu ? 'Đạt' : 'Không đạt';
        }
        const issues: string[] = [];
        if (kad) issues.push('Không có KQ báo động CLS trong kỳ.');
        else {
          const khongDat = rows.filter(r => r.dat_khung_tg !== true);
          if (khongDat.length) {
            issues.push(`${khongDat.length}/${current.mau} KQ không thông báo trong ≤ 15 phút.`);
            const khoa = topCounts(khongDat.map(r => r.khoa_dieu_tri));
            if (khoa) issues.push(`Khoa nhận: ${khoa}.`);
            const loai = topCounts(khongDat.map(r => r.ten_kq_bao_dong));
            if (loai) issues.push(`Loại KQ: ${loai}.`);
          }
          if (current.avgMinutes != null) issues.push(`Thời gian thông báo TB: ${fmtNum(current.avgMinutes)} phút.`);
          const loiNgayGio = rows.filter(r => { const m = notifyMinutes(r); return m !== null && m < 0; }).length;
          const thieu = rows.filter(r => notifyMinutes(r) === null).length;
          if (loiNgayGio) issues.push(`${loiNgayGio} dòng lỗi ngày giờ.`);
          if (thieu) issues.push(`${thieu} dòng thiếu thời gian thông báo.`);
          if (khongDat.length) khoaLienQuan = khoaSelf || topCounts(khongDat.map(r => r.khoa_dieu_tri), 50, '; ');
        }
        tonTai = issues.join(' ') || 'Đạt mục tiêu 100%.';
        break;
      }
      case 'HANDOVER':
      case 'FALL': {
        // Chỉ số dạng nhật ký sự cố: luôn áp dụng (0 sự cố vẫn là kết quả hợp lệ)
        const byRate = current.rate !== null && previous.rate !== null;
        if (!isKhoa && current.mau === null) notes.push(id === 'HANDOVER' ? 'Chưa nhập đủ lượt khám, điều trị trong kỳ' : 'Chưa nhập đủ ngày nằm viện trong kỳ');
        if (isKhoa) notes.push(id === 'HANDOVER' ? 'Mẫu số lượt khám chỉ có số liệu toàn viện' : 'Mẫu số ngày nằm viện chỉ có số liệu toàn viện');
        duCoMau = true; // báo cáo 100% sự cố
        if (id === 'HANDOVER') {
          const giam = byRate
            ? (current.rate! < previous.rate! || (current.tu === 0 && previous.tu === 0))
            : current.tu < previous.tu || (current.tu === 0 && previous.tu === 0);
          datMucTieu = giam && !current.sentinel;
          danhGia = `${giam ? 'Xu hướng giảm' : 'Không giảm'}; sentinel event: ${current.sentinel ? 'Có' : 'Không'}`;
          if (!byRate) notes.push('Xu hướng so sánh theo số sự cố');
          if (current.sentinel) notes.push(`${current.sentinel} sự cố NC3`);
          const issues: string[] = [];
          if (rows.length) {
            issues.push(`${rows.length} sự cố bàn giao trong kỳ.`);
            const loai = topCounts(rows.map(r => r.loai_hinh_ban_giao), 5);
            if (loai) issues.push(`Loại hình: ${loai}.`);
            const mucDo = topCounts(rows.map(r => r.muc_do_nghiem_trong), 4);
            if (mucDo) issues.push(`Mức độ: ${mucDo}.`);
            if (current.sentinel) issues.push(`Có ${current.sentinel} sentinel event; đã phân tích RCA ${rows.filter(r => r.da_phan_tich_rca).length}/${rows.length} sự cố.`);
            khoaLienQuan = khoaSelf || topCounts(rows.map(r => r.khoa_ban_giao || r.khoa_lien_quan), 50, '; ');
          }
          tonTai = issues.join(' ') || 'Không ghi nhận sự cố bàn giao trong kỳ.';
        } else {
          datMucTieu = current.rate !== null ? current.rate <= 0.5 : null;
          danhGia = current.rate === null ? 'Chưa tính được tỷ suất' : current.rate <= 0.5 ? '≤ mốc' : '> mốc';
          const issues: string[] = [];
          if (rows.length) {
            issues.push(`${rows.length} ca ngã trong kỳ.`);
            const khoa = topCounts(rows.map(r => r.khoa_dieu_tri), 5);
            if (khoa && !isKhoa) issues.push(`Theo khoa: ${khoa}.`);
            const nguyCo = topCounts(rows.map(r => r.muc_nguy_co), 3);
            if (nguyCo) issues.push(`Mức nguy cơ: ${nguyCo}.`);
            const tonThuong = topCounts(rows.map(r => r.muc_do_ton_thuong), 4);
            if (tonThuong) issues.push(`Mức tổn thương: ${tonThuong}.`);
            const chuaTaiDg = rows.filter(r => !r.da_tai_danh_gia).length;
            const chuaDgMt = rows.filter(r => !r.da_danh_gia_mt).length;
            if (chuaTaiDg) issues.push(`${chuaTaiDg} ca chưa tái đánh giá nguy cơ.`);
            if (chuaDgMt) issues.push(`${chuaDgMt} ca chưa đánh giá sau ngã.`);
            khoaLienQuan = khoaSelf || topCounts(rows.map(r => r.khoa_dieu_tri), 50, '; ');
          }
          tonTai = issues.join(' ') || 'Không ghi nhận ca ngã trong kỳ.';
        }
        break;
      }
      case 'VST': {
        kad = !current.mau;
        sampleRequired = isKhoa ? null : 200 * nMonths;
        if (!kad) {
          datMucTieu = (current.rate ?? 0) >= 85;
          duCoMau = sampleRequired === null ? true : (current.mau ?? 0) >= sampleRequired;
          danhGia = datMucTieu ? 'Đạt' : 'Không đạt';
        }
        const issues: string[] = [];
        if (kad) issues.push('Không có cơ hội vệ sinh tay được giám sát trong kỳ.');
        else {
          if (!datMucTieu) issues.push(`Tỷ lệ tuân thủ ${fmtNum(current.rate ?? 0)}% (${current.tu}/${current.mau} cơ hội), dưới mục tiêu 85%.`);
          const missed: string[] = [];
          rows.forEach(r => (r?.checklist_data?.moments || []).forEach((m: any) => { if (m.co_hoi && !m.compliance) missed.push(m.name || `Thời điểm ${m.id}`); }));
          const top = topCounts(missed, 2);
          if (top) issues.push(`Thời điểm bị bỏ sót nhiều nhất: ${top}.`);
          if (duCoMau === false) issues.push(`Cỡ mẫu ${current.mau}/${sampleRequired} cơ hội, chưa đủ.`);
          const below = deptsBelow(rows, r => r.khoa_duoc_giam_sat, r => { const c = vstCounts(r); return { tu: c.dat, mau: c.coHoi }; }, 85);
          khoaLienQuan = isKhoa ? (datMucTieu ? '' : khoaSelf) : below.join('; ');
        }
        tonTai = issues.join(' ') || 'Đạt mục tiêu, đủ cỡ mẫu.';
        break;
      }
    }

    // Giữ bảng gọn: chỉ nêu tối đa 8 khoa (đã xếp khoa thấp nhất/nhiều sự cố lên trước)
    const khoaList = khoaLienQuan ? khoaLienQuan.split('; ') : [];
    if (khoaList.length > 8) khoaLienQuan = `${khoaList.slice(0, 8).join('; ')}; … (+${khoaList.length - 8} khoa)`;

    result[id] = { id, current, previous, monthly, kad, datMucTieu, duCoMau, sampleRequired, danhGia, notes, tonTai, khoaLienQuan };

    // Chỉ số đơn vị chọn không áp dụng: không đánh giá, không tính vào đạt/cỡ mẫu, không đề xuất giải pháp
    if (input.khongApDung?.includes(id)) {
      result[id] = {
        ...result[id],
        kad: true,
        khongApDung: true,
        monthly: Array(12).fill(null),
        datMucTieu: null,
        duCoMau: null,
        danhGia: 'Không áp dụng',
        notes: ['Không áp dụng tại đơn vị'],
        tonTai: 'Chỉ số không áp dụng tại đơn vị trong kỳ báo cáo.',
        khoaLienQuan: '',
      };
    }
  });

  const kadList = INDICATOR_ORDER.filter(id => result[id].kad).map(id => INDICATOR_META[id].code);
  const thieuMau = INDICATOR_ORDER.filter(id => result[id].duCoMau === false).map(id => INDICATOR_META[id].code);

  // Hạn nộp số liệu: trước ngày 03 của tháng kế tiếp kỳ báo cáo
  const end = periodEndDate(period);
  const deadline = new Date(end.getFullYear(), end.getMonth() + 1, 3);
  const now = new Date();
  const dungHan = now < deadline;

  const chungIssues: string[] = [];
  if (thieuMau.length) chungIssues.push(`Chưa đủ cỡ mẫu: ${thieuMau.join(', ')}.`);
  const khongSoLieu = INDICATOR_ORDER.filter(id => result[id].kad && !result[id].khongApDung).map(id => INDICATOR_META[id].code);
  const khongApDung = INDICATOR_ORDER.filter(id => result[id].khongApDung).map(id => INDICATOR_META[id].code);
  if (khongApDung.length) chungIssues.push(`Chỉ số không áp dụng tại đơn vị (KAD): ${khongApDung.join(', ')}.`);
  if (khongSoLieu.length) chungIssues.push(`Không có số liệu trong kỳ (KAD): ${khongSoLieu.join(', ')}.`);
  const missingDenom = INDICATOR_ORDER.filter(id => result[id].notes.some(n => n.startsWith('Chưa nhập'))).map(id => INDICATOR_META[id].code);
  if (missingDenom.length) chungIssues.push(`Chưa nhập đủ mẫu số: ${missingDenom.join(', ')}.`);
  if (!dungHan) chungIssues.push('Báo cáo lập sau hạn nộp số liệu (ngày 03 tháng kế tiếp).');

  const report: Jci6csReportData = {
    period,
    previous: prev,
    cap,
    donVi,
    kinhGui: input.kinhGui,
    nguoiLap: input.nguoiLap,
    ngayLap: now.toISOString(),
    indicators: result,
    tongHop: {
      datMucTieu: INDICATOR_ORDER.filter(id => result[id].datMucTieu === true).length,
      duCoMau: INDICATOR_ORDER.filter(id => result[id].duCoMau === true).length,
      kad: kadList,
      dungHan,
    },
    chung: chungIssues.join(' ') || 'Không phát hiện tồn tại về quy trình đo lường.',
  };
  report.kienNghi = defaultKienNghi(report);
  return report;
};

const fmtDmy = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

export const emptyKienNghi = (): KienNghiRow => ({ giaiPhap: '', chiSo: '', chuTri: '', thoiHan: '', ketQua: '', deNghi: '' });

/** Gợi ý mặc định: mỗi chỉ số không đạt một giải pháp, thời hạn cuối kỳ kế tiếp; tối thiểu 3 dòng như mẫu. */
export const defaultKienNghi = (data: Jci6csReportData): KienNghiRow[] => {
  const deadline = fmtDmy(periodEndDate(nextPeriod(data.period)));
  const rows: KienNghiRow[] = INDICATOR_ORDER.filter(id => data.indicators[id].datMucTieu === false).map(id => {
    const r = data.indicators[id];
    const m = INDICATOR_META[id];
    const chuTri = data.cap === 'khoa'
      ? data.donVi
      : r.khoaLienQuan ? r.khoaLienQuan.split('; ').slice(0, 3).map(s => s.replace(/\s*\([^)]*\)$/, '')).join('; ') : 'Các khoa/đơn vị liên quan';
    return { giaiPhap: m.giaiPhap, chiSo: m.code, chuTri, thoiHan: deadline, ketQua: m.ketQuaCanDat, deNghi: '' };
  });
  while (rows.length < 3) rows.push(emptyKienNghi());
  return rows;
};

/** Thông tin cố định của 6 chỉ số theo mẫu báo cáo. */
export const INDICATOR_META: Record<IndicatorId, {
  code: string; ten: string; shortTen: string; mucTieu: string; yeuCau: string;
  unit: 'pct' | 'per1000lk' | 'per1000nnv'; trendLabel: string; tonTaiTen: string;
  giaiPhap: string; ketQuaCanDat: string;
}> = {
  NDNB: {
    code: 'IPSG.01.00',
    ten: 'Tuân thủ định danh NB bằng 2 thông số (họ tên + ngày sinh) trước dịch vụ CLS, thủ thuật/can thiệp',
    shortTen: 'Định danh NB', mucTieu: '100%', yeuCau: 'bậc thang JCI (128/khoa/tháng)', unit: 'pct',
    trendLabel: '1. Định danh NB (%)', tonTaiTen: 'Định danh NB',
    giaiPhap: 'Tập huấn lại quy trình định danh NB bằng 2 thông số (họ tên + ngày sinh) bằng câu hỏi mở; giám sát chéo hằng tuần',
    ketQuaCanDat: 'Tỷ lệ tuân thủ 100%, đủ cỡ mẫu; biên bản giám sát, danh sách tập huấn',
  },
  CLS: {
    code: 'IPSG.02.00',
    ten: 'KQ báo động CLS được thông báo trực tiếp cho bác sĩ trong ≤ 15 phút',
    shortTen: 'Báo động CLS', mucTieu: '100% trong ≤ 15 phút', yeuCau: '100% KQ báo động', unit: 'pct',
    trendLabel: '2. Báo động ≤ 15 phút (%)', tonTaiTen: 'Báo động CLS',
    giaiPhap: 'Rà soát quy trình thông báo KQ báo động CLS (read-back, đầu mối nhận tin); ghi nhận đủ ngày giờ thông báo',
    ketQuaCanDat: '100% KQ báo động thông báo ≤ 15 phút; sổ theo dõi thông báo KQ',
  },
  HANDOVER: {
    code: 'IPSG.02.01/QPS.03.04',
    ten: 'Tỷ suất sự cố liên quan bàn giao thông tin (/1.000 lượt khám, điều trị)',
    shortTen: 'Bàn giao thông tin', mucTieu: 'Xu hướng giảm; không có sentinel event', yeuCau: '100% sự cố báo cáo', unit: 'per1000lk',
    trendLabel: '3. Sự cố bàn giao (/1.000 lượt)', tonTaiTen: 'Bàn giao thông tin',
    giaiPhap: 'Chuẩn hóa bàn giao theo SBAR tại các điểm chuyển tiếp (ca trực, chuyển khoa, PT-TT); phân tích RCA sự cố nặng',
    ketQuaCanDat: 'Tỷ suất sự cố giảm so với kỳ trước, không có sentinel event; báo cáo RCA',
  },
  ATPT: {
    code: 'IPSG.04.00/04.01',
    ten: 'Ca PT/TT xâm lấn thực hiện đủ Bảng kiểm An toàn (Sign-in, Time-out, Sign-out)',
    shortTen: 'Bảng kiểm ATPT', mucTieu: '100%', yeuCau: 'bậc thang JCI (128 ca/tháng)', unit: 'pct',
    trendLabel: '4. Bảng kiểm ATPT (%)', tonTaiTen: 'Bảng kiểm ATPT',
    giaiPhap: 'Nhắc lại và giám sát thực hiện đủ Sign-in/Time-out/Sign-out, tập trung các tiêu chí hay bị bỏ sót',
    ketQuaCanDat: '100% ca PT/TT thực hiện đủ bảng kiểm; phiếu giám sát ATPT',
  },
  VST: {
    code: 'IPSG.05.00/PCI.07.01',
    ten: 'Tuân thủ vệ sinh tay theo 5 thời điểm WHO (tính theo cơ hội)',
    shortTen: 'Vệ sinh tay', mucTieu: '≥ 85% toàn viện cuối năm; ≥ 90% khoa/khu vực nguy cơ cao', yeuCau: '≥ 200 cơ hội/tháng toàn viện', unit: 'pct',
    trendLabel: '5. Vệ sinh tay (%)', tonTaiTen: 'Vệ sinh tay',
    giaiPhap: 'Bổ sung phương tiện vệ sinh tay tại điểm chăm sóc; nhắc nhở, giám sát 5 thời điểm WHO; phản hồi kết quả hằng tháng',
    ketQuaCanDat: 'Tỷ lệ tuân thủ ≥ 85% (≥ 90% khu vực nguy cơ cao); phiếu giám sát VST',
  },
  FALL: {
    code: 'AOP.02.00',
    ten: 'Tỷ suất người bệnh ngã (/1.000 ngày nằm viện nội trú)',
    shortTen: 'Ngã nội trú', mucTieu: 'Mốc tham chiếu: 0,5 ca/1.000 ngày (AHRQ)', yeuCau: '100% ca ngã và ngày nằm viện', unit: 'per1000nnv',
    trendLabel: '6. Ngã (/1.000 ngày NV)', tonTaiTen: 'Ngã nội trú',
    giaiPhap: 'Đánh giá, tái đánh giá nguy cơ ngã (Morse/Humpty Dumpty); áp dụng gói can thiệp phòng ngã cho NB nguy cơ cao',
    ketQuaCanDat: 'Tỷ suất ngã ≤ 0,5/1.000 ngày nằm viện; 100% ca ngã được đánh giá sau ngã',
  },
};

export const formatMetricValue = (id: IndicatorId, v: number | null): string => {
  if (v === null || v === undefined) return '—';
  return INDICATOR_META[id].unit === 'pct' ? `${fmtNum(v)} %` : fmtNum(v, 2);
};

export { fmtNum, mkYear, mkMonth };

// ---------------------------------------------------------------------------
// Ô tích "Đánh giá" (mục 1.1) và "Xu hướng" (mục 1.2) theo mẫu
// ---------------------------------------------------------------------------

export type TrendValue = 'tang' | 'giam' | 'on_dinh';

export const TREND_OPTIONS: { key: TrendValue; label: string }[] = [
  { key: 'tang', label: 'Tăng' },
  { key: 'giam', label: 'Giảm' },
  { key: 'on_dinh', label: 'Ổn định' },
];

/** Các ô tích của cột Đánh giá; ô cùng `group` loại trừ nhau. `prefix` in trước nhóm (VD "Sentinel event:"). */
export interface DanhGiaOption { key: string; label: string; group: string; prefix?: string }

const DAT_OPTIONS: DanhGiaOption[] = [
  { key: 'dat', label: 'Đạt', group: 'kq' },
  { key: 'khong_dat', label: 'Không đạt', group: 'kq' },
];

export const DANH_GIA_OPTIONS: Record<IndicatorId, DanhGiaOption[]> = {
  NDNB: DAT_OPTIONS,
  CLS: DAT_OPTIONS,
  ATPT: DAT_OPTIONS,
  VST: DAT_OPTIONS,
  HANDOVER: [
    { key: 'giam', label: 'Xu hướng giảm', group: 'xh' },
    { key: 'khong_giam', label: 'Không giảm', group: 'xh' },
    { key: 'sentinel_khong', label: 'Không', group: 'se', prefix: 'Sentinel event:' },
    { key: 'sentinel_co', label: 'Có', group: 'se' },
  ],
  FALL: [
    { key: 'le_moc', label: '≤ mốc', group: 'kq' },
    { key: 'gt_moc', label: '> mốc', group: 'kq' },
  ],
};

/** Ô đánh giá tích sẵn theo kết quả tự tính. */
export const defaultDanhGiaChecks = (r: IndicatorResult): Record<string, boolean> => {
  if (r.khongApDung) return {};
  if (r.id === 'HANDOVER') {
    const giam = r.danhGia.startsWith('Xu hướng giảm');
    return { giam, khong_giam: !giam, sentinel_khong: !r.current.sentinel, sentinel_co: !!r.current.sentinel };
  }
  if (r.id === 'FALL') return { le_moc: r.datMucTieu === true, gt_moc: r.datMucTieu === false };
  return { dat: r.datMucTieu === true, khong_dat: r.datMucTieu === false };
};

export const danhGiaChecksOf = (r: IndicatorResult): Record<string, boolean> => r.danhGiaChecks ?? defaultDanhGiaChecks(r);

/** Đạt mục tiêu theo ô đã tích (dùng cho dòng Tổng hợp). */
export const datMucTieuFromChecks = (r: IndicatorResult): boolean => {
  if (r.khongApDung) return false;
  const c = danhGiaChecksOf(r);
  if (r.id === 'HANDOVER') return !!c.giam && !!c.sentinel_khong;
  if (r.id === 'FALL') return !!c.le_moc;
  return !!c.dat;
};

/** Xu hướng tự tính: so tháng cuối với tháng đầu có số liệu trong kỳ. */
export const computeTrend = (id: IndicatorId, values: (number | null)[]): TrendValue | null => {
  const v = values.filter((x): x is number => x !== null);
  if (v.length < 2) return null;
  const diff = v[v.length - 1] - v[0];
  const eps = INDICATOR_META[id].unit === 'pct' ? 1 : 0.1;
  return Math.abs(diff) <= eps ? 'on_dinh' : diff > 0 ? 'tang' : 'giam';
};

export const xuHuongOf = (data: Jci6csReportData, id: IndicatorId): TrendValue | null => {
  const r = data.indicators[id];
  if (r.xuHuong !== undefined) return r.xuHuong;
  if (data.period.loai === 'thang' || r.khongApDung) return null;
  return computeTrend(id, r.monthly);
};
