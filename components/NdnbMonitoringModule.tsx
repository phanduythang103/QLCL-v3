import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw,
  CheckCircle2, XCircle, Activity, MinusCircle, Save, ArrowLeft
} from 'lucide-react';
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
  { id: 'c1', label: '1. NVYT xác nhận họ tên đầy đủ bằng câu hỏi mở?' },
  { id: 'c2', label: '2. NVYT xác nhận ngày tháng năm sinh bằng câu hỏi mở?' }
];

const checklistIds = CRITERIA_NDNB.map(c => c.id);
const TOTAL_CRITERIA = checklistIds.length; // 2

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
    base.checklist_data[id] = true; // true = ?t, false = KhA'ng `t
  });
  return base;
};

export const NdnbMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<GiamSatNdnb[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const { user } = useAuth();
  
  const [editingItem, setEditingItem] = useState<GiamSatNdnb | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH'>('OVERVIEW');
  const [showFilters, setShowFilters] = useState(false);
  const [filterConfig, setFilterConfig] = useState({
    timeRange: 'ThAng nAy',
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
      alert('CA3 l_i xy ra khi lu bn ghi.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bn cA3 chc chn mu`n xA3a bn ghi nAy?')) {
      try {
        await deleteGiamSatNdnb(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('CA3 l_i xy ra khi xA3a.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-4" />
        <p className="text-slate-600">?ang ti d liu...</p>
      </div>
    );
  }

  if (viewMode === 'FORM') {
    return (
      <NdnbForm 
        initialData={editingItem || defaultForm((user as any)?.user_metadata?.full_name || (user as any)?.email?.split('@')[0])}
        departments={departments}
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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 flex items-center gap-2 rounded-xl border transition-all ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Search size={18} />
            <span className="hidden sm:inline">Bộ lọc</span>
          </button>
          <button onClick={() => { setEditingItem(null); setViewMode('FORM'); }} className="px-4 py-2 flex items-center gap-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-sm">
            <Plus size={18} />
            <span className="hidden sm:inline">Thêm mới</span>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tổng số lượt GS</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Tỷ lệ tuân thủ</p>
            <p className="text-2xl font-bold text-slate-800">{stats.complianceRate}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4">Ngày GS</th>
                <th className="p-4">Khoa thực hiện</th>
                <th className="p-4">NVYT được GS</th>
                <th className="p-4">Người bệnh</th>
                <th className="p-4">Tỷ lệ tuân thủ</th>
                <th className="p-4">Người GS</th>
                <th className="p-4 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Không tìm thấy dữ liệu phù hợp</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-700">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                    <td className="p-4">{item.khoa_duoc_giam_sat}</td>
                    <td className="p-4">{item.doi_tuong_giam_sat}</td>
                    <td className="p-4">{item.ho_ten_nguoi_benh}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${item.ty_le_tuan_thu >= 90 ? 'bg-green-100 text-green-700' : item.ty_le_tuan_thu >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {item.ty_le_tuan_thu}%
                      </span>
                    </td>
                    <td className="p-4">{item.nguoi_giam_sat}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingItem(item); setViewMode('FORM'); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Sửa">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Xóa">
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
      </div>
    </div>
  );
};

interface NdnbFormProps {
  initialData: Partial<GiamSatNdnb>;
  departments: any[];
  onSave: (data: Partial<GiamSatNdnb>) => Promise<void>;
  onCancel: () => void;
}

const NdnbForm: React.FC<NdnbFormProps> = ({ initialData, departments, onSave, onCancel }) => {
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
      ty_le_tuan_thu: opps > 0 ? Math.round((achieved / opps) * 100) : 0
    };
  };

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
    await onSave(formData);
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
            <label className="block text-sm font-medium text-slate-700">Ngày giám sát <span className="text-red-500">*</span></label>
            <input type="date" required value={formData.ngay_giam_sat} onChange={e => setFormData({...formData, ngay_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Khoa / Phòng <span className="text-red-500">*</span></label>
            <select required value={formData.khoa_duoc_giam_sat} onChange={e => setFormData({...formData, khoa_duoc_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors">
              <option value="">Chọn khoa phòng...</option>
              {departments.map(d => (
                <option key={d.id} value={d.ten_don_vi}>{d.ten_don_vi}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Họ tên NVYT thực hiện <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.doi_tuong_giam_sat} onChange={e => setFormData({...formData, doi_tuong_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Nguyễn Văn A" />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Người giám sát <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nguoi_giam_sat} onChange={e => setFormData({...formData, nguoi_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Họ tên người bệnh <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.ho_ten_nguoi_benh} onChange={e => setFormData({...formData, ho_ten_nguoi_benh: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white transition-colors" placeholder="Trần Thị B" />
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
                    <span className="text-sm font-medium">Có / Đạt</span>
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
