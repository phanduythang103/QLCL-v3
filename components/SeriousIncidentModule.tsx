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
import { fetchBaoCaoScyk, BaoCaoScyk } from '../readBaoCaoScyk';
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

export const SeriousIncidentModule: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REPORTS'>('OVERVIEW');
  const [reports, setReports] = useState<ScykNghiemTrong[]>([]);
  const [allScykSuggestions, setAllScykSuggestions] = useState<BaoCaoScyk[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<ScykNghiemTrong | null>(null);

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
    trang_thai_xu_ly: 'Đang xử lý'
  });

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsData, scykSuggestions] = await Promise.all([
        fetchScykNghiemTrong(),
        fetchBaoCaoScyk()
      ]);
      setReports(reportsData);
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
      trang_thai_xu_ly: 'Đang xử lý'
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

  const renderOverview = () => {
    const totalReports = reports.length;
    const completedReports = reports.filter(r => r.trang_thai_xu_ly === 'Đã kết luận').length;
    const ongoingReports = reports.filter(r => r.trang_thai_xu_ly === 'Đang xử lý').length;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Quick Stats Grid */}
        <div className="indicator-quick-stats grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="indicator-quick-stat-card bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
            <div className="indicator-quick-stat-icon w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle size={20} />
            </div>
            <div className="indicator-quick-stat-body">
              <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight">Tổng số sự cố NT</h4>
              <p className="indicator-quick-stat-value text-xl font-black text-slate-800 leading-tight mt-0.5">{totalReports}</p>
            </div>
          </div>

          <div className="indicator-quick-stat-card bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
            <div className="indicator-quick-stat-icon w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Clock size={20} />
            </div>
            <div className="indicator-quick-stat-body">
              <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight">Đang xử lý</h4>
              <p className="indicator-quick-stat-value text-xl font-black text-slate-800 leading-tight mt-0.5">{ongoingReports}</p>
            </div>
          </div>

          <div className="indicator-quick-stat-card bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
            <div className="indicator-quick-stat-icon w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 size={20} />
            </div>
            <div className="indicator-quick-stat-body">
              <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight">Đã kết luận</h4>
              <p className="indicator-quick-stat-value text-xl font-black text-slate-800 leading-tight mt-0.5">{completedReports}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-slate-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
              <TrendingUp size={20} className="text-[#059669]" />
              Diễn biến gần đây
            </h3>
            <button onClick={() => setActiveTab('REPORTS')} className="text-[#059669] text-xs font-bold hover:underline">Xem chi tiết</button>
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



  const renderReportList = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[300px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Tìm kiếm mã sự cố, đơn vị, nội dung..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-table focus:ring-2 focus:ring-green-500/20 transition-all font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-100 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors">
              <Filter size={16} /> Lọc nâng cao
            </button>
            <button onClick={handleAddReport} className="bg-[#059669] text-white px-5 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider hover:shadow-lg hover:shadow-green-900/20 transition-all active:scale-95">
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
                       <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#059669]" /> {report.ngay_bao_cao}</span>
                       <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#059669]" /> {report.don_vi}</span>
                       <span className="flex items-center gap-1.5"><User size={14} className="text-[#059669]" /> {report.nguoi_bao_cao}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                   <button onClick={() => handleEditReport(report)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg hover:text-[#059669] transition-colors" title="Chỉnh sửa"><Edit size={18} /></button>
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
                <button onClick={handleAddReport} className="mt-6 text-[#059669] text-xs font-black uppercase tracking-widest border-b-2 border-green-200 hover:border-green-500 transition-all pb-1 mx-auto block">Gửi báo cáo đầu tiên</button>
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
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm shrink-0 border border-red-100">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl md:text-main-title font-bold text-slate-800 tracking-tight leading-tight uppercase break-words">Sự cố ngoài y khoa nghiêm trọng</h2>
              <p className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest mt-1 leading-snug">Báo cáo & Phân tích sự cố y khoa loại nghiêm trọng</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="indicator-subtab-list indicator-subtab-list-2">
          <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={BarChart2} label="Tổng quan" />
          <TabButton active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} icon={List} label="Danh sách báo cáo" />
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50 space-y-4">
             <div className="w-10 h-10 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin"></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {activeTab === 'OVERVIEW' && renderOverview()}
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
                       <option value="Đang xử lý">Đang xử lý</option>
                       <option value="Đã kết luận">Đã hoàn thành kết luận</option>
                    </select>
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex gap-3">
                    <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-slate-500 font-black uppercase text-xs tracking-wider hover:bg-slate-50 rounded-xl transition-colors">Hủy bỏ</button>
                    <button type="submit" className="flex-[2] py-3 bg-[#059669] text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all">Lưu thông tin</button>
                 </div>
              </form>
           </div>
        </div>
      )}


    </div>
  );
};
