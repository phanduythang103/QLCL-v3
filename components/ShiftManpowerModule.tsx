import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, AlertTriangle, XCircle,
  Plus, Search, Edit2, Trash2, Calendar, Eye, Filter,
  Activity, Target, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BcNhanLucCa, fetchBcNhanLucCa, addBcNhanLucCa, updateBcNhanLucCa, deleteBcNhanLucCa } from '../readBcNhanLucCa';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';

export const ShiftManpowerModule: React.FC<{ hideHeader?: boolean }> = ({ hideHeader }) => {
  const [data, setData] = useState<BcNhanLucCa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DmDonVi[]>([]);

  const { user } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [bcData, dmData] = await Promise.all([
        fetchBcNhanLucCa(),
        fetchDmDonVi()
      ]);
      setData(bcData);
      setDepartments(dmData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BcNhanLucCa | null>(null);

  const departmentList = useMemo(() => {
     return departments.map(d => d.ten_don_vi).filter(Boolean);
  }, [departments]);

  return (
    <div className={hideHeader ? '' : 'bg-slate-50 min-h-[calc(100vh-8rem)]'}>
      <div className={hideHeader ? 'py-4' : 'p-4 md:p-6 max-w-7xl mx-auto'}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">Lỗi tải dữ liệu: {error}</div>
        ) : (
          <ListTab 
            data={data} 
            onView={(item: BcNhanLucCa) => { setEditingItem(item); (window as any)._isViewing = true; setIsFormOpen(true); }}
            onEdit={(item: BcNhanLucCa) => { setEditingItem(item); (window as any)._isViewing = false; setIsFormOpen(true); }}
            onDelete={async (id: string | undefined) => {
              if(window.confirm('Bạn có chắc muốn xóa báo cáo này?')) {
                await deleteBcNhanLucCa(id!);
                loadData();
              }
            }}
            onAddNew={() => { setEditingItem(null); (window as any)._isViewing = false; setIsFormOpen(true); }}
          />
        )}
      </div>

      {isFormOpen && (
        <ShiftManpowerFormModal 
          item={editingItem} 
          isReadOnly={(window as any)._isViewing}
          onClose={() => { setIsFormOpen(false); (window as any)._isViewing = false; }} 
          onSaved={() => { setIsFormOpen(false); loadData(); (window as any)._isViewing = false; }}
          currentUser={user}
          departmentList={departmentList}
        />
      )}
    </div>
  );
};


// ================= LIST TAB =================
const ListTab = ({ data, onView, onEdit, onDelete, onAddNew }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = useMemo(() => {
    return data.filter((item: BcNhanLucCa) => 
      item.khoa_bao_cao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nguoi_bao_cao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm flex flex-col h-full animate-in fade-in duration-300 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo khoa, người báo cáo..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <button onClick={onAddNew} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-200 active:scale-95">
          <Plus size={20} /> Thêm báo cáo
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
              <th className="p-6">Thời gian</th>
              <th className="p-6">Khoa / Đơn vị</th>
              <th className="p-6 text-center bg-slate-100/30">Ca Sáng</th>
              <th className="p-6 text-center bg-slate-100/50">Ca Chiều</th>
              <th className="p-6 text-center bg-slate-100/80">Ca Đêm</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((item: BcNhanLucCa) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-sm tracking-tight">{new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN')}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bởi: {item.nguoi_bao_cao}</span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={16} />
                    </div>
                    <span className="font-black text-slate-700 text-sm uppercase tracking-tight">{item.khoa_bao_cao}</span>
                  </div>
                </td>
                
                {/* Ca Sáng */}
                <td className="p-4 text-center bg-indigo-50/10">
                   <div className="flex flex-col items-center">
                     <div className="flex items-center gap-2 mb-1">
                        <Badge label={`NB: ${item.sang_nb}`} color="blue" />
                        <Badge label={`ĐD: ${item.sang_dd}`} color="indigo" />
                     </div>
                     <span className="text-[11px] font-black text-indigo-600 font-mono">Tỷ lệ: {item.sang_ty_le}</span>
                     <SafetyBadge status={item.sang_an_toan} />
                   </div>
                </td>

                {/* Ca Chiều */}
                <td className="p-4 text-center bg-indigo-50/20">
                   <div className="flex flex-col items-center">
                     <div className="flex items-center gap-2 mb-1">
                        <Badge label={`NB: ${item.chieu_nb}`} color="blue" />
                        <Badge label={`ĐD: ${item.chieu_dd}`} color="indigo" />
                     </div>
                     <span className="text-[11px] font-black text-indigo-600 font-mono">Tỷ lệ: {item.chieu_ty_le}</span>
                     <SafetyBadge status={item.chieu_an_toan} />
                   </div>
                </td>

                {/* Ca Đêm */}
                <td className="p-4 text-center bg-indigo-50/30">
                   <div className="flex flex-col items-center">
                     <div className="flex items-center gap-2 mb-1">
                        <Badge label={`NB: ${item.dem_nb}`} color="blue" />
                        <Badge label={`ĐD: ${item.dem_dd}`} color="indigo" />
                     </div>
                     <span className="text-[11px] font-black text-indigo-600 font-mono">Tỷ lệ: {item.dem_ty_le}</span>
                     <SafetyBadge status={item.dem_an_toan} />
                   </div>
                </td>

                <td className="p-6">
                  <div className="flex items-center justify-end gap-2">
                    <ActionButton icon={<Eye size={16} />} color="indigo" onClick={() => onView(item)} />
                    <ActionButton icon={<Edit2 size={16} />} color="emerald" onClick={() => onEdit(item)} />
                    <ActionButton icon={<Trash2 size={16} />} color="rose" onClick={() => onDelete(item.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-slate-100">
        {filteredData.map((item: BcNhanLucCa) => (
          <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
              <div className="flex flex-col">
                <span className="font-black text-slate-800 text-sm">{new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN')}</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">{item.khoa_bao_cao}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
                <ActionButton icon={<Eye size={12} />} label="Xem" color="indigo" onClick={() => onView(item)} />
                <ActionButton icon={<Edit2 size={12} />} label="Sửa" color="emerald" onClick={() => onEdit(item)} />
                <ActionButton icon={<Trash2 size={12} />} label="Xóa" color="rose" onClick={() => onDelete(item.id)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">Sáng</span>
                <span className="text-xs font-black text-indigo-600">{item.sang_ty_le}</span>
                <SafetyIcon status={item.sang_an_toan} />
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">Chiều</span>
                <span className="text-xs font-black text-indigo-600">{item.chieu_ty_le}</span>
                <SafetyIcon status={item.chieu_an_toan} />
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase">Đêm</span>
                <span className="text-xs font-black text-indigo-600">{item.dem_ty_le}</span>
                <SafetyIcon status={item.dem_an_toan} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="p-20 text-center">
            <div className="flex flex-col items-center opacity-30">
              <FileText size={48} className="mb-4" />
              <p className="font-black uppercase tracking-widest text-xs">Chưa có dữ liệu báo cáo</p>
            </div>
        </div>
      )}
    </div>
  );
};

const Badge = ({ label, color }: { label: string, color: 'blue' | 'indigo' | 'emerald' | 'rose' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${colors[color]} whitespace-nowrap`}>
      {label}
    </span>
  );
};

const SafetyBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string, icon: any }> = {
    'An toàn': { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
    'Cảnh báo': { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: AlertTriangle },
    'Nguy cơ': { color: 'text-orange-600 bg-orange-50 border-orange-100', icon: AlertTriangle },
    'Không an toàn': { color: 'text-rose-600 bg-rose-50 border-rose-100', icon: XCircle }
  };
  const { color, icon: Icon } = config[status] || config['An toàn'];
  return (
    <div className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color} text-[9px] font-black uppercase tracking-tight`}>
       <Icon size={12} /> {status}
    </div>
  );
};

const SafetyIcon = ({ status }: { status: string }) => {
  const config: Record<string, { color: string, icon: any }> = {
    'An toàn': { color: 'text-emerald-500', icon: CheckCircle2 },
    'Cảnh báo': { color: 'text-amber-500', icon: AlertTriangle },
    'Nguy cơ': { color: 'text-orange-500', icon: AlertTriangle },
    'Không an toàn': { color: 'text-rose-500', icon: XCircle }
  };
  const { color, icon: Icon } = config[status] || config['An toàn'];
  return <Icon size={14} className={color} />;
};

const ActionButton = ({ icon, label, color, onClick }: any) => {
  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50/50 border-indigo-100 hover:bg-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100',
    rose: 'text-rose-600 bg-rose-50/50 border-rose-100 hover:bg-rose-100'
  };
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-90 ${colors[color]}`}>
      {icon}
      {label && <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>}
    </button>
  );
};

// ================= FORM MODAL =================
const ShiftManpowerFormModal = ({ item, isReadOnly, onClose, onSaved, currentUser, departmentList }: any) => {
  const [formData, setFormData] = useState<BcNhanLucCa>({
    ngay_bao_cao: item?.ngay_bao_cao || new Date().toISOString().split('T')[0],
    nguoi_bao_cao: item?.nguoi_bao_cao || currentUser?.full_name || '',
    khoa_bao_cao: item?.khoa_bao_cao || currentUser?.department || '',
    sang_dd: item?.sang_dd || 0,
    sang_nb: item?.sang_nb || 0,
    sang_ty_le: item?.sang_ty_le || 0,
    sang_an_toan: item?.sang_an_toan || 'An toàn',
    chieu_dd: item?.chieu_dd || 0,
    chieu_nb: item?.chieu_nb || 0,
    chieu_ty_le: item?.chieu_ty_le || 0,
    chieu_an_toan: item?.chieu_an_toan || 'An toàn',
    dem_dd: item?.dem_dd || 0,
    dem_nb: item?.dem_nb || 0,
    dem_ty_le: item?.dem_ty_le || 0,
    dem_an_toan: item?.dem_an_toan || 'An toàn'
  });

  const [saving, setSaving] = useState(false);

  // Auto-calculate ratios
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      sang_ty_le: prev.sang_dd > 0 ? Number((prev.sang_nb / prev.sang_dd).toFixed(2)) : 0,
      chieu_ty_le: prev.chieu_dd > 0 ? Number((prev.chieu_nb / prev.chieu_dd).toFixed(2)) : 0,
      dem_ty_le: prev.dem_dd > 0 ? Number((prev.dem_nb / prev.dem_dd).toFixed(2)) : 0
    }));
  }, [formData.sang_dd, formData.sang_nb, formData.chieu_dd, formData.chieu_nb, formData.dem_dd, formData.dem_nb]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item?.id) await updateBcNhanLucCa(item.id, formData);
      else await addBcNhanLucCa(formData);
      onSaved();
    } catch (err) {
      alert('Lỗi khi lưu báo cáo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            {isReadOnly ? 'Chi tiết báo cáo' : item ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors"><XCircle size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="report-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Ngày báo cáo</label>
                <input type="date" value={formData.ngay_bao_cao} onChange={e => setFormData({...formData, ngay_bao_cao: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 font-medium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Khoa thực hiện</label>
                <input list="khoa-suggestions" value={formData.khoa_bao_cao} onChange={e => setFormData({...formData, khoa_bao_cao: e.target.value})} disabled={isReadOnly} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-bold" placeholder="Chọn khoa..." />
                <datalist id="khoa-suggestions">{departmentList.map((d: string) => <option key={d} value={d}/>)}</datalist>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase">Người báo cáo</label>
                <input type="text" value={formData.nguoi_bao_cao} disabled className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-500 font-medium" />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-slate-50 text-slate-700">
                  <tr className="font-black uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="p-4 border-r border-slate-200 w-40">Ca trực</th>
                    <th className="p-4 border-r border-slate-200">Số lượng ĐD</th>
                    <th className="p-4 border-r border-slate-200">Số lượng NB</th>
                    <th className="p-4 border-r border-slate-200">Tỷ số thực tế</th>
                    <th className="p-4">Đánh giá an toàn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Ca Sáng */}
                  <ShiftRow 
                    label="Ca sáng" 
                    shiftPrefix="sang" 
                    formData={formData} 
                    setFormData={setFormData}
                    isReadOnly={isReadOnly}
                  />
                  {/* Ca Chiều */}
                  <ShiftRow 
                    label="Ca chiều" 
                    shiftPrefix="chieu" 
                    formData={formData} 
                    setFormData={setFormData}
                    isReadOnly={isReadOnly}
                  />
                  {/* Ca Đêm */}
                  <ShiftRow 
                    label="Ca đêm" 
                    shiftPrefix="dem" 
                    formData={formData} 
                    setFormData={setFormData}
                    isReadOnly={isReadOnly}
                  />
                </tbody>
              </table>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Đóng</button>
          {!isReadOnly && (
            <button type="submit" form="report-form" disabled={saving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ShiftRow = ({ label, shiftPrefix, formData, setFormData, isReadOnly }: any) => {
  const ddKey = `${shiftPrefix}_dd`;
  const nbKey = `${shiftPrefix}_nb`;
  const ratioKey = `${shiftPrefix}_ty_le`;
  const safeKey = `${shiftPrefix}_an_toan`;

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="p-4 font-black text-slate-800 bg-slate-50/50 border-r border-slate-200 flex items-center gap-2">
        <Clock size={16} className="text-indigo-400" /> {label}
      </td>
      <td className="p-2 border-r border-slate-200">
        <input type="number" value={formData[ddKey]} onChange={e => setFormData({...formData, [ddKey]: Number(e.target.value)})} disabled={isReadOnly} className="w-full p-2 border border-transparent focus:border-indigo-500 outline-none rounded-lg font-bold text-center" />
      </td>
      <td className="p-2 border-r border-slate-200">
        <input type="number" value={formData[nbKey]} onChange={e => setFormData({...formData, [nbKey]: Number(e.target.value)})} disabled={isReadOnly} className="w-full p-2 border border-transparent focus:border-indigo-500 outline-none rounded-lg font-bold text-center" />
      </td>
      <td className="p-2 border-r border-slate-200 text-center">
        <div className="font-black text-indigo-600 text-base">{formData[ratioKey]}</div>
        <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">(NB/ĐD)</div>
      </td>
      <td className="p-2">
        <select value={formData[safeKey]} onChange={e => setFormData({...formData, [safeKey]: e.target.value})} disabled={isReadOnly} className="w-full p-2 border border-transparent focus:border-indigo-500 outline-none rounded-lg font-bold text-indigo-700 bg-indigo-50/30">
          <option value="An toàn">✅ An toàn</option>
          <option value="Cảnh báo">⚠️ Cảnh báo</option>
          <option value="Nguy cơ">🚨 Nguy cơ</option>
          <option value="Không an toàn">❌ Không an toàn</option>
        </select>
      </td>
    </tr>
  );
};
