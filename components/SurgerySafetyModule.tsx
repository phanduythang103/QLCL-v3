import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, ArrowLeft, Save, X, Loader2, Search, Eye,
  List, BarChart3, FileSpreadsheet, Calendar, Building2, User, ClipboardList,
  AlertTriangle, CheckCircle2, XCircle, MinusCircle, FileText, ShieldCheck
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { SurgerySafety } from '../types';
import { fetchSurgerySafety, addSurgerySafety, updateSurgerySafety, deleteSurgerySafety } from '../readSurgerySafety';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import {
  ATPT_CRITERIA, ATPT_GROUPS, ATPT_ANSWERS, ATPT_KHU_VUC_OPTIONS, ATPT_NHOM_PTTT_OPTIONS,
  scoreAtpt, jciMinSample, JCI_SAMPLE_NOTE, AtptAnswer
} from '../utils/atptCriteria';
import { exportAtptReportExcel } from '../utils/atptReportExcel';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];

const emptyForm = (nguoiGiamSat = ''): SurgerySafety => {
  const checklist: Record<string, string> = {};
  ATPT_CRITERIA.forEach(c => { checklist[c.id] = 'Có'; });
  return {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: nguoiGiamSat,
    ban_mo_so: '',
    khoa_phau_thuat: '',
    ho_ten_nguoi_benh: '',
    kip_phau_thuat: '',
    tc1_xac_nhan_danh_tinh: null, tc2_xac_nhan_vi_tri: null, tc3_cam_ket_phau_thuat: null,
    tc4_kiem_tra_thiet_bi: null, tc5_danh_gia_nguy_co: null, tc6_gioi_thieu_nhan_su: null,
    tc7_xac_nhan_lan_cuoi: null, tc8_du_phong_nhiem_khuan: null, tc9_cac_van_de_phat_sinh: null,
    tc10_kiem_dem_dung_cu: null, tc11_mau_benh_pham: null, tc12_ghi_chep_ho_so: null,
    tc13_ban_giao_hoi_tinh: null,
    checklist_23: checklist,
    loai_pt_tt: '',
    pid_nguoi_benh: '',
    nguoi_thu_thap: nguoiGiamSat,
    tong_dat: 0,
    tong_ap_dung: 0,
    ty_le_tuan_thu: 0,
    ket_qua: 'Đạt',
    ghi_chu_chung: ''
  };
};

const yearOf = (iso: string) => (iso || '').slice(0, 4);
const monthOf = (iso: string) => Number((iso || '').slice(5, 7));
const fmtPct = (rate: number) => `${rate.toFixed(1)}%`;

/**
 * Kết quả của 1 ca. Bản ghi cũ (13 tiêu chí, chưa có checklist_23) được suy ra
 * từ ty_le_tuan_thu đã lưu để không mất số liệu trong các bảng tổng hợp.
 */
const verdictOf = (item: SurgerySafety): 'Đạt' | 'Không đạt' => {
  if (item.checklist_23 && Object.keys(item.checklist_23).length > 0) {
    return scoreAtpt(item.checklist_23).ketQua;
  }
  if (item.ket_qua === 'Đạt' || item.ket_qua === 'Không đạt') return item.ket_qua;
  return (item.ty_le_tuan_thu || 0) >= 100 ? 'Đạt' : 'Không đạt';
};

export const SurgerySafetyModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<SurgerySafety[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [activeTab, setActiveTab] = useState<'DANH_SACH' | 'BAO_CAO'>('DANH_SACH');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<SurgerySafety | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState<SurgerySafety>(emptyForm());
  const [filterConfig, setFilterConfig] = useState({ year: '', department: '' });

  const currentUserName = useMemo(
    () => (user?.full_name || user?.username || '').trim(),
    [user]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [rows, depts] = await Promise.all([fetchSurgerySafety(), fetchDmDonVi()]);
      setData(rows as SurgerySafety[]);
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

  const collectorOptions = useMemo(() => {
    const names = [currentUserName, ...data.map(d => d.nguoi_thu_thap || d.nguoi_giam_sat || '')]
      .map(n => n.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [data, currentUserName]);

  const areaOptions = useMemo(() => {
    const names = new Set<string>(ATPT_KHU_VUC_OPTIONS);
    departments.forEach(d => {
      const n = (d.ten_don_vi || '').trim();
      if (n) names.add(n);
    });
    return Array.from(names);
  }, [departments]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(new Date().getFullYear())]);
    data.forEach(d => {
      const y = yearOf(d.ngay_giam_sat);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const filteredData = useMemo(() => {
    const keyword = filterConfig.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = !filterConfig.year || yearOf(item.ngay_giam_sat) === filterConfig.year;
      const matchDept = !keyword || (item.khoa_phau_thuat || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, filterConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const score = scoreAtpt(formData.checklist_23);
    const payload: SurgerySafety = {
      ...formData,
      tong_dat: score.dat,
      tong_ap_dung: score.apDung,
      ty_le_tuan_thu: Number(score.tyLe.toFixed(2)),
      ket_qua: score.ketQua
    };
    try {
      if (editingId) {
        await updateSurgerySafety(editingId, payload);
      } else {
        await addSurgerySafety(payload);
      }
      setViewMode('LIST');
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Có lỗi xảy ra khi lưu bản ghi.');
    }
  };

  const handleEdit = (item: SurgerySafety) => {
    const checklist: Record<string, string> = {};
    ATPT_CRITERIA.forEach(c => { checklist[c.id] = item.checklist_23?.[c.id] || 'Có'; });
    setFormData({ ...item, checklist_23: checklist });
    setEditingId(item.id || null);
    setViewMode('FORM');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      try {
        await deleteSurgerySafety(id);
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
      <AtptForm
        formData={formData}
        setFormData={setFormData}
        isEditing={!!editingId}
        areaOptions={areaOptions}
        collectorOptions={collectorOptions}
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
          {onBack && (
            <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="text-xl font-bold text-slate-800">An toàn phẫu thuật/thủ thuật (IPSG.04.00/04.01)</h2>
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
              <label className="text-sm font-medium text-slate-700">Khoa/Khu vực thực hiện</label>
              <input
                type="text"
                list="atpt-area-options"
                value={filterConfig.department}
                onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })}
                placeholder="Gõ từ khóa để tìm khu vực..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <datalist id="atpt-area-options">
                {areaOptions.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tổng số ca giám sát</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{filteredData.length}</p>
          </div>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tỷ lệ tuân thủ</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">
              {fmtPct(filteredData.length > 0 ? (filteredData.filter(i => verdictOf(i) === 'Đạt').length / filteredData.length) * 100 : 0)}
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
                  <th className="p-3 md:p-4">Ngày đánh giá</th>
                  <th className="p-3 md:p-4">Khoa/Khu vực</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Nhóm PT/TT</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Người bệnh</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Tỷ lệ đạt</th>
                  <th className="p-3 md:p-4">Kết quả</th>
                  <th className="p-4 hidden md:table-cell jci-col-hide">Người thu thập</th>
                  <th className="p-3 md:p-4 md:w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Chưa có dữ liệu giám sát ATPT</td></tr>
                ) : (
                  filteredData.map(item => {
                    const verdict = verdictOf(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 md:p-4 font-medium text-slate-700 whitespace-nowrap">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                        <td className="p-3 md:p-4">{item.khoa_phau_thuat}</td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{item.loai_pt_tt}</td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{item.ho_ten_nguoi_benh}</td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{fmtPct(item.ty_le_tuan_thu || 0)}</td>
                        <td className="p-3 md:p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${verdict === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {verdict === 'Đạt' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{verdict}
                          </span>
                        </td>
                        <td className="p-4 hidden md:table-cell jci-col-hide">{item.nguoi_thu_thap || item.nguoi_giam_sat}</td>
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
        <AtptProcessReport data={data} areaOptions={areaOptions} />
      )}

      {detailItem && <AtptDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// FORM NHẬP - BẢNG KIỂM 23 TIÊU CHÍ
// ---------------------------------------------------------------------------

const answerStyle = (answer: AtptAnswer, active: boolean) => {
  if (!active) return 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50';
  if (answer === 'Có') return 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm';
  if (answer === 'Không') return 'bg-red-50 border-red-200 text-red-700 shadow-sm';
  return 'bg-slate-100 border-slate-300 text-slate-600 shadow-sm';
};

interface AtptFormProps {
  formData: SurgerySafety;
  setFormData: React.Dispatch<React.SetStateAction<SurgerySafety>>;
  isEditing: boolean;
  areaOptions: string[];
  collectorOptions: string[];
  currentUserName: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const AtptForm: React.FC<AtptFormProps> = ({
  formData, setFormData, isEditing, areaOptions, collectorOptions, currentUserName, onSubmit, onCancel
}) => {
  const score = scoreAtpt(formData.checklist_23);

  const setAnswer = (id: string, value: AtptAnswer) =>
    setFormData(prev => ({ ...prev, checklist_23: { ...prev.checklist_23, [id]: value } }));

  const setAllInGroup = (group: keyof typeof ATPT_GROUPS, value: AtptAnswer) =>
    setFormData(prev => {
      const next = { ...prev.checklist_23 };
      ATPT_CRITERIA.filter(c => c.group === group).forEach(c => { next[c.id] = value; });
      return { ...prev, checklist_23: next };
    });

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800">
          {isEditing ? 'Cập nhật' : 'Thêm mới'} Phiếu giám sát Bảng kiểm An toàn PT/TT
        </h3>
        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-8">
        <p className="text-xs text-slate-500 italic">
          Phụ lục II, BVQY103.QLCL.QĐ.04.V3. Mỗi phiếu = 1 ca phẫu thuật/thủ thuật xâm lấn được giám sát.
          Tiêu chí "Không áp dụng" được loại khỏi mẫu số khi tính tỷ lệ đạt.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Ngày đánh giá <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.ngay_giam_sat} onChange={e => setFormData({ ...formData, ngay_giam_sat: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Khoa/Khu vực thực hiện <span className="text-red-500">*</span></label>
            <input type="text" required list="atpt-form-area-options" value={formData.khoa_phau_thuat} onChange={e => setFormData({ ...formData, khoa_phau_thuat: e.target.value })} placeholder="Gõ từ khóa để tìm khu vực..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
            <datalist id="atpt-form-area-options">
              {areaOptions.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Loại PT/TT (nhóm) <span className="text-red-500">*</span></label>
            <select required value={formData.loai_pt_tt} onChange={e => setFormData({ ...formData, loai_pt_tt: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
              <option value="">Chọn nhóm PT/TT...</option>
              {ATPT_NHOM_PTTT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Họ tên người bệnh <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.ho_ten_nguoi_benh} onChange={e => setFormData({ ...formData, ho_ten_nguoi_benh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Nguyễn Văn A" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Mã số bệnh án (PID)</label>
            <input type="text" value={formData.pid_nguoi_benh} onChange={e => setFormData({ ...formData, pid_nguoi_benh: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="00998xxx" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Bàn mổ số</label>
            <input type="text" value={formData.ban_mo_so} onChange={e => setFormData({ ...formData, ban_mo_so: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Kíp phẫu thuật</label>
            <input type="text" value={formData.kip_phau_thuat} onChange={e => setFormData({ ...formData, kip_phau_thuat: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Người thu thập</label>
            <input
              type="text"
              list="atpt-collector-options"
              value={formData.nguoi_thu_thap}
              onChange={e => setFormData({ ...formData, nguoi_thu_thap: e.target.value, nguoi_giam_sat: e.target.value })}
              placeholder={currentUserName ? `Gợi ý: ${currentUserName}` : 'Nhập tên người thu thập...'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
            />
            <datalist id="atpt-collector-options">
              {collectorOptions.map(n => <option key={n} value={n} />)}
            </datalist>
            {currentUserName && formData.nguoi_thu_thap !== currentUserName && (
              <button type="button" onClick={() => setFormData({ ...formData, nguoi_thu_thap: currentUserName, nguoi_giam_sat: currentUserName })} className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
                <User size={14} /> Dùng tên của tôi ({currentUserName})
              </button>
            )}
          </div>

          {/* Ô tự động tính */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="px-4 py-3 rounded-xl border border-green-200 bg-green-50">
              <p className="text-xs font-medium text-green-700">Số tiêu chí đạt "Có"</p>
              <p className="text-lg font-bold text-green-800">{score.dat}</p>
            </div>
            <div className="px-4 py-3 rounded-xl border border-green-200 bg-green-50">
              <p className="text-xs font-medium text-green-700">Tổng tiêu chí áp dụng</p>
              <p className="text-lg font-bold text-green-800">{score.apDung} / {ATPT_CRITERIA.length}</p>
            </div>
            <div className={`px-4 py-3 rounded-xl border ${score.ketQua === 'Đạt' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-xs font-medium ${score.ketQua === 'Đạt' ? 'text-green-700' : 'text-red-700'}`}>Kết quả (tự động) · {score.tyLe.toFixed(1)}%</p>
              <p className={`text-lg font-bold flex items-center gap-1.5 ${score.ketQua === 'Đạt' ? 'text-green-800' : 'text-red-800'}`}>
                {score.ketQua === 'Đạt' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}{score.ketQua}
              </p>
            </div>
          </div>
        </div>

        {/* Bảng kiểm 23 tiêu chí */}
        {(Object.keys(ATPT_GROUPS) as (keyof typeof ATPT_GROUPS)[]).map(group => (
          <div key={group} className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="font-bold text-slate-800">{ATPT_GROUPS[group]}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Chọn nhanh:</span>
                {ATPT_ANSWERS.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAllInGroup(group, a)}
                    className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {ATPT_CRITERIA.filter(c => c.group === group).map(c => (
                <div key={c.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <p className="text-sm text-slate-700 leading-relaxed flex-1">{c.label}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {ATPT_ANSWERS.map(a => {
                      const active = formData.checklist_23?.[c.id] === a;
                      return (
                        <label key={a} className={`flex items-center justify-center px-3 py-2 rounded-xl cursor-pointer transition-all border text-xs font-medium whitespace-nowrap ${answerStyle(a, active)}`}>
                          <input type="radio" name={c.id} className="sr-only" checked={active} onChange={() => setAnswer(c.id, a)} />
                          {a}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
          <textarea rows={2} value={formData.ghi_chu_chung} onChange={e => setFormData({ ...formData, ghi_chu_chung: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="VD: Thiếu bước 5 Sign-out (trao đổi điểm cải tiến với ê-kíp)" />
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Hủy bỏ</button>
        <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
          <Save size={18} /> Lưu kết quả
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

const AtptDetailModal: React.FC<{ item: SurgerySafety; onClose: () => void }> = ({ item, onClose }) => {
  const score = scoreAtpt(item.checklist_23);
  const verdict = verdictOf(item);
  const hasChecklist = !!item.checklist_23 && Object.keys(item.checklist_23).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Chi tiết phiếu giám sát ATPT</h3>
              <p className="text-xs text-slate-500">An toàn phẫu thuật/thủ thuật (IPSG.04.00/04.01)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${verdict === 'Đạt' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {verdict === 'Đạt' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Kết quả (tự động)</p>
              <div className="flex items-baseline gap-2">
                <span className={`px-2 py-1 rounded text-lg font-bold ${verdict === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{verdict}</span>
                <span className="text-sm text-slate-500">
                  {hasChecklist ? `${score.dat}/${score.apDung} tiêu chí áp dụng · ${score.tyLe.toFixed(1)}%` : `${fmtPct(item.ty_le_tuan_thu || 0)} (bảng kiểm 13 tiêu chí cũ)`}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <InfoRow icon={Calendar} label="Ngày đánh giá" value={new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')} />
            <InfoRow icon={Building2} label="Khoa/Khu vực thực hiện" value={item.khoa_phau_thuat} />
            <InfoRow icon={ClipboardList} label="Loại PT/TT (nhóm)" value={item.loai_pt_tt} />
            <InfoRow icon={User} label="Người bệnh" value={`${item.ho_ten_nguoi_benh}${item.pid_nguoi_benh ? ` / ${item.pid_nguoi_benh}` : ''}`} />
            <InfoRow icon={FileText} label="Bàn mổ số" value={item.ban_mo_so} />
            <InfoRow icon={User} label="Kíp phẫu thuật" value={item.kip_phau_thuat} />
            <InfoRow icon={User} label="Người thu thập" value={item.nguoi_thu_thap || item.nguoi_giam_sat} />
          </div>

          {hasChecklist ? (
            (Object.keys(ATPT_GROUPS) as (keyof typeof ATPT_GROUPS)[]).map(group => (
              <div key={group} className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2">
                  <ClipboardList size={18} className="text-slate-500" />
                  <h4 className="font-bold text-slate-800 text-sm">{ATPT_GROUPS[group]}</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {ATPT_CRITERIA.filter(c => c.group === group).map(c => {
                    const v = item.checklist_23?.[c.id];
                    const Icon = v === 'Có' ? CheckCircle2 : v === 'Không' ? XCircle : MinusCircle;
                    const tone = v === 'Có' ? 'text-green-600' : v === 'Không' ? 'text-red-600' : 'text-slate-400';
                    return (
                      <div key={c.id} className="p-3 flex items-start justify-between gap-4">
                        <p className="text-sm text-slate-700 leading-relaxed">{c.label}</p>
                        <div className={`flex items-center gap-1.5 shrink-0 ${tone}`}>
                          <Icon size={16} />
                          <span className="text-xs font-medium whitespace-nowrap">{v || 'Chưa đánh giá'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-sm flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>Bản ghi này được nhập theo bảng kiểm 13 tiêu chí cũ nên không có chi tiết 23 tiêu chí. Bấm Sửa và lưu lại để chuyển sang bảng kiểm mới.</p>
            </div>
          )}

          {item.ghi_chu_chung && <InfoRow icon={FileText} label="Ghi chú" value={item.ghi_chu_chung} />}
        </div>

        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">Đóng</button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BÁO CÁO QUY TRÌNH (IPSG.04.00/04.01)
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

const AtptProcessReport: React.FC<{ data: SurgerySafety[]; areaOptions: string[] }> = ({ data, areaOptions }) => {
  const currentYear = new Date().getFullYear();
  const [reportFilter, setReportFilter] = useState({ year: String(currentYear), department: '' });
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    data.forEach(d => {
      const y = yearOf(d.ngay_giam_sat);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data, currentYear]);

  const scoped = useMemo(() => {
    const keyword = reportFilter.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = yearOf(item.ngay_giam_sat) === reportFilter.year;
      const matchDept = !keyword || (item.khoa_phau_thuat || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, reportFilter]);

  const isDat = (i: SurgerySafety) => verdictOf(i) === 'Đạt';

  const byMonth = useMemo(
    () => MONTHS.map(m => {
      const rows = scoped.filter(i => monthOf(i.ngay_giam_sat) === m);
      return { thang: m, label: `Tháng ${m}`, n: rows.length, dat: rows.filter(isDat).length };
    }),
    [scoped]
  );

  const byQuarter = useMemo(
    () => QUARTERS.map(q => {
      const months = byMonth.filter(m => Math.ceil(m.thang / 3) === q);
      return {
        quy: q,
        label: `Quý ${q}`,
        n: months.reduce((s, m) => s + m.n, 0),
        dat: months.reduce((s, m) => s + m.dat, 0)
      };
    }),
    [byMonth]
  );

  // Chỉ liệt kê khoa/khu vực thực có trong bảng DS thu thập của kỳ báo cáo
  const byKhuVuc = useMemo(() => {
    const groups = new Map<string, SurgerySafety[]>();
    scoped.forEach(i => {
      const key = (i.khoa_phau_thuat || '').trim() || 'Chưa xác định';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    });
    return Array.from(groups.entries())
      .map(([label, rows]) => {
        const n = rows.length;
        const minSample = jciMinSample(n);
        return { label, n, dat: rows.filter(isDat).length, minSample, ok: n >= minSample };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [scoped]);

  const byNhom = useMemo(() => {
    const groups = new Map<string, SurgerySafety[]>();
    ATPT_NHOM_PTTT_OPTIONS.forEach(o => groups.set(o, []));
    scoped.forEach(i => {
      const key = (i.loai_pt_tt || '').trim() || 'Chưa xác định';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    });
    return Array.from(groups.entries()).map(([label, rows]) => ({
      label,
      n: rows.length,
      dat: rows.filter(isDat).length
    }));
  }, [scoped]);

  const byCriteria = useMemo(() => {
    const stats: Record<string, { co: number; khong: number; khongApDung: number }> = {};
    ATPT_CRITERIA.forEach(c => { stats[c.id] = { co: 0, khong: 0, khongApDung: 0 }; });
    scoped.forEach(i => {
      if (!i.checklist_23) return;
      ATPT_CRITERIA.forEach(c => {
        const v = i.checklist_23?.[c.id];
        if (v === 'Có') stats[c.id].co += 1;
        else if (v === 'Không') stats[c.id].khong += 1;
        else if (v === 'Không áp dụng') stats[c.id].khongApDung += 1;
      });
    });
    return stats;
  }, [scoped]);

  const totals = useMemo(() => ({ n: scoped.length, dat: scoped.filter(isDat).length }), [scoped]);
  const khongDat = totals.n - totals.dat;

  const chartData = useMemo(
    () => byMonth.map(m => ({ ten: m.label, tyLe: Number((m.n > 0 ? (m.dat / m.n) * 100 : 0).toFixed(1)), soCa: m.n })),
    [byMonth]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAtptReportExcel({
        year: reportFilter.year,
        department: reportFilter.department.trim(),
        byMonth: byMonth.map(m => ({ label: m.label, n: m.n, dat: m.dat })),
        byQuarter: byQuarter.map(q => ({ label: q.label, n: q.n, dat: q.dat })),
        byKhuVuc, byNhom, byCriteria,
        totals
      });
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const CriteriaBlock: React.FC<{ letter: string; group: keyof typeof ATPT_GROUPS }> = ({ letter, group }) => (
    <ReportTable
      index={`5${letter}`}
      title={`Nhóm ${ATPT_GROUPS[group]}`}
      headers={['Tiêu chí', 'Có', 'Không', 'Không áp dụng', 'Tổng áp dụng', 'Tỷ lệ % Có']}
    >
      {ATPT_CRITERIA.filter(c => c.group === group).map(c => {
        const s = byCriteria[c.id];
        const apDung = s.co + s.khong;
        return (
          <tr key={c.id} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{c.label}</td>
            <td className="p-3 text-center text-green-700 font-medium">{s.co}</td>
            <td className="p-3 text-center text-red-700 font-medium">{s.khong}</td>
            <td className="p-3 text-center text-slate-500">{s.khongApDung}</td>
            <td className="p-3 text-center">{apDung}</td>
            <td className="p-3 text-center">{fmtPct(apDung > 0 ? (s.co / apDung) * 100 : 0)}</td>
          </tr>
        );
      })}
    </ReportTable>
  );

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
              list="atpt-report-area-options"
              value={reportFilter.department}
              onChange={e => setReportFilter({ ...reportFilter, department: e.target.value })}
              placeholder="Gõ từ khóa để tìm đơn vị... (bỏ trống = tất cả)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <datalist id="atpt-report-area-options">
              {areaOptions.map(n => <option key={n} value={n} />)}
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
          {` · ${totals.n} ca giám sát`}
        </p>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 text-center text-base sm:text-lg mb-4">
          Xu hướng tỷ lệ tuân thủ Bảng kiểm ATPT theo tháng
        </h4>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="ten" angle={-45} textAnchor="end" interval={0} height={64} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: '#475569' }} width={60} label={{ value: 'Tỷ lệ tuân thủ %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 700, fill: '#334155' } }} />
              <RechartsTooltip formatter={(value: any, _n: any, entry: any) => [`${value}% (${entry?.payload?.soCa || 0} ca)`, 'Tỷ lệ tuân thủ']} />
              <Legend verticalAlign="bottom" height={24} />
              <Line type="linear" dataKey="tyLe" name="Tỷ lệ tuân thủ %" stroke="#4472C4" strokeWidth={2.5} dot={{ r: 3, fill: '#4472C4' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Theo tháng */}
      <ReportTable index="1" title="Tổng hợp theo tháng" headers={['Tháng', 'Tổng số ca được giám sát (Mẫu số)', 'Số ca đạt (Tử số)', 'Tỷ lệ tuân thủ %']}>
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.n}</td>
            <td className="p-3 text-center">{m.dat}</td>
            <td className="p-3 text-center">{fmtPct(m.n > 0 ? (m.dat / m.n) * 100 : 0)}</td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.n}</td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(totals.n > 0 ? (totals.dat / totals.n) * 100 : 0)}</td>
        </tr>
      </ReportTable>

      {/* 2. Theo quý */}
      <ReportTable index="2" title="Tổng hợp theo quý" headers={['Quý', 'Tổng số ca giám sát', 'Số ca đạt', 'Tỷ lệ tuân thủ %']}>
        {byQuarter.map(q => (
          <tr key={q.quy} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{q.label}</td>
            <td className="p-3 text-center">{q.n}</td>
            <td className="p-3 text-center">{q.dat}</td>
            <td className="p-3 text-center">{fmtPct(q.n > 0 ? (q.dat / q.n) * 100 : 0)}</td>
          </tr>
        ))}
      </ReportTable>

      {/* 3. Theo khoa/khu vực */}
      <ReportTable
        index="3"
        title="Phân tổ theo khoa/khu vực (kèm kiểm tra cỡ mẫu tối thiểu theo JCI)"
        note={JCI_SAMPLE_NOTE}
        headers={['Khoa/Khu vực', 'Tổng số ca (N)', 'Số ca đạt', 'Tỷ lệ tuân thủ %', 'Cỡ mẫu tối thiểu yêu cầu (JCI)', 'Đạt cỡ mẫu tối thiểu?']}
      >
        {byKhuVuc.length === 0 ? (
          <tr><td colSpan={6} className="p-6 text-center text-slate-500">Chưa có dữ liệu thu thập trong kỳ báo cáo</td></tr>
        ) : (
          byKhuVuc.map(k => (
            <tr key={k.label} className="hover:bg-slate-50">
              <td className="p-3 text-slate-700">{k.label}</td>
              <td className="p-3 text-center">{k.n}</td>
              <td className="p-3 text-center">{k.dat}</td>
              <td className="p-3 text-center">{fmtPct(k.n > 0 ? (k.dat / k.n) * 100 : 0)}</td>
              <td className="p-3 text-center font-medium">{k.minSample}</td>
              <td className="p-3 text-center">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${k.ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {k.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {k.ok ? 'Đạt' : `Chưa đạt (thiếu ${k.minSample - k.n})`}
                </span>
              </td>
            </tr>
          ))
        )}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng</td>
          <td className="p-3 text-center">{totals.n}</td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(totals.n > 0 ? (totals.dat / totals.n) * 100 : 0)}</td>
          <td className="p-3 text-center">{byKhuVuc.reduce((s, k) => s + k.minSample, 0)}</td>
          <td className="p-3" />
        </tr>
      </ReportTable>

      {/* 4. Theo nhóm PT/TT */}
      <ReportTable index="4" title="Phân tổ theo nhóm phẫu thuật/thủ thuật" headers={['Nhóm PT/TT', 'Tổng số ca', 'Số ca đạt', 'Tỷ lệ tuân thủ %']}>
        {byNhom.map(k => (
          <tr key={k.label} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{k.label}</td>
            <td className="p-3 text-center">{k.n}</td>
            <td className="p-3 text-center">{k.dat}</td>
            <td className="p-3 text-center">{fmtPct(k.n > 0 ? (k.dat / k.n) * 100 : 0)}</td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng</td>
          <td className="p-3 text-center">{totals.n}</td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(totals.n > 0 ? (totals.dat / totals.n) * 100 : 0)}</td>
        </tr>
      </ReportTable>

      {/* 5. Theo từng tiêu chí */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <p className="text-sm font-bold text-slate-800">5. Phân tổ theo từng tiêu chí trong bảng kiểm (23 tiêu chí)</p>
        <p className="text-xs italic text-slate-500 mt-1">
          "Tổng áp dụng" = Có + Không (loại trừ "Không áp dụng"). Giúp xác định tiêu chí nào hay bị bỏ sót nhất.
          Chỉ tính các bản ghi đã nhập theo bảng kiểm 23 tiêu chí.
        </p>
      </div>
      <CriteriaBlock letter="a" group="SIGN_IN" />
      <CriteriaBlock letter="b" group="TIME_OUT" />
      <CriteriaBlock letter="c" group="SIGN_OUT" />

      {/* 6. Kết quả chung */}
      <ReportTable
        index="6"
        title="Kết quả chung (Đạt/Không đạt)"
        note="Mục tiêu IPSG.04.00/04.01: 100% ca PT/TT xâm lấn được thực hiện đầy đủ cả 3 bước Sign-in — Time-out — Sign-out."
        headers={['Kết quả', 'Số lượng', 'Tỷ lệ %']}
      >
        <tr className="hover:bg-slate-50">
          <td className="p-3"><span className="inline-flex items-center gap-1.5 text-green-700 font-medium"><CheckCircle2 size={16} /> Đạt</span></td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(totals.n > 0 ? (totals.dat / totals.n) * 100 : 0)}</td>
        </tr>
        <tr className="hover:bg-slate-50">
          <td className="p-3"><span className="inline-flex items-center gap-1.5 text-red-700 font-medium"><XCircle size={16} /> Không đạt</span></td>
          <td className="p-3 text-center">{khongDat}</td>
          <td className="p-3 text-center">{fmtPct(totals.n > 0 ? (khongDat / totals.n) * 100 : 0)}</td>
        </tr>
      </ReportTable>
    </div>
  );
};
