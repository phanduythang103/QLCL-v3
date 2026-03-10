import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, AlertTriangle, XCircle,
  Plus, Search, Edit2, Trash2, Calendar, FileDown, Eye, Filter,
  TrendingDown, TrendingUp, Minus, Activity, Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KtcmTheoTuyen } from '../types';
import { fetchKtcmTheoTuyen, addKtcmTheoTuyen, updateKtcmTheoTuyen, deleteKtcmTheoTuyen } from '../readKtcm';

type TabType = 'OVERVIEW' | 'LIST';
type DateFilterType = 'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'LAST_QUARTER' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM';

export const KtcmModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [data, setData] = useState<KtcmTheoTuyen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KtcmTheoTuyen | null>(null);
  
  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchKtcmTheoTuyen();
      setData(res);
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

  // Format Helpers
  const formatPercent = (val: number | null) => val !== null && val !== undefined ? `${val}%` : '---';
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      {/* Module Header & Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Kỹ thuật chuyên môn theo tuyến</h1>
              <p className="text-sm text-slate-500 font-medium">Quản lý và theo dõi chỉ đạo tuyến</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'OVERVIEW' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Target size={18} /> Tổng quan
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
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
            {activeTab === 'OVERVIEW' && <OverviewTab data={data} />}
            {activeTab === 'LIST' && (
              <ListTab 
                data={data} 
                onView={(item: KtcmTheoTuyen) => { setEditingItem(item); setIsFormOpen(true); }}
                onEdit={(item: KtcmTheoTuyen) => { setEditingItem(item); setIsFormOpen(true); }}
                onDelete={async (id: string) => {
                  if(window.confirm('Bạn có chắc muốn xóa báo cáo này?')) {
                    await deleteKtcmTheoTuyen(id);
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
        <KtcmFormModal 
          item={editingItem} 
          isReadOnly={editingItem !== null && isFormOpen === true && (document.activeElement?.textContent?.includes('Xem') || (window as any)._isViewing)}
          onClose={() => { setIsFormOpen(false); (window as any)._isViewing = false; }} 
          onSaved={() => { setIsFormOpen(false); loadData(); (window as any)._isViewing = false; }}
          currentUser={user}
        />
      )}
    </div>
  );
};

// ================= OVERVIEW TAB =================
const OverviewTab = ({ data }: { data: KtcmTheoTuyen[] }) => {
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Lọc dữ liệu theo thời gian
  const filteredData = useMemo(() => {
    if (dateFilter === 'ALL') return data;
    
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

    return data.filter(item => {
      if (!item.ngay_bao_cao) return false;
      const d = new Date(item.ngay_bao_cao);
      return d >= start && d <= end;
    });
  }, [data, dateFilter, customStart, customEnd]);

  // Thống kê
  const stats = useMemo(() => {
    let tongKyThuat = 0;
    let daThucHien = 0;
    let chuaThucHien = 0;
    
    filteredData.forEach(item => {
      tongKyThuat += item.tong_so_ky_thuat || 0;
      daThucHien += item.so_ky_thuat_da_thuc_hien || 0;
      chuaThucHien += item.so_ky_thuat_chua_thuc_hien || 0;
    });

    const tyLeChung = tongKyThuat > 0 ? ((daThucHien / tongKyThuat) * 100).toFixed(2) : 0;

    // Nhóm theo chuyên khoa
    const bySpecialty: Record<string, { total: number, done: number }> = {};
    filteredData.forEach(item => {
      const sp = item.chuyen_khoa_linh_vuc || 'Khác';
      if (!bySpecialty[sp]) bySpecialty[sp] = { total: 0, done: 0 };
      bySpecialty[sp].total += item.tong_so_ky_thuat || 0;
      bySpecialty[sp].done += item.so_ky_thuat_da_thuc_hien || 0;
    });

    return { tongKyThuat, daThucHien, chuaThucHien, tyLeChung, bySpecialty };
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
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <span className="text-slate-400 font-medium">-</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          )}
        </div>
        
        <div className="shrink-0 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          Có {filteredData.length} báo cáo
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng kỹ thuật</div>
            <div className="text-2xl font-black text-slate-800">{stats.tongKyThuat}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đã thực hiện</div>
            <div className="text-2xl font-black text-emerald-600">{stats.daThucHien}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Chưa thực hiện</div>
            <div className="text-2xl font-black text-rose-600">{stats.chuaThucHien}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-5 rounded-2xl shadow-lg relative overflow-hidden flex items-center gap-4 text-white">
          <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
            <Target size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-1">Tỷ lệ chung</div>
            <div className="text-2xl font-black text-white">{stats.tyLeChung}%</div>
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Building2 size={18} className="text-indigo-500" />
          Tỷ lệ theo chuyên khoa/Lĩnh vực
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.bySpecialty).map(([name, vals]: [string, any]) => {
            const percent = vals.total > 0 ? (vals.done / vals.total) * 100 : 0;
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
                  <span>Thực hiện: {vals.done}</span>
                  <span>Tổng: {vals.total}</span>
                </div>
              </div>
            );
          })}
          {Object.keys(stats.bySpecialty).length === 0 && (
            <div className="text-center py-8 text-slate-400 font-medium">Chưa có dữ liệu thống kê</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ================= LIST TAB =================
const ListTab = ({ data, onView, onEdit, onDelete, onAddNew }: { data: KtcmTheoTuyen[], onView: (item: KtcmTheoTuyen) => void, onEdit: (item: KtcmTheoTuyen) => void, onDelete: (id: string) => void, onAddNew: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = data.filter((item) => 
    (item.chuyen_khoa_linh_vuc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nguoi_bao_cao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo chuyên khoa hoặc người báo cáo..."
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
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-black">
              <th className="p-4 rounded-tl-xl whitespace-nowrap">Ngày báo cáo</th>
              <th className="p-4 whitespace-nowrap">Chuyên khoa/Lĩnh vực</th>
              <th className="p-4 text-center">Tổng số</th>
              <th className="p-4 text-center">Đã TH</th>
              <th className="p-4 text-center">Chưa TH</th>
              <th className="p-4 text-center">Tỷ lệ %</th>
              <th className="p-4 w-28 text-center rounded-tr-xl">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
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
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">{item.nguoi_bao_cao}</div>
                </td>
                <td className="p-4 font-bold text-slate-800">{item.chuyen_khoa_linh_vuc || '---'}</td>
                <td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">{item.tong_so_ky_thuat || 0}</td>
                <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/30">{item.so_ky_thuat_da_thuc_hien || 0}</td>
                <td className="p-4 text-center font-bold text-rose-600 bg-rose-50/30">{item.so_ky_thuat_chua_thuc_hien || 0}</td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-sm border border-indigo-100">
                    {item.ty_le !== null ? `${item.ty_le}%` : '0%'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { (window as any)._isViewing = true; onView(item); }} className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100" title="Xem">
                      <Eye size={14} /> Xem
                    </button>
                    <button onClick={() => { (window as any)._isViewing = false; onEdit(item); }} className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-black uppercase text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Sửa">
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
const KtcmFormModal = ({ item, isReadOnly, onClose, onSaved, currentUser }: any) => {
  const [formData, setFormData] = useState({
    ngay_bao_cao: item?.ngay_bao_cao || new Date().toISOString().split('T')[0],
    nguoi_bao_cao: item?.nguoi_bao_cao || currentUser?.full_name || '',
    chuyen_khoa_linh_vuc: item?.chuyen_khoa_linh_vuc || '',
    tong_so_ky_thuat: item?.tong_so_ky_thuat || '',
    so_ky_thuat_da_thuc_hien: item?.so_ky_thuat_da_thuc_hien || '',
    so_ky_thuat_chua_thuc_hien: item?.so_ky_thuat_chua_thuc_hien || '',
    nguyen_nhan_chua_trien_khai: item?.nguyen_nhan_chua_trien_khai || '',
    ghi_chu: item?.ghi_chu || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string|null>(null);

  // Auto-calculate chưa thực hiện
  useEffect(() => {
    const tong = Number(formData.tong_so_ky_thuat) || 0;
    const da_thuc_hien = Number(formData.so_ky_thuat_da_thuc_hien) || 0;
    const chua_thuc_hien = Math.max(0, tong - da_thuc_hien);
    setFormData(prev => ({
      ...prev,
      so_ky_thuat_chua_thuc_hien: chua_thuc_hien.toString()
    }));
  }, [formData.tong_so_ky_thuat, formData.so_ky_thuat_da_thuc_hien]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    try {
      const payload = {
        ...formData,
        tong_so_ky_thuat: formData.tong_so_ky_thuat === '' ? 0 : Number(formData.tong_so_ky_thuat),
        so_ky_thuat_da_thuc_hien: formData.so_ky_thuat_da_thuc_hien === '' ? 0 : Number(formData.so_ky_thuat_da_thuc_hien),
        so_ky_thuat_chua_thuc_hien: formData.so_ky_thuat_chua_thuc_hien === '' ? 0 : Number(formData.so_ky_thuat_chua_thuc_hien),
      };

      if (item?.id) {
        await updateKtcmTheoTuyen(item.id, payload);
      } else {
        await addKtcmTheoTuyen(payload);
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
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Activity className="text-indigo-600" />
            {isReadOnly ? 'Chi tiết báo cáo' : item ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {err && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{err}</div>}
          
          <form id="ktcm-form" onSubmit={handleSubmit} className="space-y-5">
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
              <label className="text-xs font-bold text-slate-600 uppercase">Chuyên khoa/Lĩnh vực</label>
              <input type="text" value={formData.chuyen_khoa_linh_vuc} onChange={e => setFormData({...formData, chuyen_khoa_linh_vuc: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed" placeholder="VD: Nội khoa, Ngoại khoa..." required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-700 uppercase">Tổng số kỹ thuật</label>
                <input type="number" min="0" value={formData.tong_so_ky_thuat} onChange={e => setFormData({...formData, tong_so_ky_thuat: e.target.value})} disabled={isReadOnly} className="w-full border border-blue-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-700 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-700 uppercase">Số KT đã thực hiện</label>
                <input type="number" min="0" value={formData.so_ky_thuat_da_thuc_hien} onChange={e => setFormData({...formData, so_ky_thuat_da_thuc_hien: e.target.value})} disabled={isReadOnly} className="w-full border border-emerald-200 rounded-xl px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-emerald-700 disabled:bg-slate-100 disabled:cursor-not-allowed" placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-700 uppercase">Số KT chưa thực hiện</label>
                <input type="number" value={formData.so_ky_thuat_chua_thuc_hien} readOnly className="w-full border border-rose-200 rounded-xl px-4 py-2 bg-rose-50/50 outline-none font-black text-rose-700 cursor-not-allowed" placeholder="0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Nguyên nhân chưa triển khai</label>
              <textarea rows={3} value={formData.nguyen_nhan_chua_trien_khai} onChange={e => setFormData({...formData, nguyen_nhan_chua_trien_khai: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed" placeholder="Điền lý do nếu có số lượng kỹ thuật chưa thực hiện..." />
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
            <button type="submit" form="ktcm-form" disabled={saving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
