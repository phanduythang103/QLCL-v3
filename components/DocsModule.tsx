import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, Download, Filter, Bookmark, Globe, Building, 
  Landmark, ShieldCheck, Eye, Link, PlayCircle, GraduationCap, 
  HelpCircle, CheckSquare, Youtube, Lightbulb, MessageCircle, 
  BookOpen, Video, Plus, Edit2, Trash2, Heart, X, Save
} from 'lucide-react';
import { fetchThuVienVb, addThuVienVb, updateThuVienVb, deleteThuVienVb } from '../readThuVienVb';
import { fetchThuVienVideo, addThuVienVideo, deleteThuVienVideo } from '../readThuVienVideo';
import { fetchChiaSe, addChiaSe, deleteChiaSe } from '../readChiaSe';

type MainTab = 'LIBRARY' | 'TRAINING' | 'SHARING';

export const DocsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('LIBRARY');

  return (
    <div className="space-y-6">
      {/* Module Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Văn bản - Đào tạo - Thư viện</h2>
           <p className="text-sm text-slate-500">Hệ thống tri thức Quản lý chất lượng Bệnh viện 103.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
           <button 
             onClick={() => setActiveTab('LIBRARY')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'LIBRARY' 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600' 
                : 'text-primary-600 hover:bg-white hover:shadow-sm'
             }`}
           >
             <FileText size={18} /> Thư viện Văn bản
           </button>
           <button 
             onClick={() => setActiveTab('TRAINING')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'TRAINING' 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600' 
                : 'text-primary-600 hover:bg-white hover:shadow-sm'
             }`}
           >
             <GraduationCap size={18} /> Đào tạo & E-Learning
           </button>
           <button 
             onClick={() => setActiveTab('SHARING')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'SHARING' 
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600' 
                : 'text-primary-600 hover:bg-white hover:shadow-sm'
             }`}
           >
             <Lightbulb size={18} /> Góc Chia sẻ
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'LIBRARY' && <DocumentLibrary />}
        {activeTab === 'TRAINING' && <TrainingCenter />}
        {activeTab === 'SHARING' && <KnowledgeSharing />}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: DOCUMENT LIBRARY ---
const DocumentLibrary = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [docCategory, setDocCategory] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    so_hieu_vb: '',
    ten_vb: '',
    loai_vb: '',
    linh_vuc: '',
    phan_loai: 'MOH',
    co_quan_ban_hanh: '',
    ngay_hieu_luc: '',
    tieu_chi_lien_quan: '',
    trang_thai: 'Còn hiệu lực',
    ghi_chu: ''
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchThuVienVb();
      setDocs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.so_hieu_vb.trim() || !formData.ten_vb.trim()) {
      alert('Vui lòng nhập số hiệu và tên văn bản');
      return;
    }
    setSaving(true);
    try {
      await addThuVienVb(formData);
      setShowForm(false);
      setFormData({
        so_hieu_vb: '', ten_vb: '', loai_vb: '', linh_vuc: '', phan_loai: 'MOH',
        co_quan_ban_hanh: '', ngay_hieu_luc: '', tieu_chi_lien_quan: '', trang_thai: 'Còn hiệu lực', ghi_chu: ''
      });
      loadData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa văn bản này?')) {
      try {
        await deleteThuVienVb(id);
        loadData();
      } catch (err: any) {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  const CATEGORIES = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'LEGAL', label: 'Pháp lý', icon: <Landmark size={14} /> },
    { id: 'MOH', label: 'Bộ Y tế', icon: <ShieldCheck size={14} /> },
    { id: 'HOSPITAL', label: 'Nội bộ BV', icon: <Building size={14} /> },
    { id: 'SOP', label: 'Quy trình SOP', icon: <FileText size={14} /> },
    { id: 'INTL', label: 'Quốc tế', icon: <Globe size={14} /> },
  ];

  const filteredDocs = docs.filter(doc => 
    (docCategory === 'ALL' || doc.phan_loai === docCategory) &&
    ((doc.ten_vb || '').toLowerCase().includes(searchTerm.toLowerCase()) || (doc.so_hieu_vb || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Form Modal
  const FormModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-slate-800">Thêm văn bản mới</h3>
          <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số hiệu VB *</label>
              <input type="text" value={formData.so_hieu_vb} onChange={(e) => setFormData({ ...formData, so_hieu_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="15/2023/QH15" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại</label>
              <select value={formData.phan_loai} onChange={(e) => setFormData({ ...formData, phan_loai: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="LEGAL">Pháp lý</option>
                <option value="MOH">Bộ Y tế</option>
                <option value="HOSPITAL">Nội bộ BV</option>
                <option value="SOP">Quy trình SOP</option>
                <option value="INTL">Quốc tế</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên văn bản *</label>
              <input type="text" value={formData.ten_vb} onChange={(e) => setFormData({ ...formData, ten_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Thông tư hướng dẫn..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại văn bản</label>
              <input type="text" value={formData.loai_vb} onChange={(e) => setFormData({ ...formData, loai_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Thông tư, Nghị định..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lĩnh vực</label>
              <input type="text" value={formData.linh_vuc} onChange={(e) => setFormData({ ...formData, linh_vuc: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="QLCL, ATNB, KSNK..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cơ quan ban hành</label>
              <input type="text" value={formData.co_quan_ban_hanh} onChange={(e) => setFormData({ ...formData, co_quan_ban_hanh: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Bộ Y tế, Quốc hội..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày hiệu lực</label>
              <input type="date" value={formData.ngay_hieu_luc} onChange={(e) => setFormData({ ...formData, ngay_hieu_luc: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu chí liên quan</label>
              <input type="text" value={formData.tieu_chi_lien_quan} onChange={(e) => setFormData({ ...formData, tieu_chi_lien_quan: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="A1.1, D2.1..." />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save size={16} />}
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/50">
         <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setDocCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  docCategory === cat.id 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
         </div>
         <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              <Plus size={16} /> Thêm VB
            </button>
            <div className="relative w-full lg:w-64">
               <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
               <input 
                 type="text" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Tìm số hiệu, trích yếu..." 
                 className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
               />
            </div>
         </div>
      </div>
      
      {loading && <div className="p-8 text-center text-slate-500">Đang tải...</div>}
      {error && <div className="p-8 text-center text-red-500">Lỗi: {error}</div>}
      
      {!loading && !error && (
      <div className="overflow-x-auto">
         <table className="w-full text-sm text-left">
           <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
             <tr>
               <th className="px-6 py-4">Số hiệu & Tên văn bản</th>
               <th className="px-6 py-4">Loại / Lĩnh vực</th>
               <th className="px-6 py-4">Nơi ban hành</th>
               <th className="px-6 py-4">Hiệu lực</th>
               <th className="px-6 py-4 text-right">Thao tác</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {filteredDocs.map((doc) => (
               <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                 <td className="px-6 py-4">
                   <div className="font-semibold text-slate-800 text-sm line-clamp-2" title={doc.ten_vb}>{doc.ten_vb}</div>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{doc.so_hieu_vb}</span>
                      {doc.tieu_chi_lien_quan && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Tiêu chí {doc.tieu_chi_lien_quan}</span>}
                   </div>
                 </td>
                 <td className="px-6 py-4">
                   <div className="text-slate-800">{doc.loai_vb || '-'}</div>
                   <div className="text-xs text-slate-500">{doc.linh_vuc || '-'}</div>
                 </td>
                 <td className="px-6 py-4 text-slate-600">{doc.co_quan_ban_hanh || '-'}</td>
                 <td className="px-6 py-4 text-slate-600">{doc.ngay_hieu_luc || '-'}</td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Xem"><Eye size={16} /></button>
                                 <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit2 size={16} /></button>
                                 <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                            </div>
                         </td>
               </tr>
             ))}
             {filteredDocs.length === 0 && (
               <tr>
                 <td colSpan={5} className="py-12 text-center text-slate-500 italic">Chưa có văn bản nào trong thư viện.</td>
               </tr>
             )}
           </tbody>
         </table>
      </div>
      )}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
         Hiển thị {filteredDocs.length} văn bản
      </div>
      
      {showForm && <FormModal />}
    </div>
  );
};

// --- SUB-COMPONENT: TRAINING CENTER ---
const TrainingCenter = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await fetchThuVienVideo();
        setVideos(data || []);
      } catch (err) {
        console.error('Error loading videos:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  // Static data for quizzes and unit training (can be moved to Supabase later)
  const QUIZZES = [
    { id: 1, title: 'Bài kiểm tra An toàn người bệnh cơ bản', questions: 20, time: '30 phút', attempts: 3, bestScore: 95 },
    { id: 2, title: 'Kiến thức về 83 Tiêu chí chất lượng', questions: 50, time: '60 phút', attempts: 1, bestScore: 70 },
    { id: 3, title: 'Quy trình Báo động đỏ (Code Red)', questions: 15, time: '15 phút', attempts: 0, bestScore: 0 },
  ];

  const UNIT_TRAINING = [
    { id: 1, date: '12/06/2024', unit: 'Khoa Nội Tiêu hóa', content: 'Bình bệnh án, bình đơn thuốc', attendees: 15, status: 'Đã báo cáo' },
    { id: 2, date: '10/06/2024', unit: 'Khoa Ngoại Dã chiến', content: 'Tập huấn Quy trình KSNK vết mổ', attendees: 20, status: 'Đã báo cáo' },
  ];

  const thumbnailColors = ['bg-blue-100', 'bg-green-100', 'bg-teal-100', 'bg-purple-100', 'bg-amber-100'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
       {/* Left Column: Video Library & Quizzes */}
       <div className="lg:col-span-2 space-y-6">
          {/* Section: Video Library */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <Youtube className="text-red-600" size={20} /> 
                   Video Đào tạo & Quy trình mẫu
                </h3>
                <button className="text-sm text-primary-600 hover:underline">Xem tất cả</button>
             </div>
             {loading ? (
               <div className="text-center py-8 text-slate-500">Đang tải...</div>
             ) : videos.length === 0 ? (
               <div className="text-center py-8 text-slate-400 italic">Chưa có video đào tạo nào.</div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.slice(0, 4).map((video, idx) => (
                    <div key={video.id} className="group cursor-pointer">
                       <div className={`aspect-video rounded-lg ${video.thumbnail || thumbnailColors[idx % thumbnailColors.length]} relative flex items-center justify-center mb-2 overflow-hidden`}>
                          <PlayCircle className="w-12 h-12 text-slate-900/50 group-hover:text-red-600 transition-colors z-10" />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{video.thoi_luong || '--:--'}</span>
                       </div>
                       <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-primary-700">{video.tieu_de}</h4>
                       <p className="text-xs text-slate-500 mt-1">{video.tac_gia || 'N/A'} • {video.luot_xem || 0} lượt xem</p>
                    </div>
                  ))}
               </div>
             )}
          </section>

          {/* Section: Self-Study Quizzes */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                   <CheckSquare className="text-green-600" size={20} /> 
                   Ôn tập & Kiểm tra kiến thức
                </h3>
             </div>
             <div className="space-y-3">
                {QUIZZES.map(quiz => (
                   <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-primary-200 hover:bg-slate-50 transition-colors">
                      <div className="mb-2 sm:mb-0">
                         <h4 className="font-bold text-slate-800 text-sm">{quiz.title}</h4>
                         <div className="flex gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><HelpCircle size={12} /> {quiz.questions} câu hỏi</span>
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {quiz.time}</span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         {quiz.bestScore > 0 ? (
                            <div className="text-right">
                               <span className="block text-xs text-slate-400">Kết quả tốt nhất</span>
                               <span className={`font-bold ${quiz.bestScore >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{quiz.bestScore}/100</span>
                            </div>
                         ) : (
                            <span className="text-xs text-slate-400 italic">Chưa làm</span>
                         )}
                         <button className="px-4 py-2 bg-white border border-primary-200 text-primary-700 text-sm font-bold rounded-lg hover:bg-primary-600 hover:text-white transition-colors">
                            {quiz.attempts > 0 ? 'Làm lại' : 'Bắt đầu'}
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          </section>
       </div>

       {/* Right Column: Unit Training Logs */}
       <div className="space-y-6">
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-sm uppercase flex items-center gap-2">
                   <Building size={18} className="text-indigo-600" />
                   Hồ sơ đào tạo tại đơn vị
                </h3>
             </div>
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-4">
                <p>Các khoa/phòng cập nhật hoạt động tự đào tạo (bình bệnh án, sinh hoạt chuyên môn, tập huấn tại chỗ...) tại đây.</p>
             </div>
             
             <button className="w-full py-2 mb-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
                <Plus size={16} /> Đăng ký buổi đào tạo
             </button>

             <div className="space-y-4">
                {UNIT_TRAINING.map(item => (
                   <div key={item.id} className="relative pl-4 border-l-2 border-slate-200 pb-2">
                      <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white"></div>
                      <p className="text-xs text-slate-400 font-mono mb-0.5">{item.date}</p>
                      <h4 className="text-sm font-bold text-slate-800">{item.unit}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.content}</p>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.attendees} người tham gia</span>
                         <span className="text-[10px] text-green-600 font-bold">{item.status}</span>
                      </div>
                   </div>
                ))}
             </div>
             <button className="w-full mt-4 text-xs text-slate-500 hover:text-primary-600 text-center block">Xem lịch sử toàn viện</button>
          </section>
       </div>
    </div>
  );
};

// --- SUB-COMPONENT: KNOWLEDGE SHARING ---
const KnowledgeSharing = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await fetchChiaSe();
        setArticles(data || []);
      } catch (err) {
        console.error('Error loading articles:', err);
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, []);

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'Thực hành tốt': return 'bg-green-100 text-green-700';
      case 'Bài học kinh nghiệm': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading State */}
          {loading && (
            <div className="col-span-full text-center py-8 text-slate-500">Đang tải...</div>
          )}

          {/* Featured Articles from Supabase */}
          {!loading && articles.map(article => (
             <div key={article.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between mb-3">
                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(article.phan_loai || 'Khác')}`}>
                      {article.phan_loai || 'Bài viết'}
                   </span>
                   <Bookmark className="text-slate-300 hover:text-primary-600 cursor-pointer" size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 hover:text-primary-700 cursor-pointer">{article.tieu_de}</h3>
                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500">
                   <span>{article.ngay_dang || '-'}</span>
                   <span className="flex items-center gap-1"><Heart size={14} /> {article.luot_thich || 0} quan tâm</span>
                </div>
             </div>
          ))}
          
          {/* Add New Contribution Card */}
          <div className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <Plus size={24} className="text-primary-600" />
             </div>
             <h3 className="font-bold text-slate-700">Đóng góp bài viết</h3>
             <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Chia sẻ kinh nghiệm, mô hình hay của khoa phòng bạn</p>
          </div>
       </div>

       {/* FAQ Section */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
             <HelpCircle className="text-purple-600" /> Câu hỏi thường gặp (Q&A)
          </h3>
          <div className="divide-y divide-slate-100">
             <div className="py-3">
                <h4 className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600">Làm thế nào để đăng ký đề án cải tiến chất lượng mới?</h4>
                <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200">Các khoa phòng truy cập module "Cải tiến chất lượng", chọn "Lập kế hoạch mới" và điền theo mẫu PDCA. Sau khi lưu, Ban QLCL sẽ nhận được thông báo để duyệt.</p>
             </div>
             <div className="py-3">
                <h4 className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600">Thời gian báo cáo chỉ số chất lượng hàng tháng là khi nào?</h4>
                <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200">Hệ thống mở cổng nhập liệu từ ngày 25 đến ngày 30 hàng tháng. Sau thời gian này, dữ liệu sẽ bị khóa để tổng hợp báo cáo.</p>
             </div>
             <div className="py-3">
                <h4 className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600">Quên mật khẩu đăng nhập hệ thống thì liên hệ ai?</h4>
                <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200">Vui lòng liên hệ Ban Quản lý chất lượng (SĐT: 1234) hoặc Tổ Công nghệ thông tin để được cấp lại mật khẩu.</p>
             </div>
          </div>
          <button className="mt-4 text-sm text-primary-600 font-medium hover:underline">Xem thêm câu hỏi...</button>
       </div>
    </div>
  );
};
