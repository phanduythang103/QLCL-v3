import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ArrowLeft, Save, X, Loader2, Search, Eye,
  List, BarChart3, FileSpreadsheet, Calendar, Building2, User, ArrowRight,
  ClipboardList, AlertTriangle, CheckCircle2, XCircle, FileText, AlertCircle, Wrench
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { JCIHandoverIncident } from '../types';
import {
  fetchHandoverIncidents, addHandoverIncident, updateHandoverIncident, deleteHandoverIncident,
  fetchHandoverVisits, upsertHandoverVisits
} from '../readJCIIndicators';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { exportHandoverReportExcel, handoverRate } from '../utils/handoverReportExcel';

// --- Danh mục dùng cho dropdown (bám theo sheet DanhMuc của bản mẫu) ---
export const LOAI_HINH_BAN_GIAO_OPTIONS = [
  'Bàn giao ca trực',
  'Chuyển khoa/chuyển đơn vị',
  'Trước/sau phẫu thuật-thủ thuật (phòng mổ/hồi tỉnh)',
  'Chuyển viện',
  'Ra viện',
  'Bàn giao bằng lời nói/qua điện thoại'
];

/** Mức độ nghiêm trọng theo Thông tư 43/2018/TT-BYT */
export const MUC_DO_NGHIEM_TRONG_OPTIONS = [
  'NC0 - Chưa xảy ra',
  'NC1 - Tổn thương nhẹ',
  'NC2 - Tổn thương trung bình',
  'NC3 - Tổn thương nặng'
];

export const DEN_NB_OPTIONS = ['Đến NB', 'Near-miss'];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];

const emptyForm = (nguoiTongHop = ''): Omit<JCIHandoverIncident, 'id' | 'created_at'> => ({
  ma_bao_cao: '', thoi_gian_su_co: '', thoi_gian_bao_cao: '',
  khoa_lien_quan: '', khoa_ban_giao: '', khoa_tiep_nhan: '',
  loai_hinh_ban_giao: '', ho_ten_pid: '', phan_loai_su_co: '',
  muc_do_nghiem_trong: '', da_phan_tich_rca: false, hanh_dong_khac_phuc: '',
  nguoi_tong_hop: nguoiTongHop, ghi_chu: ''
});

const yearOf = (iso: string) => (iso || '').slice(0, 4);
const monthOf = (iso: string) => Number((iso || '').slice(5, 7));
const formatDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('vi-VN') : '');
const fmtRate = (rate: number) => rate.toFixed(2);
const fmtPct = (rate: number) => `${rate.toFixed(1)}%`;

/** Chuỗi hiển thị "Khoa bàn giao → Khoa tiếp nhận" */
const khoaLienQuan = (banGiao?: string, tiepNhan?: string) =>
  [banGiao?.trim(), tiepNhan?.trim()].filter(Boolean).join(' → ');

export const JCIHandoverIncidentsModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [incidents, setIncidents] = useState<JCIHandoverIncident[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [activeTab, setActiveTab] = useState<'DANH_SACH' | 'BAO_CAO'>('DANH_SACH');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<JCIHandoverIncident | null>(null);
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
      const [data, depts] = await Promise.all([fetchHandoverIncidents(), fetchDmDonVi()]);
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
      const y = yearOf(i.thoi_gian_su_co);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [incidents]);

  const filteredData = useMemo(() => {
    const keyword = filterConfig.department.trim().toLowerCase();
    return incidents.filter(item => {
      const matchYear = !filterConfig.year || yearOf(item.thoi_gian_su_co) === filterConfig.year;
      const matchDept =
        !keyword ||
        (item.khoa_lien_quan || '').toLowerCase().includes(keyword) ||
        (item.khoa_ban_giao || '').toLowerCase().includes(keyword) ||
        (item.khoa_tiep_nhan || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [incidents, filterConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // khoa_lien_quan là cột NOT NULL - luôn dựng lại từ 2 lựa chọn
    const payload = {
      ...formData,
      khoa_lien_quan: khoaLienQuan(formData.khoa_ban_giao, formData.khoa_tiep_nhan)
    };
    try {
      if (editingId) {
        await updateHandoverIncident(editingId, payload);
      } else {
        await addHandoverIncident(payload);
      }
      setViewMode('LIST');
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Có lỗi xảy ra khi lưu bản ghi.');
    }
  };

  const handleEdit = (item: JCIHandoverIncident) => {
    setFormData({
      ma_bao_cao: item.ma_bao_cao || '',
      thoi_gian_su_co: item.thoi_gian_su_co ? new Date(item.thoi_gian_su_co).toISOString().slice(0, 16) : '',
      thoi_gian_bao_cao: item.thoi_gian_bao_cao ? new Date(item.thoi_gian_bao_cao).toISOString().slice(0, 16) : '',
      khoa_lien_quan: item.khoa_lien_quan || '',
      // Bản ghi cũ chỉ có khoa_lien_quan dạng "A → B" - tách ngược lại để sửa
      khoa_ban_giao: item.khoa_ban_giao || (item.khoa_lien_quan || '').split('→')[0]?.trim() || '',
      khoa_tiep_nhan: item.khoa_tiep_nhan || (item.khoa_lien_quan || '').split('→')[1]?.trim() || '',
      loai_hinh_ban_giao: item.loai_hinh_ban_giao || '',
      ho_ten_pid: item.ho_ten_pid || '',
      phan_loai_su_co: item.phan_loai_su_co || '',
      muc_do_nghiem_trong: item.muc_do_nghiem_trong || '',
      da_phan_tich_rca: item.da_phan_tich_rca || false,
      hanh_dong_khac_phuc: item.hanh_dong_khac_phuc || '',
      nguoi_tong_hop: item.nguoi_tong_hop || '',
      ghi_chu: item.ghi_chu || ''
    });
    setEditingId(item.id || null);
    setViewMode('FORM');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      try {
        await deleteHandoverIncident(id);
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
      <HandoverForm
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
          <h2 className="text-xl font-bold text-slate-800">Sự cố bàn giao thông tin NB (IPSG.02.01)</h2>
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
              <label className="text-sm font-medium text-slate-700">Khoa/Phòng liên quan</label>
              <input
                type="text"
                list="handover-department-options"
                value={filterConfig.department}
                onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })}
                placeholder="Gõ từ khóa để tìm khoa..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <datalist id="handover-department-options">
                {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
              </datalist>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tổng số sự cố</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{filteredData.length}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Đã phân tích RCA</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{filteredData.filter(i => i.da_phan_tich_rca).length}</p>
          </div>
        </div>
      </div>

      {activeTab === 'DANH_SACH' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left jci-list-table">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="p-3 md:p-4">Ngày giờ sự cố</th>
                  <th className="p-3 md:p-4">Khoa/Phòng liên quan</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Loại hình bàn giao</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Người bệnh / PID</th>
                  <th className="p-3 md:p-4">Mức độ nghiêm trọng</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Đến NB / Near-miss</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">RCA</th>
                  <th className="p-3 md:p-4 md:w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Chưa có dữ liệu sự cố bàn giao</td></tr>
                ) : (
                  filteredData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 md:p-4 font-medium text-slate-700 whitespace-nowrap">{formatDateTime(item.thoi_gian_su_co)}</td>
                      <td className="p-3 md:p-4">{item.khoa_lien_quan}</td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">{item.loai_hinh_ban_giao}</td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">{item.ho_ten_pid}</td>
                      <td className="p-3 md:p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${(item.muc_do_nghiem_trong || '').startsWith('NC0') ? 'bg-green-100 text-green-700' : (item.muc_do_nghiem_trong || '').startsWith('NC3') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.muc_do_nghiem_trong || '—'}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">{item.phan_loai_su_co}</td>
                      <td className="p-4 hidden md:table-cell jci-col-hide">
                        {item.da_phan_tich_rca
                          ? <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={16} /> Có</span>
                          : <span className="inline-flex items-center gap-1 text-slate-400"><XCircle size={16} /> Không</span>}
                      </td>
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
        <HandoverProcessReport data={incidents} departments={departments} />
      )}

      {detailItem && <HandoverDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FORM NHẬP SỰ CỐ BÀN GIAO
// ---------------------------------------------------------------------------

interface HandoverFormProps {
  formData: Omit<JCIHandoverIncident, 'id' | 'created_at'>;
  setFormData: React.Dispatch<React.SetStateAction<Omit<JCIHandoverIncident, 'id' | 'created_at'>>>;
  isEditing: boolean;
  departments: any[];
  summarizerOptions: string[];
  currentUserName: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const HandoverForm: React.FC<HandoverFormProps> = ({
  formData, setFormData, isEditing, departments, summarizerOptions, currentUserName, onSubmit, onCancel
}) => (
  <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
      <h3 className="text-lg font-bold text-slate-800">
        {isEditing ? 'Cập nhật' : 'Thêm mới'} Phiếu sự cố liên quan đến bàn giao thông tin NB
      </h3>
      <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
        <X size={20} />
      </button>
    </div>

    <div className="p-4 sm:p-6 space-y-6">
      <p className="text-xs text-slate-500 italic">
        Trích xuất từ Hệ thống báo cáo sự cố y khoa trực tuyến. Mỗi phiếu = 1 sự cố/sai sót liên quan đến bàn giao thông tin người bệnh đã được Ban QLCL xác minh.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Mã báo cáo <span className="text-xs font-normal text-slate-400">(hệ thống trực tuyến)</span></label>
          <input type="text" value={formData.ma_bao_cao} onChange={e => setFormData({ ...formData, ma_bao_cao: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="VD: SC-2026-0091" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ngày giờ xảy ra sự cố <span className="text-red-500">*</span></label>
          <input type="datetime-local" required value={formData.thoi_gian_su_co} onChange={e => setFormData({ ...formData, thoi_gian_su_co: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ngày giờ báo cáo <span className="text-red-500">*</span></label>
          <input type="datetime-local" required value={formData.thoi_gian_bao_cao} onChange={e => setFormData({ ...formData, thoi_gian_bao_cao: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Loại hình bàn giao liên quan <span className="text-red-500">*</span></label>
          <select required value={formData.loai_hinh_ban_giao} onChange={e => setFormData({ ...formData, loai_hinh_ban_giao: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn loại hình bàn giao...</option>
            {LOAI_HINH_BAN_GIAO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Khoa/Phòng liên quan: chọn lần lượt khoa bàn giao rồi khoa tiếp nhận */}
        <div className="md:col-span-2 space-y-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700">
            Khoa/Phòng liên quan <span className="text-red-500">*</span>
            <span className="text-xs font-normal text-slate-400 ml-1">(chọn lần lượt khoa bàn giao, sau đó khoa tiếp nhận)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Khoa bàn giao</span>
              <input
                type="text"
                required
                list="handover-form-department-options"
                value={formData.khoa_ban_giao}
                onChange={e => setFormData({ ...formData, khoa_ban_giao: e.target.value })}
                placeholder="Gõ từ khóa để tìm khoa..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl transition-colors"
              />
            </div>
            <ArrowRight size={20} className="hidden sm:block text-slate-400 mt-5 shrink-0" />
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">Khoa tiếp nhận</span>
              <input
                type="text"
                list="handover-form-department-options"
                value={formData.khoa_tiep_nhan}
                onChange={e => setFormData({ ...formData, khoa_tiep_nhan: e.target.value })}
                placeholder="Gõ từ khóa để tìm khoa..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl transition-colors"
              />
            </div>
          </div>
          <datalist id="handover-form-department-options">
            {departments.map(d => <option key={d.id} value={d.ten_don_vi} />)}
          </datalist>
          <p className="text-xs text-slate-500">
            Ghi nhận: <span className="font-semibold text-slate-700">{khoaLienQuan(formData.khoa_ban_giao, formData.khoa_tiep_nhan) || '—'}</span>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Họ tên / PID người bệnh liên quan <span className="text-red-500">*</span></label>
          <input type="text" required value={formData.ho_ten_pid} onChange={e => setFormData({ ...formData, ho_ten_pid: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Lê Văn E / 00317xxx" />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Đến NB / Near-miss <span className="text-red-500">*</span></label>
          <select required value={formData.phan_loai_su_co} onChange={e => setFormData({ ...formData, phan_loai_su_co: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn phân loại...</option>
            {DEN_NB_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Mức độ nghiêm trọng <span className="text-xs font-normal text-slate-400">(TT 43/2018/TT-BYT)</span></label>
          <select value={formData.muc_do_nghiem_trong} onChange={e => setFormData({ ...formData, muc_do_nghiem_trong: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
            <option value="">Chọn mức độ nghiêm trọng...</option>
            {MUC_DO_NGHIEM_TRONG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Người tổng hợp</label>
          <input
            type="text"
            list="handover-summarizer-options"
            value={formData.nguoi_tong_hop}
            onChange={e => setFormData({ ...formData, nguoi_tong_hop: e.target.value })}
            placeholder={currentUserName ? `Gợi ý: ${currentUserName}` : 'Nhập tên người tổng hợp...'}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
          />
          <datalist id="handover-summarizer-options">
            {summarizerOptions.map(n => <option key={n} value={n} />)}
          </datalist>
          {currentUserName && formData.nguoi_tong_hop !== currentUserName && (
            <button type="button" onClick={() => setFormData({ ...formData, nguoi_tong_hop: currentUserName })} className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
              <User size={14} /> Dùng tên của tôi ({currentUserName})
            </button>
          )}
        </div>

        <div className="flex items-center p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.da_phan_tich_rca} onChange={e => setFormData({ ...formData, da_phan_tich_rca: e.target.checked })} className="w-5 h-5 text-teal-600 rounded" />
            <span className="text-sm font-medium text-slate-700">Đã phân tích nguyên nhân gốc rễ (RCA)</span>
          </label>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Hành động khắc phục</label>
          <textarea rows={2} value={formData.hanh_dong_khac_phuc} onChange={e => setFormData({ ...formData, hanh_dong_khac_phuc: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="VD: Nhắc lại quy định đối chiếu y lệnh khi chuyển khoa..." />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
          <textarea rows={2} value={formData.ghi_chu} onChange={e => setFormData({ ...formData, ghi_chu: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Mô tả ngắn gọn diễn biến sự cố..." />
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

const HandoverDetailModal: React.FC<{ item: JCIHandoverIncident; onClose: () => void }> = ({ item, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Chi tiết sự cố bàn giao</h3>
            <p className="text-xs text-slate-500">Bàn giao thông tin người bệnh (IPSG.02.01 / QPS.03.04)</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={FileText} label="Mã báo cáo" value={item.ma_bao_cao} />
          <InfoRow icon={Calendar} label="Ngày giờ xảy ra sự cố" value={formatDateTime(item.thoi_gian_su_co)} />
          <InfoRow icon={Calendar} label="Ngày giờ báo cáo" value={formatDateTime(item.thoi_gian_bao_cao)} />
          <InfoRow icon={ClipboardList} label="Loại hình bàn giao liên quan" value={item.loai_hinh_ban_giao} />
          <InfoRow icon={Building2} label="Khoa bàn giao" value={item.khoa_ban_giao || item.khoa_lien_quan} />
          <InfoRow icon={ArrowRight} label="Khoa tiếp nhận" value={item.khoa_tiep_nhan} />
          <InfoRow icon={User} label="Người bệnh / PID" value={item.ho_ten_pid} />
          <InfoRow icon={AlertCircle} label="Đến NB / Near-miss" value={item.phan_loai_su_co} />
          <InfoRow icon={AlertTriangle} label="Mức độ nghiêm trọng" value={item.muc_do_nghiem_trong} />
          <InfoRow
            icon={item.da_phan_tich_rca ? CheckCircle2 : XCircle}
            label="Đã phân tích RCA"
            value={item.da_phan_tich_rca ? 'Có' : 'Không'}
          />
          <InfoRow icon={User} label="Người tổng hợp" value={item.nguoi_tong_hop} />
        </div>

        {item.hanh_dong_khac_phuc && <InfoRow icon={Wrench} label="Hành động khắc phục" value={item.hanh_dong_khac_phuc} />}
        {item.ghi_chu && <InfoRow icon={FileText} label="Ghi chú" value={item.ghi_chu} />}
      </div>

      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Đóng</button>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// BÁO CÁO QUY TRÌNH (IPSG.02.01 / QPS.03.04)
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

const HandoverProcessReport: React.FC<{ data: JCIHandoverIncident[]; departments: any[] }> = ({ data, departments }) => {
  const currentYear = new Date().getFullYear();
  const [reportFilter, setReportFilter] = useState({ year: String(currentYear), department: '' });
  const [visits, setVisits] = useState<number[]>(Array(12).fill(0));
  const [savingMonth, setSavingMonth] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    data.forEach(i => {
      const y = yearOf(i.thoi_gian_su_co);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data, currentYear]);

  // Mẫu số nhập tay, lưu theo từng năm
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchHandoverVisits(Number(reportFilter.year));
      if (cancelled) return;
      const next = Array(12).fill(0);
      rows.forEach(r => {
        if (r.thang >= 1 && r.thang <= 12) next[r.thang - 1] = r.so_luot_kham || 0;
      });
      setVisits(next);
    })();
    return () => { cancelled = true; };
  }, [reportFilter.year]);

  const saveVisits = async (thang: number, value: number) => {
    setSavingMonth(thang);
    try {
      await upsertHandoverVisits(Number(reportFilter.year), thang, value);
    } catch (err) {
      console.error(err);
      alert('Không lưu được tổng lượt khám. Kiểm tra lại kết nối hoặc chạy script alter_jci_handover_ipsg0201.sql.');
    } finally {
      setSavingMonth(null);
    }
  };

  const scoped = useMemo(() => {
    const keyword = reportFilter.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = yearOf(item.thoi_gian_su_co) === reportFilter.year;
      const matchDept =
        !keyword ||
        (item.khoa_lien_quan || '').toLowerCase().includes(keyword) ||
        (item.khoa_ban_giao || '').toLowerCase().includes(keyword) ||
        (item.khoa_tiep_nhan || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, reportFilter]);

  const byMonth = useMemo(
    () => MONTHS.map(m => ({
      thang: m,
      label: `Tháng ${m}`,
      soSuCo: scoped.filter(i => monthOf(i.thoi_gian_su_co) === m).length,
      luotKham: visits[m - 1] || 0
    })),
    [scoped, visits]
  );

  const byQuarter = useMemo(
    () => QUARTERS.map(q => {
      const months = byMonth.filter(m => Math.ceil(m.thang / 3) === q);
      return {
        quy: q,
        label: `Quý ${q}`,
        soSuCo: months.reduce((s, m) => s + m.soSuCo, 0),
        luotKham: months.reduce((s, m) => s + m.luotKham, 0)
      };
    }),
    [byMonth]
  );

  const bucketBy = (getKey: (i: JCIHandoverIncident) => string, fixed?: string[]) => {
    const counts = new Map<string, number>();
    (fixed || []).forEach(k => counts.set(k, 0));
    scoped.forEach(i => {
      const key = (getKey(i) || '').trim() || 'Chưa xác định';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, soLuong]) => ({ label, soLuong }));
  };

  /**
   * Mỗi sự cố liên quan tới 2 đơn vị nên được tính cho cả khoa bàn giao
   * và khoa tiếp nhận - tổng ở mục này có thể lớn hơn tổng số sự cố.
   */
  const byKhoa = useMemo(() => {
    const counts = new Map<string, number>();
    scoped.forEach(i => {
      const names = [i.khoa_ban_giao, i.khoa_tiep_nhan]
        .map(n => (n || '').trim())
        .filter(Boolean);
      const keys = names.length ? Array.from(new Set(names)) : [(i.khoa_lien_quan || '').trim() || 'Chưa xác định'];
      keys.forEach(k => counts.set(k, (counts.get(k) || 0) + 1));
    });
    return Array.from(counts.entries())
      .map(([label, soLuong]) => ({ label, soLuong }))
      .sort((a, b) => b.soLuong - a.soLuong || a.label.localeCompare(b.label, 'vi'));
  }, [scoped]);

  const byMucDo = useMemo(() => bucketBy(i => i.muc_do_nghiem_trong || '', MUC_DO_NGHIEM_TRONG_OPTIONS), [scoped]);
  const byLoaiHinh = useMemo(() => bucketBy(i => i.loai_hinh_ban_giao || '', LOAI_HINH_BAN_GIAO_OPTIONS), [scoped]);
  const byDenNb = useMemo(() => bucketBy(i => i.phan_loai_su_co || '', DEN_NB_OPTIONS), [scoped]);
  const byRca = useMemo(
    () => [
      { label: 'Có', soLuong: scoped.filter(i => i.da_phan_tich_rca).length },
      { label: 'Không', soLuong: scoped.filter(i => !i.da_phan_tich_rca).length }
    ],
    [scoped]
  );

  const totals = useMemo(
    () => ({ soSuCo: scoped.length, luotKham: visits.reduce((s, v) => s + (v || 0), 0) }),
    [scoped, visits]
  );

  const chartData = useMemo(
    () => byMonth.map(m => ({ ten: m.label, tySuat: Number(handoverRate(m.soSuCo, m.luotKham).toFixed(2)), soSuCo: m.soSuCo })),
    [byMonth]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportHandoverReportExcel({
        year: reportFilter.year,
        department: reportFilter.department.trim(),
        byMonth: byMonth.map(m => ({ label: m.label, soSuCo: m.soSuCo, luotKham: m.luotKham })),
        byQuarter: byQuarter.map(q => ({ label: q.label, soSuCo: q.soSuCo, luotKham: q.luotKham })),
        byKhoa, byMucDo, byLoaiHinh, byDenNb, byRca,
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
              list="handover-report-department-options"
              value={reportFilter.department}
              onChange={e => setReportFilter({ ...reportFilter, department: e.target.value })}
              placeholder="Gõ từ khóa để tìm đơn vị... (bỏ trống = tất cả)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <datalist id="handover-report-department-options">
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
          {` · ${totals.soSuCo} sự cố`}
        </p>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 text-center text-base sm:text-lg mb-4">
          Xu hướng tỷ suất sự cố bàn giao /1.000 lượt theo tháng
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
                label={{ value: 'Tỷ suất /1.000 lượt', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 700, fill: '#334155' } }}
              />
              <RechartsTooltip formatter={(value: any, _n: any, entry: any) => [`${value} /1.000 lượt (${entry?.payload?.soSuCo || 0} sự cố)`, 'Tỷ suất']} />
              <Legend verticalAlign="bottom" height={24} />
              <Line type="linear" dataKey="tySuat" name="Tỷ suất/1.000 lượt" stroke="#4472C4" strokeWidth={2.5} dot={{ r: 3, fill: '#4472C4' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Mẫu số - nhập tay */}
      <ReportTable
        index="1"
        title="Tổng số lượt khám, điều trị theo tháng (mẫu số - nhập từ Phòng KHTH)"
        note="Ô nền vàng là ô cần nhập tay. Nguồn: Phòng Kế hoạch tổng hợp — đây là mẫu số bắt buộc để tính tỷ suất/1.000 lượt."
        headers={['Tháng', 'Tổng lượt khám, điều trị (nội trú + ngoại trú)']}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3">
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={m.luotKham || ''}
                  placeholder="0"
                  onChange={e => {
                    const next = [...visits];
                    next[m.thang - 1] = Number(e.target.value) || 0;
                    setVisits(next);
                  }}
                  onBlur={e => saveVisits(m.thang, Number(e.target.value) || 0)}
                  className="w-36 px-3 py-1.5 text-center bg-[#FFF2CC] border border-amber-300 rounded-lg text-sm font-medium text-[#0070C0] focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {savingMonth === m.thang && <Loader2 size={14} className="animate-spin text-slate-400" />}
              </div>
            </td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.luotKham}</td>
        </tr>
      </ReportTable>

      {/* 2. Theo tháng */}
      <ReportTable
        index="2"
        title="Tổng hợp sự cố bàn giao theo tháng"
        headers={['Tháng', 'Tử số (Số sự cố ghi nhận)', 'Mẫu số (Tổng lượt khám)', 'Tỷ suất /1.000 lượt']}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.soSuCo}</td>
            <td className="p-3 text-center">{m.luotKham}</td>
            <td className="p-3 text-center font-medium">{fmtRate(handoverRate(m.soSuCo, m.luotKham))}</td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.soSuCo}</td>
          <td className="p-3 text-center">{totals.luotKham}</td>
          <td className="p-3 text-center">{fmtRate(handoverRate(totals.soSuCo, totals.luotKham))}</td>
        </tr>
      </ReportTable>

      {/* 3. Theo quý */}
      <ReportTable
        index="3"
        title="Tổng hợp theo quý"
        headers={['Quý', 'Tử số', 'Mẫu số', 'Tỷ suất /1.000 lượt']}
      >
        {byQuarter.map(q => (
          <tr key={q.quy} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{q.label}</td>
            <td className="p-3 text-center">{q.soSuCo}</td>
            <td className="p-3 text-center">{q.luotKham}</td>
            <td className="p-3 text-center font-medium">{fmtRate(handoverRate(q.soSuCo, q.luotKham))}</td>
          </tr>
        ))}
      </ReportTable>

      <Breakdown
        index="4"
        title="Phân tổ theo khoa/phòng liên quan"
        firstHeader="Khoa/Phòng"
        rows={byKhoa}
        note="Một sự cố liên quan đến 2 đơn vị được tính cho cả khoa bàn giao và khoa tiếp nhận, nên tổng ở mục này có thể lớn hơn tổng số sự cố."
      />
      <Breakdown index="5" title="Phân tổ theo mức độ nghiêm trọng" firstHeader="Mức độ nghiêm trọng" rows={byMucDo} />
      <Breakdown index="6" title="Phân tổ theo loại hình bàn giao liên quan" firstHeader="Loại hình bàn giao liên quan" rows={byLoaiHinh} />
      <Breakdown index="7" title="Phân tổ theo đến người bệnh / Near-miss" firstHeader="Loại" rows={byDenNb} />
      <Breakdown
        index="8"
        title="Tỷ lệ đã phân tích nguyên nhân gốc rễ (RCA)"
        firstHeader="Đã phân tích RCA"
        rows={byRca}
        note="QPS.03.04 ME2 yêu cầu phân tích chuyên sâu/RCA đối với sự cố an toàn người bệnh hàng tháng."
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <p className="text-xs italic text-slate-500 leading-relaxed">
          Chỉ số sự cố bàn giao (QPS.03.04) thu thập toàn bộ (100%) sự cố được báo cáo qua hệ thống báo cáo sự cố y khoa trực tuyến — không áp dụng lấy mẫu.
        </p>
      </div>
    </div>
  );
};
