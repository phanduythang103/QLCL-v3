import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ArrowLeft, Save, X, Loader2, Search, Eye,
  List, BarChart3, FileSpreadsheet, Calendar, Building2, User, Clock,
  ClipboardList, AlertTriangle, CheckCircle2, XCircle, FileText, Bell, Timer, Repeat
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { JCICriticalResult } from '../types';
import {
  fetchCriticalResults, addCriticalResult, updateCriticalResult, deleteCriticalResult
} from '../readJCIIndicators';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { exportCriticalResultsReportExcel, CRITICAL_TIME_LIMIT } from '../utils/criticalResultsReportExcel';
import { CRITICAL_RESULT_NAMES } from '../utils/criticalResultNames';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];

const READ_BACK_OPTIONS = ['Có', 'Không'];

const emptyForm = (): Omit<JCICriticalResult, 'id' | 'created_at'> => ({
  thoi_gian_co_kq: '', thoi_gian_thong_bao: '', khoa_thong_bao: '', ho_ten_nb: '',
  nam_sinh: '', pid: '', khoa_dieu_tri: '', ten_kq_bao_dong: '', gia_tri_kq: '',
  nguoi_thong_bao: '', nguoi_nhan_thong_bao: '', xac_nhan_read_back: '',
  dat_khung_tg: false, ghi_chu: ''
});

const yearOf = (iso: string) => (iso || '').slice(0, 4);
const monthOf = (iso: string) => Number((iso || '').slice(5, 7));
const formatDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');
const fmtPct = (rate: number) => `${rate.toFixed(1)}%`;

/**
 * Thời gian thông báo (phút) - tự động suy ra từ khoảng cách giữa
 * "Ngày giờ có kết quả" và "Ngày giờ thông báo thành công".
 * Trả về null khi thiếu dữ liệu; trả về số âm khi nhập sai ngày giờ.
 */
export const notifyMinutes = (item: Pick<JCICriticalResult, 'thoi_gian_co_kq' | 'thoi_gian_thong_bao'>): number | null => {
  if (!item.thoi_gian_co_kq || !item.thoi_gian_thong_bao) return null;
  const from = new Date(item.thoi_gian_co_kq).getTime();
  const to = new Date(item.thoi_gian_thong_bao).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 60000);
};

/** Ngày giờ thông báo sớm hơn ngày giờ có kết quả -> dữ liệu sai */
export const hasDateError = (item: JCICriticalResult) => {
  const minutes = notifyMinutes(item);
  return minutes !== null && minutes < 0;
};

export type CriticalVerdict = 'Đạt' | 'Không đạt' | '⚠ Lỗi ngày giờ' | 'Chưa đủ dữ liệu';

/** Kết quả tự động: Đạt khi thông báo trong vòng 15 phút */
export const criticalVerdict = (item: JCICriticalResult): CriticalVerdict => {
  const minutes = notifyMinutes(item);
  if (minutes === null) return 'Chưa đủ dữ liệu';
  if (minutes < 0) return '⚠ Lỗi ngày giờ';
  return minutes <= CRITICAL_TIME_LIMIT ? 'Đạt' : 'Không đạt';
};

/** Bóc tách số lần liên hệ từ cú pháp "lần N" trong Ghi chú */
export const parseContactCount = (ghiChu?: string): number | null => {
  const match = (ghiChu || '').match(/lần\s*(\d+)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const JCICriticalResultsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [results, setResults] = useState<JCICriticalResult[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [activeTab, setActiveTab] = useState<'DANH_SACH' | 'BAO_CAO'>('DANH_SACH');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<JCICriticalResult | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [filterConfig, setFilterConfig] = useState({ year: '', department: '' });

  const currentUserName = useMemo(
    () => (user?.full_name || user?.username || '').trim(),
    [user]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, depts] = await Promise.all([fetchCriticalResults(), fetchDmDonVi()]);
      setResults(data);
      setDepartments(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notifierOptions = useMemo(() => {
    const names = [currentUserName, ...results.map(r => r.nguoi_thong_bao || '')]
      .map(n => n.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [results, currentUserName]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(new Date().getFullYear())]);
    results.forEach(r => {
      const y = yearOf(r.thoi_gian_co_kq);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [results]);

  const filteredData = useMemo(() => {
    const keyword = filterConfig.department.trim().toLowerCase();
    return results.filter(item => {
      const matchYear = !filterConfig.year || yearOf(item.thoi_gian_co_kq) === filterConfig.year;
      const matchDept = !keyword || (item.khoa_dieu_tri || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [results, filterConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // dat_khung_tg là cột suy ra - luôn tính lại từ 2 mốc thời gian
    const payload = { ...formData, dat_khung_tg: criticalVerdict(formData as JCICriticalResult) === 'Đạt' };
    try {
      if (editingId) {
        await updateCriticalResult(editingId, payload);
      } else {
        await addCriticalResult(payload);
      }
      setViewMode('LIST');
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Có lỗi xảy ra khi lưu bản ghi.');
    }
  };

  const handleEdit = (item: JCICriticalResult) => {
    setFormData({
      thoi_gian_co_kq: item.thoi_gian_co_kq ? new Date(item.thoi_gian_co_kq).toISOString().slice(0, 16) : '',
      thoi_gian_thong_bao: item.thoi_gian_thong_bao ? new Date(item.thoi_gian_thong_bao).toISOString().slice(0, 16) : '',
      khoa_thong_bao: item.khoa_thong_bao || '',
      ho_ten_nb: item.ho_ten_nb || '',
      nam_sinh: item.nam_sinh || '',
      pid: item.pid || '',
      khoa_dieu_tri: item.khoa_dieu_tri || '',
      ten_kq_bao_dong: item.ten_kq_bao_dong || '',
      gia_tri_kq: item.gia_tri_kq || '',
      nguoi_thong_bao: item.nguoi_thong_bao || '',
      nguoi_nhan_thong_bao: item.nguoi_nhan_thong_bao || '',
      xac_nhan_read_back: item.xac_nhan_read_back || '',
      dat_khung_tg: item.dat_khung_tg || false,
      ghi_chu: item.ghi_chu || ''
    });
    setEditingId(item.id || null);
    setViewMode('FORM');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      try {
        await deleteCriticalResult(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting:', err);
        alert('Có lỗi xảy ra khi xóa.');
      }
    }
  };

  const dateErrorCount = filteredData.filter(hasDateError).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (viewMode === 'FORM') {
    return (
      <CriticalForm
        formData={formData}
        setFormData={setFormData}
        isEditing={!!editingId}
        departments={departments}
        notifierOptions={notifierOptions}
        currentUserName={currentUserName}
        onSubmit={handleSave}
        onCancel={() => { setViewMode('LIST'); setEditingId(null); }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Thông báo KQ báo động CLS (IPSG.02.00)</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center sm:w-auto">
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 flex items-center justify-center sm:justify-start gap-2 rounded-xl border transition-all text-sm ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Search size={18} className="shrink-0" />
            <span>Bộ lọc</span>
          </button>
          <button onClick={() => setActiveTab('DANH_SACH')} className={`px-4 py-2 flex items-center justify-center sm:justify-start gap-2 rounded-xl border transition-all text-sm ${activeTab === 'DANH_SACH' ? 'bg-teal-50 border-teal-200 text-teal-700 font-medium' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <List size={18} className="shrink-0" />
            <span className="sm:hidden">DS thu thập</span>
            <span className="hidden sm:inline">Danh sách thu thập</span>
          </button>
          <button onClick={() => setActiveTab('BAO_CAO')} className={`px-4 py-2 flex items-center justify-center sm:justify-start gap-2 rounded-xl border transition-all text-sm ${activeTab === 'BAO_CAO' ? 'bg-teal-50 border-teal-200 text-teal-700 font-medium' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <BarChart3 size={18} className="shrink-0" />
            <span>Báo cáo quy trình</span>
          </button>
          <button onClick={() => { setFormData(emptyForm()); setEditingId(null); setViewMode('FORM'); }} className="px-4 py-2 flex items-center justify-center sm:justify-start gap-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm text-sm">
            <Plus size={18} className="shrink-0" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Năm</label>
              <select value={filterConfig.year} onChange={e => setFilterConfig({ ...filterConfig, year: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="">Tất cả các năm</option>
                {yearOptions.map(y => <option key={y} value={y}>Năm {y}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Khoa điều trị</label>
              <input
                type="text"
                list="critical-department-options"
                value={filterConfig.department}
                onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })}
                placeholder="Gõ từ khóa để tìm khoa..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <datalist id="critical-department-options">
                {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
              </datalist>
            </div>
          </div>
        </div>
      )}

      {/* Ô kiểm tra dữ liệu */}
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${dateErrorCount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
        {dateErrorCount > 0 ? <AlertTriangle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={20} className="shrink-0 mt-0.5" />}
        <div className="text-sm">
          <p className="font-bold">Kiểm tra dữ liệu</p>
          <p>
            {dateErrorCount > 0
              ? `Phát hiện ${dateErrorCount} bản ghi có Ngày giờ thông báo sớm hơn Ngày giờ có kết quả — cần rà soát và sửa lại.`
              : 'Không phát hiện bản ghi nào có Ngày giờ thông báo sớm hơn Ngày giờ có kết quả.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tổng số KQ báo động</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{filteredData.length}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Đạt khung ≤15 phút</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{filteredData.filter(i => criticalVerdict(i) === 'Đạt').length}</p>
          </div>
        </div>
      </div>

      {activeTab === 'DANH_SACH' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left jci-list-table">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-3 md:p-4">Ngày giờ có KQ</th>
                  <th className="p-3 md:p-4">Khoa điều trị</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Người bệnh / PID</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Tên KQ báo động</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Thời gian TB (phút)</th>
                  <th className="p-3 md:p-4">Kết quả</th>
                  <th className="p-3 md:p-4 md:w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có dữ liệu kết quả báo động</td></tr>
                ) : (
                  filteredData.map(item => {
                    const minutes = notifyMinutes(item);
                    const verdict = criticalVerdict(item);
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${hasDateError(item) ? 'bg-red-50' : ''}`}>
                        <td className="p-3 md:p-4 font-medium text-slate-700 whitespace-nowrap">{formatDateTime(item.thoi_gian_co_kq)}</td>
                        <td className="p-3 md:p-4">{item.khoa_dieu_tri}</td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{item.ho_ten_nb}{item.pid ? ` / ${item.pid}` : ''}</td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{item.ten_kq_bao_dong}</td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{minutes === null ? '—' : minutes}</td>
                        <td className="p-3 md:p-4"><VerdictBadge verdict={verdict} /></td>
                        <td className="p-3 md:p-4 jci-actions-cell">
                          <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-2">
                            <button onClick={() => setDetailItem(item)} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-medium active:scale-95 transition-transform md:border-0 md:bg-transparent md:p-1.5 md:hover:bg-teal-50" title="Xem chi tiết">
                              <Eye size={16} className="shrink-0" />
                              <span className="md:hidden">Xem</span>
                            </button>
                            <button onClick={() => handleEdit(item)} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium active:scale-95 transition-transform md:border-0 md:bg-transparent md:p-1.5 md:hover:bg-blue-50" title="Sửa">
                              <Edit2 size={16} className="shrink-0" />
                              <span className="md:hidden">Sửa</span>
                            </button>
                            <button onClick={() => handleDelete(item.id!)} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium active:scale-95 transition-transform md:border-0 md:bg-transparent md:p-1.5 md:hover:bg-red-50" title="Xóa">
                              <Trash2 size={16} className="shrink-0" />
                              <span className="md:hidden">Xóa</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <CriticalProcessReport data={results} departments={departments} />
      )}

      {detailItem && <CriticalDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
};

const VerdictBadge: React.FC<{ verdict: CriticalVerdict }> = ({ verdict }) => {
  const map: Record<CriticalVerdict, { cls: string; Icon: any }> = {
    'Đạt': { cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
    'Không đạt': { cls: 'bg-red-100 text-red-700', Icon: XCircle },
    '⚠ Lỗi ngày giờ': { cls: 'bg-amber-100 text-amber-700', Icon: AlertTriangle },
    'Chưa đủ dữ liệu': { cls: 'bg-slate-100 text-slate-500', Icon: AlertTriangle }
  };
  const { cls, Icon } = map[verdict];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${cls}`}>
      <Icon size={14} className="shrink-0" />{verdict.replace('⚠ ', '')}
    </span>
  );
};

// ---------------------------------------------------------------------------
// FORM NHẬP KẾT QUẢ BÁO ĐỘNG
// ---------------------------------------------------------------------------

interface CriticalFormProps {
  formData: Omit<JCICriticalResult, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<JCICriticalResult, 'id' | 'created_at'>>>;
  isEditing: boolean;
  departments: any[];
  notifierOptions: string[];
  currentUserName: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const CriticalForm: React.FC<CriticalFormProps> = ({
  formData, setFormData, isEditing, departments, notifierOptions, currentUserName, onSubmit, onCancel
}) => {
  const minutes = notifyMinutes(formData as JCICriticalResult);
  const verdict = criticalVerdict(formData as JCICriticalResult);

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800">
          {isEditing ? 'Cập nhật' : 'Thêm mới'} Phiếu thông báo kết quả báo động cận lâm sàng
        </h3>
        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <p className="text-xs text-slate-500 italic">
          Biểu mẫu QLCL.QT.16.V1-1. Mỗi phiếu = 1 kết quả báo động cận lâm sàng. Chỉ cần nhập đúng 2 mốc thời gian — thời gian thông báo và kết quả được tính tự động.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Ngày giờ có kết quả <span className="text-red-500">*</span></label>
            <input type="datetime-local" required value={formData.thoi_gian_co_kq} onChange={e => setFormData({ ...formData, thoi_gian_co_kq: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Ngày giờ thông báo thành công <span className="text-red-500">*</span></label>
            <input type="datetime-local" required value={formData.thoi_gian_thong_bao} onChange={e => setFormData({ ...formData, thoi_gian_thong_bao: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
            <p className="text-xs text-slate-500">Kết quả gần nửa đêm: nhớ đổi sang ngày hôm sau (VD: 23:58 → 00:08 hôm sau).</p>
          </div>

          {/* Ô tự động tính */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Thời gian thông báo <span className="text-xs font-normal text-slate-400">(tự động)</span></label>
              <div className="w-full px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-800 flex items-center gap-2">
                <Timer size={18} />
                <span className="font-bold">{minutes === null ? '—' : `${minutes} phút`}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Kết quả <span className="text-xs font-normal text-slate-400">(tự động, khung ≤{CRITICAL_TIME_LIMIT} phút)</span></label>
              <div className={`w-full px-4 py-2.5 rounded-xl border flex items-center gap-2 ${verdict === 'Đạt' ? 'bg-green-50 border-green-200 text-green-700' : verdict === 'Không đạt' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                {verdict === 'Đạt' ? <CheckCircle2 size={18} /> : verdict === 'Không đạt' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
                <span className="font-bold">{verdict}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Khoa thông báo <span className="text-red-500">*</span></label>
            <input type="text" required list="critical-form-department-options" value={formData.khoa_thong_bao} onChange={e => setFormData({ ...formData, khoa_thong_bao: e.target.value })} placeholder="Gõ từ khóa để tìm khoa..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Khoa điều trị <span className="text-xs font-normal text-slate-400">(khoa nhận thông báo)</span> <span className="text-red-500">*</span></label>
            <input type="text" required list="critical-form-department-options" value={formData.khoa_dieu_tri} onChange={e => setFormData({ ...formData, khoa_dieu_tri: e.target.value })} placeholder="Gõ từ khóa để tìm khoa..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <datalist id="critical-form-department-options">
            {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
          </datalist>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Họ tên người bệnh <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.ho_ten_nb} onChange={e => setFormData({ ...formData, ho_ten_nb: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Nguyễn Văn A" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Ngày tháng năm sinh</label>
            <input type="text" value={formData.nam_sinh} onChange={e => setFormData({ ...formData, nam_sinh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="01/01/1950" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Mã số bệnh án (PID)</label>
            <input type="text" value={formData.pid} onChange={e => setFormData({ ...formData, pid: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="12345678" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Tên kết quả báo động <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              list="critical-result-name-options"
              value={formData.ten_kq_bao_dong}
              onChange={e => setFormData({ ...formData, ten_kq_bao_dong: e.target.value })}
              placeholder="Gõ từ khóa để tìm... (VD: Creatinin)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
            />
            <datalist id="critical-result-name-options">
              {CRITICAL_RESULT_NAMES.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Giá trị kết quả <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.gia_tri_kq} onChange={e => setFormData({ ...formData, gia_tri_kq: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="980 μmol/L" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Người thông báo</label>
            <input
              type="text"
              list="critical-notifier-options"
              value={formData.nguoi_thong_bao}
              onChange={e => setFormData({ ...formData, nguoi_thong_bao: e.target.value })}
              placeholder={currentUserName ? `Gợi ý: ${currentUserName}` : 'Nhập tên người thông báo...'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
            />
            <datalist id="critical-notifier-options">
              {notifierOptions.map(n => <option key={n} value={n} />)}
            </datalist>
            {currentUserName && formData.nguoi_thong_bao !== currentUserName && (
              <button type="button" onClick={() => setFormData({ ...formData, nguoi_thong_bao: currentUserName })} className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
                <User size={14} /> Dùng tên của tôi ({currentUserName})
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Người nhận thông báo</label>
            <input type="text" value={formData.nguoi_nhan_thong_bao} onChange={e => setFormData({ ...formData, nguoi_nhan_thong_bao: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="BS chỉ định Phạm Văn C" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Xác nhận read-back</label>
            <select value={formData.xac_nhan_read_back} onChange={e => setFormData({ ...formData, xac_nhan_read_back: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
              <option value="">Chọn...</option>
              {READ_BACK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Ghi chú <span className="text-xs font-normal text-slate-400">(số lần liên hệ / leo thang)</span>
            </label>
            <input type="text" value={formData.ghi_chu} onChange={e => setFormData({ ...formData, ghi_chu: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder='Ghi theo cú pháp có chữ "lần", VD: Liên hệ lần 2 (bậc ①)' />
            <p className="text-xs text-slate-500">
              Để báo cáo phân tổ đúng, hãy ghi số lần liên hệ theo cú pháp <span className="font-semibold">"lần N"</span>.
              {parseContactCount(formData.ghi_chu) !== null && (
                <span className="text-teal-600 font-medium"> Đã nhận diện: liên hệ lần {parseContactCount(formData.ghi_chu)}.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Hủy bỏ</button>
        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
          <Save size={18} /> Lưu lại
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// MODAL CHI TIẾT
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{ icon: any; label: string; value?: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || '—'}</p>
    </div>
  </div>
);

const CriticalDetailModal: React.FC<{ item: JCICriticalResult; onClose: () => void }> = ({ item, onClose }) => {
  const minutes = notifyMinutes(item);
  const verdict = criticalVerdict(item);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Chi tiết kết quả báo động</h3>
              <p className="text-xs text-slate-500">Thông báo KQ báo động cận lâm sàng (IPSG.02.00)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <Timer size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Thời gian thông báo (tự động)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-800">{minutes === null ? '—' : `${minutes} phút`}</span>
                <VerdictBadge verdict={verdict} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={Calendar} label="Ngày giờ có kết quả" value={formatDateTime(item.thoi_gian_co_kq)} />
            <InfoRow icon={Clock} label="Ngày giờ thông báo thành công" value={formatDateTime(item.thoi_gian_thong_bao)} />
            <InfoRow icon={Building2} label="Khoa thông báo" value={item.khoa_thong_bao} />
            <InfoRow icon={Building2} label="Khoa điều trị" value={item.khoa_dieu_tri} />
            <InfoRow icon={User} label="Người bệnh" value={`${item.ho_ten_nb}${item.nam_sinh ? ` (${item.nam_sinh})` : ''}`} />
            <InfoRow icon={FileText} label="Mã số bệnh án (PID)" value={item.pid} />
            <InfoRow icon={ClipboardList} label="Tên kết quả báo động" value={item.ten_kq_bao_dong} />
            <InfoRow icon={AlertTriangle} label="Giá trị kết quả" value={item.gia_tri_kq} />
            <InfoRow icon={User} label="Người thông báo" value={item.nguoi_thong_bao} />
            <InfoRow icon={User} label="Người nhận thông báo" value={item.nguoi_nhan_thong_bao} />
            <InfoRow
              icon={item.xac_nhan_read_back === 'Có' ? CheckCircle2 : XCircle}
              label="Xác nhận read-back"
              value={item.xac_nhan_read_back}
            />
            <InfoRow
              icon={Repeat}
              label="Số lần liên hệ"
              value={parseContactCount(item.ghi_chu) !== null ? `Lần ${parseContactCount(item.ghi_chu)}` : 'Không ghi nhận'}
            />
          </div>

          {item.ghi_chu && <InfoRow icon={FileText} label="Ghi chú" value={item.ghi_chu} />}
        </div>

        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BÁO CÁO QUY TRÌNH (IPSG.02.00)
// ---------------------------------------------------------------------------

const ReportTable: React.FC<{
  index: string;
  title: string;
  note?: string;
  headers: string[];
  children: React.ReactNode;
}> = ({ index, title, note, headers, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="bg-[#2E75B6] px-4 py-3">
      <h4 className="font-bold text-white text-sm uppercase tracking-wide">{index}. {title}</h4>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left jci-report-table">
        <thead className="bg-[#1F4E79] text-white font-bold">
          <tr>
            {headers.map((h, i) => (
              <th key={h} className={`p-3 align-middle ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
    {note && <p className="px-4 py-3 text-xs italic text-slate-500 leading-relaxed border-t border-slate-100">{note}</p>}
  </div>
);

const CriticalProcessReport: React.FC<{ data: JCICriticalResult[]; departments: any[] }> = ({ data, departments }) => {
  const currentYear = new Date().getFullYear();
  const [reportFilter, setReportFilter] = useState({ year: String(currentYear), department: '' });
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    data.forEach(r => {
      const y = yearOf(r.thoi_gian_co_kq);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data, currentYear]);

  const scoped = useMemo(() => {
    const keyword = reportFilter.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = yearOf(item.thoi_gian_co_kq) === reportFilter.year;
      const matchDept = !keyword || (item.khoa_dieu_tri || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, reportFilter]);

  const loiNgayGio = useMemo(() => scoped.filter(hasDateError).length, [scoped]);

  const byMonth = useMemo(
    () => MONTHS.map(m => {
      const rows = scoped.filter(i => monthOf(i.thoi_gian_co_kq) === m);
      return {
        thang: m,
        label: `Tháng ${m}`,
        tong: rows.length,
        dat: rows.filter(i => criticalVerdict(i) === 'Đạt').length
      };
    }),
    [scoped]
  );

  // Bảng thời gian trung bình loại bỏ bản ghi lỗi ngày giờ
  const byMonthTime = useMemo(
    () => MONTHS.map(m => {
      const rows = scoped.filter(i => monthOf(i.thoi_gian_co_kq) === m && !hasDateError(i));
      const valid = rows.map(notifyMinutes).filter((v): v is number => v !== null);
      return {
        thang: m,
        label: `Tháng ${m}`,
        hopLe: valid.length,
        tongPhut: valid.reduce((s, v) => s + v, 0)
      };
    }),
    [scoped]
  );

  const byQuarter = useMemo(
    () => QUARTERS.map(q => {
      const months = byMonth.filter(m => Math.ceil(m.thang / 3) === q);
      return {
        quy: q,
        label: `Quý ${q}`,
        tong: months.reduce((s, m) => s + m.tong, 0),
        dat: months.reduce((s, m) => s + m.dat, 0)
      };
    }),
    [byMonth]
  );

  const bucketBy = (getKey: (i: JCICriticalResult) => string) => {
    const counts = new Map<string, number>();
    scoped.forEach(i => {
      const key = (getKey(i) || '').trim() || 'Chưa xác định';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, soLuong]) => ({ label, soLuong }))
      .sort((a, b) => b.soLuong - a.soLuong || a.label.localeCompare(b.label, 'vi'));
  };

  const byKhoa = useMemo(() => bucketBy(i => i.khoa_dieu_tri || ''), [scoped]);
  const byTenKq = useMemo(() => bucketBy(i => i.ten_kq_bao_dong || ''), [scoped]);

  const bySoLan = useMemo(() => {
    const counts = { mot: 0, hai: 0, baPlus: 0, khong: 0 };
    scoped.forEach(i => {
      const n = parseContactCount(i.ghi_chu);
      if (n === null) counts.khong += 1;
      else if (n === 1) counts.mot += 1;
      else if (n === 2) counts.hai += 1;
      else counts.baPlus += 1;
    });
    return [
      { label: '1 lần liên hệ', soLuong: counts.mot },
      { label: '2 lần liên hệ', soLuong: counts.hai },
      { label: '≥ 3 lần liên hệ', soLuong: counts.baPlus },
      { label: 'Không ghi nhận số lần (Ghi chú trống/không theo mẫu "lần N")', soLuong: counts.khong }
    ];
  }, [scoped]);

  const totals = useMemo(() => {
    const valid = scoped.filter(i => !hasDateError(i)).map(notifyMinutes).filter((v): v is number => v !== null);
    return {
      tong: scoped.length,
      dat: scoped.filter(i => criticalVerdict(i) === 'Đạt').length,
      hopLe: valid.length,
      tongPhut: valid.reduce((s, v) => s + v, 0)
    };
  }, [scoped]);
  const khongDat = totals.tong - totals.dat;

  const chartData = useMemo(
    () => byMonth.map((m, idx) => ({
      ten: m.label,
      tyLe: Number((m.tong > 0 ? (m.dat / m.tong) * 100 : 0).toFixed(1)),
      tbPhut: Number((byMonthTime[idx].hopLe > 0 ? byMonthTime[idx].tongPhut / byMonthTime[idx].hopLe : 0).toFixed(2))
    })),
    [byMonth, byMonthTime]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCriticalResultsReportExcel({
        year: reportFilter.year,
        department: reportFilter.department.trim(),
        loiNgayGio,
        byMonth: byMonth.map(m => ({ label: m.label, tong: m.tong, dat: m.dat })),
        byMonthTime: byMonthTime.map(m => ({ label: m.label, hopLe: m.hopLe, tongPhut: m.tongPhut })),
        byQuarter: byQuarter.map(q => ({ label: q.label, tong: q.tong, dat: q.dat })),
        byKhoa, byTenKq, bySoLan,
        totals
      });
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const Breakdown: React.FC<{ index: string; title: string; firstHeader: string; rows: { label: string; soLuong: number }[]; note?: string }> = ({ index, title, firstHeader, rows, note }) => {
    const tong = rows.reduce((s, r) => s + r.soLuong, 0);
    return (
      <ReportTable index={index} title={title} note={note} headers={[firstHeader, 'Số lượng', 'Tỷ lệ %']}>
        {rows.length === 0 ? (
          <tr><td colSpan={3} className="p-6 text-center text-slate-500">Chưa có dữ liệu trong kỳ báo cáo</td></tr>
        ) : (
          rows.map(r => (
            <tr key={r.label} className="hover:bg-slate-50">
              <td className="p-3 text-slate-700">{r.label}</td>
              <td className="p-3 text-center">{r.soLuong}</td>
              <td className="p-3 text-center">{fmtPct(tong > 0 ? (r.soLuong / tong) * 100 : 0)}</td>
            </tr>
          ))
        )}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng</td>
          <td className="p-3 text-center">{tong}</td>
          <td className="p-3 text-center">{tong > 0 ? '100.0%' : '0.0%'}</td>
        </tr>
      </ReportTable>
    );
  };

  return (
    <div className="space-y-6">
      {/* Bộ lọc + xuất Excel */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Năm</label>
            <select value={reportFilter.year} onChange={e => setReportFilter({ ...reportFilter, year: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
              {yearOptions.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Đơn vị</label>
            <input
              type="text"
              list="critical-report-department-options"
              value={reportFilter.department}
              onChange={e => setReportFilter({ ...reportFilter, department: e.target.value })}
              placeholder="Gõ từ khóa để tìm đơn vị... (bỏ trống = tất cả)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <datalist id="critical-report-department-options">
              {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
            </datalist>
          </div>

          <button onClick={handleExport} disabled={exporting} className="w-full px-4 py-2.5 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-70">
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel (A4 dọc)'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Dữ liệu lấy từ bảng DS thu thập · Năm {reportFilter.year}
          {reportFilter.department.trim() ? ` · Đơn vị chứa "${reportFilter.department.trim()}"` : ' · Tất cả đơn vị'}
          {` · ${totals.tong} kết quả báo động`}
        </p>
      </div>

      {/* Ô kiểm tra dữ liệu của kỳ báo cáo */}
      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${loiNgayGio > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
        {loiNgayGio > 0 ? <AlertTriangle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={20} className="shrink-0 mt-0.5" />}
        <div className="text-sm">
          <p className="font-bold">Kiểm tra dữ liệu</p>
          <p>
            {loiNgayGio > 0
              ? `Phát hiện ${loiNgayGio} bản ghi có Ngày giờ thông báo sớm hơn Ngày giờ có kết quả — các bản ghi này bị loại khỏi bảng thời gian trung bình.`
              : 'Không phát hiện bản ghi nào có Ngày giờ thông báo sớm hơn Ngày giờ có kết quả.'}
          </p>
        </div>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 text-center text-base sm:text-lg mb-4">
          Xu hướng tỷ lệ đạt khung ≤{CRITICAL_TIME_LIMIT} phút và thời gian thông báo trung bình theo tháng
        </h4>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="ten" angle={-45} textAnchor="end" interval={0} height={64} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis yAxisId="left" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: '#475569' }} width={56} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => v.toFixed(0)} tick={{ fontSize: 11, fill: '#b45309' }} width={48} />
              <RechartsTooltip />
              <Legend verticalAlign="bottom" height={24} />
              <ReferenceLine yAxisId="right" y={CRITICAL_TIME_LIMIT} stroke="#dc2626" strokeDasharray="6 4" label={{ value: `Khung ${CRITICAL_TIME_LIMIT} phút`, position: 'right', style: { fontSize: 10, fill: '#dc2626' } }} />
              <Line yAxisId="left" type="linear" dataKey="tyLe" name="Tỷ lệ đạt %" stroke="#4472C4" strokeWidth={2.5} dot={{ r: 3, fill: '#4472C4' }} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="linear" dataKey="tbPhut" name="Thời gian TB (phút)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Theo tháng */}
      <ReportTable
        index="1"
        title="Tổng hợp theo tháng"
        headers={['Tháng', 'Tổng số kết quả báo động (Mẫu số)', 'Số đạt khung thời gian (Tử số)', 'Tỷ lệ đạt %']}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.tong}</td>
            <td className="p-3 text-center">{m.dat}</td>
            <td className="p-3 text-center">{fmtPct(m.tong > 0 ? (m.dat / m.tong) * 100 : 0)}</td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.tong}</td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(totals.tong > 0 ? (totals.dat / totals.tong) * 100 : 0)}</td>
        </tr>
      </ReportTable>

      {/* 2. Thời gian trung bình */}
      <ReportTable
        index="2"
        title="Thời gian trung bình thông báo kết quả báo động theo tháng"
        note="Các bản ghi bị nghi ngờ nhập sai ngày giờ được loại khỏi bảng này để không làm sai lệch số liệu trung bình."
        headers={['Tháng', 'Số kết quả hợp lệ', 'Tổng thời gian thông báo (phút)', 'Thời gian trung bình (phút)']}
      >
        {byMonthTime.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.hopLe}</td>
            <td className="p-3 text-center">{m.tongPhut}</td>
            <td className="p-3 text-center font-medium">{(m.hopLe > 0 ? m.tongPhut / m.hopLe : 0).toFixed(2)}</td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Trung bình năm</td>
          <td className="p-3 text-center">{totals.hopLe}</td>
          <td className="p-3 text-center">{totals.tongPhut}</td>
          <td className="p-3 text-center">{(totals.hopLe > 0 ? totals.tongPhut / totals.hopLe : 0).toFixed(2)}</td>
        </tr>
      </ReportTable>

      {/* 3. Theo quý */}
      <ReportTable
        index="3"
        title="Tổng hợp theo quý"
        headers={['Quý', 'Tổng số kết quả báo động', 'Số đạt khung thời gian', 'Tỷ lệ đạt %']}
      >
        {byQuarter.map(q => (
          <tr key={q.quy} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{q.label}</td>
            <td className="p-3 text-center">{q.tong}</td>
            <td className="p-3 text-center">{q.dat}</td>
            <td className="p-3 text-center">{fmtPct(q.tong > 0 ? (q.dat / q.tong) * 100 : 0)}</td>
          </tr>
        ))}
      </ReportTable>

      <Breakdown index="4" title="Phân tổ theo khoa điều trị (khoa nhận thông báo)" firstHeader="Khoa điều trị" rows={byKhoa} />
      <Breakdown index="5" title="Phân tổ theo tên kết quả báo động" firstHeader="Tên kết quả báo động" rows={byTenKq} />
      <Breakdown
        index="6"
        title="Phân tổ theo số lần liên hệ / mức độ leo thang"
        firstHeader="Số lần liên hệ"
        rows={bySoLan}
        note='Số lần liên hệ được bóc tách tự động từ cụm từ "lần N" trong Ghi chú. Bản ghi không ghi theo cú pháp này được tính vào nhóm "Không ghi nhận số lần".'
      />

      {/* 7. Kết quả chung */}
      <ReportTable
        index="7"
        title={`Kết quả chung (Đạt/Không đạt khung thời gian ≤${CRITICAL_TIME_LIMIT} phút)`}
        note="Mục tiêu IPSG.02.00: 100% kết quả báo động được thông báo trực tiếp trong vòng 15 phút. Chỉ số thu thập toàn bộ (100%) kết quả báo động phát sinh trong tháng — không áp dụng lấy mẫu."
        headers={['Kết quả', 'Số lượng', 'Tỷ lệ %']}
      >
        <tr className="hover:bg-slate-50">
          <td className="p-3">
            <span className="inline-flex items-center gap-1.5 text-green-700 font-medium"><CheckCircle2 size={16} /> Đạt</span>
          </td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(totals.tong > 0 ? (totals.dat / totals.tong) * 100 : 0)}</td>
        </tr>
        <tr className="hover:bg-slate-50">
          <td className="p-3">
            <span className="inline-flex items-center gap-1.5 text-red-700 font-medium"><XCircle size={16} /> Không đạt</span>
          </td>
          <td className="p-3 text-center">{khongDat}</td>
          <td className="p-3 text-center">{fmtPct(totals.tong > 0 ? (khongDat / totals.tong) * 100 : 0)}</td>
        </tr>
      </ReportTable>
    </div>
  );
};
