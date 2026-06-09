import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, AlertTriangle,
  ArrowRight, BrainCircuit, Save, X, Sparkles,
  ChevronDown, ChevronUp, CheckCircle2, AlertOctagon,
  BarChart2, PieChart as PieChartIcon, Calendar, Download, Printer,
  History, Edit2, Trash2, Eye, ArrowLeft, Target, Users, LayoutGrid, User, CheckSquare,
  LayoutDashboard, List, FileCheck, Files, Menu, RefreshCw, Clock, Upload, Image as ImageIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../supabaseClient';
import { fetchBaoCaoScyk, addBaoCaoScyk, updateBaoCaoScyk, deleteBaoCaoScyk, fetchLatestBaoCaoScykByYear } from '../readBaoCaoScyk';
import { addScykTienDoLog, fetchScykTienDoLogs, fetchLatestLogPerIncident, ScykTienDoLog } from '../readScykTienDoLogs';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';
import { analyzeWithAi } from '../aiClient';
import VerificationMinutes from './VerificationMinutes';
import IncidentAnalysis from './IncidentAnalysis';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import ScykFormTT43 from './ScykFormTT43';
import { FacilitySecurityModule } from './FacilitySecurityModule';

type MenuItem = 'OVERVIEW' | 'LIST' | 'VERIFICATION' | 'REPORTS' | 'ANALYSIS';
type ViewMode = 'LIST' | 'STATS' | 'FORM' | 'VIEW';


// --- Helpers ---
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Mới': return 'Chưa tiếp nhận';
    case 'Chưa tiếp nhận': return 'Chưa tiếp nhận';
    case 'Đã tiếp nhận': return 'Đã tiếp nhận';
    case 'Đang xác minh': return 'Đang xác minh';
    case 'Đang tiếp nhận': return 'Đang xác minh';
    case 'Đang phân tích': return 'Đang phân tích';
    case 'Đã kết luận': return 'Đã kết luận';
    default: return status || 'Chưa tiếp nhận';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Mới': return 'text-red-500';
    case 'Chưa tiếp nhận': return 'text-red-500';
    case 'Đã tiếp nhận': return 'text-cyan-600';
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

export const Incidents: React.FC = () => {
  const { canView, canCreate, canUpdate, canDelete } = usePermissions();

  // Filter menu items based on permissions
  const menuItems = [
    { id: 'OVERVIEW', label: 'Tổng quan', icon: <LayoutDashboard size={28} />, bgClass: 'bg-sky-300', iconClass: 'text-sky-600' },
    { id: 'LIST', label: 'Sự cố y khoa', icon: <List size={28} />, bgClass: 'bg-green-300', iconClass: 'text-green-600' },
    { id: 'VERIFICATION', label: 'Xác minh', icon: <FileCheck size={28} />, bgClass: 'bg-orange-300', iconClass: 'text-orange-600' },
    { id: 'ANALYSIS', label: 'RCA', icon: <BrainCircuit size={28} />, bgClass: 'bg-violet-300', iconClass: 'text-violet-600' },
    { id: 'REPORTS', label: 'Sự cố ngoài y khoa', icon: <Files size={28} />, bgClass: 'bg-slate-300', iconClass: 'text-slate-600' },
  ].filter(item => canView('INCIDENTS', item.id));

  const defaultMenu = (menuItems.find(item => item.id === 'LIST')?.id || menuItems[0]?.id || 'OVERVIEW') as MenuItem;
  const [activeMenu, setActiveMenu] = useState<MenuItem>(defaultMenu);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMenu === 'OVERVIEW' ? 'STATS' : 'LIST');
  const [activePeriod, setActivePeriod] = useState<string>('YEAR'); // MONTH, QUARTER, YEAR
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterQuarter, setFilterQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [viewingItem, setViewingItem] = useState<any | null>(null);

  // Specific filters state passed down to lists
  const [listStatusFilter, setListStatusFilter] = useState<string>('ALL');
  const [latestLogs, setLatestLogs] = useState<Record<string, ScykTienDoLog>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, logsMap] = await Promise.all([
        fetchBaoCaoScyk(),
        fetchLatestLogPerIncident(),
      ]);
      setIncidents(data || []);
      setLatestLogs(logsMap);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
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
    const byStatusGroups = {
      'Chưa tiếp nhận': 0,
      'Đã tiếp nhận': 0,
      'Đang xác minh': 0,
      'Đang phân tích': 0,
      'Đã kết luận': 0
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filteredIncidents = incidents.filter(inc => {
      if (!inc.ngay_bao_cao) return true;
      const reportDate = new Date(inc.ngay_bao_cao);
      const reportYear = reportDate.getFullYear();
      const reportMonth = reportDate.getMonth() + 1; // 1-12

      if (activePeriod === 'YEAR') return reportYear === filterYear;
      if (activePeriod === 'MONTH') return reportYear === filterYear && reportMonth === filterMonth;
      if (activePeriod === 'QUARTER') {
        const reportQuarter = Math.floor((reportMonth - 1) / 3) + 1;
        return reportYear === filterYear && reportQuarter === filterQuarter;
      }
      return true;
    });

    filteredIncidents.forEach(inc => {
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
      if (status === 'Mới' || status === 'Chưa tiếp nhận') {
        byStatusGroups['Chưa tiếp nhận']++;
      } else if (status === 'Đã tiếp nhận') {
        byStatusGroups['Đã tiếp nhận']++;
      } else if (status === 'Đang xác minh' || status === 'Đang tiếp nhận') {
        byStatusGroups['Đang xác minh']++;
      } else if (status === 'Đang phân tích') {
        byStatusGroups['Đang phân tích']++;
      } else if (status === 'Đã kết luận') {
        byStatusGroups['Đã kết luận']++;
      }
    });

    return {
      byDept: Object.entries(byDept).map(([name, vals]) => ({ name, ...vals })),
      byStatus: [
        { name: 'Chưa tiếp nhận', value: byStatusGroups['Chưa tiếp nhận'], color: '#ef4444' }, // Red
        { name: 'Đã tiếp nhận', value: byStatusGroups['Đã tiếp nhận'], color: '#0891b2' },   // Cyan
        { name: 'Đang xác minh', value: byStatusGroups['Đang xác minh'], color: '#2563eb' }, // Blue
        { name: 'Đang phân tích', value: byStatusGroups['Đang phân tích'], color: '#f59e0b' }, // Amber
        { name: 'Đã kết luận', value: byStatusGroups['Đã kết luận'], color: '#059669' },     // Green
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


  return (
    <div className="incidents-module min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation - Horizontal Tabs */}
      <div className="bg-white px-3 py-3 sm:px-4">
        <div className="incident-tab-list">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuChange(item.id as MenuItem)}
                className={`incident-tab-button ${activeMenu === item.id ? 'incident-tab-button-active' : ''}`}
              >
                <span className={`function-icon-box ${item.bgClass}`}>
                  {React.cloneElement(item.icon as React.ReactElement, { className: item.iconClass })}
                </span>
                <span className="function-icon-label">{item.label}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
        <div className="max-w-7xl mx-auto h-full">
          {/* Detail/Form Overlay Mode */}
          {viewMode === 'FORM' && (
            <ScykFormTT43
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
              onDelete={() => {
                setTargetDeleteId(viewingItem.id);
                setIsDeleteModalOpen(true);
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
                    <IncidentStatistics
                      stats={computeStats()}
                      totalCount={incidents.filter(inc => {
                        if (!inc.ngay_bao_cao) return true;
                        const reportDate = new Date(inc.ngay_bao_cao);
                        const reportYear = reportDate.getFullYear();
                        const reportMonth = reportDate.getMonth() + 1;

                        if (activePeriod === 'YEAR') return reportYear === filterYear;
                        if (activePeriod === 'MONTH') return reportYear === filterYear && reportMonth === filterMonth;
                        if (activePeriod === 'QUARTER') {
                          const reportQuarter = Math.floor((reportMonth - 1) / 3) + 1;
                          return reportYear === filterYear && reportQuarter === filterQuarter;
                        }
                        return true;
                      }).length}
                      period={activePeriod}
                      setPeriod={setActivePeriod}
                      filterYear={filterYear}
                      setFilterYear={setFilterYear}
                      filterMonth={filterMonth}
                      setFilterMonth={setFilterMonth}
                      filterQuarter={filterQuarter}
                      setFilterQuarter={setFilterQuarter}
                      onViewReports={() => handleMenuChange('REPORTS')}
                    />
                  )}

                  {/* 2. Main List with Quick Filters */}
                  {activeMenu === 'LIST' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <IncidentList
                        data={incidents}
                        onCreate={() => { setEditingItem(null); setViewMode('FORM'); }}
                        onEdit={(item) => { setEditingItem(item); setViewMode('FORM'); }}
                        onDelete={(id) => {
                          setTargetDeleteId(id);
                          setIsDeleteModalOpen(true);
                        }}
                        onView={(item) => { setViewingItem(item); setViewMode('VIEW'); }}
                        onStatusUpdated={() => loadData()}
                        latestLogs={latestLogs}
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

                  {/* 4. Non-medical incidents */}
                  {activeMenu === 'REPORTS' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full">
                      <FacilitySecurityModule />
                    </div>
                  )}

                  {/* 5. Analysis RCA */}
                  {activeMenu === 'ANALYSIS' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full">
                      <IncidentAnalysis />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!targetDeleteId) return;
          setIsDeleting(true);
          try {
            await deleteBaoCaoScyk(targetDeleteId);
            setIsDeleteModalOpen(false);
            if (viewingItem && viewingItem.id === targetDeleteId) {
              setViewMode('LIST');
              setViewingItem(null);
            }
            loadData();
          } catch (err: any) {
            alert('Lỗi khi xóa: ' + err.message);
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Xác nhận xóa sự cố"
        message="Bạn có chắc chắn muốn xóa báo cáo sự cố này không? Thao tác này không thể hoàn tác."
        isLoading={isDeleting}
      />
    </div>
  );
};

// --- Component: Update Status Modal ---
const UpdateStatusModal = ({ item, onClose, onSaved }: { item: any, onClose: () => void, onSaved: () => void }) => {
  const [trangThai, setTrangThai] = useState(item.trang_thai || 'Mới');
  const [ghiChu, setGhiChu] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<ScykTienDoLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const statusOptions = ['Chưa tiếp nhận', 'Đã tiếp nhận', 'Đang xác minh', 'Đang phân tích', 'Đã kết luận'];

  // Load log history
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoadingLogs(true);
        const data = await fetchScykTienDoLogs(item.id);
        setLogs(data);
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };
    loadLogs();
  }, [item.id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Update trang_thai in bao_cao_scyk
      await updateBaoCaoScyk(item.id, { trang_thai: trangThai });
      // 2. Write log entry
      await addScykTienDoLog({
        bao_cao_id: item.id,
        trang_thai: trangThai,
        ghi_chu: ghiChu.trim() || undefined,
        nguoi_cap_nhat: user?.full_name || user?.username || 'Không rõ',
      });
      onSaved();
    } catch (err: any) {
      setError('Lỗi khi cập nhật: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Mới': case 'Chưa tiếp nhận': return 'bg-red-100 text-red-700';
      case 'Đã tiếp nhận': return 'bg-cyan-100 text-cyan-700';
      case 'Đang xác minh': return 'bg-blue-100 text-blue-700';
      case 'Đang phân tích': return 'bg-amber-100 text-amber-700';
      case 'Đã kết luận': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shadow-inner">
              <RefreshCw size={22} />
            </div>
            <div>
              <h2 className="text-section font-black text-black uppercase tracking-tight">Cập nhật tiến độ xử lý</h2>
              <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest">{item.so_bc_ma_scyk || 'Sự cố'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"><X size={18} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Form section */}
          <div className="p-6 space-y-8">
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Trạng thái xử lý</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(s => {
                  const isActive = trangThai === s;
                  const colors = getStatusBadgeClass(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setTrangThai(s)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold lowercase ${
                        isActive 
                          ? `${colors} border-current shadow-md scale-105 active:scale-95` 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ghi chú tiến độ <span className="text-slate-300 font-bold lowercase italic">(tùy chọn)</span></label>
              <textarea
                value={ghiChu}
                onChange={e => setGhiChu(e.target.value)}
                rows={3}
                placeholder="Nhập nội dung cập nhật..."
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 text-[13px] font-bold text-slate-800 focus:ring-8 focus:ring-primary-500/5 focus:border-primary-500 transition-all outline-none resize-none bg-slate-50/30 shadow-inner"
              />
            </div>
            
            {error && <div className="text-red-600 text-xs bg-red-50 p-4 rounded-2xl border border-red-200 animate-in shake duration-300">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 shrink-0 bg-slate-50/50">
          <button onClick={onClose} className="px-6 py-2.5 text-black/40 font-black uppercase text-[10px] tracking-widest hover:text-black hover:bg-slate-100 rounded-xl transition-all">Hủy bỏ</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            {saving ? 'Đang lưu...' : 'Lưu cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component: Incident List ---
const IncidentList = ({ data, onCreate, onEdit, onDelete, onView, onStatusUpdated, latestLogs = {}, showStatusFilter = false, showReportFilter = false }: {
  data: any[],
  onCreate: () => void,
  onEdit: (item: any) => void,
  onDelete: (id: string) => void,
  onView: (item: any) => void,
  onStatusUpdated?: () => void,
  latestLogs?: Record<string, ScykTienDoLog>,
  showStatusFilter?: boolean,
  showReportFilter?: boolean
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [activeReportFilter, setActiveReportFilter] = useState('ALL');
  const [updatingItem, setUpdatingItem] = useState<any | null>(null);

  const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
  const uDept = user?.department?.trim().toLowerCase() || '';

  const filteredData = data.filter(inc => {
    // Removed Unit filtering to allow users to see the list of incidents.Edit/Delete is still restricted by isOwnUnit.

    // 1. Text Search
    const matchesSearch = (inc.so_bc_ma_scyk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.khoa_phong || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.mo_ta_su_co || '').toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Status Filter
    let matchesStatus = true;
    if (activeStatusFilter !== 'ALL') {
      if (activeStatusFilter === 'CHUA_TIEP_NHAN') matchesStatus = (!inc.trang_thai || inc.trang_thai === 'Chưa tiếp nhận' || inc.trang_thai === 'Mới');
      else if (activeStatusFilter === 'DA_TIEP_NHAN') matchesStatus = (inc.trang_thai === 'Đã tiếp nhận');
      else if (activeStatusFilter === 'DANG_XAC_MINH') matchesStatus = (inc.trang_thai === 'Đang xác minh' || inc.trang_thai === 'Đang tiếp nhận');
      else if (activeStatusFilter === 'DANG_PHAN_TICH') matchesStatus = (inc.trang_thai === 'Đang phân tích');
      else if (activeStatusFilter === 'DA_KET_LUAN') matchesStatus = (inc.trang_thai === 'Đã kết luận');
      else matchesStatus = (inc.trang_thai === activeStatusFilter);
    }

    // 3. Report Filter (Placeholder logic specifically for "Bệnh viện" vs "Cục Quân y")
    let matchesReport = true;
    if (activeReportFilter !== 'ALL' && showReportFilter) {
      if (activeReportFilter === 'BENH_VIEN') matchesReport = true; // Placeholder
      if (activeReportFilter === 'CUC_QUAN_Y') matchesReport = inc.hinh_thuc_bao_cao === 'Bắt buộc';
    }

    return matchesSearch && matchesStatus && matchesReport;
  });

  // --- Helpers moved to top ---

  return (
    <div className="card animate-in fade-in duration-300">
      {/* Quick Status Filter Bar */}
      {showStatusFilter && (
        <div className="tab-container mb-4 flex-wrap">
          <button onClick={() => setActiveStatusFilter('ALL')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'ALL' ? 'bg-black text-white shadow-lg' : 'bg-white text-black/40 border border-slate-200 hover:bg-slate-100'}`}>Tất cả</button>
          <button onClick={() => setActiveStatusFilter('CHUA_TIEP_NHAN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'CHUA_TIEP_NHAN' ? 'bg-red-600 text-white shadow-lg shadow-red-900/10' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}>Chưa tiếp nhận</button>
          <button onClick={() => setActiveStatusFilter('DA_TIEP_NHAN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DA_TIEP_NHAN' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/10' : 'bg-white text-cyan-600 border border-cyan-200 hover:bg-cyan-50'}`}>Đã tiếp nhận</button>
          <button onClick={() => setActiveStatusFilter('DANG_XAC_MINH')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DANG_XAC_MINH' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/10' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}>Đang xác minh</button>
          <button onClick={() => setActiveStatusFilter('DANG_PHAN_TICH')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DANG_PHAN_TICH' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/10' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}>Đang phân tích</button>
          <button onClick={() => setActiveStatusFilter('DA_KET_LUAN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DA_KET_LUAN' ? 'bg-green-600 text-white shadow-lg shadow-green-900/10' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'}`}>Đã kết luận</button>
        </div>
      )}

      {/* Report Filter Bar */}
      {showReportFilter && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
          <button onClick={() => setActiveReportFilter('ALL')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeReportFilter === 'ALL' ? 'bg-black text-white shadow-lg' : 'bg-white text-black/40 border border-slate-200 hover:bg-slate-100'}`}>Tất cả báo cáo</button>
          <button onClick={() => setActiveReportFilter('BENH_VIEN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeReportFilter === 'BENH_VIEN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/10' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'}`}>Báo cáo Bệnh viện</button>
          <button onClick={() => setActiveReportFilter('CUC_QUAN_Y')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeReportFilter === 'CUC_QUAN_Y' ? 'bg-red-600 text-white shadow-lg shadow-red-900/10' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}>Báo cáo Cục Quân y</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã SC, khoa phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-base pl-10"
            />
          </div>
          <button className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
        {canCreate('INCIDENTS', 'LIST') && (
          <button
            onClick={onCreate}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" /> Báo cáo sự cố mới
          </button>
        )}
      </div>

      {/* Desktop Table - Grid Style with Green Header */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-base text-left">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-5 text-[11px] font-black uppercase text-white tracking-[0.2em] text-center w-1/5 border-r border-white/20">Ngày / Mã</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase text-white tracking-[0.2em] w-1/5 border-r border-white/20">Đơn vị báo cáo / Thông tin</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase text-white tracking-[0.2em] text-center w-1/5 border-r border-white/20">Nhóm báo cáo / Hình thức</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase text-white tracking-[0.2em] text-center w-1/5 border-r border-white/20">Trạng thái xử lý</th>
              <th className="px-6 py-5 text-[11px] font-black uppercase text-white tracking-[0.2em] text-center w-1/5">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredData.length === 0 ? (
              <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-sans border border-slate-200">Không tìm thấy sự cố phù hợp trong hệ thống</td></tr>
            ) : (
              filteredData.map((inc) => {
                const uDept = user?.department?.trim().toLowerCase() || '';
                const iDept1 = (inc.khoa_phong || '').trim().toLowerCase();
                const iDept2 = (inc.don_vi_bao_cao || '').trim().toLowerCase();
                const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));

                return (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* COL 1: Date / Code */}
                    <td className="px-6 py-8 border border-slate-200 text-center">
                      <div className="flex flex-col gap-2.5 items-center">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                          <Calendar size={14} className="text-[#009900]" />
                          <span className="text-black font-black text-xs font-sans underline decoration-[#009900]/20 underline-offset-4 decoration-2">{inc.ngay_bao_cao ? new Date(inc.ngay_bao_cao).toLocaleDateString('vi-VN') : '---'}</span>
                        </div>
                        <div className="text-[10px] font-mono font-black text-primary-700 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-100 uppercase tracking-tighter shadow-inner">#{inc.so_bc_ma_scyk || '---'}</div>
                      </div>
                    </td>

                    {/* COL 2: Unit info */}
                    <td className="px-6 py-8 border border-slate-200">
                      <div className="flex flex-col gap-2">
                        <div className="text-black text-[13px] font-black uppercase tracking-tight leading-tight group-hover:text-[#009900] transition-colors">{inc.khoa_phong || inc.don_vi_bao_cao || '---'}</div>
                        <div className="flex items-center gap-2">
                           <div className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50 italic capitalize">Đối tượng: {inc.doi_tuong_xay_ra_sc || '---'}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-bold italic opacity-60">
                          <Clock size={12} strokeWidth={3} /> Xảy ra: {inc.ngay_xay_ra_sc ? new Date(inc.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : '---'}
                        </div>
                      </div>
                    </td>

                    {/* COL 3: Group info */}
                    <td className="px-6 py-8 border border-slate-200 text-center">
                      <div className="flex flex-col gap-3 items-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm border ${
                          inc.nhom_bao_cao === 'Ngoài sự cố y khoa' 
                          ? 'bg-amber-50 text-amber-600 border-amber-200' 
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {inc.nhom_bao_cao || 'Sự cố y khoa'}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                             inc.hinh_thuc_bao_cao === 'Bắt buộc' 
                             ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm shadow-rose-100' 
                             : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                           }`}>
                             {inc.hinh_thuc_bao_cao === 'Bắt buộc' ? '🚀 Bắt buộc' : '🏥 Tự nguyện'}
                           </span>
                        </div>
                      </div>
                    </td>

                    {/* COL 4: Status */}
                    <td className="px-6 py-8 border border-slate-200 text-center">
                       <span className={`inline-flex px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-current shadow-md ${getStatusColor(inc.trang_thai)} bg-white ring-8 ring-slate-50/50 transition-all hover:scale-110 duration-300`}>
                          {getStatusLabel(inc.trang_thai)}
                        </span>
                    </td>

                    {/* COL 5: Actions */}
                    <td className="px-6 py-8 border border-slate-200 text-center bg-slate-50/30">
                      <div className="grid grid-cols-2 gap-2 uppercase font-sans">
                        <button onClick={() => onView(inc)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black text-green-700 bg-green-50 hover:bg-[#009900] hover:text-white rounded-xl transition-all border border-green-200 shadow-sm active:scale-95 group/btn">
                          <Eye size={16} /> Xem
                        </button>
                        {canUpdate('INCIDENTS', 'LIST') && isOwnUnit && (
                          <button onClick={() => onEdit(inc)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-xl transition-all border border-amber-200 shadow-sm active:scale-95">
                            <Edit2 size={16} /> Sửa
                          </button>
                        )}
                        {isAdmin && canUpdate('INCIDENTS', 'LIST') && (
                          <button onClick={() => setUpdatingItem(inc)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-200 shadow-sm active:scale-95">
                            <RefreshCw size={16} /> Tiến độ
                          </button>
                        )}
                        {canDelete('INCIDENTS', 'LIST') && isOwnUnit && (
                          <button onClick={() => onDelete(inc.id)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[10px] font-black text-red-700 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-200 shadow-sm active:scale-95">
                            <Trash2 size={16} /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredData.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400">Không tìm thấy sự cố phù hợp</div>
        ) : (
          filteredData.map((inc, index) => {
            const uDept = user?.department?.trim().toLowerCase() || '';
            const iDept1 = (inc.khoa_phong || '').trim().toLowerCase();
            const iDept2 = (inc.don_vi_bao_cao || '').trim().toLowerCase();
            const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));

            return (
              <div key={inc.id} className="p-4 hover:bg-slate-50 transition-colors">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">#{index + 1}</span>
                    <span className="text-xs font-semibold text-slate-800">{inc.so_bc_ma_scyk || 'Chưa có mã'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${!inc.trang_thai || inc.trang_thai === 'Mới' || inc.trang_thai === 'Chưa tiếp nhận' ? 'bg-red-100 text-red-700' :
                    inc.trang_thai === 'Đã tiếp nhận' ? 'bg-cyan-100 text-cyan-700' :
                      inc.trang_thai === 'Đang xác minh' ? 'bg-blue-100 text-blue-700' :
                        inc.trang_thai === 'Đang phân tích' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                    }`}>
                    {getStatusLabel(inc.trang_thai)}
                  </span>
                </div>

                {/* Incident Description */}
                {inc.mo_ta_su_co && (
                  <p className="text-xs text-slate-700 mb-2 line-clamp-2 leading-relaxed">{inc.mo_ta_su_co}</p>
                )}

                {/* Card Meta Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">Báo cáo: {inc.ngay_bao_cao ? new Date(inc.ngay_bao_cao).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium italic">Xảy ra: {inc.ngay_xay_ra_sc ? new Date(inc.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-800 text-[11px] mb-1 leading-tight">{inc.khoa_phong || inc.don_vi_bao_cao || '---'}</div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-medium">Đối tượng: {inc.doi_tuong_xay_ra_sc || '---'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${inc.hinh_thuc_bao_cao === 'Bắt buộc' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        {inc.hinh_thuc_bao_cao === 'Bắt buộc' ? 'CQY' : 'BV'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${inc.nhom_bao_cao === 'Ngoài sự cố y khoa' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                        {inc.nhom_bao_cao === 'Ngoài sự cố y khoa' ? 'Ngoài SCYK' : 'SCYK'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${!inc.trang_thai || inc.trang_thai === 'Mới' || inc.trang_thai === 'Chưa tiếp nhận' ? 'bg-slate-400' :
                      inc.trang_thai === 'Đã tiếp nhận' ? 'bg-cyan-500 w-1/4' :
                        inc.trang_thai === 'Đang xác minh' ? 'bg-blue-500' :
                          inc.trang_thai === 'Đang phân tích' ? 'bg-amber-500' :
                            'bg-green-500'
                      } ${getStatusWidth(inc.trang_thai)}`}></div>
                  </div>
                  {(() => {
                    const log = latestLogs[inc.id];
                    return log?.ghi_chu ? (
                      <div className="text-[10px] text-slate-500 mt-1 italic line-clamp-1" title={log.ghi_chu}>
                        {log.ghi_chu} <span className="text-slate-400 not-italic">– {log.nguoi_cap_nhat}</span>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => onView(inc)} className="flex items-center gap-1 text-[10px] font-medium text-green-700 px-2.5 py-1 bg-green-50 hover:bg-green-100 rounded-md border border-green-200">
                    <Eye size={11} /> Xem
                  </button>
                  {isAdmin && canUpdate('INCIDENTS', 'LIST') && (
                    <button onClick={() => setUpdatingItem(inc)} className="flex items-center gap-1 text-[10px] font-medium text-blue-700 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200">
                      <RefreshCw size={11} /> Cập nhật
                    </button>
                  )}
                  {isOwnUnit && (
                    <>
                      {canUpdate('INCIDENTS', 'LIST') && (
                        <button onClick={() => onEdit(inc)} className="flex items-center gap-1 text-[10px] font-medium text-amber-700 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200">
                          <Edit2 size={11} /> Sửa
                        </button>
                      )}
                      {canDelete('INCIDENTS', 'LIST') && (
                        <button onClick={() => onDelete(inc.id)} className="flex items-center gap-1 text-[10px] font-medium text-red-700 px-2.5 py-1 bg-red-50 hover:bg-red-100 rounded-md border border-red-200">
                          <Trash2 size={11} /> Xóa
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
        <span>Hiển thị {filteredData.length} sự cố</span>
        <div className="flex gap-1">
          <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Trước</button>
          <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Sau</button>
        </div>
      </div>

      {/* Update Status Modal */}
      {updatingItem && (
        <UpdateStatusModal
          item={updatingItem}
          onClose={() => setUpdatingItem(null)}
          onSaved={() => { setUpdatingItem(null); if (onStatusUpdated) onStatusUpdated(); }}
        />
      )}
    </div>
  )
}

// --- Component: Incident Statistics ---
const IncidentStatistics = ({
  stats,
  totalCount,
  period,
  setPeriod,
  filterYear,
  setFilterYear,
  filterMonth,
  setFilterMonth,
  filterQuarter,
  setFilterQuarter,
  onViewReports
}: {
  stats: { byDept: any[], byStatus: any[] },
  totalCount: number,
  period: string,
  setPeriod: (p: string) => void,
  filterYear: number,
  setFilterYear: (y: number) => void,
  filterMonth: number,
  setFilterMonth: (m: number) => void,
  filterQuarter: number,
  setFilterQuarter: (q: number) => void,
  onViewReports: () => void
}) => {
  const severeCount = stats.byDept.reduce((sum, d) => sum + d.severe, 0);
  const analyzedCount = stats.byStatus.find(s => s.name === 'Đã kết luận')?.value || 0;

  const years = [];
  for (let y = 2020; y <= new Date().getFullYear(); y++) {
    years.push(y);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="p-2 bg-primary-50 rounded-lg text-primary-600 hidden md:block">
            <Filter size={18} />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['MONTH', 'QUARTER', 'YEAR'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all tracking-wider ${period === p
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-black/40 hover:text-black'
                  }`}
              >
                {p === 'MONTH' ? 'Tháng' : p === 'QUARTER' ? 'Quý' : 'Năm'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 cursor-pointer text-black"
            >
              {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>

            {period === 'MONTH' && (
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/20 animate-in fade-in slide-in-from-left-2"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
            )}

            {period === 'QUARTER' && (
              <select
                value={filterQuarter}
                onChange={(e) => setFilterQuarter(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-primary-500/20 animate-in fade-in slide-in-from-left-2"
              >
                {[1, 2, 3, 4].map(q => (
                  <option key={q} value={q}>Quý {q}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400"></div>
          <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-1">Tổng số sự cố</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-black">{totalCount}</h3>
            <span className="text-[10px] text-black/40 font-bold uppercase">Sự cố</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
          <p className="text-red-600/60 text-[10px] font-black uppercase tracking-widest mb-1">Sự cố nặng (E-I)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-red-600">{severeCount}</h3>
            <span className="text-[10px] text-red-400 font-bold uppercase">Ca</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>
          <p className="text-cyan-700/60 text-[10px] font-black uppercase tracking-widest mb-1">Đang xử lý</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-cyan-600">
              {(stats.byStatus.find(s => s.name === 'Đã tiếp nhận')?.value || 0) +
                (stats.byStatus.find(s => s.name === 'Đang xác minh')?.value || 0) +
                (stats.byStatus.find(s => s.name === 'Đang phân tích')?.value || 0)}
            </h3>
            <span className="text-[10px] text-cyan-400 font-bold uppercase">Sự cố</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500"></div>
          <p className="text-green-700/60 text-[10px] font-black uppercase tracking-widest mb-1">Đã kết luận</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-green-600">{analyzedCount}</h3>
            <span className="text-[10px] text-green-400 font-bold uppercase">Xong</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-section font-black text-black uppercase tracking-tight">Phân bố sự cố theo Khoa/Phòng và Mức độ</h3>
            <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-black/40 font-black uppercase tracking-widest">Thống kê tích lũy</span>
          </div>
          <div className="h-[450px]">
            {stats.byDept.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.byDept}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={150}
                    tick={{ fontSize: 10, fill: '#1e293b', fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                  <Bar dataKey="mild" name="Nhẹ (Nhóm A-B)" stackId="a" fill="#3b82f6" barSize={12} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="moderate" name="Trung bình (C-D)" stackId="a" fill="#f59e0b" barSize={12} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="severe" name="Nặng (E-I)" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-section font-black text-black uppercase tracking-tight mb-6">Trạng thái xử lý</h3>
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-[-10px]">
              <span className="block text-3xl font-black text-black">{totalCount}</span>
              <span className="text-[10px] text-black/30 font-black uppercase tracking-tighter">Sự cố</span>
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
  const { canUpdate, canDelete } = usePermissions();
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    data: { code: string; requester: string; timestamp: string } | null;
  }>({ isOpen: false, data: null });
  const [detailLogs, setDetailLogs] = useState<ScykTienDoLog[]>([]);

  useEffect(() => {
    fetchScykTienDoLogs(item.id).then(setDetailLogs).catch(console.error);
  }, [item.id]);

  // Handle Accept & Verify with confirmation popup
  const handleAcceptVerify = async () => {
    const now = new Date();
    const timeStr = now.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false
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


  // Checkbox helper for print view
  const Chk = ({ c }: { c: boolean }) => <span>{c ? '☑' : '☐'}</span>;
  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '---';
  const statusLabel = getStatusLabel(item.trang_thai || 'Mới');

  const MobileInfoField = ({ label, value, wide = false }: { label: string; value?: React.ReactNode; wide?: boolean }) => (
    <div className={`rounded-2xl border border-slate-100 bg-slate-50/80 p-3 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div className="mt-1 text-[13px] font-bold leading-relaxed text-slate-800 break-words">{value || '---'}</div>
    </div>
  );

  const MobileSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <section className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009900]/10 text-[#009900]">
          {icon}
        </div>
        <h3 className="text-xs font-black uppercase tracking-wide text-slate-800">{title}</h3>
      </div>
      {children}
    </section>
  );

  return (
    <div>
      <div className="max-w-[1400px] w-full mx-auto animate-in fade-in slide-in-from-right-4 duration-500 pb-20 mt-2 px-0 md:mt-4 md:px-0">
        
        {/* Actions Bar - Page Header Style */}
        <div className="bg-[#009900] px-4 py-4 text-white rounded-2xl mb-4 shadow-md flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:px-6 md:py-5 md:mb-8">
          <div className="flex w-full min-w-0 items-center gap-3 md:w-auto md:gap-4">
            <div className="w-11 h-11 md:w-12 md:h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
               <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-black uppercase tracking-tight leading-tight">Chi tiết báo cáo sự cố y khoa</h1>
              <p className="truncate text-green-50 text-[10px] md:text-sm font-medium mt-0.5 tracking-widest uppercase opacity-80 decoration-white/30 underline underline-offset-4">ID: {item.so_bc_ma_scyk || '---'}</p>
            </div>
          </div>
          
          <div className="grid w-full grid-cols-3 gap-2 md:flex md:w-auto md:flex-wrap md:items-center">
            <button onClick={onBack} className="flex min-h-11 items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all md:px-4">
              <ArrowLeft size={16} /> Quay lại
            </button>
            {canUpdate('INCIDENTS') && (
              <button onClick={onEdit} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#009900] shadow-sm transition-all hover:bg-emerald-50 active:scale-95 md:px-4">
                <Edit2 size={16} /> Chỉnh sửa
              </button>
            )}
            {canDelete('INCIDENTS') && (
              <button onClick={() => onDelete()} className="flex min-h-11 items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 md:px-4">
                <Trash2 size={16} /> Xóa
              </button>
            )}
          </div>
        </div>

        {/* Paper Document Body */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
          {/* Subtle watermark or texture can be added here */}
          <div className="p-4 md:p-20" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif' }}>
            {/* Header Titles */}
            <div className="flex flex-col items-center mb-5 text-center text-black md:mb-16">
              <h2 className="text-xl md:text-[26pt] font-bold uppercase leading-tight tracking-tight">Phiếu báo cáo sự cố y khoa</h2>
              <p className="italic text-xs md:text-[11pt] mt-2 md:mt-3 font-medium text-slate-600">(Mẫu TT 43/2018/TT-BYT ngày 26/12/2018 của Bộ trưởng Bộ Y tế)</p>
            </div>

            {/* Mobile-first readable detail cards */}
            <div className="space-y-4 md:hidden">
              <section className="rounded-[1.75rem] bg-gradient-to-br from-[#009900] to-emerald-700 p-4 text-white shadow-lg shadow-emerald-900/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Mã báo cáo</p>
                    <h3 className="mt-1 truncate text-lg font-black">{item.so_bc_ma_scyk || 'Chưa có mã'}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase">
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[9px] font-black uppercase text-white/60">Ngày báo cáo</p>
                    <p className="mt-1 text-sm font-bold">{formatDate(item.ngay_bao_cao)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[9px] font-black uppercase text-white/60">Ngày xảy ra</p>
                    <p className="mt-1 text-sm font-bold">{formatDate(item.ngay_xay_ra_sc)}</p>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-white/10 p-3">
                    <p className="text-[9px] font-black uppercase text-white/60">Đơn vị / Khoa phòng</p>
                    <p className="mt-1 text-sm font-bold leading-relaxed">{item.don_vi_bao_cao || item.khoa_phong || '---'}</p>
                  </div>
                </div>
              </section>

              <MobileSection title="Thông tin người bệnh" icon={<User size={18} />}>
                <div className="grid grid-cols-2 gap-2">
                  <MobileInfoField label="Họ tên" value={item.ho_ten_nb} wide />
                  <MobileInfoField label="Số BA" value={item.so_benh_an} />
                  <MobileInfoField label="Giới tính" value={item.gioi} />
                  <MobileInfoField label="Ngày sinh" value={formatDate(item.ngay_sinh)} />
                  <MobileInfoField label="Đối tượng" value={item.doi_tuong_xay_ra_sc} />
                </div>
              </MobileSection>

              <MobileSection title="Vị trí và thời điểm" icon={<Target size={18} />}>
                <div className="grid grid-cols-2 gap-2">
                  <MobileInfoField label="Nơi xảy ra" value={item.noi_xay_ra_sc || item.khoa_phong} wide />
                  <MobileInfoField label="Vị trí cụ thể" value={item.vi_tri_cu_the} wide />
                  <MobileInfoField label="Thời gian" value={item.thoi_gian} />
                  <MobileInfoField label="Hình thức" value={item.hinh_thuc_bao_cao} />
                </div>
              </MobileSection>

              <MobileSection title="Mô tả sự cố" icon={<AlertTriangle size={18} />}>
                <div className="rounded-2xl bg-slate-50 p-4 text-[14px] font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {item.mo_ta_su_co || 'Chưa có mô tả sự cố.'}
                </div>
              </MobileSection>

              <MobileSection title="Xử lý và đề xuất" icon={<CheckSquare size={18} />}>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Xử lý ban đầu</p>
                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">{item.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '---'}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Đề xuất giải pháp</p>
                    <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-700 whitespace-pre-wrap">{item.de_xuat_giai_phap_ban_dau || '---'}</p>
                  </div>
                </div>
              </MobileSection>

              <MobileSection title="Phân loại và thông báo" icon={<AlertOctagon size={18} />}>
                <div className="grid grid-cols-2 gap-2">
                  <MobileInfoField label="Phân loại" value={item.phan_loai_ban_dau} />
                  <MobileInfoField label="Ảnh hưởng" value={item.muc_do_anh_huong} />
                  <MobileInfoField label="Báo BS" value={item.thong_bao_bs_dieu_tri} />
                  <MobileInfoField label="Ghi HSBA" value={item.ghi_nhan_vao_hsba} />
                  <MobileInfoField label="Báo người nhà" value={item.thong_bao_nguoi_nha} />
                  <MobileInfoField label="Báo người bệnh" value={item.thong_bao_nguoi_benh} />
                </div>
              </MobileSection>

              <MobileSection title="Người báo cáo" icon={<Users size={18} />}>
                <div className="grid grid-cols-2 gap-2">
                  <MobileInfoField label="Họ tên" value={item.ho_ten_nguoi_bc} wide />
                  <MobileInfoField label="SĐT" value={item.nguoi_bao_cao_sdt} />
                  <MobileInfoField label="Email" value={item.nguoi_bao_cao_email} />
                  <MobileInfoField label="Đối tượng" value={item.nguoi_bao_cao_doi_tuong} wide />
                </div>
              </MobileSection>

              {item.hinh_anh_minh_chung?.length > 0 && (
                <MobileSection title="Minh chứng hình ảnh" icon={<ImageIcon size={18} />}>
                  <div className="grid grid-cols-2 gap-2">
                    {item.hinh_anh_minh_chung.map((img: string, idx: number) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                        <img src={img} alt={`Minh chứng ${idx + 1}`} className="h-28 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </MobileSection>
              )}
            </div>

            {/* TT 43 Master Table */}
            <div className="hidden border-[1.5px] border-black text-black md:block">
              {/* Box 1: Reporting Type */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6 space-y-4">
                  <p className="bg-[#009900] text-white p-2 px-4 font-bold uppercase text-[10pt] -mx-6 -mt-6 mb-4">I. HÌNH THỨC BÁO CÁO:</p>
                  <div className="space-y-2 text-[12pt] font-medium pl-2">
                    <p className="flex items-center gap-2"><Chk c={item.hinh_thuc_bao_cao === 'Tự nguyện'} /> - Tự nguyện</p>
                    <p className="flex items-center gap-2"><Chk c={item.hinh_thuc_bao_cao === 'Bắt buộc'} /> - Bắt buộc</p>
                  </div>
                </div>
                <div className="p-6 space-y-3 text-[11pt] font-medium bg-slate-50/30">
                  <p><strong>Số báo cáo / Mã số sự cố:</strong> {item.so_bc_ma_scyk || '.........................'}</p>
                  <p><strong>Ngày báo cáo:</strong> {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '....../....../...........'}</p>
                  <p><strong>Đơn vị báo cáo:</strong> {item.don_vi_bao_cao || '.........................................'}</p>
                </div>
              </div>

              {/* Box 2: Patient & Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-t-[1.5px] border-black">
                <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6 space-y-3 text-[11pt]">
                  <p className="font-bold uppercase bg-[#009900] text-white -mx-6 -mt-6 p-2 px-6 border-b-[1.5px] border-black text-[10pt]">1. Thông tin người bệnh</p>
                  <p className="pt-3"><strong>Họ và tên:</strong> {item.ho_ten_nb || '..........................................................'}</p>
                  <p><strong>Số bệnh án:</strong> {item.so_benh_an || '................................'}</p>
                  <div className="flex flex-wrap gap-8">
                    <p><strong>Ngày sinh:</strong> {item.ngay_sinh ? new Date(item.ngay_sinh).toLocaleDateString('vi-VN') : '..../..../.......'}</p>
                    <p><strong>Giới tính:</strong> {item.gioi || '........'}</p>
                  </div>
                  <p><strong>Khoa/phòng đang điều trị:</strong> {item.khoa_phong || '................................'}</p>
                </div>
                <div className="p-6 space-y-3 text-[11pt]">
                  <p className="font-bold uppercase bg-[#009900] text-white -mx-6 -mt-6 p-2 px-6 border-b-[1.5px] border-black text-[10pt]">2. Đối tượng xảy ra sự cố</p>
                  <div className="grid grid-cols-1 gap-2 pt-3 font-medium pl-2">
                    <p className="flex items-center gap-2"><Chk c={item.doi_tuong_xay_ra_sc === 'Người bệnh'} /> Người bệnh</p>
                    <p className="flex items-center gap-2"><Chk c={item.doi_tuong_xay_ra_sc === 'Người nhà/khách'} /> Người nhà / khách đến thăm</p>
                    <p className="flex items-center gap-2"><Chk c={item.doi_tuong_xay_ra_sc === 'Nhân viên y tế'} /> Nhân viên y tế</p>
                    <p className="flex items-center gap-2"><Chk c={item.doi_tuong_xay_ra_sc === 'Trang thiết bị/CSHT'} /> Trang thiết bị / Cơ sở hạ tầng</p>
                  </div>
                </div>
              </div>

              {/* Box 3: Location */}
              <div className="border-t-[1.5px] border-black p-2 px-6 font-bold bg-[#009900] text-white text-[10pt] uppercase tracking-widest border-b-[1.5px]">
                3. Nơi xảy ra sự cố:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 text-[11pt]">
                <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6 bg-white">
                  <p className="font-bold underline mb-3 text-[10pt]">Khoa / Phòng / Vị trí xảy ra sự cố:</p>
                  <p className="text-[12pt] font-medium leading-relaxed italic">{item.khoa_phong} / {item.noi_xay_ra_sc || '................................'}</p>
                </div>
                <div className="p-6">
                  <p className="font-bold underline mb-3 text-[10pt]">Vị trí cụ thể:</p>
                  <p className="text-[12pt] font-medium leading-relaxed italic">{item.vi_tri_cu_the || '..................................................................'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 border-t-[1.5px] border-black text-[11pt]">
                <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6">
                  <strong>Ngày xảy ra sự cố:</strong> {item.ngay_xay_ra_sc ? new Date(item.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : '..../..../.......'}
                </div>
                <div className="p-6">
                  <strong>Thời gian xảy ra:</strong> {item.thoi_gian || '.........................'}
                </div>
              </div>

              {/* Box 4: Descriptions */}
              <div className="border-t-[1.5px] border-black p-6 space-y-4 text-[11pt]">
                <p className="bg-[#009900] text-white p-2 px-4 font-bold uppercase text-[10pt] -mx-6 -mt-6 mb-4">II. MÔ TẢ CHI TIẾT SỰ CỐ:</p>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl italic font-medium min-h-[120px] whitespace-pre-wrap leading-relaxed text-[12pt] text-slate-800 shadow-inner">
                  {item.mo_ta_su_co || '........................................................................................................................................................................................................................................................................................................................................'}
                </div>
              </div>

              <div className="border-t-[1.5px] border-black p-6 space-y-6 text-[11pt]">
                <p className="bg-[#009900] text-white p-2 px-4 font-bold uppercase text-[10pt] -mx-6 -mt-6 mb-4">III. BIỆN PHÁP XỬ LÝ / GIẢI PHÁP:</p>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                    <p className="font-bold italic mb-2 text-blue-900 leading-tight border-b border-blue-100 pb-1">Xử lý ban đầu đã thực hiện:</p>
                    <p className="min-h-[50px] font-medium leading-relaxed pb-2">{item.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '............................................................................................................'}</p>
                  </div>
                  <div className="p-4 bg-green-50/30 rounded-2xl border border-green-100/50">
                    <p className="font-bold italic mb-2 text-green-900 leading-tight border-b border-green-100 pb-1">Đề xuất giải pháp ban đầu:</p>
                    <p className="min-h-[50px] font-medium leading-relaxed pb-2">{item.de_xuat_giai_phap_ban_dau || '............................................................................................................'}</p>
                  </div>
                </div>
              </div>

              {/* Box 5: Notifications */}
              <div className="border-t-[1.5px] border-black p-2 px-6 font-bold bg-[#009900] text-white text-[10pt] uppercase tracking-widest border-b-[1.5px]">
                IV. QUY TRÌNH THÔNG BÁO & GHI NHẬN:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 text-[11pt]">
                 <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6 space-y-3">
                    <p className="font-bold text-[#009900] text-[10pt] uppercase">1. BS điều trị / Người có trách nhiệm</p>
                    <p className="flex gap-10 font-medium pl-2">
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_bs_dieu_tri === 'Có'} /> Có</p> 
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_bs_dieu_tri === 'Không'} /> Không</p> 
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_bs_dieu_tri === 'Không ghi nhận'} /> KGN</p>
                    </p>
                 </div>
                 <div className="p-6 space-y-3 border-b-[1.5px] md:border-b-0 border-black">
                    <p className="font-bold text-[#009900] text-[10pt] uppercase">2. Ghi nhận vào HSBA</p>
                    <p className="flex gap-10 font-medium pl-2">
                       <p className="flex items-center gap-2"><Chk c={item.ghi_nhan_vao_hsba === 'Có'} /> Có</p> 
                       <p className="flex items-center gap-2"><Chk c={item.ghi_nhan_vao_hsba === 'Không'} /> Không</p> 
                       <p className="flex items-center gap-2"><Chk c={item.ghi_nhan_vao_hsba === 'Không ghi nhận'} /> KGN</p>
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 border-t-[1.5px] border-black text-[11pt]">
                 <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6 space-y-3">
                    <p className="font-bold text-[#009900] text-[10pt] uppercase">3. Thông báo cho người nhà</p>
                    <p className="flex gap-10 font-medium pl-2">
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_nguoi_nha === 'Có'} /> Có</p> 
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_nguoi_nha === 'Không'} /> Không</p> 
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_nguoi_nha === 'Không ghi nhận'} /> KGN</p>
                    </p>
                 </div>
                 <div className="p-6 space-y-3">
                    <p className="font-bold text-[#009900] text-[10pt] uppercase">4. Thông báo cho người bệnh</p>
                    <p className="flex gap-10 font-medium pl-2">
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_nguoi_benh === 'Có'} /> Có</p> 
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_nguoi_benh === 'Không'} /> Không</p> 
                       <p className="flex items-center gap-2"><Chk c={item.thong_bao_nguoi_benh === 'Không ghi nhận'} /> KGN</p>
                    </p>
                 </div>
              </div>

              {/* Box 6: Classification */}
              <div className="border-t-[1.5px] border-black p-6 text-[11pt]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                       <p className="bg-[#009900] text-white p-2 px-4 font-bold uppercase text-[10pt] mb-4">V. Phân loại ban đầu về sự cố:</p>
                       <div className="flex gap-10 font-medium pl-2">
                          <p className="flex items-center gap-2"><Chk c={item.phan_loai_ban_dau === 'Chưa xảy ra'} /> Chưa xảy ra</p> 
                          <p className="flex items-center gap-2"><Chk c={item.phan_loai_ban_dau === 'Đã xảy ra'} /> Đã xảy ra</p>
                       </div>
                    </div>
                    <div>
                       <p className="bg-[#009900] text-white p-2 px-4 font-bold uppercase text-[10pt] mb-4">VI. Mức độ ảnh hưởng ban đầu:</p>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                          <p className="flex items-center gap-2"><Chk c={item.muc_do_anh_huong === 'Nặng'} /> <span className="text-red-700 font-bold">Nặng</span></p> 
                          <p className="flex items-center gap-2"><Chk c={item.muc_do_anh_huong === 'Trung bình'} /> <span className="text-orange-700 font-bold">Trung bình</span></p> 
                          <p className="flex items-center gap-2"><Chk c={item.muc_do_anh_huong === 'Nhẹ'} /> <span className="text-blue-700 font-bold">Nhẹ</span></p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Box 7: Reporter */}
              <div className="border-t-[1.5px] border-black bg-[#009900] text-white p-2 px-6 font-bold text-[10pt] uppercase tracking-widest border-b-[1.5px]">
                 VII. Thông tin người báo cáo:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 text-[11pt]">
                 <div className="border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-black p-6 font-medium">
                    <p className="pb-2"><strong>Họ và tên:</strong> {item.ho_ten_nguoi_bc || '..........................................................'}</p>
                    <p><strong>Ngày báo cáo:</strong> ........................................</p>
                 </div>
                 <div className="p-6 font-medium flex flex-col justify-center space-y-4">
                    <p><strong>SĐT:</strong> {item.nguoi_bao_cao_sdt || '................'} &emsp; <strong>Email:</strong> {item.nguoi_bao_cao_email || '................................'}</p>
                    <div className="flex justify-center italic pt-4">
                        (Ký và ghi rõ họ tên)
                    </div>
                 </div>
              </div>
              <div className="border-t-[1.5px] border-black p-6 text-[11pt]">
                 <p className="font-bold uppercase mb-4 text-[#009900] text-[10pt]">Đối tượng / Chức danh người báo cáo:</p>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-medium pl-2">
                    <p className="flex items-center gap-2"><Chk c={item.nguoi_bao_cao_doi_tuong === 'Điều dưỡng'} /> Điều dưỡng</p>
                    <p className="flex items-center gap-2"><Chk c={item.nguoi_bao_cao_doi_tuong === 'Bác sỹ'} /> Bác sỹ</p>
                    <p className="flex items-center gap-2"><Chk c={item.nguoi_bao_cao_doi_tuong === 'Người bệnh'} /> Người bệnh</p>
                    <p className="flex items-center gap-1"><Chk c={item.nguoi_bao_cao_doi_tuong === 'Khác'} /> Khác: {item.nguoi_bao_cao_chuc_danh_khac}</p>
                 </div>
              </div>
            </div>

            {/* Status Log Section - Redesigned Timeline View */}
            <div className="mt-8 pt-2 no-print md:mt-24 md:pt-10">
              <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white font-sans">
                {/* Header Style from Image */}
                <div className="bg-slate-50/80 p-4 md:p-6 flex items-center gap-3 md:gap-4 border-b border-slate-100">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                    <History size={22} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-800 leading-tight">Lịch sử cập nhật trạng thái</h3>
                    <p className="text-[13px] text-slate-400 mt-0.5">{detailLogs.length} lần cập nhật</p>
                  </div>
                </div>

                <div className="p-4 md:p-8">
                  {detailLogs.length === 0 ? (
                    <div className="text-center py-10 italic text-slate-400">
                      Hệ thống chưa ghi nhận bất kỳ mốc xử lý nào cho báo cáo này.
                    </div>
                  ) : (
                    <div className="relative pl-7 md:pl-8 space-y-8 md:space-y-12">
                      {/* Vertical Timeline Line */}
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

                      {detailLogs.map((log, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-violet-400 border-2 border-white shadow-sm ring-4 ring-violet-50"></div>

                          <div className="space-y-3">
                            {/* Entry Header: Status + Timestamp */}
                            <div className="flex flex-wrap items-center gap-4">
                              <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                                log.trang_thai === 'Đã kết luận' ? 'bg-green-50 text-green-700 border-green-200' :
                                log.trang_thai === 'Đang phân tích' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {log.trang_thai}
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium italic">
                                <Clock size={13} strokeWidth={2.5} />
                                {new Date(log.thoi_gian_cap_nhat || '').toLocaleString('vi-VN', {
                                   hour: '2-digit', minute: '2-digit',
                                   day: '2-digit', month: '2-digit', year: 'numeric',
                                   hour12: false
                                })}
                              </div>
                            </div>

                            {/* Note / Content */}
                            {log.ghi_chu && (
                              <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                                {log.ghi_chu}
                              </p>
                            )}

                            {/* Author */}
                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-medium">
                               <User size={12} strokeWidth={3} />
                               {log.nguoi_cap_nhat}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};





