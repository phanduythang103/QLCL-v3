import React, { useState, useEffect } from 'react';
import {
  Clock, BarChart2, Search, Plus, Edit, Trash2, Eye, X,
  CheckCircle2, User, Calendar, ChevronDown, TrendingUp, TrendingDown,
  Activity, Target, FileText, ChevronRight, Building2, AlertCircle,
  Filter, RotateCcw, LayoutDashboard, List
} from 'lucide-react';
import { fetchThoiGianNamVien, ThoiGianNamVien, ThoiGianNamVienInput, addThoiGianNamVien, updateThoiGianNamVien, deleteThoiGianNamVien } from '../readThoiGianNamVien';
import { fetchPhanTichNamVienKeoDai, PhanTichNamVienKeoDai, PhanTichNamVienKeoDaiInput, addPhanTichNamVienKeoDai, updatePhanTichNamVienKeoDai, deletePhanTichNamVienKeoDai } from '../readPhanTichNamVien';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { useAuth } from '../contexts/AuthContext';
import { fetchIndicatorConfigs } from '../readCauHinhCscl';

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
      active ? 'bg-[#009900] text-white shadow-lg shadow-green-900/20 scale-105' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={16} />
    <span className="font-bold uppercase text-table tracking-wider">{label}</span>
  </button>
);

export const LengthOfStayModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH' | 'PHAN_TICH'>('OVERVIEW');
  const [records, setRecords] = useState<ThoiGianNamVien[]>([]);
  const [analyses, setAnalyses] = useState<PhanTichNamVienKeoDai[]>([]);
  const [units, setUnits] = useState<DmDonVi[]>([]);
  const [targetStayTime, setTargetStayTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [filterConfig, setFilterConfig] = useState({
    preset: 'THANG_NAY',
    fromDate: '',
    toDate: '',
    department: 'Tất cả'
  });

  const getTimePresetDates = (preset: string) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    
    switch (preset) {
      case 'HOM_NAY':
        return { from: now.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
      case 'TUAN_NAY': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
      }
      case 'THANG_NAY':
        start.setDate(1);
        return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
      case 'QUY_NAY': {
        const month = now.getMonth();
        start.setMonth(Math.floor(month / 3) * 3);
        start.setDate(1);
        return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
      }
      case 'NAM_NAY':
        start.setMonth(0);
        start.setDate(1);
        return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
      default:
        return { from: '', to: '' };
    }
  };

  useEffect(() => {
    if (filterConfig.preset !== 'TUY_CHON') {
      const dates = getTimePresetDates(filterConfig.preset);
      setFilterConfig(prev => ({ ...prev, fromDate: dates.from, toDate: dates.to }));
    }
  }, [filterConfig.preset]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ThoiGianNamVien | null>(null);

  const [showPtModal, setShowPtModal] = useState(false);
  const [editingPt, setEditingPt] = useState<PhanTichNamVienKeoDai | null>(null);

  // Form State (ThoiGianNamVien)
  const emptyForm = (): ThoiGianNamVienInput & { muc_tieu: number } => ({
    ngay_bao_cao: new Date().toISOString().split('T')[0],
    nguoi_bao_cao: user?.full_name || '',
    don_vi: '',
    tong_luot_ra_vien: 0,
    tong_ngay_dieu_tri: 0,
    muc_tieu: targetStayTime,
  });
  const [form, setForm] = useState(emptyForm());
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const unitDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setShowUnitDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUnits = React.useMemo(() => {
    const term = form.don_vi.toLowerCase();
    if (!term) return units;
    return units.filter(u => 
      u.ten_don_vi.toLowerCase().includes(term) || 
      u.ma_don_vi.toLowerCase().includes(term)
    );
  }, [form.don_vi, units]);

  // Form State (PhanTichNamVienKeoDai)
  const emptyPtForm = (): PhanTichNamVienKeoDaiInput => ({
    ngay_phan_tich: new Date().toISOString().split('T')[0],
    nguoi_phan_tich: user?.full_name || '',
    ma_bn: '',
    chan_doan: '',
    ngay_vao_vien: new Date().toISOString().split('T')[0],
    so_ngay_dieu_tri: 0,
    ly_do_keo_dai: '',
    giai_phap_de_xuat: '',
  });
  const [ptForm, setPtForm] = useState(emptyPtForm());

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, uData, pData, cData] = await Promise.all([
        fetchThoiGianNamVien(),
        fetchDmDonVi(),
        fetchPhanTichNamVienKeoDai(),
        fetchIndicatorConfigs()
      ]);
      setRecords(rData);
      setUnits(uData);
      setAnalyses(pData);

      const stayTimeConfig = cData.find(c =>
        c.ten_chi_so?.toLowerCase().includes('thời gian nằm viện trung bình') ||
        c.ten_chi_so?.toLowerCase().includes('tg nằm viện')
      );
      const stayTimeTarget = stayTimeConfig?.muc_tieu ?? 0;
      setTargetStayTime(stayTimeTarget);

      setError(null);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = React.useMemo(() => {
    return records.filter(r => {
      const matchDept = filterConfig.department === 'Tất cả' || r.don_vi === filterConfig.department;
      const matchFrom = !filterConfig.fromDate || r.ngay_bao_cao >= filterConfig.fromDate;
      const matchTo = !filterConfig.toDate || r.ngay_bao_cao <= filterConfig.toDate;
      return matchDept && matchFrom && matchTo;
    });
  }, [records, filterConfig]);

  const filteredAnalyses = React.useMemo(() => {
    return analyses.filter(a => {
      const matchFrom = !filterConfig.fromDate || a.ngay_phan_tich >= filterConfig.fromDate;
      const matchTo = !filterConfig.toDate || a.ngay_phan_tich <= filterConfig.toDate;
      return matchFrom && matchTo;
    });
  }, [analyses, filterConfig]);

  const departmentList = React.useMemo(() => {
    return Array.from(new Set(units.map(u => u.ten_don_vi))).filter(Boolean).sort();
  }, [units]);
  useEffect(() => { loadData(); }, []);

  const handleAdd = () => {
    setEditingRecord(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const handleEdit = (r: ThoiGianNamVien) => {
    setEditingRecord(r);
    setForm({
      ngay_bao_cao: r.ngay_bao_cao,
      nguoi_bao_cao: r.nguoi_bao_cao,
      don_vi: r.don_vi,
      tong_luot_ra_vien: r.tong_luot_ra_vien,
      tong_ngay_dieu_tri: r.tong_ngay_dieu_tri,
      muc_tieu: targetStayTime,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa báo cáo này?')) return;
    try {
      await deleteThoiGianNamVien(id);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateThoiGianNamVien(editingRecord.id, form);
      } else {
        await addThoiGianNamVien(form);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // ── Phân tích CRUD ──
  const handleAddPt = () => {
    setEditingPt(null);
    setPtForm(emptyPtForm());
    setShowPtModal(true);
  };

  const handleEditPt = (a: PhanTichNamVienKeoDai) => {
    setEditingPt(a);
    setPtForm({
      ngay_phan_tich: a.ngay_phan_tich,
      nguoi_phan_tich: a.nguoi_phan_tich,
      ma_bn: a.ma_bn,
      chan_doan: a.chan_doan,
      ngay_vao_vien: a.ngay_vao_vien,
      so_ngay_dieu_tri: a.so_ngay_dieu_tri,
      ly_do_keo_dai: a.ly_do_keo_dai,
      giai_phap_de_xuat: a.giai_phap_de_xuat || '',
    });
    setShowPtModal(true);
  };

  const handleDeletePt = async (id: string) => {
    if (!window.confirm('Xóa phân tích này?')) return;
    try {
      await deletePhanTichNamVienKeoDai(id);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleSavePt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPt) {
        await updatePhanTichNamVienKeoDai(editingPt.id, ptForm);
      } else {
        await addPhanTichNamVienKeoDai(ptForm);
      }
      setShowPtModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Stats
  const avgStay = filteredRecords.length > 0 
    ? (filteredRecords.reduce((a, b) => a + b.ngay_tb, 0) / filteredRecords.length).toFixed(2)
    : '0.00';
  const totalDischarges = filteredRecords.reduce((a, b) => a + b.tong_luot_ra_vien, 0);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Ngày điều trị trung bình', value: avgStay, unit: 'ngày', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tổng lượt ra viện', value: totalDischarges, unit: 'lượt', icon: User, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Số đơn vị báo cáo', value: new Set(records.map(r => r.don_vi)).size, unit: 'đơn vị', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
              <Icon size={28} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
              <p className="text-lg font-bold text-slate-800 tracking-tight">{value} <span className="text-sm font-normal text-slate-400">{unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black uppercase text-sm text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-[#009900]" /> 
            Báo cáo mới nhất
          </h3>
          <button onClick={() => setActiveTab('DANH_SACH')} className="text-[#009900] text-xs font-black uppercase hover:underline">Xem danh sách</button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#009900] text-white font-bold uppercase text-[14px]">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Ngày báo cáo</th>
                <th className="px-6 py-4">Đơn vị</th>
                <th className="px-6 py-4 text-center">Lượt RV</th>
                <th className="px-6 py-4 text-center">Ngày điều trị</th>
                <th className="px-6 py-4 text-center">Trung bình</th>
                <th className="px-6 py-4 text-center">Mục tiêu</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">Chênh lệch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-table font-normal">
              {filteredRecords.slice(0, 5).map(r => (
                <tr key={r.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-600">{r.ngay_bao_cao.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{r.don_vi}</td>
                  <td className="px-6 py-4 text-center font-bold">{r.tong_luot_ra_vien}</td>
                  <td className="px-6 py-4 text-center font-bold">{r.tong_ngay_dieu_tri}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{r.ngay_tb}</td>
                  <td className="px-6 py-4 text-center font-bold text-slate-400">{r.muc_tieu}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      {r.chenh_lech > 0 ? (
                        <div className="flex items-center gap-1 text-red-600 font-bold">
                          <TrendingUp size={14} /> +{r.chenh_lech}
                        </div>
                      ) : r.chenh_lech < 0 ? (
                        <div className="flex items-center gap-1 text-[#009900] font-bold">
                          <TrendingDown size={14} /> {r.chenh_lech}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold">0</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-50">
          {filteredRecords.slice(0, 5).map(r => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">{r.ngay_bao_cao.split('-').reverse().join('/')}</p>
                  <p className="text-xs font-black text-slate-800">{r.don_vi}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Ngày ĐTTB</p>
                  <p className="text-sm font-black text-blue-600">{r.ngay_tb}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Lượt RV</p>
                    <p className="text-xs font-black text-slate-700">{r.tong_luot_ra_vien}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Số ngày ĐT</p>
                    <p className="text-xs font-black text-slate-700">{r.tong_ngay_dieu_tri}</p>
                  </div>
                </div>
                <div>
                   {r.chenh_lech > 0 ? (
                    <div className="flex items-center gap-1 text-red-600 font-black text-xs bg-red-50 px-2 py-1 rounded-full">
                      <TrendingUp size={12} /> +{r.chenh_lech}
                    </div>
                  ) : r.chenh_lech < 0 ? (
                    <div className="flex items-center gap-1 text-[#009900] font-black text-xs bg-green-50 px-2 py-1 rounded-full">
                      <TrendingDown size={12} /> {r.chenh_lech}
                    </div>
                  ) : (
                    <span className="text-slate-400 font-bold text-xs">0 (Đạt mục tiêu)</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDanhSach = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Tìm theo đơn vị, người báo cáo..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-table font-bold focus:ring-2 focus:ring-[#009900]/20" 
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#009900] text-white font-bold uppercase text-[14px] text-center">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl text-left">Ngày</th>
                <th className="px-6 py-4 text-left">Đơn vị</th>
                <th className="px-6 py-4">Lượt RV</th>
                <th className="px-6 py-4">Ngày ĐT</th>
                <th className="px-6 py-4">Trung bình</th>
                <th className="px-6 py-4">Mục tiêu</th>
                <th className="px-6 py-4">Chênh lệch</th>
                <th className="px-6 py-4 rounded-tr-xl text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-table font-normal">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-600">{r.ngay_bao_cao.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{r.don_vi}</td>
                  <td className="px-6 py-4 font-bold">{r.tong_luot_ra_vien}</td>
                  <td className="px-6 py-4 font-bold">{r.tong_ngay_dieu_tri}</td>
                  <td className="px-6 py-4 font-bold text-center text-blue-600">{r.ngay_tb}</td>
                  <td className="px-6 py-4 font-bold text-center text-slate-400">{r.muc_tieu}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      {r.chenh_lech > 0 ? (
                        <div className="flex items-center gap-1 text-red-600 font-bold">
                          <TrendingUp size={14} /> +{r.chenh_lech}
                        </div>
                      ) : r.chenh_lech < 0 ? (
                        <div className="flex items-center gap-1 text-[#009900] font-bold">
                          <TrendingDown size={14} /> {r.chenh_lech}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold">0</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(r)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {filteredRecords.map(r => (
            <div key={r.id} className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{r.ngay_bao_cao.split('-').reverse().join('/')}</p>
                  <p className="text-sm font-black text-slate-800">{r.don_vi}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(r)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Ngày ĐTTB</p>
                  <p className="text-sm font-black text-blue-600">{r.ngay_tb} <span className="text-[10px] text-slate-400">ngày</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Mục tiêu</p>
                  <p className="text-sm font-black text-slate-500">{r.muc_tieu} <span className="text-[10px] text-slate-400">ngày</span></p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Lượt RV</p>
                  <p className="text-xs font-bold text-slate-700">{r.tong_luot_ra_vien}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Chênh lệch</p>
                  {r.chenh_lech > 0 ? (
                    <p className="text-xs font-black text-red-600 flex items-center gap-1"><TrendingUp size={12}/> +{r.chenh_lech}</p>
                  ) : r.chenh_lech < 0 ? (
                    <p className="text-xs font-black text-[#009900] flex items-center gap-1"><TrendingDown size={12}/> {r.chenh_lech}</p>
                  ) : <p className="text-xs font-bold text-slate-400">0</p>}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">Chưa có dữ liệu</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPhanTich = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Tìm theo mã BN, chẩn đoán..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#009900]/20" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnalyses.map(a => (
          <div key={a.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col p-6 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{a.ngay_phan_tich.split('-').reverse().join('/')}</p>
                <h4 className="text-sm font-black text-slate-800 mt-1">BN: {a.ma_bn}</h4>
                <p className="text-xs font-bold text-slate-500 mt-0.5 line-clamp-1">{a.chan_doan}</p>
              </div>
              <div className="bg-blue-50 px-3 py-1.5 rounded-full text-blue-700 font-black text-xs">
                {a.so_ngay_dieu_tri} ngày
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Lý do kéo dài</p>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">{a.ly_do_keo_dai}</p>
              </div>
              {a.giai_phap_de_xuat && (
                <div>
                  <p className="text-[9px] font-black uppercase text-[#009900]">Giải pháp đề xuất</p>
                  <p className="text-xs font-bold text-[#009900] leading-relaxed">{a.giai_phap_de_xuat}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400"><User size={10} className="inline mr-1" /> {a.nguoi_phan_tich}</span>
              <div className="flex gap-2">
                <button onClick={() => handleEditPt(a)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16} /></button>
                <button onClick={() => handleDeletePt(a.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
        {filteredAnalyses.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40">
            <AlertCircle size={40} className="mb-4" />
            <p className="text-xs font-black uppercase tracking-widest">Chưa có phân tích nào</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0 border border-blue-200">
            <Clock size={28} />
          </div>
          <div>
            <h2 className="text-main-title font-bold text-slate-800 tracking-tight uppercase">Thời gian nằm viện trung bình</h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">Phân tích & Tối ưu hóa thời gian điều trị</p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex bg-slate-100/50 p-1.5 gap-1 rounded-[28px] border border-slate-200/50 shrink-0 self-start">
            <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={LayoutDashboard} label="Tổng quan" />
            <TabButton active={activeTab === 'DANH_SACH'} onClick={() => setActiveTab('DANH_SACH')} icon={List} label="Danh sách" />
            <TabButton active={activeTab === 'PHAN_TICH'} onClick={() => setActiveTab('PHAN_TICH')} icon={Activity} label="Phân tích" />
          </div>

          <button 
            onClick={activeTab === 'PHAN_TICH' ? handleAddPt : handleAdd}
            className="bg-[#009900] text-white px-8 py-3.5 rounded-[24px] flex items-center gap-2 text-[11px] font-black uppercase hover:shadow-lg hover:shadow-green-900/20 active:scale-95 transition-all shadow-md group"
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-300">
              <Plus size={18} />
            </div>
            {activeTab === 'PHAN_TICH' ? 'Thêm phân tích mới' : 'Thêm báo cáo mới'}
          </button>
        </div>

        <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Bộ lọc dữ liệu</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tối ưu hóa phạm vi hiển thị</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                <Calendar size={12} /> Thời gian
              </label>
              <select 
                value={filterConfig.preset}
                onChange={(e) => setFilterConfig({ ...filterConfig, preset: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="HOM_NAY">Hôm nay</option>
                <option value="TUAN_NAY">Tuần này</option>
                <option value="THANG_NAY">Tháng này</option>
                <option value="QUY_NAY">Quý này</option>
                <option value="NAM_NAY">Năm nay</option>
                <option value="TUY_CHON">Tùy chọn</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                <Building2 size={12} /> Đơn vị (Khoa)
              </label>
              <select 
                value={filterConfig.department}
                onChange={(e) => setFilterConfig({ ...filterConfig, department: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-green-500/20 cursor-pointer"
              >
                <option value="Tất cả">Tất cả khoa</option>
                {departmentList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {filterConfig.preset === 'TUY_CHON' && (
              <div className="md:col-span-2 flex items-center gap-4 animate-in slide-in-from-left-4">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-1">TỪ NGÀY</label>
                  <input type="date" value={filterConfig.fromDate} onChange={e => setFilterConfig({...filterConfig, fromDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[13px] font-bold" />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-1">ĐẾN NGÀY</label>
                  <input type="date" value={filterConfig.toDate} onChange={e => setFilterConfig({...filterConfig, toDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-[13px] font-bold" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="hidden lg:block h-10 w-px bg-slate-100 mx-2" />
              {(filterConfig.preset !== 'THANG_NAY' || filterConfig.department !== 'Tất cả') && (
                <button 
                  onClick={() => setFilterConfig({ preset: 'THANG_NAY', fromDate: '', toDate: '', department: 'Tất cả' })}
                  className="flex-1 bg-red-50 text-red-600 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100 shadow-sm"
                >
                  <RotateCcw size={16} /> Xóa lọc
                </button>
              )}
              <div className="text-right ml-auto px-4 border-l border-slate-50 hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hiển thị</p>
                <p className="text-xs font-black text-blue-600 uppercase tabular-nums">
                  {activeTab === 'PHAN_TICH' ? filteredAnalyses.length : filteredRecords.length} kết quả
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-300">
            <AlertCircle size={40} className="text-red-500" />
            <div className="text-center">
              <p className="text-sm font-black text-red-800 uppercase tracking-tight">Cảnh báo hệ thống</p>
              <p className="text-xs font-bold text-red-600 mt-1">{error}</p>
            </div>
            <button 
              onClick={loadData}
              className="px-6 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'DANH_SACH' && renderDanhSach()}
            {activeTab === 'PHAN_TICH' && renderPhanTich()}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800">{editingRecord ? 'Cập nhật báo cáo' : 'Báo cáo nằm viện mới'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vui lòng nhập đầy đủ thông tin</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày báo cáo</label>
                  <input 
                    type="date" 
                    value={form.ngay_bao_cao} 
                    onChange={e => setForm({ ...form, ngay_bao_cao: e.target.value })} 
                    className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Người báo cáo</label>
                  <input 
                    value={form.nguoi_bao_cao} 
                    readOnly
                    className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold opacity-70"
                  />
                </div>
              </div>

              <div className="space-y-1.5 relative" ref={unitDropdownRef}>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Building2 size={12} /> Đơn vị</label>
                <div className="relative group">
                  <input 
                    placeholder="Nhập hoặc chọn đơn vị..."
                    value={form.don_vi} 
                    onChange={e => {
                      setForm({ ...form, don_vi: e.target.value });
                      setShowUnitDropdown(true);
                    }} 
                    onFocus={() => setShowUnitDropdown(true)}
                    className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all" 
                    required 
                  />
                  <ChevronDown 
                    size={16} 
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-300 pointer-events-none ${showUnitDropdown ? 'rotate-180' : ''}`} 
                  />
                </div>

                {showUnitDropdown && units.length > 0 && filteredUnits.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[240px] overflow-y-auto custom-scrollbar">
                    {filteredUnits.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, don_vi: u.ten_don_vi });
                          setShowUnitDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group/item"
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-700 group-hover/item:text-blue-700 transition-colors">{u.ten_don_vi}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.ma_don_vi}</span>
                        </div>
                        <CheckCircle2 size={14} className="text-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
                
                {showUnitDropdown && units.length > 0 && filteredUnits.length === 0 && form.don_vi && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 text-center animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Không tìm thấy đơn vị phù hợp với "{form.don_vi}"</p>
                    <p className="text-[11px] font-bold text-slate-600 mt-1 italic">Hệ thống sẽ lưu tên bạn vừa nhập</p>
                  </div>
                )}

                {showUnitDropdown && units.length === 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 text-center animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Chưa có dữ liệu danh mục đơn vị</p>
                    <p className="text-[11px] font-bold text-slate-600 mt-1 italic">Vui lòng kiểm tra lại bảng danh mục đơn vị</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Tổng lượt ra viện</label>
                  <input 
                    type="number" 
                    value={form.tong_luot_ra_vien || ''} 
                    onChange={e => setForm({ ...form, tong_luot_ra_vien: Number(e.target.value) })} 
                    className="w-full px-5 py-3 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-500/20 shadow-sm" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Clock size={12} /> Tổng số ngày điều trị</label>
                  <input 
                    type="number" 
                    value={form.tong_ngay_dieu_tri || ''} 
                    onChange={e => setForm({ ...form, tong_ngay_dieu_tri: Number(e.target.value) })} 
                    className="w-full px-5 py-3 bg-white border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-blue-500/20 shadow-sm" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1.5"><Target size={12} /> Mục tiêu (ngày) (Đồng bộ cấu hình)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={form.muc_tieu || ''} 
                    readOnly
                    className="w-32 px-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-black text-blue-700 opacity-70 cursor-not-allowed shadow-sm focus:outline-none"
                    required 
                  />
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Trung bình tự tính</p>
                  <p className="text-2xl font-black text-blue-700">
                    {form.tong_luot_ra_vien > 0 ? (form.tong_ngay_dieu_tri / form.tong_luot_ra_vien).toFixed(2) : '0.00'} 
                    <span className="text-xs ml-1">ngày</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> {editingRecord ? 'Cập nhật' : 'Lưu báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPtModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-slate-800">{editingPt ? 'Cập nhật phân tích' : 'Phân tích ca kéo dài'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Xác định lý do nằm viện kéo dài</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPtModal(false)}
                className="p-3 text-slate-400 hover:bg-white hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSavePt} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày phân tích</label>
                  <input type="date" value={ptForm.ngay_phan_tich} onChange={e => setPtForm({ ...ptForm, ngay_phan_tich: e.target.value })} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><User size={12} /> Người phân tích</label>
                  <input value={ptForm.nguoi_phan_tich} readOnly className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold opacity-70" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Activity size={12} /> Mã người bệnh</label>
                  <input value={ptForm.ma_bn} onChange={e => setPtForm({ ...ptForm, ma_bn: e.target.value })} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500/20" placeholder="VD: BN001" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><TrendingUp size={12} /> Số ngày điều trị</label>
                  <input type="number" value={ptForm.so_ngay_dieu_tri || ''} onChange={e => setPtForm({ ...ptForm, so_ngay_dieu_tri: Number(e.target.value) })} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500/20" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Target size={12} /> Chẩn đoán</label>
                <textarea value={ptForm.chan_doan} onChange={e => setPtForm({ ...ptForm, chan_doan: e.target.value })} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 min-h-[80px]" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1.5"><Calendar size={12} /> Ngày vào viện</label>
                <input type="date" value={ptForm.ngay_vao_vien} onChange={e => setPtForm({ ...ptForm, ngay_vao_vien: e.target.value })} className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-red-500 ml-1 flex items-center gap-1.5"><AlertCircle size={12} /> Lý do nằm viện kéo dài</label>
                <textarea value={ptForm.ly_do_keo_dai} onChange={e => setPtForm({ ...ptForm, ly_do_keo_dai: e.target.value })} className="w-full px-5 py-3 bg-red-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 min-h-[100px]" placeholder="VD: Kháng kháng sinh, biến chứng sau phẫu thuật..." required />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#009900] ml-1 flex items-center gap-1.5"><CheckCircle2 size={12} /> Đề xuất giải pháp</label>
                <textarea value={ptForm.giai_phap_de_xuat || ''} onChange={e => setPtForm({ ...ptForm, giai_phap_de_xuat: e.target.value })} className="w-full px-5 py-3 bg-green-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-green-500/20 min-h-[100px]" placeholder="VD: Hội chẩn liên khoa, thay đổi phác đồ..." />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button type="button" onClick={() => setShowPtModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Hủy</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-lg shadow-indigo-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> {editingPt ? 'Cập nhật' : 'Lưu phân tích'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
