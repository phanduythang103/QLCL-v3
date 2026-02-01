import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, AlertTriangle,
  ArrowRight, BrainCircuit, Save, X, Sparkles,
  ChevronDown, ChevronUp, CheckCircle2, AlertOctagon,
  BarChart2, PieChart as PieChartIcon, Calendar, Download, Printer,
  History, Edit2, Trash2, Eye, ArrowLeft, Target, Users, LayoutGrid, User, CheckSquare,
  LayoutDashboard, List, FileCheck, Files, Menu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { fetchBaoCaoScyk, addBaoCaoScyk, updateBaoCaoScyk, deleteBaoCaoScyk, fetchLatestBaoCaoScykByYear } from '../readBaoCaoScyk';
import { useAuth } from '../contexts/AuthContext';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';
import { analyzeWithGemini } from '../geminiClient';
import VerificationMinutes from './VerificationMinutes';

type MenuItem = 'OVERVIEW' | 'LIST' | 'VERIFICATION' | 'REPORTS';
type ViewMode = 'LIST' | 'STATS' | 'FORM' | 'VIEW';

export const Incidents: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<MenuItem>('OVERVIEW');
  const [viewMode, setViewMode] = useState<ViewMode>('STATS'); // Default for Overview
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // Specific filters state passed down to lists
  const [listStatusFilter, setListStatusFilter] = useState<string>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchBaoCaoScyk();
      setIncidents(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bao_cao_scyk:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute statistics (reused)
  const computeStats = () => {
    const byDept: Record<string, { mild: number; moderate: number; severe: number }> = {};
    const byStatus = { 'Mới': 0, 'Đang phân tích': 0, 'Đã kết luận': 0 };

    incidents.forEach(inc => {
      const dept = inc.khoa_phong || inc.don_vi_bao_cao || 'Khác';
      if (!byDept[dept]) byDept[dept] = { mild: 0, moderate: 0, severe: 0 };

      const severity = inc.phan_loai_ban_dau || '';
      if (severity.includes('Nhóm A') || severity.includes('Nhóm B')) {
        byDept[dept].mild++;
      } else if (severity.includes('Nhóm C') || severity.includes('Nhóm D')) {
        byDept[dept].moderate++;
      } else {
        byDept[dept].severe++;
      }

      const status = inc.trang_thai || 'Mới';
      if (byStatus[status as keyof typeof byStatus] !== undefined) {
        byStatus[status as keyof typeof byStatus]++;
      }
    });

    return {
      byDept: Object.entries(byDept).map(([name, vals]) => ({ name, ...vals })),
      byStatus: [
        { name: 'Mới', value: byStatus['Mới'], color: '#3b82f6' },
        { name: 'Đang phân tích', value: byStatus['Đang phân tích'], color: '#f59e0b' },
        { name: 'Đã kết luận', value: byStatus['Đã kết luận'], color: '#10b981' },
      ]
    };
  };

  const handleMenuChange = (menu: MenuItem) => {
    setActiveMenu(menu);
    if (menu === 'OVERVIEW') setViewMode('STATS');
    else setViewMode('LIST');

    // Reset selection
    setEditingItem(null);
    setViewingItem(null);
  };

  const menuItems = [
    { id: 'OVERVIEW', label: 'Tổng quan SCYK', icon: <LayoutDashboard size={20} /> },
    { id: 'LIST', label: 'Danh sách SCYK', icon: <List size={20} /> },
    { id: 'VERIFICATION', label: 'DS Biên bản xác minh', icon: <FileCheck size={20} /> },
    { id: 'REPORTS', label: 'Danh sách báo cáo', icon: <Files size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation - Horizontal Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-4 pb-0">


          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuChange(item.id as MenuItem)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg ${activeMenu === item.id
                  ? 'text-primary-600 bg-primary-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {item.icon}
                {item.label}
                {activeMenu === item.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-50/50">
        <div className="max-w-7xl mx-auto h-full">
          {/* Detail/Form Overlay Mode */}
          {viewMode === 'FORM' && (
            <IncidentForm
              editingItem={editingItem}
              onCancel={() => { setViewMode('LIST'); setEditingItem(null); }}
              onSaved={() => { setViewMode('LIST'); setEditingItem(null); loadData(); }}
            />
          )}

          {viewMode === 'VIEW' && viewingItem && (
            <IncidentDetailView
              item={viewingItem}
              onBack={() => { setViewMode('LIST'); setViewingItem(null); loadData(); }}
              onEdit={() => { setEditingItem(viewingItem); setViewMode('FORM'); }}
              onDelete={async () => {
                if (window.confirm('Bạn có chắc muốn xóa?')) {
                  await deleteBaoCaoScyk(viewingItem.id);
                  setViewMode('LIST');
                  setViewingItem(null);
                  loadData();
                }
              }}
              onStatusUpdate={async (status: string) => {
                try {
                  await updateBaoCaoScyk(viewingItem.id, { trang_thai: status });
                  setViewingItem({ ...viewingItem, trang_thai: status });
                  loadData();
                } catch (err: any) {
                  alert('Có lỗi khi cập nhật trạng thái: ' + err.message);
                }
              }}
            />
          )}

          {/* Regular Views */}
          {(viewMode === 'LIST' || viewMode === 'STATS') && (
            <div className="h-full">
              {loading && <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div> Đang tải dữ liệu...</div>}
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}

              {!loading && !error && (
                <>
                  {/* 1. Overview */}
                  {activeMenu === 'OVERVIEW' && (
                    <IncidentStatistics stats={computeStats()} totalCount={incidents.length} />
                  )}

                  {/* 2. Main List with Quick Filters */}
                  {activeMenu === 'LIST' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <IncidentList
                        data={incidents}
                        onCreate={() => { setEditingItem(null); setViewMode('FORM'); }}
                        onEdit={(item) => { setEditingItem(item); setViewMode('FORM'); }}
                        onDelete={async (id) => {
                          if (window.confirm('Bạn có chắc muốn xóa?')) {
                            await deleteBaoCaoScyk(id);
                            loadData();
                          }
                        }}
                        onView={(item) => { setViewingItem(item); setViewMode('VIEW'); }}
                        showStatusFilter={true} // Enable Quick Filters
                      />
                    </div>
                  )}

                  {/* 3. Verification List (Biên bản xác minh) */}
                  {activeMenu === 'VERIFICATION' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full">
                      <VerificationMinutes />
                    </div>
                  )}

                  {/* 4. Reports List (Filtered by Destination?) */}
                  {activeMenu === 'REPORTS' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <IncidentList
                        data={incidents}
                        onCreate={() => { setEditingItem(null); setViewMode('FORM'); }}
                        onEdit={(item) => { setEditingItem(item); setViewMode('FORM'); }}
                        onDelete={async (id) => { await deleteBaoCaoScyk(id); loadData(); }}
                        onView={(item) => { setViewingItem(item); setViewMode('VIEW'); }}
                        showReportFilter={true} // Enable Report Filters
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Component: Incident List ---
const IncidentList = ({ data, onCreate, onEdit, onDelete, onView, showStatusFilter = false, showReportFilter = false }: {
  data: any[],
  onCreate: () => void,
  onEdit: (item: any) => void,
  onDelete: (id: string) => void,
  onView: (item: any) => void,
  showStatusFilter?: boolean,
  showReportFilter?: boolean
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [activeReportFilter, setActiveReportFilter] = useState('ALL');

  const filteredData = data.filter(inc => {
    // 1. Text Search
    const matchesSearch = (inc.so_bc_ma_scyk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.khoa_phong || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.mo_ta_su_co || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Status Filter
    let matchesStatus = true;
    if (activeStatusFilter !== 'ALL') {
      if (activeStatusFilter === 'CHUA_TIEP_NHAN') matchesStatus = (!inc.trang_thai || inc.trang_thai === 'Chưa tiếp nhận' || inc.trang_thai === 'Mới');
      else if (activeStatusFilter === 'DA_TIEP_NHAN') matchesStatus = (inc.trang_thai === 'Đang xác minh' || inc.trang_thai === 'Đang tiếp nhận');
      else if (activeStatusFilter === 'DA_KET_LUAN') matchesStatus = (inc.trang_thai === 'Đã kết luận');
      else matchesStatus = (inc.trang_thai === activeStatusFilter);
    }

    // 3. Report Filter (Placeholder logic specifically for "Bệnh viện" vs "Cục Quân y")
    let matchesReport = true;
    if (activeReportFilter !== 'ALL' && showReportFilter) {
      // Assuming 'don_vi_bao_cao' or a new field would determine this. 
      // For now, let's simulate:
      // If filter is 'BENH_VIEN', show alllocal reports (or default if no field)
      // If filter is 'CUC_QUAN_Y', show report where hinh_thuc_bao_cao is 'Bắt buộc' (just as an example/heuristic)
      if (activeReportFilter === 'BENH_VIEN') matchesReport = true; // Placeholder
      if (activeReportFilter === 'CUC_QUAN_Y') matchesReport = inc.hinh_thuc_bao_cao === 'Bắt buộc';
    }

    return matchesSearch && matchesStatus && matchesReport;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Mới': return 'Chưa tiếp nhận';
      case 'Chưa tiếp nhận': return 'Chưa tiếp nhận';
      case 'Đang xác minh': return 'Đang xác minh';
      case 'Đang tiếp nhận': return 'Đang xác minh';
      case 'Đang phân tích': return 'Đang phân tích (RCA)';
      case 'Đã kết luận': return 'Đã kết luận';
      default: return 'Chưa tiếp nhận';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mới': return 'text-red-500';
      case 'Chưa tiếp nhận': return 'text-red-500';
      case 'Đang xác minh': return 'text-blue-600';
      case 'Đang tiếp nhận': return 'text-blue-600';
      case 'Đang phân tích': return 'text-amber-600';
      case 'Đã kết luận': return 'text-green-600';
      default: return 'text-slate-500';
    }
  };

  const getStatusWidth = (status: string) => {
    switch (status) {
      case 'Mới': return 'w-1/4';
      case 'Chưa tiếp nhận': return 'w-1/4';
      case 'Đang xác minh': return 'w-1/2';
      case 'Đang tiếp nhận': return 'w-1/2';
      case 'Đang phân tích': return 'w-3/4';
      case 'Đã kết luận': return 'w-full';
      default: return 'w-1/4';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
      {/* Quick Status Filter Bar */}
      {showStatusFilter && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
          <button onClick={() => setActiveStatusFilter('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeStatusFilter === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>Tất cả</button>
          <button onClick={() => setActiveStatusFilter('CHUA_TIEP_NHAN')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeStatusFilter === 'CHUA_TIEP_NHAN' ? 'bg-slate-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>Chưa tiếp nhận</button>
          <button onClick={() => setActiveStatusFilter('DA_TIEP_NHAN')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeStatusFilter === 'DA_TIEP_NHAN' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}>Đã tiếp nhận</button>
          <button onClick={() => setActiveStatusFilter('Đang phân tích')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeStatusFilter === 'Đang phân tích' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}>Đang phân tích</button>
          <button onClick={() => setActiveStatusFilter('DA_KET_LUAN')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeStatusFilter === 'DA_KET_LUAN' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'}`}>Đã kết luận</button>
        </div>
      )}

      {/* Report Filter Bar */}
      {showReportFilter && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
          <button onClick={() => setActiveReportFilter('ALL')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeReportFilter === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>Tất cả báo cáo</button>
          <button onClick={() => setActiveReportFilter('BENH_VIEN')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeReportFilter === 'BENH_VIEN' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Báo cáo Bệnh viện</button>
          <button onClick={() => setActiveReportFilter('CUC_QUAN_Y')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeReportFilter === 'CUC_QUAN_Y' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}>Báo cáo Cục Quân y</button>
        </div>
      )}

      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã SC, khoa phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <button className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
        <button
          onClick={onCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Báo cáo sự cố mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 border-collapse border border-slate-300 table-fixed">
          <thead className="bg-primary-600 text-white font-bold text-[11px] uppercase text-center align-middle h-16">
            <tr>
              <th className="border border-slate-300 px-1 py-1 w-8">TT</th>
              <th className="border border-slate-300 px-1 py-1 w-24">Đối tượng xảy ra SC<br />hoặc có tình huống gây ra SC</th>
              <th className="border border-slate-300 px-1 py-1 w-24">Vị trí xảy ra SC</th>
              <th className="border border-slate-300 px-1 py-1 w-24">Thời gian</th>
              <th className="border border-slate-300 px-1 py-1 w-32">Mô tả ngắn gọn về SCYK</th>
              <th className="border border-slate-300 px-1 py-1 w-20">Mức độ ảnh hưởng của SC</th>
              <th className="border border-slate-300 px-1 py-1 w-24">Xử lý ban đầu thực hiện</th>
              <th className="border border-slate-300 px-1 py-1 w-24">Giải pháp phòng ngừa</th>
              <th className="border border-slate-300 px-1 py-1 w-20">Hình thức báo cáo</th>
              <th className="border border-slate-300 px-1 py-1 w-32">Tiến độ xử lý</th>
              <th className="border border-slate-300 px-1 py-1 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr><td colSpan={11} className="px-6 py-8 text-center text-slate-400">Không tìm thấy sự cố phù hợp</td></tr>
            ) : (
              filteredData.map((inc, index) => (
                <tr key={inc.id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="border border-slate-300 px-2 py-2 text-center">{index + 1}</td>
                  <td className="border border-slate-300 px-2 py-2">{inc.doi_tuong_xay_ra_sc || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2">{inc.noi_xay_ra_sc || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">
                    {inc.ngay_xay_ra_sc ? new Date(inc.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : ''}
                    <div className="text-[10px] text-slate-500">{inc.thoi_gian || ''}</div>
                  </td>
                  <td className="border border-slate-300 px-2 py-2 truncate max-w-[150px]" title={inc.mo_ta_su_co}>{inc.mo_ta_su_co || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{inc.phan_loai_ban_dau || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2 truncate max-w-[150px]" title={inc.dieu_tri_xy_ly_ban_dau_da_thuc_hien}>{inc.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2 truncate max-w-[150px]" title={inc.de_xuat_giai_phap_ban_dau}>{inc.de_xuat_giai_phap_ban_dau || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2 text-center">{inc.hinh_thuc_bao_cao || '-'}</td>
                  <td className="border border-slate-300 px-2 py-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-bold text-center leading-tight ${getStatusColor(inc.trang_thai)}`}>
                        {getStatusLabel(inc.trang_thai)}
                      </span>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className={`h-full rounded-full ${!inc.trang_thai || inc.trang_thai === 'Chưa tiếp nhận' ? 'bg-slate-400' :
                          inc.trang_thai === 'Đang xác minh' ? 'bg-blue-500' :
                            inc.trang_thai === 'Đang phân tích' ? 'bg-amber-500' :
                              'bg-green-500'
                          } ${getStatusWidth(inc.trang_thai)}`}></div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => onView(inc)} className="text-slate-500 hover:text-green-600 p-1 hover:bg-green-50 rounded" title="Xem chi tiết">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onEdit(inc)} className="text-slate-500 hover:text-primary-600 p-1 hover:bg-slate-100 rounded" title="Sửa">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDelete(inc.id)} className="text-slate-500 hover:text-red-600 p-1 hover:bg-red-50 rounded" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
        <span>Hiển thị {filteredData.length} sự cố</span>
        <div className="flex gap-1">
          <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Trước</button>
          <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Sau</button>
        </div>
      </div>
    </div>
  )
}

// --- Component: Incident Statistics ---
const IncidentStatistics = ({ stats, totalCount }: { stats: { byDept: any[], byStatus: any[] }, totalCount: number }) => {
  const [period, setPeriod] = useState('MONTH'); // MONTH, QUARTER, YEAR

  const severeCount = stats.byDept.reduce((sum, d) => sum + d.severe, 0);
  const analyzedCount = stats.byStatus.find(s => s.name === 'Đã kết luận')?.value || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <span className="font-bold text-slate-700 text-sm">Bộ lọc thời gian:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
          >
            <option value="MONTH">Tháng này</option>
            <option value="QUARTER">Quý này</option>
            <option value="YEAR">Năm nay</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Printer size={16} /> In báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
            <Download size={16} /> Xuất Excel TT43
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Tổng số sự cố</p>
          <h3 className="text-3xl font-bold text-slate-800">{totalCount}</h3>
          <span className="text-xs text-slate-400 mt-2">Dữ liệu từ Supabase</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Sự cố nặng (E-I)</p>
          <h3 className="text-3xl font-bold text-red-600">{severeCount}</h3>
          <span className="text-xs text-slate-400 mt-2">Chiếm {totalCount > 0 ? ((severeCount / totalCount) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Đã kết luận</p>
          <h3 className="text-3xl font-bold text-primary-600">{analyzedCount}</h3>
          <span className="text-xs text-slate-400 mt-2">Đạt {totalCount > 0 ? ((analyzedCount / totalCount) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Chưa xử lý</p>
          <h3 className="text-3xl font-bold text-slate-800">{stats.byStatus.find(s => s.name === 'Mới')?.value || 0}</h3>
          <span className="text-xs text-amber-600 font-medium mt-2">Cần xử lý</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Phân bố sự cố theo Khoa/Phòng và Mức độ</h3>
          <div className="h-80">
            {stats.byDept.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byDept}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="mild" name="Nhẹ (Nhóm A-B)" stackId="a" fill="#60a5fa" barSize={40} />
                  <Bar dataKey="moderate" name="Trung bình (C-D)" stackId="a" fill="#f59e0b" barSize={40} />
                  <Bar dataKey="severe" name="Nặng (E-I)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Trạng thái xử lý</h3>
          <div className="h-60 relative">
            {totalCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="block text-2xl font-bold text-slate-800">{totalCount}</span>
              <span className="text-xs text-slate-400">Sự cố</span>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {stats.byStatus.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Report Link */}
      <div className="flex justify-center mt-8">
        <button className="text-primary-600 font-medium hover:underline text-sm flex items-center gap-2">
          Xem báo cáo chi tiết toàn viện <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// --- Component: Incident Detail View with AI RCA ---
interface IncidentDetailViewProps {
  item: any;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: string) => void;
}

const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({ item, onBack, onEdit, onDelete, onStatusUpdate }) => {
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'FISHBONE' | '5WHYS'>('FISHBONE');
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    data: { code: string; requester: string; timestamp: string } | null;
  }>({ isOpen: false, data: null });

  // Handle Accept & Verify with confirmation popup
  const handleAcceptVerify = async () => {
    const now = new Date();
    const timeStr = now.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh'
    });

    try {
      await onStatusUpdate('Đang phân tích');

      setConfirmModal({
        isOpen: true,
        data: {
          code: item.so_bc_ma_scyk || 'Chưa có mã',
          requester: user?.full_name || user?.username || 'Không xác định',
          timestamp: timeStr
        }
      });
    } catch (error) {
      // Error already handled in parent
    }
  };

  // Print/PDF download handler
  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrintView(false), 500);
    }, 100);
  };

  // Template-based offline analysis (no API required)
  const handleAnalyzeOffline = () => {
    onStatusUpdate('Đang phân tích');
    setAnalyzing(true);
    setAnalysisResult(null);

    const desc = item.mo_ta_su_co || 'Chưa có mô tả chi tiết';
    const sub = item.doi_tuong_xay_ra_sc || item.ho_ten_nb || 'người bệnh';
    const loc = item.noi_xay_ra_sc || item.don_vi_bao_cao || 'khoa phòng';
    const unit = item.don_vi_bao_cao || 'đơn vị';
    const description = desc.toLowerCase();

    let template = {
      rootCause: `Chưa xác định được nguyên nhân gốc rễ rõ ràng cho sự cố: "${desc}". Cần yêu cầu ${unit} tổ chức họp hội đồng phân tích chuyên sâu.`,
      fishbone: {
        man: [`Thông tin về ${sub} chưa đầy đủ`, `Nhân viên tại ${loc} cần tường trình thêm`],
        machine: [`Trang thiết bị tại ${loc} cần kiểm tra`, "Chưa có dữ liệu bảo trì"],
        method: ["Quy trình hiện tại có thể chưa bao quát hết tình huống này", `Việc giám sát tại ${unit} cần tăng cường`],
        material: ["Vật tư y tế liên quan cần được rà soát", "Thuốc/Hóa chất cần kiểm tra"],
        environment: [`Điều kiện môi trường tại ${loc} cần khảo sát`, "Yếu tố khách quan khác"]
      },
      fiveWhys: [
        { q: `Tại sao xảy ra sự việc: "${desc}"?`, a: "Sự cố xảy ra ngoài ý muốn và quy trình kiểm soát chưa hiệu quả." },
        { q: "Tại sao quy trình kiểm soát chưa hiệu quả?", a: `Do chưa bao quát hết tình huống thực tế xảy ra với ${sub}.` },
        { q: "Tại sao chưa bao quát hết?", a: "Đánh giá rủi ro định kỳ còn bỏ sót các nguy cơ tiềm ẩn." },
        { q: "Tại sao bỏ sót nguy cơ?", a: "Thiếu dữ liệu báo cáo và phân tích xu hướng từ các sự cố tương tự." },
        { q: "Tại sao thiếu dữ liệu?", a: "Hệ thống báo cáo và chia sẻ bài học kinh nghiệm chưa được chú trọng." }
      ],
      solutions: [
        `Yêu cầu ${unit} rà soát lại toàn bộ quy trình liên quan đến ${sub}.`,
        "Tổ chức bình sự cố để rút kinh nghiệm.",
        "Tăng cường giám sát tuân thủ quy trình."
      ]
    };

    // PATIENT FALL
    if (description.includes('ngã') || description.includes('trượt') || description.includes('té') || description.includes('giường') || description.includes('rơi')) {
      template = {
        rootCause: `Đánh giá nguy cơ ngã chưa chính xác cho ${sub} và thiếu giám sát tại ${loc}.`,
        fishbone: {
          man: [`${sub} không tuân thủ hướng dẫn`, "Người nhà lơ là giám sát", "NVYT chưa đánh giá lại nguy cơ ngã"],
          machine: ["Thanh chắn giường bị hỏng/không nâng", "Xe lăn không khóa bánh", "Chuông gọi y tá hỏng"],
          method: ["Quy trình đánh giá ngã (Morse) chưa thực hiện đúng", `Thiếu bàn giao ${sub} có nguy cơ cao`],
          material: ["Dép người bệnh trơn trượt", "Thiếu biển báo sàn ướt"],
          environment: [`Sàn nhà tại ${loc} ướt/trơn`, "Ánh sáng phòng bệnh tối", "Đồ đạc cản trở lối đi"]
        },
        fiveWhys: [
          { q: `Tại sao xảy ra sự việc: "${desc}"?`, a: `Do ${sub} bị mất thăng bằng/trượt chân và không có sự hỗ trợ kịp thời tại ${loc}.` },
          { q: `Tại sao ${sub} không được hỗ trợ?`, a: `${sub} tự ý di chuyển hoặc người nhà/NVYT không giám sát liên tục.` },
          { q: "Tại sao không giám sát liên tục?", a: `Chưa đánh giá đúng mức độ nguy cơ ngã của ${sub} hoặc thiếu nhân lực trực.` },
          { q: "Tại sao đánh giá nguy cơ chưa đúng?", a: "Quy trình đánh giá ngã (thang điểm Morse) chưa được thực hiện đúng tần suất/phương pháp." },
          { q: "Tại sao quy trình chưa được tuân thủ?", a: "Thiếu giám sát nội bộ, nhân viên chưa được đào tạo lại hoặc áp lực công việc cao." }
        ],
        solutions: [
          `Tăng cường tư vấn giáo dục phòng ngừa ngã cho ${sub} và người nhà ngay khi nhập viện.`,
          "Kiểm tra định kỳ thanh chắn giường, chuông gọi y tá và điều kiện sàn nhà.",
          `Thực hiện nghiêm ngặt đánh giá nguy cơ ngã theo thang điểm Morse cho ${sub}.`
        ]
      };
    }
    // MEDICATION ERROR
    else if (description.includes('thuốc') || description.includes('nhầm') || description.includes('tiêm') || description.includes('uống') || description.includes('liều')) {
      template = {
        rootCause: `Thiếu quy trình kiểm tra đối chiếu 3 bước (3 check) tại thời điểm cấp phát/dùng thuốc cho ${sub} tại ${loc}.`,
        fishbone: {
          man: ["Nhân viên thiếu tập trung", "Giao tiếp y lệnh miệng chưa rõ", "Quên thực hiện 5 đúng"],
          machine: ["Phần mềm kê đơn cảnh báo chưa rõ", "Máy in nhãn thuốc mờ"],
          method: ["Quy trình 3 tra 5 đối chưa tuân thủ", "Thiếu bước kiểm tra chéo (double check)"],
          material: ["Nhãn thuốc giống nhau (LASA)", "Vị trí đặt thuốc lộn xộn", "Bao bì thuốc dễ nhầm"],
          environment: [`Ánh sáng tại ${loc} yếu`, "Tiếng ồn lớn gây mất tập trung", "Giờ cao điểm"]
        },
        fiveWhys: [
          { q: `Tại sao xảy ra sự việc: "${desc}"?`, a: `Do ${sub} dùng sai loại thuốc/liều lượng/đường dùng so với y lệnh.` },
          { q: "Tại sao dùng sai?", a: "Điều dưỡng thực hiện cấp phát/cho uống/tiêm không đúng y lệnh." },
          { q: "Tại sao cấp phát không đúng?", a: "Do nhầm lẫn với thuốc của người bệnh khác hoặc thuốc có tên/bao bì tương tự." },
          { q: "Tại sao lại nhầm lẫn?", a: "Không thực hiện đối chiếu công khai (3 tra 5 đối) tại giường bệnh." },
          { q: "Tại sao không đối chiếu?", a: "Do quá tải công việc, thói quen làm tắt quy trình hoặc thiếu giám sát." }
        ],
        solutions: [
          `Tập huấn lại quy trình an toàn sử dụng thuốc (5 đúng - 3 tra) cho nhân viên tại ${unit}.`,
          "Dán nhãn cảnh báo các thuốc nhìn giống nhau, đọc giống nhau (LASA).",
          "Sắp xếp lại tủ thuốc khoa học, tách riêng các thuốc nguy cơ cao."
        ]
      };
    }
    // SURGICAL ERROR
    else if (description.includes('mổ') || description.includes('phẫu thuật') || description.includes('sót') || description.includes('gạc')) {
      template = {
        rootCause: `Bảng kiểm an toàn phẫu thuật (Surgical Safety Checklist) thực hiện chưa nghiêm túc trong ca phẫu thuật cho ${sub} tại ${loc}.`,
        fishbone: {
          man: ["Kíp mổ giao tiếp kém", "Phẫu thuật viên gây áp lực", "Mệt mỏi/Căng thẳng"],
          machine: ["Dụng cụ phẫu thuật không đồng bộ", "Máy móc hỏng hóc bất ngờ"],
          method: ["Bảng kiểm an toàn PT chỉ làm đối phó", "Quy trình đếm gạc chưa chuẩn"],
          material: ["Gạc/Dụng cụ không chuẩn hóa", "Thiếu chỉ thị màu an toàn"],
          environment: [`Phòng mổ tại ${loc} ồn ào`, "Nhiệt độ/Độ ẩm không phù hợp", "Sắp xếp lịch mổ quá dày"]
        },
        fiveWhys: [
          { q: `Tại sao xảy ra sự việc: "${desc}"?`, a: `Xảy ra sai sót trong quá trình phẫu thuật/thủ thuật cho ${sub}.` },
          { q: "Tại sao lại sai sót?", a: "Kết quả đếm gạc/dụng cụ trước và sau đóng cơ không khớp nhưng không phát hiện." },
          { q: "Tại sao không phát hiện?", a: "Việc đếm thực hiện vội vàng, thiếu người xác nhận (double check)." },
          { q: "Tại sao vội vàng?", a: "Áp lực thời gian ca mổ kế tiếp hoặc tình trạng bệnh nhân diễn biến." },
          { q: "Tại sao quy trình kiểm soát lỏng lẻo?", a: "Thiếu văn hóa an toàn, ngại nhắc nhở phẫu thuật viên chính." }
        ],
        solutions: [
          `Tuyệt đối tuân thủ Bảng kiểm an toàn phẫu thuật (Time-out) tại ${unit}.`,
          "Quy định rõ vai trò đếm gạc và xác nhận to tiếng.",
          "Xây dựng văn hóa Speak-up trong phòng mổ."
        ]
      };
    }

    setTimeout(() => {
      setAnalysisResult(template);
      setAnalyzing(false);
    }, 1000);
  };

  const handleAnalyze = async () => {
    onStatusUpdate('Đang phân tích');
    setAnalyzing(true);
    setAnalysisResult(null);

    // Extract context from incident data
    const desc = item.mo_ta_su_co || 'Chưa có mô tả chi tiết';
    const sub = item.doi_tuong_xay_ra_sc || item.ho_ten_nb || 'người bệnh';
    const loc = item.noi_xay_ra_sc || item.don_vi_bao_cao || 'khoa phòng';
    const viTri = item.vi_tri_cu_the || '';
    const unit = item.don_vi_bao_cao || 'đơn vị';
    const phanLoai = item.phan_loai_ban_dau || 'Chưa phân loại';

    // Build the RCA prompt
    const prompt = `Bạn đóng vai Hội đồng Quản lý chất lượng bệnh viện.
Hãy phân tích sự cố y khoa sau theo phương pháp Root Cause Analysis (RCA).

YÊU CẦU BẮT BUỘC:
- Không quy trách nhiệm cá nhân
- Không suy đoán nếu dữ liệu chưa có
- Phân tích theo góc độ hệ thống
- Sử dụng ngôn ngữ chuyên môn y khoa

THÔNG TIN SỰ CỐ:
- Mô tả chi tiết: ${desc}
- Đối tượng: ${sub}
- Vị trí: ${loc}${viTri ? ` (${viTri})` : ''}
- Đơn vị báo cáo: ${unit}
- Phân loại ban đầu: ${phanLoai}

TRẢ VỀ DƯỚI DẠNG JSON HỢP LỆ (không có markdown code block, chỉ JSON thuần) với cấu trúc CHÍNH XÁC sau:
{
  "summary": "Tóm tắt ngắn gọn sự cố",
  "timeline": "Chuỗi sự kiện theo thời gian",
  "safetyIssues": "Các vấn đề an toàn người bệnh được xác định",
  "rootCause": "Nguyên nhân gốc cốt lõi (1-2 câu)",
  "fishbone": {
    "man": ["Yếu tố con người 1", "Yếu tố con người 2"],
    "machine": ["Yếu tố thiết bị 1", "Yếu tố thiết bị 2"],
    "method": ["Yếu tố quy trình 1", "Yếu tố quy trình 2"],
    "material": ["Yếu tố vật tư 1", "Yếu tố vật tư 2"],
    "environment": ["Yếu tố môi trường 1", "Yếu tố môi trường 2"]
  },
  "fiveWhys": [
    { "q": "Tại sao xảy ra sự việc [tóm tắt]?", "a": "Câu trả lời cụ thể" },
    { "q": "Tại sao [nguyên nhân 1]?", "a": "Câu trả lời cụ thể" },
    { "q": "Tại sao [nguyên nhân 2]?", "a": "Câu trả lời cụ thể" },
    { "q": "Tại sao [nguyên nhân 3]?", "a": "Câu trả lời cụ thể" },
    { "q": "Tại sao [nguyên nhân 4]?", "a": "Câu trả lời cụ thể" }
  ],
  "solutions": ["Biện pháp khắc phục 1 (SMART)", "Biện pháp phòng ngừa 2 (SMART)", "Biện pháp hệ thống 3"]
}`;

    try {
      const response = await analyzeWithGemini(prompt);

      // Try to parse JSON from response
      let parsed;
      try {
        // Remove markdown code blocks if present
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.slice(7);
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.slice(3);
        }
        if (cleanResponse.endsWith('```')) {
          cleanResponse = cleanResponse.slice(0, -3);
        }
        parsed = JSON.parse(cleanResponse.trim());
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
        // Use the raw response as rootCause if parsing fails
        parsed = {
          rootCause: response,
          fishbone: {
            man: ["Xem chi tiết phân tích ở trên"],
            machine: ["Xem chi tiết phân tích ở trên"],
            method: ["Xem chi tiết phân tích ở trên"],
            material: ["Xem chi tiết phân tích ở trên"],
            environment: ["Xem chi tiết phân tích ở trên"]
          },
          fiveWhys: [
            { q: `Tại sao xảy ra: "${desc}"?`, a: "Xem phân tích chi tiết ở nguyên nhân gốc." }
          ],
          solutions: ["Xem chi tiết phân tích ở trên"]
        };
      }

      setAnalysisResult(parsed);
    } catch (error) {
      console.error('Gemini API Error:', error);
      // Fallback to basic template
      setAnalysisResult({
        rootCause: `Không thể kết nối API Gemini. Lỗi: ${error instanceof Error ? error.message : 'Unknown'}. Vui lòng thử lại sau.`,
        fishbone: {
          man: [`Thông tin về ${sub} chưa đầy đủ`],
          machine: [`Trang thiết bị tại ${loc} cần kiểm tra`],
          method: ["Quy trình hiện tại cần rà soát"],
          material: ["Vật tư y tế liên quan cần được kiểm tra"],
          environment: [`Điều kiện môi trường tại ${loc} cần khảo sát`]
        },
        fiveWhys: [
          { q: `Tại sao xảy ra sự việc: "${desc}"?`, a: "API lỗi - không thể phân tích tự động." }
        ],
        solutions: [`Vui lòng thử lại hoặc liên hệ quản trị viên.`]
      });
    } finally {
      setAnalyzing(false);
    }
  };
  // Checkbox helper for print view
  const Chk = ({ c }: { c: boolean }) => <span>{c ? '☑' : '☐'}</span>;

  return (
    <>
      {/* Printable Report View */}
      {showPrintView && (
        <div className="print-only fixed inset-0 bg-white z-[9999] p-8 overflow-auto" id="printable-report">
          <style>{`
            @page {
              size: A4;
              margin: 1.5cm 1.6cm 1cm 2cm;
            }
            @media print {
              body * { visibility: hidden; }
              #printable-report, #printable-report * { visibility: visible !important; }
              #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
              .no-print { display: none !important; }
              html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            @media screen { .print-only { display: none; } }
          `}</style>
          <div className="max-w-[210mm] mx-auto bg-white text-black text-sm" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-4 border-b-2 border-blue-600 pb-3">
              <img src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" alt="Logo" className="w-16 h-16 object-contain" />
              <div className="text-center flex-1">
                <h1 className="text-lg font-bold text-blue-800">BỆNH VIỆN QUÂN Y 103</h1>
                <p className="text-sm text-blue-600">HỆ THỐNG QUẢN LÝ SỰ CỐ Y KHOA</p>
              </div>
            </div>
            <h2 className="text-center text-xl font-bold text-blue-800 mb-4">BÁO CÁO SỰ CỐ Y KHOA</h2>

            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-2 bg-blue-50 font-bold w-1/2">HÌNH THỨC BÁO CÁO SỰ CỐ Y KHOA:</td>
                  <td className="border border-slate-400 p-2 w-1/2">
                    <Chk c={item.hinh_thuc_bao_cao === 'Tự nguyện'} /> Tự nguyện &emsp;
                    <Chk c={item.hinh_thuc_bao_cao === 'Bắt buộc'} /> Bắt buộc
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2"><strong>Số báo cáo/Mã số sự cố:</strong> {item.so_bc_ma_scyk}</td>
                  <td className="border border-slate-400 p-2"><strong>Ngày báo cáo:</strong> {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : ''}</td>
                </tr>
                <tr><td className="border border-slate-400 p-2" colSpan={2}><strong>Đơn vị báo cáo:</strong> {item.don_vi_bao_cao}</td></tr>
                <tr>
                  <td className="border border-slate-400 p-2 bg-blue-50 font-bold">Thông tin người bệnh</td>
                  <td className="border border-slate-400 p-2 bg-blue-50 font-bold">Đối tượng xảy ra sự cố</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    <p><strong>Họ và tên:</strong> {item.ho_ten_nb}</p>
                    <p><strong>Số bệnh án:</strong> {item.so_benh_an}</p>
                    <p><strong>Ngày sinh:</strong> {item.ngay_sinh ? new Date(item.ngay_sinh).toLocaleDateString('vi-VN') : ''}</p>
                    <p><strong>Giới tính:</strong> {item.gioi} &emsp; <strong>Khoa/phòng:</strong> {item.khoa_phong}</p>
                  </td>
                  <td className="border border-slate-400 p-2">
                    <Chk c={item.doi_tuong_xay_ra_sc === 'Người bệnh'} /> Người bệnh<br />
                    <Chk c={item.doi_tuong_xay_ra_sc === 'Người nhà'} /> Người nhà/khách đến thăm<br />
                    <Chk c={item.doi_tuong_xay_ra_sc === 'NV y tế'} /> Nhân viên y tế<br />
                    <Chk c={item.doi_tuong_xay_ra_sc === 'Trang thiết bị'} /> Trang thiết bị/cơ sở hạ tầng
                  </td>
                </tr>
                <tr><td className="border border-slate-400 p-2 bg-blue-50 font-bold" colSpan={2}>Nơi xảy ra sự cố</td></tr>
                <tr>
                  <td className="border border-slate-400 p-2"><strong>Khoa/phòng/vị trí:</strong> {item.noi_xay_ra_sc}</td>
                  <td className="border border-slate-400 p-2"><strong>Vị trí cụ thể:</strong> {item.vi_tri_cu_the}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2"><strong>Ngày xảy ra sự cố:</strong> {item.ngay_xay_ra_sc ? new Date(item.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : ''}</td>
                  <td className="border border-slate-400 p-2"><strong>Thời gian:</strong> {item.thoi_gian}</td>
                </tr>
                <tr><td className="border border-slate-400 p-2 bg-blue-50 font-bold" colSpan={2}>Mô tả ngắn gọn về sự cố:</td></tr>
                <tr><td className="border border-slate-400 p-2" colSpan={2} style={{ minHeight: '60px' }}>{item.mo_ta_su_co}</td></tr>
                <tr><td className="border border-slate-400 p-2 bg-blue-50 font-bold" colSpan={2}>Đề xuất giải pháp ban đầu:</td></tr>
                <tr><td className="border border-slate-400 p-2" colSpan={2}>{item.de_xuat_giai_phap_ban_dau}</td></tr>
                <tr><td className="border border-slate-400 p-2 bg-blue-50 font-bold" colSpan={2}>Điều trị/xử lý ban đầu đã được thực hiện:</td></tr>
                <tr><td className="border border-slate-400 p-2" colSpan={2}>{item.dieu_tri_xy_ly_ban_dau_da_thuc_hien}</td></tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    <strong>Thông báo cho BS điều trị/người có trách nhiệm:</strong><br />
                    <Chk c={item.thong_bao_bs_npt === 'Có'} /> Có &emsp; <Chk c={item.thong_bao_bs_npt === 'Không'} /> Không &emsp; <Chk c={!item.thong_bao_bs_npt || item.thong_bao_bs_npt === 'KGN'} /> Không ghi nhận
                  </td>
                  <td className="border border-slate-400 p-2">
                    <strong>Ghi nhận vào hồ sơ bệnh án/giấy tờ liên quan:</strong><br />
                    <Chk c={item.ghi_nhan_vao_hsba === 'Có'} /> Có &emsp; <Chk c={item.ghi_nhan_vao_hsba === 'Không'} /> Không &emsp; <Chk c={!item.ghi_nhan_vao_hsba || item.ghi_nhan_vao_hsba === 'KGN'} /> Không ghi nhận
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2">
                    <strong>Thông báo cho người nhà/người bảo hộ:</strong><br />
                    <Chk c={item.thong_bao_nn === 'Có'} /> Có &emsp; <Chk c={item.thong_bao_nn === 'Không'} /> Không &emsp; <Chk c={!item.thong_bao_nn || item.thong_bao_nn === 'KGN'} /> Không ghi nhận
                  </td>
                  <td className="border border-slate-400 p-2">
                    <strong>Thông báo cho người bệnh:</strong><br />
                    <Chk c={item.thong_bao_nb === 'Có'} /> Có &emsp; <Chk c={item.thong_bao_nb === 'Không'} /> Không &emsp; <Chk c={!item.thong_bao_nb || item.thong_bao_nb === 'KGN'} /> Không ghi nhận
                  </td>
                </tr>
                <tr><td className="border border-slate-400 p-2 bg-blue-50 font-bold" colSpan={2}>Phân loại ban đầu về sự cố</td></tr>
                <tr>
                  <td className="border border-slate-400 p-2" colSpan={2}>
                    <Chk c={item.phan_loai_sc === 'Chưa xảy ra'} /> Chưa xảy ra &emsp; <Chk c={item.phan_loai_sc === 'Đã xảy ra'} /> Đã xảy ra<br />
                    <strong>Đánh giá ban đầu về mức độ ảnh hưởng của sự cố:</strong><br />
                    <Chk c={item.phan_loai_ban_dau === 'Nặng'} /> Nặng &emsp; <Chk c={item.phan_loai_ban_dau === 'Trung bình'} /> Trung bình &emsp; <Chk c={item.phan_loai_ban_dau === 'Nhẹ'} /> Nhẹ
                  </td>
                </tr>
                <tr><td className="border border-slate-400 p-2 bg-blue-50 font-bold" colSpan={2}>Thông tin người báo cáo</td></tr>
                <tr>
                  <td className="border border-slate-400 p-2"><strong>Họ tên:</strong> {item.ho_ten_nguoi_bc}</td>
                  <td className="border border-slate-400 p-2"><strong>Số điện thoại:</strong> {item.sdt} &emsp; <strong>Email:</strong> {item.email}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2" colSpan={2}>
                    <Chk c={item.vaitro_nguoi_bc === 'Điều dưỡng'} /> Điều dưỡng &emsp;
                    <Chk c={item.vaitro_nguoi_bc === 'Bác sĩ'} /> Bác sĩ &emsp;
                    <Chk c={item.vaitro_nguoi_bc && item.vaitro_nguoi_bc.includes('NB')} /> Người bệnh &emsp;
                    <Chk c={item.vaitro_nguoi_bc && item.vaitro_nguoi_bc.includes('NN')} /> Người nhà/khách đến thăm &emsp;
                    <Chk c={item.vaitro_nguoi_bc === 'Khác'} /> Khác
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2"><strong>Người chứng kiến 1:</strong> {item.chung_kien1}</td>
                  <td className="border border-slate-400 p-2"><strong>Người chứng kiến 2:</strong> {item.chung_kien2}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          data={confirmModal.data}
        />
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium">
            <ArrowLeft size={20} className="mr-2" /> Quay lại danh sách
          </button>
          <div className="flex flex-wrap gap-2">
            {/* Workflow Actions */}
            <button
              onClick={handleAcceptVerify}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <CheckSquare size={16} /> Tiếp nhận & Xác minh
            </button>
            <button
              onClick={() => document.getElementById('ai-rca-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <BrainCircuit size={16} /> Phân tích sự cố
            </button>
            {/* Document Actions */}
            <button onClick={handlePrint} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2">
              <Download size={16} /> Tải PDF
            </button>
            <button onClick={onEdit} className="bg-primary-50 text-primary-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center gap-2">
              <Edit2 size={16} /> Chỉnh sửa
            </button>
            <button onClick={onDelete} className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2">
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        </div>

        {/* Main Content Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{item.so_bc_ma_scyk || 'Chưa có mã'}</h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Calendar size={14} /> Ngày báo cáo: {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '---'}
                <span className="mx-2">•</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.trang_thai === 'Mới' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {item.trang_thai === 'Mới' ? 'Chưa tiếp nhận' : (item.trang_thai || 'Chưa tiếp nhận')}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mức độ</span>
              <span className="text-sm font-bold text-slate-800">{item.phan_loai_ban_dau || 'Chưa phân loại'}</span>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Thông tin sự cố</h3>
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <p className="text-sm"><span className="font-semibold text-slate-700">Khoa phòng:</span> {item.don_vi_bao_cao}</p>
                  <p className="text-sm"><span className="font-semibold text-slate-700">Vị trí:</span> {item.noi_xay_ra_sc} - {item.vi_tri_cu_the}</p>
                  <p className="text-sm"><span className="font-semibold text-slate-700">Thời gian xảy ra:</span> {item.ngay_xay_ra_sc ? new Date(item.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : ''} {item.thoi_gian}</p>
                  <p className="text-sm"><span className="font-semibold text-slate-700">Đối tượng:</span> {item.doi_tuong_xay_ra_sc}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Mô tả chi tiết</h3>
                <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl text-slate-700 leading-relaxed text-sm">
                  {item.mo_ta_su_co || 'Không có mô tả chi tiết.'}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Thông tin người bệnh</h3>
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.ho_ten_nb}</p>
                      <p className="text-xs text-slate-500">HSBA: {item.so_benh_an}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <p className="text-sm"><span className="text-slate-500 text-xs block">Ngày sinh</span> {item.ngay_sinh ? new Date(item.ngay_sinh).toLocaleDateString('vi-VN') : '---'}</p>
                    <p className="text-sm"><span className="text-slate-500 text-xs block">Giới tính</span> {item.gioi}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Xử trí ban đầu</h3>
                <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl space-y-3">
                  <p className="text-sm"><span className="font-semibold text-green-800">Giải pháp khắc phục:</span> <br /> {item.de_xuat_giai_phap_ban_dau || '---'}</p>
                  <p className="text-sm"><span className="font-semibold text-green-800">Điều trị bổ sung:</span> <br /> {item.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '---'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI RCA Analysis Section */}
        <div id="ai-rca-section" className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-xl overflow-hidden text-white mb-10">
          <div className="p-6 border-b border-indigo-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-400/30">
                <BrainCircuit size={24} className="text-indigo-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Phân tích Nguyên nhân Gốc rễ (AI RCA)</h2>
                <p className="text-indigo-300 text-sm">Sử dụng trí tuệ nhân tạo để phân tích biểu đồ xương cá & 5 Whys</p>
              </div>
            </div>

            {!analysisResult && !analyzing && (
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 flex items-center gap-2 transition-all transform hover:scale-105"
                >
                  <Sparkles size={18} /> Phân tích AI
                </button>
                <button
                  onClick={handleAnalyzeOffline}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold shadow-lg shadow-slate-900/50 flex items-center gap-2 transition-all transform hover:scale-105"
                  title="Phân tích nhanh bằng template, không cần kết nối API"
                >
                  <BrainCircuit size={18} /> Phân tích Offline
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {analyzing && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-white rounded-full animate-spin mb-4"></div>
              <p className="text-indigo-200 font-medium animate-pulse">Đang phân tích dữ liệu sự cố...</p>
              <p className="text-indigo-400 text-sm mt-2">Đang xây dựng biểu đồ xương cá & chuỗi 5 câu hỏi...</p>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="p-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Tabs */}
              <div className="flex bg-indigo-950/50 border-b border-indigo-800/50">
                <button
                  onClick={() => setActiveAnalysisTab('FISHBONE')}
                  className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider transition-colors ${activeAnalysisTab === 'FISHBONE' ? 'bg-indigo-800/50 text-white border-b-2 border-indigo-400' : 'text-indigo-400 hover:text-white hover:bg-indigo-800/30'}`}
                >
                  Biểu đồ Xương cá (Ishikawa)
                </button>
                <button
                  onClick={() => setActiveAnalysisTab('5WHYS')}
                  className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-wider transition-colors ${activeAnalysisTab === '5WHYS' ? 'bg-indigo-800/50 text-white border-b-2 border-indigo-400' : 'text-indigo-400 hover:text-white hover:bg-indigo-800/30'}`}
                >
                  Phân tích 5 Whys
                </button>
              </div>

              <div className="p-6 md:p-8">
                {activeAnalysisTab === 'FISHBONE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FishboneCard title="Con người (Man)" items={analysisResult.fishbone.man} icon={<Users size={18} />} color="text-blue-300" bg="bg-blue-900/20" border="border-blue-700/30" />
                    <FishboneCard title="Quy trình (Method)" items={analysisResult.fishbone.method} icon={<FileText size={18} />} color="text-green-300" bg="bg-green-900/20" border="border-green-700/30" />
                    <FishboneCard title="Thiết bị (Machine)" items={analysisResult.fishbone.machine} icon={<Printer size={18} />} color="text-amber-300" bg="bg-amber-900/20" border="border-amber-700/30" />
                    <FishboneCard title="Vật liệu (Material)" items={analysisResult.fishbone.material} icon={<Filter size={18} />} color="text-purple-300" bg="bg-purple-900/20" border="border-purple-700/30" />
                    <FishboneCard title="Môi trường (Environment)" items={analysisResult.fishbone.environment} icon={<LayoutGrid size={18} />} color="text-pink-300" bg="bg-pink-900/20" border="border-pink-700/30" />
                  </div>
                )}

                {activeAnalysisTab === '5WHYS' && (
                  <div className="max-w-3xl mx-auto space-y-0 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-indigo-700/50 z-0"></div>

                    {analysisResult.fiveWhys.map((step: any, idx: number) => (
                      <div key={idx} className="relative z-10 flex gap-6 pb-6 last:pb-0">
                        <div className="w-12 h-12 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-indigo-900/50">
                          {idx + 1}
                        </div>
                        <div className="flex-1 bg-indigo-800/30 border border-indigo-700/30 rounded-xl p-4 hover:bg-indigo-800/50 transition-colors">
                          <p className="text-indigo-300 text-xs uppercase font-bold tracking-widest mb-1">Q: {step.q}</p>
                          <p className="text-white font-medium">A: {step.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conclusion */}
                <div className="mt-8 pt-6 border-t border-indigo-700/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Target size={20} className="text-red-400" /> Kết luận & Đề xuất
                    </h3>
                    {item.trang_thai !== 'Đã kết luận' && (
                      <button
                        onClick={() => onStatusUpdate('Đã kết luận')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:scale-105"
                      >
                        <CheckCircle2 size={18} /> Xác nhận hoàn thành & Kết luận
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-red-900/20 border border-red-700/30 p-5 rounded-xl">
                      <h4 className="text-red-300 font-bold text-sm uppercase mb-2">Nguyên nhân gốc rễ (Root Cause)</h4>
                      <p className="text-white">{analysisResult.rootCause}</p>
                    </div>
                    <div className="bg-green-900/20 border border-green-700/30 p-5 rounded-xl">
                      <h4 className="text-green-300 font-bold text-sm uppercase mb-2">Giải pháp đề xuất</h4>
                      <ul className="list-disc list-inside space-y-1 text-white text-sm">
                        {analysisResult.solutions.map((sol: string, i: number) => (
                          <li key={i}>{sol}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const FishboneCard = ({ title, items, icon, color, bg, border }: any) => (
  <div className={`${bg} border ${border} p-4 rounded-xl`}>
    <h4 className={`${color} font-bold text-sm uppercase mb-3 flex items-center gap-2`}>
      {icon} {title}
    </h4>
    <ul className="space-y-2">
      {items.map((item: string, idx: number) => (
        <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${color.replace('text', 'bg')}`}></span>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

// --- Component: Incident Form (Keep existing logic but wrap in same file) ---
interface IncidentFormProps {
  onCancel: () => void;
  onSaved: () => void;
  editingItem?: any;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onCancel, onSaved, editingItem }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [dmDonVi, setDmDonVi] = useState<any[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(['general']);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const [formData, setFormData] = useState({
    hinh_thuc_bao_cao: editingItem?.hinh_thuc_bao_cao || 'Tự nguyện',
    so_bc_ma_scyk: editingItem?.so_bc_ma_scyk || '',
    ngay_bao_cao: editingItem?.ngay_bao_cao || new Date().toISOString().split('T')[0],
    don_vi_bao_cao: editingItem?.don_vi_bao_cao || '',
    ho_ten_nb: editingItem?.ho_ten_nb || '',
    so_benh_an: editingItem?.so_benh_an || '',
    ngay_sinh: editingItem?.ngay_sinh || '',
    gioi: editingItem?.gioi || 'Nam',
    khoa_phong: editingItem?.khoa_phong || '',
    doi_tuong_xay_ra_sc: editingItem?.doi_tuong_xay_ra_sc || 'Người bệnh',
    noi_xay_ra_sc: editingItem?.noi_xay_ra_sc || '',
    vi_tri_cu_the: editingItem?.vi_tri_cu_the || '',
    ngay_xay_ra_sc: editingItem?.ngay_xay_ra_sc || '',
    thoi_gian: editingItem?.thoi_gian || '',
    mo_ta_su_co: editingItem?.mo_ta_su_co || '',
    de_xuat_giai_phap_ban_dau: editingItem?.de_xuat_giai_phap_ban_dau || '',
    dieu_tri_xy_ly_ban_dau_da_thuc_hien: editingItem?.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '',
    thong_bao_bs_npt: editingItem?.thong_bao_bs_npt || 'Không ghi nhận',
    ghi_nhan_vao_hsba: editingItem?.ghi_nhan_vao_hsba || 'Không ghi nhận',
    thong_bao_nn: editingItem?.thong_bao_nn || 'Không ghi nhận',
    thong_bao_nb: editingItem?.thong_bao_nb || 'Không ghi nhận',
    phan_loai_sc: editingItem?.phan_loai_sc || 'Đã xảy ra',
    phan_loai_ban_dau: editingItem?.phan_loai_ban_dau || 'Nhẹ',
    ho_ten_nguoi_bc: editingItem?.ho_ten_nguoi_bc || user?.full_name || '',
    sdt: editingItem?.sdt || '',
    email: editingItem?.email || '',
    vaitro_nguoi_bc: editingItem?.vaitro_nguoi_bc || 'Nhân viên y tế',
    chung_kien1: editingItem?.chung_kien1 || '',
    chung_kien2: editingItem?.chung_kien2 || '',
    trang_thai: editingItem?.trang_thai || 'Mới'
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const units = await fetchDmDonVi();
        setDmDonVi(units || []);
        if (!editingItem && user) {
          const nhanSu = await fetchNhanSuQlcl();
          const currentUserInfo = nhanSu.find(ns => ns.ho_ten === user.full_name);
          if (currentUserInfo) {
            setFormData(prev => ({
              ...prev,
              sdt: currentUserInfo.so_dien_thoai || '',
              email: currentUserInfo.email || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    initData();
  }, [user, editingItem]);

  const generateNextCode = async (unitCode: string) => {
    if (!unitCode || editingItem) return;
    const currentYear = new Date().getFullYear().toString();
    try {
      const latest = await fetchLatestBaoCaoScykByYear(currentYear);
      let nextSeq = 1;
      if (latest && latest.so_bc_ma_scyk) {
        const parts = latest.so_bc_ma_scyk.split('-');
        if (parts.length >= 4) {
          const lastSeq = parseInt(parts[3]);
          if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }
      }
      const newCode = `SCYK-${currentYear}-${unitCode}-${nextSeq.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, so_bc_ma_scyk: newCode }));
    } catch (err) {
      console.error('Error generating code:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.so_bc_ma_scyk || !formData.don_vi_bao_cao || !formData.ho_ten_nb) {
      alert('Vui lòng điền đầy đủ: Số BC, Đơn vị báo cáo, Họ tên NB');
      return;
    }
    setSaving(true);
    try {
      if (editingItem?.id) {
        await updateBaoCaoScyk(editingItem.id, formData);
      } else {
        await addBaoCaoScyk({ ...formData, trang_thai: 'Mới' });
      }
      onSaved();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const ToggleGroup = ({ label, field, options, value }: { label: string, field: string, options: string[], value: string }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleChange(field, opt)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${value === opt ? 'bg-white text-primary-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 fixed inset-0 z-[50] overflow-hidden">
      {/* Header - Compact */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm shrink-0 z-20">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <FileText className="text-primary-600" size={24} />
          {editingItem ? 'Cập nhật báo cáo sự cố' : 'Báo cáo sự cố mới'}
          {formData.so_bc_ma_scyk && <span className="hidden md:inline-flex bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono border border-slate-200">{formData.so_bc_ma_scyk}</span>}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Section 1: Thông tin chung & Người bệnh */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                Thông tin chung & Người bệnh
              </h3>
              {openSections.includes('general') ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {openSections.includes('general') && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-200">
                {/* Form fields here... */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ToggleGroup label="Hình thức báo cáo" field="hinh_thuc_bao_cao" options={['Tự nguyện', 'Bắt buộc']} value={formData.hinh_thuc_bao_cao} />
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Đơn vị báo cáo <span className="text-red-500">*</span></label>
                    <select value={formData.don_vi_bao_cao} onChange={(e) => { handleChange('don_vi_bao_cao', e.target.value); const u = dmDonVi.find(d => d.ten_don_vi === e.target.value); if (u) generateNextCode(u.ma_don_vi); }} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 cursor-pointer">
                      <option value="">-- Chọn đơn vị --</option>
                      {dmDonVi.map(u => <option key={u.id} value={u.ten_don_vi}>{u.ten_don_vi}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ngày báo cáo</label>
                    <input type="date" value={formData.ngay_bao_cao} onChange={(e) => handleChange('ngay_bao_cao', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 my-2 pt-4"></div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Họ và tên người bệnh <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.ho_ten_nb} onChange={e => handleChange('ho_ten_nb', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold" placeholder="Nhập họ tên NB..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Số HSBA</label>
                    <input type="text" value={formData.so_benh_an} onChange={e => handleChange('so_benh_an', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Giới tính</label>
                    <select value={formData.gioi} onChange={e => handleChange('gioi', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm">
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ngày sinh</label>
                  <input type="date" value={formData.ngay_sinh} onChange={e => handleChange('ngay_sinh', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Đối tượng xảy ra</label>
                  <select value={formData.doi_tuong_xay_ra_sc} onChange={e => handleChange('doi_tuong_xay_ra_sc', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm">
                    <option value="Người bệnh">Người bệnh</option>
                    <option value="Nhân viên y tế">Nhân viên y tế</option>
                    <option value="Trang thiết bị">Trang thiết bị</option>
                    <option value="Cơ sở hạ tầng">Cơ sở hạ tầng</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Chi tiết sự cố */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('details')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">2</span>
                Thông tin sự cố
              </h3>
              {openSections.includes('details') ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {openSections.includes('details') && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nơi xảy ra sự cố</label>
                  <input type="text" value={formData.noi_xay_ra_sc} onChange={e => handleChange('noi_xay_ra_sc', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="VD: Hành lang, Phòng mổ..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vị trí cụ thể</label>
                  <input type="text" value={formData.vi_tri_cu_the} onChange={e => handleChange('vi_tri_cu_the', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="VD: Giường số 5..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Khoa / Phòng</label>
                  <input type="text" value={formData.khoa_phong} onChange={e => handleChange('khoa_phong', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Ngày xảy ra</label>
                    <input type="date" value={formData.ngay_xay_ra_sc} onChange={e => handleChange('ngay_xay_ra_sc', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Giờ xảy ra</label>
                    <input type="time" value={formData.thoi_gian} onChange={e => handleChange('thoi_gian', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Mô tả sự cố</label>
                  <textarea rows={4} value={formData.mo_ta_su_co} onChange={e => handleChange('mo_ta_su_co', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="Mô tả chi tiết diễn biến..." />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleGroup label="Phân loại ban đầu" field="phan_loai_ban_dau" options={['Nhẹ', 'Trung bình', 'Nặng']} value={formData.phan_loai_ban_dau} />
                  <ToggleGroup label="Nhóm sự cố" field="phan_loai_sc" options={['Đã xảy ra', 'Suýt xảy ra', 'Có nguy cơ']} value={formData.phan_loai_sc} />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Xử lý & Thông tin báo cáo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('handling')}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">3</span>
                Xử lý & Người báo cáo
              </h3>
              {openSections.includes('handling') ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {openSections.includes('handling') && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-200">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Xử lý ban đầu đã thực hiện</label>
                  <textarea rows={2} value={formData.dieu_tri_xy_ly_ban_dau_da_thuc_hien} onChange={e => handleChange('dieu_tri_xy_ly_ban_dau_da_thuc_hien', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Đề xuất giải pháp phòng ngừa</label>
                  <textarea rows={2} value={formData.de_xuat_giai_phap_ban_dau} onChange={e => handleChange('de_xuat_giai_phap_ban_dau', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>

                <div className="md:col-span-2 border-t border-slate-100 my-2 pt-4"></div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Người báo cáo</label>
                  <input type="text" value={formData.ho_ten_nguoi_bc} onChange={e => handleChange('ho_ten_nguoi_bc', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Số điện thoại</label>
                  <input type="text" value={formData.sdt} onChange={e => handleChange('sdt', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Vai trò người báo cáo</label>
                  <select value={formData.vaitro_nguoi_bc} onChange={e => handleChange('vaitro_nguoi_bc', e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm">
                    <option value="BS">Bác sĩ</option>
                    <option value="Điều dưỡng">Điều dưỡng</option>
                    <option value="KTV">Kỹ thuật viên</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-slate-200 bg-white p-4 flex items-center justify-end gap-3 z-20 shrink-0">
        <button onClick={onCancel} className="px-6 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors">Hủy bỏ</button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-primary-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><Save size={18} /> Lưu báo cáo</>}
        </button>
      </div>
    </div>
  );
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    code: string;
    requester: string;
    timestamp: string;
  } | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> Xác nhận thành công
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-800">Đã tiếp nhận & xác minh</h4>
            <p className="text-slate-500 text-sm">Trạng thái báo cáo đã được cập nhật</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 text-sm">Phiếu báo cáo</span>
              <span className="font-mono font-bold text-slate-800">{data.code}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 text-sm">Người tiếp nhận</span>
              <span className="font-medium text-slate-800">{data.requester}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Thời gian</span>
              <span className="font-medium text-emerald-700">{data.timestamp}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors mt-2"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};