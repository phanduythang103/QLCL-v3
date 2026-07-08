import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  ShieldCheck,
  AlertOctagon,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  ChevronRight,
  TrendingUp,
  Info,
  X,
  Target,
  Eye,
  Camera,
  Image as ImageIcon,
  Building,
  Activity
} from 'lucide-react';
import { fetchScnyknt, Scnyknt, addScnyknt, updateScnyknt, deleteScnyknt } from '../readScnyknt';
import { fetchBcScnyknt, BcScnyknt, addBcScnyknt, updateBcScnyknt, deleteBcScnyknt, uploadFacilityImages } from '../readBcScnyknt';
import { useAuth } from '../contexts/AuthContext';

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`indicator-subtab-button ${
      active ? 'indicator-subtab-button-active' : ''
    }`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </button>
);

export const FacilitySecurityModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUPERVISION' | 'REPORTS'>('OVERVIEW');
  const [supervisions, setSupervisions] = useState<Scnyknt[]>([]);
  const [reports, setReports] = useState<BcScnyknt[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showSupervisionModal, setShowSupervisionModal] = useState(false);
  const [editingSupervision, setEditingSupervision] = useState<Scnyknt | null>(null);
  const [showViewSupervisionModal, setShowViewSupervisionModal] = useState(false);
  const [viewingSupervision, setViewingSupervision] = useState<Scnyknt | null>(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<BcScnyknt | null>(null);
  const [showViewReportModal, setShowViewReportModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<BcScnyknt | null>(null);

  // Form State - Supervision
  const [supervisionForm, setSupervisionForm] = useState<Omit<Scnyknt, 'id' | 'created_at'>>({
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: user?.full_name || '',
    vi_tri_giam_sat: '',
    c1_dat: false, c1_ghi_chu: '',
    c2_dat: false, c2_ghi_chu: '',
    c3_dat: false, c3_ghi_chu: '',
    c4_dat: false, c4_ghi_chu: '',
    c5_dat: false, c5_ghi_chu: '',
    c6_dat: false, c6_ghi_chu: ''
  });

  // Form State - Report
  const [reportForm, setReportForm] = useState<Omit<BcScnyknt, 'id' | 'created_at'>>({
    ngay_bao_cao: new Date().toISOString().split('T')[0],
    nguoi_bao_cao: user?.full_name || '',
    don_vi: user?.department || '',
    thoi_gian_xay_ra: new Date().toISOString().slice(0, 16),
    vi_tri_xay_ra: '',
    mo_ta_dien_bien: '',
    hau_qua: '',
    bien_phap_xu_ly: '',
    nguyen_nhan_so_bo: '',
    hinh_anh_minh_chung: []
  });

  const [uploading, setUploading] = useState(false);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [superData, reportsData] = await Promise.all([
        fetchScnyknt(),
        fetchBcScnyknt()
      ]);
      setSupervisions(superData);
      setReports(reportsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Supervision Handlers ---
  const handleAddSupervision = () => {
    setEditingSupervision(null);
    setSupervisionForm({
      ngay_giam_sat: new Date().toISOString().split('T')[0],
      nguoi_giam_sat: user?.full_name || '',
      vi_tri_giam_sat: '',
      c1_dat: false, c1_ghi_chu: '',
      c2_dat: false, c2_ghi_chu: '',
      c3_dat: false, c3_ghi_chu: '',
      c4_dat: false, c4_ghi_chu: '',
      c5_dat: false, c5_ghi_chu: '',
      c6_dat: false, c6_ghi_chu: ''
    });
    setShowSupervisionModal(true);
  };

  const handleEditSupervision = (item: Scnyknt) => {
    setEditingSupervision(item);
    setSupervisionForm({
      ngay_giam_sat: item.ngay_giam_sat,
      nguoi_giam_sat: item.nguoi_giam_sat,
      vi_tri_giam_sat: item.vi_tri_giam_sat,
      c1_dat: item.c1_dat, c1_ghi_chu: item.c1_ghi_chu || '',
      c2_dat: item.c2_dat, c2_ghi_chu: item.c2_ghi_chu || '',
      c3_dat: item.c3_dat, c3_ghi_chu: item.c3_ghi_chu || '',
      c4_dat: item.c4_dat, c4_ghi_chu: item.c4_ghi_chu || '',
      c5_dat: item.c5_dat, c5_ghi_chu: item.c5_ghi_chu || '',
      c6_dat: item.c6_dat, c6_ghi_chu: item.c6_ghi_chu || ''
    });
    setShowSupervisionModal(true);
  };

  const handleDeleteSupervision = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bảng kiểm này?')) return;
    try {
      await deleteScnyknt(id);
      await loadData();
    } catch (err) {
      alert('Lỗi khi xóa bảng kiểm');
    }
  };

  const handleSaveSupervision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupervision) {
        await updateScnyknt(editingSupervision.id, supervisionForm);
      } else {
        await addScnyknt(supervisionForm);
      }
      setShowSupervisionModal(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi khi lưu bảng kiểm: ${err.message || 'Lỗi không xác định'}`);
    }
  };

  // --- Report Handlers ---
  const handleAddReport = () => {
    setEditingReport(null);
    setReportForm({
      ngay_bao_cao: new Date().toISOString().split('T')[0],
      nguoi_bao_cao: user?.full_name || '',
      don_vi: user?.department || '',
      thoi_gian_xay_ra: new Date().toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', ''),
      vi_tri_xay_ra: '',
      mo_ta_dien_bien: '',
      hau_qua: '',
      bien_phap_xu_ly: '',
      nguyen_nhan_so_bo: '',
      hinh_anh_minh_chung: []
    });
    setShowReportModal(true);
  };

  const handleEditReport = (item: BcScnyknt) => {
    setEditingReport(item);
    setReportForm({
      ngay_bao_cao: item.ngay_bao_cao,
      nguoi_bao_cao: item.nguoi_bao_cao,
      don_vi: item.don_vi,
      thoi_gian_xay_ra: new Date(item.thoi_gian_xay_ra).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', ''),
      vi_tri_xay_ra: item.vi_tri_xay_ra,
      mo_ta_dien_bien: item.mo_ta_dien_bien,
      hau_qua: item.hau_qua,
      bien_phap_xu_ly: item.bien_phap_xu_ly,
      nguyen_nhan_so_bo: item.nguyen_nhan_so_bo,
      hinh_anh_minh_chung: item.hinh_anh_minh_chung || []
    });
    setShowReportModal(true);
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return;
    try {
      await deleteBcScnyknt(id);
      await loadData();
    } catch (err) {
      alert('Lỗi khi xóa báo cáo');
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Helper to parse 'dd/mm/yyyy hh:mm' to ISO
      const parseDateTime = (str: string) => {
        const [datePart, timePart] = str.split(' ');
        const [d, m, y] = datePart.split('/');
        const [h, min] = timePart.split(':');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min)).toISOString();
      };

      const finalForm = {
        ...reportForm,
        thoi_gian_xay_ra: parseDateTime(reportForm.thoi_gian_xay_ra)
      };

      if (editingReport) {
        await updateBcScnyknt(editingReport.id, finalForm as any);
      } else {
        await addBcScnyknt(finalForm as any);
      }
      setShowReportModal(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi khi lưu báo cáo: ${err.message || 'Lỗi không xác định'}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const urls = await uploadFacilityImages(files);
      setReportForm(prev => ({
        ...prev,
        hinh_anh_minh_chung: [...(prev.hinh_anh_minh_chung || []), ...urls]
      }));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      hinh_anh_minh_chung: (prev.hinh_anh_minh_chung || []).filter((_, i) => i !== index)
    }));
  };

  // --- Renders ---
  const renderOverview = () => {
    const totalSupervisions = supervisions.length;
    const totalReports = reports.length;
    const avgPassRate = supervisions.length > 0
      ? Math.round(supervisions.reduce((acc, curr) => {
          const pass = [curr.c1_dat, curr.c2_dat, curr.c3_dat, curr.c4_dat, curr.c5_dat, curr.c6_dat].filter(Boolean).length;
          return acc + (pass / 6) * 100;
        }, 0) / supervisions.length)
      : 0;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="indicator-quick-stats grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="indicator-quick-stat-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-green-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="indicator-quick-stat-icon w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Tổng lượt giám sát</h4>
              <p className="indicator-quick-stat-value text-4xl font-black text-slate-800">{totalSupervisions}</p>
            </div>
          </div>

          <div className="indicator-quick-stat-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-red-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="indicator-quick-stat-icon w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-4">
                <AlertOctagon size={24} />
              </div>
              <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Sự cố an ninh/vận hành</h4>
              <p className="indicator-quick-stat-value text-4xl font-black text-slate-800">{totalReports}</p>
            </div>
          </div>

          <div className="indicator-quick-stat-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="indicator-quick-stat-icon w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <Activity size={24} />
              </div>
              <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Tỷ lệ đạt TB</h4>
              <p className="indicator-quick-stat-value text-4xl font-black text-slate-800">{avgPassRate}%</p>
            </div>
          </div>
        </div>

        {/* Recent Supervision Activity */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
              <TrendingUp size={20} className="text-[#059669]" />
              Hoạt động giám sát gần nhất
            </h3>
            <button onClick={() => setActiveTab('SUPERVISION')} className="text-[#059669] text-xs font-bold hover:underline">Xem tất cả</button>
          </div>
          <div className="p-0">
            {supervisions.slice(0, 3).map((item, idx) => {
               const passCount = [item.c1_dat, item.c2_dat, item.c3_dat, item.c4_dat, item.c5_dat, item.c6_dat].filter(Boolean).length;
               const rate = Math.round((passCount / 6) * 100);
               return (
                 <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${rate === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {rate}%
                       </div>
                       <div>
                          <p className="text-slate-800 font-bold text-sm">{item.vi_tri_giam_sat}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{item.nguoi_giam_sat} • {item.ngay_giam_sat.split('-').reverse().join('/')}</p>
                       </div>
                    </div>
                    <button onClick={() => { setViewingSupervision(item); setShowViewSupervisionModal(true); }} className="p-2 text-slate-400 hover:text-[#059669] transition-colors"><ChevronRight size={20} /></button>
                 </div>
               );
            })}
            {supervisions.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Chưa có dữ liệu giám sát</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupervisionList = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
               <ShieldCheck size={20} className="text-[#059669]" /> Giám sát An toàn & Vận hành
            </h3>
            <button onClick={handleAddSupervision} className="bg-[#059669] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:shadow-lg transition-all active:scale-95">
              <Plus size={16} /> Bảng kiểm mới
            </button>
          </div>

          {/* Table for Desktop, Cards for Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#059669] text-white uppercase tracking-widest text-[10px]">
                  <th className="px-6 py-4 font-black">Ngày GS</th>
                  <th className="px-6 py-4 font-black">Người GS</th>
                  <th className="px-6 py-4 font-black">Vị trí</th>
                  <th className="px-6 py-4 font-black">Tỷ lệ đạt</th>
                  <th className="px-6 py-4 font-black text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {supervisions.map((item) => {
                  const passCount = [item.c1_dat, item.c2_dat, item.c3_dat, item.c4_dat, item.c5_dat, item.c6_dat].filter(Boolean).length;
                  const rate = Math.round((passCount / 6) * 100);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.ngay_giam_sat.split('-').reverse().join('/')}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{item.nguoi_giam_sat}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.vi_tri_giam_sat}</td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full ${rate === 100 ? 'bg-green-500' : rate >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }}></div>
                           </div>
                           <span className="text-[10px] font-black text-slate-500">{rate}%</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setViewingSupervision(item); setShowViewSupervisionModal(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black uppercase text-slate-500 hover:text-[#059669] bg-slate-50 hover:bg-green-50 rounded-lg transition-colors"><Eye size={14} /> Xem</button>
                            <button onClick={() => handleEditSupervision(item)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black uppercase text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /> Sửa</button>
                            <button onClick={() => handleDeleteSupervision(item.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-black uppercase text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /> Xóa</button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-slate-100">
             {supervisions.map((item) => {
               const passCount = [item.c1_dat, item.c2_dat, item.c3_dat, item.c4_dat, item.c5_dat, item.c6_dat].filter(Boolean).length;
               const rate = Math.round((passCount / 6) * 100);
               return (
                 <div key={item.id} className="p-4 space-y-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.ngay_giam_sat.split('-').reverse().join('/')}</p>
                       <h4 className="text-sm font-black text-slate-800 mt-0.5">{item.vi_tri_giam_sat}</h4>
                       <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Người GS: {item.nguoi_giam_sat}</p>
                     </div>
                     <div className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${rate === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {rate}% Đạt
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <button onClick={() => { setViewingSupervision(item); setShowViewSupervisionModal(true); }} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5"><Eye size={14} /> Xem</button>
                      <button onClick={() => handleEditSupervision(item)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5"><Edit size={14} /> Sửa</button>
                      <button onClick={() => handleDeleteSupervision(item.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5"><Trash2 size={14} /> Xóa</button>
                   </div>
                 </div>
               );
             })}
          </div>

          {supervisions.length === 0 && (
            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs grayscale opacity-50">Chưa có dữ liệu giám sát</div>
          )}
        </div>
      </div>
    );
  };

  const renderReportList = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[280px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Tìm kiếm vị trí, nội dung, hậu quả..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10 transition-all" />
          </div>
          <button onClick={handleAddReport} className="bg-red-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:shadow-lg hover:shadow-red-900/20 transition-all active:scale-95">
             <Plus size={16} /> Báo cáo sự cố
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
               <div className="flex flex-col md:flex-row md:items-stretch">
                  {report.hinh_anh_minh_chung && report.hinh_anh_minh_chung.length > 0 ? (
                    <div className="hidden md:block md:w-48 shrink-0 bg-slate-100 relative group-hover:brightness-90 transition-all">
                       <img src={report.hinh_anh_minh_chung[0]} className="w-full h-full object-cover" alt="Inc" />
                       {report.hinh_anh_minh_chung.length > 1 && (
                         <div className="absolute right-2 bottom-2 bg-black/60 text-white text-[10px] font-black px-1.5 py-0.5 rounded backdrop-blur-sm">+{report.hinh_anh_minh_chung.length - 1}</div>
                       )}
                    </div>
                  ) : (
                    <div className="hidden md:flex md:w-48 shrink-0 bg-slate-50 items-center justify-center text-slate-200">
                       <ImageIcon size={40} />
                    </div>
                  )}

                   <div className="flex-1 p-4 flex flex-col gap-3">
                     {/* Dòng 1: Badge SC An toàn + Ngày xảy ra sự cố */}
                     <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                           <AlertTriangle size={10} /> SC An toàn
                        </span>
                        <span className="text-slate-500 text-[10px] font-bold flex items-center gap-1.5">
                           <Clock size={10} className="text-slate-400" />
                           {(() => {
                             try {
                               const d = new Date(report.thoi_gian_xay_ra);
                               if (isNaN(d.getTime())) return report.thoi_gian_xay_ra;
                               return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
                             } catch { return report.thoi_gian_xay_ra; }
                           })()}
                        </span>
                     </div>

                     {/* Dòng 2: Vị trí xảy ra sự cố */}
                     <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-red-400 shrink-0" />
                        <h4 className="text-slate-800 font-black text-sm leading-snug">{report.vi_tri_xay_ra}</h4>
                     </div>

                     {/* Dòng 3: Mô tả diễn biến */}
                     <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 border-l-2 border-slate-100 pl-2">
                        {report.mo_ta_dien_bien}
                     </p>

                     {/* Dòng 4: Các nút thao tác */}
                     <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-auto">
                        <button onClick={() => { setViewingReport(report); setShowViewReportModal(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-slate-600 hover:text-[#059669] bg-slate-50 hover:bg-green-50 rounded-xl transition-colors border border-slate-100 hover:border-green-200">
                           <Eye size={13} /> Xem
                        </button>
                        <button onClick={() => handleEditReport(report)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors border border-slate-100 hover:border-blue-200">
                           <Edit size={13} /> Sửa
                        </button>
                        <button onClick={() => handleDeleteReport(report.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase text-slate-600 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors border border-slate-100 hover:border-red-200">
                           <Trash2 size={13} /> Xóa
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          ))}
          {reports.length === 0 && (
             <div className="bg-white p-20 text-center rounded-2xl border border-slate-100 shadow-sm border-dashed">
                <AlertTriangle size={48} className="text-slate-100 mx-auto mb-4" />
                <h4 className="text-slate-800 font-black uppercase text-sm tracking-widest">Chưa có báo cáo sự cố</h4>
                <p className="text-slate-400 text-xs mt-1">Hệ thống an toàn vận hành đang ổn định.</p>
                <button onClick={handleAddReport} className="mt-6 text-red-600 text-xs font-black uppercase tracking-widest border-b-2 border-red-100 hover:border-red-600 transition-all pb-1 mx-auto block">Gửi báo cáo đầu tiên</button>
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm animate-pulse-slow shrink-0">
             <AlertTriangle size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight uppercase break-words">Sự cố ngoài y khoa nghiêm trọng</h2>
          </div>
        </div>

        <div className="indicator-subtab-list">
          <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" />
          <TabButton active={activeTab === 'SUPERVISION'} onClick={() => setActiveTab('SUPERVISION')} icon={ShieldCheck} label="Giám sát an toàn" />
          <TabButton active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} icon={AlertOctagon} label="Báo cáo sự cố" />
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
             <div className="w-10 h-10 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin"></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'SUPERVISION' && renderSupervisionList()}
            {activeTab === 'REPORTS' && renderReportList()}
          </>
        )}
      </div>

      {/* --- Modals --- */}
      {/* Supervision Modal */}
      {showSupervisionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#059669]" />
                    {editingSupervision ? 'Cập nhật bảng kiểm' : 'Bảng kiểm giám sát mới'}
                 </h3>
                 <button onClick={() => setShowSupervisionModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveSupervision} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vị trí giám sát</label>
                       <input value={supervisionForm.vi_tri_giam_sat} onChange={e => setSupervisionForm({...supervisionForm, vi_tri_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" placeholder="VD: Tầng 1, Nhà B..." required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày giám sát</label>
                       <input type="date" value={supervisionForm.ngay_giam_sat} onChange={e => setSupervisionForm({...supervisionForm, ngay_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Người giám sát</label>
                       <input value={supervisionForm.nguoi_giam_sat} onChange={e => setSupervisionForm({...supervisionForm, nguoi_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" required readOnly />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase pb-2 border-b border-slate-100 flex items-center gap-2">
                       <Target size={16} className="text-[#059669]" /> Nội dung giám sát chi tiết
                    </h4>
                    {[
                      { id: 'c1', label: '1. Hệ thống báo cháy và chữa cháy hoạt động tốt, còn hạn kiểm định' },
                      { id: 'c2', label: '2. Hệ thống thang máy vận hành ổn định, có tem kiểm định' },
                      { id: 'c3', label: '3. Sàn nhà, hành lang khô ráo, không có nguy cơ trơn trượt' },
                      { id: 'c4', label: '4. Hệ thống điện, nước tại các khoa không có dấu hiệu rò rỉ, hỏng hóc' },
                      { id: 'c5', label: '5. An ninh khu vực (Camera giám sát, nhân viên trực) đảm bảo 24/7' },
                      { id: 'c6', label: '6. Biển báo chỉ dẫn thoát hiểm, nội quy an toàn đầy đủ và rõ ràng' },
                    ].map((criteria) => (
                      <div key={criteria.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                         <div className="md:col-span-7">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{criteria.label}</p>
                         </div>
                         <div className="flex w-full md:w-auto md:col-span-2 justify-between md:justify-center items-center">
                            <span className="md:hidden text-[10px] font-black uppercase text-slate-400">Kết quả:</span>
                            <label className="flex items-center gap-2 cursor-pointer group">
                               <input type="checkbox" checked={(supervisionForm as any)[`${criteria.id}_dat`]} onChange={e => setSupervisionForm({...supervisionForm, [`${criteria.id}_dat`]: e.target.checked})} className="hidden" />
                               <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${ (supervisionForm as any)[`${criteria.id}_dat`] ? 'bg-[#059669]' : 'bg-slate-300'}`}>
                                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${ (supervisionForm as any)[`${criteria.id}_dat`] ? 'translate-x-4' : ''}`}></div>
                               </div>
                               <span className={`text-[10px] font-black uppercase ${ (supervisionForm as any)[`${criteria.id}_dat`] ? 'text-[#059669]' : 'text-slate-400'}`}>
                                  {(supervisionForm as any)[`${criteria.id}_dat`] ? 'Đạt' : 'K.Đạt'}
                               </span>
                            </label>
                         </div>
                         <div className="w-full md:col-span-3">
                            <input value={(supervisionForm as any)[`${criteria.id}_ghi_chu`] || ''} onChange={e => setSupervisionForm({...supervisionForm, [`${criteria.id}_ghi_chu`]: e.target.value})} className="w-full px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-green-500/20" placeholder="Ghi chú (Vị trí/Lỗi)..." />
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="pt-4 border-t border-slate-50 flex gap-3">
                    <button type="button" onClick={() => setShowSupervisionModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[10px] tracking-wider hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"><X size={16} /> Đóng</button>
                    <button type="submit" className="flex-[2] py-3 bg-[#059669] text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg shadow-green-900/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Lưu thông tin</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* View Supervision Modal */}
      {showViewSupervisionModal && viewingSupervision && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <Eye size={18} className="text-[#059669]" />
                    Chi tiết bảng kiểm
                 </h3>
                 <button onClick={() => setShowViewSupervisionModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-white">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Vị trí giám sát</p>
                       <p className="text-sm font-black text-slate-800">{viewingSupervision.vi_tri_giam_sat}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-white">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Ngày giám sát</p>
                       <p className="text-sm font-bold text-slate-700">{viewingSupervision.ngay_giam_sat.split('-').reverse().join('/')}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-white">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Người giám sát</p>
                       <p className="text-sm font-black text-slate-800 uppercase">{viewingSupervision.nguoi_giam_sat}</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase pb-2 border-b border-slate-100 flex items-center gap-2 font-black">
                       <Target size={16} className="text-[#059669]" /> Kết quả giám sát
                    </h4>
                    {[
                      { id: 'c1', label: '1. Hệ thống báo cháy và chữa cháy hoạt động tốt, còn hạn kiểm định' },
                      { id: 'c2', label: '2. Hệ thống thang máy vận hành ổn định, có tem kiểm định' },
                      { id: 'c3', label: '3. Sàn nhà, hành lang khô ráo, không có nguy cơ trơn trượt' },
                      { id: 'c4', label: '4. Hệ thống điện, nước tại các khoa không có dấu hiệu rò rỉ, hỏng hóc' },
                      { id: 'c5', label: '5. An ninh khu vực (Camera giám sát, nhân viên trực) đảm bảo 24/7' },
                      { id: 'c6', label: '6. Biển báo chỉ dẫn thoát hiểm, nội quy an toàn đầy đủ và rõ ràng' },
                    ].map((criteria) => {
                      const isDat = (viewingSupervision as any)[`${criteria.id}_dat`];
                      const ghiChu = (viewingSupervision as any)[`${criteria.id}_ghi_chu`];
                      return (
                        <div key={criteria.id} className="flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center bg-slate-50/30 p-4 rounded-2xl border border-slate-50/50">
                           <div className="md:col-span-7">
                              <p className="text-sm font-bold text-slate-700 leading-relaxed">{criteria.label}</p>
                           </div>
                           <div className="flex w-full md:w-auto md:col-span-2 justify-between md:justify-center items-center">
                              <span className="md:hidden text-[10px] font-black uppercase text-slate-400">Kết quả:</span>
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${isDat ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {isDat ? 'Đạt' : 'Không Đạt'}
                              </span>
                           </div>
                           <div className="w-full md:col-span-3">
                              <p className="text-xs text-slate-500 italic font-medium">{ghiChu || '(Không có ghi chú)'}</p>
                           </div>
                        </div>
                      );
                    })}
                 </div>

                 <div className="pt-4 border-t border-slate-50">
                    <button onClick={() => setShowViewSupervisionModal(false)} className="w-full py-3 bg-slate-100 text-slate-600 font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><X size={16} /> Đóng</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Incident Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    {editingReport ? 'Cập nhật báo cáo sự cố' : 'Báo cáo sự cố an toàn mới'}
                 </h3>
                 <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveReport} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Người báo cáo</label>
                       <input value={reportForm.nguoi_bao_cao} onChange={e => setReportForm({...reportForm, nguoi_bao_cao: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" required readOnly />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Đơn vị</label>
                       <input value={reportForm.don_vi} onChange={e => setReportForm({...reportForm, don_vi: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" required readOnly />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vị trí xảy ra</label>
                       <input value={reportForm.vi_tri_xay_ra} onChange={e => setReportForm({...reportForm, vi_tri_xay_ra: e.target.value})} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" placeholder="VD: Nhà B, khu vực bãi xe..." required />
                    </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Thời gian xảy ra (hh:mm dd/mm/yyyy)</label>
                        <input type="text" value={reportForm.thoi_gian_xay_ra} onChange={e => setReportForm({...reportForm, thoi_gian_xay_ra: e.target.value})} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" placeholder="VD: 14:30 25/03/2026" required />
                     </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mô tả diễn biến</label>
                    <textarea rows={4} value={reportForm.mo_ta_dien_bien} onChange={e => setReportForm({...reportForm, mo_ta_dien_bien: e.target.value})} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10 leading-relaxed" placeholder="Mô tả chi tiết sự việc..." required />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hậu quả (Người & Tài sản)</label>
                       <input value={reportForm.hau_qua} onChange={e => setReportForm({...reportForm, hau_qua: e.target.value})} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" placeholder="VD: 1 người bị thương nhẹ, hỏng 1 cửa kính..." required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nguyên nhân sơ bộ</label>
                       <select value={reportForm.nguyen_nhan_so_bo} onChange={e => setReportForm({...reportForm, nguyen_nhan_so_bo: e.target.value})} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" required>
                          <option value="">-- Chọn nguyên nhân --</option>
                          <option value="Do kỹ thuật">Do kỹ thuật</option>
                          <option value="Do con người">Do con người</option>
                          <option value="Thiên tai">Thiên tai</option>
                          <option value="Khác">Khác</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Biện pháp xử lý tức thời</label>
                    <textarea rows={2} value={reportForm.bien_phap_xu_ly} onChange={e => setReportForm({...reportForm, bien_phap_xu_ly: e.target.value})} className="w-full px-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10" placeholder="VD: Đã gọi cứu hỏa, đã sơ cứu..." required />
                 </div>

                 {/* Image Upload Area */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-2">
                       <Camera size={14} className="text-red-500" /> Hình ảnh minh chứng (chọn nhiều ảnh)
                    </label>
                    <div className="flex flex-wrap gap-3">
                       {(reportForm.hinh_anh_minh_chung || []).map((url, idx) => (
                         <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 hover:bg-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><X size={12} /></button>
                         </div>
                       ))}
                       <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#059669] hover:bg-green-50/30 transition-all ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                          {uploading ? (
                             <div className="w-6 h-6 border-2 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin"></div>
                          ) : (
                             <>
                               <Plus size={20} className="text-slate-300" />
                               <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Tải ảnh</span>
                             </>
                          )}
                          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                       </label>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-50 flex gap-3">
                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-[10px] tracking-wider hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-2"><X size={16} /> Hủy</button>
                    <button type="submit" disabled={uploading} className="flex-[2] py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg shadow-red-900/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={16} /> Gửi báo cáo</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* View Report Modal */}
      {showViewReportModal && viewingReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <ImageIcon size={18} className="text-red-500" />
                    Chi tiết báo cáo sự cố
                 </h3>
                 <button onClick={() => setShowViewReportModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-white">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thời gian</p>
                       <p className="text-xs font-black text-slate-800">{new Date(viewingReport.thoi_gian_xay_ra).toLocaleString([], {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'})}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-white">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Vị trí</p>
                       <p className="text-xs font-black text-slate-800">{viewingReport.vi_tri_xay_ra}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-white">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Người BC</p>
                       <p className="text-xs font-black text-slate-800 uppercase">{viewingReport.nguoi_bao_cao}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-white">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Đơn vị</p>
                       <p className="text-xs font-black text-slate-800 uppercase">{viewingReport.don_vi}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-red-50/30 p-5 rounded-3xl border border-red-50">
                       <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12} /> Diễn biến vụ việc</h4>
                       <p className="text-sm font-bold text-slate-700 leading-relaxed text-justify">{viewingReport.mo_ta_dien_bien}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="bg-slate-50 p-5 rounded-2xl">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hậu quả & Thiệt hại</h4>
                          <p className="text-sm font-black text-red-600">{viewingReport.hau_qua}</p>
                       </div>
                       <div className="bg-slate-50 p-5 rounded-2xl">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nguyên nhân sơ bộ</h4>
                          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black uppercase">{viewingReport.nguyen_nhan_so_bo}</span>
                       </div>
                    </div>

                    <div className="bg-green-50/30 p-5 rounded-2xl border border-green-50">
                       <h4 className="text-[10px] font-black text-[#059669] uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={12} /> Biện pháp xử lý tức thời</h4>
                       <p className="text-sm font-bold text-slate-700 leading-relaxed">{viewingReport.bien_phap_xu_ly}</p>
                    </div>
                 </div>

                 {viewingReport.hinh_anh_minh_chung && viewingReport.hinh_anh_minh_chung.length > 0 && (
                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Camera size={14} /> Tệp đính kèm</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         {viewingReport.hinh_anh_minh_chung.map((url, i) => (
                           <a key={i} href={url} target="_blank" rel="noreferrer" className="aspect-square rounded-2xl overflow-hidden border border-slate-100 hover:brightness-90 transition-all">
                              <img src={url} className="w-full h-full object-cover" alt="Detail" />
                           </a>
                         ))}
                      </div>
                   </div>
                 )}

                 <div className="pt-4 border-t border-slate-50">
                    <button onClick={() => setShowViewReportModal(false)} className="w-full py-3 bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-wider rounded-xl hover:bg-slate-200 transition-all">Đóng</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
