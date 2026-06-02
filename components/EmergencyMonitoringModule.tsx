import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera,
  CheckCircle2, XCircle, TrendingUp, Building2, User, Calendar,
  Users, AlertTriangle, CheckSquare, Shield, Activity, ArrowRight, ClipboardList,
  Stethoscope, ShieldAlert, BookOpen, Check, Ambulance, HeartPulse, Zap
} from 'lucide-react';
import {
  fetchGsCapCuu, addGsCapCuu, updateGsCapCuu,
  deleteGsCapCuu, uploadCapCuuImage, GiamSatCapCuu
} from '../readGsCapCuu';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DateRangeFilter from './DateRangeFilter';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getDateRange, isDateInRange } from '../utils/dateUtils';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${hh}:${mm} ${dd}/${month}/${yyyy}`;
};

const toLocalISO = (date: Date) => {
  const yyyy = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${month}-${dd}T${hh}:${mm}`;
};

// ─── CRITERIA & SECTIONS ──────────────────────────────────────────────────────
export const SECTIONS_CAP_CUU = [
  {
    title: 'I. HÀNH CHÍNH & TIẾP NHẬN',
    criteria: [
      { id: 'c1', label: 'Có biển hiệu, sơ đồ hướng dẫn rõ ràng, đèn báo cấp cứu hoạt động tốt; đường đi cho xe cứu thương thông thoáng.', note: '' },
      { id: 'c2', label: 'Nhân viên tiếp nhận có thái độ khẩn trương, xử lý ngay không gây phiền hà về thủ tục hành chính.', note: '' },
      { id: 'c3', label: 'Thực hiện phân loại ưu tiên cấp cứu chính xác theo tình trạng bệnh lý.', note: '' },
      { id: 'c4', label: 'Ghi chép đầy đủ thời gian người bệnh đến, tình trạng lúc vào và các xử trí ban đầu trong sổ cấp cứu/ hồ sơ.', note: '' },
    ]
  },
  {
    title: 'II. CHUYÊN MÔN & XỬ TRÍ',
    criteria: [
      { id: 'c5', label: 'Bác sĩ cấp cứu có mặt trong vòng 1-3 phút (tùy mức độ ưu tiên) để thăm khám và chỉ định y lệnh.', note: '' },
      { id: 'c6', label: 'Thực hiện đúng các quy trình kỹ thuật cấp cứu (hồi sinh tim phổi, xử trí sốc, cầm máu, bất động...).', note: '' },
      { id: 'c7', label: 'Có sự phối hợp hiệp đồng tốt giữa kíp trực cấp cứu và các chuyên khoa liên quan (hội chẩn tại chỗ).', note: '' },
      { id: 'c8', label: 'Người bệnh được theo dõi liên tục về chức năng sống; y lệnh được thực hiện khẩn trương và chính xác.', note: '' },
    ]
  },
  {
    title: 'III. TRANG THIẾT BỊ, THUỐC & XE CẤP CỨU',
    criteria: [
      { id: 'c9', label: 'Xe /Tủ thuốc cấp cứu đầy đủ danh mục, thuốc sắp xếp theo 5S, dễ thấy, dễ lấy.', note: '' },
      { id: 'c10', label: 'Các trang thiết bị (máy giúp thở, máy sốc tim, oxy, máy hút) luôn cắm điện dự phòng và sẵn sàng sử dụng.', note: '' },
      { id: 'c11', label: 'Xe cứu thương sẵn sàng nổ máy, đầy đủ xăng, trang bị cấp cứu trên xe đồng bộ và hoạt động tốt.', note: '' },
    ]
  },
  {
    title: 'IV. PHƯƠNG ÁN CẤP CỨU HÀNG LOẠT',
    criteria: [
      { id: 'c12', label: 'Có kế hoạch và phương án sẵn sàng cấp cứu hàng loạt, thảm họa, cháy nổ hoặc nhiễm độc.', note: '' },
      { id: 'c13', label: 'Hệ thống báo động hoặc thông tin liên lạc khẩn cấp hoạt động tốt.', note: '' },
    ]
  }
];

const ALL_CRITERIA_CAP_CUU = SECTIONS_CAP_CUU.flatMap(s => s.criteria);
const TOTAL_CRITERIA_CAP_CUU = ALL_CRITERIA_CAP_CUU.length;

const calcStatsCapCuu = (form: any) => {
  const dat = ALL_CRITERIA_CAP_CUU.filter(c => form[c.id] !== false).length;
  const ty_le = Math.round((dat / TOTAL_CRITERIA_CAP_CUU) * 100 * 100) / 100;
  return { tong_dat: dat, tong_tieu_chi: TOTAL_CRITERIA_CAP_CUU, ty_le_tuan_thu: ty_le };
};

const defaultFormCapCuu = (userName = ''): any => {
  const base: any = {
    ngay_kiem_tra: toLocalISO(new Date()),
    nguoi_kiem_tra: userName,
    don_vi_duoc_kiem_tra: '',
    ket_luan_chung: '',
    hinh_anh_minh_chung: [],
    tong_dat: TOTAL_CRITERIA_CAP_CUU,
    tong_tieu_chi: TOTAL_CRITERIA_CAP_CUU,
    ty_le_tuan_thu: 100,
  };
  ALL_CRITERIA_CAP_CUU.forEach((c) => {
    base[c.id] = true;
    base[`${c.id}_ghi_chu`] = '';
  });
  return base;
};

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border ${active ? 'bg-[#009900] text-white border-[#009900] shadow-lg' : 'bg-white text-[#009900] border-slate-200 hover:bg-slate-50'}`}>
    <Icon size={15} />{label}
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-[#009900]',
    red: 'bg-red-50 text-red-600',
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
    <button type="button" onClick={() => onChange(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${value ? 'bg-[#009900] text-white border-[#009900] shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-green-300'}`}><CheckCircle2 size={12} /> Đạt</button>
    <button type="button" onClick={() => onChange(false)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${!value ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'}`}><XCircle size={12} /> K.Đạt</button>
  </div>
);

const ImageUploaderCapCuu = ({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadCapCuuImage(f)));
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
        <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow group">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 p-0.5 bg-rose-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
        </div>
      ))}
      <label className={`w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-[#009900] hover:text-[#009900] transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
        <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        <span className="text-[7px] font-black mt-0.5">{uploading ? 'Tải...' : 'Thêm'}</span>
      </label>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const CapCuuErrorSummary = ({ data }: { data: GiamSatCapCuu[] }) => {
  const summary = useMemo(() => {
    const total = data.length;
    if (total === 0) return [];

    const stats = ALL_CRITERIA_CAP_CUU.map((c) => {
      const fieldId = c.id;
      const noteField = `${c.id}_ghi_chu`;
      const recordsWithError = data.filter(d => (d as any)[fieldId] === false);
      const count = recordsWithError.length;
      const depts = Array.from(new Set(recordsWithError.map(d => d.don_vi_duoc_kiem_tra))).join(', ');
      
      const specificNotes = Array.from(new Set(
        recordsWithError
          .map(d => (d as any)[noteField])
          .filter(n => n && n.trim() !== '')
      )).join('; ');

      return {
        label: c.label,
        count,
        rate: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
        depts,
        notes: specificNotes || '(Không có ghi chú cụ thể)'
      };
    }).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

    return stats;
  }, [data]);

  const handleExportExcel = () => {
    if (summary.length === 0) { alert('Không có dữ liệu để xuất'); return; }
    const worksheetData = summary.map((s, i) => ({
      'STT': i + 1,
      'Nội dung vi phạm (Tiêu chí)': s.label,
      'Số lượng vi phạm': s.count,
      'Tỷ lệ (%)': s.rate + '%',
      'Lỗi cụ thể': s.notes,
      'Đơn vị liên quan': s.depts
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tong_hop_loi_CAP_CUU");
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 50 }, { wch: 30 }];
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Bao_cao_loi_CAP_CUU_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight">TỔNG HỢP VI PHẠM CÔNG TÁC CẤP CỨU</h2>
        <p className="text-xs text-slate-500 italic">Dùng cho cơ quan chức năng báo cáo định kỳ về chất lượng cấp cứu.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr>
              <th className="text-left w-1/3">Nội dung giám sát (Tiêu chí)</th>
              <th className="text-center w-24">Số kíp vi phạm</th>
              <th className="text-center w-20">Tỷ lệ (%)</th>
              <th className="text-left">Ghi chú & Đơn vị</th>
            </tr>
          </thead>
          <tbody className="font-bold text-slate-700">
            {summary.length > 0 ? summary.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 border-2 border-slate-900 text-blue-700 leading-snug">{s.label}</td>
                <td className="p-4 border-2 border-slate-900 text-center text-lg font-black">{s.count}</td>
                <td className="p-4 border-2 border-slate-900 text-center text-lg font-black text-red-600">{s.rate}%</td>
                <td className="p-4 border-2 border-slate-900">
                  <p className="text-slate-900 italic mb-2">Lỗi: {s.notes}</p>
                  <p className="text-[12pt] text-slate-900 font-black uppercase tracking-tight flex items-center gap-2"><Building2 size={16} className="text-[#009900]"/> {s.depts || 'N/A'}</p>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-10 text-center text-slate-400 italic text-lg">Chưa ghi nhận vi phạm nào trong giai đoạn này.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-6">
         <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#009900] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-green-700 transition-all"><BarChart3 size={16}/> Xuất Excel</button>
      </div>
    </div>
  );
};

const CapCuuOverview = ({ data }: { data: GiamSatCapCuu[] }) => {
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, avg: 0, full: 0, fail: 0 };
    const avg = data.reduce((s, d) => s + (d.ty_le_tuan_thu || 0), 0) / data.length;
    const full = data.filter(d => (d.ty_le_tuan_thu || 0) === 100).length;
    return { total: data.length, avg, full, fail: data.length - full };
  }, [data]);

  const trendData = useMemo(() => {
    const map: Record<string, { date: string; sum: number; count: number }> = {};
    data.slice(-20).forEach(d => {
      const key = new Date(d.ngay_kiem_tra).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, sum: 0, count: 0 };
      map[key].sum += d.ty_le_tuan_thu || 0;
      map[key].count++;
    });
    return Object.values(map).map(r => ({ date: r.date, avg: Number((r.sum / r.count).toFixed(1)) }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Ambulance />} label="Tổng lượt giám sát" value={stats.total} color="blue" />
        <StatCard icon={<HeartPulse />} label="Tuân thủ TB (%)" value={`${stats.avg.toFixed(1)}%`} color="green" />
        <StatCard icon={<CheckCircle2 />} label="Lượt kíp hoàn hảo" value={stats.full} color="green" />
        <StatCard icon={<AlertTriangle />} label="Lượt kíp có lỗi" value={stats.fail} color="red" />
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-80">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-[#009900]" /> Biểu đồ xu hướng chất lượng cấp cứu</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip />
            <Bar dataKey="avg" fill="#009900" opacity={0.6} radius={[4, 4, 0, 0]} name="Chất lượng TB" />
            <Line type="monotone" dataKey="avg" stroke="#009900" strokeWidth={3} dot={{ r: 4 }} name="Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CapCuuList = ({ data, onView, onEdit, onDelete, onAdd }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: any) => d.don_vi_duoc_kiem_tra.toLowerCase().includes(search.toLowerCase()) || d.nguoi_kiem_tra.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onAdd} className="bg-[#009900] hover:bg-green-700 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"><Plus size={18}/> Thêm phiếu mới</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm khoa, người giám sát..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr><th>Ngày/Giờ kiểm tra</th><th>Khoa/Đơn vị</th><th>Người giám sát</th><th className="text-center">Tỷ lệ đạt</th><th className="text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="p-4 text-table font-normal text-slate-600">{formatDateTime(d.ngay_kiem_tra)}</td>
                <td className="p-4 text-table font-normal text-slate-800 uppercase">{d.don_vi_duoc_kiem_tra}</td>
                <td className="p-4 text-sm text-slate-400 font-normal">{d.nguoi_kiem_tra}</td>
                <td className={`p-4 text-center font-bold text-lg ${d.ty_le_tuan_thu === 100 ? 'text-[#009900]' : 'text-amber-600'}`}>{d.ty_le_tuan_thu}%</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => onView(d)} className="p-2 text-[#009900] hover:bg-green-50 rounded-xl"><Eye size={16} /></button>
                  <button onClick={() => onEdit(d)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 size={16} /></button>
                  <button onClick={() => onDelete(d.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic text-sm">Không tìm thấy dữ liệu cấp cứu.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CapCuuForm = ({ item, currentUser, deptList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item, ngay_kiem_tra: toLocalISO(new Date(item.ngay_kiem_tra)) } : defaultFormCapCuu(currentUser?.full_name || ''));
  const [saving, setSaving] = useState(false);

  const setField = (key: string, val: any) => {
    setForm((p: any) => {
      const updated = { ...p, [key]: val };
      const s = calcStatsCapCuu(updated);
      return { ...updated, ...s };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.don_vi_duoc_kiem_tra) { alert('Vui lòng nhập đơn vị được kiểm tra'); return; }
    setSaving(true);
    try {
      const dataToSave = { ...form, ngay_kiem_tra: new Date(form.ngay_kiem_tra).toISOString() };
      if (item?.id) await updateGsCapCuu(item.id, dataToSave);
      else await addGsCapCuu(dataToSave);
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
      <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-green-50/50">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#009900] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200"><Zap size={22} /></div>
           <div><h2 className="text-main-title font-bold text-slate-800 uppercase">Giám sát Công tác cấp cứu</h2><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Theo quy trình xử trí và sẵn sàng cấp cứu (13 tiêu chí)</p></div>
         </div>
         <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-[28px] border border-slate-100">
           <div className="space-y-1 md:col-span-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ngày</label>
             <input type="date" value={form.ngay_kiem_tra.split('T')[0]} onChange={e => { const timePart = form.ngay_kiem_tra.split('T')[1]; setField('ngay_kiem_tra', `${e.target.value}T${timePart}`); }} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-green-200" />
           </div>
           <div className="space-y-1 md:col-span-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Giờ (24h)</label>
             <input type="text" placeholder="HH:mm" value={form.ngay_kiem_tra.split('T')[1].substring(0, 5)} onChange={e => { const val = e.target.value; const datePart = form.ngay_kiem_tra.split('T')[0]; setField('ngay_kiem_tra', `${datePart}T${val}`); }} onBlur={e => { let val = e.target.value; if (!/^\d{1,2}:\d{2}$/.test(val)) return; const [h, m] = val.split(':'); const formattedH = h.padStart(2, '0'); const formattedM = m.padStart(2, '0'); const datePart = form.ngay_kiem_tra.split('T')[0]; setField('ngay_kiem_tra', `${datePart}T${formattedH}:${formattedM}`); }} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-green-200" />
           </div>
           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Khoa được giám sát</label><input list="cap-cuu-dv-list" value={form.don_vi_duoc_kiem_tra} onChange={e => setField('don_vi_duoc_kiem_tra', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-green-200" /><datalist id="cap-cuu-dv-list">{deptList.map((d: any) => <option key={d.id} value={`${d.ten_don_vi}`} />)}</datalist></div>
           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Người giám sát</label><input value={form.nguoi_kiem_tra} onChange={e => setField('nguoi_kiem_tra', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-green-200" /></div>
        </div>

        <div className="space-y-6">
          {SECTIONS_CAP_CUU.map((section, sIdx) => (
            <div key={sIdx} className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
               <div className="bg-[#009900] text-white px-5 py-3"><h3 className="text-[10px] font-black uppercase tracking-widest">{section.title}</h3></div>
               <div className="divide-y divide-slate-50">
                 {section.criteria.map((c, cIdx) => {
                   const isPass = form[c.id] !== false;
                   const noteKey = `${c.id}_ghi_chu`;
                   return (
                     <div key={c.id} className={`p-4 space-y-3 ${!isPass ? 'bg-amber-50/20' : ''}`}>
                        <div className="flex items-start gap-4">
                           <span className="text-[10px] font-black text-slate-400 mt-1">{cIdx + 1}</span>
                           <p className="flex-1 text-sm font-bold text-slate-700">{c.label}</p>
                           <DatKhongDatToggle value={isPass} onChange={v => setField(c.id, v)} />
                        </div>
                        {!isPass && (
                          <div className="ml-8"><input value={form[noteKey] || ''} onChange={e => setField(noteKey, e.target.value)} placeholder="Mô tả lỗi hoặc lý do không đạt..." className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none" /></div>
                        )}
                     </div>
                   );
                 })}
               </div>
            </div>
          ))}
        </div>

        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hình ảnh minh chứng</label><ImageUploaderCapCuu images={form.hinh_anh_minh_chung || []} onChange={urls => setField('hinh_anh_minh_chung', urls)} /></div>
        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kết luận & Kiến nghị chung</label><textarea rows={3} value={form.ket_luan_chung} onChange={e => setField('ket_luan_chung', e.target.value)} placeholder="Tóm tắt tình hình xử trí cấp cứu và các đề xuất khắc phục..." className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-green-200 shadow-inner bg-slate-50/30" /></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
           <div className="flex items-center gap-6">
              <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tỷ lệ tuân thủ</p><p className={`text-3xl font-black ${form.ty_le_tuan_thu === 100 ? 'text-[#009900]' : 'text-amber-600'}`}>{form.ty_le_tuan_thu}%</p></div>
              <div className="h-10 w-px bg-slate-100"/>
              <p className="text-sm font-bold text-slate-600 italic">Đạt được <b>{form.tong_dat}</b> trong tổng số 13 tiêu chuẩn.</p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button type="button" onClick={onClose} className="flex-1 px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest">Đóng</button>
              <button type="submit" disabled={saving} className="flex-1 px-12 py-3.5 bg-[#009900] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-green-100 disabled:opacity-50">{saving ? 'Đang xử lý...' : 'Lưu kết quả'}</button>
           </div>
        </div>
      </form>
    </div>
  );
};

const CapCuuDetail = ({ item, onClose, onEdit }: any) => {
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#009900]"/>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center no-print outline-none">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest"><RotateCcw size={14}/> Quay về danh sách</button>
          <div className="flex gap-3">
             <button onClick={onEdit} className="px-6 py-3 bg-[#009900] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-green-100">Chỉnh sửa</button>
          </div>
        </div>

        <div className="text-center space-y-2">
           <h1 className="text-main-title font-bold text-slate-900 uppercase leading-tight">BẢNG KIỂM GIÁM SÁT CÔNG TÁC CẤP CỨU</h1>
           <p className="text-sm font-bold text-slate-600">(Áp dụng định kỳ cho các khoa chuyên môn và Ban trực chuyên môn)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-dashed border-slate-200 text-sm font-bold uppercase tracking-tight">
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khoa/Đơn vị giám sát</p><p className="text-slate-900 border-l-2 border-[#009900] pl-2">{item.don_vi_duoc_kiem_tra}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cán bộ giám sát</p><p className="text-slate-900 border-l-2 border-[#009900] pl-2">{item.nguoi_kiem_tra}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày/Giờ thực hiện</p><p className="text-slate-900 border-l-2 border-[#009900] pl-2">{formatDateTime(item.ngay_kiem_tra)}</p></div>
        </div>

        <div className="space-y-4">
           <table className="w-full border-collapse border-4 border-slate-900 text-table">
              <thead className="bg-[#f0f0f0] text-slate-900 font-bold uppercase text-center text-table">
                 <tr><th className="p-3 border-2 border-slate-900 w-10">STT</th><th className="p-3 border-2 border-slate-900 text-left">Nội dung giám sát (Tiêu chuẩn quy chuẩn)</th><th className="p-3 border-2 border-slate-900 w-20">Đạt</th><th className="p-3 border-2 border-slate-900 w-20 text-red-600">K.Đạt</th><th className="p-3 border-2 border-slate-900">Ghi chú lỗi cụ thể</th></tr>
              </thead>
              <tbody>
                {SECTIONS_CAP_CUU.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <tr className="bg-slate-100"><td colSpan={5} className="p-2 border-2 border-slate-900 font-bold text-[#009900] uppercase tracking-tighter text-table">{section.title}</td></tr>
                    {section.criteria.map((c, cIdx) => (
                      <tr key={c.id}>
                        <td className="p-3 border-2 border-slate-900 text-center font-normal">{cIdx + 1}</td>
                        <td className="p-3 border-2 border-slate-900 text-slate-800 leading-snug font-normal">{c.label}</td>
                        <td className="p-3 border-2 border-slate-900 text-center font-normal">{item[c.id] && <Check size={20} className="text-[#009900] mx-auto" />}</td>
                        <td className="p-3 border-2 border-slate-900 text-center font-normal">{!item[c.id] && <X size={20} className="text-red-500 mx-auto" />}</td>
                        <td className="p-3 border-2 border-slate-900 italic text-red-500 text-sm font-normal">{item[`${c.id}_ghi_chu`]}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                  <tr className="bg-slate-900 text-white font-black text-[12pt]">
                    <td colSpan={2} className="p-3 border-2 border-slate-900 uppercase text-right tracking-widest">KẾT QUẢ TUÂN THỦ</td>
                    <td colSpan={2} className="p-3 border-2 border-slate-900 text-center text-xl">{item.tong_dat}/13</td>
                    <td className="p-3 border-2 border-slate-900 text-amber-400 text-center text-xl">{item.ty_le_tuan_thu}%</td>
                  </tr>
              </tbody>
           </table>
        </div>

        {item.ket_luan_chung && <div className="space-y-2"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Nhận xét & Kết luận chính:</h3><div className="p-6 bg-slate-50 border-r-4 border-[#009900] text-[12pt] italic text-slate-700 leading-relaxed font-black whitespace-pre-wrap">{item.ket_luan_chung}</div></div>}

        {item.hinh_anh_minh_chung?.length > 0 && (
           <div className="space-y-4 no-print border-t pt-6"><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Camera size={16}/> Hình ảnh minh chứng hiện trường</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{item.hinh_anh_minh_chung.map((u: string, i: number) => <div key={i} className="aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl shadow-slate-100"><img src={u} className="w-full h-full object-cover" alt=""/></div>)}</div></div>
        )}

        <div className="flex justify-between pt-12 items-start h-64 no-print-mt-20">
           <div className="text-center flex-1 space-y-16">
             <p className="text-xs font-black uppercase tracking-widest text-slate-800 underline decoration-2 underline-offset-8">Trưởng đơn vị được giám sát</p>
             <div className="text-slate-200">..................................</div>
           </div>
           <div className="text-center flex-1 space-y-16">
             <p className="text-xs font-black uppercase tracking-widest text-slate-800 underline decoration-2 underline-offset-8">Cán bộ thực hiện giám sát</p>
             <p className="text-sm font-black uppercase text-slate-900">{item.nguoi_kiem_tra}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export const EmergencyMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LIST' | 'SUMMARY'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [data, setData] = useState<GiamSatCapCuu[]>([]);
  const [editingItem, setEditingItem] = useState<GiamSatCapCuu | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({ type: 'all', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rs, dv] = await Promise.all([fetchGsCapCuu(), fetchDmDonVi()]);
      setData(rs || []); setDeptList(dv || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const matchedDate = isDateInRange(item.ngay_kiem_tra, range);
      const matchedDept = !deptFilter || item.don_vi_duoc_kiem_tra === deptFilter;
      return matchedDate && matchedDept;
    });
  }, [data, dateFilter, deptFilter]);

  return (
    <div className="bg-white min-h-[calc(100vh-6rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <div className="flex bg-slate-50 p-1.5 gap-1 rounded-[28px] border border-slate-100 shrink-0 shadow-inner">
             <TabButton active={activeTab === 'OVERVIEW'} onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} icon={LayoutDashboard} label="Tổng quan" />
             <TabButton active={activeTab === 'LIST'} onClick={() => { setActiveTab('LIST'); setViewMode('LIST'); }} icon={List} label="Danh sách giám sát" />
             <TabButton active={activeTab === 'SUMMARY'} onClick={() => { setActiveTab('SUMMARY'); setViewMode('LIST'); }} icon={BarChart3} label="Báo cáo tổng hợp" />
           </div>
           
           {viewMode === 'LIST' && (
             <div className="flex flex-wrap items-center gap-3">
               <DateRangeFilter filter={dateFilter} onChange={setDateFilter} className="shrink-0" />
               <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-rose-500">
                 <option value="">Tất cả các khoa</option>
                 {deptList.map((d: any) => <option key={d.id} value={d.ten_don_vi}>{d.ten_don_vi}</option>)}
               </select>
             </div>
           )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#009900]" size={32} /></div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {activeTab === 'OVERVIEW' ? <CapCuuOverview data={filteredData} />
            : activeTab === 'SUMMARY' ? <CapCuuErrorSummary data={filteredData} />
            : viewMode === 'LIST' ? <CapCuuList data={filteredData} onAdd={() => { setEditingItem(null); setViewMode('FORM'); }} onView={(i: any) => { setEditingItem(i); setViewMode('DETAIL'); }} onEdit={(i: any) => { setEditingItem(i); setViewMode('FORM'); }} onDelete={async (id: string) => { if (window.confirm('Xóa kết quả giám sát này?')) { await deleteGsCapCuu(id); loadData(); } }} />
            : viewMode === 'FORM' ? <CapCuuForm item={editingItem} currentUser={user} deptList={deptList} onSaved={() => { setViewMode('LIST'); loadData(); }} onClose={() => setViewMode('LIST')} />
            : <CapCuuDetail item={editingItem} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyMonitoringModule;
