import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye, Calendar, Building2,
  Users, CheckCircle2, AlertTriangle, XCircle, FileText, Image,
  Upload, X, Camera, List, RotateCcw,
  ClipboardCheck, AlertCircle, Save, User, ArrowLeft,
  BarChart3, FileSpreadsheet, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  exportVstReportExcel, VST_MIN_OPPORTUNITIES, VST_TARGET, VST_TARGET_HIGH_RISK, VST_SAMPLE_NOTE
} from '../utils/vstReportExcel';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { GsVst } from '../types';
import { fetchGsVst, addGsVst, updateGsVst, deleteGsVst, uploadVstImage } from '../readGsVst';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';

const MOMENTS = [
  "1. Trước khi tiếp xúc người bệnh",
  "2. Trước khi làm thủ thuật vô khuẩn",
  "3. Sau khi tiếp xúc dịch tiết cơ thể",
  "4. Sau khi tiếp xúc người bệnh",
  "5. Sau khi tiếp xúc vật dụng xung quanh người bệnh"
];

export const HandHygieneModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<GsVst[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DmDonVi[]>([]);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [editingItem, setEditingItem] = useState<GsVst | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'DANH_SACH' | 'BAO_CAO'>('DANH_SACH');
  const [filterConfig, setFilterConfig] = useState({
    type: 'thisMonth',
    startDate: '',
    endDate: '',
    department: 'Tất cả'
  });


  const loadData = async () => {
    try {
      setLoading(true);
      const [vstData, dmData] = await Promise.all([
        fetchGsVst(),
        fetchDmDonVi()
      ]);
      setData(vstData);
      setDepartments(dmData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departmentList = useMemo(() => departments.map(d => d.ten_don_vi).filter(Boolean), [departments]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const range = getDateRange(filterConfig.type, filterConfig.startDate, filterConfig.endDate);
      const matchTime = isDateInRange(item.ngay_giam_sat, range);
      const departmentQuery = filterConfig.department.trim().toLowerCase();
      const matchDept = !departmentQuery
        || departmentQuery === 'tất cả'
        || item.khoa_duoc_giam_sat.toLowerCase().includes(departmentQuery);
      return matchDept && matchTime;
    });
  }, [data, filterConfig]);

  if (viewMode === 'FORM') {
    return (
      <VstForm
        item={editingItem}
        isReadOnly={isReadOnly}
        onClose={() => setViewMode('LIST')}
        onSaved={() => { setViewMode('LIST'); loadData(); }}
        currentUser={user}
        departmentList={departmentList}
      />
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-800">Tuân thủ vệ sinh tay 5 thời điểm WHO (IPSG.05.00)</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto">
            <button onClick={() => setActiveTab('DANH_SACH')} className={`px-4 py-2 flex items-center justify-center sm:justify-start gap-2 rounded-xl border transition-all text-sm ${activeTab === 'DANH_SACH' ? 'bg-teal-50 border-teal-200 text-teal-700 font-medium' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <List size={18} className="shrink-0" />
              <span className="sm:hidden">DS thu thập</span>
              <span className="hidden sm:inline">Danh sách thu thập</span>
            </button>
            <button onClick={() => setActiveTab('BAO_CAO')} className={`px-4 py-2 flex items-center justify-center sm:justify-start gap-2 rounded-xl border transition-all text-sm ${activeTab === 'BAO_CAO' ? 'bg-teal-50 border-teal-200 text-teal-700 font-medium' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <BarChart3 size={18} className="shrink-0" />
              <span>Báo cáo quy trình</span>
            </button>
            <button onClick={() => { setEditingItem(null); setIsReadOnly(false); setActiveTab('DANH_SACH'); setViewMode('FORM'); }} className="col-span-2 sm:col-span-1 px-4 py-2 flex items-center justify-center sm:justify-start gap-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm text-sm">
              <Plus size={18} className="shrink-0" />
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        {activeTab === 'DANH_SACH' && (
        <div className="p-4 lg:p-4 pt-0 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
              <DateRangeFilter filter={filterConfig} onChange={(f) => setFilterConfig({...filterConfig, ...f})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Khoa giám sát</label>
              <input
                type="text"
                list="vst-department-filter-options"
                value={filterConfig.department}
                onChange={e => setFilterConfig({...filterConfig, department: e.target.value})}
                placeholder="Gõ để tìm khoa..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-indigo-500/10 focus:ring-4 transition-all"
              />
              <datalist id="vst-department-filter-options">
                <option value="Tất cả">Tất cả khoa</option>
                {departmentList.map(dept => <option key={dept} value={dept} />)}
              </datalist>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilterConfig({ type: 'thisMonth', startDate: '', endDate: '', department: 'Tất cả' })}
                className="w-full p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-dashed border-slate-300 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw size={14} className="inline mr-2" /> Xóa lọc
              </button>
            </div>
          </div>
        </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold tracking-tight">Lỗi: {error}</div>
        ) : activeTab === 'BAO_CAO' ? (
          <VstProcessReport data={data} departmentList={departmentList} />
        ) : (
          <VstList
            data={filteredData}
            onAdd={() => { setEditingItem(null); setIsReadOnly(false); setViewMode('FORM'); }}
            onView={(item) => { setEditingItem(item); setIsReadOnly(true); setViewMode('FORM'); }}
            onEdit={(item) => { setEditingItem(item); setIsReadOnly(false); setViewMode('FORM'); }}
            onDelete={async (id) => {
              if (window.confirm('Bạn có chắc muốn xóa bản ghi giám sát này?')) {
                await deleteGsVst(id!);
                loadData();
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BÁO CÁO QUY TRÌNH (IPSG.05.00)
// Chỉ số chính tính theo TỪNG CƠ HỘI vệ sinh tay:
//   - Không áp dụng = thời điểm không phát sinh cơ hội (co_hoi = false)
//   - Đạt           = co_hoi && compliance
//   - Không đạt     = co_hoi && !compliance
// ---------------------------------------------------------------------------

const VST_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const VST_QUARTERS = [1, 2, 3, 4];

const MOMENT_LABELS = [
  'Thời điểm 1: Trước khi tiếp xúc người bệnh',
  'Thời điểm 2: Trước khi làm thủ thuật sạch/vô khuẩn',
  'Thời điểm 3: Sau khi có nguy cơ phơi nhiễm dịch cơ thể',
  'Thời điểm 4: Sau khi tiếp xúc người bệnh',
  'Thời điểm 5: Sau khi tiếp xúc bề mặt/môi trường xung quanh NB'
];

const vstYearOf = (iso: string) => (iso || '').slice(0, 4);
const vstMonthOf = (iso: string) => Number((iso || '').slice(5, 7));
const vstPct = (rate: number) => `${rate.toFixed(1)}%`;
const vstRate = (dat: number, coHoi: number) => (coHoi > 0 ? (dat / coHoi) * 100 : 0);

/** Số cơ hội và số cơ hội đạt của 1 lượt quan sát */
const opportunitiesOf = (item: GsVst) => {
  const moments = item.checklist_data?.moments || [];
  const coHoi = moments.filter(m => m.co_hoi).length;
  const dat = moments.filter(m => m.co_hoi && m.compliance).length;
  return { coHoi, dat };
};

/** Chỉ số phụ: lượt đạt khi mọi cơ hội áp dụng trong lượt đó đều đạt */
const luotDat = (item: GsVst) => {
  const { coHoi, dat } = opportunitiesOf(item);
  return coHoi > 0 && dat === coHoi;
};

const VstReportTable: React.FC<{
  index: string;
  title: string;
  note?: string;
  headers: string[];
  children: React.ReactNode;
}> = ({ index, title, note, headers, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="bg-[#2E75B6] px-4 py-3">
      <h4 className="font-bold text-white text-sm uppercase tracking-wide">{index}. {title}</h4>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left jci-report-table">
        <thead className="bg-[#1F4E79] text-white font-bold">
          <tr>
            {headers.map((h, i) => (
              <th key={h} className={`p-3 align-middle ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
    {note && <p className="px-4 py-3 text-xs italic text-slate-500 leading-relaxed border-t border-slate-100">{note}</p>}
  </div>
);

const VstProcessReport: React.FC<{ data: GsVst[]; departmentList: string[] }> = ({ data, departmentList }) => {
  const currentYear = new Date().getFullYear();
  const [reportFilter, setReportFilter] = useState({ year: String(currentYear), department: '' });
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    data.forEach(d => {
      const y = vstYearOf(d.ngay_giam_sat);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data, currentYear]);

  const scoped = useMemo(() => {
    const keyword = reportFilter.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = vstYearOf(item.ngay_giam_sat) === reportFilter.year;
      const matchDept = !keyword || (item.khoa_duoc_giam_sat || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, reportFilter]);

  const sumOpportunities = (rows: GsVst[]) =>
    rows.reduce(
      (acc, item) => {
        const { coHoi, dat } = opportunitiesOf(item);
        return { coHoi: acc.coHoi + coHoi, dat: acc.dat + dat };
      },
      { coHoi: 0, dat: 0 }
    );

  const byMonth = useMemo(
    () => VST_MONTHS.map(m => ({
      thang: m,
      label: `Tháng ${m}`,
      ...sumOpportunities(scoped.filter(i => vstMonthOf(i.ngay_giam_sat) === m))
    })),
    [scoped]
  );

  const byQuarter = useMemo(
    () => VST_QUARTERS.map(q => {
      const months = byMonth.filter(m => Math.ceil(m.thang / 3) === q);
      return {
        quy: q,
        label: `Quý ${q}`,
        coHoi: months.reduce((s, m) => s + m.coHoi, 0),
        dat: months.reduce((s, m) => s + m.dat, 0)
      };
    }),
    [byMonth]
  );

  const groupBy = (getKey: (i: GsVst) => string) => {
    const groups = new Map<string, GsVst[]>();
    scoped.forEach(i => {
      const key = (getKey(i) || '').trim() || 'Chưa xác định';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    });
    return Array.from(groups.entries())
      .map(([label, rows]) => ({ label, ...sumOpportunities(rows) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  };

  const byKhoa = useMemo(() => groupBy(i => i.khoa_duoc_giam_sat), [scoped]);
  const byDoiTuong = useMemo(() => groupBy(i => i.doi_tuong), [scoped]);

  const byMoment = useMemo(
    () => MOMENT_LABELS.map((label, idx) => {
      const id = idx + 1;
      const all = scoped.flatMap(i => (i.checklist_data?.moments || []).filter(m => m.id === id));
      return {
        label,
        dat: all.filter(m => m.co_hoi && m.compliance).length,
        khongDat: all.filter(m => m.co_hoi && !m.compliance).length,
        khongApDung: all.filter(m => !m.co_hoi).length
      };
    }),
    [scoped]
  );

  const luot = useMemo(
    () => ({
      dat: scoped.filter(luotDat).length,
      khongDat: scoped.filter(i => !luotDat(i)).length
    }),
    [scoped]
  );

  const totals = useMemo(() => sumOpportunities(scoped), [scoped]);
  const tyLeChung = vstRate(totals.dat, totals.coHoi);
  const tongLuot = luot.dat + luot.khongDat;

  const chartData = useMemo(
    () => byMonth.map(m => ({ ten: m.label, tyLe: Number(vstRate(m.dat, m.coHoi).toFixed(1)), coHoi: m.coHoi })),
    [byMonth]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportVstReportExcel({
        year: reportFilter.year,
        department: reportFilter.department.trim(),
        byMonth: byMonth.map(m => ({ label: m.label, coHoi: m.coHoi, dat: m.dat })),
        byQuarter: byQuarter.map(q => ({ label: q.label, coHoi: q.coHoi, dat: q.dat })),
        byKhoa, byDoiTuong, byMoment, luot, totals
      });
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const OpportunityTable: React.FC<{ index: string; title: string; firstHeader: string; rows: { label: string; coHoi: number; dat: number }[]; note?: string }> = ({ index, title, firstHeader, rows, note }) => {
    const coHoi = rows.reduce((s, r) => s + r.coHoi, 0);
    const dat = rows.reduce((s, r) => s + r.dat, 0);
    return (
      <VstReportTable index={index} title={title} note={note} headers={[firstHeader, 'Tổng số cơ hội', 'Số cơ hội đạt', 'Tỷ lệ tuân thủ %']}>
        {rows.length === 0 ? (
          <tr><td colSpan={4} className="p-6 text-center text-slate-500">Chưa có dữ liệu trong kỳ báo cáo</td></tr>
        ) : (
          rows.map(r => (
            <tr key={r.label} className="hover:bg-slate-50">
              <td className="p-3 text-slate-700">{r.label}</td>
              <td className="p-3 text-center">{r.coHoi}</td>
              <td className="p-3 text-center">{r.dat}</td>
              <td className="p-3 text-center">{vstPct(vstRate(r.dat, r.coHoi))}</td>
            </tr>
          ))
        )}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng</td>
          <td className="p-3 text-center">{coHoi}</td>
          <td className="p-3 text-center">{dat}</td>
          <td className="p-3 text-center">{vstPct(vstRate(dat, coHoi))}</td>
        </tr>
      </VstReportTable>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bộ lọc + xuất Excel */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Năm</label>
            <select value={reportFilter.year} onChange={e => setReportFilter({ ...reportFilter, year: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
              {yearOptions.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Đơn vị</label>
            <input
              type="text"
              list="vst-report-department-options"
              value={reportFilter.department}
              onChange={e => setReportFilter({ ...reportFilter, department: e.target.value })}
              placeholder="Gõ từ khóa để tìm đơn vị... (bỏ trống = tất cả)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <datalist id="vst-report-department-options">
              {departmentList.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>

          <button onClick={handleExport} disabled={exporting} className="w-full px-4 py-2.5 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-70">
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel (A4 dọc)'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Dữ liệu lấy từ bảng DS thu thập · Năm {reportFilter.year}
          {reportFilter.department.trim() ? ` · Đơn vị chứa "${reportFilter.department.trim()}"` : ' · Tất cả đơn vị'}
          {` · ${totals.coHoi} cơ hội VST / ${tongLuot} lượt quan sát`}
        </p>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 text-center text-base sm:text-lg mb-4">
          Xu hướng tỷ lệ tuân thủ vệ sinh tay theo tháng
        </h4>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="ten" angle={-45} textAnchor="end" interval={0} height={64} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: '#475569' }} width={60} label={{ value: 'Tỷ lệ tuân thủ %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 700, fill: '#334155' } }} />
              <RechartsTooltip formatter={(value: any, _n: any, entry: any) => [`${value}% (${entry?.payload?.coHoi || 0} cơ hội)`, 'Tỷ lệ tuân thủ']} />
              <Legend verticalAlign="bottom" height={24} />
              <ReferenceLine y={VST_TARGET} stroke="#059669" strokeDasharray="6 4" label={{ value: `Mục tiêu ${VST_TARGET}%`, position: 'right', style: { fontSize: 10, fill: '#059669' } }} />
              <Line type="linear" dataKey="tyLe" name="Tỷ lệ tuân thủ %" stroke="#4472C4" strokeWidth={2.5} dot={{ r: 3, fill: '#4472C4' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Theo tháng */}
      <VstReportTable
        index="1"
        title="Tổng hợp theo tháng (tính theo từng cơ hội vệ sinh tay)"
        headers={['Tháng', 'Tổng số cơ hội (Mẫu số)', 'Số cơ hội đạt (Tử số)', 'Tỷ lệ tuân thủ %', `Đạt cỡ mẫu tối thiểu? (≥${VST_MIN_OPPORTUNITIES} cơ hội/tháng)`]}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.coHoi}</td>
            <td className="p-3 text-center">{m.dat}</td>
            <td className="p-3 text-center">{vstPct(vstRate(m.dat, m.coHoi))}</td>
            <td className="p-3 text-center">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${m.coHoi >= VST_MIN_OPPORTUNITIES ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {m.coHoi >= VST_MIN_OPPORTUNITIES ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {m.coHoi >= VST_MIN_OPPORTUNITIES ? 'Đạt' : `Chưa đạt (thiếu ${VST_MIN_OPPORTUNITIES - m.coHoi})`}
              </span>
            </td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.coHoi}</td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{vstPct(tyLeChung)}</td>
          <td className="p-3" />
        </tr>
      </VstReportTable>

      {/* 2. Theo quý */}
      <VstReportTable index="2" title="Tổng hợp theo quý" headers={['Quý', 'Tổng số cơ hội', 'Số cơ hội đạt', 'Tỷ lệ tuân thủ %']}>
        {byQuarter.map(q => (
          <tr key={q.quy} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{q.label}</td>
            <td className="p-3 text-center">{q.coHoi}</td>
            <td className="p-3 text-center">{q.dat}</td>
            <td className="p-3 text-center">{vstPct(vstRate(q.dat, q.coHoi))}</td>
          </tr>
        ))}
      </VstReportTable>

      {/* 3. Theo khoa/phòng */}
      <OpportunityTable index="3" title="Phân tổ theo khoa/phòng (tính theo cơ hội)" firstHeader="Khoa/Phòng" rows={byKhoa} note={VST_SAMPLE_NOTE} />

      {/* 4. Theo đối tượng được giám sát */}
      <OpportunityTable index="4" title="Phân tổ theo đối tượng được giám sát" firstHeader="Đối tượng" rows={byDoiTuong} />

      {/* 5. Theo từng thời điểm WHO */}
      <VstReportTable
        index="5"
        title="Phân tổ theo từng thời điểm vệ sinh tay (5 thời điểm WHO)"
        note="Giúp xác định thời điểm nào hay bị bỏ sót nhất. Thời điểm không phát sinh cơ hội được tính là Không áp dụng và loại khỏi mẫu số."
        headers={['Thời điểm', 'Đạt', 'Không đạt', 'Không áp dụng', 'Tổng áp dụng', 'Tỷ lệ % Đạt']}
      >
        {byMoment.map(m => {
          const apDung = m.dat + m.khongDat;
          return (
            <tr key={m.label} className="hover:bg-slate-50">
              <td className="p-3 text-slate-700">{m.label}</td>
              <td className="p-3 text-center text-green-700 font-medium">{m.dat}</td>
              <td className="p-3 text-center text-red-700 font-medium">{m.khongDat}</td>
              <td className="p-3 text-center text-slate-500">{m.khongApDung}</td>
              <td className="p-3 text-center">{apDung}</td>
              <td className="p-3 text-center">{vstPct(vstRate(m.dat, apDung))}</td>
            </tr>
          );
        })}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng (5 thời điểm)</td>
          <td className="p-3 text-center">{byMoment.reduce((s, m) => s + m.dat, 0)}</td>
          <td className="p-3 text-center">{byMoment.reduce((s, m) => s + m.khongDat, 0)}</td>
          <td className="p-3 text-center">{byMoment.reduce((s, m) => s + m.khongApDung, 0)}</td>
          <td className="p-3 text-center">{totals.coHoi}</td>
          <td className="p-3 text-center">{vstPct(tyLeChung)}</td>
        </tr>
      </VstReportTable>

      {/* 6. Chỉ số phụ */}
      <VstReportTable
        index="6"
        title="Tỷ lệ lượt giám sát đạt toàn bộ (chỉ số phụ)"
        note="Mục này đo tỷ lệ LƯỢT quan sát (1 NVYT tại 1 thời điểm giám sát) đạt TẤT CẢ cơ hội áp dụng trong lượt đó — khác với chỉ số chính (mục 1–5) vốn tính theo từng cơ hội đơn lẻ."
        headers={['Kết quả', 'Số lượt', 'Tỷ lệ %']}
      >
        <tr className="hover:bg-slate-50">
          <td className="p-3"><span className="inline-flex items-center gap-1.5 text-green-700 font-medium"><CheckCircle2 size={16} /> Đạt</span></td>
          <td className="p-3 text-center">{luot.dat}</td>
          <td className="p-3 text-center">{vstPct(vstRate(luot.dat, tongLuot))}</td>
        </tr>
        <tr className="hover:bg-slate-50">
          <td className="p-3"><span className="inline-flex items-center gap-1.5 text-red-700 font-medium"><XCircle size={16} /> Không đạt</span></td>
          <td className="p-3 text-center">{luot.khongDat}</td>
          <td className="p-3 text-center">{vstPct(vstRate(luot.khongDat, tongLuot))}</td>
        </tr>
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng</td>
          <td className="p-3 text-center">{tongLuot}</td>
          <td className="p-3 text-center">{tongLuot > 0 ? '100.0%' : '0.0%'}</td>
        </tr>
      </VstReportTable>

      {/* 7. Kết quả chung và so sánh mục tiêu */}
      <VstReportTable
        index="7"
        title="Kết quả chung và so sánh mục tiêu"
        note={`Mục tiêu riêng ≥${VST_TARGET_HIGH_RISK}% áp dụng cho các khoa/khu vực nguy cơ cao (theo danh sách bệnh viện tự xác định và rà soát định kỳ) — đối chiếu với bảng phân tổ theo Khoa/Phòng ở mục 3.`}
        headers={['Nội dung', 'Giá trị', 'Mục tiêu', 'Đánh giá']}
      >
        <tr className="hover:bg-slate-50">
          <td className="p-3 text-slate-700">Tỷ lệ tuân thủ chung toàn viện (năm báo cáo)</td>
          <td className="p-3 text-center font-bold">{vstPct(tyLeChung)}</td>
          <td className="p-3 text-center">≥ {VST_TARGET}%</td>
          <td className="p-3 text-center">
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${tyLeChung >= VST_TARGET ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {tyLeChung >= VST_TARGET ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {tyLeChung >= VST_TARGET ? 'Đạt mục tiêu' : 'Chưa đạt mục tiêu'}
            </span>
          </td>
        </tr>
      </VstReportTable>
    </div>
  );
};

const VstList = ({ data, onView, onEdit, onDelete, onAdd }: { data: GsVst[], onView: (item: GsVst) => void, onEdit: (item: GsVst) => void, onDelete: (id: string) => void, onAdd: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchedData = useMemo(() => {
    return data.filter(item =>
      item.khoa_duoc_giam_sat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoi_duoc_giam_sat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
       <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} /> Thêm phiếu giám sát
        </button>
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Tìm theo khoa, người được giám sát..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-standardized">
          <thead className="bg-[#059669] text-white">
            <tr>
              <th className="p-4">Thời gian</th>
              <th className="p-4">Khoa được giám sát</th>
              <th className="p-4">Đối tượng</th>
              <th className="p-4 text-center">Cơ hội</th>
              <th className="p-4 text-center">Tuân thủ</th>
              <th className="p-4 text-center">Kỹ thuật</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {searchedData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-800 tracking-tight">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</span>
                    <span className="text-[10px] text-slate-400 uppercase mt-1">Người GS: {item.nguoi_giam_sat}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <span className="text-sm text-slate-700 uppercase tracking-tight">{item.khoa_duoc_giam_sat}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-block w-fit ${item.doi_tuong === 'Bác sỹ' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                      {item.doi_tuong}
                    </span>
                    <span className="text-sm text-slate-600 mt-1">{item.nguoi_duoc_giam_sat}</span>
                  </div>
                </td>
                <td className="p-6 text-center text-sm text-slate-700">{item.tong_co_hoi}</td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center">
                      <span className="text-sm text-emerald-600">{item.so_lan_tuan_thu}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                        {item.tong_co_hoi > 0 ? ((item.so_lan_tuan_thu / item.tong_co_hoi) * 100).toFixed(1) : 0}%
                      </span>
                   </div>
                </td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center">
                      <span className="text-sm text-indigo-600">{item.so_lan_dung_ky_thuat}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                        {item.so_lan_tuan_thu > 0 ? ((item.so_lan_dung_ky_thuat / item.so_lan_tuan_thu) * 100).toFixed(1) : 0}%
                      </span>
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex items-center justify-end gap-2 text-sm">
                     <button onClick={() => onView(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100"><Eye size={16} /></button>
                     <button onClick={() => onEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100"><Edit2 size={16} /></button>
                     <button onClick={() => onDelete(item.id!)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {searchedData.map(item => (
          <div key={item.id} className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#059669]/10 text-[#059669] rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Supervisor: {item.nguoi_giam_sat}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onView(item)} className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl active:scale-90 transition-all"><Eye size={16} /></button>
                <button onClick={() => onEdit(item)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl active:scale-90 transition-all"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(item.id!)} className="p-2.5 text-rose-600 bg-rose-50 rounded-xl active:scale-90 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-black text-slate-700 leading-tight block">{item.nguoi_duoc_giam_sat || 'Chưa nhập họ tên'}</span>
              <span className="text-[10px] font-bold text-slate-500 leading-tight block">Khoa: {item.khoa_duoc_giam_sat}</span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tuân thủ</span>
                <span className="text-sm font-black text-emerald-700">{item.tong_co_hoi > 0 ? ((item.so_lan_tuan_thu / item.tong_co_hoi) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex-1 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 flex flex-col items-center">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Đúng KT</span>
                <span className="text-sm font-black text-indigo-700">{item.so_lan_tuan_thu > 0 ? ((item.so_lan_dung_ky_thuat / item.so_lan_tuan_thu) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cơ hội</span>
                <span className="text-sm font-black text-slate-700">{item.tong_co_hoi}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
        {searchedData.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center opacity-30">
            <FileText size={48} className="mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Chưa có bản ghi giám sát nào</p>
          </div>
        )}
      </div>
  );
};

const VstForm = ({ item, isReadOnly, onClose, onSaved, currentUser, departmentList }: {
  item: GsVst | null,
  isReadOnly: boolean,
  onClose: () => void,
  onSaved: () => void,
  currentUser: any,
  departmentList: string[]
}) => {
  const [formData, setFormData] = useState<GsVst>({
    ngay_giam_sat: item?.ngay_giam_sat || new Date().toISOString().split('T')[0],
    nguoi_giam_sat: item?.nguoi_giam_sat || currentUser?.full_name || '',
    khoa_duoc_giam_sat: item?.khoa_duoc_giam_sat || currentUser?.department || '',
    doi_tuong: item?.doi_tuong || 'Điều dưỡng',
    nguoi_duoc_giam_sat: item?.nguoi_duoc_giam_sat || '',
    checklist_data: item?.checklist_data || {
      moments: MOMENTS.map((name, index) => ({
        id: index + 1,
        name,
        co_hoi: false, // New mapping to template field
        compliance: false,
        correct_technique: false,
        note: ''
      }))
    },
    tong_co_hoi: item?.tong_co_hoi || 0,
    so_lan_tuan_thu: item?.so_lan_tuan_thu || 0,
    so_lan_dung_ky_thuat: item?.so_lan_dung_ky_thuat || 0,
    hinh_anh_minh_chung: item?.hinh_anh_minh_chung || [],
    ghi_chu_chung: item?.ghi_chu_chung || ''
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tự động tính toán số liệu khi checklist thay đổi
  useEffect(() => {
    if (isReadOnly) return;
    const moments = formData.checklist_data.moments;
    const tong_co_hoi = moments.filter((m: any) => m.co_hoi).length;
    const so_lan_tuan_thu = moments.filter((m: any) => m.co_hoi && m.compliance).length;
    const so_lan_dung_ky_thuat = moments.filter((m: any) => m.co_hoi && m.compliance && m.correct_technique).length;

    setFormData((prev: GsVst) => ({
      ...prev,
      tong_co_hoi,
      so_lan_tuan_thu,
      so_lan_dung_ky_thuat
    }));
  }, [formData.checklist_data.moments, isReadOnly]);

  const handleToggle = (id: number, field: 'co_hoi' | 'compliance' | 'correct_technique') => {
    if (isReadOnly) return;
    setFormData((prev: GsVst) => {
      const newMoments = prev.checklist_data.moments.map((m: any) => {
        if (m.id === id) {
          const newVal = !m[field];
          const updated = { ...m, [field]: newVal };

          // Ràng buộc: Nếu không tuân thủ thì không thể đúng kỹ thuật
          if (field === 'compliance' && !newVal) updated.correct_technique = false;
          // Ràng buộc: Nếu không có cơ hội thì không có tuân thủ/kỹ thuật
          if (field === 'co_hoi' && !newVal) {
            updated.compliance = false;
            updated.correct_technique = false;
          }
          return updated;
        }
        return m;
      });
      return { ...prev, checklist_data: { moments: newMoments } };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadVstImage(file));
      const urls = await Promise.all(uploadPromises);
      setFormData((prev: GsVst) => ({
        ...prev,
        hinh_anh_minh_chung: [...prev.hinh_anh_minh_chung, ...urls]
      }));
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Lỗi khi tải ảnh lên: ' + (err.message || 'Không rõ nguyên nhân'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    if (isReadOnly) return;
    setFormData((prev: GsVst) => ({
      ...prev,
      hinh_anh_minh_chung: prev.hinh_anh_minh_chung.filter((u: string) => u !== url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item?.id) await updateGsVst(item.id, formData);
      else await addGsVst(formData);
      onSaved();
    } catch (err: any) {
      console.error('Error saving hand hygiene monitoring:', err);
      alert('Lỗi khi lưu giám sát: ' + (err?.message || 'Không rõ nguyên nhân'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-8rem)]">
      <div className="w-full flex flex-col h-full animate-in fade-in duration-500">
        <div className="flex flex-col h-full bg-white">

          {/* Form Header - Emerald Theme */}
          <div className="bg-emerald-600 p-4 md:p-8 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex min-w-0 items-center gap-3 md:gap-5 relative z-10">
              <button
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner hover:bg-white/30 transition-all active:scale-90 shrink-0"
              >
                 <ArrowLeft size={20} className="text-white md:hidden" />
                 <ArrowLeft size={24} className="text-white hidden md:block" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base md:text-2xl font-black uppercase tracking-normal md:tracking-tight leading-tight md:leading-none mb-0.5 md:mb-1 break-words">
                  {isReadOnly ? 'Chi tiết Giám sát' : item ? 'Cập nhật bản ghi' : 'Thêm phiếu Giám sát'}
                </h2>
                <p className="text-emerald-100 text-[9px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-widest opacity-80">Giám sát vệ sinh tay</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90 relative z-10 hidden md:block"
            >
              <X size={28}/>
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <form id="vst-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Thông tin chung - Grid Layout from Template */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <Calendar size={14} /> Ngày giám sát
                </label>
                <input
                  type="date"
                  value={formData.ngay_giam_sat}
                  onChange={e => setFormData({...formData, ngay_giam_sat: e.target.value})}
                  disabled={isReadOnly}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <User size={14} /> Người giám sát
                </label>
                <input
                  type="text"
                  value={formData.nguoi_giam_sat}
                  onChange={e => setFormData({...formData, nguoi_giam_sat: e.target.value})}
                  disabled={isReadOnly}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="Họ tên người GS"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <Building2 size={14} /> Khoa giám sát
                </label>
                <input
                  type="text"
                  list="vst-form-department-options"
                  value={formData.khoa_duoc_giam_sat}
                  onChange={e => setFormData({...formData, khoa_duoc_giam_sat: e.target.value})}
                  disabled={isReadOnly}
                  placeholder="Gõ để tìm hoặc nhập khoa/phòng"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
                <datalist id="vst-form-department-options">
                  {departmentList.map((d: string) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <Users size={14} /> Đối tượng được giám sát
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.doi_tuong}
                    onChange={e => setFormData({...formData, doi_tuong: e.target.value})}
                    disabled={isReadOnly}
                    className="w-24 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none text-center"
                  >
                    <option value="Bác sỹ">BS</option>
                    <option value="Điều dưỡng">ĐD</option>
                    <option value="Hộ lý">HL</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <input
                    type="text"
                    value={formData.nguoi_duoc_giam_sat}
                    onChange={e => setFormData({...formData, nguoi_duoc_giam_sat: e.target.value})}
                    disabled={isReadOnly}
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    placeholder="Họ tên NVYT"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Checklist Quan sát - Table from Template */}
            <div className={`space-y-4 ${isReadOnly ? 'hidden md:block' : ''}`}>
              <div className="flex items-center border-b border-slate-100 pb-3">
                 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 size={18} className="text-emerald-600" /> Bảng quan sát chi tiết (5 Thời điểm)
                 </h3>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="p-4 border-b w-[280px]">Thời điểm</th>
                      <th className="p-4 border-b text-center w-24">Đạt</th>
                      <th className="p-4 border-b text-center w-24">Không đạt</th>
                      <th className="p-4 border-b text-center w-32">Không áp dụng</th>
                      <th className="p-4 border-b">Ghi chú chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {formData.checklist_data.moments.map((m: any) => (
                      <tr
                        key={m.id}
                        className={`transition-all border-b last:border-0 hover:bg-slate-50/50`}
                      >
                        <td className="p-4 border-r border-slate-100">
                          <span className="font-bold text-slate-700 block text-[11px] leading-tight uppercase">
                            {m.name}
                          </span>
                        </td>
                        <td className="p-4 border-r border-slate-100 text-center">
                          <input
                            type="radio"
                            name={`moment_${m.id}`}
                            disabled={isReadOnly}
                            className="w-5 h-5 cursor-pointer accent-emerald-600"
                            checked={m.co_hoi && m.compliance}
                            onChange={() => {
                              if (isReadOnly) return;
                              const newMoments = formData.checklist_data.moments.map((item: any) => 
                                item.id === m.id ? { ...item, co_hoi: true, compliance: true, correct_technique: true } : item
                              );
                              setFormData({ ...formData, checklist_data: { moments: newMoments } });
                            }}
                          />
                        </td>
                        <td className="p-4 border-r border-slate-100 text-center">
                          <input
                            type="radio"
                            name={`moment_${m.id}`}
                            disabled={isReadOnly}
                            className="w-5 h-5 cursor-pointer accent-rose-600"
                            checked={m.co_hoi && !m.compliance}
                            onChange={() => {
                              if (isReadOnly) return;
                              const newMoments = formData.checklist_data.moments.map((item: any) => 
                                item.id === m.id ? { ...item, co_hoi: true, compliance: false, correct_technique: false } : item
                              );
                              setFormData({ ...formData, checklist_data: { moments: newMoments } });
                            }}
                          />
                        </td>
                        <td className="p-4 border-r border-slate-100 text-center">
                          <input
                            type="radio"
                            name={`moment_${m.id}`}
                            disabled={isReadOnly}
                            className="w-5 h-5 cursor-pointer accent-slate-400"
                            checked={!m.co_hoi}
                            onChange={() => {
                              if (isReadOnly) return;
                              const newMoments = formData.checklist_data.moments.map((item: any) => 
                                item.id === m.id ? { ...item, co_hoi: false, compliance: false, correct_technique: false } : item
                              );
                              setFormData({ ...formData, checklist_data: { moments: newMoments } });
                            }}
                          />
                        </td>
                        <td className="p-3">
                          {isReadOnly ? (
                            String(m.note || '').trim() ? (
                              <p className="px-2 py-1 text-xs font-bold text-black">{m.note}</p>
                            ) : null
                          ) : (
                            <input
                              type="text"
                              value={m.note}
                              onChange={e => {
                                const newMoments = formData.checklist_data.moments.map((item: any) => item.id === m.id ? { ...item, note: e.target.value } : item);
                                setFormData({ ...formData, checklist_data: { moments: newMoments } });
                              }}
                              placeholder="..."
                              className="w-full bg-transparent border-b border-transparent focus:border-emerald-300 outline-none px-2 py-1 text-xs font-bold italic text-slate-500"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

              <div className="bg-indigo-50/50 border border-indigo-100 rounded-[28px] p-4 md:p-6 shadow-xl shadow-indigo-900/5">
                <div className="grid grid-cols-2 gap-2 md:gap-4 divide-x divide-indigo-100">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cơ hội</span>
                    <span className="text-lg md:text-2xl font-black text-slate-800">{formData.tong_co_hoi}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 ${isReadOnly ? 'text-black' : 'text-slate-400'}`}>Đạt</span>
                    <span className="text-lg md:text-2xl font-black text-emerald-600">{formData.so_lan_tuan_thu}</span>
                  </div>
                </div>
              </div>

            {/* Evidence Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
                 <Image size={18} className="text-emerald-500" />
                 Hình ảnh minh chứng
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.hinh_anh_minh_chung.map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-square group rounded-[24px] overflow-hidden border border-slate-200">
                    <img src={url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {!isReadOnly && (
                   <label className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all">
                        {uploading ? <Upload className="animate-bounce" size={20} /> : <Plus size={24} />}
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{uploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
                      <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                   </label>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {(!isReadOnly || formData.ghi_chu_chung.trim()) && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ghi chú chung</label>
                {isReadOnly ? (
                  <p className="w-full px-6 py-4 bg-slate-50 rounded-[24px] font-bold text-black whitespace-pre-wrap">
                    {formData.ghi_chu_chung}
                  </p>
                ) : (
                  <textarea
                    value={formData.ghi_chu_chung}
                    onChange={e => setFormData({...formData, ghi_chu_chung: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[24px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all h-24 resize-none"
                    placeholder="Nhập ghi chú thêm nếu có..."
                  />
                )}
              </div>
            )}
          </form>
        </div>

        {/* Form Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 transition-all active:scale-95 bg-white border border-slate-200">Quay lại</button>
          {!isReadOnly && (
            <button
              type="submit"
              form="vst-form"
              disabled={saving || uploading}
              className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Hoàn tất Giám sát'}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
