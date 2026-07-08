import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, AlertTriangle, TrendingUp, Activity,
  CheckCircle, Smile, Star, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

import { NotificationDashboard } from './NotificationDashboard';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';
import { supabase } from '../supabaseClient';
import DateRangeFilter, { DateFilterState } from './DateRangeFilter';

// Survey services
import { inpatientSatisfactionService } from './Assessment/services/inpatientSatisfactionService';
import { outpatientSatisfactionService } from './Assessment/services/outpatientSatisfactionService';
import { staffSatisfactionService } from './Assessment/services/staffSatisfactionService';
import { ksMeSinhConService } from './Assessment/services/ksMeSinhConService';

// GS services for compliance
import { fetchGsVst } from '../readGsVst';
import { fetchSurgerySafety } from '../readSurgerySafety';
import { fetchGsDrug } from '../readGsDrug';
import { fetchGs5s } from '../readGs5s';
import { fetchGiamSatHsba } from '../readGiamSatHsba';
import { fetchGiamSatNdnb } from '../readGiamSatNdnb';
import { fetchGsCdTruc } from '../readGsCdTruc';
import { fetchGsCapCuu } from '../readGsCapCuu';
import { fetchGsRaVaoVien } from '../readGsRaVaoVien';
import { fetchGsChung } from '../readGsChung';

// Improvement plans
import { fetchKhctcl } from '../readKhctcl';

// ── Helpers ───────────────────────────────────────────────
const getRangeDates = (filter: DateFilterState) => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dow = now.getUTCDay();

  let start = new Date(0);
  let end = new Date();

  // Offset -7h to match Vietnam time if needed, but standard logic matches ReportsModule
  if (filter.type === 'custom') {
    if (filter.startDate) start = new Date(filter.startDate);
    if (filter.endDate) {
      end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }

  if (filter.type === 'all') return { start: new Date(0), end: new Date() };

  if (filter.type === 'thisWeek') {
    start = new Date(Date.UTC(y, m, d - dow + 1));
    end = new Date(Date.UTC(y, m, d - dow + 7, 23, 59, 59));
  } else if (filter.type === 'lastWeek') {
    start = new Date(Date.UTC(y, m, d - dow - 6));
    end = new Date(Date.UTC(y, m, d - dow, 23, 59, 59));
  } else if (filter.type === 'thisMonth') {
    start = new Date(Date.UTC(y, m, 1));
    end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
  } else if (filter.type === 'lastMonth') {
    start = new Date(Date.UTC(y, m - 1, 1));
    end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  } else if (filter.type === 'thisQuarter') {
    const q = Math.floor(m / 3);
    start = new Date(Date.UTC(y, q * 3, 1));
    end = new Date(Date.UTC(y, q * 3 + 3, 0, 23, 59, 59));
  } else if (filter.type === 'lastQuarter') {
    const q = Math.floor(m / 3);
    start = new Date(Date.UTC(y, (q - 1) * 3, 1));
    end = new Date(Date.UTC(y, q * 3, 0, 23, 59, 59));
  } else if (filter.type === 'thisYear') {
    start = new Date(Date.UTC(y, 0, 1));
    end = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
  } else if (filter.type === 'lastYear') {
    start = new Date(Date.UTC(y - 1, 0, 1));
    end = new Date(Date.UTC(y - 1, 11, 31, 23, 59, 59));
  }

  return { start, end };
};

const filterByDate = (rows: any[], dateField: string, filter: DateFilterState) => {
  const { start, end } = getRangeDates(filter);
  const startTime = start.getTime();
  const endTime = end.getTime();

  return rows.filter(r => {
    const val = r[dateField] || r.created_at;
    if (!val) return false;

    // Handle MM/YYYY format for some indicators if any
    if (typeof val === 'string' && /^\d{1,2}\/\d{4}$/.test(val)) {
      const [mon, yr] = val.split('/').map(Number);
      const d = new Date(Date.UTC(yr, mon - 1, 1)).getTime();
      return d >= startTime && d <= endTime;
    }

    const d = new Date(val).getTime();
    return d >= startTime && d <= endTime;
  });
};

// ── StatCard ──────────────────────────────────────────────
const StatCard = React.memo<{
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  accent: string;
  bgColor: string;
}>(({ title, value, subtext, icon, accent, bgColor }) => (
  <div className="ql-card p-5 hover:shadow-md transition-all duration-300 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bgColor, color: accent }}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
      <p className="text-xl font-black text-slate-800 leading-tight">{value}</p>
      {subtext && <p className="text-[10px] font-bold text-slate-400 truncate">{subtext}</p>}
    </div>
  </div>
));
StatCard.displayName = 'StatCard';

// ── Dashboard ─────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  // Independent Filters (Only Date now)
  const [satFilter, setSatFilter] = useState<DateFilterState>({ type: 'all', startDate: '', endDate: '' });
  const [compFilter, setCompFilter] = useState<DateFilterState>({ type: 'all', startDate: '', endDate: '' });

  // Stats state
  const [nhanSuTotal, setNhanSuTotal] = useState(0);
  const [suCoTotal, setSuCoTotal] = useState(0);

  // Satisfaction data
  const [satisfactionData, setSatisfactionData] = useState<any[]>([]);
  const [satisfactionLoading, setSatisfactionLoading] = useState(true);

  // Improvement stats
  const [impStats, setImpStats] = useState({ total: 0, ongoing: 0, done: 0, paused: 0 });
  const [impLoading, setImpLoading] = useState(true);

  // Compliance data
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(true);

  // 1. Load Personnel & Incidents
  const loadBasicStats = useCallback(async () => {
    try {
      const ns = await fetchNhanSuQlcl();
      setNhanSuTotal(ns.length);
      const { count } = await supabase.from('bao_cao_scyk').select('id', { count: 'exact', head: true });
      setSuCoTotal(count || 0);
    } catch (err) { console.error(err); }
  }, []);

  // 2. Load Satisfaction rates
  const loadSatisfactionData = useCallback(async () => {
    setSatisfactionLoading(true);
    try {
      const results = await Promise.allSettled([
        inpatientSatisfactionService.fetchInpatientSurveys(),
        outpatientSatisfactionService.fetchOutpatientSurveys(),
        staffSatisfactionService.fetchSurveys(),
        ksMeSinhConService.fetchAll(),
      ]);

      const labels = ['NB nội trú', 'NB ngoại trú', 'NVYT', 'Bà mẹ sinh con'];
      const dateFields = ['ngay_khao_sat', 'ngay_khao_sat', 'ngay_khao_sat', 'survey_date'];
      const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444'];

      const data = results.map((r, i) => {
        let rows = r.status === 'fulfilled' ? (r.value as any[]) : [];
        rows = filterByDate(rows, dateFields[i], satFilter);

        if (!rows.length) return { name: labels[i], value: 0, color: colors[i] };

        let totalPercent = 0;
        const type = labels[i];

        if (type === 'NB nội trú') {
          const valid = rows.filter(x => x.satisfaction_percent != null);
          totalPercent = valid.length ? valid.reduce((s, x) => s + x.satisfaction_percent, 0) / valid.length : 0;
        }
        else if (type === 'NB ngoại trú') {
          rows.forEach(row => {
            let sum = 0, count = 0;
            for (let j = 1; j <= 15; j++) {
              const val = row[`q${j}`];
              if (val > 0) { sum += val; count++; }
            }
            totalPercent += count > 0 ? (sum / count) * 20 : 0;
          });
          totalPercent /= rows.length;
        }
        else if (type === 'NVYT') {
          rows.forEach(row => {
            let sum = 0, count = 0;
            for (let j = 1; j <= 13; j++) {
              const val = row[`q${j}`];
              if (val != null) { sum += val; count++; }
            }
            totalPercent += count > 0 ? (sum / count) * 20 : 0;
          });
          totalPercent /= rows.length;
        }
        else if (type === 'Bà mẹ sinh con') {
          const valid = rows.filter(x => x.overall_satisfaction != null);
          totalPercent = valid.length ? (valid.reduce((s, x) => s + x.overall_satisfaction, 0) / valid.length) * 20 : 0;
        }

        return { name: labels[i], value: Math.round(totalPercent), color: colors[i] };
      });
      setSatisfactionData(data);
    } catch (err) { console.error(err); }
    setSatisfactionLoading(false);
  }, [satFilter]);

  // 3. Load Improvement stats
  const loadImpStats = useCallback(async () => {
    setImpLoading(true);
    try {
      const plans = await fetchKhctcl();
      setImpStats({
        total: plans.length,
        ongoing: plans.filter(p => p.trang_thai === 'Đang thực hiện').length,
        done: plans.filter(p => p.trang_thai === 'Hoàn thành').length,
        paused: plans.filter(p => p.trang_thai === 'Tạm dừng').length,
      });
    } catch (err) { console.error(err); }
    setImpLoading(false);
  }, []);

  // 4. Load GS compliance rates
  const loadComplianceData = useCallback(async () => {
    setComplianceLoading(true);
    const calcTl = (rows: any[]) => {
      const valid = rows.filter(r => r.ty_le_tuan_thu != null || r.ty_le != null || (r.tong_dat != null && r.tong_muc != null));
      if (!valid.length) return 0;

      const sum = valid.reduce((acc, r) => {
        if (r.ty_le_tuan_thu != null) return acc + r.ty_le_tuan_thu;
        if (r.ty_le != null) return acc + r.ty_le;
        if (r.tong_dat != null && r.tong_muc != null && r.tong_muc > 0) return acc + (r.tong_dat / r.tong_muc) * 100;
        return acc;
      }, 0);

      return Math.round(sum / valid.length);
    };

    try {
      const results = await Promise.allSettled([
        fetchGsVst(),
        fetchSurgerySafety(),
        fetchGsDrug(),
        fetchGs5s(),
        fetchGiamSatHsba(),
        fetchGiamSatNdnb(),
        fetchGsCdTruc(),
        fetchGsCapCuu(),
        fetchGsRaVaoVien(),
        fetchGsChung(),
      ]);

      const labels = [
        'Vệ sinh tay', 'An toàn PT', 'Công khai thuốc', 'GS 5S',
        'Hồ sơ BA', 'Nhận diện NB', 'Trực chuyên môn', 'GS Cấp cứu',
        'Vào/Ra viện', 'GS Chung'
      ];
      const dateFields = [
        'ngay_giam_sat', 'ngay_giam_sat', 'ngay_giam_sat', 'ngay_giam_sat',
        'ngay_giam_sat', 'ngay_giam_sat', 'ngay_kiem_tra', 'ngay_kiem_tra',
        'ngay_giam_sat', 'ngay_giam_sat'
      ];

      setComplianceData(results.map((r, i) => {
        let rows = r.status === 'fulfilled' ? (r.value as any[]) : [];
        rows = filterByDate(rows, dateFields[i], compFilter);
        return {
          name: labels[i],
          score: calcTl(rows),
        };
      }));
    } catch (err) { console.error(err); }
    setComplianceLoading(false);
  }, [compFilter]);

  // Initial load
  useEffect(() => {
    loadBasicStats();
    loadSatisfactionData();
    loadImpStats();
    loadComplianceData();
  }, [loadBasicStats, loadSatisfactionData, loadImpStats, loadComplianceData]);

  // Realtime Subscriptions
  useEffect(() => {
    const tables = [
      { name: 'nhan_su_qlcl', cb: loadBasicStats },
      { name: 'bao_cao_scyk', cb: loadBasicStats },
      { name: 'khctcl', cb: loadImpStats },
      { name: 'ksnb_noi_tru', cb: loadSatisfactionData },
      { name: 'ksnb_ngoai_tru', cb: loadSatisfactionData },
      { name: 'staff_satisfaction_2026_responses', cb: loadSatisfactionData },
      { name: 'ks_me_sinh_con', cb: loadSatisfactionData },
      { name: 'gs_vst', cb: loadComplianceData },
      { name: 'giam_sat_atpt', cb: loadComplianceData },
      { name: 'giam_sat_drug', cb: loadComplianceData },
      { name: 'giam_sat_5s', cb: loadComplianceData },
      { name: 'giam_sat_hsba', cb: loadComplianceData },
      { name: 'giam_sat_ndnb', cb: loadComplianceData },
      { name: 'gs_cd_truc', cb: loadComplianceData },
      { name: 'gs_cap_cuu', cb: loadComplianceData },
      { name: 'gs_ra_vao_vien', cb: loadComplianceData },
      { name: 'gs_chung', cb: loadComplianceData },
    ];

    const channels = tables.map(t =>
      supabase.channel(`${t.name}_dashboard_sync`)
        .on('postgres_changes', { event: '*', table: t.name, schema: 'public' }, () => {
          t.cb();
        })
        .subscribe()
    );

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [loadBasicStats, loadImpStats, loadSatisfactionData, loadComplianceData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Nhân sự QLCL" value={nhanSuTotal.toString()} icon={<Users size={22} />} accent="#059669" bgColor="#f0fdf4" />
        <StatCard title="Sự cố y khoa" value={suCoTotal.toString()} subtext="Tổng ghi nhận" icon={<AlertTriangle size={22} />} accent="#d97706" bgColor="#fffbeb" />
        <StatCard
          title="Cải tiến CL"
          value={impLoading ? '...' : impStats.total.toString()}
          subtext={impLoading ? '' : `Đang TH: ${impStats.ongoing} · HT: ${impStats.done}`}
          icon={<Star size={22} />} accent="#6366f1" bgColor="#eef2ff"
        />
        <StatCard
          title="Tỷ lệ hài lòng TB"
          value={satisfactionLoading ? '...' : (satisfactionData.length ? Math.round(satisfactionData.reduce((s, d) => s + (d.value || 0), 0) / satisfactionData.length) + '%' : '--')}
          subtext="4 phiếu khảo sát"
          icon={<Smile size={22} />} accent="#0891b2" bgColor="#ecfeff"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Mức độ hài lòng */}
          <div className="ql-card p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-[#059669] rounded-full"></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Mức độ hài lòng</h3>
              </div>

              <div className="flex items-center gap-3">
                <DateRangeFilter filter={satFilter} onChange={setSatFilter} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {satisfactionLoading ? (
                <div className="col-span-2 text-center py-10 text-slate-400 font-black uppercase animate-pulse">Đang tải...</div>
              ) : (
                satisfactionData.map((item) => (
                  <div key={item.name} className="p-6 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight truncate">{item.name}</span>
                      </div>
                      <span className="text-lg font-black text-slate-800">{item.value}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.value}%`, backgroundColor: item.color }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tỷ lệ tuân thủ quy trình giám sát */}
          <div className="ql-card p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tỷ lệ tuân thủ quy trình giám sát</h3>
              </div>

              <div className="flex items-center gap-3">
                <DateRangeFilter filter={compFilter} onChange={setCompFilter} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {complianceLoading ? (
                <div className="col-span-2 text-center py-10 text-slate-400 font-black uppercase animate-pulse">Đang tải...</div>
              ) : (
                complianceData.map((item) => (
                  <div key={item.name} className="space-y-3 p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight truncate pr-2 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                      <span className="text-xs font-black text-slate-800">{item.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${item.score}%` }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cải tiến CL Card */}
          <div className="ql-card p-6 md:p-8">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" /> Cải tiến chất lượng
            </h3>
            {impLoading ? (
              <div className="h-24 flex items-center justify-center text-slate-400 text-xs font-black uppercase animate-pulse">Đang tải...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Tổng số', value: impStats.total, color: 'bg-slate-50 text-slate-700' },
                  { label: 'Đang TH', value: impStats.ongoing, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Hoàn thành', value: impStats.done, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Tạm dừng', value: impStats.paused, color: 'bg-amber-50 text-amber-700' },
                ].map(item => (
                  <div key={item.label} className={`rounded-3xl p-6 transition-all border border-transparent hover:border-slate-100 ${item.color}`}>
                    <p className="text-3xl font-black">{item.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-1">
          <NotificationDashboard />
        </div>
      </div>
    </div>
  );
};
