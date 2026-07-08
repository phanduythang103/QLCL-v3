import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera,
  CheckCircle2, XCircle, TrendingUp, Building2, User, Calendar,
  Users, AlertTriangle, CheckSquare, Shield, Activity, ArrowRight
} from 'lucide-react';
import {
  fetchGiamSatNdnb, addGiamSatNdnb, updateGiamSatNdnb,
  deleteGiamSatNdnb, uploadNdnbImage, GiamSatNdnb
} from '../readGiamSatNdnb';
import {
  fetchGiamSatNdnbTheokt, addGiamSatNdnbTheokt, updateGiamSatNdnbTheokt,
  deleteGiamSatNdnbTheokt, GiamSatNdnbTheokt
} from '../readGiamSatNdnbTheokt';
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DateRangeFilter from './DateRangeFilter';
import { getDateRange, isDateInRange } from '../utils/dateUtils';

// ─── CRITERIA LISTS ───────────────────────────────────────────────────────────
export const CRITERIA_NDNB = [
  { id: 'c1_nhan_dien_2_thong_tin', label: 'Sử dụng ít nhất 02 thông tin để nhận diện: Họ tên và Ngày tháng năm sinh (hoặc mã số người bệnh).', note: 'Tuyệt đối không dùng số giường/số phòng để nhận diện.' },
  { id: 'c2_cau_hoi_mo', label: 'Hình thức đặt câu hỏi mở: Yêu cầu người bệnh tự nói họ tên và ngày sinh (VD: "Bác cho biết họ tên và ngày sinh của bác là gì?").', note: 'Không hỏi câu hỏi Có/Không' },
  { id: 'c3_vong_nhan_dien', label: 'Kiểm tra thông tin trên vòng nhận diện: Đối chiếu thông tin người bệnh trả lời với thông tin ghi trên vòng đeo tay (đối với bệnh nhân nội trú).', note: '' },
  { id: 'c4_doi_chieu_ho_so', label: 'Đối chiếu với hồ sơ/y lệnh: Đối chiếu thông tin người bệnh với bệnh án, phiếu chỉ định hoặc phiếu truyền dịch trước khi thực hiện.', note: '' },
  { id: 'c5_xac_nhan_nguoi_than', label: 'Xác nhận qua người thân (nếu cần): Trường hợp người bệnh hôn mê, trẻ nhỏ hoặc không thể trả lời, phải xác nhận thông tin qua người nhà hoặc người giám hộ.', note: '' },
  { id: 'c6_dan_nhan_benh_pham', label: 'Dán nhãn bệnh phẩm tại giường: Các mẫu máu, bệnh phẩm phải được dán nhãn ngay sau khi lấy tại giường bệnh và có đủ thông tin nhận diện.', note: '' },
  { id: 'c7_ban_giao_nguoi_benh', label: 'Bàn giao người bệnh: Thực hiện xác nhận đúng danh tính khi chuyển người bệnh giữa các khoa hoặc bàn giao giữa các ca trực.', note: '' },
];

export const CRITERIA_NDNB_KT = [
  { id: 'c1_thuoc_truyen_dich', label: 'Trước khi dùng thuốc/ Truyền dịch', note: 'Đối chiếu 5 đúng; kiểm tra tiền sử dị ứng' },
  { id: 'c2_lay_mau_xn', label: 'Trước khi lấy mẫu xét nghiệm', note: 'Dán nhãn ống nghiệm ngay tại giường sau khi đối chiếu' },
  { id: 'c3_thu_thuat_pt', label: 'Trước khi thực hiện Thủ thuật/Phẫu thuật', note: 'Hỏi thêm vị trí thủ thuật, bên trái/phải (nếu có)' },
  { id: 'c4_ban_giao_nb', label: 'Trước khi bàn giao người bệnh', note: 'Hai NVYT cùng đối chiếu thông tin trên vòng và HSBA' },
  { id: 'c5_chan_doan_ha', label: 'Trước khi thực hiện chẩn đoán hình ảnh (X-quang, CT...)', note: 'Đối chiếu thông tin chỉ định với NB tại phòng chụp' },
  { id: 'c6_cap_phat_thuoc', label: 'Trước khi cấp phát thuốc tại nhà thuốc', note: 'Kiểm tra thông tin hành chính trên đơn và thẻ BHYT/CCCD' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const calcStats = (form: any, criteria: any[]) => {
  const dat = criteria.filter(c => form[c.id] !== false).length;
  const total = criteria.length;
  const ty_le = Math.round((dat / total) * 100 * 100) / 100;
  return { tong_dat: dat, tong_tieu_chi: total, ty_le_tuan_thu: ty_le };
};

const defaultForm = (userName = '', criteria: any[]): any => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: userName,
    khoa_duoc_giam_sat: '',
    doi_tuong_giam_sat: '',
    nhan_xet: '',
    hinh_anh_minh_chung: [],
    tong_dat: criteria.length,
    tong_tieu_chi: criteria.length,
    ty_le_tuan_thu: 100,
  };
  criteria.forEach((c, i) => {
    base[c.id] = true;
    base[`c${i + 1}_ghi_chu`] = '';
  });
  return base;
};

// ─── COMMON SUBCOMPONENTS ─────────────────────────────────────────────────────
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
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${colors[color]}`}>{React.cloneElement(icon, { size: 20 })}</div>
      <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p><h3 className="text-lg font-black text-slate-800">{value}</h3></div>
    </div>
  );
};

const ImageUploader = ({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadNdnbImage(f)));
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
      <label className={`w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer ${uploading ? 'animate-pulse pointer-events-none' : ''}`}>
        <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        <span className="text-[7px] font-black mt-0.5">{uploading ? 'Tải...' : 'Thêm'}</span>
      </label>
    </div>
  );
};

const DatKhongDatToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex gap-1.5 shrink-0">
    <button type="button" onClick={() => onChange(true)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${value ? 'bg-[#059669] text-white border-[#059669] shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-green-300'}`}><CheckCircle2 size={12} /> Đạt</button>
    <button type="button" onClick={() => onChange(false)} className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${!value ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'}`}><XCircle size={12} /> K.Đạt</button>
  </div>
);

// ─── TAB 1: TỔNG QUAN (Combined Overview) ─────────────────────────────────────
const CombinedOverview = ({ dataCriteria, dataTech }: { dataCriteria: GiamSatNdnb[]; dataTech: GiamSatNdnbTheokt[] }) => {
  const stats = useMemo(() => {
    const total = dataCriteria.length + dataTech.length;
    if (total === 0) return { total: 0, avg: 0, criteriaCount: 0, techCount: 0 };
    const sumRate = dataCriteria.reduce((s, d) => s + (d.ty_le_tuan_thu || 0), 0) + dataTech.reduce((s, d) => s + (d.ty_le_tuan_thu || 0), 0);
    return { total, avg: sumRate / total, criteriaCount: dataCriteria.length, techCount: dataTech.length };
  }, [dataCriteria, dataTech]);

  const combinedTrendData = useMemo(() => {
    const map: Record<string, { date: string; criteriaAvg: number; techAvg: number; countC: number; countT: number }> = {};
    dataCriteria.forEach(d => {
      const key = new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, criteriaAvg: 0, techAvg: 0, countC: 0, countT: 0 };
      map[key].criteriaAvg += d.ty_le_tuan_thu || 0;
      map[key].countC++;
    });
    dataTech.forEach(d => {
      const key = new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, criteriaAvg: 0, techAvg: 0, countC: 0, countT: 0 };
      map[key].techAvg += d.ty_le_tuan_thu || 0;
      map[key].countT++;
    });
    return Object.values(map).map(r => ({
      date: r.date,
      criteria: r.countC > 0 ? Number((r.criteriaAvg / r.countC).toFixed(1)) : null,
      tech: r.countT > 0 ? Number((r.techAvg / r.countT).toFixed(1)) : null,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [dataCriteria, dataTech]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Shield />} label="Tổng lượt giám sát" value={stats.total} color="blue" />
        <StatCard icon={<TrendingUp />} label="Tuân thủ chung" value={`${stats.avg.toFixed(1)}%`} color="green" />
        <StatCard icon={<Users />} label="Nhận diện (Tiêu chí)" value={stats.criteriaCount} color="amber" />
        <StatCard icon={<Activity />} label="Thời điểm & Kỹ thuật" value={stats.techCount} color="emerald" />
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm h-80">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-blue-600" /> So sánh tỷ lệ tuân thủ theo thời gian</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedTrendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            <Line type="monotone" dataKey="criteria" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Nhận diện đúng NB" />
            <Line type="monotone" dataKey="tech" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Thời điểm & Kỹ thuật" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── TAB 2/3: DATA LIST & FORM ────────────────────────────────────────────────
const ModuleListView = ({ type, data, onView, onEdit, onDelete, onAdd }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: any) =>
    d.khoa_duoc_giam_sat.toLowerCase().includes(search.toLowerCase()) ||
    d.nguoi_giam_sat.toLowerCase().includes(search.toLowerCase()) ||
    d.doi_tuong_giam_sat.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onAdd} className="bg-[#059669] hover:bg-[#008800] text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap"><Plus size={18}/> Thêm phiếu giám sát</button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm khoa, người GS, đối tượng..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-standardized">
          <thead className="bg-[#059669] text-white">
            <tr><th>Ngày</th><th>Khoa</th><th>Đối tượng</th><th>Người GS</th><th className="text-center">Tỷ lệ</th><th className="text-right">Thao tác</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((d: any) => {
              const rate = d.ty_le_tuan_thu || 0;
              const color = rate === 100 ? 'text-[#059669]' : rate >= 70 ? 'text-amber-600' : 'text-red-500';
              return (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-table font-normal text-slate-600">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-table font-normal text-slate-800 uppercase">{d.khoa_duoc_giam_sat}</td>
                  <td className="p-4 text-table text-slate-600 font-normal">{d.doi_tuong_giam_sat}</td>
                  <td className="p-4 text-sm text-slate-400 font-normal">{d.nguoi_giam_sat}</td>
                  <td className={`p-4 text-center font-bold text-lg ${color}`}>{rate}%</td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => onView(d)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Eye size={16} /></button>
                    <button onClick={() => onEdit(d)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(d.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── REPORT TAB ───────────────────────────────────────────────────────────────
const ReportTab = ({ dataCriteria, dataTech }: any) => {
  const getDeptSummary = (data: any[]) => {
    const g: Record<string, any> = {};
    data.forEach(d => {
      const k = d.khoa_duoc_giam_sat;
      if (!g[k]) g[k] = { dept: k, count: 0, totalRate: 0, violate: 0 };
      g[k].count++;
      g[k].totalRate += d.ty_le_tuan_thu || 0;
      if ((d.ty_le_tuan_thu || 0) < 100) g[k].violate++;
    });
    return Object.values(g).map(r => ({ ...r, avg: (r.totalRate / r.count).toFixed(1) })).sort((a, b) => Number(b.avg) - Number(a.avg));
  };

  const criteriaSum = getDeptSummary(dataCriteria);
  const techSum = getDeptSummary(dataTech);

  const ReportCard = ({ title, icon, data, color }: any) => (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div className={`p-5 flex items-center gap-3 ${color === 'blue' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === 'blue' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>{icon}</div>
        <h3 className="text-sm font-black text-slate-800 uppercase">{title}</h3>
      </div>
      <div className="p-4 flex-1">
        <table className="table-standardized no-border-outer">
          <thead><tr><th className="text-left">Khoa</th><th className="text-center">Lượt</th><th className="text-center">Tỷ lệ</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {data.slice(0, 5).map((r: any) => (
              <tr key={r.dept}><td className="py-2 font-bold text-slate-700 truncate max-w-[120px]">{r.dept}</td><td className="py-2 text-center text-slate-500 font-bold">{r.count}</td><td className={`py-2 text-center font-black ${Number(r.avg) === 100 ? 'text-[#059669]' : 'text-red-500'}`}>{r.avg}%</td></tr>
            ))}
          </tbody>
        </table>
        {data.length > 5 && <p className="text-[10px] text-slate-300 mt-2 italic text-center">Và {data.length - 5} khoa khác...</p>}
      </div>
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hiệu suất tổng thể</span>
         <span className="p-1.5 px-3 bg-white rounded-full text-xs font-black shadow-sm">{data.length > 0 ? (data.reduce((s:any, r:any) => s + Number(r.avg), 0) / data.length).toFixed(1) : 0}%</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
      <ReportCard title="Nhận diện đúng NB (Tiêu chí)" icon={<Users size={16}/>} data={criteriaSum} color="blue" />
      <ReportCard title="Thời điểm & Kỹ thuật" icon={<Activity size={16}/>} data={techSum} color="emerald" />
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const NdnbMonitoringModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CRITERIA' | 'TECHNIQUE' | 'REPORT'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [dataC, setDataC] = useState<GiamSatNdnb[]>([]);
  const [dataT, setDataT] = useState<GiamSatNdnbTheokt[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deptList, setDeptList] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({ type: 'thisMonth', startDate: '', endDate: '' });
  const [deptFilter, setDeptFilter] = useState('Tất cả');

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, t, dv] = await Promise.all([fetchGiamSatNdnb(), fetchGiamSatNdnbTheokt(), fetchDmDonVi()]);
      setDataC(c || []); setDataT(t || []); setDeptList(dv || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredDataC = useMemo(() => {
    return dataC.filter(item => {
      const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const matchedDate = isDateInRange(item.ngay_giam_sat, range);
      const matchedDept = deptFilter === 'Tất cả' || item.khoa_duoc_giam_sat === deptFilter;
      return matchedDate && matchedDept;
    });
  }, [dataC, dateFilter, deptFilter]);

  const filteredDataT = useMemo(() => {
    return dataT.filter(item => {
      const range = getDateRange(dateFilter.type, dateFilter.startDate, dateFilter.endDate);
      const matchedDate = isDateInRange(item.ngay_giam_sat, range);
      const matchedDept = deptFilter === 'Tất cả' || item.khoa_duoc_giam_sat === deptFilter;
      return matchedDate && matchedDept;
    });
  }, [dataT, dateFilter, deptFilter]);

  const currentCriteria = activeTab === 'TECHNIQUE' ? CRITERIA_NDNB_KT : CRITERIA_NDNB;

  const handleSave = async (payload: any) => {
    try {
      if (activeTab === 'CRITERIA') {
        if (editingItem?.id) await updateGiamSatNdnb(editingItem.id, payload);
        else await addGiamSatNdnb(payload);
      } else {
        if (editingItem?.id) await updateGiamSatNdnbTheokt(editingItem.id, payload);
        else await addGiamSatNdnbTheokt(payload);
      }
      setViewMode('LIST'); setEditingItem(null); loadData();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa bản ghi này?')) return;
    try {
      if (activeTab === 'CRITERIA') await deleteGiamSatNdnb(id);
      else await deleteGiamSatNdnbTheokt(id);
      loadData();
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-6rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-white p-1.5 gap-1 rounded-[28px] border border-slate-200 shrink-0 shadow-sm">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} icon={LayoutDashboard} label="Tổng quan" />
            <TabButton active={activeTab === 'CRITERIA'} onClick={() => { setActiveTab('CRITERIA'); setViewMode('LIST'); }} icon={Users} label="Nhận diện đúng NB" />
            <TabButton active={activeTab === 'TECHNIQUE'} onClick={() => { setActiveTab('TECHNIQUE'); setViewMode('LIST'); }} icon={Activity} label="Thời điểm & Kỹ thuật" />
            <TabButton active={activeTab === 'REPORT'} onClick={() => { setActiveTab('REPORT'); setViewMode('LIST'); }} icon={BarChart3} label="Tổng hợp" />
          </div>
          {(activeTab === 'OVERVIEW' || activeTab === 'REPORT') && viewMode === 'LIST' && (
            <button onClick={() => { setEditingItem(null); setActiveTab('CRITERIA'); setViewMode('FORM'); }} className="flex items-center justify-center gap-2 rounded-2xl bg-[#059669] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-green-200 transition-all hover:bg-[#0d6e39] active:scale-95">
              <Plus size={18} /> Thêm giám sát mới
            </button>
          )}
        </div>

        {/* Filters */}
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
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none ring-blue-500/10 focus:ring-4 transition-all"
              >
                <option value="Tất cả">Tất cả khoa</option>
                {deptList.map(dept => (
                  <option key={dept.ten_don_vi} value={dept.ten_don_vi}>{dept.ten_don_vi}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setDateFilter({ type: 'thisMonth', startDate: '', endDate: '' }); setDeptFilter('Tất cả'); }}
                className="w-full p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg border border-dashed border-slate-300 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw size={14} className="inline mr-2" /> Xóa lọc
              </button>
            </div>
          </div>
        </div>


        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {activeTab === 'OVERVIEW' && <CombinedOverview dataCriteria={filteredDataC} dataTech={filteredDataT} />}
            {activeTab === 'REPORT' && <ReportTab dataCriteria={filteredDataC} dataTech={filteredDataT} />}

            {(activeTab === 'CRITERIA' || activeTab === 'TECHNIQUE') && (
              viewMode === 'LIST' ? (
                <ModuleListView type={activeTab} data={activeTab === 'CRITERIA' ? filteredDataC : filteredDataT} onAdd={() => { setEditingItem(null); setViewMode('FORM'); }} onView={(i: any) => { setEditingItem(i); setViewMode('DETAIL'); }} onEdit={(i: any) => { setEditingItem(i); setViewMode('FORM'); }} onDelete={handleDelete} />
              ) : viewMode === 'FORM' ? (
                <MergedForm type={activeTab} item={editingItem} criteria={currentCriteria} currentUser={user} departmentList={deptList} onSaved={handleSave} onClose={() => setViewMode('LIST')} />
              ) : (
                <MergedDetail type={activeTab} item={editingItem} criteria={currentCriteria} currentUser={user} onClose={() => setViewMode('LIST')} onEdit={() => setViewMode('FORM')} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── REUSABLE FORM COMPONENT ──────────────────────────────────────────────────
const MergedForm = ({ type, item, criteria, currentUser, departmentList, onSaved, onClose }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item } : defaultForm(currentUser?.full_name || '', criteria));
  const [saving, setSaving] = useState(false);

  const setField = (key: string, val: any) => {
    setForm((p: any) => {
      const updated = { ...p, [key]: val };
      const s = calcStats(updated, criteria);
      return { ...updated, ...s };
    });
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
      <div className={`p-7 border-b border-slate-50 flex justify-between items-center bg-[#059669]/5`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-[#059669]`}>
            {type === 'CRITERIA' ? <Users size={22} /> : <Activity size={22} />}
          </div>
          <div>
            <h2 className="text-main-title font-bold text-slate-800 uppercase leading-tight">{item?.id ? 'Sửa' : 'Thêm'} phiếu: {type === 'CRITERIA' ? 'Nhận diện đúng NB' : 'Theo Kỹ thuật'}</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{type === 'CRITERIA' ? 'Tiêu chí định danh cốt lõi' : 'Kiểm soát tại các thời điểm rủi ro'}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSaved(form); }} className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 bg-slate-50 p-5 rounded-[28px] border border-slate-100 shadow-inner">
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Ngày giám sát</label><input type="date" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Người giám sát</label><input value={form.nguoi_giam_sat} onChange={e => setField('nguoi_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Khoa được GS</label><input list="merged-dv-list" value={form.khoa_duoc_giam_sat} onChange={e => setField('khoa_duoc_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /><datalist id="merged-dv-list">{departmentList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist></div>
           <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Đối tượng GS</label><input value={form.doi_tuong_giam_sat} onChange={e => setField('doi_tuong_giam_sat', e.target.value)} required className="w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none" /></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
           <div className={`p-4 text-white text-[10px] font-black uppercase tracking-widest bg-[#059669]`}>Nội dung kiểm tra chi tiết</div>
           <div className="divide-y divide-slate-50">
             {criteria.map((c: any, i: number) => {
               const isPass = form[c.id] !== false;
               const noteKey = `c${i+1}_ghi_chu`;
               return (
                 <div key={c.id} className={`p-5 flex flex-col gap-3 ${!isPass ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-start gap-4">
                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-[10px] font-black text-slate-400 mt-1">{i+1}</span>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 leading-snug">{c.label}</p>
                          {c.note && <p className="text-[9px] font-bold text-red-500 italic mt-1 leading-tight">Yêu cầu: {c.note}</p>}
                       </div>
                       <DatKhongDatToggle value={isPass} onChange={v => setField(c.id, v)} />
                    </div>
                    {!isPass && (
                      <div className="ml-10"><input value={form[noteKey] || ''} onChange={e => setField(noteKey, e.target.value)} placeholder="Mô tả sai sót..." className="w-full p-2.5 bg-white border border-red-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-200" /></div>
                    )}
                 </div>
               );
             })}
           </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-6">
             <div className="text-center"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tuân thủ</p><p className={`text-3xl font-black ${form.ty_le_tuan_thu === 100 ? 'text-[#059669]' : 'text-red-500'}`}>{form.ty_le_tuan_thu}%</p></div>
             <div className="h-10 w-px bg-slate-100"/>
             <div className="text-sm font-bold text-slate-600">Đạt {form.tong_dat}/{form.tong_tieu_chi} tiêu chí</div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button type="button" onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Đóng</button>
             <button type="submit" className={`flex-1 md:flex-none px-12 py-3.5 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl transition-all bg-[#059669] hover:bg-[#008800] shadow-green-100`}>Lưu phiếu</button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── REUSABLE DETAIL VIEW ─────────────────────────────────────────────────────
const MergedDetail = ({ type, item, criteria, currentUser, onClose, onEdit }: any) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Quản trị viên';
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-2 bg-[#059669]`}/>
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center no-print">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px]"><RotateCcw size={14}/> Quay lại</button>
          <div className="flex gap-3">
             <button onClick={() => window.print()} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"><FileText size={18}/></button>
             {isAdmin && <button onClick={onEdit} className={`px-6 py-3 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg bg-[#059669] shadow-green-100`}>Sửa dữ liệu</button>}
          </div>
        </div>

        <div className="text-center space-y-3">
           <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto shadow-xl mb-4 ${type === 'CRITERIA' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>{type === 'CRITERIA' ? <Users size={32}/> : <Activity size={32}/>}</div>
           <h1 className="text-main-title font-bold text-slate-900 uppercase leading-tight tracking-tight">BẢNG KIỂM GIÁM SÁT NHẬN DIỆN NGƯỜI BỆNH<br/><span className={type === 'CRITERIA' ? 'text-blue-600' : 'text-emerald-600'}>{type === 'CRITERIA' ? 'THEO TIÊU CHÍ ĐỊNH DANH' : 'THEO THỜI ĐIỂM & KỸ THUẬT'}</span></h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-dashed border-slate-200">
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đơn vị được GS</p><p className="text-sm font-black text-slate-800 uppercase">{item.khoa_duoc_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đối tượng GS</p><p className="text-sm font-black text-slate-800 uppercase">{item.doi_tuong_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Người giám sát</p><p className="text-sm font-black text-slate-800 uppercase">{item.nguoi_giam_sat}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày giám sát</p><p className="text-sm font-black text-slate-800">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-4 border-slate-900 text-[12pt]">
            <thead className="bg-[#059669] text-white font-bold uppercase text-table">
               <tr><th className="p-4 border-2 border-slate-900 w-10">STT</th><th className="p-4 border-2 border-slate-900 text-left">Nội dung giám sát</th><th className="p-4 border-2 border-slate-900 w-24">Kết quả</th><th className="p-4 border-2 border-slate-900">Ghi chú vi phạm</th></tr>
            </thead>
            <tbody className="font-normal text-slate-700">
               {criteria.map((c: any, i: number) => {
                 const isPass = (item as any)[c.id] !== false;
                 return (
                   <tr key={c.id} className={!isPass ? 'bg-red-50' : ''}>
                     <td className="p-4 border-2 border-slate-900 text-center text-slate-400">{i+1}</td>
                     <td className="p-4 border-2 border-slate-900 leading-snug">{c.label}</td>
                     <td className="p-4 border-2 border-slate-900 text-center">{isPass ? <span className="text-[#059669]">ĐẠT</span> : <span className="text-red-600">KHÔNG ĐẠT</span>}</td>
                     <td className="p-4 border-2 border-slate-900 italic text-red-500 font-black">{(item as any)[`c${i+1}_ghi_chu`]}</td>
                   </tr>
                 );
               })}
                <tr className="bg-slate-100 font-black">
                 <td colSpan={2} className="p-4 border-2 border-slate-900 uppercase text-right">Tổng hợp tỷ lệ tuân thủ</td>
                 <td className="p-4 border-2 border-slate-900 text-center text-xl">{item.ty_le_tuan_thu}%</td>
                 <td className="p-4 border-2 border-slate-900 text-slate-500">Đạt {item.tong_dat}/{item.tong_tieu_chi} tiêu chí</td>
               </tr>
            </tbody>
          </table>
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

export default NdnbMonitoringModule;
