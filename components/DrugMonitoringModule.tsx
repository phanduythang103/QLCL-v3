import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Eye, Calendar, Building2, 
  Users, CheckCircle2, AlertTriangle, XCircle, FileText, 
  X, LayoutDashboard, List, Filter, RotateCcw, Stethoscope,
  CheckSquare, ClipboardCheck, Clock, UserCheck, ShieldCheck, BarChart3,
  TrendingUp, BarChart, Camera, Image as ImageIcon, Upload, Loader2,
  ChevronRight, ArrowRight, Pill, User
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { DrugMonitoring } from '../types';
import { fetchGsDrug, addGsDrug, updateGsDrug, deleteGsDrug, uploadDrugImage } from '../readGsDrug';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CRITERIA = [
  { id: 'tc1_phi_cong_khai_dau_giuong', section: 'I', label: 'Có Phiếu công khai thuốc đặt tại đầu giường hoặc vị trí thuận tiện.', role: 'Điều dưỡng' },
  { id: 'tc2_mau_phieu_dung_quy_dinh', section: 'I', label: 'Phiếu công khai được in/ghi rõ ràng, không tẩy xóa, đúng mẫu quy định.', role: 'Điều dưỡng' },
  { id: 'tc3_khop_y_lenh_benh_an', section: 'II', label: 'Tên thuốc, nồng độ/hàm lượng, đơn vị, số lượng khớp hoàn toàn với Y lệnh.', role: 'Điều dưỡng' },
  { id: 'tc4_ghi_cong_khai_hang_ngay', section: 'II', label: 'Thuốc được ghi công khai hàng ngày ngay sau khi thực hiện/cấp phát.', role: 'Điều dưỡng' },
  { id: 'tc5_vat_tu_tieu_hao', section: 'II', label: 'Các loại vật tư tiêu hao (bơm kim tiêm, dây truyền...) được công khai đủ.', role: 'Điều dưỡng' },
  { id: 'tc6_giai_thich_tien_su_di_ung', section: 'III', label: 'Điều dưỡng khai thác tiền sử dị ứng; giải thích tên thuốc, tác dụng, cách dùng.', role: 'Điều dưỡng' },
  { id: 'tc7_ky_xac_nhan_hang_ngay', section: 'III', label: 'Người bệnh hoặc người nhà ký xác nhận vào phiếu công khai thuốc hàng ngày.', role: 'Điều dưỡng, NB' },
  { id: 'tc8_phong_van_nb_loai_thuoc', section: 'IV', label: 'Người bệnh biết được sáng nay mình đã dùng bao nhiêu loại thuốc.', role: 'Người bệnh' },
  { id: 'tc9_nb_xac_nhan_so_thuoc', section: 'IV', label: 'Số thuốc thực tế nhận được khớp với số lượng ghi trên Phiếu công khai.', role: 'Người bệnh' },
  { id: 'tc10_nb_khong_tu_mua_thuoc', section: 'IV', label: 'Người bệnh không phải tự mua các loại thuốc có trong danh mục được hưởng.', role: 'Người bệnh' },
];

export const DrugMonitoringModule: React.FC = () => {
  const [data, setData] = useState<DrugMonitoring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DmDonVi[]>([]);
  const { user } = useAuth();

  const [editingItem, setEditingItem] = useState<DrugMonitoring | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH' | 'REPORT'>('OVERVIEW');
  const [filterConfig, setFilterConfig] = useState({
    timeRange: 'Tháng này',
    fromDate: '',
    toDate: '',
    department: 'Tất cả'
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [drugData, dmData] = await Promise.all([
        fetchGsDrug(),
        fetchDmDonVi()
      ]);
      setData(drugData);
      setDepartments(dmData);
    } catch (err: any) {
      console.error('Drug Monitoring Load Error:', err);
      setError(err.message || 'Không thể kết nối. Vui lòng kiểm tra lại SQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departmentList = useMemo(() => departments.map((d: DmDonVi) => d.ten_don_vi).filter(Boolean) as string[], [departments]);

  const filteredData = useMemo(() => {
    return data.filter((item: DrugMonitoring) => {
      const matchDept = filterConfig.department === 'Tất cả' || item.don_vi_duoc_giam_sat === filterConfig.department;
      
      let matchTime = true;
      const itemDate = new Date(item.ngay_giam_sat);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterConfig.timeRange === 'Hôm nay') {
        matchTime = itemDate >= today;
      } else if (filterConfig.timeRange === 'Tuần này') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        matchTime = itemDate >= startOfWeek;
      } else if (filterConfig.timeRange === 'Tháng này') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        matchTime = itemDate >= startOfMonth;
      } else if (filterConfig.timeRange === 'Quý này') {
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        matchTime = itemDate >= startOfQuarter;
      } else if (filterConfig.timeRange === 'Năm này') {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        matchTime = itemDate >= startOfYear;
      } else if (filterConfig.timeRange === 'Tùy chọn') {
        const matchFromDate = !filterConfig.fromDate || item.ngay_giam_sat >= filterConfig.fromDate;
        const matchToDate = !filterConfig.toDate || item.ngay_giam_sat <= filterConfig.toDate;
        matchTime = matchFromDate && matchToDate;
      }

      return matchDept && matchTime;
    });
  }, [data, filterConfig]);

  const exportToExcel = () => {
    try {
      if (activeTab === 'REPORT') {
        const groups: Record<string, any> = {};
        filteredData.forEach((item: DrugMonitoring) => {
          const dept = item.don_vi_duoc_giam_sat || 'Chưa xác định';
          if (!groups[dept]) groups[dept] = { dept, total: 0, pass100: 0, errors: {} };
          groups[dept].total++;
          if (Number(item.ty_le_tuan_thu) >= 100) groups[dept].pass100++;
          else {
            CRITERIA.forEach(c => {
               if (!item[c.id]) {
                  groups[dept].errors[c.label] = (groups[dept].errors[c.label] || 0) + 1;
               }
            });
          }
        });

        const reportRows = Object.values(groups).map((g: any) => [
          g.dept,
          g.total,
          g.pass100,
          ((g.pass100 / g.total) * 100).toFixed(1) + '%',
          Object.entries(g.errors)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([err, count]) => `- ${err} (x${count})`)
            .join('\n')
        ]);

        const title = "TỔNG HỢP GIÁM SÁT SỬ DỤNG THUỐC";
        const dateStr = filterConfig.timeRange === 'Tùy chọn' 
          ? `Từ ngày ${filterConfig.fromDate || '...'} đến ngày ${filterConfig.toDate || '...'}`
          : `Kỳ báo cáo: ${filterConfig.timeRange}`;

        const wsData = [
          [title],
          [dateStr],
          [],
          ['Đơn vị', 'Tổng (A)', 'Đạt 100% (B)', 'Tỷ lệ %', 'Lỗi phổ biến']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.sheet_add_aoa(ws, reportRows, { origin: 'A5' });

        // Set column widths
        ws['!cols'] = [
          { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 60 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TongHop");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, `GiamSatDrug_TongHop_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Xuất file thất bại.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-slate-100/50 p-1.5 gap-1 rounded-[28px] border border-slate-200/50 shrink-0">
            <TabButton 
              active={activeTab === 'OVERVIEW'} 
              onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} 
              icon={LayoutDashboard} 
              label="Tổng quan" 
            />
            <TabButton 
              active={activeTab === 'DANH_SACH'} 
              onClick={() => { setActiveTab('DANH_SACH'); setViewMode('LIST'); }} 
              icon={List} 
              label="Danh sách" 
            />
            <TabButton 
              active={activeTab === 'REPORT'} 
              onClick={() => { setActiveTab('REPORT'); setViewMode('LIST'); }} 
              icon={BarChart3} 
              label="Tổng hợp" 
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'REPORT' && (
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                <FileText size={18} /> <span className="hidden md:inline">Xuất Excel</span>
              </button>
            )}
            {activeTab === 'DANH_SACH' && (
              <button 
                onClick={() => { setEditingItem(null); setViewMode('FORM'); }}
                className="flex items-center gap-2 bg-[#009900] hover:bg-[#0d6e39] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-green-200 active:scale-95"
              >
                <Plus size={18} /> Thêm
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-4 pt-0 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
              <select 
                value={filterConfig.timeRange}
                onChange={e => setFilterConfig({ ...filterConfig, timeRange: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#009900]/10 focus:ring-4 transition-all"
              >
                {['Hôm nay', 'Tuần này', 'Tháng này', 'Quý này', 'Năm này', 'Tùy chọn'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {filterConfig.timeRange === 'Tùy chọn' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Từ ngày</label>
                  <input 
                    type="date" 
                    value={filterConfig.fromDate}
                    onChange={e => setFilterConfig({ ...filterConfig, fromDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#009900]/10 focus:ring-4 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Đến ngày</label>
                  <input 
                    type="date" 
                    value={filterConfig.toDate}
                    onChange={e => setFilterConfig({ ...filterConfig, toDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#009900]/10 focus:ring-4 transition-all"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Đơn vị giám sát</label>
              <select 
                value={filterConfig.department}
                onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#009900]/10 focus:ring-4 transition-all"
              >
                <option value="Tất cả">Tất cả khoa</option>
                {departmentList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={() => setFilterConfig({ timeRange: 'Tháng này', fromDate: '', toDate: '', department: 'Tất cả' })}
                className="w-full p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-dashed border-slate-300 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw size={14} className="inline mr-2" /> Xóa lọc
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <Loader2 className="animate-spin text-[#009900]" size={32} />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold">Lỗi: {error}</div>
        ) : activeTab === 'OVERVIEW' ? (
          <DrugOverview data={filteredData} />
        ) : activeTab === 'REPORT' ? (
          <DrugReport data={filteredData} />
        ) : viewMode === 'LIST' ? (
          <DrugList 
            data={filteredData} 
            onView={(item: DrugMonitoring) => { setEditingItem(item); setViewMode('DETAIL'); }}
            onEdit={(item: DrugMonitoring) => { setEditingItem(item); setViewMode('FORM'); }}
            onDelete={async (id: string) => {
              if (window.confirm('Xóa bản ghi này?')) {
                await deleteGsDrug(id);
                loadData();
              }
            }}
          />
        ) : viewMode === 'DETAIL' && editingItem ? (
          <DrugDetailView 
            item={editingItem} 
            currentUser={user}
            onClose={() => setViewMode('LIST')}
            onEdit={() => setViewMode('FORM')}
            onDelete={async () => {
              if (window.confirm('Xóa bản ghi này?')) {
                await deleteGsDrug(editingItem.id!);
                setViewMode('LIST');
                loadData();
              }
            }}
          />
        ) : (
          <DrugFormView 
            item={editingItem}
            onClose={() => setViewMode('LIST')}
            onSaved={() => { setViewMode('LIST'); loadData(); }}
            currentUser={user}
            departmentList={departmentList}
          />
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active 
        ? 'bg-white text-[#009900] shadow-lg shadow-green-100 border border-green-50' 
        : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-600',
    green: 'bg-green-50 text-[#009900]',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <div className="bg-white p-2 sm:p-3 rounded-[20px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start lg:items-center text-center sm:text-left gap-1 sm:gap-2 h-full min-w-0">
      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 16, className: "sm:w-5 sm:h-5" })}
      </div>
      <div className="min-w-0 w-full overflow-hidden">
        <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-tight sm:tracking-widest leading-tight truncate">{label}</p>
        <h3 className="text-[10px] sm:text-sm font-black text-slate-800 tracking-tight truncate">{value}</h3>
      </div>
    </div>
  );
};

const DrugOverview = ({ data }: { data: DrugMonitoring[] }) => {
  const stats = useMemo(() => {
    const total = data.length;
    if (total === 0) return { total: 0, complianceRate: 0 };
    const avgPass = data.reduce((acc, curr) => acc + (Number(curr.ty_le_tuan_thu) || 0), 0) / total;
    return { total, complianceRate: avgPass };
  }, [data]);

  const chartData = useMemo(() => {
    const dayMap: Record<string, { date: string, count: number, pass: number }> = {};
    data.forEach(item => {
      const d = new Date(item.ngay_giam_sat);
      const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!dayMap[key]) dayMap[key] = { date: key, count: 0, pass: 0 };
      dayMap[key].count++;
      if (Number(item.ty_le_tuan_thu) >= 100) dayMap[key].pass++;
    });
    return Object.values(dayMap).sort((a: any, b: any) => {
      const [d1, m1] = a.date.split('/');
      const [d2, m2] = b.date.split('/');
      return new Date(2026, Number(m2)-1, Number(d1)).getTime() - new Date(2026, Number(m2)-1, Number(d2)).getTime();
    }).map((d: any) => ({ ...d, rate: Number(((d.pass / d.count) * 100).toFixed(1)) }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
        <StatCard icon={<Pill />} label="Tổng số lượt" value={stats.total} color="slate" />
        <StatCard icon={<CheckCircle2 />} label="Tỷ lệ tuân thủ" value={`${stats.complianceRate.toFixed(1)}%`} color="green" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-80">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-600" /> Xu hướng tuân thủ (%)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#009900" strokeWidth={3} dot={{ r: 4, fill: '#009900' }} name="Tỷ lệ đạt" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-80">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart size={16} className="text-[#009900]" /> Số lượt giám sát (Ca)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#009900" radius={[4, 4, 0, 0]} opacity={0.8} name="Số lượt" />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} name="Trend" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const DrugList = ({ data, onView, onEdit, onDelete }: { data: DrugMonitoring[], onView: (item: DrugMonitoring) => void, onEdit: (item: DrugMonitoring) => void, onDelete: (id: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = data.filter((item: DrugMonitoring) => 
    item.ho_ten_nb.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.don_vi_duoc_giam_sat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Tìm kiếm NB, Đơn vị..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none ring-[#009900]/10 focus:ring-4 transition-all"
          />
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#009900] text-white text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-6">Ngày</th>
              <th className="p-6">Đơn vị</th>
              <th className="p-6">Bệnh nhân (Mã NB)</th>
              <th className="p-6 text-center">Tỷ lệ</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item: DrugMonitoring) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6 text-sm font-bold text-slate-700">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                <td className="p-6 text-sm text-slate-600">{item.don_vi_duoc_giam_sat}</td>
                <td className="p-6">
                   <p className="text-sm font-black text-slate-800 uppercase">{item.ho_ten_nb}</p>
                   <p className="text-[10px] text-slate-400 font-bold">{item.ma_nb || '---'}</p>
                </td>
                <td className="p-6 text-center">
                   <span className={`text-sm font-black ${item.ty_le_tuan_thu >= 100 ? 'text-[#009900]' : 'text-amber-600'}`}>
                      {Number(item.ty_le_tuan_thu).toFixed(0)}%
                   </span>
                </td>
                <td className="p-6 flex justify-end gap-2">
                   <button onClick={() => onView(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Eye size={18}/></button>
                   <button onClick={() => onEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 size={18}/></button>
                   <button onClick={() => onDelete(item.id!)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((item: DrugMonitoring) => (
          <div key={item.id} className="p-4 space-y-3">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p>
                 <h4 className="text-sm font-black text-slate-800 uppercase leading-snug">{item.ho_ten_nb}</h4>
                 <p className="text-[10px] text-slate-500 font-bold uppercase">{item.don_vi_duoc_giam_sat}</p>
               </div>
               <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.ty_le_tuan_thu >= 100 ? 'bg-green-100 text-[#009900]' : 'bg-amber-100 text-amber-600'}`}>
                 {Number(item.ty_le_tuan_thu).toFixed(0)}% Đạt
               </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => onView(item)} className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100">Xem</button>
               <button onClick={() => onEdit(item)} className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">Sửa</button>
               <button onClick={() => onDelete(item.id!)} className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Trash2 size={16}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DrugReport = ({ data }: { data: DrugMonitoring[] }) => {
  const reportData = useMemo(() => {
    const groups: Record<string, any> = {};
    data.forEach((item: DrugMonitoring) => {
      const dept = item.don_vi_duoc_giam_sat || 'Chưa xác định';
      if (!groups[dept]) groups[dept] = { dept, a: 0, b: 0, errors: {} };
      groups[dept].a++;
      if (Number(item.ty_le_tuan_thu) >= 100) groups[dept].b++;
      else {
        CRITERIA.forEach(c => {
          if (!item[c.id]) groups[dept].errors[c.label] = (groups[dept].errors[c.label] || 0) + 1;
        });
      }
    });
    return Object.values(groups).map((g: any) => ({
      ...g,
      rate: (g.b / g.a) * 100,
      topErrors: Object.entries(g.errors).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3)
    })).sort((a,b) => b.rate - a.rate);
  }, [data]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
       <div className="hidden md:block">
         <table className="w-full text-left">
           <thead className="bg-[#009900] text-white text-[10px] font-black uppercase tracking-widest">
             <tr>
               <th className="p-6">Đơn vị</th>
               <th className="p-6 text-center">Tổng (A)</th>
               <th className="p-6 text-center">Đạt 100% (B)</th>
               <th className="p-6 text-center">Tỷ lệ %</th>
               <th className="p-6">Lỗi phổ biến</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {reportData.map((row: any, idx) => (
               <tr key={idx} className="hover:bg-slate-50 text-sm">
                 <td className="p-6 font-bold text-slate-700">{row.dept}</td>
                 <td className="p-6 text-center text-slate-600">{row.a}</td>
                 <td className="p-6 text-center text-slate-600">{row.b}</td>
                 <td className="p-6 text-center font-black text-[#009900]">{row.rate.toFixed(1)}%</td>
                 <td className="p-6 pr-8">
                   {row.topErrors.length > 0 ? (
                     <div className="space-y-1">
                       {row.topErrors.map(([err, count]: [string, number], i: number) => (
                         <li key={i} className="text-[10px] text-rose-500 font-bold italic list-none flex items-center gap-1">
                           <XCircle size={10}/> {err} (x{count})
                         </li>
                       ))}
                     </div>
                   ) : <span className="text-slate-300 italic">---</span>}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
       
       <div className="md:hidden divide-y divide-slate-100">
         {reportData.map((row: any, idx) => (
           <div key={idx} className="p-4 space-y-2">
             <div className="flex justify-between items-center">
               <h4 className="text-sm font-black text-slate-800 uppercase">{row.dept}</h4>
               <span className="text-lg font-black text-[#009900]">{row.rate.toFixed(0)}%</span>
             </div>
             <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Ca: {row.a}</span>
                <span>Đạt: {row.b}</span>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

const DrugFormView = ({ item, onClose, onSaved, currentUser, departmentList }: any) => {
  const [formData, setFormData] = useState<any>(item || {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: currentUser?.full_name || '',
    don_vi_duoc_giam_sat: '',
    ho_ten_nb: '',
    nam_sinh: '',
    ma_nb: '',
    tc1_phi_cong_khai_dau_giuong: true,
    tc2_mau_phieu_dung_quy_dinh: true,
    tc3_khop_y_lenh_benh_an: true,
    tc4_ghi_cong_khai_hang_ngay: true,
    tc5_vat_tu_tieu_hao: true,
    tc6_giai_thich_tien_su_di_ung: true,
    tc7_ky_xac_nhan_hang_ngay: true,
    tc8_phong_van_nb_loai_thuoc: true,
    tc9_nb_xac_nhan_so_thuoc: true,
    tc10_nb_khong_tu_mua_thuoc: true,
    ghi_chu: '',
    tong_dat: 10,
    ty_le_tuan_thu: 100,
    hinh_anh: []
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ids = CRITERIA.map(c => c.id);
    const count = ids.filter(id => (formData as any)[id] === true).length;
    const rate = (count / CRITERIA.length) * 100;
    setFormData((prev: any) => ({ ...prev, tong_dat: count, ty_le_tuan_thu: rate }));
  }, [
    formData.tc1_phi_cong_khai_dau_giuong, formData.tc2_mau_phieu_dung_quy_dinh, formData.tc3_khop_y_lenh_benh_an,
    formData.tc4_ghi_cong_khai_hang_ngay, formData.tc5_vat_tu_tieu_hao, formData.tc6_giai_thich_tien_su_di_ung,
    formData.tc7_ky_xac_nhan_hang_ngay, formData.tc8_phong_van_nb_loai_thuoc, formData.tc9_nb_xac_nhan_so_thuoc,
    formData.tc10_nb_khong_tu_mua_thuoc
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(file => uploadDrugImage(file)));
      setFormData((prev: any) => ({ ...prev, hinh_anh: [...(prev.hinh_anh || []), ...urls] }));
    } catch (err) {
      alert('Lỗi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Clean data before sending
    const submitData = {
      ...formData,
      nam_sinh: formData.nam_sinh ? Number(formData.nam_sinh) : null,
      tong_dat: Number(formData.tong_dat),
      ty_le_tuan_thu: Number(formData.ty_le_tuan_thu)
    };

    try {
      if (item?.id) await updateGsDrug(item.id, submitData);
      else await addGsDrug(submitData);
      onSaved();
    } catch (err: any) {
      console.error('Drug Monitoring Submit Error:', err);
      alert('Lỗi lưu dữ liệu: ' + (err.message || 'Vui lòng kiểm tra lại kết nối hoặc quyền truy cập bảng giam_sat_drug'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
       <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-[#009900] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100"><Pill size={24}/></div>
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{item?.id ? 'Sửa' : 'Thêm'} Giám sát Thuốc</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiểm tra công khai và tư vấn thuốc</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"><X size={24}/></button>
       </div>

       <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
             <FormField label="Ngày" icon={<Calendar/>}>
                <input type="date" value={formData.ngay_giam_sat} onChange={e => setFormData({...formData, ngay_giam_sat: e.target.value})} className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all"/>
             </FormField>
             <FormField label="Khoa/Đơn vị" icon={<Building2/>}>
                <select value={formData.don_vi_duoc_giam_sat} onChange={e => setFormData({...formData, don_vi_duoc_giam_sat: e.target.value})} className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all">
                   <option value="">-- Chọn đơn vị --</option>
                   {departmentList.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
             </FormField>
             <FormField label="Họ tên NB" icon={<User/>}>
                <input value={formData.ho_ten_nb} onChange={e => setFormData({...formData, ho_ten_nb: e.target.value.toUpperCase()})} placeholder="NGUYỄN VĂN A" className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-black uppercase outline-none focus:ring-4 focus:ring-green-500/10 transition-all"/>
             </FormField>
             <FormField label="Năm sinh" icon={<Calendar/>}>
                <input type="number" value={formData.nam_sinh} onChange={e => setFormData({...formData, nam_sinh: e.target.value})} placeholder="1990" className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all"/>
             </FormField>
             <FormField label="Mã NB" icon={<Pill/>}>
                <input value={formData.ma_nb} onChange={e => setFormData({...formData, ma_nb: e.target.value})} placeholder="123456" className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all"/>
             </FormField>
             <FormField label="Ghi chú" icon={<FileText/>}>
                <input value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} placeholder="..." className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all"/>
             </FormField>
          </div>

          <div className="space-y-4">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2"><ShieldCheck size={16} className="text-[#009900]"/> Nội dung đánh giá</h3>
             <div className="grid grid-cols-1 gap-3">
                {CRITERIA.map((c, i) => (
                   <div key={c.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-green-100 transition-all">
                         <div className="flex-1 space-y-1">
                            <div className="flex items-start gap-2">
                               <span className="text-[10px] font-black text-slate-400 mt-1">{i+1}</span>
                               <p className="text-sm font-bold text-slate-700 leading-tight">{c.label}</p>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest ml-4">Thực hiện: {c.role}</p>
                         </div>
                         <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => setFormData({...formData, [c.id]: true, [`${c.id}_ghi_chu`]: ''})} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData[c.id] === true ? 'bg-[#009900] text-white border-green-600 shadow-lg shadow-green-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>Đạt</button>
                            <button type="button" onClick={() => setFormData({...formData, [c.id]: false})} className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData[c.id] === false ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>K.Đạt</button>
                         </div>
                      </div>
                      {formData[c.id] === false && (
                         <div className="mx-4 mb-4 mt-1 animate-in slide-in-from-top-2 duration-200">
                            <input 
                               value={formData[`${c.id}_ghi_chu`] || ''} 
                               onChange={e => setFormData({...formData, [`${c.id}_ghi_chu`]: e.target.value})}
                               placeholder="Mô tả lỗi/ghi chú chi tiết cho bước này..."
                               className="w-full p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-[11px] font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-200 transition-all"
                            />
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2">
                <ImageIcon size={16} className="text-[#009900]"/> Minh chứng hình ảnh ({formData.hinh_anh?.length || 0})
             </h3>
             <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 space-y-4">
                <div className="flex flex-wrap gap-4">
                   {formData.hinh_anh?.map((url: string, i: number) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md group">
                         <img src={url} alt="minh-chung" className="w-full h-full object-cover" />
                         <button type="button" onClick={() => setFormData({...formData, hinh_anh: formData.hinh_anh.filter((_: any, idx: number) => idx !== i)})} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                      </div>
                   ))}
                   <label className={`w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-[#009900] hover:text-[#009900] transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
                      <input type="file" hidden multiple accept="image/*" onChange={handleFileUpload} />
                      {uploading ? <Loader2 className="animate-spin" size={24}/> : <Camera size={24}/>}
                      <span className="text-[8px] font-black uppercase tracking-widest mt-1">{uploading ? 'Đang tải' : 'Thêm ảnh'}</span>
                   </label>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
             <div className="flex gap-8">
                <div className="text-center md:text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu chí Đạt</p>
                   <p className="text-2xl font-black text-[#009900]">{formData.tong_dat} / 10</p>
                </div>
                <div className="text-center md:text-left">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tỷ lệ %</p>
                   <p className="text-2xl font-black text-indigo-600">{formData.ty_le_tuan_thu.toFixed(1)}%</p>
                </div>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
                <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Hủy</button>
                <button type="submit" disabled={saving || uploading} className="flex-1 md:flex-none px-12 py-3.5 bg-[#009900] text-white rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-green-200 disabled:opacity-50">
                   {saving ? 'Đang lưu...' : 'Lưu kết quả'}
                </button>
             </div>
          </div>
       </form>
    </div>
  );
};

const DrugDetailView = ({ item, currentUser, onClose, onEdit, onDelete }: any) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isCreator = item.nguoi_giam_sat === currentUser?.full_name;

  const sections = [
    { id: 'I', title: 'HÌNH THỨC CÔNG KHAI' },
    { id: 'II', title: 'NỘI DUNG CÔNG KHAI' },
    { id: 'III', title: 'TƯ VẤN VÀ GIẢI THÍCH' },
    { id: 'IV', title: 'KIỂM TRA THỰC TẾ' }
  ];

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-12 border border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-500">
       <div className="max-w-4xl mx-auto space-y-10">
          <div className="flex justify-between items-center no-print">
             <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all font-black uppercase text-[10px]"><X size={20}/> Đóng</button>
             <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all hover:bg-slate-200"><FileText size={16}/> In phiếu</button>
                {(isAdmin || isCreator) && <button onClick={onEdit} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all active:scale-95"><Edit2 size={16}/> Sửa</button>}
                {isAdmin && <button onClick={onDelete} className="bg-white border border-rose-200 text-rose-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-50 transition-all"><Trash2 size={16}/></button>}
             </div>
          </div>

          <div className="text-center space-y-2">
             <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">BẢNG KIỂM GIÁM SÁT AN TOÀN SỬ DỤNG THUỐC</h1>
             <p className="text-slate-500 italic text-xs md:text-sm">(Xây dựng theo Thông tư 23/2011/TT-BYT và quy chuẩn an toàn người bệnh)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b-2 border-slate-900 border-dashed">
             <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Đơn vị được giám sát:</span>
                <span className="flex-1 border-b border-dotted border-slate-400 font-black text-slate-900 uppercase">{item.don_vi_duoc_giam_sat}</span>
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Ngày giám sát:</span>
                <span className="flex-1 border-b border-dotted border-slate-400 font-black text-slate-900">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</span>
             </div>
             <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Họ tên NB:</span>
                <span className="flex-1 border-b border-dotted border-slate-400 font-black text-slate-900 uppercase px-2 bg-slate-50">{item.ho_ten_nb}</span>
             </div>
             <div className="flex items-baseline gap-2 lg:grid lg:grid-cols-2">
                <div className="flex items-baseline gap-2">
                   <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Mã NB:</span>
                   <span className="flex-1 border-b border-dotted border-slate-400 font-black text-slate-900">{item.ma_nb || '---'}</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <span className="text-sm font-bold text-slate-700 whitespace-nowrap ml-4">Năm sinh:</span>
                   <span className="flex-1 border-b border-dotted border-slate-400 font-black text-slate-900">{item.nam_sinh || '---'}</span>
                </div>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full border-2 border-slate-800 border-collapse">
                <thead>
                   <tr className="bg-slate-100 text-[10px] md:text-xs font-black uppercase text-slate-800 text-center">
                      <th className="p-3 border-2 border-slate-800 w-10">STT</th>
                      <th className="p-3 border-2 border-slate-800 text-left">Nội dung/Bước trọng yếu giám sát</th>
                      <th className="p-3 border-2 border-slate-800 w-16">Đạt</th>
                      <th className="p-3 border-2 border-slate-800 w-16">Không đạt</th>
                      <th className="p-3 border-2 border-slate-800 min-w-[120px]">Ghi chú (Mô tả lỗi)</th>
                   </tr>
                </thead>
                <tbody>
                   {sections.map(section => (
                      <React.Fragment key={section.id}>
                         <tr className="bg-slate-50 font-black text-slate-900 text-sm">
                            <td className="p-3 border-2 border-slate-800 text-center uppercase">{section.id}</td>
                            <td colSpan={4} className="p-3 border-2 border-slate-800 uppercase bg-slate-100/50">{section.title}</td>
                         </tr>
                         {CRITERIA.filter(c => c.section === section.id).map((c, idx) => (
                            <tr key={c.id} className="text-[11px] md:text-sm group hover:bg-slate-50/50">
                               <td className="p-3 border-2 border-slate-800 text-center font-bold text-slate-600">{idx + 1}</td>
                               <td className="p-3 border-2 border-slate-800 font-bold text-slate-700 leading-snug">{c.label}</td>
                               <td className="p-3 border-2 border-slate-800 text-center">
                                  {item[c.id] === true && <CheckSquare className="mx-auto text-[#009900]" size={20}/>}
                               </td>
                               <td className="p-3 border-2 border-slate-800 text-center">
                                  {item[c.id] === false && <X className="mx-auto text-rose-500" size={20}/>}
                               </td>
                               <td className="p-3 border-2 border-slate-800 text-rose-600 font-bold italic leading-tight">
                                  {item[`${c.id}_ghi_chu`] || ''}
                               </td>
                            </tr>
                         ))}
                      </React.Fragment>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="flex justify-between pt-4 gap-8">
             <div className="text-center flex-1 space-y-16">
                <p className="text-sm font-bold text-slate-800">NGƯỜI BỆNH/NGƯỜI NHÀ</p>
                <p className="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
             </div>
             <div className="text-center flex-1 space-y-16">
                <p className="text-sm font-bold text-slate-800 uppercase">NGƯỜI GIÁM SÁT</p>
                <div className="space-y-1">
                   {item.nguoi_giam_sat && <p className="text-sm font-black text-slate-900 uppercase underline">{item.nguoi_giam_sat}</p>}
                </div>
             </div>
          </div>

          {item.hinh_anh && item.hinh_anh.length > 0 && (
             <div className="space-y-4 no-print pt-6 border-t border-dashed border-slate-200">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 px-2"><ImageIcon size={16} className="text-[#009900]"/> Hình ảnh minh chứng</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {item.hinh_anh.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden shadow-md border-2 border-white hover:scale-105 transition-all">
                         <img src={url} alt="minh-chung" className="w-full h-56 object-cover" />
                      </a>
                   ))}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};

const InfoField = ({ label, value, uppercase, color }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-base font-black ${uppercase ? 'uppercase' : ''} ${color || 'text-slate-800'}`}>{value || '---'}</span>
  </div>
);

const FormField = ({ label, icon, children }: any) => (
  <div className="space-y-1.5 min-w-0">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
      {React.cloneElement(icon, { size: 12, className: "text-indigo-400" })}
      {label}
    </label>
    {children}
  </div>
);
