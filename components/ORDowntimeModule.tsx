import React, { useState, useEffect } from 'react';
import {
  Clock, BarChart2, Search, Plus, Edit, Trash2, X,
  CheckCircle2, User, Calendar, Building2, AlertCircle,
  TrendingDown, TrendingUp, Layout, FileText, ChevronDown, 
  ChevronRight, Activity, PlusCircle, MinusCircle, Target
} from 'lucide-react';
import { fetchThoiGianChetPM, ThoiGianChetPM, ThoiGianChetPMInput, addThoiGianChetPM, updateThoiGianChetPM, deleteThoiGianChetPM, DEFAULT_MILESTONES, DowntimeDetail } from '../readThoiGianChetPM';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
      active ? 'bg-[#009900] text-white shadow-lg shadow-[#009900]/20 scale-105' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={16} />
    <span className="font-bold uppercase text-[11px] tracking-wider">{label}</span>
  </button>
);

export const ORDowntimeModule: React.FC<{ isSubModule?: boolean }> = ({ isSubModule = false }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH'>('OVERVIEW');
  const [records, setRecords] = useState<ThoiGianChetPM[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ThoiGianChetPM | null>(null);
  const [editingRecord, setEditingRecord] = useState<ThoiGianChetPM | null>(null);

  // Form State
  const defaultDetails = (): DowntimeDetail[] => 
    DEFAULT_MILESTONES.map((m, i) => ({ stt: i + 1, milestone: m, time_min: 0, reason: '' }));

  const emptyForm = (): ThoiGianChetPMInput => ({
    ngay_bao_cao: new Date().toISOString().split('T')[0],
    nguoi_bao_cao: user?.full_name || '',
    phong_mo_so: '',
    chuyen_khoa: '',
    chi_tiet: defaultDetails(),
  });
  const [form, setForm] = useState(emptyForm());

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, uData] = await Promise.all([
        fetchThoiGianChetPM(),
        fetchDmDonVi()
      ]);
      setRecords(rData);
      setUnits(uData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const handleEdit = (r: ThoiGianChetPM) => {
    setEditingRecord(r);
    setForm({
      ngay_bao_cao: r.ngay_bao_cao,
      nguoi_bao_cao: r.nguoi_bao_cao,
      phong_mo_so: r.phong_mo_so,
      chuyen_khoa: r.chuyen_khoa,
      chi_tiet: [...r.chi_tiet],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa phân tích này?')) return;
    try {
      await deleteThoiGianChetPM(id);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateThoiGianChetPM(editingRecord.id, form);
      } else {
        await addThoiGianChetPM(form);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const addRow = () => {
    const newStt = form.chi_tiet.length + 1;
    setForm({
      ...form,
      chi_tiet: [...form.chi_tiet, { stt: newStt, milestone: '', time_min: 0, reason: '' }]
    });
  };

  const removeRow = (index: number) => {
    const newDetails = form.chi_tiet.filter((_, i) => i !== index).map((d, i) => ({ ...d, stt: i + 1 }));
    setForm({ ...form, chi_tiet: newDetails });
  };

  const updateDetail = (index: number, field: keyof DowntimeDetail, value: any) => {
    const newDetails = [...form.chi_tiet];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setForm({ ...form, chi_tiet: newDetails });
  };

  // Stats
  const totalDowntimeAll = records.reduce((a, b) => a + Number(b.total_downtime), 0);
  const avgDowntime = records.length > 0 ? (totalDowntimeAll / records.length).toFixed(1) : '0';

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'TG chết TB', value: avgDowntime, unit: 'phút', icon: Clock, color: 'text-[#009900]', bg: 'bg-[#009900]/10' },
          { label: 'Tổng ca', value: records.length, unit: 'ca', icon: FileText, color: 'text-[#009900]', bg: 'bg-[#009900]/10' },
          { label: 'Số phòng mổ', value: new Set(records.map(r => r.phong_mo_so)).size, unit: 'phòng', icon: Layout, color: 'text-[#009900]', bg: 'bg-[#009900]/10' },
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
            <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{label}</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">{value} <span className="text-xs font-bold text-slate-400">{unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-[#009900]" /> 
            Phân tích gần đây
          </h3>
          <button onClick={() => setActiveTab('DANH_SACH')} className="text-[#009900] text-xs font-black uppercase hover:underline">Xem tất cả</button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-6 py-4 font-black">Ngày báo cáo</th>
                <th className="px-6 py-4 font-black">Phòng mổ</th>
                <th className="px-6 py-4 font-black">Chuyên khoa</th>
                <th className="px-6 py-4 font-black text-right">Tổng thời gian chết (phút)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.slice(0, 5).map(r => (
                <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{r.ngay_bao_cao.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-800">Phòng {r.phong_mo_so}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-600">{r.chuyen_khoa}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-violet-600 font-mono">{r.total_downtime}</span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-50">
          {records.slice(0, 5).map(r => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">{r.ngay_bao_cao.split('-').reverse().join('/')}</p>
                  <p className="text-sm font-black text-slate-800">Phòng {r.phong_mo_so} - {r.chuyen_khoa}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">TG Chết</p>
                  <p className="text-sm font-black text-[#009900]">{r.total_downtime} ph</p>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDanhSach = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Tìm theo phòng, khoa, ngày..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-table font-bold focus:ring-2 focus:ring-[#009900]/20 transition-all" 
          />
        </div>
        <button 
          onClick={handleAdd}
          className="bg-[#009900] text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase hover:shadow-lg active:scale-95 transition-all w-full md:w-auto justify-center"
        >
          <Plus size={18} /> Phân tích mới
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#009900] text-white text-[14px] uppercase font-bold tracking-widest border-b border-[#009900]">
              <th className="px-6 py-4">Ngày báo cáo</th>
              <th className="px-6 py-4">Phòng mổ</th>
              <th className="px-6 py-4">Chuyên khoa</th>
              <th className="px-6 py-4 text-right">Tổng TG chết (Phút)</th>
              <th className="px-6 py-4 text-right w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-table font-bold text-slate-600">{r.ngay_bao_cao.split('-').reverse().join('/')}</td>
                <td className="px-6 py-4 text-table font-bold text-slate-800 uppercase tracking-tight">Phòng {r.phong_mo_so}</td>
                <td className="px-6 py-4 text-table font-bold text-slate-500">{r.chuyen_khoa || 'Chưa phân công'}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-table font-bold text-[#009900] font-mono">{r.total_downtime}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                    <button onClick={() => handleEdit(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest italic">Chưa có dữ liệu phân tích</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid grid-cols-1 gap-4 mt-4">
        {records.map(r => (
          <div key={r.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all active:scale-[0.98]">
            {/* Line 1: Header - Date & Room + Actions */}
            <div className="p-5 flex justify-between items-center border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#009900]/10 rounded-xl flex items-center justify-center text-[#009900]">
                  <Layout size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">{r.ngay_bao_cao.split('-').reverse().join('/')}</p>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Phòng {r.phong_mo_so}</h4>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(r)} className="w-9 h-9 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl active:bg-blue-100 active:text-blue-600 transition-colors"><Edit size={16} /></button>
                <button onClick={() => handleDelete(r.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl active:bg-red-100 active:text-red-600 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>

            {/* Line 2: Total Downtime - Prominent Chip */}
            <div className="px-5 py-4 bg-[#009900]/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#009900]" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tổng TG chết</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-black text-[#009900] font-mono leading-none">{r.total_downtime} <span className="text-[10px] font-bold text-slate-400 uppercase ml-0.5 tracking-normal">phút</span></span>
                <button 
                  onClick={() => {
                    setSelectedRecord(r);
                    setShowDetailModal(true);
                  }}
                  className="bg-[#009900] text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase shadow-sm active:scale-95 transition-all"
                >
                  Xem
                </button>
              </div>
            </div>
          </div>
        ))}
        {records.length === 0 && (
          <div className="bg-slate-50 rounded-[32px] p-16 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200">
            Chưa có dữ liệu phân tích
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col gap-6">
      {!isSubModule && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#009900]/10 rounded-2xl flex items-center justify-center text-[#009900] shadow-sm shrink-0 border border-[#009900]/20">
                <TrendingDown size={28} />
              </div>
              <div>
              <h2 className="text-main-title font-bold text-slate-800 tracking-tight uppercase">Phân tích thời gian chết phòng mổ</h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">Xác định các nguyên nhân gây lãng phí thời gian giữa các ca mổ</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 bg-white/50 p-2 rounded-[24px] md:rounded-3xl border border-white/50 backdrop-blur-md self-start w-full md:w-auto">
            <div className="flex flex-nowrap overflow-x-auto w-full md:w-auto gap-2 scrollbar-hide">
              <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" />
              <TabButton active={activeTab === 'DANH_SACH'} onClick={() => setActiveTab('DANH_SACH')} icon={FileText} label="Danh sách phân tích" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Đang tải dữ liệu...</p>
          </div>
        ) : (
          activeTab === 'OVERVIEW' ? renderOverview() : renderDanhSach()
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#009900]/10 rounded-xl flex items-center justify-center text-[#009900]">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800">{editingRecord ? 'Cập nhật phân tích' : 'Phân tích thời gian chết mới'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng nhập chi tiết các mốc thời gian</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày báo cáo</label>
                  <input type="date" value={form.ngay_bao_cao} onChange={e => setForm({ ...form, ngay_bao_cao: e.target.value })} className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Người báo cáo</label>
                  <input value={form.nguoi_bao_cao} readOnly className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold opacity-70" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">Phòng mổ số</label>
                  <input 
                    placeholder="VD: 01, 02..." 
                    value={form.phong_mo_so} 
                    onChange={e => setForm({ ...form, phong_mo_so: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-indigo-500/20" 
                    required 
                    list="ds-phong-mo"
                  />
                  <datalist id="ds-phong-mo">
                    {Array.from(new Set(records.map(r => r.phong_mo_so))).sort().map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5 relative group/select">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5">Chuyên khoa (Chọn nhiều)</label>
                  <div className="relative">
                    <div 
                      tabIndex={0}
                      className="w-full px-4 py-3 bg-slate-100 rounded-2xl text-[10px] font-black min-h-[42px] flex flex-wrap gap-1 items-center cursor-pointer hover:bg-slate-200 transition-colors border border-transparent focus:ring-2 focus:ring-[#009900]/20"
                    >
                      {form.chuyen_khoa ? form.chuyen_khoa.split(',').map(s => s.trim()).map(s => (
                        <span key={s} className="bg-[#009900] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 animate-in zoom-in-95">
                          {s}
                          <X size={10} className="cursor-pointer hover:text-green-200" onClick={(e) => {
                            e.stopPropagation();
                            const current = form.chuyen_khoa.split(',').map(x => x.trim()).filter(x => x !== s);
                            setForm({ ...form, chuyen_khoa: current.join(', ') });
                          }} />
                        </span>
                      )) : <span className="text-slate-400 italic font-normal">Chọn khoa...</span>}
                      <ChevronDown size={14} className="ml-auto text-slate-400 group-focus-within/select:rotate-180 transition-transform" />
                    </div>
                    
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 invisible group-focus-within/select:visible opacity-0 group-focus-within/select:opacity-100 transition-all scale-95 group-focus-within/select:scale-100 max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 gap-1">
                        {units.map(u => {
                          const isSelected = form.chuyen_khoa.split(',').map(s => s.trim()).includes(u.ten_don_vi);
                          return (
                            <label key={u.id} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-green-50 text-[#009900]' : 'hover:bg-slate-50 text-slate-600'}`}>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = form.chuyen_khoa ? form.chuyen_khoa.split(',').map(s => s.trim()).filter(s => s) : [];
                                  if (e.target.checked) {
                                    if (!current.includes(u.ten_don_vi)) current.push(u.ten_don_vi);
                                  } else {
                                    const idx = current.indexOf(u.ten_don_vi);
                                    if (idx > -1) current.splice(idx, 1);
                                  }
                                  setForm({ ...form, chuyen_khoa: current.join(', ') });
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-[#009900] focus:ring-[#009900]"
                              />
                              <span className="text-[10px] font-black uppercase tracking-wider">{u.ten_don_vi}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                    <Layout size={14} /> Chi tiết phân tích thời gian
                  </h4>
                  <button type="button" onClick={addRow} className="text-indigo-600 hover:text-indigo-700 font-black text-[10px] uppercase flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                    <PlusCircle size={14} /> Thêm mốc theo dõi
                  </button>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden shadow-inner flex flex-col">
                  {/* Header - Hidden on Mobile */}
                  <div className="hidden md:flex bg-slate-200/50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    <div className="px-4 py-3 w-12 text-center">STT</div>
                    <div className="px-4 py-3 flex-1">Các mốc thời gian theo dõi</div>
                    <div className="px-4 py-3 w-32">Thời gian (Phút)</div>
                    <div className="px-4 py-3 flex-1">Nguyên nhân chậm trễ (nếu có)</div>
                    <div className="px-4 py-3 w-12"></div>
                  </div>
                  
                  <div className="divide-y divide-slate-100">
                    {form.chi_tiet.map((item, idx) => (
                      <div key={idx} className="hover:bg-white/40 transition-colors group flex flex-col md:flex-row md:items-center p-4 md:p-0">
                        {/* STT - Hidden on Mobile */}
                        <div className="hidden md:block px-4 py-2 text-[10px] font-black text-slate-400 text-center w-12">{item.stt}</div>
                        
                        {/* Milestone & Time Row */}
                        <div className="flex flex-1 gap-4 md:gap-0">
                          <div className="flex-1 md:px-4 md:py-2">
                            <label className="md:hidden text-[8px] font-black uppercase text-slate-400 block mb-1">Mốc theo dõi</label>
                            <input 
                              placeholder="Nhập mốc theo dõi..." 
                              value={item.milestone} 
                              onChange={e => updateDetail(idx, 'milestone', e.target.value)} 
                              className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 placeholder:italic placeholder:font-normal"
                              required 
                            />
                          </div>
                          <div className="w-24 md:w-32 md:px-4 md:py-2 border-l border-slate-100 md:border-none md:pl-0">
                            <label className="md:hidden text-[8px] font-black uppercase text-slate-400 block mb-1">Thời gian</label>
                            <input 
                              type="number" 
                              value={item.time_min || ''} 
                              onChange={e => updateDetail(idx, 'time_min', Number(e.target.value))} 
                              className="w-full bg-transparent border-none p-0 text-xs font-black text-[#009900] focus:ring-0"
                            />
                          </div>
                        </div>

                        {/* Reason Row - Full width on Mobile */}
                        <div className="flex-1 mt-3 md:mt-0 md:px-4 md:py-2 border-t md:border-none border-slate-100 pt-3 md:pt-2">
                          <label className="md:hidden text-[8px] font-black uppercase text-slate-400 block mb-1">Nguyên nhân chậm trễ</label>
                          <input 
                            placeholder="Lý do chậm trễ..." 
                            value={item.reason} 
                            onChange={e => updateDetail(idx, 'reason', e.target.value)} 
                            className="w-full bg-transparent border-none p-0 text-xs font-bold text-slate-500 focus:ring-0 placeholder:italic placeholder:font-normal"
                          />
                        </div>

                        {/* Actions */}
                        <div className="md:px-4 md:py-2 text-right absolute md:relative top-4 right-4 md:top-auto md:right-auto">
                          {idx >= 4 && (
                            <button type="button" onClick={() => removeRow(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><MinusCircle size={16} /></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between bg-[#009900]/10 -mx-8 -mb-8 p-8 mt-auto rounded-b-[40px]">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#009900]/60 tracking-widest">Tổng thời gian chết</p>
                  <p className="text-3xl font-black text-[#009900] font-mono">
                    {form.chi_tiet.reduce((sum, item) => sum + (Number(item.time_min) || 0), 0)} <span className="text-sm">phút</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-white/80 rounded-2xl transition-all">Hủy</button>
                  <button type="submit" className="px-10 py-4 bg-[#009900] text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-lg shadow-[#009900]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                    <CheckCircle2 size={18} /> {editingRecord ? 'Cập nhật' : 'Lưu phân tích'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#009900]/10 rounded-xl flex items-center justify-center text-[#009900]">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800 tracking-tight">Chi tiết mốc thời gian</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Phòng {selectedRecord.phong_mo_so} - {selectedRecord.ngay_bao_cao.split('-').reverse().join('/')}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-3 text-slate-400 hover:bg-slate-50 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar bg-slate-50/30">
              <div className="grid grid-cols-1 gap-3">
                {selectedRecord.chi_tiet.filter(d => d.time_min > 0).map(d => (
                  <div key={d.stt} className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#009900]/10 rounded-xl flex items-center justify-center text-[#009900] shrink-0">
                          {d.stt === 1 && <Clock size={16} />}
                          {d.stt === 2 && <Activity size={16} />}
                          {d.stt === 3 && <Layout size={16} />}
                          {d.stt === 4 && <Target size={16} />}
                          {d.stt > 4 && <AlertCircle size={16} />}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black uppercase text-[#009900]/60 tracking-widest">Mốc theo dõi</p>
                          <p className="text-xs font-black text-slate-800 leading-tight">{d.milestone}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Thời gian</p>
                        <p className="text-sm font-black text-[#009900] font-mono">{d.time_min} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-normal">phút</span></p>
                      </div>
                    </div>
                    {d.reason && (
                      <div className="p-3 bg-red-50 rounded-2xl border border-red-100/50">
                        <p className="text-[8px] font-black uppercase text-red-400 mb-1 flex items-center gap-1"><AlertCircle size={10} /> Nguyên nhân chậm trễ</p>
                        <p className="text-[10px] font-bold text-red-700 leading-relaxed italic">{d.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="p-5 bg-[#009900] rounded-[32px] text-white flex justify-between items-center shadow-lg shadow-[#009900]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Tổng thời gian chết</p>
                    <p className="text-2xl font-black font-mono leading-none">{selectedRecord.total_downtime} <span className="text-sm font-bold opacity-60">PHÚT</span></p>
                  </div>
                </div>
              </div>
              
              <div className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-[0.2em] pt-2">
                Chuyên khoa: {selectedRecord.chuyen_khoa || 'N/A'}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] shadow-lg active:scale-95 transition-all"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
