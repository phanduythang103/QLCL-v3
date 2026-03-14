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
import { IndicatorConfig } from '../types';

// ─── Progress bar row (matching the reference image style) ───────────────────
const BAR_COLORS = [
  'bg-[#009900]',
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

function calcPct(value: number | undefined, target: number | null | undefined): number {
  if (!value || !target || target === 0) return 0;
  return Math.min((value / target) * 100, 100);
}

function isAchieved(value: number | undefined, target: number | null | undefined): boolean | null {
  if (value === undefined || value === null || !target) return null;
  return value >= target;
}

const ChartRow = ({
  label,
  value,
  target,
  donVi,
  color,
  iconIndex,
}: {
  label: string;
  value: number | undefined;
  target: number | null | undefined;
  donVi?: string;
  color: string;
  iconIndex: number;
}) => {
  const pct = calcPct(value, target);
  const achieved = isAchieved(value, target);
  const unit = donVi || '%';
  const hasData = value !== undefined && value !== null;
  const RowIcon = getRowIcon(iconIndex);
  const iconColor = color
    .replace('bg-[#009900]', 'text-[#009900]')
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
          <span className="text-sm font-black text-slate-800 group-hover:text-[#009900] transition-colors tracking-tight truncate">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {target !== null && target !== undefined && (
            <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
              Mục tiêu: {target}{unit}
            </span>
          )}
          {hasData ? (
            <span className={`text-sm font-black whitespace-nowrap ${
              achieved === true ? 'text-[#009900]' : achieved === false ? 'text-red-600' : 'text-slate-700'
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
const IndicatorCard = ({ cfg, giaTri, colorIdx }: {
  cfg: IndicatorConfig;
  giaTri: number | undefined;
  colorIdx: number;
}) => {
  const pct = calcPct(giaTri, cfg.muc_tieu);
  const achieved = isAchieved(giaTri, cfg.muc_tieu);
  const hasData = giaTri !== undefined && giaTri !== null;
  const unit = cfg.don_vi_tinh || '%';
  const color = getBarColor(colorIdx);
  const RowIcon = getRowIcon(colorIdx);
  const iconColor = color
    .replace('bg-[#009900]', 'text-[#009900]')
    .replace('bg-indigo-500', 'text-indigo-500')
    .replace('bg-violet-500', 'text-violet-500')
    .replace('bg-cyan-500', 'text-cyan-500')
    .replace('bg-amber-500', 'text-amber-500')
    .replace('bg-pink-500', 'text-pink-500')
    .replace('bg-teal-500', 'text-teal-500')
    .replace('bg-orange-500', 'text-orange-500');

  const statusBadge = !hasData
    ? { label: 'Chờ dữ liệu', cls: 'bg-slate-100 text-slate-400 border-slate-200' }
    : achieved === true
    ? { label: 'Đạt', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    : pct >= 80
    ? { label: 'Cảnh báo', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
    : { label: 'Chưa đạt', cls: 'bg-red-100 text-red-700 border-red-200' };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
      {/* Header: icon + name + badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-slate-50`}>
            <RowIcon size={16} className={iconColor} />
          </div>
          <span className="text-sm font-black text-slate-800 group-hover:text-[#009900] transition-colors leading-snug">
            {cfg.ten_chi_so}
          </span>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Mục tiêu + kết quả */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-slate-400 font-bold">
          {cfg.muc_tieu !== null && cfg.muc_tieu !== undefined
            ? `Mục tiêu: ${cfg.muc_tieu}${unit}`
            : 'Chưa đặt mục tiêu'}
        </span>
        {hasData ? (
          <span className={`text-base font-black ${
            achieved === true ? 'text-[#009900]' : pct >= 80 ? 'text-amber-600' : 'text-red-600'
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
          className={`h-2 rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: hasData ? `${Math.max(pct, 3)}%` : '3%', opacity: hasData ? 1 : 0.2 }}
        />
      </div>
      {hasData && cfg.muc_tieu && (
        <p className="text-[9px] text-slate-400 font-bold mt-1.5 text-right">{Math.round(pct)}% mục tiêu</p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const IndicatorOverviewModule: React.FC = () => {
  const [configs, setConfigs] = useState<IndicatorConfig[]>([]);
  const [chiSoList, setChiSoList] = useState<ChiSoQlcl[]>([]);
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
      const [cfgs, cs] = await Promise.all([fetchIndicatorConfigs(), fetchChiSoQlcl()]);
      setConfigs(cfgs);
      setChiSoList(cs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

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
        const result = matches.length > 0 ? matches[matches.length - 1] : undefined;
        return { cfg, giaTri: result?.gia_tri };
      });
  }, [configs, chiSoList, selectedRange, filterKhoa, searchTerm]);

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
  const datCount = withData.filter(r => isAchieved(r.giaTri, r.cfg.muc_tieu) === true).length;
  const chuaDatCount = withData.filter(r => isAchieved(r.giaTri, r.cfg.muc_tieu) === false).length;
  const noDataCount = total - withData.length;
  const overallRate = withData.length > 0 ? Math.round((datCount / withData.length) * 100) : 0;

  // Assign color index globally across all indicators
  let colorCounter = 0;
  const groupedWithColors = Object.entries(groupedRows).map(([key, rows]) => ({
    key,
    rows: rows.map(r => ({ ...r, colorIdx: colorCounter++ })),
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-black text-slate-800 tracking-tight uppercase">Tổng quan Chỉ số QLCL</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">So sánh mục tiêu – kết quả</p>
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
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        {/* Row 1: Search + Time preset + Unit */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm tên chỉ số..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#009900]/20 transition-all"
            />
          </div>

          {/* Time preset buttons */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl p-1">
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
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
                  timePeriod === val
                    ? 'bg-[#009900] text-white shadow-sm'
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
              className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#009900]/20 appearance-none cursor-pointer"
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
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#009900]/20 outline-none"
              />
              <span className="text-slate-400 font-bold text-sm">–</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#009900]/20 outline-none"
              />
            </div>
          </div>
        )}

        {/* Active range label */}
        {rangeLabel && (
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
            <Calendar size={11} />
            Phạm vi: <span className="text-[#009900] font-black">{rangeLabel}</span>
          </p>
        )}
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng chỉ số', val: total, Icon: Target, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Đạt mục tiêu', val: `${datCount} (${overallRate}%)`, Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Chưa đạt', val: chuaDatCount, Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Chờ dữ liệu', val: noDataCount, Icon: Minus, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
        ].map(({ label, val, Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <Icon size={18} className={`${color} shrink-0`} />
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className={`text-lg font-black ${color}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress bar groups ── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <RefreshCw size={36} className="mx-auto mb-4 animate-spin text-[#009900]/30" />
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
              Có <strong>{chuaDatCount}</strong> chỉ số chưa đạt mục tiêu. Cần có biện pháp cải thiện kịp thời.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorOverviewModule;
