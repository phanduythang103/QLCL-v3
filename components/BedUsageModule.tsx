import React, { useState, useEffect } from 'react';
import {
  Activity, BarChart2, Search, Plus, Edit, Trash2, X,
  CheckCircle2, User, Calendar, Building2, AlertCircle,
  TrendingDown, TrendingUp, Bed, Clock, Target, FileText,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { fetchCongSuatGiuong, CongSuatGiuong, CongSuatGiuongInput, addCongSuatGiuong, updateCongSuatGiuong, deleteCongSuatGiuong, calcCongSuat } from '../readCongSuatGiuong';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';

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

export const BedUsageModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH'>('OVERVIEW');
  const [records, setRecords] = useState<CongSuatGiuong[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [filterPreset, setFilterPreset] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CongSuatGiuong | null>(null);

  // Form State
  const emptyForm = (): CongSuatGiuongInput => ({
    ngay_bao_cao: new Date().toISOString().split('T')[0],
    nguoi_bao_cao: user?.full_name || '',
    don_vi: '',
    so_giuong: 0,
    tong_ngay_dieu_tri_thuc_te: 0,
    so_ngay_trong_ky: 30, // Default to month
    ghi_chu: '',
  });
  const [form, setForm] = useState(emptyForm());

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, uData] = await Promise.all([
        fetchCongSuatGiuong(),
        fetchDmDonVi()
      ]);
      setRecords(rData);
      setUnits(uData);
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

  const handleEdit = (r: CongSuatGiuong) => {
    setEditingRecord(r);
    setForm({
      ngay_bao_cao: r.ngay_bao_cao,
      nguoi_bao_cao: r.nguoi_bao_cao,
      don_vi: r.don_vi,
      so_giuong: r.so_giuong,
      tong_ngay_dieu_tri_thuc_te: r.tong_ngay_dieu_tri_thuc_te,
      so_ngay_trong_ky: r.so_ngay_trong_ky,
      ghi_chu: r.ghi_chu || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa báo cáo này?')) return;
    try {
      await deleteCongSuatGiuong(id);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateCongSuatGiuong(editingRecord.id, form);
      } else {
        await addCongSuatGiuong(form);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Filter Logic
  const applyPreset = (preset: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'TODAY': break;
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
      case 'THIS_QUARTER': {
        const q = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), q * 3, 1);
        break;
      }
      case 'LAST_QUARTER': {
        const q = Math.floor(now.getMonth() / 3) - 1;
        start = new Date(now.getFullYear(), q * 3, 1);
        end = new Date(now.getFullYear(), (q + 1) * 3, 0);
        break;
      }
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

  const filteredRecords = records.filter(r => r.ngay_bao_cao >= startDate && r.ngay_bao_cao <= endDate);

  // Chart Data Logic
  const getChartData = () => {
    const dataMap: Record<string, { label: string, total: number, count: number }> = {};

    filteredRecords.forEach(r => {
      const d = new Date(r.ngay_bao_cao);
      let key = '';
      let label = '';

      if (chartMode === 'WEEK' || chartMode === 'MONTH') {
        key = r.ngay_bao_cao;
        label = d.getDate() + '/' + (d.getMonth() + 1);
      } else if (chartMode === 'QUARTER') {
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        label = `T ${d.getMonth() + 1}`;
      } else if (chartMode === 'YEAR') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-Q${q}`;
        label = `Q ${q}`;
      }

      if (!dataMap[key]) dataMap[key] = { label, total: 0, count: 0 };
      dataMap[key].total += Number(r.cong_suat);
      dataMap[key].count += 1;
    });

    return Object.keys(dataMap).sort().map(key => ({
      name: dataMap[key].label,
      val: Math.round(dataMap[key].total / (dataMap[key].count || 1))
    }));
  };

  const chartData = getChartData();

  // Stats
  const avgEfficiency = filteredRecords.length > 0
    ? (filteredRecords.reduce((a, b) => a + Number(b.cong_suat), 0) / filteredRecords.length).toFixed(2)
    : '0.00';
  const totalBeds = filteredRecords.length > 0 ? filteredRecords[0].so_giuong : 0; // Using latest or general stat

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="indicator-quick-stats grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Công suất trung bình', value: avgEfficiency, unit: '%', icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Tổng ngày ĐT thực tế', value: filteredRecords.reduce((a, b) => a + b.tong_ngay_dieu_tri_thuc_te, 0), unit: 'ngày', icon: Bed, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Đơn vị tham gia', value: new Set(filteredRecords.map(r => r.don_vi)).size, unit: 'đơn vị', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="indicator-quick-stat-card bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`indicator-quick-stat-icon w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon size={28} />
            </div>
            <div className="indicator-quick-stat-body">
              <p className="indicator-quick-stat-label text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
              <p className="indicator-quick-stat-value text-3xl font-black text-slate-800 tracking-tight">{value} <span className="indicator-quick-stat-unit text-sm font-bold text-slate-400">{unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-600" />
              Xu hướng công suất sử dụng giường
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dữ liệu phân tích theo {chartMode === 'WEEK' ? 'ngày' : chartMode === 'MONTH' ? 'ngày' : chartMode === 'QUARTER' ? 'tháng' : 'quý'}</p>
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
                  chartMode === m.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
                itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#4f46e5' }}
                labelStyle={{ fontSize: '10px', fontWeight: 800, color: '#64748B', marginBottom: '4px', textTransform: 'uppercase' }}
                formatter={(val: number | undefined) => [`${val || 0}%`, 'Công suất']}
              />
              <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={chartMode === 'YEAR' || chartMode === 'QUARTER' ? 40 : 20}>
                {chartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4f46e5' : '#818cf8'} />
                ))}
                <LabelList dataKey="val" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 900, fill: '#64748B' }} />
              </Bar>
              <Line type="monotone" dataKey="val" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5', r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" />
            Dữ liệu gần đây
          </h3>
          <button onClick={() => setActiveTab('DANH_SACH')} className="text-indigo-600 text-xs font-black uppercase hover:underline">Xem tất cả</button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-black">Ngày báo cáo</th>
                <th className="px-6 py-4 font-black">Đơn vị</th>
                <th className="px-6 py-4 font-black text-center">Số giường</th>
                <th className="px-6 py-4 font-black text-center">Ngày ĐT thực tế</th>
                <th className="px-6 py-4 font-black text-center">Số ngày trong kỳ</th>
                <th className="px-6 py-4 font-black text-right">Công suất (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.slice(0, 5).map(r => (
                <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.ngay_bao_cao.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-800">{r.don_vi}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{r.so_giuong}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{r.tong_ngay_dieu_tri_thuc_te}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{r.so_ngay_trong_ky}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      Number(r.cong_suat) > 90 ? 'bg-red-50 text-red-600' :
                      Number(r.cong_suat) > 80 ? 'bg-green-50 text-[#059669]' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {r.cong_suat}%
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-50 text-slate-800">
          {records.slice(0, 5).map(r => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">{r.ngay_bao_cao.split('-').reverse().join('/')}</p>
                  <p className="text-sm font-black text-slate-800">{r.don_vi}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Công suất</p>
                  <p className={`text-sm font-black ${
                    Number(r.cong_suat) > 90 ? 'text-red-600' :
                    Number(r.cong_suat) > 80 ? 'text-[#059669]' :
                    'text-blue-600'
                  }`}>{r.cong_suat}%</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50 gap-4">
                <div className="flex-1">
                  <p className="text-[8px] font-black uppercase text-slate-400">Số giường / Ngày ĐT</p>
                  <p className="text-xs font-bold">{r.so_giuong} g / {r.tong_ngay_dieu_tri_thuc_te} n</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[8px] font-black uppercase text-slate-400">Kỳ báo cáo</p>
                  <p className="text-xs font-bold text-slate-600">{r.so_ngay_trong_ky} ngày</p>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDanhSach = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            placeholder="Tìm theo đơn vị, ghi chú..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase hover:shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} /> Nhập số liệu mới
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-indigo-600 text-white text-[10px] uppercase tracking-widest border-b border-indigo-700">
                <th className="px-6 py-4 font-black">Ngày</th>
                <th className="px-6 py-4 font-black">Đơn vị</th>
                <th className="px-6 py-4 font-black text-center">Số giường</th>
                <th className="px-6 py-4 font-black text-center">Ngày ĐT</th>
                <th className="px-6 py-4 font-black text-center">Kỳ (ngày)</th>
                <th className="px-6 py-4 font-black text-center">Công suất</th>
                <th className="px-6 py-4 font-black text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.ngay_bao_cao.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-800">{r.don_vi}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{r.so_giuong}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{r.tong_ngay_dieu_tri_thuc_te}</td>
                  <td className="px-6 py-4 text-xs font-bold text-center">{r.so_ngay_trong_ky}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-indigo-600">{r.cong_suat}%</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {records.map(r => (
            <div key={r.id} className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{r.ngay_bao_cao.split('-').reverse().join('/')}</p>
                  <p className="text-sm font-black text-slate-800">{r.don_vi}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(r)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Số giường / Ngày</p>
                  <p className="text-sm font-black text-slate-700">{r.so_giuong} g / {r.so_ngay_trong_ky} n</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Ngày ĐT thực tế</p>
                  <p className="text-sm font-black text-slate-700">{r.tong_ngay_dieu_tri_thuc_te} ngày</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-indigo-400 mb-0.5">Công suất</p>
                  <p className="text-lg font-black text-indigo-600">{r.cong_suat}%</p>
                </div>
                <div className="flex items-end justify-end">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    Number(r.cong_suat) > 90 ? 'bg-red-50 text-red-600' :
                    Number(r.cong_suat) > 80 ? 'bg-green-50 text-[#059669]' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {Number(r.cong_suat) > 90 ? 'Quá tải' : Number(r.cong_suat) > 80 ? 'Tốt' : 'Thấp'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0 border border-indigo-200">
              <Bed size={28} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-800 tracking-tight uppercase">Công suất sử dụng giường bệnh</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Theo dõi & Dự báo nhu cầu giường bệnh nội trú</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all border ${
                isFilterOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              <Calendar size={14} />
              {filterPreset === 'CUSTOM' ? `${startDate.split('-').reverse().join('/')} - ${endDate.split('-').reverse().join('/')}` : 'Bộ lọc thời gian'}
              <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'TODAY', label: 'Hôm nay' },
                { id: 'YESTERDAY', label: 'Hôm qua' },
                { id: 'THIS_WEEK', label: 'Tuần này' },
                { id: 'LAST_WEEK', label: 'Tuần trước' },
                { id: 'THIS_MONTH', label: 'Tháng này' },
                { id: 'LAST_MONTH', label: 'Tháng trước' },
                { id: 'THIS_QUARTER', label: 'Quý này' },
                { id: 'LAST_QUARTER', label: 'Quý trước' },
                { id: 'THIS_YEAR', label: 'Năm này' },
                { id: 'LAST_YEAR', label: 'Năm trước' },
                { id: 'CUSTOM', label: 'Tùy chọn' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    filterPreset === p.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {filterPreset === 'CUSTOM' && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Từ ngày</label>
                  <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setFilterPreset('CUSTOM'); }} className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Đến ngày</label>
                  <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setFilterPreset('CUSTOM'); }} className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="indicator-subtab-list indicator-subtab-list-2">
          <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" />
          <TabButton active={activeTab === 'DANH_SACH'} onClick={() => setActiveTab('DANH_SACH')} icon={FileText} label="Danh sách" />
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Đang tải dữ liệu...</p>
          </div>
        ) : (
          activeTab === 'OVERVIEW' ? renderOverview() : renderDanhSach()
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800">{editingRecord ? 'Cập nhật số liệu' : 'Số liệu công suất mới'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng nhập đầy đủ thông tin</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày báo cáo</label>
                  <input
                    type="date"
                    value={form.ngay_bao_cao}
                    onChange={e => setForm({ ...form, ngay_bao_cao: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Người báo cáo</label>
                  <input
                    value={form.nguoi_bao_cao}
                    readOnly
                    className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Building2 size={12} /> Đơn vị</label>
                <input
                  list="ds-don-vi"
                  placeholder="Nhập hoặc chọn đơn vị..."
                  value={form.don_vi}
                  onChange={e => setForm({ ...form, don_vi: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <datalist id="ds-don-vi">
                  {units.map(u => <option key={u.id} value={u.ten_don_vi}>{u.ma_don_vi} - {u.ten_don_vi}</option>)}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">Số giường</label>
                  <input
                    type="number"
                    value={form.so_giuong || ''}
                    onChange={e => setForm({ ...form, so_giuong: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">Ngày ĐT thực tế</label>
                  <input
                    type="number"
                    value={form.tong_ngay_dieu_tri_thuc_te || ''}
                    onChange={e => setForm({ ...form, tong_ngay_dieu_tri_thuc_te: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">Số ngày trong kỳ</label>
                  <input
                    type="number"
                    value={form.so_ngay_trong_ky || ''}
                    onChange={e => setForm({ ...form, so_ngay_trong_ky: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Hiệu suất tự tính</p>
                  <p className="text-3xl font-black text-indigo-700">
                    {calcCongSuat(form)}%
                  </p>
                </div>
                <div className="text-right text-[10px] font-bold text-indigo-400 uppercase leading-relaxed max-w-[200px]">
                  Công thức: (Ngày ĐT thực tế / (Số giường * Số ngày trong kỳ)) * 100
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><FileText size={12} /> Ghi chú</label>
                <textarea
                  value={form.ghi_chu || ''}
                  onChange={e => setForm({ ...form, ghi_chu: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> {editingRecord ? 'Cập nhật' : 'Lưu số liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
