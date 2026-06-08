import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, ComposedChart, Line } from 'recharts';
import { BarChart2, CheckSquare, ClipboardList, Plus, Search, Filter, TrendingUp, AlertCircle, RefreshCw, X, Check } from 'lucide-react';
import { fetchNkvm, NkvmRecord, addNkvm, updateNkvm, deleteNkvm } from '../readNkvm';
import { fetchDsnKvm, DsnKvmRecord, addDsnKvm, updateDsnKvm, deleteDsnKvm } from '../readDsnKvm';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import DateRangeFilter from './DateRangeFilter';

type NKVMTab = 'OVERVIEW' | 'SUPERVISION' | 'LIST';

export const NKVMModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<NKVMTab>('OVERVIEW');
  const [records, setRecords] = useState<NkvmRecord[]>([]);
  const [dsRecords, setDsRecords] = useState<DsnKvmRecord[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<DmDonVi[]>([]);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDsModal, setShowDsModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<NkvmRecord>>({});
  const [newDsRecord, setNewDsRecord] = useState<Partial<DsnKvmRecord>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const unitRef = useRef<HTMLDivElement>(null);
  
  // Overview Filters
  const [overviewDateFilter, setOverviewDateFilter] = useState({
    type: 'thisMonth',
    startDate: '',
    endDate: ''
  });
  const [overviewKhoaFilter, setOverviewKhoaFilter] = useState('');
  const [overviewTrendMonths, setOverviewTrendMonths] = useState<number>(6);

  // Initialize newRecord for individual surveillance
  useEffect(() => {
    if (showModal && !isEditMode && !viewOnly) {
      setNewRecord({
        ngay_giam_sat: new Date().toISOString().split('T')[0],
        nguoi_giam_sat: user?.full_name || user?.username || '',
        khoa_duoc_giam_sat: user?.department || '',
        ten_nguoi_benh: '',
        nam_sinh: '',
        ma_hsba: '',
        ngay_phau_thuat: '',
        loai_phau_thuat: '', 
        dau_hieu_lam_sang: '',
        can_thiep: '',
        ket_qua_vi_sinh: '',
        phan_loai_nkvm: '', 
      });
    }
  }, [showModal, user, isEditMode, viewOnly]);

  // Initialize newDsRecord for aggregate reports
  useEffect(() => {
    if (showDsModal && !isEditMode) {
      setNewDsRecord({
        ngay_bao_cao: new Date().toISOString().split('T')[0],
        khoa: user?.department || '',
        tong_so_ca_pt: 0,
        so_ca_nkvm_nong: 0,
        so_ca_nkvm_sau: 0,
        so_ca_nkvm_co_quan: 0,
      });
    }
  }, [showDsModal, user, isEditMode]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [nkvmData, dsData, unitData] = await Promise.all([
        fetchNkvm(),
        fetchDsnKvm(),
        fetchDmDonVi()
      ]);
      setRecords(nkvmData);
      setDsRecords(dsData);
      setUnits(unitData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) {
        setShowUnitSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!newRecord.ten_nguoi_benh || !newRecord.khoa_duoc_giam_sat || !newRecord.nguoi_giam_sat) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc (*)');
      return;
    }

    setLoading(true);
    try {
      const recordToSave = { ...newRecord };
      if (isEditMode && recordToSave.id) {
        await updateNkvm(recordToSave.id, recordToSave);
      } else {
        await addNkvm(recordToSave);
      }
      setShowModal(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDs = async () => {
    if (!newDsRecord.khoa || !newDsRecord.ngay_bao_cao) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc (*)');
      return;
    }

    setLoading(true);
    try {
      const { id, created_at, tong_so_ca_nkvm, ty_le_nkvm, ...rest } = newDsRecord;
      const recordToSave = { ...rest };
      
      if (isEditMode && id) {
        await updateDsnKvm(id, recordToSave);
      } else {
        await addDsnKvm(recordToSave);
      }
      setShowDsModal(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu dữ liệu thống kê NKVM');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isDs: boolean = false) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    setLoading(true);
    try {
      if (isDs) {
        await deleteDsnKvm(id);
      } else {
        await deleteNkvm(id);
      }
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOverviewRecords = () => {
    let filtered = records;
    if (overviewKhoaFilter) {
      filtered = filtered.filter(r => r.khoa_duoc_giam_sat === overviewKhoaFilter);
    }
    if (overviewDateFilter.type !== 'all') {
      filtered = filtered.filter(r => {
        if (!r.ngay_giam_sat) return false;
        const d = new Date(r.ngay_giam_sat);
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (overviewDateFilter.type) {
          case 'thisWeek': {
            const day = startOfToday.getDay() || 7; 
            if (day !== 1) startOfToday.setHours(-24 * (day - 1)); 
            return d >= startOfToday;
          }
          case 'lastWeek': {
            const day = startOfToday.getDay() || 7; 
            const startOfLastWeek = new Date(startOfToday);
            startOfLastWeek.setDate(startOfLastWeek.getDate() - day - 6);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23, 59, 59, 999);
            return d >= startOfLastWeek && d <= endOfLastWeek;
          }
          case 'thisMonth': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return d >= startOfMonth;
          }
          case 'lastMonth': {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            endOfLastMonth.setHours(23, 59, 59, 999);
            return d >= startOfLastMonth && d <= endOfLastMonth;
          }
          case 'thisQuarter': {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
            return d >= startOfQuarter;
          }
          case 'lastQuarter': {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
            const year = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const startOfLastQuarter = new Date(year, lastQuarter * 3, 1);
            const endOfLastQuarter = new Date(year, lastQuarter * 3 + 3, 0);
            endOfLastQuarter.setHours(23, 59, 59, 999);
            return d >= startOfLastQuarter && d <= endOfLastQuarter;
          }
          case 'thisYear': {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            return d >= startOfYear;
          }
          case 'lastYear': {
            const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
            endOfLastYear.setHours(23, 59, 59, 999);
            return d >= startOfLastYear && d <= endOfLastYear;
          }
          case 'custom': {
            if (overviewDateFilter.startDate && overviewDateFilter.endDate) {
              const start = new Date(overviewDateFilter.startDate);
              const end = new Date(overviewDateFilter.endDate);
              end.setHours(23, 59, 59, 999);
              return d >= start && d <= end;
            }
            return true;
          }
          default:
            return true;
        }
      });
    }
    return filtered;
  };

  const overviewFilteredRecords = useMemo(() => getFilteredOverviewRecords(), [records, overviewKhoaFilter, overviewDateFilter]);
  const overviewPositiveCases = useMemo(() => overviewFilteredRecords.filter(r => r.phan_loai_nkvm && r.phan_loai_nkvm.trim() !== ''), [overviewFilteredRecords]);

  const COLORS = ['#009900', '#2563eb', '#ea580c', '#eab308', '#8b5cf6'];
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const renderOverview = () => {
    const totalSupervisions = overviewFilteredRecords.length;
    const totalCasesInMonth = overviewPositiveCases.length;
    const totalSurgeries = totalSupervisions;
    const ssiRate = totalSurgeries > 0 ? ((totalCasesInMonth / totalSurgeries) * 100).toFixed(1) : '0';

    // Biểu đồ hình tròn Phân loại NKVM
    const _phanLoaiMap: Record<string, number> = {};
    overviewPositiveCases.forEach(r => {
      const parts = (r.phan_loai_nkvm || '').split(',').map(s=>s.trim()).filter(Boolean);
      parts.forEach(p => {
        _phanLoaiMap[p] = (_phanLoaiMap[p] || 0) + 1;
      });
    });
    const phanLoaiData = Object.entries(_phanLoaiMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Biểu đồ hình cột Loại phẫu thuật (từ tổng số lượt giám sát)
    const _loaiPtMap: Record<string, number> = {};
    overviewFilteredRecords.forEach(r => {
      if (r.loai_phau_thuat) {
        _loaiPtMap[r.loai_phau_thuat] = (_loaiPtMap[r.loai_phau_thuat] || 0) + 1;
      }
    });
    const loaiPtData = Object.entries(_loaiPtMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Biểu đồ biểu diễn Dấu hiệu lâm sàng (từ số ca mắc mới NKVM) - Đã gộp nhóm chính xác
    const _dauHieuMap: Record<string, number> = {
      'Sưng, nóng, đỏ, đau': 0,
      'Chảy mủ từ vết mổ': 0,
      'Vết mổ hở tự nhiên': 0
    };
    overviewPositiveCases.forEach(r => {
      const dh = r.dau_hieu_lam_sang || '';
      if (dh.includes('Sưng, nóng, đỏ, đau')) _dauHieuMap['Sưng, nóng, đỏ, đau']++;
      if (dh.includes('Chảy mủ từ vết mổ')) _dauHieuMap['Chảy mủ từ vết mổ']++;
      if (dh.includes('Vết mổ hở tự nhiên')) _dauHieuMap['Vết mổ hở tự nhiên']++;
    });
    const dauHieuData = Object.entries(_dauHieuMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    // Tính toán dữ liệu Xu hướng nhiễm khuẩn gần đây (Sử dụng dữ liệu Danh sách NKVM - dsnkvm)
    const trendData: any[] = [];
    const nowTrend = new Date();
    for (let i = overviewTrendMonths - 1; i >= 0; i--) {
        const d = new Date(nowTrend.getFullYear(), nowTrend.getMonth() - i, 1);
        const monthStr = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
        
        let baseDsRecords = dsRecords;
        if (overviewKhoaFilter) {
            baseDsRecords = baseDsRecords.filter(r => r.khoa === overviewKhoaFilter);
        }
        
        const monthDsRecords = baseDsRecords.filter(r => {
            if (!r.ngay_bao_cao) return false;
            const rd = new Date(r.ngay_bao_cao);
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        });
        
        const nk = monthDsRecords.reduce((sum, r) => sum + (r.tong_so_ca_nkvm || 0), 0);
        const avgRate = monthDsRecords.length > 0 ? (monthDsRecords.reduce((s, r) => s + (Number(r.ty_le_nkvm) || 0), 0) / monthDsRecords.length).toFixed(1) : 0;
        
        trendData.push({
            name: monthStr,
            nk: nk,
            rate: parseFloat(avgRate as string),
            half_nk: nk / 2
        });
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div className="flex gap-4 items-center">
                <DateRangeFilter
                    filter={overviewDateFilter}
                    onChange={setOverviewDateFilter}
                    className="w-full sm:w-auto"
                />
            </div>
            <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                    value={overviewKhoaFilter}
                    onChange={(e) => setOverviewKhoaFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] appearance-none"
                >
                    <option value="">Tất cả khoa/phòng</option>
                    {units.map(u => (
                        <option key={u.id} value={u.ten_don_vi}>{u.ten_don_vi}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="indicator-quick-stats grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="indicator-quick-stat-card bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Tổng số lượt Giám sát</h4>
            <div className="flex items-end gap-2">
              <span className="indicator-quick-stat-value text-lg font-bold text-blue-600">{totalSupervisions}</span>
              <span className="indicator-quick-stat-unit text-table font-normal text-slate-400 mb-1">ca</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 font-bold bg-blue-50 py-1 px-3 rounded-full w-fit">
              <CheckSquare size={14} /> Tổng số báo cáo từ các Khoa
            </div>
          </div>
          <div className="indicator-quick-stat-card bg-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Tổng số NKVM</h4>
            <div className="flex items-end gap-2">
              <span className="indicator-quick-stat-value text-lg font-bold text-red-600">{totalCasesInMonth}</span>
              <span className="indicator-quick-stat-unit text-table font-normal text-slate-400 mb-1">ca nhiễm</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-red-600 font-bold bg-red-50 py-1 px-3 rounded-full w-fit">
              <AlertCircle size={14} /> Ghi nhận mắc mới
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 text-red-600 pointer-events-none">
                <AlertCircle size={64} />
            </div>
          </div>
          <div className="indicator-quick-stat-card bg-white p-6 rounded-xl border border-amber-100 shadow-sm">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Tỷ lệ NKVM</h4>
            <div className="flex items-end gap-2">
              <span className="indicator-quick-stat-value text-lg font-bold text-amber-600">{ssiRate}%</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 py-1 px-3 rounded-full w-fit">
              <TrendingUp size={14} /> Chiếm % trên tổng ca giám sát
            </div>
          </div>
        </div>

        {/* --- Dòng biểu đồ Desktop (3 biểu đồ chung 1 hàng) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biểu đồ Tròn: Phân loại NKVM */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-label font-black text-black uppercase mb-4 border-b border-slate-100 pb-2">Phân loại nhiễm khuẩn</h4>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
              {phanLoaiData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={phanLoaiData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent ? percent * 100 : 0).toFixed(0)}%`}
                    >
                      {phanLoaiData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number | undefined) => [`${value || 0} ca`, 'Số lượng']} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 italic text-sm">Chưa có dữ liệu phân loại</div>
              )}
            </div>
          </div>

          {/* Biểu đồ Cột: Dấu hiệu lâm sàng */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-label font-black text-black uppercase mb-4 border-b border-slate-100 pb-2">Các dấu hiệu lâm sàng</h4>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
               {dauHieuData.length > 0 ? (
                 <ResponsiveContainer width="100%" height={250} className="text-xs font-bold">
                    <BarChart data={dauHieuData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{fill: '#64748B', fontSize: 10}} height={50} />
                      <YAxis allowDecimals={false} tick={{fill: '#64748B'}} />
                      <RechartsTooltip cursor={{fill: '#F1F5F9'}} formatter={(value: number | undefined) => [`${value || 0} ca`, 'Số lượng']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {dauHieuData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="text-center text-slate-400 italic text-sm">Chưa có dữ liệu dấu hiệu từ ca mắc mới</div>
               )}
            </div>
          </div>
          
          {/* Biểu đồ Cột: Loại phẫu thuật */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h4 className="text-label font-black text-black uppercase mb-4 border-b border-slate-100 pb-2">Đặc điểm loại phẫu thuật</h4>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
              {loaiPtData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="text-xs font-bold">
                  <BarChart data={loaiPtData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{fill: '#64748B', fontSize: 10}} />
                    <YAxis allowDecimals={false} tick={{fill: '#64748B'}}/>
                    <RechartsTooltip cursor={{fill: '#F1F5F9'}} formatter={(value: number | undefined) => [`${value || 0} lượt`, 'Giám sát']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {loaiPtData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-400 italic text-sm">Chưa có dữ liệu phân loại phẫu thuật</div>
              )}
            </div>
          </div>
        </div>

        {/* --- Dòng biểu đồ Xu hướng (1 cột) --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
              <h4 className="text-label font-black text-black uppercase">Xu hướng NKVM theo thời gian gần đây</h4>
              <div className="flex gap-2">
                  {[3, 6, 9, 12].map(m => (
                      <button 
                        key={m}
                        onClick={() => setOverviewTrendMonths(m)}
                        className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-colors ${overviewTrendMonths === m ? 'bg-[#009900] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                          {m} Tháng
                      </button>
                  ))}
              </div>
          </div>
          <div className="h-64 mt-4 text-xs font-bold w-full">
            {trendData.some(d => d.nk > 0 || d.rate > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                    <CartesianGrid stroke="#f5f5f5" vertical={false} />
                    <XAxis dataKey="name" scale="band" tick={{fill: '#64748B', fontSize: 10}} />
                    <YAxis yAxisId="left" tick={{fill: '#64748B'}} />
                    <YAxis yAxisId="right" orientation="right" tick={{fill: '#006600'}} unit="%" />
                    <RechartsTooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                             const data = payload[0]?.payload || {};
                             const nk = data.nk || 0;
                             const rate = data.rate || 0;
                             return (
                               <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-sm font-bold">
                                 <p className="text-slate-500 mb-2 border-b border-slate-100 pb-1">{label}</p>
                                 <p className="text-[#003399]">Số ca NKVM: {nk} ca</p>
                                 <p className="text-[#006600]">Tỷ lệ NKVM trung bình: {rate}%</p>
                               </div>
                             );
                          }
                          return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="nk" name="Số ca NKVM" barSize={30} fill="#ef4444" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                    <Line yAxisId="left" type="linear" dataKey="nk" name="Đường xu hướng (Số ca)" stroke="#003399" strokeWidth={2} dot={true} />
                    <Line yAxisId="right" type="linear" dataKey="rate" name="Tỷ lệ %" stroke="#006600" strokeWidth={3} strokeDasharray="5 5" dot={true} />
                  </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">Chưa có dữ liệu xu hướng trong {overviewTrendMonths} tháng qua</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupervision = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm phiếu giám sát..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] transition-all outline-none"
            />
          </div>
        <div className="flex gap-2">
          <button onClick={loadAllData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setIsEditMode(false);
              setViewOnly(false);
              setShowModal(true);
            }}
            className="bg-[#009900] text-white px-4 py-2 rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] flex items-center gap-2 shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none"
          >
            <Plus size={16} /> Ghi nhận giám sát
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs text-left table-standardized">
          <thead className="bg-[#009900] text-white font-bold uppercase text-table">
            <tr>
              <th className="p-3">Ngày GS</th>
              <th className="p-3">Người GS</th>
              <th className="p-3">Khoa</th>
              <th className="p-3">Bệnh Nhân</th>
              <th className="p-3 text-center">Phân loại phẫu thuật</th>
              <th className="p-3 text-center">NKVM</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal uppercase text-center text-table">
            {records.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-black/40 text-left">{r.ngay_giam_sat ? new Date(r.ngay_giam_sat).toLocaleDateString('vi-VN') : '-'}</td>
                <td className="p-3 text-black/40 text-left">{r.nguoi_giam_sat}</td>
                <td className="p-3 text-left">{r.khoa_duoc_giam_sat}</td>
                <td className="p-3 text-left">
                  <div className="flex flex-col">
                    <span>{r.ten_nguoi_benh}</span>
                    <span className="text-[10px] text-black/30 font-medium normal-case">HSBA: {r.ma_hsba}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                    {r.loai_phau_thuat || '-'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {r.phan_loai_nkvm ? (
                     <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-700">CÓ NKVM</span>
                  ) : (
                     <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700">KHÔNG</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        setNewRecord(r);
                        setIsEditMode(false);
                        setViewOnly(true);
                        setShowModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Xem chi tiết"
                    >
                      <Search size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        setNewRecord(r);
                        setIsEditMode(true);
                        setViewOnly(false);
                        setShowModal(true);
                      }}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Sửa"
                    >
                      <ClipboardList size={14} />
                    </button>
                    <button 
                      onClick={() => r.id && handleDelete(r.id, false)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Xóa"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-8 text-center text-black/40 italic">Chưa có dữ liệu giám sát</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm phiếu báo cáo..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
            <button onClick={loadAllData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => {
                  setIsEditMode(false);
                  setShowDsModal(true);
              }}
              className="bg-[#009900] text-white px-4 py-2 rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] flex items-center gap-2 shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none"
            >
              <Plus size={16} /> Báo cáo Nhiễm khuẩn
            </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm mt-4">
        {/* Desktop View */}
        <table className="w-full text-xs text-left hidden md:table">
          <thead className="bg-[#009900] text-white font-bold uppercase text-center text-table">
            <tr>
              <th className="p-3 text-left">Ngày tháng</th>
              <th className="p-3 text-left">Khoa</th>
              <th className="p-3">Tổng PT</th>
              <th className="p-3">Nông</th>
              <th className="p-3">Sâu</th>
              <th className="p-3">Cơ quan</th>
              <th className="p-3 text-red-200">Tổng NKVM</th>
              <th className="p-3 text-red-200">Tỷ lệ (%)</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-center text-table uppercase">
            {dsRecords.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 text-left text-black/60">{item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '-'}</td>
                <td className="p-3 text-left text-[#009900]">{item.khoa}</td>
                <td className="p-3 font-mono">{item.tong_so_ca_pt}</td>
                <td className="p-3 font-mono">{item.so_ca_nkvm_nong}</td>
                <td className="p-3 font-mono">{item.so_ca_nkvm_sau}</td>
                <td className="p-3 font-mono">{item.so_ca_nkvm_co_quan}</td>
                <td className="p-3 text-red-600 font-black font-mono text-sm">{item.tong_so_ca_nkvm || 0}</td>
                <td className="p-3 text-red-600 font-black font-mono bg-red-50/50">{item.ty_le_nkvm || 0}%</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => {
                        setNewDsRecord(item);
                        setIsEditMode(true);
                        setShowDsModal(true);
                      }}
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      title="Sửa"
                    >
                      <ClipboardList size={14} />
                    </button>
                    <button 
                      onClick={() => item.id && handleDelete(item.id, true)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Xóa"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {dsRecords.length === 0 && !loading && (
              <tr><td colSpan={9} className="p-8 text-center text-black/40 italic">Chưa có dữ liệu báo cáo Nhiễm khuẩn</td></tr>
            )}
          </tbody>
        </table>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {dsRecords.length > 0 ? (
            dsRecords.map((item, idx) => (
              <div key={item.id || idx} className="p-4 bg-white space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                  <div className="flex flex-col">
                    <span className="text-table font-bold text-[#009900] uppercase truncate">
                      {item.khoa}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '-'}
                    </span>
                  </div>
                  <div className="flex bg-slate-100/50 rounded-lg p-1 border border-slate-200">
                     <button 
                        onClick={() => {
                          setNewDsRecord(item);
                          setIsEditMode(true);
                          setShowDsModal(true);
                        }}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      >
                        <ClipboardList size={14} />
                      </button>
                      <button 
                        onClick={() => item.id && handleDelete(item.id, true)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-bold pt-1">
                   <div className="flex items-center justify-between col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-black/60 uppercase text-[10px]">Tổng số ca PT:</span>
                      <span className="font-mono text-[13px]">{item.tong_so_ca_pt}</span>
                   </div>
                   
                   <div className="col-span-2 flex items-center gap-2 mt-1 px-1">
                      <div className="flex-1 flex justify-between items-center text-[10px]">
                         <span className="text-slate-500">Nông:</span>
                         <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{item.so_ca_nkvm_nong}</span>
                      </div>
                      <div className="flex-1 flex justify-between items-center text-[10px]">
                         <span className="text-slate-500">Sâu:</span>
                         <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{item.so_ca_nkvm_sau}</span>
                      </div>
                      <div className="flex-1 flex justify-between items-center text-[10px]">
                         <span className="text-slate-500">CQ:</span>
                         <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">{item.so_ca_nkvm_co_quan}</span>
                      </div>
                   </div>

                   <div className="flex justify-between items-center border-t border-red-100 pt-2 col-span-2 mt-1">
                      <span className="text-[10px] text-red-600/80 font-black uppercase">Tổng số ca Nhiễm Khuẩn:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-black font-mono text-[13px]">{item.tong_so_ca_nkvm || 0}</span>
                        <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-black text-[10px]">
                           {item.ty_le_nkvm || 0}%
                        </span>
                      </div>
                   </div>
                </div>
              </div>
            ))
          ) : (
            !loading && <div className="p-8 text-center text-black/40 italic text-xs">Chưa có dữ liệu báo cáo Nhiễm khuẩn</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0 border border-red-100">
              <TrendingUp size={28} />
            </div>
            <div>
              <h2 className="text-main-title font-bold text-slate-800 tracking-tight uppercase">Tỷ lệ Nhiễm khuẩn vết mổ</h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">Giám sát & Kiểm soát NKVM sau phẫu thuật sạch/sạch-nhiễm</p>
            </div>
          </div>
        </div>

        <div className="indicator-subtab-list">
          {[
            { id: 'OVERVIEW', label: 'Tổng quan', icon: <BarChart2 size={16} /> },
            { id: 'SUPERVISION', label: 'Giám sát NKVM', icon: <CheckSquare size={16} /> },
            { id: 'LIST', label: 'Danh sách NKVM', icon: <ClipboardList size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as NKVMTab)}
              className={`indicator-subtab-button ${
                activeTab === tab.id 
                  ? 'indicator-subtab-button-active' 
                  : ''
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'SUPERVISION' && renderSupervision()}
        {activeTab === 'LIST' && renderList()}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white rounded-2xl w-full ${viewOnly ? 'max-w-3xl' : 'max-w-4xl'} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#009900] text-white">
              <h3 className="text-main-title font-bold uppercase flex items-center gap-2">
                <CheckSquare size={20} />
                {viewOnly ? 'Hồ sơ Giám sát Nhiễm khuẩn vết mổ' : isEditMode ? 'Cập nhật Giám sát' : 'Ghi nhận Giám sát'}
              </h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors outline-none">
                <X size={20} />
              </button>
            </div>
            
            <div className={`p-6 overflow-y-auto ${viewOnly ? 'bg-slate-50/50' : 'space-y-6'}`}>
              {viewOnly ? (
                // --- KNOWLEDGE BASE / LANDING PAGE VIEW ---
                <div className="space-y-6">
                  {/* Hành chính */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-label font-black text-[#009900] uppercase tracking-wide flex items-center gap-2">
                        1. Thông tin Hành chính
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày giám sát</span>
                        <span className="font-bold text-slate-800">{newRecord.ngay_giam_sat ? new Date(newRecord.ngay_giam_sat).toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Người giám sát</span>
                        <span className="font-bold text-slate-800">{newRecord.nguoi_giam_sat || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Khoa/Phòng được giám sát</span>
                        <span className="font-bold text-slate-800">{newRecord.khoa_duoc_giam_sat || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Người bệnh */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-label font-black text-[#009900] uppercase tracking-wide flex items-center gap-2">
                        2. Thông tin Người bệnh
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Họ tên người bệnh</span>
                        <span className="font-bold text-slate-800 text-base text-blue-700">{newRecord.ten_nguoi_benh || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Năm sinh</span>
                        <span className="font-bold text-slate-800">{newRecord.nam_sinh || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Mã HSBA</span>
                        <span className="font-bold text-slate-800 font-mono">{newRecord.ma_hsba || '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ngày phẫu thuật</span>
                        <span className="font-bold text-slate-800">{newRecord.ngay_phau_thuat ? new Date(newRecord.ngay_phau_thuat).toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Phân loại phẫu thuật</span>
                        <span className="font-bold text-slate-800 bg-slate-100 w-fit px-2 py-0.5 rounded textxs">{newRecord.loai_phau_thuat || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Giám sát chuyên môn */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-[#009900]">
                    <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-label font-black text-[#009900] uppercase tracking-wide flex items-center gap-2">
                        3. Kết quả Giám sát NKVM
                      </h4>
                    </div>
                    <div className="p-4 space-y-4 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 md:pb-0 md:border-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Dấu hiệu lâm sàng ghi nhận</span>
                          {newRecord.dau_hieu_lam_sang ? (
                            <ul className="list-disc list-inside text-slate-800 font-medium space-y-1 mt-1">
                              {newRecord.dau_hieu_lam_sang.split(',').map((dh, i) => (
                                <li key={i}>{dh.trim()}</li>
                              ))}
                            </ul>
                          ) : <span className="text-slate-400 italic">Không có dấu hiệu</span>}
                        </div>
                        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 md:pb-0 md:border-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Can thiệp y tế</span>
                          {newRecord.can_thiep ? (
                            <ul className="list-disc list-inside text-slate-800 font-medium space-y-1 mt-1">
                              {newRecord.can_thiep.split(',').map((ct, i) => (
                                <li key={i}>{ct.trim()}</li>
                              ))}
                            </ul>
                          ) : <span className="text-slate-400 italic">Không can thiệp</span>}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Kết quả Vi sinh</span>
                          <span className="font-bold text-slate-700">{newRecord.ket_qua_vi_sinh || 'Chưa có kết quả'}</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg flex items-center justify-between border ${newRecord.phan_loai_nkvm ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                         <span className={`text-label font-black uppercase ${newRecord.phan_loai_nkvm ? 'text-red-800' : 'text-green-800'}`}>Kết luận Nhóm NKVM</span>
                         <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${newRecord.phan_loai_nkvm ? 'bg-red-600 text-white shadow-md' : 'bg-[#009900] text-white'}`}>
                            {newRecord.phan_loai_nkvm || 'Không Nhiễm Khuẩn'}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- FORM CHỈNH SỬA / THÊM MỚI ---
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Ngày giám sát *</label>
                      <input 
                        type="date" 
                        value={newRecord.ngay_giam_sat}
                        onChange={e => setNewRecord({...newRecord, ngay_giam_sat: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Người giám sát *</label>
                      <input 
                        type="text" 
                        placeholder="Tên người giám sát..."
                        value={newRecord.nguoi_giam_sat}
                        onChange={e => setNewRecord({...newRecord, nguoi_giam_sat: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1 relative" ref={unitRef}>
                      <label className="text-[10px] font-black uppercase text-black/40">Khoa GS *</label>
                      <input 
                        type="text" 
                        placeholder="Chọn khoa/phòng..."
                        value={newRecord.khoa_duoc_giam_sat}
                        onChange={e => {
                          const val = e.target.value;
                          setNewRecord({...newRecord, khoa_duoc_giam_sat: val});
                          if (val.trim()) {
                            const filtered = units.filter(u => 
                              u.ten_don_vi.toLowerCase().includes(val.toLowerCase()) || 
                              u.ma_don_vi.toLowerCase().includes(val.toLowerCase())
                            );
                            setFilteredUnits(filtered.slice(0, 5));
                            setShowUnitSuggestions(true);
                          } else {
                            setShowUnitSuggestions(false);
                          }
                        }}
                        onFocus={() => {
                          if (newRecord.khoa_duoc_giam_sat) setShowUnitSuggestions(true);
                        }}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                      {showUnitSuggestions && filteredUnits.length > 0 && (
                        <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                          {filteredUnits.map(u => (
                            <button
                              key={u.id}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                              onClick={() => {
                                setNewRecord({...newRecord, khoa_duoc_giam_sat: u.ten_don_vi});
                                setShowUnitSuggestions(false);
                              }}
                            >
                              <span className="text-black/40 mr-2">{u.ma_don_vi}</span>
                              {u.ten_don_vi}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Họ tên NB *</label>
                      <input 
                        type="text" 
                        placeholder="Tên bệnh nhân..."
                        value={newRecord.ten_nguoi_benh}
                        onChange={e => setNewRecord({...newRecord, ten_nguoi_benh: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Năm sinh</label>
                      <input 
                        type="text" 
                        placeholder="VD: 1990"
                        value={newRecord.nam_sinh || ''}
                        onChange={e => setNewRecord({...newRecord, nam_sinh: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Mã HSBA</label>
                      <input 
                        type="text" 
                        placeholder="Mã hồ sơ..."
                        value={newRecord.ma_hsba || ''}
                        onChange={e => setNewRecord({...newRecord, ma_hsba: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/40">Ngày phẫu thuật</label>
                      <input 
                        type="date" 
                        value={newRecord.ngay_phau_thuat || ''}
                        onChange={e => setNewRecord({...newRecord, ngay_phau_thuat: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Loại phẫu thuật</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Sạch', 'Sạch - nhiễm', 'Nhiễm'].map(opt => (
                               <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer">
                                  <input 
                                    type="radio" name="loai_phau_thuat" 
                                    value={opt}
                                    checked={newRecord.loai_phau_thuat === opt}
                                    onChange={e => setNewRecord({...newRecord, loai_phau_thuat: e.target.value})}
                                    className="w-4 h-4 text-[#009900] focus:ring-[#009900]"
                                  />
                                  {opt}
                               </label>
                            ))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Dấu hiệu lâm sàng</label>
                        <div className="flex flex-col gap-2">
                            {['Sưng, nóng, đỏ, đau', 'Chảy mủ từ vết mổ', 'Vết mổ hở tự nhiên'].map(opt => {
                              const isChecked = (newRecord.dau_hieu_lam_sang || '').includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={e => {
                                        let current = (newRecord.dau_hieu_lam_sang || '').split(',').filter(Boolean).map(s=>s.trim());
                                        if (e.target.checked) current.push(opt);
                                        else current = current.filter(item => item !== opt);
                                        setNewRecord({...newRecord, dau_hieu_lam_sang: current.join(', ')});
                                      }}
                                      className="w-4 h-4 text-[#009900] focus:ring-[#009900] rounded"
                                    />
                                    {opt}
                                </label>
                              )
                            })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Can thiệp</label>
                        <div className="flex flex-col gap-2">
                            {['Bác sĩ phải mở vết mổ', 'Chọc hút dịch từ vết mổ'].map(opt => {
                              const isChecked = (newRecord.can_thiep || '').includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={e => {
                                        let current = (newRecord.can_thiep || '').split(',').filter(Boolean).map(s=>s.trim());
                                        if (e.target.checked) current.push(opt);
                                        else current = current.filter(item => item !== opt);
                                        setNewRecord({...newRecord, can_thiep: current.join(', ')});
                                      }}
                                      className="w-4 h-4 text-[#009900] focus:ring-[#009900] rounded"
                                    />
                                    {opt}
                                </label>
                              )
                            })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-black/40">Kết quả vi sinh</label>
                        <input 
                          type="text" 
                          placeholder="Ghi nhận..."
                          value={newRecord.ket_qua_vi_sinh || ''}
                          onChange={e => setNewRecord({...newRecord, ket_qua_vi_sinh: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                        />
                      </div>
                      <div className="space-y-1 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <label className="text-[10px] font-black uppercase text-red-800">Phân loại NKVM</label>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                            {['Nông', 'Sâu', 'Cơ quan - Khoang cơ thể', 'Không NKVM'].map(opt => (
                               <label key={opt} className="flex items-center gap-2 text-table font-bold cursor-pointer text-red-900">
                                  <input 
                                    type="radio" name="phan_loai_nkvm" 
                                    value={opt === 'Không NKVM' ? '' : opt}
                                    checked={(newRecord.phan_loai_nkvm || 'Không NKVM') === opt || (!newRecord.phan_loai_nkvm && opt === 'Không NKVM')}
                                    onChange={e => setNewRecord({...newRecord, phan_loai_nkvm: e.target.value})}
                                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                                  />
                                  {opt}
                               </label>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 rounded-lg text-table font-black uppercase text-slate-500 hover:bg-slate-100 transition-all outline-none"
              >
                Đóng
              </button>
              {!viewOnly && (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-2 bg-[#009900] text-white rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} 
                  {isEditMode ? 'Cập nhật' : 'Lưu dữ liệu'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#009900] text-white">
              <h3 className="text-main-title font-bold uppercase flex items-center gap-2">
                <ClipboardList size={20} />
                {isEditMode ? 'Cập nhật' : 'Thêm mới'} Báo cáo Tổng hợp NKVM
              </h3>
              <button onClick={() => setShowDsModal(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors outline-none">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black/40">Ngày báo cáo *</label>
                  <input 
                    type="date" 
                    value={newDsRecord.ngay_bao_cao || ''}
                    onChange={e => setNewDsRecord({...newDsRecord, ngay_bao_cao: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                  />
                </div>
                <div className="space-y-1 relative" ref={unitRef}>
                  <label className="text-[10px] font-black uppercase text-black/40">Khoa *</label>
                  <input 
                    type="text" 
                    placeholder="Chọn khoa/phòng..."
                    value={newDsRecord.khoa || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setNewDsRecord({...newDsRecord, khoa: val});
                      if (val.trim()) {
                        const filtered = units.filter(u => 
                          u.ten_don_vi.toLowerCase().includes(val.toLowerCase()) || 
                          u.ma_don_vi.toLowerCase().includes(val.toLowerCase())
                        );
                        setFilteredUnits(filtered.slice(0, 5));
                        setShowUnitSuggestions(true);
                      } else {
                        setShowUnitSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (newDsRecord.khoa) setShowUnitSuggestions(true);
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
                  />
                  {showUnitSuggestions && filteredUnits.length > 0 && (
                    <div className="absolute z-[60] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                      {filteredUnits.map(u => (
                        <button
                          key={u.id}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                          onClick={() => {
                            setNewDsRecord({...newDsRecord, khoa: u.ten_don_vi});
                            setShowUnitSuggestions(false);
                          }}
                        >
                          <span className="text-black/40 mr-2">{u.ma_don_vi}</span>
                          {u.ten_don_vi}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Tổng số ca phẫu thuật */}
                <div className="bg-[#009900]/5 p-4 rounded-xl border border-[#009900]/20 space-y-2">
                  <label className="text-[12px] font-black uppercase text-[#009900]">1. Tổng số ca phẫu thuật *</label>
                  <input 
                    type="number" min="0"
                    value={newDsRecord.tong_so_ca_pt !== undefined ? newDsRecord.tong_so_ca_pt : 0}
                    onChange={e => setNewDsRecord({...newDsRecord, tong_so_ca_pt: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-table font-black focus:ring-2 focus:ring-[#009900] outline-none text-center text-xl shadow-inner transition-all"
                  />
                </div>
                
                {/* 2. Số ca Nhiễm khuẩn */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="text-[12px] font-black uppercase text-black/60 mb-3 block">2. Số ca Nhiễm khuẩn (Theo loại)</label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/50 text-center block">Nông</label>
                      <input 
                        type="number" min="0"
                        value={newDsRecord.so_ca_nkvm_nong !== undefined ? newDsRecord.so_ca_nkvm_nong : 0}
                        onChange={e => setNewDsRecord({...newDsRecord, so_ca_nkvm_nong: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none text-center transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/50 text-center block">Sâu</label>
                      <input 
                        type="number" min="0"
                        value={newDsRecord.so_ca_nkvm_sau !== undefined ? newDsRecord.so_ca_nkvm_sau : 0}
                        onChange={e => setNewDsRecord({...newDsRecord, so_ca_nkvm_sau: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none text-center transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-black/50 text-center block">Cơ quan</label>
                      <input 
                        type="number" min="0"
                        value={newDsRecord.so_ca_nkvm_co_quan !== undefined ? newDsRecord.so_ca_nkvm_co_quan : 0}
                        onChange={e => setNewDsRecord({...newDsRecord, so_ca_nkvm_co_quan: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none text-center transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1 pt-1 md:pt-0">
                      <label className="text-[10px] font-black uppercase text-red-600/80 text-center block">Tổng (Tự tính)</label>
                      <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-table font-black text-red-700 text-center shadow-inner">
                        {(newDsRecord.so_ca_nkvm_nong || 0) + (newDsRecord.so_ca_nkvm_sau || 0) + (newDsRecord.so_ca_nkvm_co_quan || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setShowDsModal(false)}
                className="px-6 py-2 rounded-lg text-table font-black uppercase text-slate-500 hover:bg-slate-100 transition-all outline-none"
              >
                Đóng
              </button>
              <button 
                  onClick={handleSaveDs}
                  disabled={loading}
                  className="px-8 py-2 bg-[#009900] text-white rounded-lg text-table font-black uppercase hover:bg-[#0d6e39] shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} 
                  {isEditMode ? 'Cập nhật' : 'Lưu dữ liệu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
