import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Activity, AlertCircle, ShieldCheck, HandMetal, FileText, ArrowLeft, Pill, Bell, TrendingDown, Users } from 'lucide-react';
import { JCIFallIncidentsModule } from './JCIFallIncidentsModule';
import { JCICriticalResultsModule } from './JCICriticalResultsModule';
import { JCIHandoverIncidentsModule } from './JCIHandoverIncidentsModule';
import { NdnbMonitoringModule } from './NdnbMonitoringModule';
import { SurgerySafetyModule } from './SurgerySafetyModule';
import { HandHygieneModule } from './HandHygieneModule';
import { usePermissions } from '../contexts/PermissionsContext';
import { fetchJciIndicatorStats, JciIndicatorStats, JciCountRange } from '../readJciCounts';
import DateRangeFilter, { DateFilterState } from './DateRangeFilter';

/** Màu tỷ lệ đạt theo ngưỡng (đồng bộ với badge trong các module giám sát). */
const rateColorClass = (rate: number): string =>
  rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-amber-600' : 'text-red-600';

/** Một ô số liệu nhỏ (giá trị + nhãn) dùng cho khối Tổng / Đạt / Tỷ lệ trên thẻ. */
const MiniStat: React.FC<{ value: React.ReactNode; label: string; valueClass?: string }> = ({ value, label, valueClass = 'text-slate-800' }) => (
  <div className="flex min-w-[44px] flex-col items-center">
    <span className={`text-lg font-black leading-none ${valueClass}`}>{value}</span>
    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
  </div>
);

// Tính khoảng ngày (ISO) từ bộ lọc; null = tất cả thời gian
const computeJciRange = (filter: DateFilterState): JciCountRange | null => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const dow = now.getDay() || 7; // Mon=1..Sun=7
  const iso = (dt: Date) => dt.toISOString();
  const startOf = (dt: Date) => { dt.setHours(0, 0, 0, 0); return dt; };
  const endOf = (dt: Date) => { dt.setHours(23, 59, 59, 999); return dt; };

  switch (filter.type) {
    case 'all':
      return null;
    case 'thisWeek':
      return { start: iso(startOf(new Date(y, m, d - dow + 1))), end: iso(endOf(new Date(y, m, d - dow + 7))) };
    case 'lastWeek':
      return { start: iso(startOf(new Date(y, m, d - dow - 6))), end: iso(endOf(new Date(y, m, d - dow))) };
    case 'thisMonth':
      return { start: iso(startOf(new Date(y, m, 1))), end: iso(endOf(new Date(y, m + 1, 0))) };
    case 'lastMonth':
      return { start: iso(startOf(new Date(y, m - 1, 1))), end: iso(endOf(new Date(y, m, 0))) };
    case 'thisQuarter': {
      const q = Math.floor(m / 3);
      return { start: iso(startOf(new Date(y, q * 3, 1))), end: iso(endOf(new Date(y, q * 3 + 3, 0))) };
    }
    case 'lastQuarter': {
      const q = Math.floor(m / 3);
      return { start: iso(startOf(new Date(y, (q - 1) * 3, 1))), end: iso(endOf(new Date(y, q * 3, 0))) };
    }
    case 'thisYear':
      return { start: iso(startOf(new Date(y, 0, 1))), end: iso(endOf(new Date(y, 11, 31))) };
    case 'lastYear':
      return { start: iso(startOf(new Date(y - 1, 0, 1))), end: iso(endOf(new Date(y - 1, 11, 31))) };
    case 'custom':
      if (filter.startDate && filter.endDate) {
        return { start: iso(startOf(new Date(filter.startDate))), end: iso(endOf(new Date(filter.endDate))) };
      }
      return null;
    default:
      return null;
  }
};

export const JCIModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INDICATORS'>('INDICATORS');
  const [category, setCategory] = useState<string | null>(null);
  const [stats, setStats] = useState<JciIndicatorStats | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: 'all', startDate: '', endDate: '' });
  const { canView } = usePermissions();

  const range = useMemo(() => computeJciRange(dateFilter), [dateFilter]);

  // Thống kê từng chỉ số (tổng / đạt), nạp lại mỗi khi quay về lưới danh mục hoặc đổi bộ lọc
  useEffect(() => {
    if (category) return;
    let cancelled = false;
    setStats(null);
    fetchJciIndicatorStats(range)
      .then(result => { if (!cancelled) setStats(result); })
      .catch(err => console.error('Error loading JCI stats:', err));
    return () => { cancelled = true; };
  }, [category, range]);

  const jciIndicators = [
    { id: 'FALL_RATE', label: 'Tỷ suất NB ngã', icon: TrendingDown, desc: 'Giám sát tỷ suất người bệnh ngã', bgClass: 'bg-red-300', iconClass: 'text-red-500' },
    { id: 'PATIENT_IDENTIFICATION', label: 'Nhận dạng người bệnh', icon: Users, desc: 'Tỷ lệ tuân thủ nhận dạng người bệnh', bgClass: 'bg-blue-300', iconClass: 'text-blue-500' },
    { id: 'CRITICAL_RESULTS', label: 'Thông báo KQ báo động CLS', icon: Bell, desc: 'Thông báo kết quả xét nghiệm/CLS nguy hiểm', bgClass: 'bg-teal-300', iconClass: 'text-teal-500' },
    { id: 'HANDOVER_INCIDENTS', label: 'KQ sự cố liên quan đến bàn giao', icon: AlertCircle, desc: 'Sự cố y khoa liên quan đến bàn giao người bệnh', bgClass: 'bg-purple-300', iconClass: 'text-purple-500' },
    { id: 'SURGERY_SAFETY', label: 'Tuân thủ ATPT', icon: ShieldCheck, desc: 'Tỷ lệ tuân thủ An toàn phẫu thuật', bgClass: 'bg-emerald-300', iconClass: 'text-emerald-500' },
    { id: 'HAND_HYGIENE', label: 'Tuân thủ 5 thời điểm VST', icon: HandMetal, desc: 'Tỷ lệ tuân thủ 5 thời điểm vệ sinh tay', bgClass: 'bg-cyan-300', iconClass: 'text-cyan-500' },
  ].filter(item => canView('JCI', item.id));

  if (category) {
    switch (category) {
      case 'FALL_RATE':
        return <JCIFallIncidentsModule onBack={() => setCategory(null)} />;
      case 'CRITICAL_RESULTS':
        return <JCICriticalResultsModule onBack={() => setCategory(null)} />;
      case 'HANDOVER_INCIDENTS':
        return <JCIHandoverIncidentsModule onBack={() => setCategory(null)} />;
      case 'PATIENT_IDENTIFICATION':
        return <NdnbMonitoringModule onBack={() => setCategory(null)} />;
      case 'SURGERY_SAFETY':
        return <SurgerySafetyModule onBack={() => setCategory(null)} />;
      case 'HAND_HYGIENE':
        return <HandHygieneModule onBack={() => setCategory(null)} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 font-medium space-y-4">
            <p className="text-xl">Phân hệ <span className="font-bold text-teal-600">{category}</span> đang được phát triển.</p>
            <button onClick={() => setCategory(null)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft size={18} /> Quay lại
            </button>
          </div>
        );
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Nhãn chỉ số chất lượng + bộ lọc thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setActiveTab('INDICATORS')}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm
              ${activeTab === 'INDICATORS' ? 'bg-teal-500 text-white shadow-teal-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            Chỉ số chất lượng
          </button>
        </div>
        <DateRangeFilter filter={dateFilter} onChange={setDateFilter} className="sm:justify-end" />
      </div>

      {/* Grid Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <LayoutGrid className="text-teal-500" size={24} /> Danh mục chỉ số
          </h2>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/30">
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 lg:gap-6">
            {jciIndicators.map((item) => {
              const stat = stats ? stats[item.id as keyof JciIndicatorStats] : null;
              const rate = stat && stat.dat !== null && stat.total > 0
                ? (stat.dat / stat.total) * 100
                : 0;
              return (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className="function-icon-tile jci-indicator-tile group lg:rounded-2xl lg:border lg:border-slate-100 lg:bg-white lg:p-5 lg:text-left lg:hover:border-teal-500/30 lg:hover:shadow-xl lg:hover:shadow-teal-500/5"
              >
                {/* Đầu thẻ: icon + tiêu đề chính. Mobile giữ nguyên (icon trên, nhãn dưới nhờ display:contents);
                    desktop icon và tiêu đề nằm cùng một dòng trên cùng. */}
                <div className="contents lg:flex lg:w-full lg:items-center lg:gap-3">
                  <div className={`function-icon-box ${item.bgClass} relative lg:shadow-sm`}>
                    <item.icon size={28} className={item.iconClass} />
                    {/* Mobile/tablet: tổng số phiếu hiển thị dạng huy hiệu trên icon */}
                    {stat && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-teal-600 px-1 text-[10px] font-black leading-none text-white shadow-sm lg:hidden">
                        {stat.total > 99 ? '99+' : stat.total}
                      </span>
                    )}
                  </div>
                  <h4 className="function-icon-label uppercase transition-colors group-hover:text-teal-600 lg:min-w-0 lg:flex-1 lg:text-left lg:text-table lg:font-black lg:normal-case">{item.label}</h4>
                </div>
                {/* Desktop: tiêu đề phụ nằm dưới tiêu đề chính */}
                <p className="mt-1 hidden w-full text-xs font-medium leading-relaxed text-slate-500 lg:block">{item.desc}</p>
                {/* Desktop: khối số liệu Tổng / Đạt / Tỷ lệ ở dưới cùng (chỉ số nhật ký sự cố chỉ có Tổng) */}
                <div className="hidden w-full items-stretch gap-3 border-t border-slate-100 pt-3 lg:mt-auto lg:flex">
                  {!stat ? (
                    <MiniStat value="—" label="phiếu" valueClass="text-teal-600" />
                  ) : stat.dat === null ? (
                    <MiniStat value={stat.total} label="phiếu" valueClass="text-teal-600" />
                  ) : (
                    <>
                      <MiniStat value={stat.total} label="Tổng" />
                      <MiniStat value={stat.dat} label="Đạt" valueClass="text-teal-600" />
                      <MiniStat value={`${rate.toFixed(1)}%`} label="Tỷ lệ" valueClass={rateColorClass(rate)} />
                    </>
                  )}
                </div>
              </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
