import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Calendar, 
  Tag, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Target,
  Clock,
  Layout,
  ChevronRight,
  Save,
  RotateCcw,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Trash
} from 'lucide-react';
import { IndicatorConfig } from '../types';
import { 
  fetchIndicatorConfigs, 
  addIndicatorConfig, 
  updateIndicatorConfig, 
  deleteIndicatorConfig 
} from '../readCauHinhCscl';

const IndicatorConfigModule: React.FC = () => {
  const [configs, setConfigs] = useState<IndicatorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<IndicatorConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<IndicatorConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState<'edit' | 'copy' | null>(null);
  const [bulkDates, setBulkDates] = useState({ tu_ngay: '', den_ngay: '' });

  const [form, setForm] = useState({
    ten_chi_so: '',
    muc_tieu: '',
    don_vi_tinh: '',
    tu_ngay: '',
    den_ngay: '',
    linh_vuc_ap_dung: '',
    thong_tin: '',
    danh_gia: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchIndicatorConfigs();
      setConfigs(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu cấu hình.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredConfigs = configs.filter(c => 
    c.ten_chi_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.linh_vuc_ap_dung || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredConfigs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredConfigs.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setForm({
      ten_chi_so: '',
      muc_tieu: '',
      don_vi_tinh: '',
      tu_ngay: '',
      den_ngay: '',
      linh_vuc_ap_dung: '',
      thong_tin: '',
      danh_gia: ''
    });
    setShowModal(true);
  };

  const handleEdit = (c: IndicatorConfig) => {
    setEditingConfig(c);
    setForm({
      ten_chi_so: c.ten_chi_so,
      muc_tieu: c.muc_tieu?.toString() || '',
      don_vi_tinh: c.don_vi_tinh || '',
      tu_ngay: c.tu_ngay || '',
      den_ngay: c.den_ngay || '',
      linh_vuc_ap_dung: c.linh_vuc_ap_dung || '',
      thong_tin: c.thong_tin || '',
      danh_gia: c.danh_gia || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa cấu hình này?')) return;
    try {
      await deleteIndicatorConfig(id);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        muc_tieu: form.muc_tieu ? parseFloat(form.muc_tieu) : null
      };

      if (editingConfig) {
        await updateIndicatorConfig(editingConfig.id, payload);
      } else {
        await addIndicatorConfig(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkDates.tu_ngay || !bulkDates.den_ngay) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc');
      return;
    }

    setLoading(true);
    try {
      if (showBulkModal === 'edit') {
        for (const id of selectedIds) {
          await updateIndicatorConfig(id, { 
            tu_ngay: bulkDates.tu_ngay, 
            den_ngay: bulkDates.den_ngay 
          });
        }
      } else if (showBulkModal === 'copy') {
        const itemsToCopy = configs.filter(c => selectedIds.includes(c.id));
        for (const item of itemsToCopy) {
          const { id, created_at, ...rest } = item;
          await addIndicatorConfig({
            ...rest,
            tu_ngay: bulkDates.tu_ngay,
            den_ngay: bulkDates.den_ngay
          });
        }
      }
      setSelectedIds([]);
      setShowBulkModal(null);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi thao tác hàng loạt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm shrink-0 border border-indigo-200">
            <Settings size={28} />
          </div>
          <div>
            <h2 className="text-[15px] font-black text-slate-800 tracking-tight uppercase">Cấu hình chỉ số chất lượng</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Quản lý mục tiêu & phạm vi theo dõi</p>
          </div>
        </div>

        <button 
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-8 py-3.5 rounded-[24px] flex items-center gap-2 text-[11px] font-black uppercase hover:shadow-lg hover:shadow-indigo-900/20 active:scale-95 transition-all shadow-md group w-full md:w-auto justify-center"
        >
          <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-300">
            <Plus size={18} />
          </div>
          Thêm cấu hình mới
        </button>
      </div>

      <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Tìm theo tên chỉ số, lĩnh vực..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" 
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in duration-300">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-3xl border border-slate-50 hidden md:block">
          <table className="w-full text-left table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#009900] text-white text-[10px] uppercase tracking-widest border-b border-green-700">
                <th className="px-6 py-4 w-[5%]">
                  <button onClick={toggleSelectAll} className="text-white hover:scale-110 transition-transform">
                    {selectedIds.length === filteredConfigs.length && filteredConfigs.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4 font-black text-white w-[26%]">Tên chỉ số</th>
                <th className="px-6 py-4 font-black text-white w-[10%]">Mục tiêu</th>
                <th className="px-6 py-4 font-black text-white w-[10%]">Đơn vị</th>
                <th className="px-6 py-4 font-black text-white w-[12%]">Đánh giá</th>
                <th className="px-6 py-4 font-black text-white w-[15%]">Thời gian áp dụng</th>
                <th className="px-6 py-4 font-black text-white w-[18%] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredConfigs.map(c => (
                <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(c.id) ? 'bg-indigo-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(c.id)} className={`${selectedIds.includes(c.id) ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {selectedIds.includes(c.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800">{c.ten_chi_so}</span>
                      <span className="text-[10px] text-slate-400 font-bold line-clamp-1 mt-0.5">{c.thong_tin || 'Không có mô tả'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Target size={14} />
                      </div>
                      <span className="text-xs font-black text-indigo-700">{c.muc_tieu ?? '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{c.don_vi_tinh || '---'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg line-clamp-1 border border-slate-200" title={c.danh_gia || ''}>
                      {c.danh_gia || '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold">
                        <Clock size={12} className="text-slate-400" />
                        {c.tu_ngay ? c.tu_ngay.split('-').reverse().join('/') : '---'}
                      </div>
                      <ChevronRight size={10} className="text-slate-300 ml-3.5 my-0.5" />
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs font-bold pl-3.5">
                        {c.den_ngay ? c.den_ngay.split('-').reverse().join('/') : '---'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewingConfig(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"><Eye size={14} /> Xem</button>
                      <button onClick={() => handleEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={14} /> Sửa</button>
                      <button onClick={() => handleDelete(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={14} /> Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredConfigs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-30">
                    <Layout size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Chưa có cấu hình nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden grid grid-cols-1 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar relative">
          {filteredConfigs.map(c => (
            <div 
              key={c.id} 
              onClick={() => toggleSelect(c.id)}
              className={`bg-slate-50 rounded-3xl p-5 border flex flex-col gap-4 active:scale-95 transition-all relative ${selectedIds.includes(c.id) ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100'}`}
            >
              {selectedIds.includes(c.id) && (
                <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                  <CheckCircle2 size={16} />
                </div>
              )}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-800">{c.ten_chi_so}</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewingConfig(c)} className="p-2 bg-white text-green-600 rounded-xl shadow-sm"><Eye size={16} /></button>
                  <button onClick={() => handleEdit(c)} className="p-2 bg-white text-blue-600 rounded-xl shadow-sm"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 bg-white text-red-500 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mục tiêu</p>
                  <p className="text-xs font-black text-indigo-600 flex items-center gap-1.5"><Target size={12} /> {c.muc_tieu ?? '---'} <span className="text-slate-400 font-normal">{c.don_vi_tinh || ''}</span></p>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                  <p className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5 line-clamp-1"><Clock size={12} /> {c.tu_ngay?.split('-').reverse()[0]}/{c.tu_ngay?.split('-').reverse()[1]} → {c.den_ngay?.split('-').reverse()[0]}/{c.den_ngay?.split('-').reverse()[1]}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredConfigs.length === 0 && !loading && (
            <div className="py-12 text-center opacity-30">
              <Layout size={40} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Hệ thống đang chờ <br/> dữ liệu cấu hình</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800">{editingConfig ? 'Cập nhật cấu hình' : 'Thêm cấu hình mới'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng điền các mục bắt buộc</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Tag size={12} /> Tên chỉ số</label>
                <input 
                  value={form.ten_chi_so} 
                  onChange={e => setForm({ ...form, ten_chi_so: e.target.value })} 
                  className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="Ví dụ: Tỷ lệ tuân thủ vệ sinh tay"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Target size={12} /> Mục tiêu</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={form.muc_tieu} 
                    onChange={e => setForm({ ...form, muc_tieu: e.target.value })} 
                    className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                    placeholder="90"
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Layout size={12} /> Đơn vị tính</label>
                  <input 
                    value={form.don_vi_tinh} 
                    onChange={e => setForm({ ...form, don_vi_tinh: e.target.value })} 
                    className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                    placeholder="%, ca, lần, ngày, điểm..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Layout size={12} /> Lĩnh vực</label>
                <input 
                  value={form.linh_vuc_ap_dung} 
                  onChange={e => setForm({ ...form, linh_vuc_ap_dung: e.target.value })} 
                  className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="Chuyên môn, Quản lý..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Calendar size={12} /> Từ ngày</label>
                  <input 
                    type="date" 
                    value={form.tu_ngay} 
                    onChange={e => setForm({ ...form, tu_ngay: e.target.value })} 
                    className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs font-bold shadow-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Calendar size={12} /> Đến ngày</label>
                  <input 
                    type="date" 
                    value={form.den_ngay} 
                    onChange={e => setForm({ ...form, den_ngay: e.target.value })} 
                    className="w-full px-4 py-3 bg-white border-none rounded-xl text-xs font-bold shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><Info size={12} /> Thông tin chi tiết</label>
                <textarea 
                  value={form.thong_tin} 
                  onChange={e => setForm({ ...form, thong_tin: e.target.value })} 
                  className="w-full px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]" 
                  placeholder="Ghi chú thêm về chỉ số..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2"><CheckCircle2 size={12} /> Đánh giá</label>
                <textarea 
                  value={form.danh_gia} 
                  onChange={e => setForm({ ...form, danh_gia: e.target.value })} 
                  className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 min-h-[60px]" 
                  placeholder="Tiêu chí đánh giá hoặc kết quả đánh giá mốc..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-[22px] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} /> Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-[22px] text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={18} /> {editingConfig ? 'Cập nhật' : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* THANH THAO TÁC HÀNG LOẠT */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[55] bg-slate-900 border border-slate-700 rounded-[32px] px-8 py-5 shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Đã chọn</span>
            <span className="text-xl font-black text-white">{selectedIds.length} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">chỉ số</span></span>
          </div>
          
          <div className="w-px h-10 bg-slate-700"></div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setShowBulkModal('edit');
                setBulkDates({ tu_ngay: '', den_ngay: '' });
              }}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
            >
              <Calendar size={16} /> Sửa ngày hàng loạt
            </button>
            <button 
              onClick={() => {
                setShowBulkModal('copy');
                setBulkDates({ tu_ngay: '', den_ngay: '' });
              }}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
            >
              <Copy size={16} /> Sao chép hàng loạt
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white/10 text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-white/20 transition-all active:scale-95"
            >
              <RotateCcw size={16} /> Hủy chọn
            </button>
          </div>
        </div>
      )}

      {/* POPUP THAO TÁC HÀNG LOẠT */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-8 flex items-center justify-between ${showBulkModal === 'edit' ? 'bg-indigo-600' : 'bg-emerald-600'} text-white`}>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{showBulkModal === 'edit' ? 'Sửa thời gian hàng loạt' : 'Sao chép & Chọn thời gian'}</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-80 mt-1">Áp dụng cho {selectedIds.length} chỉ số được chọn</p>
              </div>
              <button onClick={() => setShowBulkModal(null)} className="p-2 hover:bg-white/20 rounded-xl transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2 tracking-widest"><Calendar size={12} className="text-indigo-500" /> Bắt đầu từ</label>
                  <input 
                    type="date"
                    value={bulkDates.tu_ngay}
                    onChange={e => setBulkDates(prev => ({ ...prev, tu_ngay: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2 tracking-widest"><Calendar size={12} className="text-indigo-500" /> Đến hết ngày</label>
                  <input 
                    type="date"
                    value={bulkDates.den_ngay}
                    onChange={e => setBulkDates(prev => ({ ...prev, den_ngay: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowBulkModal(null)}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Hủy thao tác
                </button>
                <button 
                  onClick={handleBulkAction}
                  disabled={loading}
                  className={`flex-1 py-5 ${showBulkModal === 'edit' ? 'bg-indigo-600' : 'bg-emerald-600'} text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3`}
                >
                  {loading ? <RotateCcw className="animate-spin" size={20} /> : <Save size={20} />}
                  {showBulkModal === 'edit' ? 'Cập nhật ngay' : 'Sao chép & Lưu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT (DOCUMENT STYLE) */}
      {viewingConfig && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[20px] w-full max-w-4xl max-h-[95vh] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-black uppercase text-sm text-slate-800 tracking-tight">Chi tiết cấu hình chỉ số</h3>
              <button 
                onClick={() => setViewingConfig(null)}
                className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <div className="space-y-8 text-slate-800 leading-relaxed max-w-2xl mx-auto">
                    <div className="border-b-2 border-slate-100 pb-4 mb-2">
                        <h1 className="text-xl font-black text-slate-900">{viewingConfig.ten_chi_so}</h1>
                    </div>

                    <div className="space-y-6 font-medium">
                        <div className="flex items-start gap-4">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                            <p><strong className="text-slate-900">Tên chỉ số:</strong> {viewingConfig.ten_chi_so}</p>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                            <p><strong className="text-slate-900">Mục tiêu:</strong> {viewingConfig.muc_tieu ?? '---'} <span className="text-slate-500">{viewingConfig.don_vi_tinh || ''}</span></p>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">3</span>
                            <p><strong className="text-slate-900">Lĩnh vực áp dụng:</strong> {viewingConfig.linh_vuc_ap_dung || '---'}</p>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">4</span>
                            <p><strong className="text-slate-900">Thời gian áp dụng:</strong> Từ ngày {viewingConfig.tu_ngay ? viewingConfig.tu_ngay.split('-').reverse().join('/') : '---'} - Đến ngày {viewingConfig.den_ngay ? viewingConfig.den_ngay.split('-').reverse().join('/') : '---'}</p>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">5</span>
                            <div className="space-y-2">
                                <strong className="text-slate-900">Đánh giá:</strong>
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{viewingConfig.danh_gia || 'Chưa có thông tin đánh giá'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black shrink-0">6</span>
                            <div className="space-y-2">
                                <strong className="text-slate-900">Thông tin chi tiết:</strong>
                                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{viewingConfig.thong_tin || 'Chưa có thông tin bổ sung'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorConfigModule;
