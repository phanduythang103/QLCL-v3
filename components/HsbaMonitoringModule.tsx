import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera,
  CheckCircle2, XCircle, TrendingUp, Building2, User, Calendar,
  Users, AlertTriangle, CheckSquare, Shield, Activity, ArrowRight, ClipboardList
} from 'lucide-react';
import {
  fetchGiamSatHsba, addGiamSatHsba, updateGiamSatHsba,
  deleteGiamSatHsba, uploadHsbaImage, GiamSatHsba
} from '../readGiamSatHsba';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DateRangeFilter from './DateRangeFilter';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getDateRange, isDateInRange } from '../utils/dateUtils';

// ─── CRITERIA ─────────────────────────────────────────────────────────────────
export const SECTIONS_HSBA = [
  {
    title: 'I. HÀNH CHÍNH VÀ PHÁP LÝ',
    criteria: [
      { id: 'c1', label: 'Thông tin hành chính đầy đủ, chính xác (họ tên, địa chỉ, đối tượng BHYT, người thân...).', note: '' },
      { id: 'c2', label: 'Có đầy đủ chữ ký và ghi rõ họ tên của BS, ĐD tại các vị trí quy định (Bệnh án, Phiếu chăm sóc).', note: '' },
      { id: 'c3', label: 'Có đầy đủ các loại cam đoan: Phẫu thuật/thủ thuật, cam đoan điều trị (nếu có).', note: '' },
    ]
  },
  {
    title: 'II. CHẤT LƯỢNG CHUYÊN MÔN (BÁC SĨ)',
    criteria: [
      { id: 'c4', label: 'Bệnh sử, tiền sử khai thác chi tiết; Khám bệnh toàn thân và bộ phận đầy đủ.', note: '' },
      { id: 'c5', label: 'Chẩn đoán (Sơ bộ/Xác định/Phân biệt) phù hợp với diễn biến lâm sàng và cận lâm sàng.', note: '' },
      { id: 'c6', label: 'Y lệnh thuốc, dịch truyền ghi rõ ràng, đúng giờ; không viết tắt tên thuốc trái quy định.', note: '' },
      { id: 'c7', label: 'Có biên bản hội chẩn đối với các trường hợp bệnh nặng, khó, hoặc phẫu thuật loại đặc biệt.', note: '' },
      { id: 'c8', label: 'Tổng kết bệnh án ghi đầy đủ: Quá trình điều trị, hướng tiếp theo, tình trạng ra viện.', note: '' },
    ]
  },
  {
    title: 'III. CHẤT LƯỢNG CHĂM SÓC (ĐIỀU DƯỠNG)',
    criteria: [
      { id: 'c9', label: 'Phiếu chăm sóc ghi đầy đủ diễn biến người bệnh; thực hiện y lệnh kịp thời, đúng giờ.', note: '' },
      { id: 'c10', label: 'Phiếu theo dõi chức năng sống (Mạch, Nhiệt, HA) được vẽ đúng quy định, không ngắt quãng.', note: '' },
      { id: 'c11', label: 'Phiếu công khai thuốc/vật tư khớp với y lệnh và thực tế sử dụng.', note: '' },
    ]
  },
  {
    title: 'IV. HÌNH THỨC & TÍNH KỊP THỜI',
    criteria: [
      { id: 'c12', label: 'Hồ sơ sạch sẽ, không tẩy xóa; nếu sửa phải gạch chân và ký xác nhận bên cạnh.', note: '' },
      { id: 'c13', label: 'Sắp xếp các loại giấy tờ trong hồ sơ đúng thứ tự quy định của bệnh viện.', note: '' },
      { id: 'c14', label: 'Ghi chép diễn biến hàng ngày đúng quy định (bệnh nặng ghi theo giờ/mức độ).', note: '' },
    ]
  }
];

const ALL_CRITERIA_HSBA = SECTIONS_HSBA.flatMap(s => s.criteria);
const TOTAL_CRITERIA_HSBA = ALL_CRITERIA_HSBA.length;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const calcStats = (form: any) => {
  const dat = ALL_CRITERIA_HSBA.filter(c => form[c.id] !== false).length;
  const ty_le = Math.round((dat / TOTAL_CRITERIA_HSBA) * 100 * 100) / 100;
  return { tong_dat: dat, tong_tieu_chi: TOTAL_CRITERIA_HSBA, ty_le_tuan_thu: ty_le };
};

const defaultFormHsba = (userName = ''): any => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: userName,
    khoa_duoc_giam_sat: '',
    ma_hsba: '',
    nhan_xet: '',
    hinh_anh_minh_chung: [],
    tong_dat: TOTAL_CRITERIA_HSBA,
    tong_tieu_chi: TOTAL_CRITERIA_HSBA,
    ty_le_tuan_thu: 100,
  };
  ALL_CRITERIA_HSBA.forEach((c, i) => {
    base[c.id] = true;
    base[`c${i + 1}_ghi_chu`] = '';
  });
  return base;
};

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border ${active ? 'bg-[#059669] text-white border-[#059669] shadow-lg' : 'bg-white text-[#059669] border-slate-200 hover:bg-slate-50'}`}>
    <Icon size={15} />{label}
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-[#059669]',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
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
    <button type="button" onClick={() => onChange(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${value ? 'bg-[#059669] text-white border-[#059669] shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-green-300'}`}><CheckCircle2 size={12} /> Đạt</button>
    <button type="button" onClick={() => onChange(false)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${!value ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'}`}><XCircle size={12} /> K.Đạt</button>
  </div>
);

const ImageUploaderHsba = ({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadHsbaImage(f)));
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
      <label className={`w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-[#059669] hover:text-[#059669] transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
        <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        <span className="text-[7px] font-black mt-0.5">{uploading ? 'Tải...' : 'Thêm'}</span>
      </label>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const HsbaErrorSummary = ({ data }: { data: GiamSatHsba[] }) => {
  const summary = useMemo(() => {
    const total = data.length;
    if (total === 0) return [];

    const stats = ALL_CRITERIA_HSBA.map((c, idx) => {
      const fieldId = c.id;
      const noteField = `${c.id}_ghi_chu`;
      const recordsWithError = data.filter(d => (d as any)[fieldId] === false);
      const count = recordsWithError.length;
      const depts = Array.from(new Set(recordsWithError.map(d => d.khoa_duoc_giam_sat))).join(', ');

      // Collect unique specific notes if they exist
      const specificNotes = Array.from(new Set(
        recordsWithError
          .map(d => (d as any)[noteField])
          .filter(n => n && n.trim() !== '')
      )).join('; ');

      return {
        label: c.label,
        count,
        rate: ((count / total) * 100).toFixed(1),
        depts,
        notes: specificNotes || '(Không có ghi chú cụ thể)'
      };
    }).filter(s => s.count > 0) // Only show criteria that have at least one error
      .sort((a, b) => b.count - a.count); // Sort by most frequent error

    return stats;
  }, [data]);

  const handleExportExcel = () => {
    if (summary.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const worksheetData = summary.map((s, i) => ({
      'STT': i + 1,
      'Loại lỗi thường gặp (Tiêu chí)': s.label,
      'Số lượng vi phạm': s.count,
      'Tỷ lệ (%)': s.rate + '%',
      'Lỗi cụ thể': s.notes,
      'Khoa liên quan': s.depts
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tong_hop_loi_HSBA");

    // Set column widths
    const wscols = [
      { wch: 5 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 50 }, { wch: 30 }
    ];
    ws['!cols'] = wscols;

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Bao_cao_loi_HSBA_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-main-title font-bold text-slate-900 uppercase">PHIẾU TỔNG HỢP CHỈ SỐ LỖI HỒ SƠ BỆNH ÁN</h2>
        <p className="text-xs text-slate-500 italic">Dùng cho Điều dưỡng trưởng khoa hoặc Ban QLCL báo cáo giao ban.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr>
              <th className="text-left w-1/3">Loại lỗi thường gặp (Tiêu chí vi phạm)</th>
              <th className="text-center w-24">Số lượng hồ sơ vi phạm</th>
              <th className="text-center w-20">Tỷ lệ (%)</th>
              <th className="text-left">Lỗi cụ thể & Khoa liên quan</th>
            </tr>
          </thead>
          <tbody className="font-bold text-slate-700">
            {summary.length > 0 ? summary.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 border-2 border-slate-900 leading-snug">
                  <div className="text-blue-700 mb-1">{s.label}</div>
                </td>
                <td className="p-4 border-2 border-slate-900 text-center text-lg font-black">{s.count}</td>
                <td className="p-4 border-2 border-slate-900 text-center text-lg font-black text-red-600">{s.rate}%</td>
                <td className="p-4 border-2 border-slate-900">
                  <p className="text-slate-900 italic mb-2">Lỗi: {s.notes}</p>
                  <div className="flex items-center gap-1.5 text-[12pt] text-slate-900 font-black uppercase tracking-tight">
                    <Building2 size={16} className="text-blue-700"/> {s.depts || 'N/A'}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400 italic text-lg">Chưa có dữ liệu vi phạm được ghi nhận.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-6 no-print">
         <button onClick={handleExportExcel} className="flex items-center gap-2 bg-[#059669] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-green-700 transition-all">
           <BarChart3 size={16}/> Xuất báo cáo Excel
         </button>
      </div>
    </div>
  );
};

const HsbaOverview = ({ data }: { data: GiamSatHsba[] }) => {
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, avg: 0, full: 0, fail: 0 };
    const avg = data.reduce((s, d) => s + (d.ty_le_tuan_thu || 0), 0) / data.length;
    const full = data.filter(d => (d.ty_le_tuan_thu || 0) === 100).length;
    return { total: data.length, avg, full, fail: data.length - full };
  }, [data]);

  const trendData = useMemo(() => {
    const map: Record<string, { date: string; sum: number; count: number }> = {};
    data.slice(-20).forEach(d => {
      const key = new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, sum: 0, count: 0 };
      map[key].sum += d.ty_le_tuan_thu || 0;
      map[key].count++;
    });
    return Object.values(map).map(r => ({ date: r.date, avg: Number((r.sum / r.count).toFixed(1)) }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText />} label="Tổng lượt giám sát" value={stats.total} color="blue" />
        <StatCard icon={<TrendingUp />} label="Tuân thủ TB (%)" value={`${stats.avg.toFixed(1)}%`} color="green" />
        <StatCard icon={<CheckSquare />} label="Hồ sơ đạt 100%" value={stats.full} color="green" />
        <StatCard icon={<AlertTriangle />} label="Hồ sơ có sai sót" value={stats.fail} color="red" />
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-80">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-[#059669]" /> Xu hướng tuân thủ quy chế HSBA</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip />
            <Bar dataKey="avg" fill="#059669" opacity={0.6} radius={[4, 4, 0, 0]} name="Tỷ lệ TB" />
            <Line type="monotone" dataKey="avg" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const HsbaList = ({ data, onView, onEdit, onDelete, onAdd }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: any) => d.ma_hsba.toLowerCase().includes(search.toLowerCase()) || d.khoa_duoc_giam_sat.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onAdd} className="bg-[#059669] hover:bg-[#008800] text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"><Plus size={18}/> Thêm phiếu giám sát</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm mã HSBA, khoa..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr><th>Ngày</th><th>Khoa</th><th>Mã HSBA</th><th>Người GS</th><th className="text-center">Tỷ lệ</th><th className="text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="p-4 text-table font-normal text-slate-600">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                <td className="p-4 text-table font-normal text-slate-800 uppercase">{d.khoa_duoc_giam_sat}</td>
                <td className="p-4 text-table font-normal text-slate-700">{d.ma_hsba}</td>
                <td className="p-4 text-sm text-slate-400 font-normal">{d.nguoi_giam_sat}</td>
                <td className={`p-4 text-center font-bold text-lg ${d.ty_le_tuan_thu === 100 ? 'text-[#059669]' : 'text-red-500'}`}>{d.ty_le_tuan_thu}%</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => onView(d)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl"><Eye size={16} /></button>
                  <button onClick={() => onEdit(d)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 size={16} /></button>
                  <button onClick={() => onDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HsbaForm = ({ item, currentUser, deptList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item } : defaultFormHsba(currentUser?.full_name || ''));
  const [saving, setSaving] = useState(false);

  const setField = (key: string, val: any) => {
    setForm((p: any) => {
      const updated = { ...p, [key]: val };
      const s = calcStats(updated);
      return { ...updated, ...s };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.khoa_duoc_giam_sat || !form.ma_hsba) { alert('Vui lòng nhập đủ thông tin chung'); return; }
    setSaving(true);
    try {
      if (item?.id) await updateGiamSatHsba(item.id, form);
      else await addGiamSatHsba(form);
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
      <div className="p-7 border-b border-slate-50 flex justify-between items-center bg-[#059669]/5">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-[#059669] rounded-2xl flex items-center justify-center text-white shadow-lg"><ClipboardList size={22} /></div>
           <div><h2 className="text-main-title font-bold text-slate-800 uppercase">Giám sát Hồ sơ bệnh án</h2><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Theo quy chế ghi chép HSBA (14 tiêu chí)</p></div>
         </div>
         <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-[28px] border border-slate-100">
           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ngày giám sát</label><input type="date" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" /></div>
           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Mã HSBA</label><input value={form.ma_hsba} onChange={e => setField('ma_hsba', e.target.value)} required placeholder="Nhập mã HSBA..." className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" /></div>
           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Khoa được GS</label><input list="hsba-dv-list" value={form.khoa_duoc_giam_sat} onChange={e => setField('khoa_duoc_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" /><datalist id="hsba-dv-list">{deptList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist></div>
           <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Người giám sát</label><input value={form.nguoi_giam_sat} onChange={e => setField('nguoi_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" /></div>
        </div>

        <div className="space-y-6">
          {SECTIONS_HSBA.map((section, sIdx) => (
            <div key={sIdx} className="border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
               <div className="bg-[#059669] text-white px-5 py-3"><h3 className="text-[10px] font-black uppercase tracking-widest">{section.title}</h3></div>
               <div className="divide-y divide-slate-50">
                 {section.criteria.map((c, cIdx) => {
                   const isPass = form[c.id] !== false;
                   const noteKey = `${c.id}_ghi_chu`;
                   return (
                     <div key={c.id} className={`p-4 space-y-3 ${!isPass ? 'bg-red-50/30' : ''}`}>
                        <div className="flex items-start gap-4">
                           <span className="text-[10px] font-black text-slate-400 mt-1">{cIdx + 1}</span>
                           <p className="flex-1 text-sm font-bold text-slate-700">{c.label}</p>
                           <DatKhongDatToggle value={isPass} onChange={v => setField(c.id, v)} />
                        </div>
                        {!isPass && (
                          <div className="ml-8"><input value={form[noteKey] || ''} onChange={e => setField(noteKey, e.target.value)} placeholder="Nhập lỗi cụ thể..." className="w-full p-2 bg-white border border-red-200 rounded-xl text-xs font-bold outline-none" /></div>
                        )}
                     </div>
                   );
                 })}
               </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hình ảnh minh chứng</label>
           <ImageUploaderHsba images={form.hinh_anh_minh_chung || []} onChange={urls => setField('hinh_anh_minh_chung', urls)} />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
           <div className="flex items-center gap-6">
              <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tuân thủ</p><p className={`text-3xl font-black ${form.ty_le_tuan_thu === 100 ? 'text-[#059669]' : 'text-red-500'}`}>{form.ty_le_tuan_thu}%</p></div>
              <div className="h-10 w-px bg-slate-100"/>
              <p className="text-sm font-bold text-slate-600">Đạt <b>{form.tong_dat}</b>/14 tiêu chí</p>
           </div>
           <div className="flex gap-3 w-full md:w-auto">
              <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Hủy</button>
              <button type="submit" disabled={saving} className="flex-1 md:flex-none px-12 py-3.5 bg-[#059669] text-white rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-[#008800] disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu kết quả'}</button>
           </div>
        </div>
      </form>
    </div>
  );
};

const HsbaDetail = ({ item, onClose, onEdit }: any) => {
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#059669]"/>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center no-print outline-none">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><RotateCcw size={14}/> Quay lại</button>
          <div className="flex gap-3">
             <button onClick={onEdit} className="px-6 py-3 bg-[#059669] text-white rounded-2xl text-[11px] font-black uppercase shadow-lg">Sửa phiếu</button>
          </div>
        </div>

        <div className="text-center space-y-2">
           <h1 className="text-main-title font-bold text-slate-900 uppercase leading-snug">BẢNG KIỂM GIÁM SÁT HỒ SƠ BỆNH ÁN RA VIỆN</h1>
           <p className="text-sm font-bold text-slate-600">(Áp dụng cho các Khoa Lâm sàng - Bệnh viện Quân y 103)</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-dashed border-slate-200 text-sm font-bold">
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Khoa được giám sát</p><p className="uppercase">{item.khoa_duoc_giam_sat}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã HSBA</p><p>{item.ma_hsba}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Người giám sát</p><p className="uppercase">{item.nguoi_giam_sat}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày giám sát</p><p>{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p></div>
        </div>

        <div className="space-y-4">
           <table className="w-full border-collapse border-4 border-slate-900 text-[12pt] font-bold">
              <thead className="bg-[#059669] text-white font-black uppercase">
                 <tr><th className="p-3 border-2 border-slate-900 w-10">STT</th><th className="p-3 border-2 border-slate-900 text-left">Nội dung giám sát (Tiêu chí trọng yếu)</th><th className="p-3 border-2 border-slate-900 w-24">Kết quả</th><th className="p-3 border-2 border-slate-900">Ghi chú (Lỗi cụ thể)</th></tr>
              </thead>
               <tbody>
                {SECTIONS_HSBA.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <tr className="bg-slate-50"><td colSpan={4} className="p-2 border-2 border-slate-900 font-bold text-[#059669] uppercase text-table">{section.title}</td></tr>
                    {section.criteria.map((c, cIdx) => (
                      <tr key={c.id}>
                        <td className="p-2 border-2 border-slate-900 text-center font-normal">{cIdx + 1}</td>
                        <td className="p-2 border-2 border-slate-900 font-normal">{c.label}</td>
                        <td className="p-2 border-2 border-slate-900 text-center font-normal">{item[c.id] ? 'ĐẠT' : <span className="text-red-500 font-bold">K.ĐẠT</span>}</td>
                        <td className="p-2 border-2 border-slate-900 italic text-red-500 font-normal">{item[`${c.id}_ghi_chu`]}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                 <tr className="bg-slate-100 font-black text-[12pt]">
                  <td colSpan={2} className="p-3 border-2 border-slate-900 uppercase text-right">Tỷ lệ tuân thủ quy chế HSBA</td>
                  <td className="p-3 border-2 border-slate-900 text-center text-xl text-[#059669]">{item.ty_le_tuan_thu}%</td>
                  <td className="p-3 border-2 border-slate-900 text-slate-500 italic">Đạt {item.tong_dat}/14 tiêu chí</td>
                </tr>
              </tbody>
           </table>
        </div>

        {item.hinh_anh_minh_chung?.length > 0 && (
           <div className="space-y-3 no-print">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Hình ảnh minh chung</h3>
              <div className="flex flex-wrap gap-3">
                 {item.hinh_anh_minh_chung.map((u: string, i: number) => <img key={i} src={u} className="w-40 h-40 object-cover rounded-2xl border border-slate-200" alt=""/>)}
              </div>
           </div>
        )}

        <div className="flex justify-between pt-10 h-48 items-end">
           <div className="text-center flex-1 space-y-12"><p className="text-xs font-black uppercase underline">Lãnh đạo đơn vị</p></div>
           <div className="text-center flex-1 space-y-12">
              <p className="text-xs font-black uppercase underline">Người giám sát</p>
              <p className="text-sm font-black uppercase text-slate-900">{item.nguoi_giam_sat}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export const HsbaMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH' | 'SUMMARY'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [data, setData] = useState<GiamSatHsba[]>([]);
  const [editingItem, setEditingItem] = useState<GiamSatHsba | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);

  // Filtering states
  const [dateFilter, setDateFilter] = useState({ type: 'all', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rs, dv] = await Promise.all([fetchGiamSatHsba(), fetchDmDonVi()]);
      setData(rs || []); setDeptList(dv || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const matchedDate = isDateInRange(item.ngay_giam_sat, range);
      const matchedDept = !deptFilter || item.khoa_duoc_giam_sat === deptFilter;
      return matchedDate && matchedDept;
    });
  }, [data, dateFilter, deptFilter]);

  return (
    <div className="bg-white min-h-[calc(100vh-6rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <div className="flex bg-white p-1.5 gap-1 rounded-[28px] border border-slate-200 shrink-0 shadow-sm">
             <TabButton active={activeTab === 'OVERVIEW'} onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} icon={LayoutDashboard} label="Tổng quan" />
             <TabButton active={activeTab === 'DANH_SACH'} onClick={() => { setActiveTab('DANH_SACH'); setViewMode('LIST'); }} icon={List} label="Danh sách giám sát" />
             <TabButton active={activeTab === 'SUMMARY'} onClick={() => { setActiveTab('SUMMARY'); setViewMode('LIST'); }} icon={BarChart3} label="Tổng hợp chỉ số lỗi" />
           </div>

           {viewMode === 'LIST' && (
             <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
               <DateRangeFilter filter={dateFilter} onChange={setDateFilter} className="shrink-0" />
               <select
                 value={deptFilter}
                 onChange={e => setDeptFilter(e.target.value)}
                 className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#059669]"
               >
                 <option value="">Tất cả khoa</option>
                 {deptList.map((d: any) => (
                   <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`}>{d.ten_don_vi}</option>
                 ))}
               </select>

               {activeTab !== 'DANH_SACH' && (
                 <button onClick={() => { setEditingItem(null); setActiveTab('DANH_SACH'); setViewMode('FORM'); }} className="w-full lg:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#059669] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-[#008800] active:scale-95">
                   <Plus size={16} /> Thêm giám sát mới
                 </button>
               )}             </div>
           )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-[#059669]" size={32} /></div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'OVERVIEW' ? (
              <HsbaOverview data={filteredData} />
            ) : activeTab === 'SUMMARY' ? (
              <HsbaErrorSummary data={filteredData} />
            ) : viewMode === 'LIST' ? (
               <HsbaList data={filteredData} onAdd={() => { setEditingItem(null); setViewMode('FORM'); }} onView={(i: any) => { setEditingItem(i); setViewMode('DETAIL'); }} onEdit={(i: any) => { setEditingItem(i); setViewMode('FORM'); }} onDelete={async (id: string) => { if (window.confirm('Xóa bản ghi này?')) { await deleteGiamSatHsba(id); loadData(); } }} />
            ) : viewMode === 'FORM' ? (
              <HsbaForm item={editingItem} currentUser={user} deptList={deptList} onSaved={() => { setViewMode('LIST'); loadData(); }} onClose={() => setViewMode('LIST')} />
            ) : (
              <HsbaDetail item={editingItem} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HsbaMonitoringModule;
