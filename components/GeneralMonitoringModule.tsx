import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera,
  CheckCircle2, XCircle, TrendingUp, Building2, Calendar,
  Check, Ambulance, ClipboardList,
  DoorOpen, LogOut, ArrowRightLeft, ShieldCheck, GraduationCap,
  GripVertical
} from 'lucide-react';
import {
  fetchGsChung, addGsChung, updateGsChung,
  deleteGsChung, uploadGsChungImage, GiamSatChung, GiamSatChungItem
} from '../readGsChung';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DateRangeFilter from './DateRangeFilter';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getDateRange, isDateInRange } from '../utils/dateUtils';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
};

const toLocalISO = (date: Date) => {
  const yyyy = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${month}-${dd}T${hh}:${mm}`;
};

const calcStatsGsChung = (noiDung: GiamSatChungItem[]) => {
  const tong_muc = noiDung.length;
  const tong_dat = noiDung.filter(i => i.is_pass).length;
  const ty_le = tong_muc > 0 ? Math.round((tong_dat / tong_muc) * 100 * 100) / 100 : 100;
  return { tong_dat, tong_muc, ty_le };
};

const defaultFormGsChung = (userName = ''): any => ({
  ngay_giam_sat: toLocalISO(new Date()),
  nguoi_gs: userName,
  khoa_gs: '',
  doi_tuong_gs: '',
  noi_dung_gs: [
    { id: 'initial-1', label: '', is_pass: true, note: '' }
  ],
  ket_luan: '',
  hinh_anh: [],
  tong_dat: 1,
  tong_muc: 1,
  ty_le: 100
});

// ─── UI COMPONENTS ──────────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border ${active ? 'bg-[#059669] text-white border-[#059669] shadow-lg' : 'bg-white text-[#059669] border-slate-200 hover:bg-slate-50'}`}>
    <Icon size={15} />{label}
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colors[color]}`}>{React.cloneElement(icon, { size: 20 })}</div>
      <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p><h3 className="text-lg font-bold text-slate-800">{value}</h3></div>
    </div>
  );
};

const DatKhongDatToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex gap-1.5 shrink-0">
    <button type="button" onClick={() => onChange(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${value ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300'}`}><CheckCircle2 size={12} /> Đạt</button>
    <button type="button" onClick={() => onChange(false)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${!value ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-300'}`}><XCircle size={12} /> K.Đạt</button>
  </div>
);

const ImageUploaderGsChung = ({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadGsChungImage(f)));
      onChange([...images, ...urls]);
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Lỗi tải ảnh: ' + (err.message || 'Không xác định'));
    }
    finally { setUploading(false); e.target.value = ''; }
  };
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((url, i) => (
        <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md group">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
        </div>
      ))}
      <label className={`w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-[#059669] hover:text-[#059669] transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
        <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
        <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{uploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
      </label>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const GsChungErrorSummary = ({ data }: { data: GiamSatChung[] }) => {
  const summary = useMemo(() => {
    const flattened: any[] = [];
    data.forEach(record => {
      record.noi_dung_gs.forEach(item => {
        if (!item.is_pass) {
          flattened.push({
            khoa: record.khoa_gs,
            ngay: record.ngay_giam_sat,
            label: item.label,
            note: item.note
          });
        }
      });
    });
    return flattened.sort((a, b) => new Date(b.ngay).getTime() - new Date(a.ngay).getTime());
  }, [data]);

  const handleExportExcel = () => {
    if (summary.length === 0) { alert('Không có dữ liệu để xuất'); return; }
    const worksheetData = summary.map((s, i) => ({
      'STT': i + 1,
      'Thời gian': formatDateTime(s.ngay),
      'Khoa phòng': s.khoa,
      'Nội dung chưa đạt': s.label,
      'Chi tiết lỗi/Ghi chú': s.note || '(Không có ghi chú)'
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chi_tiet_loi_giam_sat_chung");
    ws['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 30 }, { wch: 50 }, { wch: 40 }];
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Bao_cao_loi_GS_CHUNG_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100 space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight">TỔNG HỢP CÁC LỖI GHI NHẬN</h2>
        <p className="text-xs text-slate-500 italic font-medium uppercase tracking-widest">Danh sách các nội dung chưa đạt trong quá trình giám sát chung.</p>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-slate-200">
        <table className="table-standardized">
          <thead>
            <tr className="bg-slate-50 text-indigo-900">
              <th className="text-left w-32">Ngày GS</th>
              <th className="text-left w-48">Đơn vị vi phạm</th>
              <th className="text-left">Nội dung giám sát</th>
              <th className="text-left">Chi tiết lỗi ghi nhận</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-700">
            {summary.length > 0 ? summary.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td data-label="Ngày GS" className="p-4 text-xs text-slate-500">{formatDateTime(s.ngay)}</td>
                <td data-label="Đơn vị vi phạm" className="p-4 uppercase font-bold text-rose-600">{s.khoa}</td>
                <td data-label="Nội dung giám sát" className="p-4 font-bold uppercase text-[12px]">{s.label}</td>
                <td data-label="Chi tiết lỗi ghi nhận" className="p-4 italic text-slate-500 font-medium">{s.note || '---'}</td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-16 text-center text-slate-400 italic text-lg font-medium">Hiện tại chưa ghi nhận lỗi vi phạm nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-6">
         <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#059669] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95"><BarChart3 size={18}/> Xuất báo cáo Excel</button>
      </div>
    </div>
  );
};

const GsChungOverview = ({ data }: { data: GiamSatChung[] }) => {
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, avg: 0, full: 0, fail: 0 };
    const avg = data.reduce((s, d) => s + (d.ty_le || 0), 0) / data.length;
    const full = data.filter(d => (d.ty_le || 0) === 100).length;
    return { total: data.length, avg, full, fail: data.length - full };
  }, [data]);

  const trendData = useMemo(() => {
    const map: Record<string, { date: string; sum: number; count: number }> = {};
    data.slice(-20).reverse().forEach(d => {
      const key = new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, sum: 0, count: 0 };
      map[key].sum += d.ty_le || 0;
      map[key].count++;
    });
    return Object.values(map).map(r => ({ date: r.date, avg: Number((r.sum / r.count).toFixed(1)) }));
  }, [data]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<ClipboardList />} label="Tổng lượt giám sát" value={stats.total} color="indigo" />
        <StatCard icon={<ShieldCheck />} label="Tỷ lệ đạt trung bình" value={`${stats.avg.toFixed(1)}%`} color="green" />
        <StatCard icon={<CheckCircle2 />} label="Hoàn hảo (100%)" value={stats.full} color="emerald" />
        <StatCard icon={<XCircle />} label="Tồn tại ghi nhận" value={stats.fail} color="rose" />
      </div>
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-96 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#059669] opacity-20"/>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3"><TrendingUp size={18} className="text-[#059669]" /> Biểu đồ chất lượng giám sát</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="avg" fill="#059669" opacity={0.6} radius={[6, 6, 0, 0]} name="Chất lượng TB" />
              <Line type="monotone" dataKey="avg" stroke="#059669" strokeWidth={4} dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} name="Xu thế" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const GsChungList = ({ data, onView, onEdit, onDelete, onAdd }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: any) =>
    d.khoa_gs.toLowerCase().includes(search.toLowerCase()) ||
    d.nguoi_gs.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <button onClick={onAdd} className="bg-[#059669] hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"><Plus size={18}/> Thêm phiếu giám sát mới</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm nhanh khoa hoặc người giám sát..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all placeholder:font-medium placeholder:text-slate-300" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr><th>Thời gian</th><th>Khoa được giám sát</th><th>Đối tượng</th><th>Cán bộ GS</th><th className="text-center">Mục GS</th><th className="text-center">Tỷ lệ đạt</th><th className="text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-bold">
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-emerald-50/30 transition-colors">
                <td className="p-4 text-slate-500 font-medium text-xs">{formatDateTime(d.ngay_giam_sat)}</td>
                <td className="p-4 text-slate-900 tracking-tight text-xs">{d.khoa_gs}</td>
                <td className="p-4 text-slate-600 text-xs truncate max-w-[150px]">{d.doi_tuong_gs || '---'}</td>
                <td className="p-4 text-xs text-slate-500">{d.nguoi_gs}</td>
                <td className="p-4 text-center font-black">{d.tong_muc || 0}</td>
                <td className={`p-4 text-center text-lg font-black ${d.ty_le === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{d.ty_le}%</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => onView(d)} className="p-2.5 text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100" title="Xem chi tiết"><Eye size={16} /></button>
                    <button onClick={() => onEdit(d)} className="p-2.5 text-[#059669] hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100" title="Chỉnh sửa"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(d.id)} className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors" title="Xóa"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-16 text-center text-slate-400 italic text-sm font-medium">Không tìm thấy dữ liệu giám sát nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GsChungForm = ({ item, currentUser, deptList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item, ngay_giam_sat: toLocalISO(new Date(item.ngay_giam_sat)) } : defaultFormGsChung(currentUser?.full_name || ''));
  const [saving, setSaving] = useState(false);

  const calculateAndSet = (noiDung: GiamSatChungItem[]) => {
    const stats = calcStatsGsChung(noiDung);
    setForm((p: any) => ({ ...p, noi_dung_gs: noiDung, ...stats }));
  };

  const addRow = () => {
    const newRow: GiamSatChungItem = { id: Date.now().toString(), label: '', is_pass: true, note: '' };
    calculateAndSet([...form.noi_dung_gs, newRow]);
  };

  const removeRow = (id: string) => {
    if (form.noi_dung_gs.length <= 1) return;
    calculateAndSet(form.noi_dung_gs.filter((r: any) => r.id !== id));
  };

  const updateRow = (id: string, updates: Partial<GiamSatChungItem>) => {
    const updated = form.noi_dung_gs.map((r: any) => r.id === id ? { ...r, ...updates } : r);
    calculateAndSet(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.khoa_gs) { alert('Vui lòng chọn đơn vị được giám sát'); return; }
    if (form.noi_dung_gs.some((i: any) => !i.label.trim())) { alert('Vui lòng nhập đầy đủ nội dung giám sát cho các hàng'); return; }

    setSaving(true);
    try {
      const dataToSave = { ...form, ngay_giam_sat: new Date(form.ngay_giam_sat).toISOString() };
      if (item?.id) await updateGsChung(item.id, dataToSave);
      else await addGsChung(dataToSave);
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
         <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#059669] rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-[#059669]/20"><ClipboardList size={28} /></div>
            <div>
              <h2 className="text-main-title font-bold text-slate-800 leading-tight">Giám sát chung</h2>
              <p className="text-[10px] font-bold text-slate-900 mt-1">Giám sát quy trình và thực hành tại các đơn vị (Tiêu chuẩn chất lượng)</p>
            </div>
         </div>
         <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10 font-bold">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
           <div className="md:col-span-3 space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Thời điểm giám sát</label>
             <input type="datetime-local" value={form.ngay_giam_sat} onChange={e => setForm({...form, ngay_giam_sat: e.target.value})} required className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white shadow-sm transition-all" />
           </div>
           <div className="md:col-span-3 space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Khoa được giám sát</label>
             <input list="gs-chung-dv-list" value={form.khoa_gs} onChange={e => setForm({...form, khoa_gs: e.target.value})} required className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 bg-white transition-all shadow-sm" placeholder="Chọn khoa phòng..." />
             <datalist id="gs-chung-dv-list">{deptList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist>
           </div>
           <div className="md:col-span-3 space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Đối tượng giám sát</label>
             <input value={form.doi_tuong_gs} onChange={e => setForm({...form, doi_tuong_gs: e.target.value})} required placeholder="VD: NB Nguyễn Văn A, Hồ sơ..." className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 bg-white shadow-sm transition-all" />
           </div>
           <div className="md:col-span-3 space-y-2">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Cán bộ giám sát</label>
             <input value={form.nguoi_gs} onChange={e => setForm({...form, nguoi_gs: e.target.value})} required className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 bg-white shadow-sm transition-all" />
           </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 underline underline-offset-8 decoration-emerald-500">Nội dung chi tiết giám sát</h3>
              <button type="button" onClick={addRow} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95"><Plus size={16}/> Thêm nội dung</button>
           </div>

           <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm bg-white">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                       <th className="p-4 text-center w-12">STT</th>
                       <th className="p-4 text-left">Nội dung giám sát chuyên môn/nghiệp vụ</th>
                       <th className="p-4 text-center w-48">Kết quả</th>
                       <th className="p-4 text-left w-64">Ghi chú chi tiết</th>
                       <th className="p-4 text-center w-10"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {form.noi_dung_gs.map((row: any, idx: number) => (
                      <tr key={row.id} className={`transition-colors ${!row.is_pass ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                         <td className="p-4 text-center text-xs font-black text-slate-400">{idx + 1}</td>
                         <td className="p-4">
                            <input value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })} placeholder="VD: Khai thác bệnh sử NB..." className="w-full bg-transparent border-none outline-none text-[13px] font-bold text-black focus:placeholder:opacity-0 transition-all" />
                         </td>
                         <td className="p-4">
                            <div className="flex justify-center"><DatKhongDatToggle value={row.is_pass} onChange={v => updateRow(row.id, { is_pass: v })} /></div>
                         </td>
                         <td className="p-4">
                            <input value={row.note} onChange={e => updateRow(row.id, { note: e.target.value })} placeholder="Cụ thể lỗi (nếu có)..." className="w-full bg-transparent border-none outline-none text-[11px] font-semibold text-rose-600 focus:placeholder:opacity-0 transition-all placeholder:italic placeholder:text-slate-300" />
                         </td>
                         <td className="p-4 text-center">
                            <button type="button" onClick={() => removeRow(row.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2"><Camera size={16} className="text-[#059669]" /> Hình ảnh minh chứng (Lưu tại gs_hsba)</label>
             <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                <ImageUploaderGsChung images={form.hinh_anh || []} onChange={urls => setForm({...form, hinh_anh: urls})} />
             </div>
          </div>
          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 font-black">Kết luận / Kiến nghị chung</label>
             <textarea rows={6} value={form.ket_luan} onChange={e => setForm({...form, ket_luan: e.target.value})} placeholder="Tóm tắt các vấn đề tồn tại chính và đề xuất hướng xử lý cho đơn vị..." className="w-full p-6 rounded-[32px] border border-slate-200 text-sm font-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 shadow-inner bg-slate-50/50 transition-all placeholder:italic placeholder:font-medium" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-slate-100 font-black">
           <div className="flex items-center gap-10">
              <div className="text-center group">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest leading-none">Tuân thủ</p>
                 <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center text-2xl font-black shadow-2xl transition-all group-hover:rotate-6 ${form.ty_le === 100 ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>{Math.floor(form.ty_le)}<sup>%</sup></div>
              </div>
              <div className="max-w-[200px]">
                 <p className="text-[12px] font-black text-slate-700 leading-relaxed uppercase tracking-tight">Kết quả: <span className="text-[#059669]">{form.tong_dat}</span> / <span className="text-slate-900">{form.tong_muc}</span> tiêu chí đạt chuẩn nghiệp vụ.</p>
              </div>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <button type="button" onClick={onClose} className="flex-1 px-10 py-4.5 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-[24px] text-[12px] font-black uppercase tracking-widest transition-all active:scale-95">Hủy bỏ</button>
              <button type="submit" disabled={saving} className="flex-1 px-16 py-4.5 bg-[#059669] text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50">{saving ? 'Đang gửi...' : 'Lưu'}</button>
           </div>
        </div>
      </form>
    </div>
  );
};

const GsChungDetail = ({ item, onClose, onEdit }: any) => {
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-12 border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-98 duration-700 font-bold tracking-tight">
      <div className="absolute top-0 left-0 w-full h-3 bg-[#059669]"/>
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center no-print outline-none text-black">
          <button onClick={onClose} className="flex items-center gap-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-[#059669] transition-colors"><RotateCcw size={16}/> Quay về danh sách</button>
          <div className="flex gap-4">
             <button onClick={onEdit} className="px-8 py-3 bg-[#059669] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all">Sửa phiếu</button>
          </div>
        </div>

        <div className="text-center space-y-2">
           <h1 className="text-3xl font-black text-slate-900 uppercase leading-tight tracking-tight">GIÁM SÁT CHUNG</h1>
           <p className="text-xs text-slate-400 italic">Mã số: {item.id?.split('-')[0].toUpperCase()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-y-2 border-dashed border-slate-200 text-[13px] font-bold text-black">
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Khoa được giám sát</p><p className="border-l-4 border-[#059669] pl-4 text-base">{item.khoa_gs}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Đối tượng giám sát</p><p className="border-l-4 border-[#059669] pl-4 text-base">{item.doi_tuong_gs || '---'}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Cán bộ giám sát</p><p className="border-l-4 border-[#059669] pl-4 text-base">{item.nguoi_gs}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Thời điểm khảo sát</p><p className="border-l-4 border-[#059669] pl-4 text-base text-slate-500">{formatDateTime(item.ngay_giam_sat)}</p></div>
        </div>

        <div className="space-y-6">
           <table className="w-full border-collapse border-4 border-[#059669] text-table font-black">
              <thead className="bg-[#059669] text-white uppercase text-center text-[10px] tracking-widest font-black">
                 <tr><th className="p-4 border-2 border-[#059669] w-12">STT</th><th className="p-4 border-2 border-[#059669] text-left">NỘI DUNG GIÁM SÁT NGHIỆP VỤ</th><th className="p-4 border-2 border-[#059669] w-24">ĐẠT</th><th className="p-4 border-2 border-[#059669] w-24">K.ĐẠT</th><th className="p-4 border-2 border-[#059669]">CHI TIẾT VI PHẠM / KIẾN NGHỊ</th></tr>
              </thead>
              <tbody>
                {item.noi_dung_gs?.map((row: any, idx: number) => (
                  <tr key={row.id}>
                    <td className="p-4 border-2 border-[#059669] text-center font-normal">{idx+1}</td>
                    <td className="p-4 border-2 border-[#059669] text-slate-800 leading-relaxed text-[11px] font-bold">{row.label}</td>
                    <td className="p-4 border-2 border-[#059669] text-center">{row.is_pass && <Check size={28} className="text-emerald-500 mx-auto stroke-[4]" />}</td>
                    <td className="p-4 border-2 border-[#059669] text-center">{!row.is_pass && <X size={28} className="text-rose-600 mx-auto stroke-[4]" />}</td>
                    <td className="p-4 border-2 border-[#059669] italic text-rose-600 text-xs font-bold">{row.note}</td>
                  </tr>
                ))}
                  <tr className="bg-[#059669] text-white text-lg font-black">
                    <td colSpan={2} className="p-5 border-2 border-[#059669] uppercase text-right tracking-[0.2em] text-xs">KẾT QUẢ CHUNG (ĐẠT CHUẨN)</td>
                    <td colSpan={2} className="p-5 border-2 border-[#059669] text-center text-3xl font-black">{item.tong_dat}/{item.tong_muc}</td>
                    <td className="p-5 border-2 border-[#059669] text-emerald-100 text-center text-3xl font-black">{item.ty_le}<sup>%</sup></td>
                  </tr>
              </tbody>
           </table>
        </div>

        {item.ket_luan && (
          <div className="space-y-4 pt-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Đánh giá chung & Kiến nghị bổ sung:</h3>
            <div className="p-8 bg-emerald-50 border-r-8 border-[#059669] text-[14px] italic text-emerald-950 leading-relaxed font-bold whitespace-pre-wrap shadow-inner uppercase">{item.ket_luan}</div>
          </div>
        )}

        {item.hinh_anh?.length > 0 && (
           <div className="space-y-6 no-print border-t border-slate-100 pt-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Camera size={18} className="text-[#059669]"/> Hình ảnh minh chứng hiện trường</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {item.hinh_anh.map((u: string, i: number) => (
                  <div key={i} className="aspect-square rounded-[32px] overflow-hidden border-8 border-white shadow-2xl transition-transform hover:scale-105">
                    <img src={u} className="w-full h-full object-cover" alt=""/>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* Chữ ký */}
        <div className="flex justify-between pt-24 items-start h-80 font-black text-black">
           <div className="text-center flex-1 space-y-24">
             <p className="text-[11px] font-black uppercase tracking-[0.2em] underline decoration-2 underline-offset-8">Đại diện đơn vị được giám sát</p>
             <div className="text-slate-200 italic font-medium">(Ký và ghi rõ họ tên)</div>
           </div>
           <div className="text-center flex-1 space-y-24">
             <p className="text-[11px] font-black uppercase tracking-[0.2em] underline decoration-2 underline-offset-8">Cán bộ phụ trách giám sát</p>
             <div className="text-slate-200 italic font-medium">(Ký và ghi rõ họ tên)</div>
           </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export const GeneralMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LIST' | 'SUMMARY'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [data, setData] = useState<GiamSatChung[]>([]);
  const [editingItem, setEditingItem] = useState<GiamSatChung | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({ type: 'all', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rs, dv] = await Promise.all([fetchGsChung(), fetchDmDonVi()]);
      setData(rs || []); setDeptList(dv || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const matchedDate = isDateInRange(item.ngay_giam_sat, range);
      const matchedDept = !deptFilter || item.khoa_gs === deptFilter;
      return matchedDate && matchedDept;
    });
  }, [data, dateFilter, deptFilter]);

  return (
    <div className="bg-slate-50/20 min-h-[calc(100vh-6rem)]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex bg-white p-2 gap-2 rounded-[32px] border border-slate-100 shrink-0 shadow-sm">
             <TabButton active={activeTab === 'OVERVIEW'} onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} icon={LayoutDashboard} label="Tổng quan" />
             <TabButton active={activeTab === 'LIST'} onClick={() => { setActiveTab('LIST'); setViewMode('LIST'); }} icon={List} label="Danh sách" />
             <TabButton active={activeTab === 'SUMMARY'} onClick={() => { setActiveTab('SUMMARY'); setViewMode('LIST'); }} icon={BarChart3} label="Báo cáo tổng hợp" />
           </div>

           {viewMode === 'LIST' && (
             <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm">
               <DateRangeFilter filter={dateFilter} onChange={setDateFilter} className="shrink-0" />
               <div className="h-6 w-px bg-slate-100 mx-2 hidden md:block"/>
               <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-6 py-2.5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10 text-emerald-900 transition-all cursor-pointer">
                 <option value="">Tất cả các khoa phòng</option>
                 {deptList.map((d: any) => <option key={d.id} value={d.ten_don_vi}>{d.ten_don_vi}</option>)}
               </select>

               {activeTab !== 'LIST' && (
                 <button onClick={() => { setEditingItem(null); setActiveTab('LIST'); setViewMode('FORM'); }} className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-[#008800] active:scale-95">
                   <Plus size={16} /> Thêm giám sát mới
                 </button>
               )}             </div>
           )}
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4"><Loader2 className="animate-spin text-[#059669]" size={48} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Đang đồng bộ dữ liệu...</p></div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {activeTab === 'OVERVIEW' ? <GsChungOverview data={filteredData} />
            : activeTab === 'SUMMARY' ? <GsChungErrorSummary data={filteredData} />
            : viewMode === 'LIST' ? <GsChungList data={filteredData} onAdd={() => { setEditingItem(null); setViewMode('FORM'); }} onView={(i: any) => { setEditingItem(i); setViewMode('DETAIL'); }} onEdit={(i: any) => { setEditingItem(i); setViewMode('FORM'); }} onDelete={async (id: string) => { if (window.confirm('Hành động xóa này không thể khôi phục. Bạn chắc chắn chứ?')) { await deleteGsChung(id); loadData(); } }} />
            : viewMode === 'FORM' ? <GsChungForm item={editingItem} currentUser={user} deptList={deptList} onSaved={() => { setViewMode('LIST'); loadData(); }} onClose={() => setViewMode('LIST')} />
            : <GsChungDetail item={editingItem} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralMonitoringModule;
