import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera, ImageIcon,
  LayoutGrid, CheckCircle2, TrendingUp, Building2, User, Calendar,
  ChevronDown, ChevronUp, Star, AlertTriangle, Award, ThumbsUp
} from 'lucide-react';
import { fetchGs5s, addGs5s, updateGs5s, deleteGs5s, upload5sImage, GiamSat5s } from '../readGs5s';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';

// ─── CRITERIA DEFINITION ─────────────────────────────────────────────────────
export const CRITERIA_5S = [
  { id: 'tc1', section: 'I', label: 'Loại bỏ vật dụng không cần thiết, thiết bị hỏng, rác thải tại nơi làm việc (bàn làm việc, tủ hồ sơ).', max: 10 },
  { id: 'tc2', section: 'I', label: 'Không có rác thải, tài liệu cũ lỗi thời tại bàn làm việc/tủ tài liệu.', max: 10 },
  { id: 'tc3', section: 'I', label: 'Không có thuốc, vật tư y tế hết hạn sử dụng hoặc bao bì hư hỏng trong tủ trực.', max: 10 },
  { id: 'tc4', section: 'II', label: 'Mọi thứ có vị trí cố định, có nhãn tên rõ ràng (tủ thuốc, xe tiêm, kệ hồ sơ).', max: 5 },
  { id: 'tc5', section: 'II', label: 'Có nhãn tên, vạch kẻ ranh giới hoặc mã màu nhận diện cho các khu vực/vật dụng.', max: 5 },
  { id: 'tc6', section: 'II', label: 'Áp dụng nguyên tắc "Dễ thấy - Dễ lấy - Dễ kiểm tra" (Vật dụng hay dùng để gần, ít dùng để xa).', max: 5 },
  { id: 'tc7', section: 'II', label: 'Các phương tiện cấp cứu (xe tiêm, máy sốc tim) ở vị trí quy định, không bị vật cản.', max: 5 },
  { id: 'tc8', section: 'III', label: 'Sàn nhà, tường, trần, cửa sổ, thiết bị máy móc sạch bụi bẩn, mạng nhện, không vết ố.', max: 10 },
  { id: 'tc9', section: 'III', label: 'Thùng rác sạch, có nắp đậy, phân loại rác đúng quy định kiểm soát nhiễm khuẩn.', max: 10 },
  { id: 'tc10', section: 'IV', label: 'Duy trì nề nếp sạch sẽ hàng ngày; có phân công trách nhiệm 5S cho từng nhân viên/khu vực.', max: 5 },
  { id: 'tc11', section: 'IV', label: 'Có hình ảnh "Trước" và "Sau" khi áp dụng 5S để so sánh và duy trì chuẩn.', max: 5 },
  { id: 'tc12', section: 'IV', label: 'Các biển báo, sơ đồ, bảng phân công được cập nhật mới, không rách nát, cũ bẩn.', max: 5 },
  { id: 'tc13', section: 'IV', label: 'Trang phục nhân viên y tế chỉnh tề, đúng quy định, đeo thẻ nhân viên.', max: 5 },
  { id: 'tc14', section: 'V', label: 'Nhân viên hiểu rõ ý nghĩa 5S và tự giác thực hiện hàng ngày không cần nhắc nhở.', max: 5 },
  { id: 'tc15', section: 'V', label: 'Có biên bản họp khoa/phòng đánh giá về kết quả 5S tháng trước và hướng cải tiến.', max: 5 },
];

export const SECTIONS_5S = [
  { id: 'I', title: 'SÀNG LỌC (SERI)', maxTotal: 30 },
  { id: 'II', title: 'SẮP XẾP (SEITON)', maxTotal: 20 },
  { id: 'III', title: 'SẠCH SẼ (SEISO)', maxTotal: 20 },
  { id: 'IV', title: 'SĂN SÓC (SEIKETSU)', maxTotal: 20 },
  { id: 'V', title: 'SẴN SÀNG (SHITSUKE)', maxTotal: 10 },
];

export const getPhanLoai = (score: number) => {
  if (score >= 90) return { label: 'Xuất sắc', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
  if (score >= 75) return { label: 'Tốt', color: 'text-[#059669]', bg: 'bg-green-50', border: 'border-green-200' };
  if (score >= 50) return { label: 'Trung bình', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { label: 'Yếu', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
};

const calcTotal = (data: any) =>
  CRITERIA_5S.reduce((sum, c) => sum + (Number(data[`${c.id}_diem`]) || 0), 0);

// ─── DEFAULT FORM ─────────────────────────────────────────────────────────────
const defaultForm = (): any => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: '',
    don_vi_duoc_giam_sat: '',
    khu_vuc_giam_sat: '',
    ghi_chu_chung: '',
  };
  CRITERIA_5S.forEach(c => {
    base[`${c.id}_diem`] = c.max;
    base[`${c.id}_ghi_chu`] = '';
    base[`${c.id}_hinh_anh`] = [];
  });
  base.tong_diem = 100;
  base.phan_loai = 'Xuất sắc';
  return base;
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${active ? 'bg-white text-orange-600 shadow-lg border border-orange-50' : 'text-slate-400 hover:text-slate-600'}`}>
    <Icon size={15} />{label}
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-[#059669]',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white p-3 rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>{React.cloneElement(icon, { size: 18 })}</div>
      <div><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p><h3 className="text-sm font-bold text-slate-800">{value}</h3></div>
    </div>
  );
};

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const FiveSOverview = ({ data }: { data: GiamSat5s[] }) => {
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, avg: 0 };
    const avg = data.reduce((s, d) => s + (d.tong_diem || 0), 0) / data.length;
    return { total: data.length, avg };
  }, [data]);

  const chartData = useMemo(() => {
    const map: Record<string, { date: string; count: number; total: number }> = {};
    data.forEach(d => {
      const key = new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, count: 0, total: 0 };
      map[key].count++;
      map[key].total += d.tong_diem || 0;
    });
    return Object.values(map).map(r => ({ ...r, avg: Number((r.total / r.count).toFixed(1)) }));
  }, [data]);

  const pl = useMemo(() => {
    const counts = { 'Xuất sắc': 0, 'Tốt': 0, 'Trung bình': 0, 'Yếu': 0 };
    data.forEach(d => { const k = d.phan_loai || ''; if (k in counts) counts[k as keyof typeof counts]++; });
    return counts;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<LayoutGrid />} label="Tổng lượt" value={stats.total} color="orange" />
        <StatCard icon={<Star />} label="Điểm TB" value={`${stats.avg.toFixed(1)}/100`} color="green" />
        <StatCard icon={<Award />} label="Xuất sắc/Tốt" value={pl['Xuất sắc'] + pl['Tốt']} color="indigo" />
        <StatCard icon={<AlertTriangle />} label="TB/Yếu" value={pl['Trung bình'] + pl['Yếu']} color="amber" />
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-72">
        <h3 className="text-main-title font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-orange-500" /> Xu hướng điểm TB</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip />
            <Bar dataKey="avg" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.8} name="Điểm TB" />
            <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} dot={false} name="Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── LIST ─────────────────────────────────────────────────────────────────────
const FiveSList = ({ data, onView, onEdit, onDelete, onAdd }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: GiamSat5s) =>
    d.don_vi_duoc_giam_sat.toLowerCase().includes(search.toLowerCase()) ||
    d.nguoi_giam_sat.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <button onClick={onAdd} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-2xl text-[11px] font-bold uppercase shadow-lg shadow-orange-100 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"><Plus size={18}/> Thêm phiếu giám sát</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm đơn vị, người GS..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10" />
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="table-standardized">
          <thead className="bg-[#059669] text-white">
            <tr>
              <th className="p-5">Ngày</th><th className="p-5">Đơn vị</th><th className="p-5">Khu vực</th>
              <th className="p-5 text-center">Điểm</th><th className="p-5 text-center">Phân loại</th><th className="p-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((d: GiamSat5s) => {
              const pl = getPhanLoai(d.tong_diem || 0);
              return (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td data-label="Ngày" className="p-5 text-sm font-bold text-slate-700">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                  <td data-label="Đơn vị" className="p-5 text-sm text-slate-600 font-bold">{d.don_vi_duoc_giam_sat}</td>
                  <td data-label="Khu vực" className="p-5 text-xs text-slate-400">{d.khu_vuc_giam_sat || '---'}</td>
                  <td data-label="Điểm" className="p-5 text-center text-lg font-black text-slate-800">{d.tong_diem}<span className="text-xs text-slate-400">/100</span></td>
                  <td data-label="Phân loại" className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${pl.bg} ${pl.color} border ${pl.border}`}>{pl.label}</span></td>
                  <td data-label="Thao tác" className="p-5 flex justify-end gap-2">
                    <button onClick={() => onView(d)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"><Eye size={16} /></button>
                    <button onClick={() => onEdit(d)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((d: GiamSat5s) => {
          const pl = getPhanLoai(d.tong_diem || 0);
          return (
            <div key={d.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</p>
                  <h4 className="text-sm font-black text-slate-800 uppercase">{d.don_vi_duoc_giam_sat}</h4>
                  <p className="text-[10px] text-slate-400">{d.khu_vuc_giam_sat || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-800">{d.tong_diem}</p>
                  <span className={`text-[10px] font-black ${pl.color}`}>{pl.label}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onView(d)} className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100">Xem</button>
                <button onClick={() => onEdit(d)} className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">Sửa</button>
                <button onClick={() => onDelete(d.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
      {!filtered.length && <div className="p-12 text-center text-slate-400 text-sm font-bold italic">Không có dữ liệu</div>}
    </div>
  );
};

// ─── REPORT ───────────────────────────────────────────────────────────────────
const FiveSReport = ({ data }: { data: GiamSat5s[] }) => {
  const rows = useMemo(() => {
    const g: Record<string, any> = {};
    data.forEach(d => {
      const k = d.don_vi_duoc_giam_sat;
      if (!g[k]) g[k] = { dept: k, count: 0, total: 0 };
      g[k].count++; g[k].total += d.tong_diem || 0;
    });
    return Object.values(g).map(r => ({ ...r, avg: (r.total / r.count).toFixed(1) })).sort((a: any, b: any) => b.avg - a.avg);
  }, [data]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-orange-500 text-white text-table font-bold uppercase tracking-widest">
          <tr><th className="p-5">Đơn vị</th><th className="p-5 text-center">Số lượt</th><th className="p-5 text-center">Điểm TB</th><th className="p-5 text-center">Phân loại</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((r: any) => {
            const pl = getPhanLoai(Number(r.avg));
            return (
              <tr key={r.dept} className="hover:bg-slate-50 text-[12pt]">
                <td className="p-5 font-bold text-slate-700">{r.dept}</td>
                <td className="p-5 text-center text-slate-600 font-bold">{r.count}</td>
                <td className="p-5 text-center font-black text-slate-800">{r.avg}</td>
                <td className="p-5 text-center"><span className={`px-3 py-1 rounded-full text-[10pt] font-black uppercase ${pl.bg} ${pl.color}`}>{pl.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── IMAGE UPLOADER ───────────────────────────────────────────────────────────
const ImageUploader = ({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => upload5sImage(f)));
      onChange([...images, ...urls]);
    } catch { alert('Lỗi tải ảnh'); }
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
      <label className={`w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-orange-400 hover:text-orange-500 transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
        <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        <span className="text-[7px] font-black mt-0.5">{uploading ? 'Tải...' : 'Thêm'}</span>
      </label>
    </div>
  );
};

// ─── FORM ─────────────────────────────────────────────────────────────────────
const FiveSFormView = ({ item, onClose, onSaved, currentUser, departmentList }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item } : { ...defaultForm(), nguoi_giam_sat: currentUser?.full_name || '' });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ I: true, II: true, III: true, IV: true, V: true });

  useEffect(() => {
    const total = calcTotal(form);
    const pl = getPhanLoai(total);
    setForm((p: any) => ({ ...p, tong_diem: total, phan_loai: pl.label }));
  }, [...CRITERIA_5S.map(c => form[`${c.id}_diem`])]);

  const setField = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.don_vi_duoc_giam_sat) { alert('Vui lòng chọn đơn vị được giám sát'); return; }
    setSaving(true);
    try {
      if (item?.id) await updateGs5s(item.id, form);
      else await addGs5s(form);
      onSaved();
    } catch (err: any) { alert('Lỗi lưu: ' + err.message); }
    finally { setSaving(false); }
  };

  const pl = getPhanLoai(form.tong_diem || 0);

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
      <div className="p-7 border-b border-slate-100 bg-orange-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><LayoutGrid size={22} /></div>
          <div>
            <h2 className="text-main-title font-bold text-slate-800 uppercase">{item?.id ? 'Sửa' : 'Thêm'} Giám sát 5S</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sàng lọc · Sắp xếp · Sạch sẽ · Săn sóc · Sẵn sàng</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-7 space-y-7">
        {/* Thông tin chung */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 bg-slate-50/50 p-5 rounded-[28px] border border-slate-100">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={11} className="text-orange-400" /> Ngày giám sát</label>
            <input type="date" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><User size={11} className="text-orange-400" /> Người giám sát</label>
            <input value={form.nguoi_giam_sat} onChange={e => setField('nguoi_giam_sat', e.target.value)} placeholder="Họ tên người GS" required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building2 size={11} className="text-orange-400" /> Đơn vị được GS</label>
            <input list="don-vi-list" value={form.don_vi_duoc_giam_sat} onChange={e => setField('don_vi_duoc_giam_sat', e.target.value)} placeholder="Chọn hoặc nhập đơn vị" required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10" />
            <datalist id="don-vi-list">{departmentList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><LayoutGrid size={11} className="text-orange-400" /> Khu vực GS</label>
            <input value={form.khu_vuc_giam_sat} onChange={e => setField('khu_vuc_giam_sat', e.target.value)} placeholder="VD: Phòng điều trị A" className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10" />
          </div>
        </div>

        {/* Nội dung đánh giá theo từng mục */}
        {SECTIONS_5S.map(section => {
          const criteria = CRITERIA_5S.filter(c => c.section === section.id);
          const sectionTotal = criteria.reduce((s, c) => s + (Number(form[`${c.id}_diem`]) || 0), 0);
          const sectionMax = section.maxTotal;
          const isOpen = expanded[section.id];
          return (
            <div key={section.id} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
              <button type="button" onClick={() => setExpanded(p => ({ ...p, [section.id]: !p[section.id] }))}
                className="w-full flex items-center justify-between p-4 bg-orange-50/60 hover:bg-orange-50 transition-all">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center text-xs font-black">{section.id}</span>
                  <span className="text-sm font-black text-slate-800 uppercase">{section.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-black ${sectionTotal === sectionMax ? 'text-[#059669]' : sectionTotal >= sectionMax * 0.75 ? 'text-amber-600' : 'text-rose-500'}`}>{sectionTotal}/{sectionMax}</span>
                  {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>
              {isOpen && (
                <div className="divide-y divide-slate-50">
                  {criteria.map((c, idx) => (
                    <div key={c.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                        <p className="text-sm font-bold text-slate-700 flex-1 leading-snug">{c.label}</p>
                      </div>
                      <div className="ml-0 sm:ml-9 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Điểm đạt</span>
                        <div className="shrink-0 flex items-center gap-2">
                          <input
                            type="number" min={0} max={c.max}
                            value={form[`${c.id}_diem`]}
                            onChange={e => setField(`${c.id}_diem`, Math.min(c.max, Math.max(0, Number(e.target.value))))}
                            className="w-16 p-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-center text-orange-600 outline-none focus:ring-2 focus:ring-orange-300"
                          />
                          <span className="text-[11px] text-slate-400 font-black">/ {c.max}</span>
                        </div>
                      </div>
                      <div className="ml-0 sm:ml-9 space-y-2">
                        <input
                          value={form[`${c.id}_ghi_chu`] || ''}
                          onChange={e => setField(`${c.id}_ghi_chu`, e.target.value)}
                          placeholder="Ghi chú / Minh chứng / Lỗi vi phạm..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all"
                        />
                        <ImageUploader
                          images={form[`${c.id}_hinh_anh`] || []}
                          onChange={urls => setField(`${c.id}_hinh_anh`, urls)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Ghi chú chung */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú chung</label>
          <textarea value={form.ghi_chu_chung} onChange={e => setField('ghi_chu_chung', e.target.value)} rows={2} placeholder="Nhận xét tổng quát..." className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 resize-none" />
        </div>

        {/* Tổng điểm & nút lưu */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 pt-6 border-t border-slate-100">
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng điểm</p>
              <p className="text-3xl font-black text-slate-900">{form.tong_diem}<span className="text-sm text-slate-400">/100</span></p>
            </div>
            <span className={`px-5 py-2 rounded-2xl text-sm font-black uppercase border ${pl.bg} ${pl.color} ${pl.border}`}>{pl.label}</span>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 md:flex-none px-12 py-3.5 bg-orange-500 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-orange-200 disabled:opacity-50 hover:bg-orange-600 transition-all active:scale-95">
              {saving ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── DETAIL ───────────────────────────────────────────────────────────────────
const FiveSDetailView = ({ item, currentUser, onClose, onEdit, onDelete }: any) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Quản trị viên';
  const isCreator = item.nguoi_giam_sat === currentUser?.full_name;
  const pl = getPhanLoai(item.tong_diem || 0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center no-print">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black uppercase text-[10px]"><X size={18} /> Đóng</button>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-slate-200"><FileText size={15} /> In phiếu</button>
            {(isAdmin || isCreator) && <button onClick={onEdit} className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 active:scale-95"><Edit2 size={15} /> Sửa</button>}
            {isAdmin && <button onClick={onDelete} className="bg-white border border-rose-200 text-rose-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-50"><Trash2 size={15} /></button>}
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-main-title font-bold text-slate-900 uppercase tracking-tight">BẢNG KIỂM GIÁM SÁT 5S</h1>
          <p className="text-slate-500 italic text-xs">(Sàng lọc · Sắp xếp · Sạch sẽ · Săn sóc · Sẵn sàng)</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b-2 border-dashed border-slate-300">
          {[
            { label: 'Đơn vị được GS', value: item.don_vi_duoc_giam_sat, upper: true },
            { label: 'Ngày giám sát', value: new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN') },
            { label: 'Người giám sát', value: item.nguoi_giam_sat, upper: true },
            { label: 'Khu vực', value: item.khu_vuc_giam_sat || '---' },
          ].map(f => (
            <div key={f.label} className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{f.label}</span>
              <span className={`text-sm font-black text-slate-800 border-b border-dotted border-slate-300 pb-1 ${f.upper ? 'uppercase' : ''}`}>{f.value}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-2 border-slate-800 border-collapse text-[12pt]">
            <thead>
              <tr className="bg-slate-100 text-[12pt] font-black uppercase text-slate-800 text-center">
                <th className="p-3 border-2 border-slate-800 w-10">STT</th>
                <th className="p-3 border-2 border-slate-800 text-left">Nội dung đánh giá (Theo 5 tiêu chuẩn 5S)</th>
                <th className="p-3 border-2 border-slate-800 w-20">Điểm tối đa</th>
                <th className="p-3 border-2 border-slate-800 w-20">Điểm thực tế</th>
                <th className="p-3 border-2 border-slate-800 min-w-[140px]">Ghi chú / Minh chứng / Lỗi vi phạm</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS_5S.map(section => {
                const criteria = CRITERIA_5S.filter(c => c.section === section.id);
                const sectionActual = criteria.reduce((s, c) => s + (Number(item[`${c.id}_diem`]) || 0), 0);
                return (
                  <React.Fragment key={section.id}>
                    <tr className="bg-slate-50 font-black text-slate-900 text-sm">
                      <td className="p-3 border-2 border-slate-800 text-center uppercase">{section.id}</td>
                      <td colSpan={2} className="p-3 border-2 border-slate-800 uppercase bg-orange-50/60">{section.title}</td>
                      <td className="p-3 border-2 border-slate-800 text-center font-black text-orange-600">{sectionActual}/{section.maxTotal}</td>
                      <td className="p-3 border-2 border-slate-800"></td>
                    </tr>
                    {criteria.map((c, idx) => (
                      <tr key={c.id} className="text-xs hover:bg-slate-50/50">
                        <td className="p-3 border-2 border-slate-800 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 border-2 border-slate-800 font-bold text-slate-700 leading-snug">{c.label}</td>
                        <td className="p-3 border-2 border-slate-800 text-center font-black text-slate-500">{c.max}</td>
                        <td className={`p-3 border-2 border-slate-800 text-center font-black text-lg ${Number(item[`${c.id}_diem`]) === c.max ? 'text-[#059669]' : Number(item[`${c.id}_diem`]) >= c.max * 0.5 ? 'text-amber-600' : 'text-rose-500'}`}>
                          {item[`${c.id}_diem`] ?? c.max}
                        </td>
                        <td className="p-3 border-2 border-slate-800 text-rose-600 font-bold italic text-xs leading-tight">
                          {item[`${c.id}_ghi_chu`] || ''}
                          {item[`${c.id}_hinh_anh`]?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 no-print">
                              {item[`${c.id}_hinh_anh`].map((url: string, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPreviewImage(url)}
                                  className="group relative w-14 h-14 md:w-10 md:h-10 overflow-hidden rounded-lg border border-slate-200 bg-white"
                                  aria-label={`Xem ảnh minh chứng ${i + 1}`}
                                >
                                  <img src={url} alt={`Ảnh minh chứng ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              <tr className="bg-slate-900 text-white font-black">
                <td className="p-3 border-2 border-slate-800 text-center"></td>
                <td className="p-3 border-2 border-slate-800 uppercase">TỔNG ĐIỂM (100 ĐIỂM)</td>
                <td className="p-3 border-2 border-slate-800 text-center text-lg">100</td>
                <td className="p-3 border-2 border-slate-800 text-center text-xl text-orange-400">{item.tong_diem}</td>
                <td className="p-3 border-2 border-slate-800"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Phân loại */}
        <div className={`p-5 rounded-[20px] border-2 ${pl.border} ${pl.bg}`}>
          <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Phân loại kết quả đánh giá</p>
          <div className={`text-xl font-black ${pl.color} mb-1`}>{item.phan_loai || pl.label} — {item.tong_diem}/100 điểm</div>
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>• <b>90-100 điểm: Xuất sắc</b> — Duy trì và phát huy.</p>
            <p>• <b>75-89 điểm: Tốt</b> — Tiếp tục hoàn thiện, nhắc nhở các lỗi nhỏ.</p>
            <p>• <b>50-74 điểm: Trung bình</b> — Cần chấn chỉnh và đào tạo lại; yêu cầu khắc phục trong 1 tuần.</p>
            <p>• <b>Dưới 50 điểm: Yếu</b> — Lập biên bản, yêu cầu trưởng khoa giải trình và lập kế hoạch cải tiến ngay.</p>
          </div>
        </div>

        {item.ghi_chu_chung && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ghi chú chung</p>
            <p className="text-sm text-slate-700">{item.ghi_chu_chung}</p>
          </div>
        )}

        <div className="flex justify-between pt-4 gap-8">
          <div className="text-center flex-1 space-y-16">
            <p className="text-sm font-bold text-slate-800">ĐẠI DIỆN KHOA ĐƯỢC GIÁM SÁT</p>
            <p className="text-xs text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="text-center flex-1 space-y-16">
            <p className="text-sm font-bold text-slate-800 uppercase">Người giám sát</p>
            <p className="text-sm font-black text-slate-900 uppercase underline">{item.nguoi_giam_sat}</p>
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-3 md:p-8 no-print"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh minh chứng đầy đủ"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
            aria-label="Đóng ảnh"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="Ảnh minh chứng đầy đủ"
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            onClick={event => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export const FiveSMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH' | 'REPORT'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [data, setData] = useState<GiamSat5s[]>([]);
  const [editingItem, setEditingItem] = useState<GiamSat5s | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [filterConfig, setFilterConfig] = useState({ type: 'thisMonth', startDate: '', endDate: '', department: 'Tất cả' });

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [d, dv] = await Promise.all([fetchGs5s(), fetchDmDonVi()]);
      setData(d || []); setDepartmentList(dv || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      const range = getDateRange(filterConfig.type, filterConfig.startDate, filterConfig.endDate);
      const passTime = isDateInRange(d.ngay_giam_sat, range);
      const passDept = filterConfig.department === 'Tất cả' || d.don_vi_duoc_giam_sat === filterConfig.department;
      return passTime && passDept;
    });
  }, [data, filterConfig]);

  const deptList = useMemo(() => [...new Set(data.map(d => d.don_vi_duoc_giam_sat))].sort(), [data]);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        {/* Tabs & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-slate-100/50 p-1.5 gap-1 rounded-[28px] border border-slate-200/50 shrink-0">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} icon={LayoutDashboard} label="Tổng quan" />
            <TabButton active={activeTab === 'DANH_SACH'} onClick={() => { setActiveTab('DANH_SACH'); setViewMode('LIST'); }} icon={List} label="Danh sách" />
            <TabButton active={activeTab === 'REPORT'} onClick={() => { setActiveTab('REPORT'); setViewMode('LIST'); }} icon={BarChart3} label="Tổng hợp" />
          </div>
          {activeTab !== 'DANH_SACH' && viewMode === 'LIST' && (
            <button onClick={() => { setEditingItem(null); setActiveTab('DANH_SACH'); setViewMode('FORM'); }} className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#059669] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-green-200 transition-all hover:bg-[#0d6e39] active:scale-95">
              <Plus size={18} /> Thêm giám sát mới
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="p-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
               <DateRangeFilter filter={filterConfig} onChange={(f) => setFilterConfig({...filterConfig, ...f})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Đơn vị</label>
              <select value={filterConfig.department} onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none">
                <option value="Tất cả">Tất cả</option>
                {deptList.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-end">
               <button onClick={() => setFilterConfig({ type: 'thisMonth', startDate: '', endDate: '', department: 'Tất cả' })} className="w-full p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-dashed border-slate-300 transition-all text-[10px] font-black uppercase tracking-widest">
                 <RotateCcw size={13} className="inline mr-1" /> Xóa lọc
               </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold">Lỗi: {error}</div>
        ) : activeTab === 'OVERVIEW' ? (
          <FiveSOverview data={filteredData} />
        ) : activeTab === 'REPORT' ? (
          <FiveSReport data={filteredData} />
        ) : viewMode === 'LIST' ? (
          <FiveSList
            data={filteredData}
            onAdd={() => { setEditingItem(null); setViewMode('FORM'); }}
            onView={(item: GiamSat5s) => { setEditingItem(item); setViewMode('DETAIL'); }}
            onEdit={(item: GiamSat5s) => { setEditingItem(item); setViewMode('FORM'); }}
            onDelete={async (id: string) => {
              if (window.confirm('Xóa bản ghi này?')) { await deleteGs5s(id); loadData(); }
            }}
          />
        ) : viewMode === 'DETAIL' && editingItem ? (
          <FiveSDetailView
            item={editingItem}
            currentUser={user}
            onClose={() => setViewMode('LIST')}
            onEdit={() => setViewMode('FORM')}
            onDelete={async () => {
              if (window.confirm('Xóa bản ghi này?')) { await deleteGs5s(editingItem.id!); setViewMode('LIST'); loadData(); }
            }}
          />
        ) : (
          <FiveSFormView
            item={editingItem}
            onClose={() => setViewMode('LIST')}
            onSaved={() => { setViewMode('LIST'); loadData(); }}
            currentUser={user}
            departmentList={departmentList}
          />
        )}
      </div>
    </div>
  );
};

export default FiveSMonitoringModule;
