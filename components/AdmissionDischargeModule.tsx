import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera,
  CheckCircle2, XCircle, TrendingUp, Building2, Calendar,
  Check, Ambulance, ClipboardList,
  DoorOpen, LogOut, ArrowRightLeft, ShieldCheck, GraduationCap
} from 'lucide-react';
import {
  fetchGsRaVaoVien, addGsRaVaoVien, updateGsRaVaoVien,
  deleteGsRaVaoVien, uploadRaVaoVienImage, GiamSatRaVaoVien
} from '../readGsRaVaoVien';
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

// ─── CRITERIA & SECTIONS ──────────────────────────────────────────────────────
export const SECTIONS_RA_VAO_VIEN = [
  {
    title: 'I. CHẾ ĐỘ VÀO VIỆN',
    criteria: [
      { id: 'c1', label: 'Người bệnh được tiếp đón khẩn trương, làm thủ tục hành chính đầy đủ, đúng đối tượng (quân, dân, BHYT).', note: '' },
      { id: 'c2', label: 'Bác sĩ khám và ra y lệnh vào viện kịp thời; hồ sơ bệnh án lập mới đầy đủ các mục theo quy định.', note: '' },
      { id: 'c3', label: 'Người bệnh được phổ biến nội quy bệnh viện, quyền lợi và nghĩa vụ ngay khi vào khoa.', note: '' },
    ]
  },
  {
    title: 'II. CHẾ ĐỘ CHUYỂN KHOA',
    criteria: [
      { id: 'c4', label: 'Có chỉ định chuyển khoa của bác sĩ điều trị và sự đồng ý của khoa nơi đến (sau khi hội chẩn nếu cần).', note: '' },
      { id: 'c5', label: 'Hồ sơ bệnh án được hoàn thiện, tổng kết giai đoạn điều trị và bàn giao trực tiếp giữa hai điều dưỡng.', note: '' },
      { id: 'c6', label: 'Người bệnh nặng được bác sĩ/điều dưỡng hộ tống và mang theo phương tiện cấp cứu đi kèm.', note: '' },
    ]
  },
  {
    title: 'III. CHẾ ĐỘ CHUYỂN VIỆN',
    criteria: [
      { id: 'c7', label: 'Có biên bản hội chẩn/chỉ định chuyển viện khi vượt quá khả năng điều trị hoặc theo yêu cầu tuyến quân y.', note: '' },
      { id: 'c8', label: 'Liên hệ trước với bệnh viện tuyến trên và đảm bảo phương tiện vận chuyển (xe cứu thương, kíp hộ tống).', note: '' },
      { id: 'c9', label: 'Giấy chuyển viện/Giấy chuyển tuyến ghi đầy đủ tóm tắt bệnh án, các thuốc đã dùng và tình trạng hiện tại.', note: '' },
    ]
  },
  {
    title: 'IV. CHẾ ĐỘ RA VIỆN',
    criteria: [
      { id: 'c10', label: 'Có kế hoạch ra viện trước 24 giờ; người bệnh/gia đình được thông báo về thời gian và thủ tục.', note: '' },
      { id: 'c11', label: 'Hồ sơ bệnh án được hoàn thiện, ký duyệt đầy đủ các cấp trước khi làm thủ tục thanh toán.', note: '' },
      { id: 'c12', label: 'Người bệnh được cấp Giấy ra viện, đơn thuốc dặn dò và hướng dẫn tái khám (nếu có).', note: '' },
    ]
  },
  {
    title: 'V. AN TOÀN NGƯỜI BỆNH & TÀI SẢN',
    criteria: [
      { id: 'c13', label: 'Thực hiện nhận dạng đúng người bệnh (họ tên, ngày sinh) tại mỗi thời điểm chuyển giao.', note: '' },
      { id: 'c14', label: 'Bàn giao đầy đủ tư trang, phim X-quang, các kết quả cận lâm sàng của người bệnh khi chuyển/ra viện.', note: '' },
    ]
  }
];

const ALL_CRITERIA_RA_VAO = SECTIONS_RA_VAO_VIEN.flatMap(s => s.criteria);
const TOTAL_CRITERIA_RA_VAO = ALL_CRITERIA_RA_VAO.length;

const calcStatsRaVao = (form: any) => {
  const dat = ALL_CRITERIA_RA_VAO.filter(c => form[c.id] !== false).length;
  const ty_le = Math.round((dat / TOTAL_CRITERIA_RA_VAO) * 100 * 100) / 100;
  return { tong_dat: dat, tong_tieu_chi: TOTAL_CRITERIA_RA_VAO, ty_le_tuan_thu: ty_le };
};

const defaultFormRaVao = (userName = ''): any => {
  const base: any = {
    ngay_giam_sat: toLocalISO(new Date()),
    nguoi_gs: userName,
    khoa_gs: '',
    doi_tuong_gs: [],
    ket_luan_chung: '',
    hinh_anh_minh_chung: [],
    tong_dat: TOTAL_CRITERIA_RA_VAO,
    tong_tieu_chi: TOTAL_CRITERIA_RA_VAO,
    ty_le_tuan_thu: 100,
  };
  ALL_CRITERIA_RA_VAO.forEach((c) => {
    base[c.id] = true;
    base[`${c.id}_ghi_chu`] = '';
  });
  return base;
};

// ─── UI COMPONENTS ──────────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border ${active ? 'bg-[#009900] text-white border-[#009900] shadow-lg' : 'bg-white text-[#009900] border-slate-200 hover:bg-slate-50'}`}>
    <Icon size={15} />{label}
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    indigo: 'bg-emerald-50 text-emerald-700',
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

const ImageUploaderRaVao = ({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadRaVaoVienImage(f)));
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
        <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md group">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
        </div>
      ))}
      <label className={`w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
        <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
        <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">{uploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
      </label>
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
const RaVaoErrorSummary = ({ data }: { data: GiamSatRaVaoVien[] }) => {
  const summary = useMemo(() => {
    const total = data.length;
    if (total === 0) return [];

    const stats = ALL_CRITERIA_RA_VAO.map((c) => {
      const fieldId = c.id;
      const noteField = `${c.id}_ghi_chu`;
      const recordsWithError = data.filter(d => (d as any)[fieldId] === false);
      const count = recordsWithError.length;
      const depts = Array.from(new Set(recordsWithError.map(d => d.khoa_gs))).join(', ');
      
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
      'Khoa liên quan': s.depts
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tong_hop_loi_RA_VAO_VIEN");
    ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 20 }, { wch: 15 }, { wch: 50 }, { wch: 30 }];
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `Bao_cao_loi_RA_VAO_VIEN_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100 space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight">TỔNG HỢP VI PHẠM CHẾ ĐỘ RA VÀO VIỆN</h2>
        <p className="text-xs text-slate-500 italic font-medium uppercase tracking-widest">Phân tích các lỗi phổ biến trong quy trình tiếp nhận, chuyển khoa và ra viện.</p>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-slate-200">
        <table className="table-standardized">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left w-1/3">Tiêu chí giám sát (Nội dung)</th>
              <th className="text-center w-24">Số lỗi ghi nhận</th>
              <th className="text-center w-20">Tỷ lệ (%)</th>
              <th className="text-left">Chi tiết & Đơn vị vi phạm</th>
            </tr>
          </thead>
          <tbody className="font-medium text-slate-700">
            {summary.length > 0 ? summary.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-bold">
                <td className="p-4 text-emerald-700 leading-snug">{s.label}</td>
                <td className="p-4 text-center text-lg font-black">{s.count}</td>
                <td className="p-4 text-center text-lg font-black text-rose-600">{s.rate}%</td>
                <td className="p-4">
                  <p className="text-slate-500 text-xs italic mb-2 font-medium">Mô tả: {s.notes}</p>
                  <p className="text-[12px] text-slate-900 font-bold uppercase tracking-tight flex items-center gap-2"><Building2 size={14} className="text-#009900"/> {s.depts || 'N/A'}</p>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-16 text-center text-slate-400 italic text-lg font-medium">Tuyệt vời! Hiện tại chưa ghi nhận vi phạm nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-6">
         <button onClick={handleExportExcel} className="flex items-center gap-2 bg-#009900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:scale-95"><BarChart3 size={18}/> Xuất báo cáo Excel</button>
      </div>
    </div>
  );
};

const RaVaoOverview = ({ data }: { data: GiamSatRaVaoVien[] }) => {
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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<DoorOpen />} label="Tổng lượt giám sát" value={stats.total} color="blue" />
        <StatCard icon={<ShieldCheck />} label="Tỷ lệ tuân thủ (%)" value={`${stats.avg.toFixed(1)}%`} color="indigo" />
        <StatCard icon={<CheckCircle2 />} label="Hoàn hảo (100%)" value={stats.full} color="green" />
        <StatCard icon={<XCircle />} label="Chưa hoàn thiện" value={stats.fail} color="rose" />
      </div>
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-96 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-#009900 opacity-20"/>
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3"><TrendingUp size={18} className="text-#009900" /> Diễn biến chất lượng giám sát ra vào viện</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="avg" fill="#4f46e5" opacity={0.6} radius={[6, 6, 0, 0]} name="Chất lượng TB" />
              <Line type="monotone" dataKey="avg" stroke="#4f46e5" strokeWidth={4} dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} name="Xu điểm" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const RaVaoList = ({ data, onView, onEdit, onDelete, onAdd }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: any) => 
    d.khoa_gs.toLowerCase().includes(search.toLowerCase()) || 
    d.nguoi_gs.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <button onClick={onAdd} className="bg-[#009900] hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"><Plus size={18}/> Thêm phiếu giám sát</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm nhanh khoa hoặc người giám sát..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all placeholder:font-medium placeholder:text-slate-300" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr className="bg-[#009900] text-white"><th>Ngày giám sát</th><th>Khoa được giám sát</th><th>Cán bộ giám sát</th><th>Đối tượng</th><th className="text-center">Tỷ lệ đạt</th><th className="text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-bold">
            {filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-emerald-50/30 transition-colors">
                <td className="p-4 text-slate-500 font-medium text-xs">{formatDateTime(d.ngay_giam_sat)}</td>
                <td className="p-4 text-slate-900 tracking-tight text-xs">{d.khoa_gs}</td>
                <td className="p-4 text-xs text-slate-500">{d.nguoi_gs}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(d.doi_tuong_gs || []).map((o: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase">{o}</span>
                    ))}
                  </div>
                </td>
                <td className={`p-4 text-center text-lg font-black ${d.ty_le_tuan_thu === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{d.ty_le_tuan_thu}%</td>
                <td className="p-4">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => onView(d)} className="p-2.5 text-emerald-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100" title="Xem chi tiết"><Eye size={16} /></button>
                    <button onClick={() => onEdit(d)} className="p-2.5 text-[#009900] hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100" title="Chỉnh sửa"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(d.id)} className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors" title="Xóa"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-16 text-center text-slate-400 italic text-sm font-medium">Không tìm thấy dữ liệu giám sát ra vào viện nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RaVaoForm = ({ item, currentUser, deptList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item, ngay_giam_sat: toLocalISO(new Date(item.ngay_giam_sat)) } : defaultFormRaVao(currentUser?.full_name || ''));
  const [saving, setSaving] = useState(false);

  const setField = (key: string, val: any) => {
    setForm((p: any) => {
      const updated = { ...p, [key]: val };
      const s = calcStatsRaVao(updated);
      return { ...updated, ...s };
    });
  };

  const toggleDoiTuong = (val: string) => {
    const list = form.doi_tuong_gs || [];
    if (list.includes(val)) setField('doi_tuong_gs', list.filter((l: string) => l !== val));
    else setField('doi_tuong_gs', [...list, val]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.khoa_gs) { alert('Vui lòng nhập khoa được giám sát'); return; }
    if (!form.doi_tuong_gs.length) { alert('Vui lòng chọn ít nhất một đối tượng giám sát'); return; }
    setSaving(true);
    try {
      const dataToSave = { ...form, ngay_giam_sat: new Date(form.ngay_giam_sat).toISOString() };
      if (item?.id) await updateGsRaVaoVien(item.id, dataToSave);
      else await addGsRaVaoVien(dataToSave);
      onSaved();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-emerald-50/30">
         <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-[#009900] rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-[#009900]/20"><ClipboardList size={28} /></div>
           <div><h2 className="text-main-title font-bold text-slate-800 leading-tight">Giám sát Vào viện / Chuyển khoa / Chuyển viện / Ra viện</h2><p className="text-[10px] font-bold text-slate-900 mt-1">Nội dung giám sát chuyên môn theo quy định cấp cứu và Chế độ điều trị</p></div>
         </div>
         <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90"><X size={24} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        <div className="space-y-6 bg-slate-50/50 p-8 rounded-[32px] border border-slate-100">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 pl-2">thời gian giám sát</label>
                <input type="datetime-local" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white shadow-sm transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 pl-2">khoa được giám sát</label>
                <input list="ra-vao-dv-list" value={form.khoa_gs} onChange={e => setField('khoa_gs', e.target.value)} required className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 bg-white transition-all shadow-sm" placeholder="Chọn khoa phòng..." />
                <datalist id="ra-vao-dv-list">{deptList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 pl-2">cán bộ giám sát</label>
                <input value={form.nguoi_gs} onChange={e => setField('nguoi_gs', e.target.value)} required className="w-full p-3.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-black outline-none focus:ring-4 focus:ring-emerald-500/10 bg-white shadow-sm transition-all" />
              </div>
           </div>
           <div className="space-y-4 pt-4 border-t border-slate-200/60">
             <label className="text-[11px] font-bold text-slate-500 pl-2 flex items-center gap-2 italic">
               <span className="w-1.5 h-1.5 rounded-full bg-[#009900]"></span>
               đối tượng giám sát (vui lòng chọn các đối tượng phù hợp)
             </label>
             <div className="flex flex-wrap gap-2.5 font-bold">
                {['Vào viện', 'Chuyển khoa', 'Chuyển viện', 'Ra viện'].map(o => (
                  <button key={o} type="button" onClick={() => toggleDoiTuong(o)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-tight transition-all border-2 ${form.doi_tuong_gs?.includes(o) ? 'bg-[#009900] text-white border-[#009900] shadow-lg shadow-emerald-900/20' : 'bg-white text-slate-400 border-slate-100 hover:border-[#009900] hover:text-[#009900]'}`}>{o}</button>
                ))}
             </div>
           </div>
        </div>

        <div className="space-y-8">
          {SECTIONS_RA_VAO_VIEN.map((section, sIdx) => (
            <div key={sIdx} className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm bg-white">
               <div className="bg-[#009900] text-white px-7 py-6 flex justify-between items-center shadow-lg shadow-emerald-900/10">
                 <h3 className="text-[13px] font-black uppercase tracking-widest leading-none">{section.title}</h3>
                 <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black">{section.criteria.length} Mục</span>
               </div>
               <div className="divide-y divide-slate-100 font-bold">
                 {section.criteria.map((c, cIdx) => {
                   const isPass = form[c.id] !== false;
                   const noteKey = `${c.id}_ghi_chu`;
                   return (
                     <div key={c.id} className={`p-6 space-y-4 transition-colors ${!isPass ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                        <div className="flex items-start gap-6">
                           <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 mt-1 shrink-0">{cIdx + 1}</span>
                           <p className="flex-1 text-sm font-bold text-slate-800 leading-relaxed pt-1 tracking-tight">{c.label}</p>
                           <DatKhongDatToggle value={isPass} onChange={v => setField(c.id, v)} />
                        </div>
                        {!isPass && (
                          <div className="ml-12 animate-in slide-in-from-left-2 duration-300"><input value={form[noteKey] || ''} onChange={e => setField(noteKey, e.target.value)} placeholder="Mô tả cụ thể nội dung chưa đạt hoặc lý do..." className="w-full p-3.5 bg-white border-2 border-rose-100 rounded-2xl text-[12px] font-bold outline-none focus:border-rose-400 transition-all shadow-inner placeholder:italic placeholder:font-medium" /></div>
                        )}
                     </div>
                   );
                 })}
               </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4 font-bold tracking-tight">
          <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 flex items-center gap-2"><Camera size={16} className="text-[#009900]" /> Hình ảnh minh chứng (Lưu buckets/gs-hsba)</label><div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner"><ImageUploaderRaVao images={form.hinh_anh_minh_chung || []} onChange={urls => setField('hinh_anh_minh_chung', urls)} /></div></div>
          <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Kết luận & Kiến nghị chung</label><textarea rows={6} value={form.ket_luan_chung} onChange={e => setField('ket_luan_chung', e.target.value)} placeholder="Tóm tắt kết quả buổi giám sát, những mặt làm được và những tồn tại cần khắc phục ngay..." className="w-full p-6 rounded-[32px] border border-slate-200 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 shadow-inner bg-slate-50/50 transition-all placeholder:italic placeholder:font-medium" /></div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-slate-100">
           <div className="flex items-center gap-10">
              <div className="text-center group"><p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest leading-none">Chỉ số tuân thủ</p><div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl font-black shadow-2xl transition-all group-hover:rotate-6 ${form.ty_le_tuan_thu === 100 ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>{form.ty_le_tuan_thu < 100 ? Math.floor(form.ty_le_tuan_thu) : 100}<sup>%</sup></div></div>
              <div className="max-w-[200px]"><p className="text-[13px] font-bold text-slate-700 leading-relaxed">Kết quả: Đạt được <span className="text-[#009900] font-black">{form.tong_dat}</span> trong tổng số <span className="text-slate-900 font-black">14</span> tiêu chuẩn nghiệp vụ.</p></div>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <button type="button" onClick={onClose} className="flex-1 px-10 py-4.5 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-[24px] text-[12px] font-black uppercase tracking-widest transition-all active:scale-95">Đóng</button>
              <button type="submit" disabled={saving} className="flex-1 px-16 py-4.5 bg-[#009900] text-white rounded-[24px] text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/10 hover:bg-emerald-700 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50">{saving ? 'Đang xử lý dữ liệu...' : 'Lưu kết quả giám sát'}</button>
           </div>
        </div>
      </form>
    </div>
  );
};

const RaVaoDetail = ({ item, onClose, onEdit }: any) => {
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-12 border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in-98 duration-700">
      <div className="absolute top-0 left-0 w-full h-3 bg-[#009900]"/>
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center no-print outline-none">
          <button onClick={onClose} className="flex items-center gap-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-[#009900] transition-colors"><RotateCcw size={16}/> Quay về danh sách</button>
          <div className="flex gap-4">
             <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all">In báo cáo</button>
             <button onClick={onEdit} className="px-8 py-3 bg-[#009900] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all">Sửa thông tin</button>
          </div>
        </div>

        <div className="text-center space-y-4">
           <h1 className="text-3xl font-black text-slate-900 uppercase leading-tight tracking-tight">BÁO CÁO GIÁM SÁT VÀO VIỆN / CHUYỂN KHOA / CHUYỂN VIỆN / RA VIỆN</h1>
           <div className="flex justify-center gap-3 font-bold uppercase tracking-widest">
              {item.doi_tuong_gs?.map((o: string) => <span key={o} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] border border-emerald-100">{o}</span>)}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y-2 border-dashed border-slate-200 text-[13px] font-bold tracking-tight">
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Khoa được giám sát</p><p className="text-slate-900 border-l-4 border-[#009900] pl-4 text-lg">{item.khoa_gs}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Người thực hiện giám sát</p><p className="text-slate-900 border-l-4 border-[#009900] pl-4 text-lg">{item.nguoi_gs}</p></div>
           <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Thời điểm ghi nhận</p><p className="text-slate-900 border-l-4 border-[#009900] pl-4 text-lg">{formatDateTime(item.ngay_giam_sat)}</p></div>
        </div>

        <div className="space-y-6">
           <table className="w-full border-collapse border-4 border-slate-900 text-table font-black">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-center text-[11px] tracking-widest">
                 <tr><th className="p-4 border-2 border-slate-900 w-12">STT</th><th className="p-4 border-2 border-slate-900 text-left">Nội dung giám sát (Tiêu chuẩn quy chuẩn)</th><th className="p-4 border-2 border-slate-900 w-24">Đạt</th><th className="p-4 border-2 border-slate-900 w-24 text-rose-600">K.Đạt</th><th className="p-4 border-2 border-slate-900">Chi tiết vi phạm / Ghi chú</th></tr>
              </thead>
              <tbody>
                {SECTIONS_RA_VAO_VIEN.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <tr className="bg-[#009900] text-white"><td colSpan={5} className="p-6 border-2 border-slate-900 font-bold uppercase tracking-[0.15em] text-[12px] text-center shadow-inner">{section.title}</td></tr>
                    {section.criteria.map((c, cIdx) => (
                      <tr key={c.id} className="font-bold">
                        <td className="p-4 border-2 border-slate-900 text-center font-normal">{cIdx + 1}</td>
                        <td className="p-4 border-2 border-slate-900 text-slate-800 leading-relaxed font-bold text-[12px]">{c.label}</td>
                        <td className="p-4 border-2 border-slate-900 text-center">{item[c.id] && <Check size={28} className="text-emerald-500 mx-auto stroke-[4]" />}</td>
                        <td className="p-4 border-2 border-slate-900 text-center">{!item[c.id] && <X size={28} className="text-rose-600 mx-auto stroke-[4]" />}</td>
                        <td className="p-4 border-2 border-slate-900 italic text-rose-600 text-xs font-bold">{item[`${c.id}_ghi_chu`]}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                  <tr className="bg-[#009900] text-white font-black text-lg">
                    <td colSpan={2} className="p-5 border-2 border-slate-900 uppercase text-right tracking-[0.2em] text-xs">TỔNG CỘNG (Số mục Đạt/14)</td>
                    <td colSpan={2} className="p-5 border-2 border-slate-900 text-center text-3xl font-black tracking-widest">{item.tong_dat}/14</td>
                    <td className="p-5 border-2 border-slate-900 text-emerald-500 text-center text-3xl font-black">{item.ty_le_tuan_thu}<sup>%</sup></td>
                  </tr>
              </tbody>
           </table>
        </div>

        {item.ket_luan_chung && (
          <div className="space-y-4 pt-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kết luận & Đề xuất sau giám sát:</h3>
            <div className="p-8 bg-emerald-50 border-r-8 border-[#009900] text-[14px] italic text-emerald-950 leading-relaxed font-bold whitespace-pre-wrap shadow-inner">{item.ket_luan_chung}</div>
          </div>
        )}

        {item.hinh_anh_minh_chung?.length > 0 && (
           <div className="space-y-6 no-print border-t border-slate-100 pt-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><Camera size={18} className="text-#009900"/> Hình ảnh minh chứng hiện trường</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {item.hinh_anh_minh_chung.map((u: string, i: number) => (
                  <div key={i} className="aspect-square rounded-[32px] overflow-hidden border-8 border-white shadow-2xl transition-transform hover:scale-105">
                    <img src={u} className="w-full h-full object-cover" alt=""/>
                  </div>
                ))}
              </div>
           </div>
        )}

        {/* Chữ ký */}
        <div className="flex justify-between pt-24 items-start h-80 font-black uppercase tracking-tight">
           <div className="text-center flex-1 space-y-24">
             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 underline decoration-2 underline-offset-8">Trưởng đơn vị được giám sát</p>
             <div className="text-slate-100 italic font-medium">(Ký và ghi rõ họ tên)</div>
           </div>
           <div className="text-center flex-1 space-y-24">
             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800 underline decoration-2 underline-offset-8">Cán bộ thực hiện giám sát</p>
             <div>
                <p className="text-2xl font-black font-signature text-black lowercase italic mb-2 tracking-widest">Signed</p>
                <p className="text-[14px] font-black uppercase text-emerald-900 tracking-wider">{item.nguoi_gs}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export const AdmissionDischargeModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LIST' | 'SUMMARY'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [data, setData] = useState<GiamSatRaVaoVien[]>([]);
  const [editingItem, setEditingItem] = useState<GiamSatRaVaoVien | null>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({ type: 'all', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rs, dv] = await Promise.all([fetchGsRaVaoVien(), fetchDmDonVi()]);
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
             <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm">
               <DateRangeFilter filter={dateFilter} onChange={setDateFilter} className="shrink-0" />
               <div className="h-6 w-px bg-slate-100 mx-2 hidden md:block"/>
               <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-6 py-2.5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-500/10 text-emerald-900 transition-all cursor-pointer">
                 <option value="">Tất cả các khoa phòng</option>
                 {deptList.map((d: any) => <option key={d.id} value={d.ten_don_vi}>{d.ten_don_vi}</option>)}
               </select>
             </div>
           )}
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 gap-4"><Loader2 className="animate-spin text-#009900" size={48} /><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Đang đồng bộ dữ liệu...</p></div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {activeTab === 'OVERVIEW' ? <RaVaoOverview data={filteredData} />
            : activeTab === 'SUMMARY' ? <RaVaoErrorSummary data={filteredData} />
            : viewMode === 'LIST' ? <RaVaoList data={filteredData} onAdd={() => { setEditingItem(null); setViewMode('FORM'); }} onView={(i: any) => { setEditingItem(i); setViewMode('DETAIL'); }} onEdit={(i: any) => { setEditingItem(i); setViewMode('FORM'); }} onDelete={async (id: string) => { if (window.confirm('Hành động xóa này không thể khôi phục. Bạn chắc chắn chứ?')) { await deleteGsRaVaoVien(id); loadData(); } }} />
            : viewMode === 'FORM' ? <RaVaoForm item={editingItem} currentUser={user} deptList={deptList} onSaved={() => { setViewMode('LIST'); loadData(); }} onClose={() => setViewMode('LIST')} />
            : <RaVaoDetail item={editingItem} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdmissionDischargeModule;
