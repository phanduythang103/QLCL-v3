import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, AlertTriangle, XCircle,
  Plus, Search, Edit2, Trash2, Calendar, FileDown, Eye, Filter,
  TrendingDown, TrendingUp, Minus, Activity, Target, Scissors
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PtLoai2 } from '../types';
import { fetchPtLoai2, addPtLoai2, updatePtLoai2, deletePtLoai2 } from '../readPtLoai2';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';

type TabType = 'OVERVIEW' | 'LIST';
type DateFilterType = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'LAST_QUARTER' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM';

export const PtLoai2Module: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [data, setData] = useState<PtLoai2[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DmDonVi[]>([]);

  // Computed list for autocomplete
  const departmentList = useMemo(() => {
    return departments.map(d => d.ten_don_vi).filter(Boolean);
  }, [departments]);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PtLoai2 | null>(null);
  
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [ptData, dmDonViData] = await Promise.all([
        fetchPtLoai2(),
        fetchDmDonVi()
      ]);
      setData(ptData);
      setDepartments(dmDonViData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="pt-loai2-module bg-slate-50 min-h-[calc(100vh-8rem)]">
      {/* Module Header & Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="pt-loai2-header flex flex-row items-center justify-between p-4 md:px-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="pt-loai2-header-icon w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Scissors size={24} />
            </div>
            <div>
              <h2 className="text-main-title font-bold text-slate-800 tracking-tight uppercase">Tỷ lệ Phẫu thuật loại II trở lên</h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">Giám sát & Phân tích cơ cấu kỹ thuật phẫu thuật</p>
            </div>
          </div>
          
          <div className="pt-loai2-tab-grid flex bg-slate-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`pt-loai2-tab-button flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-table font-bold transition-all whitespace-nowrap uppercase ${
                activeTab === 'OVERVIEW' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Target size={18} /> Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={`pt-loai2-tab-button flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-table font-bold transition-all whitespace-nowrap uppercase ${
                activeTab === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={18} /> Danh sách báo cáo
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
            Lỗi tải dữ liệu: {error}
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && <OverviewTab data={data} departments={departments} />}
            {activeTab === 'LIST' && (
              <ListTab 
                data={data} 
                onView={(item: PtLoai2) => { setEditingItem(item); setIsFormOpen(true); }}
                onEdit={(item: PtLoai2) => { setEditingItem(item); setIsFormOpen(true); }}
                onDelete={async (id: string) => {
                  if(window.confirm('Bạn có chắc muốn xóa báo cáo này?')) {
                    await deletePtLoai2(id);
                    loadData();
                  }
                }}
                onAddNew={() => { setEditingItem(null); setIsFormOpen(true); }}
              />
            )}
          </>
        )}
      </div>

      {isFormOpen && (
        <PtLoai2FormModal 
          item={editingItem} 
          isReadOnly={editingItem !== null && isFormOpen === true && (document.activeElement?.textContent?.includes('Xem') || (window as any)._isViewing)}
          onClose={() => { setIsFormOpen(false); (window as any)._isViewing = false; }} 
          onSaved={() => { setIsFormOpen(false); loadData(); (window as any)._isViewing = false; }}
          currentUser={user}
          departmentList={departmentList}
        />
      )}
    </div>
  );
};

// ================= OVERVIEW TAB =================
const OverviewTab = ({ data, departments }: { data: PtLoai2[], departments: DmDonVi[] }) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Extract unique departments from data if they don't exist in master list (fallback)
  const uniqueDepartments = useMemo(() => {
    const fromMaster = departments.map(d => d.ten_don_vi).filter(Boolean);
    const fromData = data.map(d => d.khoa).filter(Boolean) as string[];
    return Array.from(new Set([...fromMaster, ...fromData])).sort();
  }, [data, departments]);

  // Lọc dữ liệu theo thời gian và đơn vị
  const filteredData = useMemo(() => {
    let result = data;

    // Filter by department
    if (departmentFilter !== 'ALL') {
      result = result.filter(item => item.khoa === departmentFilter);
    }

    // Filter by date
    if (dateFilter === 'ALL') return result;
    
    const now = new Date();
    let start = new Date(0);
    let end = new Date(now.getFullYear() + 10, 0, 1); // Far future

    if (dateFilter === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateFilter === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (dateFilter === 'THIS_QUARTER') {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
    } else if (dateFilter === 'LAST_QUARTER') {
      const q = Math.floor(now.getMonth() / 3) - 1;
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
    } else if (dateFilter === 'THIS_YEAR') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (dateFilter === 'LAST_YEAR') {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
    } else if (dateFilter === 'CUSTOM') {
      start = customStart ? new Date(customStart) : new Date(0);
      end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date(now.getFullYear() + 10, 0, 1);
    }

    return result.filter(item => {
      if (!item.ngay_bao_cao) return false;
      const d = new Date(item.ngay_bao_cao);
      return d >= start && d <= end;
    });
  }, [data, dateFilter, departmentFilter, customStart, customEnd]);

  // Thống kê
  const stats = useMemo(() => {
    let tongSoPT = 0;
    let tongLoai2TroLen = 0;
    let tongLoaiDB = 0;
    let tongLoai1 = 0;
    let tongLoai2 = 0;
    
    filteredData.forEach(item => {
      tongSoPT += item.tong_so_pt || 0;
      tongLoai2TroLen += item.tong_pt_loai_2_tro_len || 0;
      tongLoaiDB += item.pt_loai_db || 0;
      tongLoai1 += item.pt_loai_1 || 0;
      tongLoai2 += item.pt_loai_2 || 0;
    });

    const tyLeChung = tongSoPT > 0 ? ((tongLoai2TroLen / tongSoPT) * 100).toFixed(2) : 0;

    // Nhóm theo khoa
    const byKhoa: Record<string, { total: number, loai2: number }> = {};
    filteredData.forEach(item => {
      const sp = item.khoa || 'Khác';
      if (!byKhoa[sp]) byKhoa[sp] = { total: 0, loai2: 0 };
      byKhoa[sp].total += item.tong_so_pt || 0;
      byKhoa[sp].loai2 += item.tong_pt_loai_2_tro_len || 0;
    });

    return { tongSoPT, tongLoai2TroLen, tyLeChung, tongLoaiDB, tongLoai1, tongLoai2, byKhoa };
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Bộ lọc thời gian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 hide-scrollbar">
          <Filter size={16} className="text-slate-400 shrink-0 mr-2" />
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none min-w-[140px]"
          >
            <option value="ALL">🗓️ Tất cả thời gian</option>
            <option value="THIS_MONTH">Tháng này</option>
            <option value="LAST_MONTH">Tháng trước</option>
            <option value="THIS_QUARTER">Quý này</option>
            <option value="LAST_QUARTER">Quý trước</option>
            <option value="THIS_YEAR">Năm nay</option>
            <option value="LAST_YEAR">Năm trước</option>
            <option value="CUSTOM">Tùy chọn...</option>
          </select>

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-4 duration-300">
              <input 
                type="date" 
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none w-[130px]"
              />
              <span className="text-slate-400 font-medium">-</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none w-[130px]"
              />
            </div>
          )}

          <div className="w-px h-6 bg-slate-200 hidden md:block mx-1"></div>

          <Building2 size={16} className="text-slate-400 shrink-0 mr-1 hidden md:block" />
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none min-w-[180px]"
          >
            <option value="ALL">🏥 Tất cả Khoa / Đơn vị</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        
        <div className="shrink-0 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          Có {filteredData.length} báo cáo
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="pt-loai2-stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="pt-loai2-stat-icon w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng số PT</div>
            <div className="text-lg font-bold text-blue-600">{stats.tongSoPT}</div>
          </div>
        </div>

        <div className="pt-loai2-stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="pt-loai2-stat-icon w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">PT Loại II trở lên</div>
            <div className="text-lg font-bold text-emerald-600">{stats.tongLoai2TroLen}</div>
          </div>
        </div>

        <div className="pt-loai2-stat-card bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-4 text-white">
          <div className="pt-loai2-stat-icon w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Target size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest leading-none mb-1">Tỷ lệ PT ≥ Loại II</div>
            <div className="text-lg font-bold text-white">{stats.tyLeChung}%</div>
          </div>
        </div>
      </div>

      {/* Sub Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="pt-loai2-stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="pt-loai2-stat-icon w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Loại Đặc Biệt</div>
            <div className="text-lg font-bold text-rose-600">{stats.tongLoaiDB}</div>
          </div>
        </div>

        <div className="pt-loai2-stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="pt-loai2-stat-icon w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Loại I</div>
            <div className="text-lg font-bold text-amber-600">{stats.tongLoai1}</div>
          </div>
        </div>

        <div className="pt-loai2-stat-card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="pt-loai2-stat-icon w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Loại II</div>
            <div className="text-lg font-bold text-sky-600">{stats.tongLoai2}</div>
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Building2 size={18} className="text-indigo-500" />
          Tỷ lệ theo Khoa
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.byKhoa).map(([name, vals]: [string, any]) => {
            const percent = vals.total > 0 ? (vals.loai2 / vals.total) * 100 : 0;
            return (
              <div key={name} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-slate-700">{name}</span>
                  <span className="text-sm font-black text-indigo-600">{percent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Loại II trở lên: {vals.loai2}</span>
                  <span>Tổng PT: {vals.total}</span>
                </div>
              </div>
            );
          })}
          {Object.keys(stats.byKhoa).length === 0 && (
            <div className="text-center py-8 text-slate-400 font-medium">Chưa có dữ liệu thống kê</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================= LIST TAB =================
const ListTab = ({ data, onView, onEdit, onDelete, onAddNew }: { data: PtLoai2[], onView: (item: PtLoai2) => void, onEdit: (item: PtLoai2) => void, onDelete: (id: string) => void, onAddNew: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = data.filter((item) => 
    (item.khoa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nguoi_bao_cao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo khoa hoặc người báo cáo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
          />
        </div>
        <button
          onClick={onAddNew}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={18} /> Thêm báo cáo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#009900] text-white font-bold uppercase text-table">
            <tr>
              <th className="p-4 rounded-tl-xl whitespace-nowrap">Ngày báo cáo</th>
              <th className="p-4 whitespace-nowrap">Khoa</th>
              <th className="p-4 text-center">Tổng PT</th>
              <th className="p-4 text-center">≥ Loại II</th>
              <th className="p-4 text-center">Tỷ lệ %</th>
              <th className="p-4 w-28 text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={32} className="opacity-20" />
                    Không có báo cáo nào
                  </div>
                </td>
              </tr>
            ) : filtered.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold whitespace-nowrap">
                    <Calendar size={14} className="text-slate-400" />
                    {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '---'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-normal uppercase tracking-widest leading-none">{item.nguoi_bao_cao}</div>
                </td>
                <td className="p-4 font-bold text-slate-800">{item.khoa || '---'}</td>
                <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">{item.tong_so_pt || 0}</td>
                <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/30">{item.tong_pt_loai_2_tro_len || 0}</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-table border border-indigo-100">
                    {item.ty_le !== null ? `${item.ty_le}%` : '0%'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(item)} className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Xem">
                      <Eye size={14} /> Xem
                    </button>
                    <button onClick={() => onEdit(item)} className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-black uppercase text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Sửa">
                      <Edit2 size={14} /> Sửa
                    </button>
                    <button onClick={() => onDelete(item.id)} className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-black uppercase text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Xóa">
                      <Trash2 size={14} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ================= FORM MODAL =================
const PtLoai2FormModal = ({ item, isReadOnly, onClose, onSaved, currentUser, departmentList = [] }: any) => {
  const [formData, setFormData] = useState({
    ngay_bao_cao: item?.ngay_bao_cao || new Date().toISOString().split('T')[0],
    nguoi_bao_cao: item?.nguoi_bao_cao || currentUser?.full_name || '',
    khoa: item?.khoa || '',
    tong_so_pt: item?.tong_so_pt || '',
    pt_loai_db: item?.pt_loai_db || '',
    pt_loai_1: item?.pt_loai_1 || '',
    pt_loai_2: item?.pt_loai_2 || '',
    ghi_chu: item?.ghi_chu || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  // Auto-calculation
  const tongLoai2TroLen = useMemo(() => {
    const db = Number(formData.pt_loai_db) || 0;
    const l1 = Number(formData.pt_loai_1) || 0;
    const l2 = Number(formData.pt_loai_2) || 0;
    return db + l1 + l2;
  }, [formData.pt_loai_db, formData.pt_loai_1, formData.pt_loai_2]);

  const tyLe = useMemo(() => {
    const tong = Number(formData.tong_so_pt) || 0;
    if (tong > 0) {
      // Clamp the ratio to 100% max if data is weird
      const ratio = tongLoai2TroLen > tong ? 100 : (tongLoai2TroLen / tong) * 100;
      return ratio.toFixed(2);
    }
    return '0.00';
  }, [formData.tong_so_pt, tongLoai2TroLen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    try {
      const payload = {
        ...formData,
        tong_so_pt: formData.tong_so_pt === '' ? 0 : Number(formData.tong_so_pt),
        pt_loai_db: formData.pt_loai_db === '' ? 0 : Number(formData.pt_loai_db),
        pt_loai_1: formData.pt_loai_1 === '' ? 0 : Number(formData.pt_loai_1),
        pt_loai_2: formData.pt_loai_2 === '' ? 0 : Number(formData.pt_loai_2),
      };

      if (item?.id) {
        await updatePtLoai2(item.id, payload);
      } else {
        await addPtLoai2(payload);
      }
      onSaved();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-main-title font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Scissors className="text-indigo-600" />
            {isReadOnly ? 'Chi tiết báo cáo' : item ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {err && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{err}</div>}
          
          <form id="pt-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Ngày báo cáo</label>
                <input type="date" value={formData.ngay_bao_cao} onChange={e => setFormData({...formData, ngay_bao_cao: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Người báo cáo</label>
                <input type="text" value={formData.nguoi_bao_cao} onChange={e => setFormData({...formData, nguoi_bao_cao: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed" placeholder="Họ tên người báo cáo..." required />
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-5">
              <label className="text-xs font-bold text-slate-600 uppercase">Khoa thực hiện</label>
              <input 
                type="text" 
                list="khoa-suggestions"
                value={formData.khoa} 
                onChange={e => setFormData({...formData, khoa: e.target.value})} 
                disabled={isReadOnly} 
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed" 
                placeholder="VD: Khoa Ngoại thần kinh, Khoa Mắt..." 
                required 
              />
              <datalist id="khoa-suggestions">
                {departmentList.map((k: string) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-700 uppercase">Tổng số PT</label>
              <input type="number" min="0" value={formData.tong_so_pt} onChange={e => setFormData({...formData, tong_so_pt: e.target.value})} disabled={isReadOnly} className="w-full border border-blue-200 rounded-xl px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-blue-700 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="0" required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-700 uppercase">PT Loại Đặc Biệt</label>
                <input type="number" min="0" value={formData.pt_loai_db} onChange={e => setFormData({...formData, pt_loai_db: e.target.value})} disabled={isReadOnly} className="w-full border border-emerald-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-emerald-700 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-700 uppercase">PT Loại I</label>
                <input type="number" min="0" value={formData.pt_loai_1} onChange={e => setFormData({...formData, pt_loai_1: e.target.value})} disabled={isReadOnly} className="w-full border border-emerald-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-emerald-700 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-700 uppercase">PT Loại II</label>
                <input type="number" min="0" value={formData.pt_loai_2} onChange={e => setFormData({...formData, pt_loai_2: e.target.value})} disabled={isReadOnly} className="w-full border border-emerald-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-emerald-700 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="0" required />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Activity size={12} /> Tổng PT Loại II trở lên
                </label>
                <div className="w-full border border-indigo-200 rounded-xl px-4 py-2.5 bg-indigo-100/50 font-black text-indigo-800 text-lg flex items-center shadow-inner">
                  {tongLoai2TroLen}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Target size={12} /> Tỷ lệ %
                </label>
                <div className="w-full border border-indigo-200 rounded-xl px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 font-black text-white text-lg flex items-center shadow-md">
                  {tyLe}%
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Ghi chú</label>
              <textarea rows={2} value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed" placeholder="Ghi chú thêm..." />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            {isReadOnly ? 'Đóng' : 'Hủy'}
          </button>
          {!isReadOnly && (
             <button type="submit" form="pt-form" disabled={saving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">
               {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
             </button>
          )}
        </div>
      </div>
    </div>
  );
};
