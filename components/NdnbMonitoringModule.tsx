import React, { useState, useEffect, useMemo } from 'react';
import {
  List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText,
  CheckCircle2, XCircle, Activity, MinusCircle, Save, ArrowLeft,
  Calendar, Building2, User, Users, Clock, ClipboardList, TrendingUp,
  FileSpreadsheet, AlertTriangle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { exportNdnbReportExcel } from '../utils/ndnbReportExcel';
import {
  fetchGiamSatNdnb, addGiamSatNdnb, updateGiamSatNdnb,
  deleteGiamSatNdnb
} from '../readGiamSatNdnb';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';
import { GiamSatNdnb } from '../types';

export const CRITERIA_NDNB = [
  { id: 'c1', label: 'Câu 1: NVYT xác nhận họ tên đầy đủ bằng câu hỏi mở?' },
  { id: 'c2', label: 'Câu 2: NVYT xác nhận ngày tháng năm sinh bằng câu hỏi mở?' }
];

const checklistIds = CRITERIA_NDNB.map(c => c.id);
const TOTAL_CRITERIA = checklistIds.length; // 2

// Kết quả tự động: Đạt khi tất cả tiêu chí đều "Có", ngược lại Không đạt
const computeKetQua = (checklist: any): 'Đạt' | 'Không đạt' =>
  checklistIds.every(id => checklist?.[id] === true) ? 'Đạt' : 'Không đạt';

const THOI_DIEM_OPTIONS = [
  'Trước khi thực hiện các chỉ định CLS',
  'Trước khi khám/ điều trị',
  'Trước khi thực hiện các thủ thuật',
  'Trước khi thực hiện thuốc',
  'Dán nhãn các yếu tố liên quan đến NB'
];

const defaultForm = (userName = ''): Partial<GiamSatNdnb> => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: userName,
    khoa_duoc_giam_sat: '',
    doi_tuong_giam_sat: '',
    ho_ten_nguoi_benh: '',
    thoi_diem_dinh_danh: '',
    checklist_data: {},
    tong_dat: TOTAL_CRITERIA,
    tong_co_hoi: TOTAL_CRITERIA,
    ty_le_tuan_thu: 100,
    danh_gia_chung: '',
    loi_sai_khac_phuc: '',
    ghi_chu: ''
  };
  checklistIds.forEach(id => {
    base.checklist_data[id] = true; // true = Đạt, false = Không đạt
  });
  base.danh_gia_chung = computeKetQua(base.checklist_data);
  return base;
};

export const NdnbMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<GiamSatNdnb[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const { user } = useAuth();
  
  const [editingItem, setEditingItem] = useState<GiamSatNdnb | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'DANH_SACH' | 'BAO_CAO'>('DANH_SACH');
  const [detailItem, setDetailItem] = useState<GiamSatNdnb | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterConfig, setFilterConfig] = useState({
    timeRange: 'thisMonth',
    fromDate: '',
    toDate: '',
    department: '',
    evaluator: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ndnbData, depts] = await Promise.all([
        fetchGiamSatNdnb(),
        fetchDmDonVi()
      ]);
      setData(ndnbData);
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

  // Tên người dùng đang đăng nhập (auth tự quản: { username, full_name })
  const currentUserName = useMemo(
    () => (user?.full_name || user?.username || '').trim(),
    [user]
  );

  // Gợi ý người giám sát: tên user đăng nhập đứng đầu, kèm các tên đã từng nhập
  const evaluatorOptions = useMemo(() => {
    const names = [currentUserName, ...data.map(d => d.nguoi_giam_sat)]
      .map(n => (n || '').trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [data, currentUserName]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const range = getDateRange(filterConfig.timeRange, filterConfig.fromDate, filterConfig.toDate);
      const isDateValid = isDateInRange(item.ngay_giam_sat, range);
      
      const isDeptValid = !filterConfig.department || filterConfig.department === 'ALL' 
        ? true 
        : item.khoa_duoc_giam_sat === filterConfig.department;
        
      const isEvalValid = !filterConfig.evaluator 
        ? true 
        : item.nguoi_giam_sat.toLowerCase().includes(filterConfig.evaluator.toLowerCase());
        
      return isDateValid && isDeptValid && isEvalValid;
    });
  }, [data, filterConfig]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    let totalAchieved = 0;
    let totalOpportunities = 0;
    
    filteredData.forEach(item => {
      totalAchieved += item.tong_dat || 0;
      totalOpportunities += item.tong_co_hoi || 0;
    });
    
    const complianceRate = totalOpportunities > 0 ? (totalAchieved / totalOpportunities) * 100 : 0;
    
    return {
      total,
      complianceRate: complianceRate.toFixed(1)
    };
  }, [filteredData]);

  const handleSave = async (item: Partial<GiamSatNdnb>) => {
    try {
      if (item.id) {
        await updateGiamSatNdnb(item.id, item);
      } else {
        await addGiamSatNdnb(item as Omit<GiamSatNdnb, 'id' | 'created_at' | 'updated_at'>);
      }
      await loadData();
      setViewMode('LIST');
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Có lỗi xảy ra khi lưu bản ghi.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      try {
        await deleteGiamSatNdnb(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting:', error);
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
      <NdnbForm 
        initialData={editingItem || defaultForm(currentUserName)}
        departments={departments}
        evaluatorOptions={evaluatorOptions}
        currentUserName={currentUserName}
        onSave={handleSave}
        onCancel={() => {
          setViewMode('LIST');
          setEditingItem(null);
        }}
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
          <h2 className="text-xl font-bold text-slate-800">Nhận dạng người bệnh (IPSG.01.00)</h2>
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
          <button onClick={() => { setEditingItem(null); setViewMode('FORM'); }} className="px-4 py-2 flex items-center justify-center sm:justify-start gap-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm text-sm">
            <Plus size={18} className="shrink-0" />
            <span>Thêm mới</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DateRangeFilter 
              filter={{ type: filterConfig.timeRange, startDate: filterConfig.fromDate, endDate: filterConfig.toDate }} 
              onChange={f => setFilterConfig({...filterConfig, timeRange: f.type, fromDate: f.startDate, toDate: f.endDate})} 
            />
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Khoa/Phòng</label>
              <select value={filterConfig.department} onChange={e => setFilterConfig({...filterConfig, department: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="">Tất cả khoa phòng</option>
                {departments.map(d => (
                  <option key={d.id} value={d.ten_don_vi}>{d.ten_don_vi}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Người giám sát</label>
              <input type="text" value={filterConfig.evaluator} onChange={e => setFilterConfig({...filterConfig, evaluator: e.target.value})} placeholder="Tên người giám sát..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tổng số lượt GS</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Tỷ lệ tuân thủ</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800">{stats.complianceRate}%</p>
          </div>
        </div>
      </div>

      {activeTab === 'DANH_SACH' ? (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left jci-list-table">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-3 md:p-4">Ngày GS</th>
                <th className="p-3 md:p-4">Khoa thực hiện</th>
                <th className="p-4 hidden md:table-cell jci-col-hide">NVYT được GS</th>
                <th className="p-4 hidden md:table-cell jci-col-hide">Người bệnh</th>
                <th className="p-3 md:p-4">Kết quả</th>
                <th className="p-4 hidden md:table-cell jci-col-hide">Tỷ lệ tuân thủ</th>
                <th className="p-4 hidden md:table-cell jci-col-hide">Người GS</th>
                <th className="p-3 md:p-4 md:w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">Không tìm thấy dữ liệu phù hợp</td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const kq = computeKetQua(item.checklist_data);
                  const KqIcon = kq === 'Đạt' ? CheckCircle2 : XCircle;
                  return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 md:p-4 font-medium text-slate-700 whitespace-nowrap">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3 md:p-4">{item.khoa_duoc_giam_sat}</td>
                    <td className="p-4 hidden md:table-cell jci-col-hide">{item.doi_tuong_giam_sat}</td>
                    <td className="p-4 hidden md:table-cell jci-col-hide">{item.ho_ten_nguoi_benh}</td>
                    <td className="p-3 md:p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${kq === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <KqIcon size={14} className="shrink-0" /> {kq}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell jci-col-hide">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.ty_le_tuan_thu >= 90 ? 'bg-green-100 text-green-700' : item.ty_le_tuan_thu >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {item.ty_le_tuan_thu}%
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell jci-col-hide">{item.nguoi_giam_sat}</td>
                    <td className="p-3 md:p-4 jci-actions-cell">
                      <div className="grid grid-cols-3 gap-2 md:flex md:items-center md:gap-2">
                        <button onClick={() => setDetailItem(item)} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 text-xs font-medium active:scale-95 transition-transform md:border-0 md:bg-transparent md:p-1.5 md:hover:bg-teal-50" title="Xem chi tiết">
                          <Eye size={16} className="shrink-0" />
                          <span className="md:hidden">Xem</span>
                        </button>
                        <button onClick={() => { setEditingItem(item); setViewMode('FORM'); }} className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium active:scale-95 transition-transform md:border-0 md:bg-transparent md:p-1.5 md:hover:bg-blue-50" title="Sửa">
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
        <NdnbProcessReport data={data} departments={departments} />
      )}

      {detailItem && (
        <NdnbDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </div>
  );
};

interface NdnbFormProps {
  initialData: Partial<GiamSatNdnb>;
  departments: any[];
  evaluatorOptions: string[];
  currentUserName: string;
  onSave: (data: Partial<GiamSatNdnb>) => Promise<void>;
  onCancel: () => void;
}

const NdnbForm: React.FC<NdnbFormProps> = ({ initialData, departments, evaluatorOptions, currentUserName, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<GiamSatNdnb>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateScore = (data: Partial<GiamSatNdnb>) => {
    let achieved = 0;
    const opps = TOTAL_CRITERIA; // 2
    
    checklistIds.forEach(id => {
      if (data.checklist_data?.[id] === true) achieved++;
    });
    
    return {
      tong_dat: achieved,
      tong_co_hoi: opps,
      ty_le_tuan_thu: opps > 0 ? Math.round((achieved / opps) * 100) : 0,
      danh_gia_chung: computeKetQua(data.checklist_data)
    };
  };

  // Kết quả hiển thị luôn được suy ra từ bảng kiểm hiện tại
  const ketQua = computeKetQua(formData.checklist_data);

  const handleChecklistChange = (id: string, value: boolean) => {
    const newData = {
      ...formData,
      checklist_data: {
        ...formData.checklist_data,
        [id]: value
      }
    };
    
    const scores = calculateScore(newData);
    setFormData({ ...newData, ...scores });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSave({ ...formData, ...calculateScore(formData) });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800">
          {formData.id ? 'Cập nhật' : 'Thêm mới'} Phiếu Giám Sát Nhận Dạng NB
        </h3>
        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 sm:p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Họ và tên NVYT thực hiện <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.doi_tuong_giam_sat} onChange={e => setFormData({...formData, doi_tuong_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Nguyễn Văn A" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Khoa / Phòng <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              list="ndnb-department-options"
              value={formData.khoa_duoc_giam_sat}
              onChange={e => setFormData({...formData, khoa_duoc_giam_sat: e.target.value})}
              placeholder="Gõ từ khóa để tìm khoa/phòng..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
            />
            <datalist id="ndnb-department-options">
              {departments.map(d => (
                <option key={d.id} value={d.ten_don_vi} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Họ và tên người bệnh <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.ho_ten_nguoi_benh} onChange={e => setFormData({...formData, ho_ten_nguoi_benh: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Trần Thị B" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Ngày giám sát <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.ngay_giam_sat} onChange={e => setFormData({...formData, ngay_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Thời điểm định danh <span className="text-red-500">*</span></label>
            <select required value={formData.thoi_diem_dinh_danh} onChange={e => setFormData({...formData, thoi_diem_dinh_danh: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
              <option value="">Chọn thời điểm...</option>
              {THOI_DIEM_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Người thực hiện giám sát <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              list="ndnb-evaluator-options"
              value={formData.nguoi_giam_sat}
              onChange={e => setFormData({...formData, nguoi_giam_sat: e.target.value})}
              placeholder={currentUserName ? `Gợi ý: ${currentUserName}` : 'Nhập tên người giám sát...'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors"
            />
            <datalist id="ndnb-evaluator-options">
              {evaluatorOptions.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {currentUserName && formData.nguoi_giam_sat !== currentUserName && (
              <button
                type="button"
                onClick={() => setFormData({...formData, nguoi_giam_sat: currentUserName})}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
              >
                <User size={14} /> Dùng tên của tôi ({currentUserName})
              </button>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Kết quả <span className="text-xs font-normal text-slate-400">(tự động theo bảng kiểm)</span></label>
            <div className={`w-full px-4 py-2.5 rounded-xl border flex items-center gap-2 ${ketQua === 'Đạt' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {ketQua === 'Đạt' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span className="font-bold">{ketQua}</span>
              <span className="text-sm font-normal text-slate-500 ml-auto">{formData.tong_dat}/{formData.tong_co_hoi} tiêu chí · {formData.ty_le_tuan_thu}%</span>
            </div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-slate-800">Bảng kiểm tiêu chí</h4>
            <div className="text-sm font-medium bg-white px-3 py-1 rounded-lg border border-slate-200 text-teal-700 shadow-sm">
              Tỷ lệ: {formData.ty_le_tuan_thu}% ({formData.tong_dat}/{formData.tong_co_hoi})
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {CRITERIA_NDNB.map((item, index) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{item.label}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className={`flex items-center justify-center w-24 px-3 py-2 rounded-xl cursor-pointer transition-all border ${formData.checklist_data?.[item.id] === true ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <input type="radio" name={item.id} className="sr-only" checked={formData.checklist_data?.[item.id] === true} onChange={() => handleChecklistChange(item.id, true)} />
                    <span className="text-sm font-medium">Có</span>
                  </label>
                  <label className={`flex items-center justify-center w-24 px-3 py-2 rounded-xl cursor-pointer transition-all border ${formData.checklist_data?.[item.id] === false ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <input type="radio" name={item.id} className="sr-only" checked={formData.checklist_data?.[item.id] === false} onChange={() => handleChecklistChange(item.id, false)} />
                    <span className="text-sm font-medium">Không</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
          <textarea rows={2} value={formData.ghi_chu} onChange={e => setFormData({...formData, ghi_chu: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Ghi chú thêm..." />
        </div>
      </div>
      
      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">
          Hủy bỏ
        </button>
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-70">
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSubmitting ? 'Đang lưu...' : 'Lưu kết quả'}
        </button>
      </div>
    </form>
  );
};

const rateColor = (rate: number) =>
  rate >= 90 ? 'text-green-700 bg-green-100' : rate >= 70 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';

const InfoRow: React.FC<{ icon: any; label: string; value?: React.ReactNode; className?: string }> = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || '—'}</p>
    </div>
  </div>
);

const NdnbDetailModal: React.FC<{ item: GiamSatNdnb; onClose: () => void }> = ({ item, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
    <div
      className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <ClipboardList size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Chi tiết phiếu giám sát</h3>
            <p className="text-xs text-slate-500">Nhận dạng người bệnh (IPSG.01.00)</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tỷ lệ tuân thủ</p>
            <div className="flex items-baseline gap-2">
              <span className={`px-2 py-1 rounded text-lg font-bold ${rateColor(item.ty_le_tuan_thu)}`}>{item.ty_le_tuan_thu}%</span>
              <span className="text-sm text-slate-500">{item.tong_dat}/{item.tong_co_hoi} tiêu chí đạt</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={Calendar} label="Ngày giám sát" value={new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')} />
          <InfoRow icon={Building2} label="Khoa được giám sát" value={item.khoa_duoc_giam_sat} />
          <InfoRow icon={Users} label="Họ và tên NVYT thực hiện" value={item.doi_tuong_giam_sat} />
          <InfoRow icon={User} label="Họ và tên người bệnh" value={item.ho_ten_nguoi_benh} />
          <InfoRow icon={Clock} label="Thời điểm định danh" value={item.thoi_diem_dinh_danh} />
          <InfoRow icon={Activity} label="Người thực hiện giám sát" value={item.nguoi_giam_sat} />
          <InfoRow
            icon={computeKetQua(item.checklist_data) === 'Đạt' ? CheckCircle2 : XCircle}
            label="Kết quả (tự động)"
            value={computeKetQua(item.checklist_data)}
          />
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-2">
            <ClipboardList size={18} className="text-slate-500" />
            <h4 className="font-bold text-slate-800">Bảng kiểm tiêu chí</h4>
          </div>
          <div className="divide-y divide-slate-100">
            {CRITERIA_NDNB.map(c => {
              const value = item.checklist_data?.[c.id];
              const Icon = value === true ? CheckCircle2 : value === false ? XCircle : MinusCircle;
              const tone = value === true ? 'text-green-600' : value === false ? 'text-red-600' : 'text-slate-400';
              const text = value === true ? 'Có' : value === false ? 'Không' : 'Chưa đánh giá';
              return (
                <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{c.label}</p>
                  <div className={`flex items-center gap-1.5 shrink-0 ${tone}`}>
                    <Icon size={18} />
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(item.loi_sai_khac_phuc || item.ghi_chu) && (
          <div className="space-y-5">
            {item.loi_sai_khac_phuc && <InfoRow icon={XCircle} label="Lỗi sai / Khắc phục" value={item.loi_sai_khac_phuc} />}
            {item.ghi_chu && <InfoRow icon={FileText} label="Ghi chú" value={item.ghi_chu} />}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
        <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors">
          Đóng
        </button>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// BÁO CÁO QUY TRÌNH (IPSG.01.00)
// Mẫu số = số lượt giám sát (mỗi phiếu là 1 lượt quan sát định danh).
// Tử số  = số lượt Đạt (cả 2 tiêu chí đều "Có").
// ---------------------------------------------------------------------------

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const QUARTERS = [1, 2, 3, 4];

/**
 * Cỡ mẫu tối thiểu theo hướng dẫn JCI cho chỉ số tuân thủ quy trình (IPSG.01.00):
 *   N ≥ 640        → 128
 *   N = 320 .. 639 → 20% N
 *   N = 64 .. 319  → 64
 *   N < 64         → 100% N (lấy toàn bộ mẫu)
 */
export const jciMinSample = (n: number): number => {
  if (n >= 640) return 128;
  if (n >= 320) return Math.ceil(n * 0.2);
  if (n >= 64) return 64;
  return n;
};

const JCI_SAMPLE_NOTE =
  'Ghi chú cỡ mẫu (theo hướng dẫn JCI): N≥640 → 128; N=320-639 → 20%N; N=64-319 → 64; N<64 → 100%N (lấy toàn bộ mẫu).';

const pct = (dat: number, n: number) => (n > 0 ? (dat / n) * 100 : 0);
const fmtPct = (rate: number) => `${rate.toFixed(1)}%`;
const monthOf = (isoDate: string) => Number((isoDate || '').slice(5, 7));
const yearOf = (isoDate: string) => (isoDate || '').slice(0, 4);

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

const RateBadge: React.FC<{ rate: number; show?: boolean }> = ({ rate, show = true }) =>
  show ? (
    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${rateColor(rate)}`}>{fmtPct(rate)}</span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const NdnbProcessReport: React.FC<{ data: GiamSatNdnb[]; departments: any[] }> = ({ data, departments }) => {
  const currentYear = new Date().getFullYear();
  const [reportFilter, setReportFilter] = useState({ year: String(currentYear), department: '' });
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set<string>([String(currentYear)]);
    data.forEach(item => {
      const y = yearOf(item.ngay_giam_sat);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [data, currentYear]);

  // Bộ lọc riêng của báo cáo, chạy trên toàn bộ dữ liệu bảng DS thu thập
  const scoped = useMemo(() => {
    const keyword = reportFilter.department.trim().toLowerCase();
    return data.filter(item => {
      const matchYear = yearOf(item.ngay_giam_sat) === reportFilter.year;
      const matchDept = !keyword || (item.khoa_duoc_giam_sat || '').toLowerCase().includes(keyword);
      return matchYear && matchDept;
    });
  }, [data, reportFilter]);

  const isDat = (item: GiamSatNdnb) => computeKetQua(item.checklist_data) === 'Đạt';

  const byMonth = useMemo(
    () => MONTHS.map(m => {
      const rows = scoped.filter(item => monthOf(item.ngay_giam_sat) === m);
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

  // Chỉ lấy các khoa/phòng thực sự có trong bảng DS thu thập của kỳ báo cáo
  const byKhoa = useMemo(() => {
    const groups = new Map<string, GiamSatNdnb[]>();
    scoped.forEach(item => {
      const khoa = (item.khoa_duoc_giam_sat || '').trim() || 'Chưa xác định';
      if (!groups.has(khoa)) groups.set(khoa, []);
      groups.get(khoa)!.push(item);
    });

    return Array.from(groups.entries())
      .map(([khoa, rows]) => {
        const n = rows.length;
        const minSample = jciMinSample(n);
        return { khoa, n, dat: rows.filter(isDat).length, minSample, ok: n >= minSample };
      })
      .sort((a, b) => a.khoa.localeCompare(b.khoa, 'vi'));
  }, [scoped]);

  const byCriteria = useMemo(
    () => CRITERIA_NDNB.map(c => ({
      label: c.label,
      co: scoped.filter(item => item.checklist_data?.[c.id] === true).length,
      khong: scoped.filter(item => item.checklist_data?.[c.id] === false).length
    })),
    [scoped]
  );

  const byThoiDiem = useMemo(() => {
    const keys = new Set<string>(THOI_DIEM_OPTIONS);
    scoped.forEach(item => {
      const key = (item.thoi_diem_dinh_danh || '').trim();
      if (key) keys.add(key);
    });
    return Array.from(keys).map(label => ({
      label,
      luot: scoped.filter(item => (item.thoi_diem_dinh_danh || '').trim() === label).length
    }));
  }, [scoped]);

  const totals = useMemo(
    () => ({ n: scoped.length, dat: scoped.filter(isDat).length }),
    [scoped]
  );
  const khongDat = totals.n - totals.dat;
  const tongThoiDiem = byThoiDiem.reduce((s, t) => s + t.luot, 0);

  const chartData = useMemo(
    () => byMonth.map(m => ({ ten: m.label, tyLe: Number(pct(m.dat, m.n).toFixed(1)), luot: m.n })),
    [byMonth]
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportNdnbReportExcel({
        year: reportFilter.year,
        department: reportFilter.department.trim(),
        byMonth: byMonth.map(m => ({ label: m.label, n: m.n, dat: m.dat })),
        byQuarter: byQuarter.map(q => ({ label: q.label, n: q.n, dat: q.dat })),
        byKhoa,
        byCriteria,
        byThoiDiem,
        totals
      });
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      alert('Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bộ lọc báo cáo + xuất Excel */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Năm</label>
            <select
              value={reportFilter.year}
              onChange={e => setReportFilter({ ...reportFilter, year: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Đơn vị</label>
            <input
              type="text"
              list="ndnb-report-department-options"
              value={reportFilter.department}
              onChange={e => setReportFilter({ ...reportFilter, department: e.target.value })}
              placeholder="Gõ từ khóa để tìm đơn vị... (bỏ trống = tất cả)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
            <datalist id="ndnb-report-department-options">
              {departments.map(d => (
                <option key={d.id} value={d.ten_don_vi} />
              ))}
            </datalist>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full px-4 py-2.5 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-70"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel (A4 dọc)'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Dữ liệu lấy từ bảng DS thu thập · Năm {reportFilter.year}
          {reportFilter.department.trim() ? ` · Đơn vị chứa "${reportFilter.department.trim()}"` : ' · Tất cả đơn vị'}
          {` · ${totals.n} lượt quan sát`}
        </p>
      </div>

      {/* Biểu đồ xu hướng */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 text-center text-base sm:text-lg mb-4">
          Xu hướng tỷ lệ tuân thủ định danh theo tháng
        </h4>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="ten"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={64}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                tick={{ fontSize: 11, fill: '#475569' }}
                width={60}
                label={{ value: 'Tỷ lệ tuân thủ %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fontWeight: 700, fill: '#334155' } }}
              />
              <RechartsTooltip
                formatter={(value: any, _n: any, entry: any) => [`${value}% (${entry?.payload?.luot || 0} lượt)`, 'Tỷ lệ tuân thủ']}
              />
              <Legend verticalAlign="bottom" height={24} />
              <Line
                type="linear"
                dataKey="tyLe"
                name="Tỷ lệ tuân thủ %"
                stroke="#4472C4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#4472C4' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1. Theo tháng */}
      <ReportTable
        index="1"
        title="Tổng hợp theo tháng"
        headers={['Tháng', 'Tổng lượt quan sát (Mẫu số)', 'Số lượt đạt (Tử số)', 'Tỷ lệ tuân thủ %']}
      >
        {byMonth.map(m => (
          <tr key={m.thang} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{m.label}</td>
            <td className="p-3 text-center">{m.n}</td>
            <td className="p-3 text-center">{m.dat}</td>
            <td className="p-3 text-center"><RateBadge rate={pct(m.dat, m.n)} show={m.n > 0} /></td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng năm</td>
          <td className="p-3 text-center">{totals.n}</td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(pct(totals.dat, totals.n))}</td>
        </tr>
      </ReportTable>

      {/* 2. Theo quý */}
      <ReportTable
        index="2"
        title="Tổng hợp theo quý"
        headers={['Quý', 'Tổng lượt quan sát', 'Số lượt đạt', 'Tỷ lệ tuân thủ %']}
      >
        {byQuarter.map(q => (
          <tr key={q.quy} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{q.label}</td>
            <td className="p-3 text-center">{q.n}</td>
            <td className="p-3 text-center">{q.dat}</td>
            <td className="p-3 text-center"><RateBadge rate={pct(q.dat, q.n)} show={q.n > 0} /></td>
          </tr>
        ))}
      </ReportTable>

      {/* 3. Theo khoa/phòng */}
      <ReportTable
        index="3"
        title="Tổng hợp theo khoa/phòng (kèm kiểm tra cỡ mẫu tối thiểu theo JCI)"
        note={JCI_SAMPLE_NOTE}
        headers={['Khoa/Phòng', 'Tổng quan sát (N)', 'Số đạt', 'Tỷ lệ tuân thủ %', 'Cỡ mẫu tối thiểu yêu cầu (JCI)', 'Đạt cỡ mẫu tối thiểu?']}
      >
        {byKhoa.length === 0 ? (
          <tr><td colSpan={6} className="p-6 text-center text-slate-500">Chưa có dữ liệu thu thập trong kỳ báo cáo</td></tr>
        ) : (
          byKhoa.map(k => (
            <tr key={k.khoa} className="hover:bg-slate-50">
              <td className="p-3 text-slate-700">{k.khoa}</td>
              <td className="p-3 text-center">{k.n}</td>
              <td className="p-3 text-center">{k.dat}</td>
              <td className="p-3 text-center"><RateBadge rate={pct(k.dat, k.n)} show={k.n > 0} /></td>
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
          <td className="p-3 text-center">{fmtPct(pct(totals.dat, totals.n))}</td>
          <td className="p-3 text-center">{byKhoa.reduce((s, k) => s + k.minSample, 0)}</td>
          <td className="p-3" />
        </tr>
      </ReportTable>

      {/* 4. Theo từng tiêu chí câu hỏi */}
      <ReportTable
        index="4"
        title="Tổng hợp theo kết quả từng tiêu chí câu hỏi"
        headers={['Tiêu chí', 'Có (đạt)', 'Không (không đạt)', 'Tỷ lệ % Có']}
      >
        {byCriteria.map(c => (
          <tr key={c.label} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{c.label}</td>
            <td className="p-3 text-center text-green-700 font-medium">{c.co}</td>
            <td className="p-3 text-center text-red-700 font-medium">{c.khong}</td>
            <td className="p-3 text-center"><RateBadge rate={pct(c.co, c.co + c.khong)} show={c.co + c.khong > 0} /></td>
          </tr>
        ))}
      </ReportTable>

      {/* 5. Theo thời điểm nhận dạng người bệnh */}
      <ReportTable
        index="5"
        title="Tổng hợp theo thời điểm nhận dạng người bệnh"
        headers={['Thời điểm', 'Số lượt', 'Tỷ lệ %']}
      >
        {byThoiDiem.map(t => (
          <tr key={t.label} className="hover:bg-slate-50">
            <td className="p-3 text-slate-700">{t.label}</td>
            <td className="p-3 text-center">{t.luot}</td>
            <td className="p-3 text-center">{fmtPct(pct(t.luot, tongThoiDiem))}</td>
          </tr>
        ))}
        <tr className="bg-[#DCE6F1] font-bold">
          <td className="p-3">Tổng cộng</td>
          <td className="p-3 text-center">{tongThoiDiem}</td>
          <td className="p-3 text-center">{tongThoiDiem > 0 ? '100.0%' : '0.0%'}</td>
        </tr>
      </ReportTable>

      {/* 6. Kết quả chung */}
      <ReportTable
        index="6"
        title="Kết quả chung (Đạt/Không đạt)"
        note="Mục tiêu IPSG.01.00: 100% lượt nhân viên y tế kiểm tra đúng thông tin định danh bằng hai thông số."
        headers={['Kết quả', 'Số lượng', 'Tỷ lệ %']}
      >
        <tr className="hover:bg-slate-50">
          <td className="p-3">
            <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
              <CheckCircle2 size={16} /> Đạt
            </span>
          </td>
          <td className="p-3 text-center">{totals.dat}</td>
          <td className="p-3 text-center">{fmtPct(pct(totals.dat, totals.n))}</td>
        </tr>
        <tr className="hover:bg-slate-50">
          <td className="p-3">
            <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">
              <XCircle size={16} /> Không đạt
            </span>
          </td>
          <td className="p-3 text-center">{khongDat}</td>
          <td className="p-3 text-center">{fmtPct(pct(khongDat, totals.n))}</td>
        </tr>
      </ReportTable>
    </div>
  );
};
