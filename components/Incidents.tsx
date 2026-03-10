import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, AlertTriangle,
  ArrowRight, BrainCircuit, Save, X, Sparkles,
  ChevronDown, ChevronUp, CheckCircle2, AlertOctagon,
  BarChart2, PieChart as PieChartIcon, Calendar, Download, Printer,
  History, Edit2, Trash2, Eye, ArrowLeft, Target, Users, LayoutGrid, User, CheckSquare,
  LayoutDashboard, List, FileCheck, Files, Menu, RefreshCw, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { fetchBaoCaoScyk, addBaoCaoScyk, updateBaoCaoScyk, deleteBaoCaoScyk, fetchLatestBaoCaoScykByYear } from '../readBaoCaoScyk';
import { addScykTienDoLog, fetchScykTienDoLogs, fetchLatestLogPerIncident, ScykTienDoLog } from '../readScykTienDoLogs';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';
import { analyzeWithGemini } from '../geminiClient';
import VerificationMinutes from './VerificationMinutes';
import IncidentAnalysis from './IncidentAnalysis';
import BcCqyList from './BcCqyList';

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
    case 'Đang phân tích': return 'Đang phân tích (RCA)';
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
    { id: 'OVERVIEW', label: 'Tổng quan SCYK', icon: <LayoutDashboard size={20} /> },
    { id: 'LIST', label: 'Danh sách SCYK', icon: <List size={20} /> },
    { id: 'VERIFICATION', label: 'DS Biên bản xác minh', icon: <FileCheck size={20} /> },
    { id: 'ANALYSIS', label: 'Phân tích RCA', icon: <BrainCircuit size={20} /> },
    { id: 'REPORTS', label: 'Báo cáo Cục Quân y', icon: <Files size={20} /> },
  ].filter(item => canView('INCIDENTS', item.id));

  const [activeMenu, setActiveMenu] = useState<MenuItem>(menuItems[0]?.id as MenuItem || 'OVERVIEW');
  const [viewMode, setViewMode] = useState<ViewMode>(activeMenu === 'OVERVIEW' ? 'STATS' : 'LIST'); 
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation - Horizontal Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="p-3 md:px-4 md:pt-4 md:pb-0">
          <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-1 md:overflow-x-auto hide-scrollbar">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleMenuChange(item.id as MenuItem)}
                className={`relative flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 py-2 px-1 md:px-5 md:py-3 text-label uppercase transition-all rounded-xl md:rounded-none md:rounded-t-lg border md:border-transparent ${activeMenu === item.id
                  ? 'text-primary-700 bg-primary-50 border-primary-200 shadow-sm md:shadow-none md:bg-primary-50/50 md:border-transparent font-black'
                  : 'text-black/40 bg-white border-slate-200 hover:text-black hover:bg-slate-50 md:bg-transparent md:border-transparent font-bold'
                  }`}
              >
                <div className="scale-90 md:scale-100">{item.icon}</div>
                <span className="text-center md:text-left leading-tight md:whitespace-nowrap tracking-tight">{item.label}</span>
                {activeMenu === item.id && (
                  <div className="hidden md:block absolute bottom-0 left-0 right-0 h-[3px] bg-primary-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]"></div>
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
                        onDelete={async (id) => {
                          if (window.confirm('Bạn có chắc muốn xóa?')) {
                            await deleteBaoCaoScyk(id);
                            loadData();
                          }
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

                  {/* 4. Reports List (Cục Quân y) */}
                  {activeMenu === 'REPORTS' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200 h-full">
                      <BcCqyList />
                    </div>
                  )}

                  {/* 5. Analysis (RCA) */}
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
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
          <div className="p-5 space-y-4 border-b border-slate-100">
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 line-clamp-2">
              <span className="font-medium">Sự cố: </span>{item.mo_ta_su_co || 'N/A'}
            </div>
            <div>
              <label className="block text-label font-black text-black uppercase mb-2">Trạng thái xử lý</label>
              <select
                value={trangThai}
                onChange={e => setTrangThai(e.target.value)}
                className="w-full border-b-2 border-slate-200 focus:border-primary-500 bg-transparent py-2 text-input font-black text-black uppercase transition-all cursor-pointer outline-none"
              >
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-label font-black text-black uppercase mb-2">Ghi chú tiến độ <span className="text-black/30 font-bold">(tùy chọn)</span></label>
              <textarea
                value={ghiChu}
                onChange={e => setGhiChu(e.target.value)}
                rows={2}
                placeholder="Nhập nội dung cập nhật..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-input font-bold text-black focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none resize-none bg-slate-50/50"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-black/40 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <User size={14} />
              <span>Người cập nhật: <span className="text-black">{user?.full_name || user?.username || 'Chưa đăng nhập'}</span></span>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
          </div>

          {/* Log history section */}
          <div className="p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
              <History size={14} className="text-slate-400" /> Lịch sử cập nhật
            </h3>
            {loadingLogs ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                Đang tải...
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Chưa có lịch sử cập nhật.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log, idx) => (
                  <div key={log.id || idx} className="flex gap-3">
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-400 mt-0.5 shrink-0" />
                      {idx < logs.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    {/* Log content */}
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(log.trang_thai || '')}`}>
                          {log.trang_thai || 'Không rõ'}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatTime(log.thoi_gian_cap_nhat || '')}</span>
                      </div>
                      {log.ghi_chu && (
                        <p className="text-xs text-slate-600 leading-relaxed">{log.ghi_chu}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <User size={10} /> {log.nguoi_cap_nhat}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    // 0. Unit filtering for normal users
    if (!isAdmin && uDept) {
      const iDept1 = (inc.khoa_phong || '').trim().toLowerCase();
      const iDept2 = (inc.don_vi_bao_cao || '').trim().toLowerCase();
      const matchesUnit = (iDept1 !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1))) ||
                         (iDept2 !== '' && (uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
      if (!matchesUnit) return false;
    }

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
      {/* Quick Status Filter Bar */}
      {showStatusFilter && (
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-center">
          <button onClick={() => setActiveStatusFilter('ALL')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'ALL' ? 'bg-black text-white shadow-lg' : 'bg-white text-black/40 border border-slate-200 hover:bg-slate-100'}`}>Tất cả</button>
          <button onClick={() => setActiveStatusFilter('CHUA_TIEP_NHAN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'CHUA_TIEP_NHAN' ? 'bg-red-600 text-white shadow-lg shadow-red-900/10' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}>Chưa tiếp nhận</button>
          <button onClick={() => setActiveStatusFilter('DA_TIEP_NHAN')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DA_TIEP_NHAN' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/10' : 'bg-white text-cyan-600 border border-cyan-200 hover:bg-cyan-50'}`}>Đã tiếp nhận</button>
          <button onClick={() => setActiveStatusFilter('DANG_XAC_MINH')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DANG_XAC_MINH' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/10' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'}`}>Đang xác minh</button>
          <button onClick={() => setActiveStatusFilter('DANG_PHAN_TICH')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all tracking-wider active:scale-95 ${activeStatusFilter === 'DANG_PHAN_TICH' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/10' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}>Đang phân tích (RCA)</button>
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
        {canCreate('INCIDENTS', 'LIST') && (
          <button
            onClick={onCreate}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-label font-black uppercase flex items-center transition-all shadow-xl shadow-red-900/10 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" /> Báo cáo sự cố mới
          </button>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 border-collapse border border-slate-300">
          <thead className="bg-[#009900] text-white font-black text-table uppercase text-center align-middle h-14">
            <tr>
              <th className="border border-slate-300 px-3 py-2 w-48 text-left">Ngày báo cáo</th>
              <th className="border border-slate-300 px-3 py-2 w-48 text-left">Đơn vị báo cáo</th>
              <th className="border border-slate-300 px-3 py-2">Mô tả sự cố</th>
              <th className="border border-slate-300 px-3 py-2 w-40">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Không tìm thấy sự cố phù hợp</td></tr>
            ) : (
              filteredData.map((inc) => {
                const uDept = user?.department?.trim().toLowerCase() || '';
                const iDept1 = (inc.khoa_phong || '').trim().toLowerCase();
                const iDept2 = (inc.don_vi_bao_cao || '').trim().toLowerCase();
                const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));

                return (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors text-table text-black group">
                    <td className="border border-slate-300 px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="font-black text-black">{inc.ngay_bao_cao ? new Date(inc.ngay_bao_cao).toLocaleDateString('vi-VN') : '---'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] w-fit font-bold ${inc.hinh_thuc_bao_cao === 'Bắt buộc' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {inc.hinh_thuc_bao_cao || 'Tự nguyện'}
                        </span>
                        <div className="mt-1 text-[10px] font-mono text-slate-400 italic">#{inc.so_bc_ma_scyk}</div>
                      </div>
                    </td>
                    <td className="border border-slate-300 px-3 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-black text-black text-table">{inc.khoa_phong || inc.don_vi_bao_cao || '---'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">Đối tượng: {inc.doi_tuong_xay_ra_sc || '---'}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={12} /> Xảy ra: {inc.ngay_xay_ra_sc ? new Date(inc.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : '---'}
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-300 px-3 py-4 max-w-md">
                      <div className="flex flex-col gap-2">
                        <p className="line-clamp-3 text-black leading-relaxed font-medium text-sm">{inc.mo_ta_su_co || '---'}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 ${getStatusColor(inc.trang_thai)} bg-white border border-current uppercase`}>
                            {getStatusLabel(inc.trang_thai)}
                          </span>
                          {inc.phan_loai_ban_dau && (
                            <span className="text-[10px] text-black/40 font-black bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 uppercase">{inc.phan_loai_ban_dau}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-300 px-3 py-4 w-44">
                      <div className="grid grid-cols-2 gap-1.5 uppercase">
                        <button onClick={() => onView(inc)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200 shadow-sm active:scale-95">
                          <Eye size={12} /> Xem
                        </button>
                        {canUpdate('INCIDENTS', 'LIST') && isOwnUnit && (
                          <button onClick={() => onEdit(inc)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all border border-amber-200 shadow-sm active:scale-95">
                            <Edit2 size={12} /> Sửa
                          </button>
                        )}
                        {isAdmin && canUpdate('INCIDENTS', 'LIST') && (
                          <button onClick={() => setUpdatingItem(inc)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200 shadow-sm active:scale-95">
                            <RefreshCw size={12} /> Tiến độ
                          </button>
                        )}
                        {canDelete('INCIDENTS', 'LIST') && isOwnUnit && (
                          <button onClick={() => onDelete(inc.id)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200 shadow-sm active:scale-95">
                            <Trash2 size={12} /> Xóa
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
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${inc.hinh_thuc_bao_cao === 'Bắt buộc' ? 'text-red-600' : 'text-blue-600'}`}>
                      {inc.hinh_thuc_bao_cao || 'Tự nguyện'}
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
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
          <p className="text-black/40 text-[10px] font-black uppercase tracking-widest mb-1">Tổng số sự cố</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-black">{totalCount}</h3>
            <span className="text-[10px] text-black/40 font-bold uppercase">Sự cố</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <p className="text-red-600/60 text-[10px] font-black uppercase tracking-widest mb-1">Sự cố nặng (E-I)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-red-600">{severeCount}</h3>
            <span className="text-[10px] text-red-400 font-bold uppercase">Ca</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
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
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'FISHBONE' | '5WHYS'>('FISHBONE');
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
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

YÊU CẦU BẮT BUỘNG:
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

TRẢ VỀ DƯỚNG DẠNG JSON HỢP LỆ (không có markdown code block, chỉ JSON thuần) với cấu trúc CHÍNH XÁC sau:
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
          <button onClick={onBack} className="flex items-center text-black/60 hover:text-black transition-colors font-black uppercase text-[10px] tracking-widest">
            <ArrowLeft size={20} className="mr-2" /> Quay lại danh sách
          </button>
          <div className="flex flex-wrap gap-2 uppercase">
            <button
              onClick={() => document.getElementById('ai-rca-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 shadow-xl shadow-indigo-900/20 active:scale-95"
            >
              <BrainCircuit size={18} /> Phân tích sự cố
            </button>
            <button onClick={handlePrint} className="bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-200 shadow-sm active:scale-95">
              <Download size={16} /> Tải PDF
            </button>
          </div>
        </div>

        {/* Main Content Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
            <div>
              <h1 className="text-title font-black text-black uppercase tracking-tight">{item.so_bc_ma_scyk || 'Chưa có mã'}</h1>
              <p className="text-black/40 mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                <Calendar size={14} /> Ngày báo cáo: {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : '---'}
                <span className="mx-2 text-black/10">•</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${item.trang_thai === 'Mới' || item.trang_thai === 'Chưa tiếp nhận' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {getStatusLabel(item.trang_thai)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-1">Mức độ</span>
              <span className="text-label font-black text-black uppercase">{item.phan_loai_ban_dau || 'Chưa phân loại'}</span>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <h3 className="text-label font-black text-blue-700 uppercase tracking-wide">Thông tin sự cố</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <p className="text-table"><span className="font-black text-black uppercase text-[10px] block opacity-40">Khoa phòng</span> <span className="text-black font-black uppercase">{item.don_vi_bao_cao}</span></p>
                  <p className="text-table"><span className="font-black text-black uppercase text-[10px] block opacity-40">Vị trí</span> <span className="text-black font-black uppercase">{item.noi_xay_ra_sc} - {item.vi_tri_cu_the}</span></p>
                  <p className="text-table"><span className="font-black text-black uppercase text-[10px] block opacity-40">Thời gian xảy ra</span> <span className="text-black font-black uppercase">{item.ngay_xay_ra_sc ? new Date(item.ngay_xay_ra_sc).toLocaleDateString('vi-VN') : ''} {item.thoi_gian}</span></p>
                  <p className="text-table"><span className="font-black text-black uppercase text-[10px] block opacity-40">Đối tượng</span> <span className="text-black font-black uppercase">{item.doi_tuong_xay_ra_sc}</span></p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-3 ml-1">Mô tả chi tiết</h3>
                <div className="p-5 bg-yellow-50/50 border border-yellow-200 rounded-xl text-black leading-relaxed text-sm font-medium italic">
                  {item.mo_ta_su_co || 'Không có mô tả chi tiết.'}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-3 ml-1">Thông tin người bệnh</h3>
                <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center text-black/40">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-label font-black text-black uppercase tracking-tight">{item.ho_ten_nb}</p>
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">HSBA: {item.so_benh_an}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 uppercase">
                    <p className="text-table"><span className="text-black/30 text-[9px] font-black block mb-0.5">Ngày sinh</span> <span className="text-black font-black">{item.ngay_sinh ? new Date(item.ngay_sinh).toLocaleDateString('vi-VN') : '---'}</span></p>
                    <p className="text-table"><span className="text-black/30 text-[9px] font-black block mb-0.5">Giới tính</span> <span className="text-black font-black">{item.gioi}</span></p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide">Mô tả chi tiết</h3>
                </div>
                <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-xl space-y-3">
                  <p className="text-sm leading-relaxed">{item.mo_ta_su_co || '---'}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-green-50 border border-green-100 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <h3 className="text-label font-black text-green-700 uppercase tracking-wide">Xử trí ban đầu</h3>
                </div>
                <div className="p-4 bg-green-50/50 border border-green-100 rounded-xl space-y-4">
                  <p className="text-table"><span className="font-black text-green-800 text-[10px] block opacity-60 mb-1 uppercase">Giải pháp khắc phục</span> <span className="text-black font-medium text-sm italic">{item.de_xuat_giai_phap_ban_dau || '---'}</span></p>
                  <p className="text-table"><span className="font-black text-green-800 text-[10px] block opacity-60 mb-1 uppercase">Điều trị bổ sung</span> <span className="text-black font-medium text-sm italic">{item.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '---'}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Log Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-50 to-slate-50 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <History size={16} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Lịch sử cập nhật trạng thái</h2>
              <p className="text-xs text-slate-500">{detailLogs.length} lần cập nhật</p>
            </div>
          </div>
          <div className="p-6">
            {detailLogs.length === 0 ? (
              <div className="flex items-center gap-3 text-slate-400 text-sm py-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <History size={14} className="text-slate-300" />
                </div>
                Chưa có lịch sử cập nhật nào.
              </div>
            ) : (
              <div className="space-y-0">
                {detailLogs.map((log, idx) => {
                  const statusColors: Record<string, string> = {
                    'Mới': 'bg-red-100 text-red-700',
                    'Chưa tiếp nhận': 'bg-red-100 text-red-700',
                    'Đã tiếp nhận': 'bg-cyan-100 text-cyan-700',
                    'Đang xác minh': 'bg-blue-100 text-blue-700',
                    'Đang phân tích': 'bg-amber-100 text-amber-700',
                    'Đã kết luận': 'bg-green-100 text-green-700',
                  };
                  const badgeClass = statusColors[log.trang_thai || ''] || 'bg-slate-100 text-slate-600';
                  const timeStr = log.thoi_gian_cap_nhat
                    ? new Date(log.thoi_gian_cap_nhat).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '';
                  return (
                    <div key={log.id || idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-violet-400 mt-1.5 shrink-0 ring-2 ring-violet-100" />
                        {idx < detailLogs.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>{log.trang_thai || 'Không rõ'}</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {timeStr}
                          </span>
                        </div>
                        {log.ghi_chu && (
                          <p className="text-sm text-slate-600 leading-relaxed mb-1">{log.ghi_chu}</p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <User size={11} /> {log.nguoi_cap_nhat}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                    {(() => {
                      const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
                      const uDept = user?.department?.trim().toLowerCase() || '';
                      const iDept1 = (item.khoa_phong || '').trim().toLowerCase();
                      const iDept2 = (item.don_vi_bao_cao || '').trim().toLowerCase();
                      const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));

                      return item.trang_thai !== 'Đã kết luận' && canUpdate('INCIDENTS', 'ANALYSIS') && isOwnUnit && (
                        <button
                          onClick={() => onStatusUpdate('Đã kết luận')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:scale-105"
                        >
                          <CheckCircle2 size={18} /> Xác nhận hoàn thành & Kết luận
                        </button>
                      );
                    })()}
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
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">{label}</label>
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleChange(field, opt)}
            className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${value === opt ? 'bg-white text-primary-700 shadow-sm' : 'text-black/30 hover:text-black/60'}`}
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
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0 z-20">
        <h2 className="text-title font-black text-black uppercase tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shadow-inner">
            <FileText size={24} />
          </div>
          {editingItem ? 'Cập nhật báo cáo sự cố' : 'Báo cáo sự cố mới'}
          {formData.so_bc_ma_scyk && <span className="hidden md:inline-flex bg-slate-100 text-black/40 text-[10px] px-3 py-1.5 rounded-lg font-black border border-slate-200 uppercase tracking-widest ml-4">{formData.so_bc_ma_scyk}</span>}
        </h2>
        <button onClick={onCancel} className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-black/20">
          <X size={24} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Section 1: Thông tin chung & Người bệnh */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black shadow-sm shadow-blue-900/10">1</span>
                Thông tin chung & Người bệnh
              </h3>
              {openSections.includes('general') ? <ChevronUp size={20} className="text-black/20" /> : <ChevronDown size={20} className="text-black/20" />}
            </button>

            {openSections.includes('general') && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-200">
                {/* Form fields here... */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ToggleGroup label="Hình thức báo cáo" field="hinh_thuc_bao_cao" options={['Tự nguyện', 'Bắt buộc']} value={formData.hinh_thuc_bao_cao} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đơn vị báo cáo <span className="text-red-500">*</span></label>
                    <select value={formData.don_vi_bao_cao} onChange={(e) => { handleChange('don_vi_bao_cao', e.target.value); const u = dmDonVi.find(d => d.ten_don_vi === e.target.value); if (u) generateNextCode(u.ma_don_vi); }} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer bg-white transition-all">
                      <option value="">-- Chọn đơn vị --</option>
                      {dmDonVi.map(u => <option key={u.id} value={u.ten_don_vi}>{u.ten_don_vi}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Ngày báo cáo</label>
                    <input type="date" value={formData.ngay_bao_cao} onChange={(e) => handleChange('ngay_bao_cao', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 my-2 pt-4"></div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Họ và tên người bệnh <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.ho_ten_nb} onChange={e => handleChange('ho_ten_nb', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" placeholder="Nhập họ tên NB..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Số HSBA</label>
                    <input type="text" value={formData.so_benh_an} onChange={e => handleChange('so_benh_an', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Giới tính</label>
                    <select value={formData.gioi} onChange={e => handleChange('gioi', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white cursor-pointer transition-all">
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Ngày sinh</label>
                  <input type="date" value={formData.ngay_sinh} onChange={e => handleChange('ngay_sinh', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đối tượng xảy ra</label>
                  <select value={formData.doi_tuong_xay_ra_sc} onChange={e => handleChange('doi_tuong_xay_ra_sc', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white cursor-pointer transition-all">
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
              className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-black shadow-sm shadow-amber-900/10">2</span>
                Thông tin sự cố
              </h3>
              {openSections.includes('details') ? <ChevronUp size={20} className="text-black/20" /> : <ChevronDown size={20} className="text-black/20" />}
            </button>
            {openSections.includes('details') && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-200 uppercase font-black">
                <div className="space-y-2">
                  <label className="text-[10px] text-black/40 uppercase tracking-widest ml-1">Nơi xảy ra sự cố</label>
                  <input type="text" value={formData.noi_xay_ra_sc} onChange={e => handleChange('noi_xay_ra_sc', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" placeholder="VD: Hành lang, Phòng mổ..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-black/40 uppercase tracking-widest ml-1">Vị trí cụ thể</label>
                  <input type="text" value={formData.vi_tri_cu_the} onChange={e => handleChange('vi_tri_cu_the', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" placeholder="VD: Giường số 5..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-black/40 uppercase tracking-widest ml-1">Khoa / Phòng</label>
                  <input type="text" value={formData.khoa_phong} onChange={e => handleChange('khoa_phong', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-black/40 uppercase tracking-widest ml-1">Ngày xảy ra</label>
                    <input type="date" value={formData.ngay_xay_ra_sc} onChange={e => handleChange('ngay_xay_ra_sc', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-black/40 uppercase tracking-widest ml-1">Giờ xảy ra</label>
                    <input type="time" value={formData.thoi_gian} onChange={e => handleChange('thoi_gian', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] text-black/40 uppercase tracking-widest ml-1">Mô tả sự cố</label>
                  <textarea rows={4} value={formData.mo_ta_su_co} onChange={e => handleChange('mo_ta_su_co', e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-input font-medium outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all resize-none" placeholder="Mô tả chi tiết diễn biến..." />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
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
              className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
            >
              <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-black shadow-sm shadow-emerald-900/10">3</span>
                Xử lý & Người báo cáo
              </h3>
              {openSections.includes('handling') ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {openSections.includes('handling') && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in slide-in-from-top-2 duration-200">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Xử lý ban đầu đã thực hiện</label>
                  <textarea rows={2} value={formData.dieu_tri_xy_ly_ban_dau_da_thuc_hien} onChange={e => handleChange('dieu_tri_xy_ly_ban_dau_da_thuc_hien', e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-input font-medium outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all resize-none italic" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đề xuất giải pháp phòng ngừa</label>
                  <textarea rows={2} value={formData.de_xuat_giai_phap_ban_dau} onChange={e => handleChange('de_xuat_giai_phap_ban_dau', e.target.value)} className="w-full border border-slate-200 rounded-xl p-4 text-input font-medium outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all resize-none italic" />
                </div>

                <div className="md:col-span-2 border-t border-slate-100 my-2 pt-4"></div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Người báo cáo</label>
                  <input type="text" value={formData.ho_ten_nguoi_bc} onChange={e => handleChange('ho_ten_nguoi_bc', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input type="text" value={formData.sdt} onChange={e => handleChange('sdt', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Vai trò người báo cáo</label>
                  <select value={formData.vaitro_nguoi_bc} onChange={e => handleChange('vaitro_nguoi_bc', e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-input font-black uppercase outline-none focus:ring-4 focus:ring-primary-500/10 bg-white cursor-pointer transition-all">
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
      <div className="border-t border-slate-200 bg-white p-6 flex items-center justify-end gap-4 z-20 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
        <button onClick={onCancel} className="px-8 py-3 rounded-xl text-black/40 font-black uppercase text-[10px] tracking-widest hover:text-black hover:bg-slate-50 transition-all">Hủy bỏ</button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
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