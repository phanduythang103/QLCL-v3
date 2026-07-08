import React, { useState, useEffect } from 'react';
import {
  Clock, BarChart2, ShieldCheck, Search, Plus, Edit, Trash2, Eye, X,
  CheckCircle2, User, Calendar, ChevronDown, Stethoscope, TrendingUp,
  Activity, Target, FileText, ChevronRight, BarChart
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { fetchGsKhamBenh, GsKhamBenh, GsKhamBenhInput, addGsKhamBenh, updateGsKhamBenh, deleteGsKhamBenh, calcTongThoiGian } from '../readGsKhamBenh';
import { fetchPhanTichKb, PhanTichKb, PhanTichKbInput, PhanTichRow, addPhanTichKb, updatePhanTichKb, deletePhanTichKb } from '../readPhanTichKb';
import { useAuth } from '../contexts/AuthContext';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';

const fmtMin = (min: number | null | undefined) => min != null ? `${Math.round(Number(min))} phút` : '—';

// Hiển thị giờ dạng HH:mm (24 giờ), bỏ phần giây nếu có
const fmtTime = (t: string | null | undefined): string => {
  if (!t) return '—';
  // PostgreSQL TIME trả về dạng "07:30:00" hoặc "07:30"
  const parts = t.split(':');
  if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  return t;
};

const timeSteps = [
  { key: 'gio_dang_ky',      label: 'Giờ đăng ký' },
  { key: 'gio_kham',         label: 'Giờ khám' },
  { key: 'gio_ket_qua_xn',   label: 'Kết quả XN máu' },
  { key: 'gio_ket_qua_cdha', label: 'Kết quả CĐHA' },
  { key: 'gio_bs_ket_luan',  label: 'BS kết luận, kê đơn' },
  { key: 'gio_nhan_thuoc',   label: 'Nhận thuốc, ra về' },
];

const TAN_SUAT_OPTIONS = ['Thường xuyên', 'Trung bình', 'Ít', 'Hiếm'];
const TAN_SUAT_COLORS: Record<string, string> = {
  'Thường xuyên': 'bg-red-100 text-red-700',
  'Trung bình':   'bg-orange-100 text-orange-700',
  'Ít':           'bg-yellow-100 text-yellow-700',
  'Hiếm':         'bg-blue-100 text-blue-700',
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`indicator-subtab-button ${
      active ? 'indicator-subtab-button-active' : ''
    }`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export const ExamTimeModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'GIAM_SAT' | 'PHAN_TICH'>('OVERVIEW');

  const [records, setRecords] = useState<GsKhamBenh[]>([]);
  const [analyses, setAnalyses] = useState<PhanTichKb[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState({ type: 'thisMonth', startDate: '', endDate: '' });

  // Supervision Modal
  const [showGsModal, setShowGsModal] = useState(false);
  const [editingGs, setEditingGs] = useState<GsKhamBenh | null>(null);
  const [viewingGs, setViewingGs] = useState<GsKhamBenh | null>(null);

  // Analysis Modal
  const [showPtModal, setShowPtModal] = useState(false);
  const [editingPt, setEditingPt] = useState<PhanTichKb | null>(null);

  // Chart State
  const [chartMode, setChartMode] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  // Forms
  const emptyGsForm = (): GsKhamBenhInput => ({
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: user?.full_name || '',
    ma_bn: '',
    gio_dang_ky: null,
    gio_kham: null,
    gio_ket_qua_xn: null,
    gio_ket_qua_cdha: null,
    gio_bs_ket_luan: null,
    gio_nhan_thuoc: null,
    ghi_chu: null,
  });

  const emptyPtRow = (stt: number): PhanTichRow => ({
    stt, nguyen_nhan: '', tan_suat: 'Thường xuyên', giai_phap: '', nguoi_thuc_hien: ''
  });

  const [gsForm, setGsForm] = useState<GsKhamBenhInput>(emptyGsForm());
  const [ptForm, setPtForm] = useState<PhanTichKbInput>({
    ngay_phan_tich: new Date().toISOString().split('T')[0],
    nguoi_phan_tich: user?.full_name || '',
    ma_bn: '',
    noi_dung: [emptyPtRow(1)],
    ghi_chu: null,
  });

  const loadData = async () => {
    setLoading(true);
    const [gsResult, ptResult] = await Promise.all([
      fetchGsKhamBenh().catch(e => { console.error('[ExamTimeModule] fetch GS error:', e); return [] as GsKhamBenh[]; }),
      fetchPhanTichKb().catch(e => { console.warn('[ExamTimeModule] fetch PT error:', e); return [] as PhanTichKb[]; })
    ]);
    setRecords(gsResult);
    setAnalyses(ptResult);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredRecords = records.filter(r => {
    const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
    return isDateInRange(r.ngay_giam_sat, range);
  });

  const filteredAnalyses = analyses.filter(a => {
    const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
    return isDateInRange(a.ngay_phan_tich, range);
  });

  // ── Stats Calculation ──
  const recordsWithTime = filteredRecords.filter(r => r.tong_thoi_gian != null);
  const avgTime = recordsWithTime.length > 0
    ? Math.round(recordsWithTime.reduce((a, r) => a + (r.tong_thoi_gian || 0), 0) / recordsWithTime.length)
    : 0;
  const maxTime = recordsWithTime.length > 0 ? Math.max(...recordsWithTime.map(r => r.tong_thoi_gian || 0)) : 0;
  const minTime = recordsWithTime.length > 0 ? Math.min(...recordsWithTime.map(r => r.tong_thoi_gian!)) : 0;

  // ── Chart Data Logic ──
  const getChartData = () => {
    const dataMap: Record<string, { label: string, total: number, count: number }> = {};
    const now = new Date();

    filteredRecords.forEach(r => {
      const d = new Date(r.ngay_giam_sat);
      let key = '';
      let label = '';

      if (chartMode === 'WEEK' || chartMode === 'MONTH') {
        key = r.ngay_giam_sat;
        label = d.getDate() + '/' + (d.getMonth() + 1);
      } else if (chartMode === 'QUARTER') {
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        label = `Tháng ${d.getMonth() + 1}`;
      } else if (chartMode === 'YEAR') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-Q${q}`;
        label = `Quý ${q}`;
      }

      if (!dataMap[key]) dataMap[key] = { label, total: 0, count: 0 };
      if (r.tong_thoi_gian != null) {
        dataMap[key].total += r.tong_thoi_gian;
        dataMap[key].count += 1;
      }
    });

    return Object.keys(dataMap).sort().map(key => ({
      name: dataMap[key].label,
      avg: Math.round(dataMap[key].total / (dataMap[key].count || 1))
    }));
  };

  const chartData = getChartData();

  // ── Supervision CRUD ──
  const handleAddGs = () => { setEditingGs(null); setGsForm(emptyGsForm()); setShowGsModal(true); };
  const handleEditGs = (r: GsKhamBenh) => {
    setEditingGs(r);
    setGsForm({ ngay_giam_sat: r.ngay_giam_sat, nguoi_giam_sat: r.nguoi_giam_sat, ma_bn: r.ma_bn, gio_dang_ky: r.gio_dang_ky, gio_kham: r.gio_kham, gio_ket_qua_xn: r.gio_ket_qua_xn, gio_ket_qua_cdha: r.gio_ket_qua_cdha, gio_bs_ket_luan: r.gio_bs_ket_luan, gio_nhan_thuoc: r.gio_nhan_thuoc, ghi_chu: r.ghi_chu });
    setShowGsModal(true);
  };
  const handleDeleteGs = async (id: string) => {
    if (!window.confirm('Xóa phiếu giám sát này?')) return;
    await deleteGsKhamBenh(id); await loadData();
  };
  const handleSaveGs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGs) await updateGsKhamBenh(editingGs.id, gsForm);
      else await addGsKhamBenh(gsForm);
      setShowGsModal(false); await loadData();
    } catch (err: any) { alert(`Lỗi: ${err.message}`); }
  };

  // ── Analysis CRUD ──
  const handleAddPt = () => {
    setEditingPt(null);
    setPtForm({ ngay_phan_tich: new Date().toISOString().split('T')[0], nguoi_phan_tich: user?.full_name || '', ma_bn: '', noi_dung: [emptyPtRow(1)], ghi_chu: null });
    setShowPtModal(true);
  };
  const handleEditPt = (r: PhanTichKb) => {
    setEditingPt(r);
    setPtForm({ ngay_phan_tich: r.ngay_phan_tich, nguoi_phan_tich: r.nguoi_phan_tich, ma_bn: r.ma_bn, noi_dung: r.noi_dung, ghi_chu: r.ghi_chu });
    setShowPtModal(true);
  };
  const handleDeletePt = async (id: string) => {
    if (!window.confirm('Xóa bảng phân tích này?')) return;
    await deletePhanTichKb(id); await loadData();
  };
  const handleSavePt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPt) await updatePhanTichKb(editingPt.id, ptForm);
      else await addPhanTichKb(ptForm);
      setShowPtModal(false); await loadData();
    } catch (err: any) { alert(`Lỗi: ${err.message}`); }
  };
  const addPtRow = () => setPtForm(prev => ({ ...prev, noi_dung: [...prev.noi_dung, emptyPtRow(prev.noi_dung.length + 1)] }));
  const removePtRow = (idx: number) => setPtForm(prev => ({ ...prev, noi_dung: prev.noi_dung.filter((_, i) => i !== idx).map((r, i) => ({ ...r, stt: i + 1 })) }));
  const updatePtRow = (idx: number, field: keyof PhanTichRow, value: string | number) => {
    setPtForm(prev => { const rows = [...prev.noi_dung]; rows[idx] = { ...rows[idx], [field]: value }; return { ...prev, noi_dung: rows }; });
  };

  // ─────────────────────────────────────────────
  // OVERVIEW TAB
  // ─────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats */}
      <div className="indicator-quick-stats grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng phiếu GS', value: filteredRecords.length, unit: 'phiếu', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Thời gian trung bình', value: avgTime, unit: 'phút', icon: Clock, color: 'text-[#059669]', bg: 'bg-green-50' },
          { label: 'Thời gian tối đa', value: maxTime, unit: 'phút', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Thời gian tối thiểu', value: minTime, unit: 'phút', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="indicator-quick-stat-card bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex gap-4 items-center">
            <div className={`indicator-quick-stat-icon w-11 h-11 ${bg} rounded-xl flex items-center justify-center ${color} shrink-0`}>
              <Icon size={22} />
            </div>
            <div className="indicator-quick-stat-body">
              <p className="indicator-quick-stat-label text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
              <p className="indicator-quick-stat-value text-2xl font-black text-slate-800">{value} <span className="indicator-quick-stat-unit text-xs font-bold text-slate-400">{unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <BarChart size={18} className="text-[#059669]" />
              Xu hướng thời gian khám bệnh trung bình
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dữ liệu phân tích theo thời gian</p>
          </div>
          <div className="flex bg-slate-50 p-1 rounded-xl self-start">
            {[
              { id: 'WEEK', label: 'Tuần' },
              { id: 'MONTH', label: 'Tháng' },
              { id: 'QUARTER', label: 'Quý' },
              { id: 'YEAR', label: 'Năm' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setChartMode(m.id as any)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  chartMode === m.id ? 'bg-white text-[#059669] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
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
                formatter={(val: number | undefined) => [`${val || 0} phút`, 'Trung bình']}
              />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={chartMode === 'YEAR' || chartMode === 'QUARTER' ? 40 : 20}>
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#059669' : '#86efac'} />
                ))}
                <LabelList dataKey="avg" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 900, fill: '#64748B' }} />
              </Bar>
              <Line type="monotone" dataKey="avg" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent records */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2"><Activity size={18} className="text-[#059669]" /> Giám sát gần nhất</h3>
            <button onClick={() => setActiveTab('GIAM_SAT')} className="text-[#059669] text-xs font-bold hover:underline">Tất cả</button>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {filteredRecords.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">{r.ma_bn.substring(0, 4)}</div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{r.ma_bn}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{r.ngay_giam_sat.split('-').reverse().join('/')}</p>
                  </div>
                </div>
                <div className={`font-black text-sm px-3 py-1 rounded-full ${(r.tong_thoi_gian || 0) <= 60 ? 'bg-green-100 text-green-700' : (r.tong_thoi_gian || 0) <= 90 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {fmtMin(r.tong_thoi_gian)}
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase">Chưa có dữ liệu</div>}
          </div>
        </div>

        {/* Recent analyses */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2"><BarChart2 size={18} className="text-purple-600" /> Phân tích gần nhất</h3>
            <button onClick={() => setActiveTab('PHAN_TICH')} className="text-purple-600 text-xs font-bold hover:underline">Tất cả</button>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {filteredAnalyses.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-black text-slate-800">BN: {a.ma_bn}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{a.ngay_phan_tich.split('-').reverse().join('/')} · {a.noi_dung.length} nguyên nhân</p>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            ))}
            {filteredAnalyses.length === 0 && <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase">Chưa có dữ liệu</div>}
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // SUPERVISION TAB
  // ─────────────────────────────────────────────
  const renderGiamSat = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
        <button onClick={handleAddGs} className="bg-[#059669] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase hover:shadow-lg active:scale-95 transition-all">
          <Plus size={15} /> Thêm phiếu giám sát
        </button>
        <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm mã BN, người giám sát..." className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#059669] text-white text-[10px] uppercase tracking-wider">
                <th className="px-4 py-3 font-black">Ngày giám sát</th>
                <th className="px-4 py-3 font-black">Mã BN</th>
                <th className="px-4 py-3 font-black">Giờ bắt đầu</th>
                <th className="px-4 py-3 font-black">Giờ kết thúc</th>
                <th className="px-4 py-3 font-black">Tổng thời gian</th>
                <th className="px-4 py-3 font-black text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">{r.ngay_giam_sat.split('-').reverse().join('/')}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800">{r.ma_bn}</td>
                  <td className="px-4 py-3 text-xs font-bold font-mono text-slate-600">{fmtTime(r.gio_dang_ky)}</td>
                  <td className="px-4 py-3 text-xs font-bold font-mono text-slate-600">{fmtTime(r.gio_nhan_thuoc)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${(r.tong_thoi_gian || 0) <= 60 ? 'bg-green-100 text-green-700' : (r.tong_thoi_gian || 0) <= 90 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {fmtMin(r.tong_thoi_gian)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 transition-opacity">
                      <button onClick={() => setViewingGs(r)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-[#059669] bg-slate-50 hover:bg-green-50 rounded-lg transition-colors"><Eye size={12} /> Xem</button>
                      <button onClick={() => handleEditGs(r)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={12} /> Sửa</button>
                      <button onClick={() => handleDeleteGs(r.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /> Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredRecords.map(r => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{r.ma_bn}</p>
                  <h4 className="text-sm font-black text-slate-800 mt-0.5">BN: {r.ma_bn}</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5"><Calendar size={10} className="inline mr-1" />{r.ngay_giam_sat.split('-').reverse().join('/')} · {r.nguoi_giam_sat}</p>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${(r.tong_thoi_gian || 0) <= 60 ? 'bg-green-100 text-green-700' : (r.tong_thoi_gian || 0) <= 90 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                  {fmtMin(r.tong_thoi_gian)}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewingGs(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-slate-600 bg-slate-50 hover:bg-green-50 hover:text-[#059669] rounded-xl border border-slate-100 transition-colors"><Eye size={12} /> Xem</button>
                <button onClick={() => handleEditGs(r)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl border border-slate-100 transition-colors"><Edit size={12} /> Sửa</button>
                <button onClick={() => handleDeleteGs(r.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl border border-slate-100 transition-colors"><Trash2 size={12} /> Xóa</button>
              </div>
            </div>
          ))}
        </div>
        {records.length === 0 && <div className="p-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Chưa có phiếu giám sát nào</div>}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // ANALYSIS TAB
  // ─────────────────────────────────────────────
  const renderPhanTich = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2"><BarChart2 size={18} className="text-purple-600" /> Bảng phân tích nguyên nhân & giải pháp</h3>
        <button onClick={handleAddPt} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase hover:shadow-lg active:scale-95 transition-all">
          <Plus size={15} /> Thêm bảng phân tích
        </button>
      </div>

      <div className="space-y-4">
        {filteredAnalyses.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mã giám sát: <span className="font-mono text-slate-600">{a.ma_bn}</span></p>
                <p className="text-sm font-black text-slate-800 mt-0.5">{a.ngay_phan_tich.split('-').reverse().join('/')} · {a.nguoi_phan_tich}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditPt(a)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-100 transition-colors"><Edit size={12} /> Sửa</button>
                <button onClick={() => handleDeletePt(a.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-100 transition-colors"><Trash2 size={12} /> Xóa</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-black tracking-wider border-b border-slate-100">
                    <th className="px-4 py-2.5">STT</th>
                    <th className="px-4 py-2.5">Nguyên nhân</th>
                    <th className="px-4 py-2.5">Tần suất</th>
                    <th className="px-4 py-2.5">Giải pháp đề xuất</th>
                    <th className="px-4 py-2.5">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {a.noi_dung.map(row => (
                    <tr key={row.stt} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-black text-slate-500">{row.stt}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 max-w-[180px]">{row.nguyen_nhan}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${TAN_SUAT_COLORS[row.tan_suat] || 'bg-slate-100 text-slate-600'}`}>{row.tan_suat}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700 max-w-[200px]">{row.giai_phap}</td>
                      <td className="px-4 py-3 font-black text-slate-800">{row.nguoi_thuc_hien}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {a.ghi_chu && <div className="px-4 py-3 bg-slate-50/50 text-xs text-slate-500 italic border-t border-slate-50">Ghi chú: {a.ghi_chu}</div>}
          </div>
        ))}
        {analyses.length === 0 && (
          <div className="bg-white p-16 text-center rounded-2xl border border-slate-100 shadow-sm">
            <BarChart2 size={40} className="text-slate-100 mx-auto mb-3" />
            <p className="text-slate-800 font-black uppercase text-sm tracking-widest">Chưa có bảng phân tích</p>
            <button onClick={handleAddPt} className="mt-4 text-purple-600 text-xs font-black uppercase border-b-2 border-purple-100 hover:border-purple-600 pb-0.5 transition-all">Thêm bảng phân tích đầu tiên</button>
          </div>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-full flex flex-col gap-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-[#059669] shadow-sm">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-800 tracking-tight uppercase">Thời gian khám bệnh trung bình</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Giám sát & Cải thiện quy trình khám bệnh</p>
            </div>
          </div>

          <div className="indicator-subtab-list">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" />
            <TabButton active={activeTab === 'GIAM_SAT'} onClick={() => setActiveTab('GIAM_SAT')} icon={ShieldCheck} label="Giám sát" />
            <TabButton active={activeTab === 'PHAN_TICH'} onClick={() => setActiveTab('PHAN_TICH')} icon={TrendingUp} label="Phân tích" />
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="w-10 h-10 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW'  && renderOverview()}
            {activeTab === 'GIAM_SAT' && renderGiamSat()}
            {activeTab === 'PHAN_TICH' && renderPhanTich()}
          </>
        )}
      </div>

      {/* ─── Supervision Form Modal ─── */}
      {showGsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2"><Stethoscope size={18} className="text-[#059669]" />{editingGs ? 'Cập nhật phiếu giám sát' : 'Phiếu giám sát mới'}</h3>
              <button onClick={() => setShowGsModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveGs} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Ngày giám sát', field: 'ngay_giam_sat', type: 'date', icon: Calendar },
                  { label: 'Người giám sát', field: 'nguoi_giam_sat', type: 'text', icon: User },
                  { label: 'Mã bệnh nhân', field: 'ma_bn', type: 'text', placeholder: 'VD: BN001234', icon: Search },
                ].map(({ label, field, type, placeholder, icon: Icon }) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">
                      <Icon size={12} /> {label}
                    </label>
                    <input type={type} value={(gsForm as any)[field] || ''} onChange={e => setGsForm({ ...gsForm, [field]: e.target.value })} placeholder={placeholder} required className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" />
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Clock size={12} /> Các mốc thời gian (hh:mm)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {timeSteps.map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{label}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={fmtTime((gsForm as any)[key]) === '—' ? '' : fmtTime((gsForm as any)[key])}
                        onChange={e => {
                          const v = e.target.value;
                          setGsForm({ ...gsForm, [key]: v || null });
                        }}
                        onBlur={e => {
                          // Auto-format: "730" -> "07:30", "730p" ignored
                          const v = e.target.value.replace(/[^0-9:]/g, '');
                          if (!v) { setGsForm({ ...gsForm, [key]: null }); return; }
                          const clean = v.replace(':', '');
                          if (clean.length >= 3) {
                            const h = clean.slice(0, -2).padStart(2, '0');
                            const m = clean.slice(-2);
                            const formatted = `${h}:${m}`;
                            setGsForm({ ...gsForm, [key]: formatted });
                          }
                        }}
                        maxLength={5}
                        placeholder="hh:mm"
                        pattern="[0-2][0-9]:[0-5][0-9]"
                        className="w-full px-3 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-green-500/20 placeholder:text-slate-300 placeholder:font-normal tracking-widest"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-calculated total */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#059669]"><Clock size={16} /><span className="font-black text-sm uppercase tracking-wide">Tổng thời gian khám</span></div>
                <span className="text-2xl font-black text-[#059669]">{fmtMin(calcTongThoiGian(gsForm.gio_dang_ky, gsForm.gio_nhan_thuoc))}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ghi chú</label>
                <textarea rows={2} value={gsForm.ghi_chu || ''} onChange={e => setGsForm({ ...gsForm, ghi_chu: e.target.value || null })} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" placeholder="Ghi chú thêm..." />
              </div>

              <div className="pt-2 border-t border-slate-50 flex gap-3">
                <button type="button" onClick={() => setShowGsModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[10px] tracking-wider hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"><X size={15} /> Đóng</button>
                <button type="submit" className="flex-[2] py-3 bg-[#059669] text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg shadow-green-900/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Lưu phiếu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Supervision Modal ─── */}
      {viewingGs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2"><Eye size={16} className="text-[#059669]" /> Chi tiết phiếu giám sát</h3>
              <button onClick={() => setViewingGs(null)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] text-slate-400 font-black uppercase">Mã GS</p><p className="font-mono font-black text-slate-700 text-sm">{viewingGs.ma_bn}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] text-slate-400 font-black uppercase">Mã BN</p><p className="font-black text-slate-800 text-sm">{viewingGs.ma_bn}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] text-slate-400 font-black uppercase">Ngày GS</p><p className="font-bold text-slate-700 text-sm">{viewingGs.ngay_giam_sat.split('-').reverse().join('/')}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl"><p className="text-[9px] text-slate-400 font-black uppercase">Người GS</p><p className="font-black text-slate-800 text-sm">{viewingGs.nguoi_giam_sat}</p></div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-400">Các mốc thời gian</h4>
                {timeSteps.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-xs font-bold text-slate-600">{label}</span>
                    <span className="text-xs font-black text-slate-800 font-mono">{fmtTime((viewingGs as any)[key])}</span>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-black uppercase text-[#059669]">Tổng thời gian</span>
                <span className="text-2xl font-black text-[#059669]">{fmtMin(viewingGs.tong_thoi_gian)}</span>
              </div>

              {viewingGs.ghi_chu && <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl">Ghi chú: {viewingGs.ghi_chu}</p>}

              <button onClick={() => setViewingGs(null)} className="w-full py-3 bg-slate-100 text-slate-600 font-black uppercase text-[10px] rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><X size={14} /> Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Analysis Form Modal ─── */}
      {showPtModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2"><BarChart2 size={18} className="text-purple-600" />{editingPt ? 'Cập nhật bảng phân tích' : 'Bảng phân tích mới'}</h3>
              <button onClick={() => setShowPtModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSavePt} className="p-5 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày phân tích</label>
                  <input type="date" value={ptForm.ngay_phan_tich} onChange={e => setPtForm({ ...ptForm, ngay_phan_tich: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Người phân tích</label>
                  <input value={ptForm.nguoi_phan_tich} onChange={e => setPtForm({ ...ptForm, nguoi_phan_tich: e.target.value })} required readOnly className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Search size={12} /> Mã người bệnh</label>
                  <input
                    list="patient-codes"
                    value={ptForm.ma_bn}
                    onChange={e => setPtForm({ ...ptForm, ma_bn: e.target.value })}
                    required
                    placeholder="Nhập hoặc chọn mã bệnh nhân..."
                    className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20"
                  />
                  <datalist id="patient-codes">
                    {Array.from(new Set(records.map(r => r.ma_bn))).map(code => (
                      <option key={code} value={code} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Dynamic analysis table */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3">Nội dung phân tích</h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase text-slate-500 font-black">
                        <th className="px-3 py-3 w-10">STT</th>
                        <th className="px-3 py-3">Nguyên nhân</th>
                        <th className="px-3 py-3 w-36">Tần suất</th>
                        <th className="px-3 py-3">Giải pháp đề xuất</th>
                        <th className="px-3 py-3">Người thực hiện</th>
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ptForm.noi_dung.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-center font-black text-slate-500">{row.stt}</td>
                          <td className="px-3 py-2">
                            <input value={row.nguyen_nhan} onChange={e => updatePtRow(idx, 'nguyen_nhan', e.target.value)} className="w-full bg-transparent border-b border-slate-200 focus:border-purple-400 outline-none py-1 text-xs font-bold text-slate-700" placeholder="Vấn đề / Nguyên nhân..." />
                          </td>
                          <td className="px-3 py-2">
                            <select value={row.tan_suat} onChange={e => updatePtRow(idx, 'tan_suat', e.target.value)} className="w-full bg-transparent border-b border-slate-200 focus:border-purple-400 outline-none py-1 text-xs font-bold text-slate-700">
                              {TAN_SUAT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input value={row.giai_phap} onChange={e => updatePtRow(idx, 'giai_phap', e.target.value)} className="w-full bg-transparent border-b border-slate-200 focus:border-purple-400 outline-none py-1 text-xs font-bold text-slate-700" placeholder="Giải pháp..." />
                          </td>
                          <td className="px-3 py-2">
                            <input value={row.nguoi_thuc_hien} onChange={e => updatePtRow(idx, 'nguoi_thuc_hien', e.target.value)} className="w-full bg-transparent border-b border-slate-200 focus:border-purple-400 outline-none py-1 text-xs font-bold text-slate-700" placeholder="Đơn vị/Phòng..." />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {ptForm.noi_dung.length > 1 && (
                              <button type="button" onClick={() => removePtRow(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={addPtRow} className="mt-3 flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase hover:text-purple-800 transition-colors">
                  <Plus size={14} /> Thêm dòng mới
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ghi chú tổng kết</label>
                <textarea rows={2} value={ptForm.ghi_chu || ''} onChange={e => setPtForm({ ...ptForm, ghi_chu: e.target.value || null })} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500/20" placeholder="Ghi chú..." />
              </div>

              <div className="pt-2 border-t border-slate-50 flex gap-3">
                <button type="button" onClick={() => setShowPtModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[10px] tracking-wider hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"><X size={15} /> Đóng</button>
                <button type="submit" className="flex-[2] py-3 bg-purple-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg shadow-purple-900/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={15} /> Lưu phân tích</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};




