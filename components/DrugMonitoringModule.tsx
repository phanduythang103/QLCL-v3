import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Pill, AlertTriangle
} from 'lucide-react';
import {
  fetchGsDrug, addGsDrug, updateGsDrug,
  deleteGsDrug
} from '../readGsDrug';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';
import { DrugMonitoring } from '../types';

export const CRITERIA_DRUG = [
  { id: 'c1', label: '1. Nhận diện chính xác người bệnh: Sử dụng ít nhất 2 định danh (Họ tên, Ngày sinh/Mã BN) để đối chiếu trước khi dùng thuốc.' },
  { id: 'c2', label: '2. Công khai thuốc tại giường: Khai thác tiền sử dị ứng, thực hiện thông báo tên thuốc, liều dùng, tác dụng và hướng dẫn cho người bệnh/thân nhân ngay tại giường.' },
  { id: 'c3', label: '3. Thực hiện "5 đúng": Quan sát thấy NVYT đối chiếu thuốc với y lệnh/phiếu công khai đảm bảo: Đúng BN - Đúng thuốc - Đúng liều - Đúng đường dùng - Đúng thời gian.' },
  { id: 'c4', label: '4. Kiểm soát quy trình thực hiện: Thực hiện cho BN uống/tiêm thuốc ngay sau khi chuẩn bị, không để thuốc chờ lâu tại xe tiêm hoặc tủ đầu giường.' },
  { id: 'c5', label: '5. Ghi chép/Đánh dấu: NVYT thực hiện ký/đánh dấu vào phiếu công khai thuốc tại giường ngay sau khi thực hiện xong y lệnh.' },
  { id: 'c6', label: '6. Tập trung chuyên môn: Tuyệt đối không sử dụng điện thoại cá nhân hoặc làm việc riêng khi đang thực hiện thuốc cho BN.' },
  { id: 'c7', label: '7. Thái độ ứng xử: Giao tiếp với BN lịch sự, đúng mực, giải thích tận tình các thắc mắc về thuốc.' },
  { id: 'c8', label: '8. Kiểm soát nhiễm khuẩn: Tuân thủ vệ sinh tay trước và sau khi thực hiện thuốc cho BN; sử dụng găng tay đúng chỉ định.' }
];

const checklistIds = CRITERIA_DRUG.map(c => c.id);
const TOTAL_CRITERIA = checklistIds.length; // 8

const defaultForm = (userName = ''): Partial<DrugMonitoring> => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: userName,
    don_vi_duoc_giam_sat: '',
    ho_ten_nb: '',
    ma_nb: '',
    checklist_data: {},
    tong_dat: TOTAL_CRITERIA,
    tong_co_hoi: TOTAL_CRITERIA,
    ty_le_tuan_thu: 100,
    danh_gia_chung: '',
    loi_sai_khac_phuc: '',
    ghi_chu: ''
  };
  checklistIds.forEach(id => {
    base.checklist_data[id] = true;
  });
  return base;
};

const calcStats = (checklist: any) => {
  let dat = 0;
  checklistIds.forEach(id => {
    if (checklist[id] === true) dat++;
  });
  const ty_le = Math.round((dat / TOTAL_CRITERIA) * 100 * 100) / 100;
  return { tong_dat: dat, tong_co_hoi: TOTAL_CRITERIA, ty_le_tuan_thu: ty_le };
};

const DrugToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex gap-1 shrink-0">
    <button type="button" onClick={() => onChange(true)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${value === true ? 'bg-[#059669] text-white border-[#059669]' : 'bg-white text-slate-400 border-slate-200'}`}>Đạt</button>
    <button type="button" onClick={() => onChange(false)} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${value === false ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-400 border-slate-200'}`}>Không</button>
  </div>
);

export const DrugMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [dataList, setDataList] = useState<DrugMonitoring[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({ type: 'thisMonth', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('Tất cả');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, dv] = await Promise.all([fetchGsDrug(), fetchDmDonVi()]);
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
      const matchedDept = deptFilter === 'Tất cả' || item.don_vi_duoc_giam_sat === deptFilter;
      const matchedSearch = (item.don_vi_duoc_giam_sat || '').toLowerCase().includes(search.toLowerCase()) ||
                            (item.nguoi_giam_sat || '').toLowerCase().includes(search.toLowerCase()) ||
                            (item.ho_ten_nb || '').toLowerCase().includes(search.toLowerCase());
      return matchedDate && matchedDept && matchedSearch;
    });
  }, [dataList, dateFilter, deptFilter, search]);

  const handleSave = async (payload: any) => {
    try {
      if (editingItem?.id) await updateGsDrug(editingItem.id, payload);
      else await addGsDrug(payload);
      setViewMode('LIST'); setEditingItem(null); loadData();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      await deleteGsDrug(id);
      loadData();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-6rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-white p-1.5 gap-1 rounded-[28px] border border-slate-200 shrink-0 shadow-sm">
            <button className="supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border bg-emerald-600 text-white border-emerald-600 shadow-lg">
              <Pill size={15} /> Giám sát an toàn sử dụng thuốc
            </button>
          </div>
          {viewMode === 'LIST' && (
            <button onClick={() => { setEditingItem(null); setViewMode('FORM'); }} className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-95">
              <Plus size={18} /> Thêm phiếu giám sát
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
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none ring-emerald-500/10 focus:ring-4 transition-all"
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
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {viewMode === 'LIST' ? (
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-end gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input placeholder="Tìm khoa, NVYT, NB..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="table-standardized">
                    <thead className="bg-emerald-600 text-white">
                      <tr><th>Ngày</th><th>Khoa/Phòng</th><th>Họ tên NB/NVYT</th><th>Người GS</th><th className="text-center">Điểm</th><th className="text-right">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.map((d: any) => {
                        const score = d.tong_dat || 0;
                        const color = score >= 7 ? 'text-[#059669]' : score >= 5 ? 'text-amber-600' : 'text-red-500';
                        return (
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td data-label="Ngày" className="p-4 text-table font-normal text-slate-600">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                            <td data-label="Khoa/Phòng" className="p-4 text-table font-normal text-slate-800 uppercase">{d.don_vi_duoc_giam_sat}</td>
                            <td data-label="Họ tên NB/NVYT" className="p-4 text-table text-slate-600 font-normal">{d.ho_ten_nb}</td>
                            <td data-label="Người GS" className="p-4 text-sm text-slate-400 font-normal">{d.nguoi_giam_sat}</td>
                            <td data-label="Điểm" className={`p-4 text-center font-bold text-lg ${color}`}>{score}/8</td>
                            <td data-label="Thao tác" className="p-4 flex justify-end gap-2">
                              <button onClick={() => { setEditingItem(d); setViewMode('DETAIL'); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Eye size={16} /></button>
                              <button onClick={() => { setEditingItem(d); setViewMode('FORM'); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 size={16} /></button>
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
              <DrugForm item={editingItem} currentUser={user} departmentList={deptList} onSaved={handleSave} onClose={() => setViewMode('LIST')} />
            ) : (
              <DrugDetail item={editingItem} currentUser={user} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DrugForm = ({ item, currentUser, departmentList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item } : defaultForm(currentUser?.full_name || ''));

  const setField = (key: string, val: any) => {
    setForm((p: any) => ({ ...p, [key]: val }));
  };

  const setChecklist = (id: string, val: boolean) => {
    setForm((p: any) => {
      const newChecklist = { ...p.checklist_data, [id]: val };
      const stats = calcStats(newChecklist);
      return { ...p, checklist_data: newChecklist, ...stats };
    });
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
      <div className={`p-7 border-b border-slate-50 flex justify-between items-center bg-emerald-600/5`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-emerald-600`}>
            <Pill size={22} />
          </div>
          <div>
            <h2 className="text-main-title font-bold text-slate-800 uppercase leading-tight">{item?.id ? 'Sửa' : 'Thêm'} bảng kiểm an toàn dùng thuốc</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Bảng kiểm giám sát tuân thủ</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSaved(form); }} className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 bg-slate-50 p-5 rounded-[28px] border border-slate-100 shadow-inner">
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ngày giám sát</label><input type="date" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Người giám sát</label><input value={form.nguoi_giam_sat} onChange={e => setField('nguoi_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Khoa/Phòng</label><input list="drug-dv-list" value={form.don_vi_duoc_giam_sat || ''} onChange={e => setField('don_vi_duoc_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /><datalist id="drug-dv-list">{departmentList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">NVYT / BN được GS</label><input placeholder="Nhập tên NVYT/BN" value={form.ho_ten_nb || ''} onChange={e => setField('ho_ten_nb', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
           <div className="p-4 text-white text-[10px] font-black uppercase tracking-widest bg-emerald-600">Nội dung giám sát</div>
           <div className="divide-y divide-slate-50">
             {CRITERIA_DRUG.map((c: any) => {
               const val = form.checklist_data[c.id];
               return (
                 <div key={c.id} className={`p-4 flex flex-col gap-3 ${val === false ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-start gap-4">
                       <div className="flex-1 min-w-0 pt-1">
                          <p className="text-sm font-bold text-slate-700 leading-snug">{c.label}</p>
                       </div>
                       <DrugToggle value={val} onChange={v => setChecklist(c.id, v)} />
                    </div>
                 </div>
               );
             })}
           </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2"><AlertTriangle size={14} className="text-red-500"/> Mô tả lỗi vi phạm (nếu có)</label><textarea placeholder="Ghi chú chi tiết nếu có lỗi vi phạm, nhầm BN, nhầm thuốc..." value={form.loi_sai_khac_phuc || ''} onChange={e => setField('loi_sai_khac_phuc', e.target.value)} rows={3} className="w-full p-3 rounded-2xl border border-slate-200 text-sm outline-none bg-red-50/30" /></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-6">
             <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Kết quả</p><p className={`text-3xl font-black ${form.tong_dat >= 7 ? 'text-[#059669]' : form.tong_dat >= 5 ? 'text-amber-500' : 'text-red-500'}`}>{form.tong_dat}/8</p></div>
             <div className="h-10 w-px bg-slate-100"/>
             <div className="text-sm font-bold text-slate-600">
                {form.tong_dat >= 7 ? <span className="text-[#059669]">Duy trì thực hiện (Tốt)</span> : form.tong_dat >= 5 ? <span className="text-amber-600">Cần nhắc nhở</span> : <span className="text-red-600">Vi phạm (Cần lập biên bản)</span>}
             </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Đóng</button>
             <button type="submit" className={`flex-1 md:flex-none px-12 py-3.5 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl transition-all bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100`}>Lưu phiếu</button>
          </div>
        </div>
      </form>
    </div>
  );
};

const DrugDetail = ({ item, currentUser, onClose, onEdit }: any) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Quản trị viên';
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-2 bg-emerald-600`}/>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center no-print">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><RotateCcw size={14}/> Quay lại</button>
          <div className="flex gap-3">
             <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"><FileText size={18}/></button>
             {isAdmin && <button onClick={onEdit} className={`px-6 py-3 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg bg-emerald-600 shadow-emerald-100`}>Sửa dữ liệu</button>}
          </div>
        </div>

        <div className="text-center space-y-3">
           <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto shadow-xl mb-4 bg-emerald-600 text-white"><Pill size={32}/></div>
           <h1 className="text-main-title font-bold text-slate-900 uppercase leading-tight tracking-tight">BẢNG KIỂM GIÁM SÁT AN TOÀN SỬ DỤNG THUỐC</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-dashed border-slate-200">
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khoa/Phòng</p><p className="text-sm font-black text-slate-800 uppercase">{item.don_vi_duoc_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">NVYT/BN được GS</p><p className="text-sm font-black text-slate-800 uppercase">{item.ho_ten_nb}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Người giám sát</p><p className="text-sm font-black text-slate-800 uppercase">{item.nguoi_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày giám sát</p><p className="text-sm font-black text-slate-800">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-4 border-slate-900 text-[12pt]">
            <thead className="bg-emerald-600 text-white font-bold uppercase text-table">
               <tr><th className="p-4 border-2 border-slate-900 text-left w-16">STT</th><th className="p-4 border-2 border-slate-900 text-left">Nội dung/Tiêu chí giám sát</th><th className="p-4 border-2 border-slate-900 w-32">Kết quả</th></tr>
            </thead>
            <tbody className="font-normal text-slate-700">
               {CRITERIA_DRUG.map((c: any, index: number) => {
                 const val = item.checklist_data[c.id];
                 return (
                   <tr key={c.id} className={val === false ? 'bg-red-50' : ''}>
                     <td className="p-4 border-2 border-slate-900 text-center font-bold">{index + 1}</td>
                     <td className="p-4 border-2 border-slate-900 leading-snug">{c.label.substring(c.label.indexOf('.') + 2)}</td>
                     <td className="p-4 border-2 border-slate-900 text-center font-bold">
                        {val === true ? <span className="text-[#059669]">ĐẠT</span> : <span className="text-red-600">KHÔNG</span>}
                     </td>
                   </tr>
                 );
               })}
               <tr className="bg-slate-100 font-black">
                 <td colSpan={2} className="p-4 border-2 border-slate-900 uppercase text-right">Tổng điểm</td>
                 <td className="p-4 border-2 border-slate-900 text-center text-xl">{item.tong_dat}/8</td>
               </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <h3 className="font-black uppercase border-b pb-2 text-slate-800">Đánh giá chung</h3>
            <p className="text-sm font-bold">
               Phân loại: {' '}
               {item.tong_dat >= 7 ? <span className="text-[#059669]">Đạt (Duy trì thực hiện)</span> : item.tong_dat >= 5 ? <span className="text-amber-600">Cần nhắc nhở (Gửi thông báo phản hồi cho đơn vị trong vòng 24 giờ)</span> : <span className="text-red-600">Vi phạm (Lập biên bản)</span>}
            </p>
            {item.loi_sai_khac_phuc && (
               <div className="mt-4">
                  <p className="font-bold text-sm text-red-600">Mô tả lỗi vi phạm:</p>
                  <p className="text-sm whitespace-pre-wrap text-slate-700">{item.loi_sai_khac_phuc}</p>
               </div>
            )}
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
