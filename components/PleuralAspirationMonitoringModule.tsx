import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Stethoscope
} from 'lucide-react';
import {
  fetchQtCdmp, addQtCdmp, updateQtCdmp, deleteQtCdmp
} from '../readQtCdmp';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';
import { PleuralAspirationMonitoring } from '../types';

export const CRITERIA_CDMP = [
  { id: 'c1', group: 'A. GIAI ĐOẠN CHUẨN BỊ', label: '1. Chuẩn bị người bệnh (Kiểm tra hành chính, khám, tư thế, giải thích)' },
  { id: 'c2', group: 'A. GIAI ĐOẠN CHUẨN BỊ', label: '2. Chuẩn bị nhân viên y tế (1 BS, 1 ĐD, PPE, rửa tay, găng tay vô khuẩn/thường)' },
  { id: 'c3', group: 'A. GIAI ĐOẠN CHUẨN BỊ', label: '3. Chuẩn bị dụng cụ, phương tiện (Bơm tiêm, găng, lọ, ống XN, thuốc cấp cứu...)' },
  { id: 'c4', group: 'A. GIAI ĐOẠN CHUẨN BỊ', label: '4. Hồ sơ bệnh án (Kiểm tra chỉ định, xét nghiệm, cam kết)' },
  { id: 'c5', group: 'B. CÁC BƯỚC TIẾN HÀNH', label: '5. Đặt tư thế người bệnh, xác định vị trí (Gõ, nghe, siêu âm)' },
  { id: 'c6', group: 'B. CÁC BƯỚC TIẾN HÀNH', label: '6. Vô trùng – gây tê (Sát khuẩn 3 lần, trải săng vô khuẩn, gây tê từng lớp)' },
  { id: 'c7', group: 'B. CÁC BƯỚC TIẾN HÀNH', label: '7. Chọc dò dịch màng phổi – lấy dịch xét nghiệm (Đúng vị trí bờ trên xương sườn dưới, vuông góc)' },
  { id: 'c8', group: 'B. CÁC BƯỚC TIẾN HÀNH', label: '8. Kết thúc kĩ thuật (Rút kim, băng ép, bàn giao NB & bệnh phẩm)' },
  { id: 'c9', group: 'C. KẾT THÚC & THEO DÕI', label: '9. Ghi chép hồ sơ (Đầy đủ diễn biến, kết quả)' },
  { id: 'c10', group: 'C. KẾT THÚC & THEO DÕI', label: '10. Theo dõi người bệnh (Đánh giá sau thủ thuật, dặn dò)' },
  { id: 'c11', group: 'C. KẾT THÚC & THEO DÕI', label: '11. Thu dọn vệ sinh & Rác thải (Phân loại đúng Thông tư 20)' }
];

const checklistIds = CRITERIA_CDMP.map(c => c.id);
const TOTAL_CRITERIA = checklistIds.length; // 11

const defaultForm = (userName = ''): Partial<PleuralAspirationMonitoring> => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: userName,
    khoa_duoc_giam_sat: '',
    nguoi_duoc_giam_sat: '',
    checklist_data: {},
    tong_dat: TOTAL_CRITERIA,
    tong_co_hoi: TOTAL_CRITERIA,
    ty_le_tuan_thu: 100,
    danh_gia_chung: '',
    ghi_chu: ''
  };
  checklistIds.forEach(id => {
    base.checklist_data[id] = true;
  });
  return base;
};

const calcStats = (checklist: any) => {
  let dat = 0;
  let coHoi = 0;
  checklistIds.forEach(id => {
    if (checklist[id] !== null) {
      coHoi++;
      if (checklist[id] === true) dat++;
    }
  });
  const ty_le = coHoi === 0 ? 0 : Math.round((dat / coHoi) * 100 * 100) / 100;
  return { tong_dat: dat, tong_co_hoi: coHoi, ty_le_tuan_thu: ty_le };
};

const CdmpToggle = ({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void }) => (
  <div className="flex gap-1 shrink-0">
    <button type="button" onClick={() => onChange(true)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${value === true ? 'bg-[#059669] text-white border-[#059669]' : 'bg-white text-slate-400 border-slate-200'}`}>Đạt</button>
    <button type="button" onClick={() => onChange(false)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${value === false ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'}`}>K.Đạt</button>
    <button type="button" onClick={() => onChange(null)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${value === null ? 'bg-slate-500 text-white border-slate-500' : 'bg-white text-slate-400 border-slate-200'}`}>K.A.D</button>
  </div>
);

export const PleuralAspirationMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [dataList, setDataList] = useState<PleuralAspirationMonitoring[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({ type: 'thisMonth', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, dv] = await Promise.all([fetchQtCdmp(), fetchDmDonVi()]);
      setDataList(data || []);
      setDeptList(dv || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    return dataList.filter(item => {
      const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const matchedDate = isDateInRange(item.ngay_giam_sat, range);
      const matchedDept = deptFilter === 'Tất cả' || item.khoa_duoc_giam_sat === deptFilter;
      const matchedSearch = (item.khoa_duoc_giam_sat || '').toLowerCase().includes(search.toLowerCase()) ||
                            (item.nguoi_giam_sat || '').toLowerCase().includes(search.toLowerCase()) ||
                            (item.nguoi_duoc_giam_sat || '').toLowerCase().includes(search.toLowerCase());
      return matchedDate && matchedDept && matchedSearch;
    });
  }, [dataList, dateFilter, deptFilter, search]);

  const handleSave = async (payload: any) => {
    try {
      if (editingItem?.id) await updateQtCdmp(editingItem.id, payload);
      else await addQtCdmp(payload);
      setViewMode('LIST'); setEditingItem(null); loadData();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      await deleteQtCdmp(id);
      loadData();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-6rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-white p-1.5 gap-1 rounded-[28px] border border-slate-200 shrink-0 shadow-sm">
            <button className="supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border bg-teal-600 text-white border-teal-600 shadow-lg">
              <Stethoscope size={15} /> Chọc dịch màng phổi
            </button>
          </div>
          {viewMode === 'LIST' && (
            <button onClick={() => { setEditingItem(null); setViewMode('FORM'); }} className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-teal-200 transition-all hover:bg-teal-700 active:scale-95">
              <Plus size={18} /> Thêm giám sát mới
            </button>
          )}
        </div>

        {viewMode === 'LIST' && (
          <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
                <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Khoa giám sát</label>
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none ring-teal-500/10 focus:ring-4 transition-all"
                >
                  <option value="Tất cả">Tất cả khoa</option>
                  {deptList.map(dept => (
                    <option key={dept.ten_don_vi} value={`${dept.ma_don_vi} - ${dept.ten_don_vi}`}>{dept.ma_don_vi} - {dept.ten_don_vi}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setDateFilter({ type: 'thisMonth', startDate: '', endDate: '' }); setDeptFilter('Tất cả'); setSearch(''); }}
                  className="w-full p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg border border-dashed border-slate-300 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <RotateCcw size={14} className="inline mr-2" /> Xóa lọc
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {viewMode === 'LIST' ? (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-end gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input placeholder="Tìm khoa, người GS..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-teal-500/10" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table-standardized w-full">
                    <thead className="bg-teal-600 text-white">
                      <tr><th>Ngày</th><th>Khoa</th><th>Người được GS</th><th>Người GS</th><th className="text-center">Tỷ lệ</th><th className="text-right">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.map((d: any) => {
                        const rate = d.ty_le_tuan_thu || 0;
                        const color = rate === 100 ? 'text-[#059669]' : rate >= 80 ? 'text-amber-600' : 'text-red-500';
                        return (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td data-label="Ngày" className="p-4 text-table font-normal text-slate-600">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                            <td data-label="Khoa" className="p-4 text-table font-normal text-slate-800 uppercase">{d.khoa_duoc_giam_sat}</td>
                            <td data-label="Người được GS" className="p-4 text-table text-slate-600 font-normal">{d.nguoi_duoc_giam_sat}</td>
                            <td data-label="Người GS" className="p-4 text-sm text-slate-400 font-normal">{d.nguoi_giam_sat}</td>
                            <td data-label="Tỷ lệ" className={`p-4 text-center font-bold text-lg ${color}`}>{rate}%</td>
                            <td data-label="Thao tác" className="p-4 flex justify-end gap-2">
                              <button onClick={() => { setEditingItem(d); setViewMode('DETAIL'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Eye size={16} /></button>
                              <button onClick={() => { setEditingItem(d); setViewMode('FORM'); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : viewMode === 'FORM' ? (
              <CdmpForm item={editingItem} currentUser={user} departmentList={deptList} onSaved={handleSave} onClose={() => setViewMode('LIST')} />
            ) : (
              <CdmpDetail item={editingItem} currentUser={user} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CdmpForm = ({ item, currentUser, departmentList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item } : defaultForm(currentUser?.full_name || ''));

  const setField = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  const setChecklist = (id: string, val: boolean | null) => {
    setForm((p: any) => {
      const newChecklist = { ...p.checklist_data, [id]: val };
      const stats = calcStats(newChecklist);
      return { ...p, checklist_data: newChecklist, ...stats };
    });
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
      <div className={`p-7 border-b border-slate-50 flex justify-between items-center bg-teal-600/5`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-teal-600`}>
            <Stethoscope size={22} />
          </div>
          <div>
            <h2 className="text-main-title font-bold text-slate-800 uppercase leading-tight">{item?.id ? 'Sửa' : 'Thêm'} phiếu chọc dịch màng phổi</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bảng kiểm tuân thủ</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSaved(form); }} className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 bg-slate-50 p-5 rounded-[28px] border border-slate-100 shadow-inner">
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ngày giám sát</label><input type="date" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-teal-500/10 outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Người giám sát</label><input value={form.nguoi_giam_sat} onChange={e => setField('nguoi_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Khoa</label><input list="cdmp-dv-list" value={form.khoa_duoc_giam_sat || ''} onChange={e => setField('khoa_duoc_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /><datalist id="cdmp-dv-list">{departmentList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">NVYT / Kíp thủ thuật</label><input placeholder="Nhập tên NVYT/Kíp" value={form.nguoi_duoc_giam_sat || ''} onChange={e => setField('nguoi_duoc_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
           <div className="p-4 text-white text-[10px] font-black uppercase tracking-widest bg-teal-600">Nội dung giám sát</div>
           <div className="divide-y divide-slate-50">
             {CRITERIA_CDMP.map((c: any, i: number) => {
               const val = form.checklist_data[c.id];
               const showGroupHeader = i === 0 || c.group !== CRITERIA_CDMP[i - 1].group;
               return (
                 <React.Fragment key={c.id}>
                   {showGroupHeader && (
                     <div className="bg-slate-100 p-3 px-5 text-xs font-black uppercase text-teal-800">{c.group}</div>
                   )}
                   <div className={`p-4 px-5 flex flex-col gap-3 ${val === false ? 'bg-red-50/30' : val === null ? 'opacity-60 bg-slate-50 grayscale' : ''}`}>
                      <div className="flex items-start gap-4">
                         <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm font-bold text-slate-700 leading-snug">{c.label}</p>
                         </div>
                         <CdmpToggle value={val} onChange={v => setChecklist(c.id, v)} />
                      </div>
                   </div>
                 </React.Fragment>
               );
             })}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Nhận xét chung</label><textarea value={form.danh_gia_chung || ''} onChange={e => setField('danh_gia_chung', e.target.value)} rows={3} className="w-full p-3 rounded-2xl border border-slate-200 text-sm outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ghi chú thêm</label><textarea value={form.ghi_chu || ''} onChange={e => setField('ghi_chu', e.target.value)} rows={3} className="w-full p-3 rounded-2xl border border-slate-200 text-sm outline-none" /></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-6">
             <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tuân thủ</p><p className={`text-3xl font-black ${form.ty_le_tuan_thu === 100 ? 'text-[#059669]' : 'text-red-500'}`}>{form.ty_le_tuan_thu}%</p></div>
             <div className="h-10 w-px bg-slate-100"/>
             <div className="text-sm font-bold text-slate-600">Đạt {form.tong_dat}/{form.tong_co_hoi} tiêu chí <br/><span className="text-[10px] font-normal text-slate-400">(Không áp dụng: {TOTAL_CRITERIA - form.tong_co_hoi})</span></div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Đóng</button>
             <button type="submit" className={`flex-1 md:flex-none px-12 py-3.5 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl transition-all bg-teal-600 hover:bg-teal-700 shadow-teal-100`}>Lưu phiếu</button>
          </div>
        </div>
      </form>
    </div>
  );
};

const CdmpDetail = ({ item, currentUser, onClose, onEdit }: any) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Quản trị viên';
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-2 bg-teal-600`}/>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center no-print">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><RotateCcw size={14}/> Quay lại</button>
          <div className="flex gap-3">
             <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"><FileText size={18}/></button>
             {isAdmin && <button onClick={onEdit} className={`px-6 py-3 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg bg-teal-600 shadow-teal-100`}>Sửa dữ liệu</button>}
          </div>
        </div>

        <div className="text-center space-y-3">
           <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto shadow-xl mb-4 bg-teal-600 text-white"><Stethoscope size={32}/></div>
           <h1 className="text-main-title font-bold text-slate-900 uppercase leading-tight tracking-tight">BẢNG KIỂM GIÁM SÁT TUÂN THỦ QUY TRÌNH KỸ THUẬT CHỌC DỊCH MÀNG PHỔI</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-dashed border-slate-200">
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khoa/Phòng</p><p className="text-sm font-black text-slate-800 uppercase">{item.khoa_duoc_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kíp/NVYT</p><p className="text-sm font-black text-slate-800 uppercase">{item.nguoi_duoc_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Người giám sát</p><p className="text-sm font-black text-slate-800 uppercase">{item.nguoi_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày giám sát</p><p className="text-sm font-black text-slate-800">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-4 border-slate-900 text-[12pt]">
            <thead className="bg-teal-600 text-white font-bold uppercase text-table">
               <tr><th className="p-4 border-2 border-slate-900 text-left w-16">STT</th><th className="p-4 border-2 border-slate-900 text-left">Nội dung / Tiêu chí đánh giá</th><th className="p-4 border-2 border-slate-900 w-32">Kết quả</th></tr>
            </thead>
            <tbody className="font-normal text-slate-700">
               {CRITERIA_CDMP.map((c: any, i: number) => {
                 const val = item.checklist_data[c.id];
                 const showGroupHeader = i === 0 || c.group !== CRITERIA_CDMP[i - 1].group;
                 return (
                   <React.Fragment key={c.id}>
                     {showGroupHeader && (
                       <tr className="bg-slate-100 font-bold"><td colSpan={3} className="p-4 border-2 border-slate-900">{c.group}</td></tr>
                     )}
                     <tr className={val === false ? 'bg-red-50' : val === null ? 'bg-slate-50 opacity-60 grayscale' : ''}>
                       <td className="p-4 border-2 border-slate-900 text-center font-bold">{c.label.split('.')[0]}</td>
                       <td className="p-4 border-2 border-slate-900 leading-snug">{c.label.substring(c.label.indexOf('.') + 2)}</td>
                       <td className="p-4 border-2 border-slate-900 text-center font-bold">
                          {val === true ? <span className="text-[#059669]">ĐẠT</span> : val === false ? <span className="text-red-600">KHÔNG ĐẠT</span> : <span className="text-slate-500">K.A.D</span>}
                       </td>
                     </tr>
                   </React.Fragment>
                 );
               })}
               <tr className="bg-slate-50 font-black">
                 <td colSpan={2} className="p-4 border-2 border-slate-900 uppercase text-right">Tổng hợp tỷ lệ tuân thủ</td>
                 <td className="p-4 border-2 border-slate-900 text-center text-xl">{item.ty_le_tuan_thu}%</td>
               </tr>
               <tr className="bg-slate-50 font-bold">
                 <td colSpan={3} className="p-4 border-2 border-slate-900 text-right text-slate-500 text-sm">Đạt {item.tong_dat}/{item.tong_co_hoi} tiêu chí áp dụng</td>
               </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
            {item.danh_gia_chung && (<div><p className="font-bold text-sm text-slate-800">Nhận xét chung:</p><p className="text-sm whitespace-pre-wrap text-slate-700">{item.danh_gia_chung}</p></div>)}
            {item.ghi_chu && (<div className="mt-4"><p className="font-bold text-sm text-slate-800">Ghi chú thêm:</p><p className="text-sm whitespace-pre-wrap text-slate-700">{item.ghi_chu}</p></div>)}
        </div>

        <div className="flex justify-between pt-10 h-48 items-end">
           <div className="text-center flex-1 space-y-20"><p className="text-[10px] font-black text-slate-800 uppercase underline">Đại diện đơn vị được GS</p></div>
           <div className="text-center flex-1 space-y-20">
              <p className="text-[10px] font-black text-slate-800 uppercase underline">Người giám sát</p>
              <p className="text-xs font-black uppercase text-slate-900">{item.nguoi_giam_sat}</p>
           </div>
        </div>
      </div>
    </div>
  );
};
