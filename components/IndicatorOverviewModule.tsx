import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Minus,
  RefreshCw,
  Building2,
  Calendar,
  Search,
  ChevronDown,
  Target,
  AlertCircle,
  Activity,
  HeartPulse,
  Stethoscope,
  Shield,
  Syringe,
  ClipboardList,
  Microscope,
  Clock,
  BedDouble,
  Users,
  Hand,
  Thermometer,
  Star
} from 'lucide-react';
import { fetchIndicatorConfigs } from '../readCauHinhCscl';
import { fetchChiSoQlcl, ChiSoQlcl } from '../readChiSoQlcl';
import { IndicatorConfig, IndicatorCategory } from '../types';
import { useIndicators } from './IndicatorsContext';

// Import all specific data fetching services
import { fetchCongSuatGiuong } from '../readCongSuatGiuong';
import { fetchHieuSuatPhongMo } from '../readHieuSuatPhongMo';
import { fetchBcScnyknt } from '../readBcScnyknt';
import { fetchScykNghiemTrong } from '../readScykNghiemTrong';
import { fetchGsKhamBenh } from '../readGsKhamBenh';
import { fetchThoiGianNamVien } from '../readThoiGianNamVien';
import { fetchDsnKvm } from '../readDsnKvm';
import { fetchPtLoai2 } from '../readPtLoai2';
import { fetchKtcmTheoTuyen } from '../readKtcm';
import { fetchGsVst } from '../readGsVst';
import { fetchVpbv } from '../readVpbv';
import { fetchTyLeDD } from '../readTyLeDD';

// ─── Progress bar row (matching the reference image style) ───────────────────
const BAR_COLORS = [
  'bg-[#059669]',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
];

function getBarColor(index: number) {
  return BAR_COLORS[index % BAR_COLORS.length];
}

// Icons to cycle through for each indicator row
const ROW_ICONS = [
  Activity,
  HeartPulse,
  Stethoscope,
  Shield,
  Syringe,
  ClipboardList,
  Microscope,
  Clock,
  BedDouble,
  Users,
  Hand,
  Thermometer,
  Star,
  Target,
  TrendingUp,
];

function getRowIcon(index: number) {
  return ROW_ICONS[index % ROW_ICONS.length];
}

type EvalStatus = 'SUCCESS' | 'EXCEEDED' | 'WARNING' | 'FAILED' | 'NONE';

function getEvaluationStatus(value: number | undefined, target: number | null | undefined, evaluationRule: string | null | undefined, unit: string | null | undefined): EvalStatus {
  if (value === undefined || value === null || target === undefined || target === null) return 'NONE';

  const rule = (evaluationRule || '').toLowerCase();
  const isPercent = unit === '%';

  // Detect direction: default is higher-is-better (>=)
  // Symbols meaning lower-is-better: <=, <, "thấp hơn", "tối đa", "không quá"
  const isLowerIsBetter = rule.includes('≤') || rule.includes('<') || rule.includes('thấp hơn') || rule.includes('tối đa') || rule.includes('không quá');

  if (isLowerIsBetter) {
    if (isPercent && value < target * 0.9) return 'EXCEEDED'; // Significantly lower (better) - only for %
    if (value <= target) return 'SUCCESS';
    if (value <= target * 1.1) return 'WARNING'; // Slightly higher (up to 10% over)
    return 'FAILED';
  } else {
    // Higher is better (>=)
    if (isPercent && value > target * 1.1) return 'EXCEEDED'; // Significantly higher (better) - only for %
    if (value >= target) return 'SUCCESS';
    if (value >= target * 0.9) return 'WARNING'; // Slightly lower (up to 10% under)
    return 'FAILED';
  }
}

function isAchieved(value: number | undefined, target: number | null | undefined, evaluationRule?: string | null | undefined, unit?: string | null | undefined): boolean | null {
  const status = getEvaluationStatus(value, target, evaluationRule, unit);
  if (status === 'NONE') return null;
  return status === 'SUCCESS' || status === 'EXCEEDED' || status === 'WARNING';
}

function calcPct(value: number | undefined, target: number | null | undefined): number {
  if (!value || !target || target === 0) return 0;
  return Math.min((value / target) * 100, 100);
}

const ChartRow = ({
  label,
  value,
  target,
  donVi,
  color,
  iconIndex,
  danhGia,
}: {
  label: string;
  value: number | undefined;
  target: number | null | undefined;
  donVi?: string;
  color: string;
  iconIndex: number;
  danhGia?: string | null;
}) => {
  const pct = calcPct(value, target);
  const status = getEvaluationStatus(value, target, danhGia, donVi);
  const achieved = isAchieved(value, target, danhGia, donVi);
  const unit = donVi || '%';
  const hasData = value !== undefined && value !== null;
  const RowIcon = getRowIcon(iconIndex);
  const iconColor = color
    .replace('bg-[#059669]', 'text-[#059669]')
    .replace('bg-indigo-500', 'text-indigo-500')
    .replace('bg-violet-500', 'text-violet-500')
    .replace('bg-cyan-500', 'text-cyan-500')
    .replace('bg-amber-500', 'text-amber-500')
    .replace('bg-pink-500', 'text-pink-500')
    .replace('bg-teal-500', 'text-teal-500')
    .replace('bg-orange-500', 'text-orange-500');

  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <RowIcon size={15} className={`${iconColor} shrink-0`} />
          <span className="text-table font-bold text-slate-800 group-hover:text-[#059669] transition-colors tracking-tight truncate lowercase first-letter:uppercase">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {target !== null && target !== undefined && (
            <span className="text-[11px] text-[#059669] font-bold whitespace-nowrap">
              Mục tiêu: {target}{unit}
            </span>
          )}
          {hasData ? (
            <span className={`text-lg font-bold whitespace-nowrap ${status === 'EXCEEDED' ? 'text-indigo-600' :
              status === 'SUCCESS' ? 'text-[#059669]' :
                status === 'WARNING' ? 'text-amber-600' :
                  status === 'FAILED' ? 'text-red-600' : 'text-slate-700'
              }`}>
              {value}{unit}
            </span>
          ) : (
            <span className="text-xs text-slate-300 font-bold italic">Chưa có DL</span>
          )}
        </div>
      </div>
      {/* Progress bar — always visible */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: hasData ? `${Math.max(pct, 3)}%` : '3%', opacity: hasData ? 1 : 0.25 }}
        />
      </div>
    </div>
  );
};

// ─── Individual indicator card ────────────────────────────────────────────────
const IndicatorCard = ({ cfg, giaTri, colorIdx, onClick }: {
  cfg: IndicatorConfig;
  giaTri: number | undefined;
  colorIdx: number;
  onClick?: () => void;
}) => {
  const unit = cfg.don_vi_tinh || '%';
  const pct = calcPct(giaTri, cfg.muc_tieu);
  const status = getEvaluationStatus(giaTri, cfg.muc_tieu, cfg.danh_gia, unit);
  const achieved = isAchieved(giaTri, cfg.muc_tieu, cfg.danh_gia, unit);
  const hasData = giaTri !== undefined && giaTri !== null;
  const color = getBarColor(colorIdx);
  const RowIcon = getRowIcon(colorIdx);
  const iconColor = color
    .replace('bg-[#059669]', 'text-[#059669]')
    .replace('bg-indigo-500', 'text-indigo-500')
    .replace('bg-violet-500', 'text-violet-500')
    .replace('bg-cyan-500', 'text-cyan-500')
    .replace('bg-amber-500', 'text-amber-500')
    .replace('bg-pink-500', 'text-pink-500')
    .replace('bg-teal-500', 'text-teal-500')
    .replace('bg-orange-500', 'text-orange-500');

  const statusBadge = !hasData
    ? { label: 'Chờ dữ liệu', cls: 'bg-slate-100 text-slate-400 border-slate-200' }
    : status === 'EXCEEDED'
      ? { label: 'Vượt chỉ tiêu', cls: 'bg-indigo-100 text-indigo-700 border-indigo-200' }
      : status === 'SUCCESS'
        ? { label: 'Đạt', cls: 'bg-emerald-100 text-[#059669] border-emerald-200' }
        : status === 'WARNING'
          ? { label: 'Cảnh báo', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
          : { label: 'Không đạt', cls: 'bg-red-100 text-red-700 border-red-200' };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group ${onClick ? 'cursor-pointer hover:border-[#059669]/30 active:scale-[0.98]' : ''}`}
    >
      {/* Header: icon + name + badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-50`}>
            <RowIcon size={16} className={iconColor} />
          </div>
          <span className="text-table font-bold text-slate-800 group-hover:text-[#059669] transition-colors leading-snug lowercase first-letter:uppercase">
            {cfg.ten_chi_so}
          </span>
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Mục tiêu + kết quả */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg text-[#059669] font-bold">
          {cfg.muc_tieu !== null && cfg.muc_tieu !== undefined
            ? `MT: ${cfg.muc_tieu}${unit}`
            : 'Chưa đặt mục tiêu'}
        </span>
        {hasData ? (
          <span className={`text-lg font-bold ${status === 'EXCEEDED' ? 'text-indigo-600' :
            status === 'SUCCESS' ? 'text-[#059669]' :
              status === 'WARNING' ? 'text-amber-600' : 'text-red-600'
            }`}>
            {giaTri}{unit}
          </span>
        ) : (
          <span className="text-xs text-slate-300 font-bold italic">Chưa có DL</span>
        )}
      </div>

      {/* Progress bar — always visible */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${status === 'EXCEEDED' ? 'bg-indigo-600' :
            status === 'SUCCESS' ? 'bg-[#059669]' :
              'bg-red-500'
            } transition-all duration-700 ease-out`}
          style={{ width: hasData ? `${Math.max(pct, 3)}%` : '3%', opacity: hasData ? 1 : 0.2 }}
        />
      </div>
      {hasData && cfg.muc_tieu && (
        <p className="text-[9px] text-[#059669] font-black mt-1.5 text-right">{Math.round(pct)}% mục tiêu</p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const INDICATOR_MAPPING: Record<string, { category: IndicatorCategory }> = {
  'công suất sử dụng giường': { category: 'BED_USAGE' },
  'hiệu suất sử dụng phòng mổ': { category: 'OR_USAGE' },
  'sự cố ngoài y khoa nghiêm trọng': { category: 'SEVERE_NON_MEDICAL' },
  'sự cố y khoa nghiêm trọng': { category: 'SEVERE_INCIDENT' },
  'thời gian khám bệnh trung bình': { category: 'AVG_EXAM_TIME' },
  'thời gian nằm viện trung bình': { category: 'AVG_STAY_TIME' },
  'tỷ lệ nhiễm khuẩn vết mổ': { category: 'SSI' },
  'tỷ lệ phẫu thuật loại ii trở lên': { category: 'SURGERY_II' },
  'tỷ lệ thực hiện kỹ thuật chuyên môn theo phân tuyến': { category: 'KTCM' },
  'tỷ lệ tuân thủ vệ sinh tay': { category: 'HAND_HYGIENE' },
  'tỷ lệ viêm phổi do nhiễm khuẩn bệnh viện': { category: 'VAP' },
  'tỷ số điều dưỡng/người bệnh': { category: 'NURSE_PATIENT_RATIO' },
};

const IndicatorOverviewModule: React.FC = () => {
  const { setCategory } = useIndicators();
  const [configs, setConfigs] = useState<IndicatorConfig[]>([]);
  const [chiSoList, setChiSoList] = useState<ChiSoQlcl[]>([]);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [filterKhoa, setFilterKhoa] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Compute selected date range based on preset
  const selectedRange = useMemo((): { start: Date; end: Date } | null => {
    const now = new Date();
    if (timePeriod === 'week') {
      const day = now.getDay() || 7; // Mon=1..Sun=7
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { start: mon, end: sun };
    }
    if (timePeriod === 'month') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    }
    if (timePeriod === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), q * 3, 1),
        end: new Date(now.getFullYear(), q * 3 + 3, 0),
      };
    }
    if (timePeriod === 'year') {
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31),
      };
    }
    if (timePeriod === 'custom' && customFrom && customTo) {
      return { start: new Date(customFrom), end: new Date(customTo) };
    }
    return null;
  }, [timePeriod, customFrom, customTo]);

  // Label for current range
  const rangeLabel = useMemo(() => {
    if (!selectedRange) return '';
    const fmt = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${fmt(selectedRange.start)} – ${fmt(selectedRange.end)}`;
  }, [selectedRange]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // 1. Fetch Configs and Basic Results (fallback)
      const [cfgs, cs] = await Promise.all([fetchIndicatorConfigs(), fetchChiSoQlcl()]);
      setConfigs(cfgs);
      setChiSoList(cs);

      // 2. Fetch all specific source data for live calculation
      const [
        bedUsage, orUsage, nonMedical, medical, examTime, los,
        ssi, surgery2, ktcm, handHygiene, vap, nurseRatio
      ] = await Promise.all([
        fetchCongSuatGiuong(), fetchHieuSuatPhongMo(), fetchBcScnyknt(), fetchScykNghiemTrong(),
        fetchGsKhamBenh(), fetchThoiGianNamVien(), fetchDsnKvm(), fetchPtLoai2(),
        fetchKtcmTheoTuyen(), fetchGsVst(), fetchVpbv(), fetchTyLeDD()
      ]);

      const live: Record<string, number> = {};

      if (selectedRange) {
        const { start, end } = selectedRange;
        const inRange = (dStr: string | null | undefined) => {
          if (!dStr) return false;
          const d = new Date(dStr);
          return d >= start && d <= end;
        };
        const khoaMatch = (khoa: string | null | undefined) => !filterKhoa || khoa === filterKhoa;

        // ── Aggregation Logic ──

        // 1. BED_USAGE
        const filteredBed = bedUsage.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.don_vi));
        if (filteredBed.length) live['BED_USAGE'] = Math.round(filteredBed.reduce((s, r) => s + (r.cong_suat || 0), 0) / filteredBed.length * 10) / 10;

        // 2. OR_USAGE
        const filteredOR = orUsage.filter(r => inRange(r.ngay_bao_cao)); // Usually clinic wide
        if (filteredOR.length) live['OR_USAGE'] = Math.round(filteredOR.reduce((s, r) => s + (r.hieu_suat || 0), 0) / filteredOR.length * 10) / 10;

        // 3. SEVERE_NON_MEDICAL
        live['SEVERE_NON_MEDICAL'] = nonMedical.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.don_vi)).length;

        // 4. SEVERE_INCIDENT
        live['SEVERE_INCIDENT'] = medical.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.don_vi)).length;

        // 5. AVG_EXAM_TIME
        const filteredExam = examTime.filter(r => inRange(r.ngay_giam_sat));
        if (filteredExam.length) live['AVG_EXAM_TIME'] = Math.round(filteredExam.reduce((s, r) => s + (r.tong_thoi_gian || 0), 0) / filteredExam.length);

        // 6. AVG_STAY_TIME
        const filteredLOS = los.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.don_vi));
        if (filteredLOS.length) live['AVG_STAY_TIME'] = Math.round(filteredLOS.reduce((s, r) => s + (r.ngay_tb || 0), 0) / filteredLOS.length * 10) / 10;

        // 7. SSI (NKVM)
        const filteredSSI = ssi.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.khoa));
        if (filteredSSI.length) live['SSI'] = Math.round(filteredSSI.reduce((s, r) => s + (r.ty_le_nkvm || 0), 0) / filteredSSI.length * 10) / 10;

        // 8. SURGERY_II
        const filteredSurg = surgery2.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.khoa));
        if (filteredSurg.length) live['SURGERY_II'] = Math.round(filteredSurg.reduce((s, r) => s + (r.ty_le || 0), 0) / filteredSurg.length * 10) / 10;

        // 9. KTCM
        const filteredKtcm = ktcm.filter(r => inRange(r.ngay_bao_cao));
        if (filteredKtcm.length) live['KTCM'] = Math.round(filteredKtcm.reduce((s, r) => s + (r.ty_le || 0), 0) / filteredKtcm.length * 10) / 10;

        // 10. HAND_HYGIENE
        const filteredVst = handHygiene.filter(r => inRange(r.ngay_giam_sat) && khoaMatch(r.khoa_duoc_giam_sat));
        if (filteredVst.length) {
          const totalCoHoi = filteredVst.reduce((s, r) => s + (r.tong_co_hoi || 0), 0);
          const totalTuanThu = filteredVst.reduce((s, r) => s + (r.so_lan_tuan_thu || 0), 0);
          live['HAND_HYGIENE'] = totalCoHoi > 0 ? Math.round((totalTuanThu / totalCoHoi) * 100 * 10) / 10 : 0;
        }

        // 11. VAP
        live['VAP'] = vap.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.khoa)).length;

        // 12. NURSE_PATIENT_RATIO
        const filteredNurse = nurseRatio.filter(r => inRange(r.ngay_bao_cao) && khoaMatch(r.khoa));
        if (filteredNurse.length) live['NURSE_PATIENT_RATIO'] = Math.round(filteredNurse.reduce((s, r) => s + (r.ty_so_dd_nb || 0), 0) / filteredNurse.length * 100) / 100;
      }

      setLiveResults(live);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [selectedRange, filterKhoa]);

  const khoaOptions = useMemo(() =>
    [...new Set(chiSoList.map(c => c.khoa_phong).filter(Boolean) as string[])].sort(),
    [chiSoList]);

  // For each config, find the best matching actual result
  // Config is "active" if its date range overlaps with the selected period
  const enrichedRows = useMemo(() => {
    return configs
      .filter(cfg => {
        // Text search
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!cfg.ten_chi_so.toLowerCase().includes(q) &&
            !(cfg.linh_vuc_ap_dung || '').toLowerCase().includes(q)) return false;
        }
        // Date range overlap: cfg is active if it overlaps the selected period
        if (selectedRange && (cfg.tu_ngay || cfg.den_ngay)) {
          const cfgStart = cfg.tu_ngay ? new Date(cfg.tu_ngay) : new Date('2000-01-01');
          const cfgEnd = cfg.den_ngay ? new Date(cfg.den_ngay) : new Date('2099-12-31');
          // Overlap: cfgStart <= period.end AND cfgEnd >= period.start
          if (cfgStart > selectedRange.end || cfgEnd < selectedRange.start) return false;
        }
        return true;
      })
      .map(cfg => {
        const lowerName = cfg.ten_chi_so.toLowerCase();
        // 1. Try to find mapping to specific module
        const mapped = Object.entries(INDICATOR_MAPPING).find(([key]) => lowerName.includes(key));

        let giaTri: number | undefined = undefined;
        let category: IndicatorCategory | undefined = undefined;

        if (mapped) {
          category = mapped[1].category;
          giaTri = liveResults[category as string];
        }

        // 2. If not mapped or no live data, fallback to generic chi_so_qlcl
        if (giaTri === undefined) {
          const matches = chiSoList.filter(cs => {
            const nameMatch =
              cs.ten_chi_so?.toLowerCase().includes(cfg.ten_chi_so.toLowerCase()) ||
              cfg.ten_chi_so.toLowerCase().includes(cs.ten_chi_so?.toLowerCase() || '');
            const khoaMatch = filterKhoa ? cs.khoa_phong === filterKhoa : true;
            // Match actual result within the selected period via thang_nam
            let timeMatch = true;
            if (selectedRange && cs.thang_nam) {
              const [mm, yyyy] = cs.thang_nam.split('/');
              if (mm && yyyy) {
                const resultDate = new Date(parseInt(yyyy), parseInt(mm) - 1, 1);
                timeMatch = resultDate >= selectedRange.start && resultDate <= selectedRange.end;
              }
            }
            return nameMatch && khoaMatch && timeMatch;
          });
          giaTri = matches.length > 0 ? matches[matches.length - 1].gia_tri : undefined;
        }

        return { cfg, giaTri, category };
      });
  }, [configs, chiSoList, liveResults, selectedRange, filterKhoa, searchTerm]);

  // Group by linh_vuc_ap_dung
  const groupedRows = useMemo(() => {
    const map: Record<string, typeof enrichedRows> = {};
    enrichedRows.forEach(r => {
      const key = r.cfg.linh_vuc_ap_dung || 'Chung';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [enrichedRows]);

  // KPI summary
  const total = enrichedRows.length;
  const withData = enrichedRows.filter(r => r.giaTri !== undefined && r.giaTri !== null);
  const statusCounts = withData.reduce((acc, r) => {
    const s = getEvaluationStatus(r.giaTri, r.cfg.muc_tieu, r.cfg.danh_gia, r.cfg.don_vi_tinh);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const datCount = (statusCounts['SUCCESS'] || 0);
  const vuotCount = (statusCounts['EXCEEDED'] || 0);
  const canhBaoCount = (statusCounts['WARNING'] || 0);
  const chuaDatCount = (statusCounts['FAILED'] || 0);
  const noDataCount = total - withData.length;

  const overallRate = withData.length > 0
    ? Math.round(((datCount + vuotCount + canhBaoCount) / withData.length) * 100)
    : 0;

  // Assign color index globally across all indicators
  let colorCounter = 0;
  const groupedWithColors = Object.entries(groupedRows).map(([key, rows]) => ({
    key,
    rows: rows.map(r => ({ ...r, colorIdx: colorCounter++ })),
  }));

  const indicatorMenuItems: { id: IndicatorCategory; name: string; icon: React.ReactNode; iconClass: string; bgClass: string }[] = [
    { id: 'KTCM', name: 'KTCM', icon: <Microscope />, iconClass: 'text-teal-500', bgClass: 'bg-teal-300' },
    { id: 'SURGERY_II', name: 'PT LOẠI II', icon: <Syringe />, iconClass: 'text-rose-500', bgClass: 'bg-rose-300' },
    { id: 'SSI', name: 'NKVM', icon: <Shield />, iconClass: 'text-cyan-500', bgClass: 'bg-cyan-300' },
    { id: 'VAP', name: 'VP-NKBV', icon: <HeartPulse />, iconClass: 'text-indigo-500', bgClass: 'bg-indigo-300' },
    { id: 'SEVERE_INCIDENT', name: 'SCYK', icon: <AlertCircle />, iconClass: 'text-red-500', bgClass: 'bg-red-300' },
    { id: 'SEVERE_NON_MEDICAL', name: 'SC-NGOÀI', icon: <Shield />, iconClass: 'text-amber-500', bgClass: 'bg-amber-300' },
    { id: 'AVG_EXAM_TIME', name: 'TG KHÁM', icon: <Clock />, iconClass: 'text-blue-500', bgClass: 'bg-blue-300' },
    { id: 'AVG_STAY_TIME', name: 'TG NẰM VIỆN', icon: <Calendar />, iconClass: 'text-orange-500', bgClass: 'bg-orange-300' },
    { id: 'BED_USAGE', name: 'CS GIƯỜNG', icon: <BedDouble />, iconClass: 'text-green-500', bgClass: 'bg-green-300' },
    { id: 'OR_USAGE', name: 'SD PHÒNG MỔ', icon: <Activity />, iconClass: 'text-violet-500', bgClass: 'bg-violet-300' },
    { id: 'NURSE_PATIENT_RATIO', name: 'ĐD/NB', icon: <Users />, iconClass: 'text-sky-500', bgClass: 'bg-sky-300' },
    { id: 'HAND_HYGIENE', name: 'VỆ SINH TAY', icon: <Hand />, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-300' },
    { id: 'INDICATOR_CONFIG', name: 'CẤU HÌNH', icon: <ClipboardList />, iconClass: 'text-slate-500', bgClass: 'bg-slate-300' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Mobile Navigation Grid ── */}
      <div className="lg:hidden bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-50 mb-8">
        <div className="function-icon-grid">
          {indicatorMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCategory(item.id)}
              className="function-icon-tile group"
            >
              <span className={`function-icon-box ${item.bgClass}`}>
                {React.cloneElement(item.icon as any, { size: 28, className: item.iconClass })}
              </span>
              <span className="function-icon-label uppercase">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="hidden md:block text-main-title font-bold text-slate-800 uppercase">Tổng quan Chỉ số QLCL</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">So sánh mục tiêu – kết quả</p>
        </div>
        <button
          onClick={loadAll}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-black text-slate-500 uppercase transition-all shadow-sm shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="indicator-overview-filter-bar bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        {/* Row 1: Search + Time preset + Unit */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm tên chỉ số..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-table font-bold focus:ring-2 focus:ring-[#059669]/20 transition-all"
            />
          </div>

          {/* Time preset buttons */}
          <div className="indicator-overview-quick-filter flex items-center gap-1.5 bg-slate-50 rounded-xl p-1">
            {([
              { val: 'week', label: 'Tuần này' },
              { val: 'month', label: 'Tháng này' },
              { val: 'quarter', label: 'Quý này' },
              { val: 'year', label: 'Năm này' },
              { val: 'custom', label: 'Tùy chọn' },
            ] as const).map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setTimePeriod(val)}
                className={`indicator-overview-quick-filter-button px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${timePeriod === val
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:shadow-sm'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[180px]">
            <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={filterKhoa}
              onChange={e => setFilterKhoa(e.target.value)}
              className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#059669]/20 appearance-none cursor-pointer"
            >
              <option value="">Tất cả đơn vị</option>
              {khoaOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Custom date range (only when 'custom' selected) */}
        {timePeriod === 'custom' && (
          <div className="flex items-center gap-3 pt-1">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#059669]/20 outline-none"
              />
              <span className="text-slate-400 font-bold text-sm">–</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#059669]/20 outline-none"
              />
            </div>
          </div>
        )}

        {/* Active range label */}
        {rangeLabel && (
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
            <Calendar size={11} />
            Phạm vi: <span className="text-[#059669] font-black">{rangeLabel}</span>
          </p>
        )}
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng chỉ số', val: total, Icon: Target, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Vượt chỉ tiêu', val: vuotCount, Icon: Star, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
          { label: 'Đạt mục tiêu', val: `${datCount} (${overallRate}%)`, Icon: CheckCircle2, color: 'text-[#059669]', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Không đạt', val: chuaDatCount, Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Chờ dữ liệu', val: noDataCount, Icon: Minus, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
        ].map(({ label, val, Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <Icon size={18} className={`${color} shrink-0`} />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress bar groups ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <RefreshCw size={36} className="mx-auto mb-4 animate-spin text-[#059669]/30" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-300">Đang tải dữ liệu...</p>
        </div>
      ) : enrichedRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-300">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-xs font-black uppercase tracking-widest">Không tìm thấy chỉ số nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enrichedRows.map((r, idx) => (
            <IndicatorCard
              key={r.cfg.id}
              cfg={r.cfg}
              giaTri={r.giaTri}
              colorIdx={idx}
              onClick={r.category ? () => setCategory(r.category!) : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Warning footer ── */}
      {!loading && chuaDatCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
          <TrendingDown size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-red-800 uppercase tracking-wider mb-1">Chỉ số cần cải thiện</p>
            <p className="text-xs text-red-600 font-bold">
              Có <strong>{chuaDatCount}</strong> chỉ số không đạt mục tiêu. Cần có biện pháp cải thiện kịp thời.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorOverviewModule;
