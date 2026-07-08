import React, { useState, useEffect } from 'react';
import {
  Clock, BarChart2, Search, Plus, Edit, Trash2, X,
  CheckCircle2, User, Calendar, Building2, AlertCircle,
  TrendingDown, TrendingUp, Layout, FileText, ChevronDown,
  ChevronRight, Activity, Target, Clipboard, Eye, Users
} from 'lucide-react';
import { fetchTyLeDD, TyLeDD, TyLeDDInput, addTyLeDD, updateTyLeDD, deleteTyLeDD } from '../readTyLeDD';
import { ShiftManpowerModule } from './ShiftManpowerModule';
import { useAuth } from '../contexts/AuthContext';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

const TabButton = ({
  active,
  onClick,
  icon: Icon,
  label,
  bgClass,
  iconClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  bgClass: string;
  iconClass: string;
}) => (
  <button
    onClick={onClick}
    className={`function-icon-tile nurse-ratio-tab-button ${
      active ? 'nurse-ratio-tab-button-active' : ''
    }`}
  >
    <span className={`function-icon-box ${bgClass}`}>
      <Icon size={28} className={iconClass} />
    </span>
    <span className="function-icon-label">{label}</span>
  </button>
);

export const NurseRatioModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH' | 'SHIFT_REPORT'>('OVERVIEW');
  const [records, setRecords] = useState<TyLeDD[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TyLeDD | null>(null);

  // Filter State
  const [filterPreset, setFilterPreset] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const applyPreset = (preset: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'TODAY':
        break;
      case 'YESTERDAY':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        break;
      case 'THIS_WEEK':
        start.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        break;
      case 'LAST_WEEK':
        start.setDate(now.getDate() - now.getDay() - 6);
        end.setDate(now.getDate() - now.getDay());
        break;
      case 'THIS_MONTH':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'LAST_MONTH':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'THIS_YEAR':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'LAST_YEAR':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default: return;
    }

    setFilterPreset(preset);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Form State
  const emptyForm = (): TyLeDDInput => ({
    ngay_bao_cao: new Date().toISOString().split('T')[0],
    nguoi_bao_cao: user?.full_name || '',
    khoa: user?.department || '',
    so_nb_noi_tru: 0,
    so_dd_chuyen_mon: 0,
    so_dd_khong_chuyen_mon: 0,
  });
  const [form, setForm] = useState(emptyForm());

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTyLeDD();
      setRecords(data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const handleEdit = (r: TyLeDD) => {
    setEditingRecord(r);
    setForm({
      ngay_bao_cao: r.ngay_bao_cao,
      nguoi_bao_cao: r.nguoi_bao_cao,
      khoa: r.khoa,
      so_nb_noi_tru: r.so_nb_noi_tru,
      so_dd_chuyen_mon: r.so_dd_chuyen_mon,
      so_dd_khong_chuyen_mon: r.so_dd_khong_chuyen_mon,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa báo cáo này?')) return;
    try {
      await deleteTyLeDD(id);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateTyLeDD(editingRecord.id, form);
      } else {
        await addTyLeDD(form);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Filtered Records
  const filteredRecords = records.filter(r => {
    const matchesDate = r.ngay_bao_cao >= startDate && r.ngay_bao_cao <= endDate;
    const matchesDept = selectedDept === 'ALL' || r.khoa === selectedDept;
    const matchesSearch = r.khoa.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesDept && matchesSearch;
  });

  // Unique Departments for filter
  const uniqueDepts = Array.from(new Set(records.map(r => r.khoa))).sort();

  // Aggregated Stats per Department
  const REGULATION_QUOTA = 0.3; // Default quota: 0.3 nurses per patient (approx 1:3)

  const aggregatedData = React.useMemo(() => {
    const departmentStats: Record<string, { totalDD: number, totalNB: number, count: number }> = {};

    // Use filtered records for aggregation
    filteredRecords.forEach(r => {
      if (!departmentStats[r.khoa]) {
        departmentStats[r.khoa] = { totalDD: 0, totalNB: 0, count: 0 };
      }
      departmentStats[r.khoa].totalDD += r.so_dd_chuyen_mon;
      departmentStats[r.khoa].totalNB += r.so_nb_noi_tru;
      departmentStats[r.khoa].count += 1;
    });

    return Object.entries(departmentStats).map(([khoa, stats]) => {
      const avgDD = stats.totalDD / stats.count;
      const avgNB = stats.totalNB / stats.count;
      const ratio = avgNB > 0 ? (avgDD / avgNB) : 0;
      return {
        khoa,
        avgDD,
        avgNB,
        ratio: Number(ratio.toFixed(2)),
        quota: REGULATION_QUOTA,
        status: ratio >= REGULATION_QUOTA ? 'Đạt' : 'Cần bổ sung'
      };
    }).sort((a, b) => b.ratio - a.ratio);
  }, [filteredRecords]);

  // Grouped Data for List View
  const groupedList = React.useMemo(() => {
    const groups: Record<string, { nb: number, dd: number, other: number, reports: TyLeDD[] }> = {};
    filteredRecords.forEach(r => {
      if (!groups[r.ngay_bao_cao]) {
        groups[r.ngay_bao_cao] = { nb: 0, dd: 0, other: 0, reports: [] };
      }
      groups[r.ngay_bao_cao].nb += r.so_nb_noi_tru;
      groups[r.ngay_bao_cao].dd += r.so_dd_chuyen_mon;
      groups[r.ngay_bao_cao].other += r.so_dd_khong_chuyen_mon;
      groups[r.ngay_bao_cao].reports.push(r);
    });
    return Object.entries(groups).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRecords]);

  const toggleDate = (date: string) => {
    const newSet = new Set(expandedDates);
    if (newSet.has(date)) newSet.delete(date);
    else newSet.add(date);
    setExpandedDates(newSet);
  };

  // Stats
  const avgRatio = filteredRecords.length > 0
    ? (filteredRecords.reduce((a, b) => a + Number(b.ty_so_dd_nb), 0) / filteredRecords.length).toFixed(2)
    : '0.00';
  const totalNB = filteredRecords.reduce((a, b) => a + b.so_nb_noi_tru, 0);
  const totalDD = filteredRecords.reduce((a, b) => a + b.so_dd_chuyen_mon, 0);

  // Chart Data - Aggregated by Date within range
  const chartDataMap = React.useMemo(() => {
    const dateMap: Record<string, { totalRatio: number, totalNB: number, count: number }> = {};
    filteredRecords.forEach(r => {
      const d = r.ngay_bao_cao;
      if (!dateMap[d]) dateMap[d] = { totalRatio: 0, totalNB: 0, count: 0 };
      dateMap[d].totalRatio += Number(r.ty_so_dd_nb);
      dateMap[d].totalNB += r.so_nb_noi_tru;
      dateMap[d].count += 1;
    });
    return Object.keys(dateMap).sort().map(d => ({
      name: d.split('-').reverse().slice(0, 2).join('/'),
      ratio: Number((dateMap[d].totalRatio / dateMap[d].count).toFixed(2)),
      nb: dateMap[d].totalNB
    }));
  }, [filteredRecords]);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="nurse-ratio-stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Tỷ lệ ĐD/NB TB', value: avgRatio, unit: '', icon: Activity, color: 'text-[#059669]', bg: 'bg-[#059669]/10' },
          { label: 'Tổng NB nội trú', value: totalNB, unit: 'NB', icon: User, color: 'text-[#059669]', bg: 'bg-[#059669]/10' },
          { label: 'Tổng ĐD chuyên môn', value: totalDD, unit: 'ĐD', icon: Clipboard, color: 'text-[#059669]', bg: 'bg-[#059669]/10' },
          { label: 'Số khoa báo cáo', value: new Set(filteredRecords.map(r => r.khoa)).size, unit: 'khoa', icon: Building2, color: 'text-[#059669]', bg: 'bg-[#059669]/10' },
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="nurse-ratio-stat-card bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3 md:gap-5 text-center md:text-left">
            <div className={`nurse-ratio-stat-icon w-10 h-10 md:w-14 md:h-14 ${bg} ${color} rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon size={20} className="md:w-7 md:h-7" />
            </div>
            <div className="nurse-ratio-stat-body min-w-0 w-full">
              <p className="nurse-ratio-stat-label text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest truncate">{label}</p>
              <p className="nurse-ratio-stat-value text-xl md:text-3xl font-black text-slate-800 tracking-tight truncate">{value} <span className="nurse-ratio-stat-unit text-[10px] md:text-sm font-bold text-slate-400">{unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
            <BarChart2 size={18} className="text-[#059669]" />
            Xu hướng tỷ số Điều dưỡng/Người bệnh
          </h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartDataMap} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}}
              />
              <RechartsTooltip
                cursor={{fill: '#F8FAFC'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#059669' }}
                labelStyle={{ fontSize: '10px', fontWeight: 800, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}
                formatter={(val: any) => [val, 'Tỷ lệ ĐD/NB']}
              />
              <Bar dataKey="ratio" radius={[6, 6, 0, 0]} barSize={40}>
                {chartDataMap.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartDataMap.length - 1 ? '#059669' : '#05966960'} />
                ))}
                <LabelList dataKey="ratio" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 900, fill: '#64748B' }} />
              </Bar>
              <Line type="monotone" dataKey="ratio" stroke="#DC2626" strokeWidth={2} dot={{ fill: '#DC2626', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-600" />
            Biến động số lượng người bệnh nội trú
          </h3>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartDataMap} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}}
              />
              <RechartsTooltip
                cursor={{fill: '#F8FAFC'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#2563EB' }}
                labelStyle={{ fontSize: '10px', fontWeight: 800, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}
                formatter={(val: any) => [val, 'Số người bệnh']}
              />
              <Bar dataKey="nb" radius={[6, 6, 0, 0]} barSize={40}>
                {chartDataMap.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartDataMap.length - 1 ? '#2563EB' : '#93C5FD'} />
                ))}
                <LabelList dataKey="nb" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 900, fill: '#64748B' }} />
              </Bar>
              <Line type="monotone" dataKey="nb" stroke="#1E40AF" strokeWidth={2} dot={{ fill: '#1E40AF', r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-[#059669]" />
            Bảng tổng hợp theo Khoa/Đơn vị
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            {aggregatedData.length} khoa
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-black w-16">STT</th>
                <th className="px-6 py-4 font-black">Khoa/Đơn vị</th>
                <th className="px-6 py-4 font-black text-center">TB ĐD Chuyên môn/Ngày</th>
                <th className="px-6 py-4 font-black text-center">TB Người bệnh/Ngày</th>
                <th className="px-6 py-4 font-black text-center">Tỷ số ĐD/NB</th>
                <th className="px-6 py-4 font-black text-center">Định mức</th>
                <th className="px-6 py-4 font-black text-right">Tình trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {aggregatedData.map((d, idx) => (
                <tr key={d.khoa} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4 text-xs font-black text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{d.khoa}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-slate-600">{d.avgDD.toFixed(1)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-slate-600">{d.avgNB.toFixed(1)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-[#059669] font-mono">{d.ratio.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-center text-slate-400">{d.quota.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                      d.status === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {aggregatedData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chưa có dữ liệu phân hợp</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderDanhSach = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            placeholder="Tìm theo khoa, ngày..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#059669]/20 transition-all"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-[#059669] text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase hover:shadow-lg active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={18} /> Thêm báo cáo
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="hidden md:table-header-group">
            <tr className="bg-[#059669] text-white text-[10px] uppercase tracking-widest border-b border-[#059669]">
              <th className="px-6 py-4 font-black">Ngày báo cáo</th>
              <th className="px-6 py-4 font-black">Khoa/Đơn vị</th>
              <th className="px-6 py-4 font-black text-center">NB nội trú</th>
              <th className="px-6 py-4 font-black text-center">ĐD chuyên môn</th>
              <th className="px-6 py-4 font-black text-center">ĐD khác</th>
              <th className="px-6 py-4 font-black text-right">Tỷ số ĐD/NB</th>
              <th className="px-6 py-4 font-black text-right w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groupedList.map(group => {
              const isOpen = expandedDates.has(group.date);
              return (
                <React.Fragment key={group.date}>
                  {/* Group Header Row */}
                  <tr
                    onClick={() => toggleDate(group.date)}
                    className={`cursor-pointer transition-colors ${isOpen ? 'bg-slate-50/80 shadow-inner' : 'hover:bg-slate-50/50'}`}
                  >
                    {/* Desktop Header */}
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-md transition-transform duration-300 ${isOpen ? 'rotate-90 bg-[#059669] text-white' : 'text-slate-400 bg-slate-100'}`}>
                          <ChevronRight size={14} />
                        </div>
                        <span className="text-sm font-black text-slate-800">{group.date.split('-').reverse().join('/')}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded-full border border-[#059669]/10">
                          {group.reports.length} báo cáo
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase italic">Tổng số trong ngày</span>
                      </div>
                    </td>

                    {/* Mobile Header (2 columns) */}
                    <td className="md:hidden px-4 py-4" colSpan={2}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded-md transition-transform duration-300 ${isOpen ? 'rotate-90 bg-[#059669] text-white' : 'text-slate-400 bg-slate-100 shadow-sm shrink-0'}`}>
                            <ChevronRight size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 tracking-tight">{group.date.split('-').reverse().join('/')}</span>
                            <span className="text-[9px] font-bold text-[#059669] uppercase tracking-tighter italic">{group.reports.length} báo cáo</span>
                          </div>
                        </div>
                        <div className="text-right border-l border-slate-100 pl-4">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Tổng số NB</p>
                          <p className="text-sm font-black text-slate-800 font-mono leading-none">{group.nb}</p>
                        </div>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-6 py-4 text-xs font-black text-center text-slate-600">{group.nb}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-xs font-black text-center text-[#059669]">{group.dd}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-xs font-black text-center text-slate-400">{group.other}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-right" colSpan={2}>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Click để xem chi tiết</span>
                    </td>
                  </tr>

                  {/* Desktop Detailed Rows */}
                  {isOpen && group.reports.map(r => (
                    <tr key={r.id} className="hidden md:table-row bg-white border-l-4 border-[#059669]/20 hover:bg-slate-50/30 transition-colors group/row">
                      <td className="px-6 py-3 text-[10px] font-bold text-slate-400 pl-12 italic opacity-50">
                        {r.ngay_bao_cao.split('-').reverse().join('/')}
                      </td>
                      <td className="px-6 py-3 text-xs font-black text-slate-800 uppercase tracking-tight">{r.khoa}</td>
                      <td className="px-6 py-3 text-xs font-bold text-center text-slate-500">{r.so_nb_noi_tru}</td>
                      <td className="px-6 py-3 text-xs font-bold text-center text-slate-500">{r.so_dd_chuyen_mon}</td>
                      <td className="px-6 py-3 text-xs font-bold text-center text-slate-300">{r.so_dd_khong_chuyen_mon}</td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-black text-[#059669] font-mono">{r.ty_so_dd_nb}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 transition-all">
                          <button
                            onClick={() => handleEdit(r)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-black uppercase text-[10px] tracking-wider"
                          >
                            <Edit size={14} /> Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all font-black uppercase text-[10px] tracking-wider"
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Mobile Detailed Expansion (ONE table for all reports in group) */}
                  {isOpen && (
                    <tr className="md:hidden">
                      <td colSpan={7} className="p-0">
                        <div className="bg-slate-50/50 border-y border-slate-100/50">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="bg-slate-100/30 text-[8px] uppercase tracking-tighter text-slate-400 font-black">
                                  <th className="px-3 py-2">Khoa</th>
                                  <th className="px-3 py-2 text-center">Số NB</th>
                                  <th className="px-3 py-2 text-center">Số ĐDCS</th>
                                  <th className="px-3 py-2 text-center">Tỷ lệ</th>
                                  <th className="px-3 py-2 text-right">Xem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/50">
                                {group.reports.map(r => (
                                  <tr key={r.id} className="bg-white/40">
                                    <td className="px-3 py-2.5">
                                      <p className="text-[10px] font-black text-slate-700 uppercase leading-none truncate max-w-[80px]">
                                        {r.khoa.includes(' - ') ? r.khoa.split(' - ')[0] : (r.khoa.includes('-') ? r.khoa.split('-')[0] : r.khoa)}
                                      </p>
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600">{r.so_nb_noi_tru}</td>
                                    <td className="px-3 py-2.5 text-center text-[10px] font-bold text-slate-600">{r.so_dd_chuyen_mon}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="text-[10px] font-black text-[#059669] font-mono">{r.ty_so_dd_nb}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                      <button onClick={() => handleEdit(r)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md shadow-sm active:scale-95 transition-all"><Eye size={12} /></button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {groupedList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest italic">Chưa có dữ liệu báo cáo</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="nurse-ratio-module min-h-full flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#059669]/10 rounded-2xl flex items-center justify-center text-[#059669] shadow-sm shrink-0 border border-[#059669]/20">
              <Clipboard size={28} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-800 tracking-tight uppercase">Tỷ lệ Điều dưỡng/Người bệnh</h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">Giám sát mật độ điều dưỡng theo NB nội trú</p>
            </div>
          </div>

          <div className="nurse-ratio-filter-controls flex items-center gap-2">
            <div className="nurse-ratio-dept-filter relative group">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#059669] transition-colors" size={14} />
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="nurse-ratio-dept-select pl-9 pr-8 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-[#059669]/10 focus:border-[#059669] appearance-none shadow-sm cursor-pointer min-w-[140px]"
              >
                <option value="ALL">Tất cả khoa</option>
                {uniqueDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`nurse-ratio-time-filter flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all border ${
                isFilterOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Calendar size={14} />
              {filterPreset === 'CUSTOM' ? `${startDate.split('-').reverse().join('/')} - ${endDate.split('-').reverse().join('/')}` : 'Bộ lọc thời gian'}
              <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'TODAY', label: 'Hôm nay' },
                { id: 'YESTERDAY', label: 'Hôm qua' },
                { id: 'THIS_WEEK', label: 'Tuần này' },
                { id: 'LAST_WEEK', label: 'Tuần trước' },
                { id: 'THIS_MONTH', label: 'Tháng này' },
                { id: 'LAST_MONTH', label: 'Tháng trước' },
                { id: 'THIS_YEAR', label: 'Năm này' },
                { id: 'LAST_YEAR', label: 'Năm trước' },
                { id: 'CUSTOM', label: 'Tùy chọn' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    filterPreset === p.id ? 'bg-[#059669] text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {filterPreset === 'CUSTOM' && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Từ ngày</label>
                  <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setFilterPreset('CUSTOM'); }} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-[#059669]/10" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Đến ngày</label>
                  <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setFilterPreset('CUSTOM'); }} className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-[#059669]/10" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="w-full">
          <div className="nurse-ratio-tab-list function-icon-grid">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" bgClass="bg-sky-300" iconClass="text-sky-600" />
            <TabButton active={activeTab === 'DANH_SACH'} onClick={() => setActiveTab('DANH_SACH')} icon={FileText} label="Danh sách báo cáo" bgClass="bg-green-300" iconClass="text-green-600" />
            <TabButton active={activeTab === 'SHIFT_REPORT'} onClick={() => setActiveTab('SHIFT_REPORT')} icon={Users} label="Nhân lực theo ca" bgClass="bg-violet-300" iconClass="text-violet-600" />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="w-12 h-12 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Đang tải dữ liệu...</p>
          </div>
        ) : activeTab === 'OVERVIEW' ? (
          renderOverview()
        ) : activeTab === 'DANH_SACH' ? (
          renderDanhSach()
        ) : (
          <ShiftManpowerModule hideHeader={true} />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#059669]/10 rounded-xl flex items-center justify-center text-[#059669]">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800">{editingRecord ? 'Cập nhật báo cáo' : 'Báo cáo tỷ lệ ĐD mới'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng nhập đầy đủ các số liệu</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày báo cáo</label>
                  <input type="date" value={form.ngay_bao_cao} onChange={e => setForm({ ...form, ngay_bao_cao: e.target.value })} className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#059669]/20" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Người báo cáo</label>
                  <input value={form.nguoi_bao_cao} readOnly className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold opacity-70" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Building2 size={12} /> Khoa/Đơn vị</label>
                  <input
                    placeholder="Tên khoa thực hiện báo cáo..."
                    value={form.khoa}
                    onChange={e => setForm({ ...form, khoa: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-[#059669]/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Số NB nội trú</label>
                  <input
                    type="number"
                    value={form.so_nb_noi_tru || ''}
                    onChange={e => setForm({ ...form, so_nb_noi_tru: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-[#059669]/20 shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ĐD làm chuyên môn</label>
                  <input
                    type="number"
                    value={form.so_dd_chuyen_mon || ''}
                    onChange={e => setForm({ ...form, so_dd_chuyen_mon: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-[#059669]/20 shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ĐD không chuyên môn</label>
                  <input
                    type="number"
                    value={form.so_dd_khong_chuyen_mon || ''}
                    onChange={e => setForm({ ...form, so_dd_khong_chuyen_mon: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-[#059669]/20 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between bg-[#059669]/10 -mx-8 -mb-8 p-8 mt-auto rounded-b-[40px]">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#059669]/60 tracking-widest">Tỷ số ĐD/NB tự tính</p>
                  <p className="text-3xl font-black text-[#059669] font-mono">
                    {form.so_nb_noi_tru > 0 ? (form.so_dd_chuyen_mon / form.so_nb_noi_tru).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-white/80 rounded-2xl transition-all">Hủy</button>
                  <button type="submit" className="px-10 py-4 bg-[#059669] text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-lg shadow-[#059669]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                    <CheckCircle2 size={18} /> {editingRecord ? 'Cập nhật' : 'Lưu báo cáo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
