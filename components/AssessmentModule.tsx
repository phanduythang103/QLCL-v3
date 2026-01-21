import React, { useState, useRef, useEffect } from 'react';
import { 
  ClipboardList, Award, ChevronRight, FileCheck, Star, 
  Upload, Plus, FileSpreadsheet, Search, Filter, Download,
  MoreHorizontal, CheckCircle2, AlertCircle, Paperclip,
  UserPlus, FileText, Printer, Save, Eye, Edit2, Trash2, RefreshCw
} from 'lucide-react';
import { 
  fetchBo83TieuChi, Bo83TieuChi,
  fetchBoTieuChuan, BoTieuChuan, deleteBoTieuChuan,
  fetchKetQuaDanhGia, KetQuaDanhGia
} from '../readDanhGiaChatLuong';

// --- Types ---

type AssessmentTab = 'CRITERIA_83' | 'BASIC';

export const AssessmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('CRITERIA_83');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Đã tải lên file danh mục: ${file.name}. Hệ thống đang cập nhật bộ tiêu chí...`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Đánh giá Chất lượng Bệnh viện</h2>
          <p className="text-sm text-slate-500">Tự đánh giá, chấm điểm và theo dõi cải tiến chất lượng theo các bộ tiêu chuẩn.</p>
        </div>
        
        {/* Global Actions */}
        <div className="flex flex-wrap gap-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
          />
          <button 
            onClick={handleFileUpload}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Upload size={16} /> Upload Danh mục Excel
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
            <Printer size={16} /> Xuất mẫu báo cáo
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-2">
        <button
          onClick={() => setActiveTab('CRITERIA_83')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'CRITERIA_83'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award size={18} />
          Bộ 83 Tiêu chí Chất lượng
        </button>
        <button
          onClick={() => setActiveTab('BASIC')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'BASIC'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList size={18} />
          Bộ Tiêu chuẩn Cơ bản
        </button>
      </div>

      {/* Content Rendering */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'CRITERIA_83' ? <Criteria83View /> : <BasicStandardsView />}
      </div>
    </div>
  );
};

// --- View 1: Bộ 83 Tiêu chí ---
const Criteria83View = () => {
  const [criteria, setCriteria] = useState<Bo83TieuChi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBo83TieuChi();
      setCriteria(data);
    } catch (err) {
      setError('Không thể tải dữ liệu tiêu chí. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate group scores dynamically
  const groupScores = ['A', 'B', 'C', 'D', 'E'].map(nhom => {
    const groupItems = criteria.filter(c => c.nhom === nhom);
    const avgScore = groupItems.length > 0 
      ? groupItems.reduce((acc, c) => acc + (c.diem_tu_cham || 0), 0) / groupItems.length 
      : 0;
    return { id: nhom, score: Number(avgScore.toFixed(1)), items: groupItems.length };
  });

  const avgScore = groupScores.length > 0 
    ? (groupScores.reduce((acc, g) => acc + g.score, 0) / groupScores.length).toFixed(2)
    : '0.00';
  
  return (
    <div className="space-y-6">
       {/* Top Stats & Summary */}
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-yellow-500 fill-yellow-500" /> 
                    Kết quả Tự đánh giá (Tổng hợp)
                  </h3>
                  <span className="text-2xl font-bold text-primary-600">{avgScore}/5.0</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {groupScores.map((group) => (
                    <div key={group.id} className="text-center p-2 rounded-lg bg-slate-50 hover:bg-primary-50 transition-colors cursor-pointer border border-transparent hover:border-primary-100">
                        <div className="text-xs font-bold text-slate-500 mb-1">{group.id}</div>
                        <div className={`text-lg font-bold ${
                            group.score >= 4 ? 'text-primary-600' : group.score >= 3 ? 'text-amber-500' : 'text-red-500'
                        }`}>{group.score}</div>
                        <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                             <div className={`h-full ${group.score >= 4 ? 'bg-primary-500' : group.score >= 3 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${(group.score/5)*100}%`}}></div>
                        </div>
                    </div>
                ))}
              </div>
          </div>
          
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-600 shadow-sm mb-3">
                  <FileText size={24} />
              </div>
              <h4 className="font-bold text-primary-800 mb-1">Báo cáo Sở Y tế</h4>
              <p className="text-xs text-primary-600 mb-4">Xuất dữ liệu theo mẫu kiểm tra đánh giá chất lượng hàng năm.</p>
              <button className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
                  Xuất báo cáo
              </button>
          </div>
       </div>

       {/* Detailed Scoring Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
             <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-primary-600" size={20} />
                <h3 className="font-bold text-slate-800">Bảng chấm điểm chi tiết & Minh chứng</h3>
             </div>
             
             <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm tiêu chí, đơn vị phụ trách..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    />
                </div>
                <button className="px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">
                    <Filter size={18} />
                </button>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-primary-600 text-white font-bold border-b border-primary-700 uppercase text-xs">
                   <tr>
                      <th className="px-6 py-4 w-20">Mã</th>
                      <th className="px-6 py-4 min-w-[250px]">Tên tiêu chí</th>
                      <th className="px-6 py-4 w-40">Phân công</th>
                      <th className="px-6 py-4 text-center w-24">Tự chấm</th>
                      <th className="px-6 py-4 text-center w-24">Đoàn chấm</th>
                      <th className="px-6 py-4 text-center w-24">Minh chứng</th>
                      <th className="px-6 py-4 text-center w-32">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {loading && (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                   )}
                   {error && (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-red-600">{error}</td></tr>
                   )}
                   {!loading && !error && criteria.length === 0 && (
                      <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400 italic">Chưa có tiêu chí nào</td></tr>
                   )}
                   {!loading && !error && criteria.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-bold text-primary-700">{item.ma_tieu_chi}</td>
                         <td className="px-6 py-4 text-slate-700 font-medium">
                            {item.ten_tieu_chi}
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              Cập nhật: {item.ngay_cap_nhat ? new Date(item.ngay_cap_nhat).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded w-fit">
                                <UserPlus size={12} className="text-slate-500" />
                                <span className="text-slate-700 font-medium">{item.don_vi_phu_trach || 'Chưa phân công'}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            {item.trang_thai !== 'PENDING' && item.diem_tu_cham ? (
                                <span className="inline-block w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold leading-8">{item.diem_tu_cham}</span>
                            ) : <span className="text-slate-300">-</span>}
                         </td>
                         <td className="px-6 py-4 text-center">
                            {item.diem_doan_cham && item.diem_doan_cham > 0 ? (
                                <span className={`inline-block w-8 h-8 rounded-full font-bold leading-8 text-white ${
                                    item.diem_doan_cham >= 4 ? 'bg-green-500' : item.diem_doan_cham >= 3 ? 'bg-amber-500' : 'bg-red-500'
                                }`}>
                                    {item.diem_doan_cham}
                                </span>
                            ) : <span className="text-slate-300">-</span>}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <button className={`flex items-center justify-center gap-1 mx-auto px-2 py-1 rounded text-xs transition-colors ${
                                (item.so_minh_chung || 0) > 0 ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' : 'text-slate-400 hover:bg-slate-100'
                            }`}>
                                <Paperclip size={14} />
                                <span className="font-bold">{item.so_minh_chung || 0}</span>
                            </button>
                         </td>
                         <td className="px-6 py-4 text-center">
                            {item.trang_thai === 'DONE' && <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Hoàn thành</span>}
                            {item.trang_thai === 'REVIEW' && <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Đang rà soát</span>}
                            {item.trang_thai === 'DRAFT' && <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Đang chấm</span>}
                            {item.trang_thai === 'PENDING' && <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full">Chưa chấm</span>}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="flex items-center gap-1 ml-auto text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-primary-200 hover:border-primary-300">
                                <FileCheck size={14} /> Chấm điểm
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
             <span>Hiển thị {criteria.length}/83 tiêu chí</span>
             <button onClick={loadData} className="flex items-center gap-1 text-primary-600 hover:underline">
               <RefreshCw size={12} /> Làm mới
             </button>
          </div>
       </div>
    </div>
  );
}

// --- View 2: Bộ Tiêu chuẩn Cơ bản ---
const BasicStandardsView = () => {
  const [standards, setStandards] = useState<BoTieuChuan[]>([]);
  const [evaluations, setEvaluations] = useState<KetQuaDanhGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stdData, evalData] = await Promise.all([
        fetchBoTieuChuan(),
        fetchKetQuaDanhGia()
      ]);
      setStandards(stdData);
      setEvaluations(evalData);
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa bộ tiêu chuẩn này?')) {
      try {
        await deleteBoTieuChuan(id);
        loadData();
      } catch (err) {
        console.error('Lỗi xóa:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* List of Standards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Danh mục Bộ tiêu chuẩn chất lượng</h3>
                <p className="text-sm text-slate-500">Các bộ tiêu chuẩn xây dựng riêng cho từng lĩnh vực.</p>
             </div>
             <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm">
                <Plus size={16} /> Thêm bộ tiêu chuẩn mới
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-primary-600 text-white font-bold border-b border-primary-700 uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">Mã & Tên bộ tiêu chuẩn</th>
                   <th className="px-6 py-4">Đơn vị phụ trách</th>
                   <th className="px-6 py-4">Tần suất đánh giá</th>
                   <th className="px-6 py-4 text-center">Trạng thái</th>
                   <th className="px-6 py-4 text-right">Thao tác</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {loading && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                 )}
                 {error && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-red-600">{error}</td></tr>
                 )}
                 {!loading && !error && standards.length === 0 && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Chưa có bộ tiêu chuẩn nào</td></tr>
                 )}
                 {!loading && !error && standards.map(std => (
                   <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="font-bold text-slate-800">{std.ten_tieu_chuan}</div>
                       <div className="text-xs text-slate-500 font-mono mt-1">{std.ma_tieu_chuan}</div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-slate-700">
                           <UserPlus size={14} className="text-slate-400" />
                           {std.don_vi_phu_trach || 'Chưa phân công'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                         {std.tan_suat || 'Chưa xác định'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          std.trang_thai === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {std.trang_thai === 'ACTIVE' ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Xem"><Eye size={16} /></button>
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit2 size={16} /></button>
                          <button 
                            onClick={() => handleDelete(std.id!)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase">Kết quả chấm điểm gần đây</h3>
            <div className="flex gap-2">
               <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Search size={14} /></button>
               <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Filter size={14} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-primary-600 text-white font-bold text-xs uppercase border-b border-primary-700">
                 <tr>
                   <th className="px-6 py-3">Đơn vị được đánh giá</th>
                   <th className="px-6 py-3">Bộ tiêu chuẩn áp dụng</th>
                   <th className="px-6 py-3">Ngày đánh giá</th>
                   <th className="px-6 py-3 text-center">Điểm số</th>
                   <th className="px-6 py-3 text-right">Kết quả</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {loading && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                 )}
                 {!loading && evaluations.length === 0 && (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">Chưa có kết quả đánh giá nào</td></tr>
                 )}
                 {!loading && evaluations.map(evalItem => (
                   <tr key={evalItem.id} className="hover:bg-slate-50">
                     <td className="px-6 py-3 font-bold text-slate-800">{evalItem.don_vi_duoc_danh_gia}</td>
                     <td className="px-6 py-3 text-slate-600">{evalItem.ten_tieu_chuan}</td>
                     <td className="px-6 py-3 text-slate-500 text-xs">
                       {evalItem.ngay_danh_gia ? new Date(evalItem.ngay_danh_gia).toLocaleDateString('vi-VN') : ''}
                     </td>
                     <td className="px-6 py-3 text-center font-bold text-primary-600">{evalItem.diem_so}/100</td>
                     <td className="px-6 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          evalItem.ket_qua === 'Đạt' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                             {evalItem.ket_qua}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 text-center flex justify-between items-center">
             <span className="text-xs text-slate-500">{evaluations.length} kết quả đánh giá</span>
             <button onClick={loadData} className="text-sm text-primary-600 hover:underline font-medium flex items-center gap-1">
               <RefreshCw size={12} /> Làm mới
             </button>
          </div>
        </div>
    </div>
  );
}