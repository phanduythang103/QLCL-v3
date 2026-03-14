import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  ClipboardCheck, 
  List, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  TrendingUp,
  Info,
  X,
  Target,
  Eye
} from 'lucide-react';
import { fetchScykNghiemTrong, ScykNghiemTrong, addScykNghiemTrong, updateScykNghiemTrong, deleteScykNghiemTrong } from '../readScykNghiemTrong';
import { fetchRcaChecklist, RcaChecklist, addRcaChecklist, updateRcaChecklist, deleteRcaChecklist } from '../readRcaChecklist';
import { fetchBaoCaoScyk, BaoCaoScyk } from '../readBaoCaoScyk';
import { useAuth } from '../contexts/AuthContext';

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-[#009900] text-white shadow-lg shadow-green-900/20 scale-105' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    <Icon size={18} />
    <span className="font-black uppercase text-xs tracking-wider">{label}</span>
  </button>
);

export const SeriousIncidentModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUPERVISION' | 'REPORTS'>('OVERVIEW');
  const [reports, setReports] = useState<ScykNghiemTrong[]>([]);
  const [checklists, setChecklists] = useState<RcaChecklist[]>([]);
  const [allScykSuggestions, setAllScykSuggestions] = useState<BaoCaoScyk[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScykNghiemTrong | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showViewChecklistModal, setShowViewChecklistModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<RcaChecklist | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<RcaChecklist | null>(null);

  // Form State - Reports
  const [reportForm, setReportForm] = useState<Omit<ScykNghiemTrong, 'id' | 'created_at'>>({
    ma_scyk: '',
    ngay_bao_cao: new Date().toISOString().split('T')[0],
    nguoi_bao_cao: '',
    ngay_xay_ra: new Date().toISOString().split('T')[0],
    don_vi: '',
    tom_tat_noi_dung_su_co: '',
    phan_loai_nc3: 'Sự cố y khoa nghiêm trọng',
    hau_qua_doi_voi_nguoi_benh: '',
    trang_thai_xu_ly: 'Đang RCA'
  });

  // Form State - Checklist
  const [checklistForm, setChecklistForm] = useState<Omit<RcaChecklist, 'id' | 'created_at'>>({
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: user?.full_name || '',
    ma_scyk: '',
    c1_dat: false, c1_ghi_chu: '',
    c2_dat: false, c2_ghi_chu: '',
    c3_dat: false, c3_ghi_chu: '',
    c4_dat: false, c4_ghi_chu: '',
    c5_dat: false, c5_ghi_chu: ''
  });

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, checklistsData, scykSuggestions] = await Promise.all([
        fetchScykNghiemTrong(),
        fetchRcaChecklist(),
        fetchBaoCaoScyk()
      ]);
      setReports(reportsData);
      setChecklists(checklistsData);
      setAllScykSuggestions(scykSuggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Handlers Reports ---
  const handleAddReport = () => {
    setEditingReport(null);
    setReportForm({
      ma_scyk: '',
      ngay_bao_cao: new Date().toISOString().split('T')[0],
      nguoi_bao_cao: user?.full_name || '',
      ngay_xay_ra: new Date().toISOString().split('T')[0],
      don_vi: '',
      tom_tat_noi_dung_su_co: '',
      phan_loai_nc3: 'Sự cố y khoa nghiêm trọng',
      hau_qua_doi_voi_nguoi_benh: '',
      trang_thai_xu_ly: 'Đang RCA'
    });
    setShowReportModal(true);
  };

  const handleEditReport = (report: ScykNghiemTrong) => {
    setEditingReport(report);
    setReportForm({
      ma_scyk: report.ma_scyk,
      ngay_bao_cao: report.ngay_bao_cao,
      nguoi_bao_cao: report.nguoi_bao_cao,
      ngay_xay_ra: report.ngay_xay_ra,
      don_vi: report.don_vi,
      tom_tat_noi_dung_su_co: report.tom_tat_noi_dung_su_co,
      phan_loai_nc3: report.phan_loai_nc3,
      hau_qua_doi_voi_nguoi_benh: report.hau_qua_doi_voi_nguoi_benh,
      trang_thai_xu_ly: report.trang_thai_xu_ly
    });
    setShowReportModal(true);
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return;
    try {
      await deleteScykNghiemTrong(id);
      await loadData();
    } catch (err) {
      alert('Lỗi khi xóa báo cáo');
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReport) {
        await updateScykNghiemTrong(editingReport.id, reportForm);
      } else {
        await addScykNghiemTrong(reportForm);
      }
      setShowReportModal(false);
      await loadData();
    } catch (err) {
      alert('Lỗi khi lưu báo cáo');
    }
  };

  // --- Handlers Checklist ---
  const handleAddChecklist = () => {
    setEditingChecklist(null);
    setChecklistForm({
      ngay_giam_sat: new Date().toISOString().split('T')[0],
      nguoi_giam_sat: user?.full_name || '',
      ma_scyk: '',
      c1_dat: false, c1_ghi_chu: '',
      c2_dat: false, c2_ghi_chu: '',
      c3_dat: false, c3_ghi_chu: '',
      c4_dat: false, c4_ghi_chu: '',
      c5_dat: false, c5_ghi_chu: ''
    });
    setShowChecklistModal(true);
  };

  const handleEditChecklist = (item: RcaChecklist) => {
    setEditingChecklist(item);
    setChecklistForm({
      ngay_giam_sat: item.ngay_giam_sat,
      nguoi_giam_sat: item.nguoi_giam_sat,
      ma_scyk: item.ma_scyk,
      c1_dat: item.c1_dat, c1_ghi_chu: item.c1_ghi_chu || '',
      c2_dat: item.c2_dat, c2_ghi_chu: item.c2_ghi_chu || '',
      c3_dat: item.c3_dat, c3_ghi_chu: item.c3_ghi_chu || '',
      c4_dat: item.c4_dat, c4_ghi_chu: item.c4_ghi_chu || '',
      c5_dat: item.c5_dat, c5_ghi_chu: item.c5_ghi_chu || ''
    });
    setShowChecklistModal(true);
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bảng kiểm này?')) return;
    try {
      await deleteRcaChecklist(id);
      await loadData();
    } catch (err) {
      alert('Lỗi khi xóa bảng kiểm');
    }
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChecklist) {
        await updateRcaChecklist(editingChecklist.id, checklistForm);
      } else {
        await addRcaChecklist(checklistForm);
      }
      setShowChecklistModal(false);
      await loadData();
    } catch (err) {
      alert('Lỗi khi lưu bảng kiểm');
    }
  };

  const renderOverview = () => {
    const totalReports = reports.length;
    const completedRca = reports.filter(r => r.trang_thai_xu_ly === 'Đã kết luận').length;
    const ongoingRca = reports.filter(r => r.trang_thai_xu_ly === 'Đang RCA').length;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Tổng số sự cố NT</h4>
              <p className="text-4xl font-black text-slate-800">{totalReports}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-orange-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                <Clock size={24} />
              </div>
              <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Đang phân tích RCA</h4>
              <p className="text-4xl font-black text-slate-800">{ongoingRca}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 bg-green-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Đã kết luận</h4>
              <p className="text-4xl font-black text-slate-800">{completedRca}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
              <TrendingUp size={20} className="text-[#009900]" />
              Diễn biến gần đây
            </h3>
            <button onClick={() => setActiveTab('REPORTS')} className="text-[#009900] text-xs font-bold hover:underline">Xem chi tiết</button>
          </div>
          <div className="p-0">
             {reports.slice(0, 5).map((report, idx) => (
               <div key={report.id} className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${idx === 0 ? 'bg-green-50/30' : ''}`}>
                 <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                     report.trang_thai_xu_ly === 'Đã kết luận' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                     {report.ma_scyk.slice(-2)}
                   </div>
                   <div>
                     <p className="text-slate-800 font-bold text-sm">{report.ma_scyk} - {report.don_vi}</p>
                     <p className="text-slate-500 text-xs mt-1 italic line-clamp-1">{report.tom_tat_noi_dung_su_co}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-slate-400 text-[10px] font-bold uppercase">{report.ngay_bao_cao}</p>
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${
                     report.trang_thai_xu_ly === 'Đã kết luận' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                     {report.trang_thai_xu_ly}
                   </span>
                 </div>
               </div>
             ))}
             {reports.length === 0 && (
               <div className="p-12 text-center text-slate-400 font-medium">Chưa có dữ liệu sự cố nào.</div>
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupervision = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm">Bảng kiểm giám sát phản ứng RCA</h3>
            <button onClick={handleAddChecklist} className="bg-[#009900] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:shadow-md transition-all active:scale-95">
              <Plus size={16} /> Thêm bảng kiểm
            </button>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#009900] text-white uppercase tracking-widest">
                  <th className="px-6 py-4 text-[10px] font-black">Ngày GS</th>
                  <th className="px-6 py-4 text-[10px] font-black">Người GS</th>
                  <th className="px-6 py-4 text-[10px] font-black">Mã SCYK</th>
                  <th className="px-6 py-4 text-[10px] font-black">Kết quả giám sát</th>
                  <th className="px-6 py-4 text-[10px] font-black text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {checklists.map((item) => {
                  const passCount = [item.c1_dat, item.c2_dat, item.c3_dat, item.c4_dat, item.c5_dat].filter(Boolean).length;
                  const total = 5;
                  const rate = Math.round((passCount / total) * 100);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                      <td className="px-6 py-4 text-slate-600 font-bold text-sm">
                        {item.ngay_giam_sat.split('-').reverse().join('/')}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-black text-sm uppercase">
                        {item.nguoi_giam_sat}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-black text-sm">{item.ma_scyk}</div>
                        <div className="text-[10px] font-bold text-slate-400 italic">
                          {reports.find(r => r.ma_scyk === item.ma_scyk)?.don_vi || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className={`h-full ${rate === 100 ? 'bg-green-500' : rate >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-slate-700">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => { setViewingChecklist(item); setShowViewChecklistModal(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-bold"
                          >
                            <Eye size={14} /> Xem
                          </button>
                          <button 
                            onClick={() => handleEditChecklist(item)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold"
                          >
                            <Edit size={14} /> Sửa
                          </button>
                          <button 
                            onClick={() => handleDeleteChecklist(item.id)} 
                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-bold"
                          >
                            <Trash2 size={14} /> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-slate-100">
             {checklists.map((item) => {
               const passCount = [item.c1_dat, item.c2_dat, item.c3_dat, item.c4_dat, item.c5_dat].filter(Boolean).length;
               const rate = Math.round((passCount / 5) * 100);
               return (
                 <div key={item.id} className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.ngay_giam_sat.split('-').reverse().join('/')}</p>
                          <h4 className="text-sm font-black text-slate-800">{item.ma_scyk}</h4>
                          <p className="text-[10px] font-bold text-slate-400 italic mt-0.5">{reports.find(r => r.ma_scyk === item.ma_scyk)?.don_vi || 'N/A'}</p>
                       </div>
                       <div className="text-right">
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${rate === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                             {rate}% Đạt
                          </span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => { setViewingChecklist(item); setShowViewChecklistModal(true); }} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"><Eye size={12} /> Xem</button>
                       <button onClick={() => handleEditChecklist(item)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"><Edit size={12} /> Sửa</button>
                       <button onClick={() => handleDeleteChecklist(item.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5"><Trash2 size={12} /> Xóa</button>
                    </div>
                 </div>
               );
             })}
          </div>

          {checklists.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 font-medium italic">Chưa có dữ liệu giám sát.</div>
          )}
        </div>
      </div>
    );
  };

  const renderReportList = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Tìm kiếm mã sự cố, đơn vị, nội dung..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 transition-all font-medium" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-100 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Lọc nâng cao
            </button>
            <button onClick={handleAddReport} className="bg-[#009900] text-white px-5 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:shadow-lg hover:shadow-green-900/20 transition-all active:scale-95">
              <Plus size={16} /> Báo cáo mới
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 group">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex flex-col items-center justify-center font-black group-hover:bg-green-50 transition-colors">
                    <AlertTriangle size={20} className="text-red-500 mb-0.5" />
                    <span className="text-[10px] text-slate-400 leading-none">NC3</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-slate-800 font-black text-base">{report.ma_scyk}</h4>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                        report.trang_thai_xu_ly === 'Đã kết luận' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}>
                        {report.trang_thai_xu_ly}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-bold">
                       <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#009900]" /> {report.ngay_bao_cao}</span>
                       <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#009900]" /> {report.don_vi}</span>
                       <span className="flex items-center gap-1.5"><User size={14} className="text-[#009900]" /> {report.nguoi_bao_cao}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <button onClick={() => handleEditReport(report)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-[#009900] transition-colors" title="Chỉnh sửa"><Edit size={18} /></button>
                   <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-slate-400 hover:bg-red-50 rounded-lg hover:text-red-500 transition-colors" title="Xóa"><Trash2 size={18} /></button>
                   <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-slate-800 transition-colors"><ChevronRight size={18} /></button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 bg-slate-50/30 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                 <p className="text-slate-600 text-xs italic line-clamp-2"><span className="font-bold text-slate-400 non-italic mr-2">NỘI DUNG:</span>{report.tom_tat_noi_dung_su_co}</p>
                 <div className="mt-2 flex items-center justify-between">
                    <p className="text-red-600 text-[10px] font-bold"><span className="text-slate-400 mr-2">HẬU QUẢ:</span> {report.hau_qua_doi_voi_nguoi_benh || 'Đang cập nhật...'}</p>
                    <div className="flex items-center gap-2">
                       <Info size={12} className="text-slate-300" />
                       <span className="text-[10px] text-slate-400 font-medium">Báo cáo lúc {report.created_at ? new Date(report.created_at).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                 </div>
              </div>
            </div>
          ))}
          {reports.length === 0 && (
             <div className="bg-white p-20 text-center rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertTriangle size={32} className="text-slate-200" />
                </div>
                <h4 className="text-slate-800 font-black uppercase text-sm">Chưa có bản ghi nào</h4>
                <p className="text-slate-400 text-xs mt-1">Danh sách sự cố nghiêm trọng hiện đang trống.</p>
                <button onClick={handleAddReport} className="mt-6 text-[#009900] text-xs font-black uppercase tracking-widest border-b-2 border-green-200 hover:border-green-500 transition-all pb-1 mx-auto block">Gửi báo cáo đầu tiên</button>
             </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0 border border-red-100">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-slate-800 tracking-tight uppercase">Sự cố y khoa nghiêm trọng</h2>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-0.5">Báo cáo & Phân tích sự cố y khoa loại nghiêm trọng</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="flex flex-nowrap overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide items-center gap-3 bg-white/50 p-2 rounded-2xl border border-white/50 backdrop-blur-sm self-start">
          <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" />
          <TabButton active={activeTab === 'SUPERVISION'} onClick={() => setActiveTab('SUPERVISION')} icon={ClipboardCheck} label="Giám sát" />
          <TabButton active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} icon={List} label="Danh sách báo cáo" />
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50 space-y-4">
             <div className="w-10 h-10 border-4 border-[#009900]/20 border-t-[#009900] rounded-full animate-spin"></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && renderOverview()}
            {activeTab === 'SUPERVISION' && renderSupervision()}
            {activeTab === 'REPORTS' && renderReportList()}
          </>
        )}
      </div>

      {/* --- Modals --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    {editingReport ? 'Cập nhật báo cáo sự cố NT' : 'Thêm báo cáo sự cố NT mới'}
                 </h3>
                 <button onClick={() => setShowReportModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveReport} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mã Sự cố</label>
                       <input 
                        list="scyk-suggestions"
                        value={reportForm.ma_scyk} 
                        onChange={e => {
                          const val = e.target.value;
                          const suggestion = allScykSuggestions.find(s => s.so_bc_ma_scyk === val);
                          
                          let summary = reportForm.tom_tat_noi_dung_su_co;
                          if (suggestion) {
                            summary = `1. Mô tả sự cố: ${suggestion.mo_ta_su_co || 'N/A'}\n2. Xử trí ban đầu: ${suggestion.dieu_tri_xy_ly_ban_dau_da_thuc_hien || 'N/A'}`;
                          }

                          setReportForm({
                            ...reportForm, 
                            ma_scyk: val,
                            don_vi: suggestion?.khoa_phong || suggestion?.don_vi_bao_cao || reportForm.don_vi,
                            tom_tat_noi_dung_su_co: summary,
                            ngay_xay_ra: suggestion?.ngay_xay_ra_sc || reportForm.ngay_xay_ra
                          });
                        }} 
                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/20" 
                        placeholder="Chọn hoặc nhập mã..." 
                        required 
                       />
                       <datalist id="scyk-suggestions">
                         {allScykSuggestions.map(s => (
                           <option key={s.id} value={s.so_bc_ma_scyk}>{s.khoa_phong} - {s.ho_ten_nb}</option>
                         ))}
                       </datalist>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Đơn vị</label>
                       <input value={reportForm.don_vi} onChange={e => setReportForm({...reportForm, don_vi: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" placeholder="Khoa/Phòng" required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày báo cáo</label>
                       <input type="date" value={reportForm.ngay_bao_cao} onChange={e => setReportForm({...reportForm, ngay_bao_cao: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày xảy ra</label>
                       <input type="date" value={reportForm.ngay_xay_ra} onChange={e => setReportForm({...reportForm, ngay_xay_ra: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" required />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Người báo báo</label>
                    <input value={reportForm.nguoi_bao_cao} onChange={e => setReportForm({...reportForm, nguoi_bao_cao: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" placeholder="Họ và tên" required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tóm tắt nội dung sự cố</label>
                    <textarea rows={6} value={reportForm.tom_tat_noi_dung_su_co} onChange={e => setReportForm({...reportForm, tom_tat_noi_dung_su_co: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20 leading-relaxed" placeholder="Mô tả tóm tắt sự việc..." required />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hậu quả đối với người bệnh</label>
                    <textarea rows={2} value={reportForm.hau_qua_doi_voi_nguoi_benh} onChange={e => setReportForm({...reportForm, hau_qua_doi_voi_nguoi_benh: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" placeholder="VD: Tử vong, Thương tật vĩnh viễn..." />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Trạng thái xử lý</label>
                    <select value={reportForm.trang_thai_xu_ly} onChange={e => setReportForm({...reportForm, trang_thai_xu_ly: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20">
                       <option value="Đang RCA">Đang phân tích RCA</option>
                       <option value="Đã kết luận">Đã hoàn thành kết luận</option>
                    </select>
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex gap-3">
                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs tracking-wider hover:bg-slate-50 rounded-xl transition-colors">Hủy bỏ</button>
                    <button type="submit" className="flex-[2] py-3 bg-[#009900] text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all">Lưu thông tin</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showChecklistModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <ClipboardCheck size={20} className="text-[#009900]" />
                    {editingChecklist ? 'Cập nhật bảng kiểm giám sát' : 'Thêm bảng kiểm giám sát mới'}
                 </h3>
                 <button onClick={() => setShowChecklistModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveChecklist} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mã SCYK liên quan</label>
                       <select 
                        value={checklistForm.ma_scyk} 
                        onChange={e => setChecklistForm({...checklistForm, ma_scyk: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" 
                        required
                       >
                         <option value="">-- Chọn mã sự cố --</option>
                         {reports.filter(r => r.trang_thai_xu_ly !== 'Đã kết luận').map(report => (
                           <option key={report.id} value={report.ma_scyk}>{report.ma_scyk} - {report.don_vi}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ngày giám sát</label>
                       <input type="date" value={checklistForm.ngay_giam_sat} onChange={e => setChecklistForm({...checklistForm, ngay_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" required />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Người giám sát</label>
                       <input value={checklistForm.nguoi_giam_sat} onChange={e => setChecklistForm({...checklistForm, nguoi_giam_sat: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-green-500/20" placeholder="Họ tên người GS" required />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                       <Target size={16} className="text-[#009900]" /> Nội dung giám sát phản ứng RCA
                    </h4>
                    
                    {[
                      { id: 'c1', label: '1. Sự cố được báo cáo trong vòng 24 giờ kể từ khi phát hiện' },
                      { id: 'c2', label: '2. Thành lập đội phân tích nguyên nhân gốc rễ (RCA) trong 48 giờ' },
                      { id: 'c3', label: '3. Xác định được các yếu tố hệ thống gây ra sự cố (Quy trình, Con người, Thiết bị...)' },
                      { id: 'c4', label: '4. Có kế hoạch hành động cải tiến cụ thể để ngăn chặn tái diễn' },
                      { id: 'c5', label: '5. Phổ biến bài học kinh nghiệm cho toàn Bệnh viện mà không mang tính đổ lỗi' },
                    ].map((criteria) => (
                      <div key={criteria.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-50 mb-3 hover:bg-slate-50 transition-colors">
                         <div className="md:col-span-7">
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{criteria.label}</p>
                         </div>
                         <div className="flex w-full md:w-auto md:col-span-2 justify-between md:justify-center items-center">
                            <span className="md:hidden text-[10px] font-black uppercase text-slate-400">Kết quả:</span>
                            <label className="flex items-center gap-2 cursor-pointer group">
                               <input type="checkbox" checked={(checklistForm as any)[`${criteria.id}_dat`]} onChange={e => setChecklistForm({...checklistForm, [`${criteria.id}_dat`]: e.target.checked})} className="hidden" />
                               <div className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ${ (checklistForm as any)[`${criteria.id}_dat`] ? 'bg-[#009900]' : 'bg-slate-300'}`}>
                                  <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${ (checklistForm as any)[`${criteria.id}_dat`] ? 'translate-x-4' : ''}`}></div>
                               </div>
                               <span className={`text-[10px] font-black uppercase ${ (checklistForm as any)[`${criteria.id}_dat`] ? 'text-[#009900]' : 'text-slate-400'}`}>
                                  {(checklistForm as any)[`${criteria.id}_dat`] ? 'Đạt' : 'K.Đạt'}
                               </span>
                            </label>
                         </div>
                         <div className="w-full md:col-span-3">
                            <input value={(checklistForm as any)[`${criteria.id}_ghi_chu`] || ''} onChange={e => setChecklistForm({...checklistForm, [`${criteria.id}_ghi_chu`]: e.target.value})} className="w-full px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-green-500/20" placeholder="Ghi chú..." />
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="pt-4 border-t border-slate-50 flex gap-3">
                    <button type="button" onClick={() => setShowChecklistModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs tracking-wider hover:bg-slate-50 rounded-xl transition-colors">Hủy bỏ</button>
                    <button type="submit" className="flex-[2] py-3 bg-[#009900] text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all">Lưu bảng kiểm</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showViewChecklistModal && viewingChecklist && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                    <Eye size={20} className="text-[#009900]" />
                    Chi tiết bảng kiểm giám sát
                 </h3>
                 <button onClick={() => setShowViewChecklistModal(false)} className="p-2 text-slate-400 hover:bg-white rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Mã SCYK liên quan</p>
                       <p className="text-sm font-black text-[#009900]">{viewingChecklist.ma_scyk}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Ngày giám sát</p>
                       <p className="text-sm font-bold text-slate-700">{viewingChecklist.ngay_giam_sat}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Người giám sát</p>
                       <p className="text-sm font-black text-slate-700 uppercase">{viewingChecklist.nguoi_giam_sat}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase pb-2 border-b border-slate-100 flex items-center gap-2">
                       <Target size={16} className="text-[#009900]" /> Kết quả giám sát
                    </h4>
                    
                    {[
                      { id: 'c1', label: '1. Sự cố được báo cáo trong vòng 24 giờ kể từ khi phát hiện' },
                      { id: 'c2', label: '2. Thành lập đội phân tích nguyên nhân gốc rễ (RCA) trong 48 giờ' },
                      { id: 'c3', label: '3. Xác định được các yếu tố hệ thống gây ra sự cố (Quy trình, Con người, Thiết bị...)' },
                      { id: 'c4', label: '4. Có kế hoạch hành động cải tiến cụ thể để ngăn chặn tái diễn' },
                      { id: 'c5', label: '5. Phổ biến bài học kinh nghiệm cho toàn Bệnh viện mà không mang tính đổ lỗi' },
                    ].map((criteria) => {
                      const isDat = (viewingChecklist as any)[`${criteria.id}_dat`];
                      const ghiChu = (viewingChecklist as any)[`${criteria.id}_ghi_chu`];
                      return (
                        <div key={criteria.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center bg-slate-50/30 p-4 rounded-2xl border border-slate-50/50">
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
                    <button onClick={() => setShowViewChecklistModal(false)} className="w-full py-3 bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-wider rounded-xl hover:bg-slate-200 transition-all">Đóng</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

