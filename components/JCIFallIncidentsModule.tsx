import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ArrowLeft, Save, X, Loader2, Search, Eye,
  List, BarChart3, FileSpreadsheet, Calendar, Building2, User, Clock,
  ClipboardList, AlertTriangle, CheckCircle2, XCircle, Activity, FileText, TrendingDown
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { JCIFallIncident } from '../types';
import {
  fetchFallIncidents, addFallIncident, updateFallIncident, deleteFallIncident,
  fetchFallPatientDays, upsertFallPatientDays
} from '../readJCIIndicators';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { exportFallReportExcel, fallRate, benchmarkLabel, FALL_BENCHMARK } from '../utils/fallReportExcel';

// --- Danh mục dùng cho dropdown (bám theo sheet DanhMuc của bản mẫu) ---
export const THANG_DIEM_OPTIONS = [
  'Morse Fall Scale - MFS (người lớn)',
  'Humpty Dumpty Fall Scale - HDFS (trẻ em)',
  'Obstetric Fall Risk Assessment System - OFRAS-M (sản khoa)',
  'Edmonson Psychiatric Fall Risk Assessment Tool - EPFRAT (tâm thần)'
];

export const MUC_NGUY_CO_OPTIONS = ['Thấp', 'Trung bình', 'Cao'];

export const DIA_DIEM_OPTIONS = [
  'Cạnh giường bệnh',
  'Trong nhà vệ sinh/nhà tắm',
  'Hành lang',
  'Khi di chuyển/vận chuyển người bệnh',
  'Phòng khám/khu vực chờ',
  'Cầu thang/thang máy',
  'Khác (ghi rõ tại Ghi chú)'
];

/** Mức độ tổn thương theo Thông tư 43/2018/TT-BYT */
export const TON_THUONG_OPTIONS = [
  'NC0 - Chưa xảy ra',
  'NC1 - Tổn thương nhẹ',
  'NC2 - Tổn thương trung bình',
  'NC3 - Tổn thương nặng'
];

export const CAN_THIEP_OPTIONS = ['Đầy đủ', 'Không đầy đủ'];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];

const emptyForm = (nguoiTongHop = ''): Omit<JCIFallIncident, 'id' | 'created_at'> => ({
  ma_bao_cao: '', thoi_gian_nga: '', khoa_dieu_tri: '', ho_ten_nb: '', nam_sinh: '',
  thang_diem_ap_dung: '', muc_nguy_co: '', hoan_canh: '', muc_do_ton_thuong: '',
  can_thiep_truoc_nga: '', da_tai_danh_gia: false, da_danh_gia_mt: false,
  nguoi_tong_hop: nguoiTongHop, ghi_chu: ''
});

const yearOf = (iso: string) => (iso || '').slice(0, 4);
const monthOf = (iso: string) => Number((iso || '').slice(5, 7));
const formatDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');
const fmtRate = (rate: number) => rate.toFixed(2);
const fmtPct = (rate: number) => `${rate.toFixed(1)}%`;

export const JCIFallIncidentsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [incidents, setIncidents] = useState<JCIFallIncident[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [activeTab, setActiveTab] = useState<'DANH_SACH' | 'BAO_CAO'>('DANH_SACH');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<JCIFallIncident | null>(null);
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
      const [data, depts] = await Promise.all([fetchFallIncidents(), fetchDmDonVi()]);
      setIncidents(data);
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

  const summarizerOptions = useMemo(() => {
    const names = [currentUserName, ...incidents.map(i => i.nguoi_tong_hop || '')]
      .map(n => n.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [incidents, currentUserName]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(new Date().getFullYear())]);
    incidents.forEach(i => {
      const y = yearOf(i.thoi_gian_nga);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [incidents]);

  const filteredData = useMemo(() => {
    const keyword = filterConfig.department.trim().toLowerCase();
    return incidents.filter(item => {
      const matchYear = !filterConfig.year || yearOf(item.thoi_gian_nga) === filterConfig.year;
      const matchDept = !keyword || (item.khoa_dieu_tri || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [incidents, filterConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFallIncident(editingId, formData);
      } else {
        await addFallIncident(formData);
      }
      setViewMode('LIST');
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Có lỗi xảy ra khi lưu bản ghi.');
    }
  };

  const handleEdit = (item: JCIFallIncident) => {
    setFormData({
      ma_bao_cao: item.ma_bao_cao || '',
      thoi_gian_nga: item.thoi_gian_nga ? new Date(item.thoi_gian_nga).toISOString().slice(0, 16) : '',
      khoa_dieu_tri: item.khoa_dieu_tri || '',
      ho_ten_nb: item.ho_ten_nb || '',
      nam_sinh: item.nam_sinh || '',
      thang_diem_ap_dung: item.thang_diem_ap_dung || '',
      muc_nguy_co: item.muc_nguy_co || '',
      hoan_canh: item.hoan_canh || '',
      muc_do_ton_thuong: item.muc_do_ton_thuong || '',
      can_thiep_truoc_nga: item.can_thiep_truoc_nga || '',
      da_tai_danh_gia: item.da_tai_danh_gia || false,
      da_danh_gia_mt: item.da_danh_gia_mt || false,
      nguoi_tong_hop: item.nguoi_tong_hop || '',
      ghi_chu: item.ghi_chu || ''
    });
    setEditingId(item.id || null);
    setViewMode('FORM');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      try {
        await deleteFallIncident(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting:', err);
        alert('Có lỗi xảy ra khi xóa.');
      }
    }
  };

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
      <FallForm
        formData={formData}
        setFormData={setFormData}
        isEditing={!!editingId}
        departments={departments}
        summarizerOptions={summarizerOptions}
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
          <h2 className="text-xl font-bold text-slate-800">Tỷ suất người bệnh ngã (AOP.02.00)</h2>
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
          <button onClick={() => { setFormData(emptyForm(currentUserName)); setEditingId(null); setViewMode('FORM'); }} className="px-4 py-2 flex items-center justify-center sm:justify-start gap-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm text-sm">
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
                list="fall-department-options"
                value={filterConfig.department}
                onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })}
                placeholder="Gõ từ khóa để tìm khoa..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <datalist id="fall-department-options">
                {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
              </datalist>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tổng số ca ngã</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{filteredData.length}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Có tổn thương</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {filteredData.filter(i => (i.muc_do_ton_thuong || '').startsWith('NC1') || (i.muc_do_ton_thuong || '').startsWith('NC2') || (i.muc_do_ton_thuong || '').startsWith('NC3')).length}
            </p>
          </div>
        </div>
      </div>

      {activeTab === 'DANH_SACH' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left jci-list-table">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-3 md:p-4">Thời gian ngã</th>
                  <th className="p-3 md:p-4">Khoa điều trị</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Người bệnh</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Mức nguy cơ</th>
                  <th className="p-3 md:p-4">Mức độ tổn thương</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Người tổng hợp</th>
                  <th className="p-3 md:p-4 md:w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có dữ liệu sự cố ngã</td></tr>
                ) : (
                  filteredData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 md:p-4 font-medium text-slate-700 whitespace-nowrap">{formatDateTime(item.thoi_gian_nga)}</td>
                      <td className="p-3 md:p-4">{item.khoa_dieu_tri}</td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">{item.ho_ten_nb}</td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">{item.muc_nguy_co}</td>
                      <td className="p-3 md:p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${(item.muc_do_ton_thuong || '').startsWith('NC0') ? 'bg-green-100 text-green-700' : (item.muc_do_ton_thuong || '').startsWith('NC3') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.muc_do_ton_thuong || '—'}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">{item.nguoi_tong_hop}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <FallProcessReport data={incidents} departments={departments} />
      )}

      {detailItem && <FallDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FORM NHẬP SỰ CỐ NGÃ
// ---------------------------------------------------------------------------

interface FallFormProps {
  formData: Omit<JCIFallIncident, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<JCIFallIncident, 'id' | 'created_at'>>>;
  isEditing: boolean;
  departments: any[];
  summarizerOptions: string[];
  currentUserName: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const FallForm: React.FC<FallFormProps> = ({
  formData, setFormData, isEditing, departments, summarizerOptions, currentUserName, onSubmit, onCancel
}) => (
  <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
      <h3 className="text-lg font-bold text-slate-800">
        {isEditing ? 'Cập nhật' : 'Thêm mới'} Phiếu ghi nhận sự cố người bệnh ngã
      </h3>
      <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
        <X size={20} />
      </button>
    </div>

    <div className="p-4 sm:p-6 space-y-6">
      <p className="text-xs text-slate-500 italic">
        Chỉ ghi nhận các trường hợp ngã đã thực sự xảy ra — không tính near-miss (suýt ngã, được hỗ trợ kịp thời).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Mã báo cáo</label>
          <input type="text" value={formData.ma_bao_cao} onChange={e => setFormData({ ...formData, ma_bao_cao: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="VD: SC-2026-001" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ngày giờ xảy ra ngã <span className="text-red-500">*</span></label>
          <input type="datetime-local" required value={formData.thoi_gian_nga} onChange={e => setFormData({ ...formData, thoi_gian_nga: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Khoa điều trị <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            list="fall-form-department-options"
            value={formData.khoa_dieu_tri}
            onChange={e => setFormData({ ...formData, khoa_dieu_tri: e.target.value })}
            placeholder="Gõ từ khóa để tìm khoa/phòng..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
          />
          <datalist id="fall-form-department-options">
            {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Họ và tên người bệnh <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.ho_ten_nb} onChange={e => setFormData({ ...formData, ho_ten_nb: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Nguyễn Văn A" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Năm sinh</label>
          <input type="text" value={formData.nam_sinh} onChange={e => setFormData({ ...formData, nam_sinh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="1965" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Thang điểm áp dụng</label>
          <select value={formData.thang_diem_ap_dung} onChange={e => setFormData({ ...formData, thang_diem_ap_dung: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn thang điểm...</option>
            {THANG_DIEM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Mức độ nguy cơ ngã <span className="text-xs font-normal text-slate-400">(lần đánh giá gần nhất)</span></label>
          <select value={formData.muc_nguy_co} onChange={e => setFormData({ ...formData, muc_nguy_co: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn mức độ...</option>
            {MUC_NGUY_CO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Địa điểm / hoàn cảnh xảy ra ngã</label>
          <select value={formData.hoan_canh} onChange={e => setFormData({ ...formData, hoan_canh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn địa điểm/hoàn cảnh...</option>
            {DIA_DIEM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Mức độ tổn thương <span className="text-xs font-normal text-slate-400">(TT 43/2018/TT-BYT)</span></label>
          <select value={formData.muc_do_ton_thuong} onChange={e => setFormData({ ...formData, muc_do_ton_thuong: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn mức độ tổn thương...</option>
            {TON_THUONG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Can thiệp đang áp dụng trước khi ngã</label>
          <select value={formData.can_thiep_truoc_nga} onChange={e => setFormData({ ...formData, can_thiep_truoc_nga: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn mức độ can thiệp...</option>
            {CAN_THIEP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Người thực hiện tổng hợp</label>
          <input
            type="text"
            list="fall-summarizer-options"
            value={formData.nguoi_tong_hop}
            onChange={e => setFormData({ ...formData, nguoi_tong_hop: e.target.value })}
            placeholder={currentUserName ? `Gợi ý: ${currentUserName}` : 'Nhập tên người tổng hợp...'}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
          />
          <datalist id="fall-summarizer-options">
            {summarizerOptions.map(n => <option key={n} value={n} />)}
          </datalist>
          {currentUserName && formData.nguoi_tong_hop !== currentUserName && (
            <button type="button" onClick={() => setFormData({ ...formData, nguoi_tong_hop: currentUserName })} className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
              <User size={14} /> Dùng tên của tôi ({currentUserName})
            </button>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.da_tai_danh_gia} onChange={e => setFormData({ ...formData, da_tai_danh_gia: e.target.checked })} className="w-5 h-5 text-teal-600 rounded" />
            <span className="text-sm font-medium text-slate-700">Đã tái đánh giá + điều chỉnh can thiệp sau ngã</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.da_danh_gia_mt} onChange={e => setFormData({ ...formData, da_danh_gia_mt: e.target.checked })} className="w-5 h-5 text-teal-600 rounded" />
            <span className="text-sm font-medium text-slate-700">Đã đánh giá môi trường tại chỗ sau ngã</span>
          </label>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
          <textarea rows={2} value={formData.ghi_chu} onChange={e => setFormData({ ...formData, ghi_chu: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Ghi rõ nếu chọn Khác ở địa điểm/hoàn cảnh..." />
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

const FallDetailModal: React.FC<{ item: JCIFallIncident; onClose: () => void }> = ({ item, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <TrendingDown size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Chi tiết sự cố ngã</h3>
            <p className="text-xs text-slate-500">Tỷ suất người bệnh ngã (AOP.02.00)</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={FileText} label="Mã báo cáo" value={item.ma_bao_cao} />
          <InfoRow icon={Calendar} label="Ngày giờ xảy ra ngã" value={formatDateTime(item.thoi_gian_nga)} />
          <InfoRow icon={Building2} label="Khoa điều trị" value={item.khoa_dieu_tri} />
          <InfoRow icon={User} label="Người bệnh" value={`${item.ho_ten_nb}${item.nam_sinh ? ` (${item.nam_sinh})` : ''}`} />
          <InfoRow icon={ClipboardList} label="Thang điểm áp dụng" value={item.thang_diem_ap_dung} />
          <InfoRow icon={AlertTriangle} label="Mức độ nguy cơ ngã" value={item.muc_nguy_co} />
          <InfoRow icon={Clock} label="Địa điểm / hoàn cảnh" value={item.hoan_canh} />
          <InfoRow icon={Activity} label="Mức độ tổn thương" value={item.muc_do_ton_thuong} />
          <InfoRow icon={ClipboardList} label="Can thiệp trước khi ngã" value={item.can_thiep_truoc_nga} />
          <InfoRow icon={User} label="Người tổng hợp" value={item.nguoi_tong_hop} />
          <InfoRow
            icon={item.da_tai_danh_gia ? CheckCircle2 : XCircle}
            label="Tái đánh giá + điều chỉnh can thiệp sau ngã"
            value={item.da_tai_danh_gia ? 'Có' : 'Không'}
          />
          <InfoRow
            icon={item.da_danh_gia_mt ? CheckCircle2 : XCircle}
            label="Đánh giá môi trường tại chỗ sau ngã"
            value={item.da_danh_gia_mt ? 'Có' : 'Không'}
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

// ---------------------------------------------------------------------------
// BÁO CÁO QUY TRÌNH (AOP.02.00)
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

const BenchmarkBadge: React.FC<{ soCa: number; ngay: number }> = ({ soCa, ngay }) => {
  const label = benchmarkLabel(soCa, ngay);
  if (label === 'Chưa có mẫu số') return <span className="text-slate-400 text-xs">Chưa có mẫu số</span>;
  const ok = label === 'Đạt mốc';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{label}
    </span>
  );
};

const FallProcessReport: React.FC<{ data: JCIFallIncident[]; departments: any[] }> = ({ data, departments }) => {
  const currentYear = new Date().getFullYear();
  const [reportFilter, setReportFilter] = useState({ year: String(currentYear), department: '' });
  const [patientDays, setPatientDays] = useState<number[]>(Array(12).fill(0));
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    data.forEach(i => {
      const y = yearOf(i.thoi_gian_nga);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data, currentYear]);

  // Mẫu số nhập tay, lưu theo từng năm
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchFallPatientDays(Number(reportFilter.year));
      if (cancelled) return;
      const next = Array(12).fill(0);
      rows.forEach(r => {
        if (r.thang >= 1 && r.thang <= 12) next[r.thang - 1] = r.so_ngay_nam_vien || 0;
      });
      setPatientDays(next);
    })();
    return () => { cancelled = true; };
  }, [reportFilter.year]);

  const savePatientDays = async (thang: number, value: number) => {
    setSavingMonth(thang);
    try {
      await upsertFallPatientDays(Number(reportFilter.year), thang, value);
    } catch (err) {
      console.error(err);
      alert('Không lưu được số ngày nằm viện. Kiểm tra lại kết nối hoặc chạy script alter_jci_fall_aop0200.sql.');
    } finally {
      setSavingMonth(null);
    }
  };

  const scoped = useMemo(() => {
    const keyword = reportFilter.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = yearOf(item.thoi_gian_nga) === reportFilter.year;
      const matchDept = !keyword || (item.khoa_dieu_tri || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, reportFilter]);

  const byMonth = useMemo(
    () => MONTHS.map(m => ({
      thang: m,
      label: `Tháng ${m}`,
      soCa: scoped.filter(i => monthOf(i.thoi_gian_nga) === m).length,
      ngayNamVien: patientDays[m - 1] || 0
    })),
    [scoped, patientDays]
  );

  const byQuarter = useMemo(
    () => QUARTERS.map(q => {
      const months = byMonth.filter(m => Math.ceil(m.thang / 3) === q);
      return {
        quy: q,
        label: `Quý ${q}`,
        soCa: months.reduce((s, m) => s + m.soCa, 0),
        ngayNamVien: months.reduce((s, m) => s + m.ngayNamVien, 0)
      };
    }),
    [byMonth]
  );

  /** Gom nhóm theo một trường; `fixed` là danh mục cố định luôn hiển thị */
  const bucketBy = (getKey: (i: JCIFallIncident) => string, fixed?: string[]) => {
    const counts = new Map<string, number>();
    (fixed || []).forEach(k => counts.set(k, 0));
    scoped.forEach(i => {
      const key = (getKey(i) || '').trim() || 'Chưa xác định';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, soCa]) => ({ label, soCa }));
  };

  const byKhoa = useMemo(() => bucketBy(i => i.khoa_dieu_tri || '').sort((a, b) => b.soCa - a.soCa || a.label.localeCompare(b.label, 'vi')), [scoped]);
  const byMucNguyCo = useMemo(() => bucketBy(i => i.muc_nguy_co || '', MUC_NGUY_CO_OPTIONS), [scoped]);
  const byThangDiem = useMemo(() => bucketBy(i => i.thang_diem_ap_dung || '', THANG_DIEM_OPTIONS), [scoped]);
  const byDiaDiem = useMemo(() => bucketBy(i => i.hoan_canh || '', DIA_DIEM_OPTIONS), [scoped]);
  const byTonThuong = useMemo(() => bucketBy(i => i.muc_do_ton_thuong || '', TON_THUONG_OPTIONS), [scoped]);
  const byCanThiep = useMemo(() => bucketBy(i => i.can_thiep_truoc_nga || '', CAN_THIEP_OPTIONS), [scoped]);
  const byTaiDanhGia = useMemo(
    () => [
      { label: 'Có', soCa: scoped.filter(i => i.da_tai_danh_gia).length },
      { label: 'Không', soCa: scoped.filter(i => !i.da_tai_danh_gia).length }
    ],
    [scoped]
  );
  const byDanhGiaMoiTruong = useMemo(
    () => [
      { label: 'Có', soCa: scoped.filter(i => i.da_danh_gia_mt).length },
      { label: 'Không', soCa: scoped.filter(i => !i.da_danh_gia_mt).length }
    ],
    [scoped]
  );

  const totals = useMemo(
    () => ({ soCa: scoped.length, ngayNamVien: patientDays.reduce((s, v) => s + (v || 0), 0) }),
    [scoped, patientDays]
  );

  const chartData = useMemo(
    () => byMonth.map(m => ({ ten: m.label, tySuat: Number(fallRate(m.soCa, m.ngayNamVien).toFixed(2)), soCa: m.soCa })),
    [byMonth]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFallReportExcel({
        year: reportFilter.year,
        department: reportFilter.department.trim(),
        byMonth: byMonth.map(m => ({ label: m.label, soCa: m.soCa, ngayNamVien: m.ngayNamVien })),
        byQuarter: byQuarter.map(q => ({ label: q.label, soCa: q.soCa, ngayNamVien: q.ngayNamVien })),
        byKhoa, byMucNguyCo, byThangDiem, byDiaDiem, byTonThuong, byCanThiep,
        byTaiDanhGia, byDanhGiaMoiTruong,
        totals
      });
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const Breakdown: React.FC<{ index: string; title: string; firstHeader: string; rows: { label: string; soCa: number }[] }> = ({ index, title, firstHeader, rows }) => {
    const tong = rows.reduce((s, r) => s + r.soCa, 0);
    return (
      <ReportTable index={index} title={title} headers={[firstHeader, 'Số ca ngã', 'Tỷ lệ %']}>
        {rows.length === 0 ? (
          <tr><td colSpan={3} className="p-6 text-center text-slate-500">Chưa có dữ liệu trong kỳ báo cáo</td></tr>
        ) : (
          rows.map(r => (
            <tr key={r.label} className="hover:bg-slate-50">
              <td className="p-3 text-slate-700">{r.label}</td>
              <td className="p-3 text-center">{r.soCa}</td>
              <td className="p-3 text-center">{fmtPct(tong > 0 ? (r.soCa / tong) * 100 : 0)}</td>
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
              list="fall-report-department-options"
              value={reportFilter.department}
              onChange={e => setReportFilter({ ...reportFilter, department: e.target.value })}
              placeholder="Gõ từ khóa để tìm đơn vị... (bỏ trống = tất cả)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <datalist id="fall-report-department-options">
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
          {` · ${totals.soCa} ca ngã`}
        </p>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 text-center text-base sm:text-lg mb-4">
          Xu hướng tỷ suất người bệnh ngã theo tháng
        </h4>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="ten" angle={-45} textAnchor="end" interval={0} height={64} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis
                tickFormatter={(v: number) => v.toFixed(2)}
                tick={{ fontSize: 11, fill: '#475569' }}
                width={64}
                label={{ value: 'Tỷ suất /1.000 ngày', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 700, fill: '#334155' } }}
              />
              <RechartsTooltip formatter={(value: any, _n: any, entry: any) => [`${value} /1.000 ngày (${entry?.payload?.soCa || 0} ca)`, 'Tỷ suất']} />
              <Legend verticalAlign="bottom" height={24} />
              <ReferenceLine
                y={FALL_BENCHMARK}
                stroke="#dc2626"
                strokeDasharray="6 4"
                label={{ value: `Mốc tham chiếu ${FALL_BENCHMARK}`, position: 'right', style: { fontSize: 10, fill: '#dc2626' } }}
              />
              <Line type="linear" dataKey="tySuat" name="Tỷ suất /1.000 ngày nằm viện" stroke="#4472C4" strokeWidth={2.5} dot={{ r: 3, fill: '#4472C4' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Mẫu số - nhập tay */}
      <ReportTable
        index="1"
        title="Tổng số ngày nằm viện theo tháng (mẫu số - nhập từ Phòng KHTH)"
        note="Ô nền vàng là ô cần nhập tay. Số liệu lấy từ Phòng Kế hoạch tổng hợp - đây là mẫu số bắt buộc để tính tỷ suất/1.000 ngày."
        headers={['Tháng', 'Tổng số ngày nằm viện thực tế (nội trú)']}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3">
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={m.ngayNamVien || ''}
                  placeholder="0"
                  onChange={e => {
                    const next = [...patientDays];
                    next[m.thang - 1] = Number(e.target.value) || 0;
                    setPatientDays(next);
                  }}
                  onBlur={e => savePatientDays(m.thang, Number(e.target.value) || 0)}
                  className="w-32 px-3 py-1.5 text-center bg-[#FFF2CC] border border-amber-300 rounded-lg text-sm font-medium text-[#0070C0] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {savingMonth === m.thang && <Loader2 size={14} className="animate-spin text-slate-400" />}
              </div>
            </td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.ngayNamVien}</td>
        </tr>
      </ReportTable>

      {/* 2. Theo tháng */}
      <ReportTable
        index="2"
        title="Tổng hợp sự cố ngã theo tháng"
        headers={['Tháng', 'Tử số (Số ca ngã)', 'Mẫu số (Tổng ngày nằm viện)', 'Tỷ suất /1.000 ngày nằm viện', 'So với mốc tham chiếu (0,5/1.000 ngày)']}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.soCa}</td>
            <td className="p-3 text-center">{m.ngayNamVien}</td>
            <td className="p-3 text-center font-medium">{fmtRate(fallRate(m.soCa, m.ngayNamVien))}</td>
            <td className="p-3 text-center"><BenchmarkBadge soCa={m.soCa} ngay={m.ngayNamVien} /></td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.soCa}</td>
          <td className="p-3 text-center">{totals.ngayNamVien}</td>
          <td className="p-3 text-center">{fmtRate(fallRate(totals.soCa, totals.ngayNamVien))}</td>
          <td className="p-3 text-center"><BenchmarkBadge soCa={totals.soCa} ngay={totals.ngayNamVien} /></td>
        </tr>
      </ReportTable>

      {/* 3. Theo quý */}
      <ReportTable
        index="3"
        title="Tổng hợp theo quý"
        headers={['Quý', 'Tử số', 'Mẫu số', 'Tỷ suất /1.000 ngày', 'So với mốc tham chiếu']}
      >
        {byQuarter.map(q => (
          <tr key={q.quy} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{q.label}</td>
            <td className="p-3 text-center">{q.soCa}</td>
            <td className="p-3 text-center">{q.ngayNamVien}</td>
            <td className="p-3 text-center font-medium">{fmtRate(fallRate(q.soCa, q.ngayNamVien))}</td>
            <td className="p-3 text-center"><BenchmarkBadge soCa={q.soCa} ngay={q.ngayNamVien} /></td>
          </tr>
        ))}
      </ReportTable>

      <Breakdown index="4" title="Phân tổ theo khoa điều trị" firstHeader="Khoa điều trị" rows={byKhoa} />
      <Breakdown index="5" title="Phân tổ theo mức độ nguy cơ ngã (tại lần đánh giá gần nhất)" firstHeader="Mức độ nguy cơ" rows={byMucNguyCo} />
      <Breakdown index="5b" title="Phân tổ theo thang điểm áp dụng (nhóm người bệnh)" firstHeader="Thang điểm áp dụng" rows={byThangDiem} />
      <Breakdown index="6" title="Phân tổ theo địa điểm/hoàn cảnh xảy ra ngã" firstHeader="Địa điểm/hoàn cảnh" rows={byDiaDiem} />
      <Breakdown index="7" title="Phân tổ theo mức độ tổn thương" firstHeader="Mức độ tổn thương" rows={byTonThuong} />
      <Breakdown index="8" title="Tỷ lệ can thiệp đang áp dụng trước khi ngã" firstHeader="Can thiệp trước khi ngã" rows={byCanThiep} />
      <Breakdown index="9" title="Tỷ lệ đã tái đánh giá + điều chỉnh can thiệp sau ngã" firstHeader="Đã tái đánh giá" rows={byTaiDanhGia} />
      <Breakdown index="10" title="Tỷ lệ đã đánh giá môi trường tại chỗ sau ngã" firstHeader="Đã đánh giá môi trường" rows={byDanhGiaMoiTruong} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-2">
        <p className="text-xs italic text-slate-500 leading-relaxed">
          Mốc tham chiếu quốc tế: 0,5 ca ngã/1.000 ngày nằm viện (Agency for Healthcare Research and Quality — AHRQ, U.S. Department of Health and Human Services).
        </p>
        <p className="text-xs italic text-slate-500 leading-relaxed">
          Chỉ số AOP.02.00 thu thập toàn bộ (100%) trường hợp ngã đã thực sự xảy ra — không áp dụng lấy mẫu, không tính near-miss (suýt ngã, được hỗ trợ kịp thời).
        </p>
      </div>
    </div>
  );
};
