import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye, Calendar, Building2,
  Users, CheckCircle2, AlertTriangle, XCircle, FileText, Image,
  Upload, X, Camera, LayoutDashboard, List, Filter, RotateCcw,
  ClipboardCheck, AlertCircle, Save, User, ArrowLeft
} from 'lucide-react';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { GsVst } from '../types';
import { fetchGsVst, addGsVst, updateGsVst, deleteGsVst, uploadVstImage } from '../readGsVst';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';

const MOMENTS = [
  "1. Trước khi tiếp xúc người bệnh",
  "2. Trước khi làm thủ thuật vô khuẩn",
  "3. Sau khi tiếp xúc dịch tiết cơ thể",
  "4. Sau khi tiếp xúc người bệnh",
  "5. Sau khi tiếp xúc vật dụng xung quanh người bệnh"
];

export const HandHygieneModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<GsVst[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DmDonVi[]>([]);
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [editingItem, setEditingItem] = useState<GsVst | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH'>('OVERVIEW');
  const [filterConfig, setFilterConfig] = useState({
    type: 'thisMonth',
    startDate: '',
    endDate: '',
    department: 'Tất cả'
  });


  const loadData = async () => {
    try {
      setLoading(true);
      const [vstData, dmData] = await Promise.all([
        fetchGsVst(),
        fetchDmDonVi()
      ]);
      setData(vstData);
      setDepartments(dmData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departmentList = useMemo(() => departments.map(d => d.ten_don_vi).filter(Boolean), [departments]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const range = getDateRange(filterConfig.type, filterConfig.startDate, filterConfig.endDate);
      const matchTime = isDateInRange(item.ngay_giam_sat, range);
      const departmentQuery = filterConfig.department.trim().toLowerCase();
      const matchDept = !departmentQuery
        || departmentQuery === 'tất cả'
        || item.khoa_duoc_giam_sat.toLowerCase().includes(departmentQuery);
      return matchDept && matchTime;
    });
  }, [data, filterConfig]);

  if (viewMode === 'FORM') {
    return (
      <VstForm
        item={editingItem}
        isReadOnly={isReadOnly}
        onClose={() => setViewMode('LIST')}
        onSaved={() => { setViewMode('LIST'); loadData(); }}
        currentUser={user}
        departmentList={departmentList}
      />
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="indicator-subtab-list indicator-subtab-list-2">
            <TabButton
              active={activeTab === 'OVERVIEW'}
              onClick={() => setActiveTab('OVERVIEW')}
              icon={LayoutDashboard}
              label="Tổng quan"
            />
            <TabButton
              active={activeTab === 'DANH_SACH'}
              onClick={() => setActiveTab('DANH_SACH')}
              icon={List}
              label="Danh sách"
            />
          </div>
          {activeTab !== 'DANH_SACH' && (
            <button onClick={() => { setEditingItem(null); setIsReadOnly(false); setActiveTab('DANH_SACH'); setViewMode('FORM'); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#059669] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-green-200 transition-all hover:bg-[#0d6e39] active:scale-95">
              <Plus size={18} /> Thêm giám sát mới
            </button>
          )}
        </div>

        <div className="p-4 lg:p-4 pt-0 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
              <DateRangeFilter filter={filterConfig} onChange={(f) => setFilterConfig({...filterConfig, ...f})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Khoa giám sát</label>
              <input
                type="text"
                list="vst-department-filter-options"
                value={filterConfig.department}
                onChange={e => setFilterConfig({...filterConfig, department: e.target.value})}
                placeholder="Gõ để tìm khoa..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-indigo-500/10 focus:ring-4 transition-all"
              />
              <datalist id="vst-department-filter-options">
                <option value="Tất cả">Tất cả khoa</option>
                {departmentList.map(dept => <option key={dept} value={dept} />)}
              </datalist>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilterConfig({ type: 'thisMonth', startDate: '', endDate: '', department: 'Tất cả' })}
                className="w-full p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-dashed border-slate-300 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw size={14} className="inline mr-2" /> Xóa lọc
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold tracking-tight">Lỗi: {error}</div>
        ) : activeTab === 'OVERVIEW' ? (
          <VstOverview data={filteredData} />
        ) : (
          <VstList
            data={filteredData}
            onAdd={() => { setEditingItem(null); setIsReadOnly(false); setViewMode('FORM'); }}
            onView={(item) => { setEditingItem(item); setIsReadOnly(true); setViewMode('FORM'); }}
            onEdit={(item) => { setEditingItem(item); setIsReadOnly(false); setViewMode('FORM'); }}
            onDelete={async (id) => {
              if (window.confirm('Bạn có chắc muốn xóa bản ghi giám sát này?')) {
                await deleteGsVst(id!);
                loadData();
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`indicator-subtab-button ${
      active ? 'indicator-subtab-button-active' : ''
    }`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
);

const VstOverview = ({ data }: { data: GsVst[] }) => {
  const stats = useMemo(() => {
    const totalMonitors = data.length;
    let totalOpp = 0;
    let totalComp = 0;
    let totalTech = 0;

    data.forEach(item => {
      totalOpp += item.tong_co_hoi || 0;
      totalComp += item.so_lan_tuan_thu || 0;
      totalTech += item.so_lan_dung_ky_thuat || 0;
    });

    return {
      totalMonitors,
      complianceRate: totalOpp > 0 ? (totalComp / totalOpp) * 100 : 0,
      techniqueRate: totalComp > 0 ? (totalTech / totalComp) * 100 : 0,
      totalOpp,
      totalComp,
      totalTech
    };
  }, [data]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="indicator-quick-stats grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <div className="indicator-quick-stat-card bg-white p-3 sm:p-4 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="indicator-quick-stat-icon w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div className="indicator-quick-stat-body">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tổng lượt giám sát</p>
            <h3 className="indicator-quick-stat-value text-sm font-black text-slate-800 tracking-tight">{stats.totalMonitors}</h3>
          </div>
        </div>
        <div className="indicator-quick-stat-card bg-white p-3 sm:p-4 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="indicator-quick-stat-icon w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="indicator-quick-stat-body">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tỷ lệ tuân thủ</p>
            <h3 className="indicator-quick-stat-value text-sm font-black text-emerald-600 tracking-tight">{stats.complianceRate.toFixed(1)}%</h3>
          </div>
        </div>
        <div className="indicator-quick-stat-card bg-white p-3 sm:p-4 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="indicator-quick-stat-icon w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Camera size={20} />
          </div>
          <div className="indicator-quick-stat-body">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Đúng kỹ thuật</p>
            <h3 className="indicator-quick-stat-value text-sm font-black text-blue-600 tracking-tight">{stats.techniqueRate.toFixed(1)}%</h3>
          </div>
        </div>
      </div>

      {/* Additional Overview Content (Moment breakdown) */}
      <div className="vst-detail-stats bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <h3 className="vst-detail-title text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <FileText className="text-indigo-500" size={20} />
                Thống kê chi tiết theo 5 thời điểm
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <span className="text-[9px] font-bold text-slate-400">Tuân thủ</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-bold text-slate-400">Đúng kỹ thuật</span>
                </div>
            </div>
        </h3>
        <div className="space-y-8">
            {MOMENTS.map((moment, idx) => {
                const momentId = idx + 1;
                const momentData = data.flatMap(d => d.checklist_data.moments || []).filter(m => m.id === momentId);
                const totalCount = momentData.length;
                const compCount = momentData.filter(m => m.compliance).length;
                const techCount = momentData.filter(m => m.compliance && m.correct_technique).length;

                const compRate = totalCount > 0 ? (compCount / totalCount) * 100 : 0;
                const techRate = compCount > 0 ? (techCount / compCount) * 100 : 0;

                return (
                    <div key={idx} className="vst-moment-stat group">
                        <div className="vst-moment-stat-header flex justify-between items-center mb-3">
                            <div className="vst-moment-stat-content flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">{momentId}</span>
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{moment}</span>
                            </div>
                            <div className="vst-moment-stat-metrics flex gap-4">
                                <div className="vst-moment-stat-metric text-right">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Tuân thủ</p>
                                    <p className="text-xs font-black text-indigo-600 tracking-tight">{compRate.toFixed(1)}%</p>
                                </div>
                                <div className="vst-moment-stat-metric text-right">
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Kỹ thuật</p>
                                    <p className="text-xs font-black text-emerald-600 tracking-tight">{techRate.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                            <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000 group-hover:bg-indigo-600" style={{ width: `${compRate}%` }} />
                            </div>
                            <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 group-hover:bg-emerald-600" style={{ width: `${techRate}%` }} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

const VstList = ({ data, onView, onEdit, onDelete, onAdd }: { data: GsVst[], onView: (item: GsVst) => void, onEdit: (item: GsVst) => void, onDelete: (id: string) => void, onAdd: () => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchedData = useMemo(() => {
    return data.filter(item =>
      item.khoa_duoc_giam_sat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoi_duoc_giam_sat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
       <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} /> Thêm phiếu giám sát
        </button>
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Tìm theo khoa, người được giám sát..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-standardized">
          <thead className="bg-[#059669] text-white">
            <tr>
              <th className="p-4">Thời gian</th>
              <th className="p-4">Khoa được giám sát</th>
              <th className="p-4">Đối tượng</th>
              <th className="p-4 text-center">Cơ hội</th>
              <th className="p-4 text-center">Tuân thủ</th>
              <th className="p-4 text-center">Kỹ thuật</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {searchedData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-800 tracking-tight">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</span>
                    <span className="text-[10px] text-slate-400 uppercase mt-1">Người GS: {item.nguoi_giam_sat}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <span className="text-sm text-slate-700 uppercase tracking-tight">{item.khoa_duoc_giam_sat}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-block w-fit ${item.doi_tuong === 'Bác sỹ' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                      {item.doi_tuong}
                    </span>
                    <span className="text-sm text-slate-600 mt-1">{item.nguoi_duoc_giam_sat}</span>
                  </div>
                </td>
                <td className="p-6 text-center text-sm text-slate-700">{item.tong_co_hoi}</td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center">
                      <span className="text-sm text-emerald-600">{item.so_lan_tuan_thu}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                        {item.tong_co_hoi > 0 ? ((item.so_lan_tuan_thu / item.tong_co_hoi) * 100).toFixed(1) : 0}%
                      </span>
                   </div>
                </td>
                <td className="p-6 text-center">
                   <div className="flex flex-col items-center">
                      <span className="text-sm text-indigo-600">{item.so_lan_dung_ky_thuat}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                        {item.so_lan_tuan_thu > 0 ? ((item.so_lan_dung_ky_thuat / item.so_lan_tuan_thu) * 100).toFixed(1) : 0}%
                      </span>
                   </div>
                </td>
                <td className="p-6">
                   <div className="flex items-center justify-end gap-2 text-sm">
                     <button onClick={() => onView(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100"><Eye size={16} /></button>
                     <button onClick={() => onEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100"><Edit2 size={16} /></button>
                     <button onClick={() => onDelete(item.id!)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {searchedData.map(item => (
          <div key={item.id} className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#059669]/10 text-[#059669] rounded-xl flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-tight">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Supervisor: {item.nguoi_giam_sat}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onView(item)} className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl active:scale-90 transition-all"><Eye size={16} /></button>
                <button onClick={() => onEdit(item)} className="p-2.5 text-emerald-600 bg-emerald-50 rounded-xl active:scale-90 transition-all"><Edit2 size={16} /></button>
                <button onClick={() => onDelete(item.id!)} className="p-2.5 text-rose-600 bg-rose-50 rounded-xl active:scale-90 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[11px] font-black text-slate-700 leading-tight block">{item.nguoi_duoc_giam_sat || 'Chưa nhập họ tên'}</span>
              <span className="text-[10px] font-bold text-slate-500 leading-tight block">Khoa: {item.khoa_duoc_giam_sat}</span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center">
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tuân thủ</span>
                <span className="text-sm font-black text-emerald-700">{item.tong_co_hoi > 0 ? ((item.so_lan_tuan_thu / item.tong_co_hoi) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex-1 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 flex flex-col items-center">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Đúng KT</span>
                <span className="text-sm font-black text-indigo-700">{item.so_lan_tuan_thu > 0 ? ((item.so_lan_dung_ky_thuat / item.so_lan_tuan_thu) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="flex-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-200 flex flex-col items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cơ hội</span>
                <span className="text-sm font-black text-slate-700">{item.tong_co_hoi}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
        {searchedData.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center opacity-30">
            <FileText size={48} className="mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Chưa có bản ghi giám sát nào</p>
          </div>
        )}
      </div>
  );
};

const VstForm = ({ item, isReadOnly, onClose, onSaved, currentUser, departmentList }: {
  item: GsVst | null,
  isReadOnly: boolean,
  onClose: () => void,
  onSaved: () => void,
  currentUser: any,
  departmentList: string[]
}) => {
  const [formData, setFormData] = useState<GsVst>({
    ngay_giam_sat: item?.ngay_giam_sat || new Date().toISOString().split('T')[0],
    nguoi_giam_sat: item?.nguoi_giam_sat || currentUser?.full_name || '',
    khoa_duoc_giam_sat: item?.khoa_duoc_giam_sat || currentUser?.department || '',
    doi_tuong: item?.doi_tuong || 'Điều dưỡng',
    nguoi_duoc_giam_sat: item?.nguoi_duoc_giam_sat || '',
    checklist_data: item?.checklist_data || {
      moments: MOMENTS.map((name, index) => ({
        id: index + 1,
        name,
        co_hoi: false, // New mapping to template field
        compliance: false,
        correct_technique: false,
        note: ''
      }))
    },
    tong_co_hoi: item?.tong_co_hoi || 0,
    so_lan_tuan_thu: item?.so_lan_tuan_thu || 0,
    so_lan_dung_ky_thuat: item?.so_lan_dung_ky_thuat || 0,
    hinh_anh_minh_chung: item?.hinh_anh_minh_chung || [],
    ghi_chu_chung: item?.ghi_chu_chung || ''
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tự động tính toán số liệu khi checklist thay đổi
  useEffect(() => {
    if (isReadOnly) return;
    const moments = formData.checklist_data.moments;
    const tong_co_hoi = moments.filter((m: any) => m.co_hoi).length;
    const so_lan_tuan_thu = moments.filter((m: any) => m.co_hoi && m.compliance).length;
    const so_lan_dung_ky_thuat = moments.filter((m: any) => m.co_hoi && m.compliance && m.correct_technique).length;

    setFormData((prev: GsVst) => ({
      ...prev,
      tong_co_hoi,
      so_lan_tuan_thu,
      so_lan_dung_ky_thuat
    }));
  }, [formData.checklist_data.moments, isReadOnly]);

  const handleToggle = (id: number, field: 'co_hoi' | 'compliance' | 'correct_technique') => {
    if (isReadOnly) return;
    setFormData((prev: GsVst) => {
      const newMoments = prev.checklist_data.moments.map((m: any) => {
        if (m.id === id) {
          const newVal = !m[field];
          const updated = { ...m, [field]: newVal };

          // Ràng buộc: Nếu không tuân thủ thì không thể đúng kỹ thuật
          if (field === 'compliance' && !newVal) updated.correct_technique = false;
          // Ràng buộc: Nếu không có cơ hội thì không có tuân thủ/kỹ thuật
          if (field === 'co_hoi' && !newVal) {
            updated.compliance = false;
            updated.correct_technique = false;
          }
          return updated;
        }
        return m;
      });
      return { ...prev, checklist_data: { moments: newMoments } };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadVstImage(file));
      const urls = await Promise.all(uploadPromises);
      setFormData((prev: GsVst) => ({
        ...prev,
        hinh_anh_minh_chung: [...prev.hinh_anh_minh_chung, ...urls]
      }));
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Lỗi khi tải ảnh lên: ' + (err.message || 'Không rõ nguyên nhân'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    if (isReadOnly) return;
    setFormData((prev: GsVst) => ({
      ...prev,
      hinh_anh_minh_chung: prev.hinh_anh_minh_chung.filter((u: string) => u !== url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item?.id) await updateGsVst(item.id, formData);
      else await addGsVst(formData);
      onSaved();
    } catch (err: any) {
      console.error('Error saving hand hygiene monitoring:', err);
      alert('Lỗi khi lưu giám sát: ' + (err?.message || 'Không rõ nguyên nhân'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-8rem)]">
      <div className="w-full flex flex-col h-full animate-in fade-in duration-500">
        <div className="flex flex-col h-full bg-white">

          {/* Form Header - Emerald Theme */}
          <div className="bg-emerald-600 p-4 md:p-8 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex min-w-0 items-center gap-3 md:gap-5 relative z-10">
              <button
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner hover:bg-white/30 transition-all active:scale-90 shrink-0"
              >
                 <ArrowLeft size={20} className="text-white md:hidden" />
                 <ArrowLeft size={24} className="text-white hidden md:block" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base md:text-2xl font-black uppercase tracking-normal md:tracking-tight leading-tight md:leading-none mb-0.5 md:mb-1 break-words">
                  {isReadOnly ? 'Chi tiết Giám sát' : item ? 'Cập nhật bản ghi' : 'Thêm phiếu Giám sát'}
                </h2>
                <p className="text-emerald-100 text-[9px] md:text-[11px] font-bold uppercase tracking-wider md:tracking-widest opacity-80">Giám sát vệ sinh tay</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90 relative z-10 hidden md:block"
            >
              <X size={28}/>
            </button>
          </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <form id="vst-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Thông tin chung - Grid Layout from Template */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <Calendar size={14} /> Ngày giám sát
                </label>
                <input
                  type="date"
                  value={formData.ngay_giam_sat}
                  onChange={e => setFormData({...formData, ngay_giam_sat: e.target.value})}
                  disabled={isReadOnly}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all cursor-pointer"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <User size={14} /> Người giám sát
                </label>
                <input
                  type="text"
                  value={formData.nguoi_giam_sat}
                  onChange={e => setFormData({...formData, nguoi_giam_sat: e.target.value})}
                  disabled={isReadOnly}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  placeholder="Họ tên người GS"
                />
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <Building2 size={14} /> Khoa giám sát
                </label>
                <input
                  type="text"
                  list="vst-form-department-options"
                  value={formData.khoa_duoc_giam_sat}
                  onChange={e => setFormData({...formData, khoa_duoc_giam_sat: e.target.value})}
                  disabled={isReadOnly}
                  placeholder="Gõ để tìm hoặc nhập khoa/phòng"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
                <datalist id="vst-form-department-options">
                  {departmentList.map((d: string) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="space-y-2 group">
                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">
                  <Users size={14} /> Đối tượng được giám sát
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.doi_tuong}
                    onChange={e => setFormData({...formData, doi_tuong: e.target.value})}
                    disabled={isReadOnly}
                    className="w-24 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none text-center"
                  >
                    <option value="Bác sỹ">BS</option>
                    <option value="Điều dưỡng">ĐD</option>
                    <option value="Hộ lý">HL</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <input
                    type="text"
                    value={formData.nguoi_duoc_giam_sat}
                    onChange={e => setFormData({...formData, nguoi_duoc_giam_sat: e.target.value})}
                    disabled={isReadOnly}
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    placeholder="Họ tên NVYT"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Checklist Quan sát - Table from Template */}
            <div className={`space-y-4 ${isReadOnly ? 'hidden md:block' : ''}`}>
              <div className="flex items-center border-b border-slate-100 pb-3">
                 <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    <CheckCircle2 size={18} className="text-emerald-600" /> Bảng quan sát chi tiết (5 Thời điểm)
                 </h3>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="p-4 border-b w-[280px]">Thời điểm</th>
                      <th className="p-4 border-b text-center w-20">Cơ hội</th>
                      <th className={`p-4 border-b text-center w-20 ${isReadOnly ? 'text-black' : ''}`}>Tuân thủ</th>
                      <th className={`p-4 border-b text-center w-20 ${isReadOnly ? 'text-black' : ''}`}>Đúng KT</th>
                      <th className="p-4 border-b">Ghi chú chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {formData.checklist_data.moments.map((m: any) => (
                      <tr
                        key={m.id}
                        className={`transition-all border-b last:border-0 ${m.co_hoi ? 'bg-emerald-50/40' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="p-4 border-r border-slate-100">
                          <span className="font-bold text-slate-700 block text-[11px] leading-tight uppercase">
                            {m.name}
                          </span>
                        </td>
                        <td className="p-4 border-r border-slate-100 text-center">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                            checked={m.co_hoi}
                            onChange={() => handleToggle(m.id, 'co_hoi')}
                          />
                        </td>
                        <td className="p-4 border-r border-slate-100 text-center">
                          <input
                            type="checkbox"
                            disabled={isReadOnly || !m.co_hoi}
                            className="w-5 h-5 rounded cursor-pointer accent-emerald-600 disabled:opacity-30"
                            checked={m.compliance}
                            onChange={() => handleToggle(m.id, 'compliance')}
                          />
                        </td>
                        <td className="p-4 border-r border-slate-100 text-center">
                          <input
                            type="checkbox"
                            disabled={isReadOnly || !m.compliance}
                            className="w-5 h-5 rounded cursor-pointer accent-orange-500 disabled:opacity-30"
                            checked={m.correct_technique}
                            onChange={() => handleToggle(m.id, 'correct_technique')}
                          />
                        </td>
                        <td className="p-3">
                          {isReadOnly ? (
                            String(m.note || '').trim() ? (
                              <p className="px-2 py-1 text-xs font-bold text-black">{m.note}</p>
                            ) : null
                          ) : (
                            <input
                              type="text"
                              value={m.note}
                              onChange={e => {
                                const newMoments = formData.checklist_data.moments.map((item: any) => item.id === m.id ? { ...item, note: e.target.value } : item);
                                setFormData({ ...formData, checklist_data: { moments: newMoments } });
                              }}
                              placeholder="..."
                              className="w-full bg-transparent border-b border-transparent focus:border-emerald-300 outline-none px-2 py-1 text-xs font-bold italic text-slate-500"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

              {/* Results Summary Bar */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-[28px] p-4 md:p-6 shadow-xl shadow-indigo-900/5">
                <div className="grid grid-cols-3 gap-2 md:gap-4 divide-x divide-indigo-100">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cơ hội</span>
                    <span className="text-lg md:text-2xl font-black text-slate-800">{formData.tong_co_hoi}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 ${isReadOnly ? 'text-black' : 'text-slate-400'}`}>Tuân thủ</span>
                    <span className="text-lg md:text-2xl font-black text-emerald-600">{formData.so_lan_tuan_thu}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 ${isReadOnly ? 'text-black' : 'text-slate-400'}`}>Đúng KT</span>
                    <span className="text-lg md:text-2xl font-black text-indigo-600">{formData.so_lan_dung_ky_thuat}</span>
                  </div>
                </div>
              </div>

            {/* Evidence Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3">
                 <Image size={18} className="text-emerald-500" />
                 Hình ảnh minh chứng
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {formData.hinh_anh_minh_chung.map((url: string, idx: number) => (
                  <div key={idx} className="relative aspect-square group rounded-[24px] overflow-hidden border border-slate-200">
                    <img src={url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {!isReadOnly && (
                   <label className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all">
                        {uploading ? <Upload className="animate-bounce" size={20} /> : <Plus size={24} />}
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{uploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
                      <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                   </label>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {(!isReadOnly || formData.ghi_chu_chung.trim()) && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ghi chú chung</label>
                {isReadOnly ? (
                  <p className="w-full px-6 py-4 bg-slate-50 rounded-[24px] font-bold text-black whitespace-pre-wrap">
                    {formData.ghi_chu_chung}
                  </p>
                ) : (
                  <textarea
                    value={formData.ghi_chu_chung}
                    onChange={e => setFormData({...formData, ghi_chu_chung: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[24px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all h-24 resize-none"
                    placeholder="Nhập ghi chú thêm nếu có..."
                  />
                )}
              </div>
            )}
          </form>
        </div>

        {/* Form Footer */}
        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-200 transition-all active:scale-95 bg-white border border-slate-200">Quay lại</button>
          {!isReadOnly && (
            <button
              type="submit"
              form="vst-form"
              disabled={saving || uploading}
              className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Hoàn tất Giám sát'}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
