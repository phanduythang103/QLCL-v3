import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, List, BarChart3, Plus, Eye, Edit2, Trash2,
  X, Loader2, Search, FileText, RotateCcw, Camera,
  CheckCircle2, XCircle, TrendingUp, Building2, User, Calendar,
  Users, AlertTriangle, CheckSquare, Shield, Activity
} from 'lucide-react';
import {
  fetchGiamSatNdnbTheokt, addGiamSatNdnbTheokt, updateGiamSatNdnbTheokt,
  deleteGiamSatNdnbTheokt, GiamSatNdnbTheokt
} from '../readGiamSatNdnbTheokt';
import { uploadNdnbImage } from '../readGiamSatNdnb'; // Re-use upload from the other NDNB module
import { fetchDmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── CRITERIA ─────────────────────────────────────────────────────────────────
export const CRITERIA_NDNB_KT = [
  {
    id: 'c1_thuoc_truyen_dich',
    label: 'Trước khi dùng thuốc/ Truyền dịch',
    note: 'Đối chiếu 5 đúng; kiểm tra tiền sử dị ứng',
  },
  {
    id: 'c2_lay_mau_xn',
    label: 'Trước khi lấy mẫu xét nghiệm',
    note: 'Dán nhãn ống nghiệm ngay tại giường sau khi đối chiếu',
  },
  {
    id: 'c3_thu_thuat_pt',
    label: 'Trước khi thực hiện Thủ thuật/Phẫu thuật',
    note: 'Hỏi thêm vị trí thủ thuật, bên trái/phải (nếu có)',
  },
  {
    id: 'c4_ban_giao_nb',
    label: 'Trước khi bàn giao người bệnh',
    note: 'Hai NVYT cùng đối chiếu thông tin trên vòng và HSBA',
  },
  {
    id: 'c5_chan_doan_ha',
    label: 'Trước khi thực hiện chẩn đoán hình ảnh (X-quang, CT...)',
    note: 'Đối chiếu thông tin chỉ định với NB tại phòng chụp',
  },
  {
    id: 'c6_cap_phat_thuoc',
    label: 'Trước khi cấp phát thuốc tại nhà thuốc',
    note: 'Kiểm tra thông tin hành chính trên đơn và thẻ BHYT/CCCD',
  },
];

const TOTAL_CRITERIA = CRITERIA_NDNB_KT.length;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const calcStats = (form: any) => {
  const dat = CRITERIA_NDNB_KT.filter(c => form[c.id] !== false).length;
  const ty_le = Math.round((dat / TOTAL_CRITERIA) * 100 * 100) / 100;
  return { tong_dat: dat, tong_tieu_chi: TOTAL_CRITERIA, ty_le_tuan_thu: ty_le };
};

const defaultForm = (userName = ''): any => {
  const base: any = {
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: userName,
    khoa_duoc_giam_sat: '',
    doi_tuong_giam_sat: '',
    nhan_xet: '',
    hinh_anh_minh_chung: [],
    tong_dat: TOTAL_CRITERIA,
    tong_tieu_chi: TOTAL_CRITERIA,
    ty_le_tuan_thu: 100,
  };
  CRITERIA_NDNB_KT.forEach((c, i) => {
    base[c.id] = true;
    base[`c${i + 1}_ghi_chu`] = '';
  });
  return base;
};

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`supervision-tab-button flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-blue-700 shadow-lg border border-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
    <Icon size={15} />{label}
  </button>
);

const StatCard = ({ icon, label, value, color }: any) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-[#009900]',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white p-3 rounded-[20px] border border-slate-200 shadow-sm flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>{React.cloneElement(icon, { size: 18 })}</div>
      <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p><h3 className="text-sm font-black text-slate-800">{value}</h3></div>
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
    <button
      type="button"
      onClick={() => onChange(true)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${value ? 'bg-[#009900] text-white border-[#009900] shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-green-300'}`}
    >
      <CheckCircle2 size={12} /> Đạt
    </button>
    <button
      type="button"
      onClick={() => onChange(false)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border ${!value ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'}`}
    >
      <XCircle size={12} /> Không đạt
    </button>
  </div>
);

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const NdnbTheoktOverview = ({ data }: { data: GiamSatNdnbTheokt[] }) => {
  const stats = useMemo(() => {
    if (!data.length) return { total: 0, avg: 0, full: 0, fail: 0 };
    const avg = data.reduce((s, d) => s + (d.ty_le_tuan_thu || 0), 0) / data.length;
    const full = data.filter(d => (d.ty_le_tuan_thu || 0) === 100).length;
    const fail = data.filter(d => (d.ty_le_tuan_thu || 0) < 100).length;
    return { total: data.length, avg, full, fail };
  }, [data]);

  const chartData = useMemo(() => {
    const map: Record<string, { date: string; count: number; total: number }> = {};
    data.forEach(d => {
      const key = new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!map[key]) map[key] = { date: key, count: 0, total: 0 };
      map[key].count++;
      map[key].total += d.ty_le_tuan_thu || 0;
    });
    return Object.values(map).map(r => ({ ...r, avg: Number((r.total / r.count).toFixed(1)) }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Shield />} label="Tổng lượt GS" value={stats.total} color="blue" />
        <StatCard icon={<TrendingUp />} label="Tỷ lệ TB" value={`${stats.avg.toFixed(1)}%`} color="green" />
        <StatCard icon={<CheckSquare />} label="Tuân thủ 100%" value={stats.full} color="green" />
        <StatCard icon={<AlertTriangle />} label="Có vi phạm" value={stats.fail} color="red" />
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-72">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={15} className="text-blue-600" /> Xu hướng tỷ lệ tuân thủ</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip formatter={(v: any) => [`${v}%`]} />
            <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} name="Tỷ lệ TB (%)" />
            <Line type="monotone" dataKey="avg" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Trend" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── LIST ─────────────────────────────────────────────────────────────────────
const NdnbTheoktList = ({ data, onView, onEdit, onDelete }: any) => {
  const [search, setSearch] = useState('');
  const filtered = data.filter((d: GiamSatNdnbTheokt) =>
    d.khoa_duoc_giam_sat.toLowerCase().includes(search.toLowerCase()) ||
    d.nguoi_giam_sat.toLowerCase().includes(search.toLowerCase()) ||
    d.doi_tuong_giam_sat.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input placeholder="Tìm khoa, người GS, đối tượng..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-4">Ngày</th>
              <th className="p-4">Khoa được GS</th>
              <th className="p-4">Đối tượng GS</th>
              <th className="p-4">Người GS</th>
              <th className="p-4 text-center">Tỷ lệ</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((d: GiamSatNdnbTheokt) => {
              const rate = d.ty_le_tuan_thu || 0;
              const color = rate === 100 ? 'text-[#009900]' : rate >= 70 ? 'text-amber-600' : 'text-red-500';
              return (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm font-bold text-slate-600">{new Date(d.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-sm font-bold text-slate-700">{d.khoa_duoc_giam_sat}</td>
                  <td className="p-4 text-sm text-slate-600">{d.doi_tuong_giam_sat}</td>
                  <td className="p-4 text-xs text-slate-400">{d.nguoi_giam_sat}</td>
                  <td className={`p-4 text-center font-black text-lg ${color}`}>{rate}%</td>
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
      <div className="md:hidden divide-y divide-slate-100">
        {filtered.map((d: GiamSatNdnbTheokt) => {
          const rate = d.ty_le_tuan_thu || 0;
          const color = rate === 100 ? 'text-[#009900]' : rate >= 70 ? 'text-amber-600' : 'text-red-500';
          return (
            <div key={d.id} className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase">{d.khoa_duoc_giam_sat}</h4>
                  <p className="text-[10px] text-slate-500">{d.doi_tuong_giam_sat}</p>
                </div>
                <p className={`text-2xl font-black ${color}`}>{rate}%</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onView(d)} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase">Xem</button>
                <button onClick={() => onEdit(d)} className="flex-1 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase">Sửa</button>
                <button onClick={() => onDelete(d.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── FORM ─────────────────────────────────────────────────────────────────────
const NdnbTheoktFormView = ({ item, onClose, onSaved, currentUser, departmentList }: any) => {
  const [form, setForm] = useState<any>(item ? { ...item } : defaultForm(currentUser?.full_name || ''));
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
    if (!form.khoa_duoc_giam_sat) { alert('Vui lòng chọn/nhập khoa'); return; }
    setSaving(true);
    try {
      if (item?.id) await updateGiamSatNdnbTheokt(item.id, form);
      else await addGiamSatNdnbTheokt(form);
      onSaved();
    } catch (err: any) { alert('Lỗi lưu: ' + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
      <div className="p-7 border-b border-slate-100 bg-blue-50/50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg"><Activity size={22} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase">GS Nhận diện NB theo KT/Thời điểm</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kiểm soát an toàn tại các thời điểm quan trọng</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl"><X size={22} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-5 rounded-[28px] border border-slate-100">
           <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Ngày giám sát</label>
            <input type="date" value={form.ngay_giam_sat} onChange={e => setField('ngay_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Người giám sát</label>
            <input value={form.nguoi_giam_sat} onChange={e => setField('nguoi_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Khoa được GS</label>
            <input list="theokt-don-vi-list" value={form.khoa_duoc_giam_sat} onChange={e => setField('khoa_duoc_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" />
            <datalist id="theokt-don-vi-list">{departmentList.map((d: any) => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}</datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Đối tượng được GS</label>
            <input value={form.doi_tuong_giam_sat} onChange={e => setField('doi_tuong_giam_sat', e.target.value)} required className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none" />
          </div>
        </div>

        <div className="border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="bg-blue-700 text-white px-5 py-3"><h3 className="text-[10px] font-black uppercase">Chi tiết giám sát kỹ thuật</h3></div>
          <div className="divide-y divide-slate-100">
            {CRITERIA_NDNB_KT.map((c, idx) => {
              const noteKey = `c${idx + 1}_ghi_chu`;
              const isPass = form[c.id] !== false;
              return (
                <div key={c.id} className={`p-4 space-y-2 ${!isPass ? 'bg-red-50/40' : ''}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-black text-slate-400 mt-1">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-700">{c.label}</p>
                      <p className="text-[10px] text-blue-500 italic font-bold">Yêu cầu: {c.note}</p>
                    </div>
                    <DatKhongDatToggle value={isPass} onChange={v => setField(c.id, v)} />
                  </div>
                  {!isPass && (
                    <input
                      value={form[noteKey] || ''}
                      onChange={e => setField(noteKey, e.target.value)}
                      placeholder="Ghi chú vi phạm..."
                      className="w-full p-2 bg-white border border-red-200 rounded-lg text-xs font-bold ml-8 w-[calc(100%-2rem)]"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 border-t border-slate-100">
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase">Tỷ lệ tuân thủ</p>
              <p className={`text-2xl font-black ${form.ty_le_tuan_thu === 100 ? 'text-[#009900]' : 'text-red-500'}`}>{form.ty_le_tuan_thu}%</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-sm">Đạt <b>{form.tong_dat}</b>/{form.tong_tieu_chi} mục</div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button type="button" onClick={onClose} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase">Hủy</button>
            <button type="submit" disabled={saving} className="flex-1 md:flex-none px-10 py-3 bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase shadow-xl hover:bg-blue-800 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ─── DETAIL VIEW ──────────────────────────────────────────────────────────────
const NdnbTheoktDetailView = ({ item, currentUser, onClose, onEdit, onDelete }: any) => {
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'Quản trị viên';
  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center no-print">
          <button onClick={onClose} className="text-slate-400 font-black uppercase text-[10px]">Đóng</button>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 italic">In phiếu</button>
            {isAdmin && <button onClick={onDelete} className="text-rose-600 hover:bg-rose-50 p-2 rounded-xl"><Trash2 size={18} /></button>}
          </div>
        </div>

        <div className="text-center space-y-2">
           <div className="flex justify-center mb-2"><Activity className="text-blue-700" size={40} /></div>
          <h1 className="text-2xl font-black text-slate-900 uppercase">GIÁM SÁT NHẬN DIỆN NB THEO KỸ THUẬT & THỜI ĐIỂM</h1>
        </div>

        <div className="grid grid-cols-2 gap-y-4 py-6 border-y-2 border-dashed border-slate-200">
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Khoa được giám sát</p><p className="font-bold text-slate-800 uppercase">{item.khoa_duoc_giam_sat}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Đối tượng giám sát</p><p className="font-bold text-slate-800 uppercase">{item.doi_tuong_giam_sat}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Người giám sát</p><p className="font-bold text-slate-800 uppercase">{item.nguoi_giam_sat}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase">Ngày giám sát</p><p className="font-bold text-slate-800">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p></div>
        </div>

        <div className="space-y-4">
          <table className="w-full border-2 border-slate-800 border-collapse text-[12pt]">
             <thead className="bg-blue-700 text-white font-black uppercase text-[12pt]">
                <tr><th className="p-3 border-2 border-slate-800 w-10">STT</th><th className="p-3 border-2 border-slate-800 text-left">Nội dung / Thời điểm</th><th className="p-3 border-2 border-slate-800">Kết quả</th><th className="p-3 border-2 border-slate-800">Ghi chú</th></tr>
             </thead>
             <tbody>
               {CRITERIA_NDNB_KT.map((c, i) => {
                 const isPass = (item as any)[c.id] !== false;
                 return (
                   <tr key={c.id}>
                     <td className="p-3 border-2 border-slate-800 text-center font-bold">{i+1}</td>
                     <td className="p-3 border-2 border-slate-800 font-bold text-slate-700">{c.label}<br/><span className="text-[9px] text-slate-400 font-normal italic">Yêu cầu: {c.note}</span></td>
                     <td className="p-3 border-2 border-slate-800 text-center">{isPass ? <span className="text-green-600 font-black">ĐẠT</span> : <span className="text-red-500 font-black">KĐ</span>}</td>
                     <td className="p-3 border-2 border-slate-800 italic text-red-500">{(item as any)[`c${i+1}_ghi_chu`]}</td>
                   </tr>
                 );
               })}
               <tr className="bg-slate-100 font-black text-[12pt]">
                 <td colSpan={2} className="p-3 border-2 border-slate-800 uppercase text-right">Tỷ lệ tuân thủ</td>
                 <td className="p-3 border-2 border-slate-800 text-center text-lg">{item.ty_le_tuan_thu}%</td>
                 <td className="p-3 border-2 border-slate-800">Đạt {item.tong_dat}/{item.tong_tieu_chi}</td>
               </tr>
             </tbody>
          </table>
        </div>

         <div className="flex justify-between pt-10 gap-8 h-40 items-end">
          <div className="text-center flex-1"><p className="text-xs font-bold text-slate-800">ĐẠI DIỆN ĐƯỢC GIÁM SÁT</p></div>
          <div className="text-center flex-1">
            <p className="text-xs font-bold text-slate-800 uppercase">Người giám sát</p>
            <p className="text-xs font-black text-slate-900 uppercase underline mt-12">{item.nguoi_giam_sat}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN MODULE ──────────────────────────────────────────────────────────────
export const NdnbTheoktModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH'>('OVERVIEW');
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [data, setData] = useState<GiamSatNdnbTheokt[]>([]);
  const [editingItem, setEditingItem] = useState<GiamSatNdnbTheokt | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentList, setDepartmentList] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [d, dv] = await Promise.all([fetchGiamSatNdnbTheokt(), fetchDmDonVi()]);
      setData(d || []);
      setDepartmentList(dv || []);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-slate-100/50 p-1.5 gap-1 rounded-[28px] border border-slate-200/50 shrink-0">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }} icon={LayoutDashboard} label="Tổng quan" />
            <TabButton active={activeTab === 'DANH_SACH'} onClick={() => { setActiveTab('DANH_SACH'); setViewMode('LIST'); }} icon={List} label="Danh sách" />
          </div>
          {activeTab === 'DANH_SACH' && (
            <button onClick={() => { setEditingItem(null); setViewMode('FORM'); }} className="flex items-center gap-2 bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-xl hover:bg-blue-800">
              <Plus size={17} /> Thêm phiếu
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : activeTab === 'OVERVIEW' ? (
          <NdnbTheoktOverview data={data} />
        ) : viewMode === 'LIST' ? (
          <NdnbTheoktList
            data={data}
            onView={(item: GiamSatNdnbTheokt) => { setEditingItem(item); setViewMode('DETAIL'); }}
            onEdit={(item: GiamSatNdnbTheokt) => { setEditingItem(item); setViewMode('FORM'); }}
            onDelete={async (id: string) => {
              if (window.confirm('Xóa bản ghi này?')) { await deleteGiamSatNdnbTheokt(id); loadData(); }
            }}
          />
        ) : viewMode === 'DETAIL' && editingItem ? (
          <NdnbTheoktDetailView
            item={editingItem}
            currentUser={user}
            onClose={() => setViewMode('LIST')}
            onEdit={() => setViewMode('FORM')}
            onDelete={async () => {
              if (window.confirm('Xóa bản ghi này?')) { await deleteGiamSatNdnbTheokt(editingItem.id!); setViewMode('LIST'); loadData(); }
            }}
          />
        ) : (
          <NdnbTheoktFormView
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

export default NdnbTheoktModule;
