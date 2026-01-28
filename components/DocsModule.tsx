import React, { useState, useEffect } from 'react';
import {
  Search, FileText, Download, Filter, Bookmark, Globe, Building,
  Landmark, ShieldCheck, Eye, Link, PlayCircle, GraduationCap,
  HelpCircle, CheckSquare, Youtube, Lightbulb, MessageCircle,
  BookOpen, Video, Plus, Edit2, Trash2, Heart, X, Save,
  ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { fetchThuVienVb, addThuVienVb, updateThuVienVb, deleteThuVienVb } from '../readThuVienVb';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { fetchThuVienVideo, addThuVienVideo, deleteThuVienVideo } from '../readThuVienVideo';
import {
  fetchChiaSe, addChiaSe, deleteChiaSe, updateChiaSe,
  fetchComments, addComment, fetchReactions, toggleReaction, fetchBookmarks, toggleBookmark
} from '../readChiaSe';

import { fetchCoQuanBanHanh, addCoQuanBanHanh } from '../readCoQuanBanHanh';

type MainTab = 'LIBRARY' | 'TRAINING' | 'SHARING';

interface FormModalProps {
  formData: any;
  setFormData: (data: any) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  fileUpload: File | null;
  setFileUpload: (file: File | null) => void;
  coQuanList: any[];
  loaiVbList: string[];
  onAddCoQuan: (name: string) => Promise<void>;
}

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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'LIBRARY'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600'
              : 'text-primary-600 hover:bg-white hover:shadow-sm'
              }`}
          >
            <FileText size={18} /> Thư viện Văn bản
          </button>
          <button
            onClick={() => setActiveTab('TRAINING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'TRAINING'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-200 ring-1 ring-primary-600'
              : 'text-primary-600 hover:bg-white hover:shadow-sm'
              }`}
          >
            <GraduationCap size={18} /> Đào tạo & E-Learning
          </button>
          <button
            onClick={() => setActiveTab('SHARING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'SHARING'
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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const initialFormData = {
    so_hieu_vb: '',
    ten_vb: '',
    loai_vb: '',
    co_quan_ban_hanh: '',
    hieu_luc: '',
    trang_thai: 'Còn hiệu lực',
    file_dinh_kem: '',
    file_van_ban: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const [coQuanList, setCoQuanList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, coQuanData] = await Promise.all([
        fetchThuVienVb(),
        fetchCoQuanBanHanh()
      ]);
      setDocs(docsData || []);
      setCoQuanList(coQuanData || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoQuan = async (name: string) => {
    try {
      const newItem = await addCoQuanBanHanh({ ten_co_quan: name });
      if (newItem) {
        setCoQuanList([...coQuanList, newItem]);
        return;
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi thêm cơ quan ban hành");
    }
  }

  // Derive unique document types
  const loaiVbList = Array.from(new Set(docs.map(d => d.loai_vb).filter(Boolean))) as string[];

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
      let filePath = formData.file_van_ban; // Keep existing path by default
      if (fileUpload) {
        // Tạo tên file duy nhất
        const ext = fileUpload.name.split('.').pop();
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { data, error } = await supabase.storage.from('vanban').upload(uniqueName, fileUpload);
        if (error) throw error;
        filePath = uniqueName;
      }

      const saveData = { ...formData, file_van_ban: filePath };

      if (editingId) {
        await updateThuVienVb(editingId, saveData);
      } else {
        await addThuVienVb(saveData);
      }

      setShowForm(false);
      setFormData(initialFormData);
      setEditingId(null);
      setFileUpload(null);
      loadData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (doc: any) => {
    setFormData({
      so_hieu_vb: doc.so_hieu_vb || '',
      ten_vb: doc.ten_vb || '',
      loai_vb: doc.loai_vb || '',
      co_quan_ban_hanh: doc.co_quan_ban_hanh || '',
      hieu_luc: doc.hieu_luc ? doc.hieu_luc.split('T')[0] : '',
      trang_thai: doc.trang_thai || 'Còn hiệu lực',
      file_dinh_kem: doc.file_dinh_kem || '',
      file_van_ban: doc.file_van_ban || ''
    });
    // Store ID for update logic if needed, currently addThuVienVb handles insert. 
    // We might need to update addThuVienVb to handle upsert or add updateThuVienVb support properly.
    // For now, assuming basic edit populates form. Ideally we need an editingId state.
    setEditingId(doc.id);
    setShowForm(true);
  };

  const handleView = async (doc: any) => {
    if (doc.file_van_ban) {
      // Get signed URL from Supabase
      try {
        const { data, error } = await supabase.storage.from('vanban').createSignedUrl(doc.file_van_ban, 3600);
        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      } catch (err) {
        console.error('Error getting file URL:', err);
        alert('Không thể mở file văn bản. Vui lòng thử lại.');
      }
    } else {
      alert('Văn bản này không có file đính kèm.');
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
  // Pagination
  const totalRows = filteredDocs.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const pagedDocs = filteredDocs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // FormModal moved outside

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/50">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setDocCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${docCategory === cat.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              <Plus size={16} /> <span>Thêm VB</span>
            </button>
            <div className="relative w-full sm:w-64">
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
          <div className="flex gap-2 items-center mt-2 sm:mt-0">
            <label htmlFor="rowsPerPage" className="text-xs text-slate-600">Hiển thị</label>
            <select id="rowsPerPage" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="border border-slate-300 rounded px-2 py-1 text-xs">
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} dòng</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="p-8 text-center text-slate-500">Đang tải...</div>}
      {error && <div className="p-8 text-center text-red-500">Lỗi: {error}</div>}

      {!loading && !error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
                <tr>
                  <th className="px-3 py-2 w-1/4">Số hiệu</th>
                  <th className="px-3 py-2 w-1/2">Tên văn bản</th>
                  <th className="px-3 py-2 w-1/4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700 whitespace-nowrap">{doc.so_hieu_vb}</td>
                    <td className="px-3 py-2 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                      <div className="font-semibold text-slate-800 text-sm line-clamp-2 hover:text-primary-600 hover:underline transition-all" title="Bấm để xem chi tiết">{doc.ten_vb}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(doc)} className="flex items-center gap-1 px-2 py-1 text-primary-600 hover:bg-primary-50 rounded text-xs font-medium border border-primary-100" title="Xem"><Eye size={14} /> <span>Xem</span></button>
                        <button onClick={() => handleEdit(doc)} className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium border border-blue-100" title="Sửa"><Edit2 size={14} /> <span>Sửa</span></button>
                        <button onClick={() => handleDelete(doc.id)} className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium border border-red-100" title="Xóa"><Trash2 size={14} /> <span>Xóa</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedDocs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500 italic">Chưa có văn bản nào trong thư viện.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-2">
            {pagedDocs.map((doc) => (
              <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="bg-slate-100 text-slate-600 font-mono text-xs px-2 py-1 rounded w-fit shrink-0">{doc.so_hieu_vb}</div>
                  <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${doc.trang_thai === 'Còn hiệu lực' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{doc.trang_thai || 'N/A'}</div>
                </div>
                <div onClick={() => setSelectedDoc(doc)} className="cursor-pointer">
                  <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-3 hover:text-primary-600">{doc.ten_vb}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="truncate max-w-[150px]">{doc.co_quan_ban_hanh || 'N/A'}</span>
                    <span>•</span>
                    <span>{doc.ngay_ban_hanh || 'N/A'}</span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 mt-1">
                  <button onClick={() => handleView(doc)} className="flex items-center justify-center gap-1 px-3 py-2 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded text-xs font-semibold" title="Xem">
                    <Eye size={16} /> Xem
                  </button>
                  <button onClick={() => handleEdit(doc)} className="flex items-center justify-center gap-1 px-3 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-xs font-semibold" title="Sửa">
                    <Edit2 size={16} /> Sửa
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="flex items-center justify-center gap-1 px-3 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded text-xs font-semibold" title="Xóa">
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </div>
            ))}
            {pagedDocs.length === 0 && (
              <div className="py-12 text-center text-slate-500 italic">Chưa có văn bản nào.</div>
            )}
          </div>
          {/* Pagination controls */}
          {totalRows > 0 && (
            <div className="flex flex-wrap justify-between items-center gap-2 p-2 text-xs">
              <span>Trang {page}/{totalPages || 1}</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 rounded border text-slate-600 disabled:opacity-50">Trước</button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 rounded border text-slate-600 disabled:opacity-50">Sau</button>
              </div>
              <span>Hiển thị {pagedDocs.length} / {totalRows} văn bản</span>
            </div>
          )}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
            Hiển thị {filteredDocs.length} văn bản
          </div>
        </>
      )}

      {showForm && (
        <FormModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          saving={saving}
          fileUpload={fileUpload}
          setFileUpload={setFileUpload}
          coQuanList={coQuanList}
          loaiVbList={loaiVbList}
          onAddCoQuan={handleAddCoQuan}
        />
      )}

      {selectedDoc && (
        <DetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}
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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const initialFormData = {
    tieu_de: '',
    noi_dung: '',
    phan_loai: 'Thực hành tốt',
    hinh_anh: '',
    video: '',
    file_tai_lieu: '',
    nguoi_dang: user?.full_name || 'Anonymous'
  };

  const [formData, setFormData] = useState(initialFormData);
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await fetchChiaSe();
      setArticles(data || []);
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    try {
      const data = await fetchBookmarks(user.id);
      setBookmarks(data);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    }
  };

  useEffect(() => {
    loadArticles();
    if (user) loadBookmarks();
  }, [user]);

  const handleToggleBookmark = async (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const isBookmarked = bookmarks.includes(articleId);
    try {
      await toggleBookmark(articleId, user.id, !isBookmarked);
      loadBookmarks();
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleSave = async () => {
    if (!formData.tieu_de.trim() || !formData.noi_dung.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }
    setSaving(true);
    try {
      let uploadPath = '';
      if (fileUpload) {
        const ext = fileUpload.name.split('.').pop();
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from('chia_se_file').upload(uniqueName, fileUpload);
        if (error) throw error;
        uploadPath = uniqueName;
      }

      const saveData = {
        ...formData,
        nguoi_dang: user?.full_name || formData.nguoi_dang
      };

      if (uploadPath) {
        if (fileUpload?.type.startsWith('image/')) {
          saveData.hinh_anh = uploadPath;
        } else if (fileUpload?.type.startsWith('video/')) {
          saveData.video = uploadPath;
        } else {
          saveData.file_tai_lieu = uploadPath;
        }
      }

      if (editingId) {
        await updateChiaSe(editingId, saveData);
      } else {
        await addChiaSe(saveData);
      }

      setShowForm(false);
      setFormData(initialFormData);
      setEditingId(null);
      setFileUpload(null);
      loadArticles();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: any) => {
    setFormData({
      tieu_de: article.tieu_de || '',
      noi_dung: article.noi_dung || '',
      phan_loai: article.phan_loai || 'Thực hành tốt',
      hinh_anh: article.hinh_anh || '',
      video: article.video || '',
      file_tai_lieu: article.file_tai_lieu || '',
      nguoi_dang: article.nguoi_dang || user?.full_name || ''
    });
    setEditingId(article.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) {
      try {
        await deleteChiaSe(id);
        loadArticles();
      } catch (err: any) {
        alert('Lỗi: ' + err.message);
      }
    }
  };

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
        {loading && (
          <div className="col-span-full text-center py-8 text-slate-500">Đang tải bài viết...</div>
        )}

        {!loading && articles.map(article => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col group cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity -mr-12 -mt-12 pointer-events-none" />

            <div className="flex items-start justify-between mb-3 relative z-10">
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${getCategoryStyle(article.phan_loai || 'Khác')}`}>
                {article.phan_loai || 'Bài viết'}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleBookmark(article.id, e); }}
                  className={`p-1.5 rounded-full transition-colors ${bookmarks.includes(article.id) ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:bg-slate-100'}`}
                >
                  <Bookmark size={16} fill={bookmarks.includes(article.id) ? 'currentColor' : 'none'} />
                </button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(article); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(article.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors leading-tight">{article.tieu_de}</h3>
            <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">{article.noi_dung}</p>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                  {article.nguoi_dang?.[0]?.toUpperCase()}
                </div>
                <span className="text-slate-500">{article.nguoi_dang || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MessageSquare size={12} className="opacity-60" />
                  <span>{article.phan_loai === 'Hỏi đáp' ? 'Q&A' : ''}</span>
                </div>
                <span>{article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : '-'}</span>
              </div>
            </div>
          </div>
        ))}

        <div
          onClick={() => { setEditingId(null); setFormData(initialFormData); setShowForm(true); }}
          className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group h-full"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
            <Plus size={24} className="text-primary-600" />
          </div>
          <h3 className="font-bold text-slate-700">Đóng góp bài viết</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Chia sẻ kinh nghiệm, mô hình hay của khoa phòng bạn</p>
        </div>
      </div>

      {showForm && (
        <SharingFormModal
          formData={formData}
          setFormData={setFormData}
          fileUpload={fileUpload}
          setFileUpload={setFileUpload}
          onSave={handleSave}
          onClose={() => setShowForm(false)}
          saving={saving}
          isEdit={!!editingId}
        />
      )}

      {selectedArticle && (
        <SharingDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
          <HelpCircle className="text-purple-600" /> Câu hỏi thường gặp (Q&A)
        </h3>
        <div className="divide-y divide-slate-100">
          {articles.filter(a => a.phan_loai === 'Hỏi đáp').slice(0, 5).map((qa) => (
            <div key={qa.id} className="py-3">
              <h4 onClick={() => setSelectedArticle(qa)} className="font-medium text-slate-800 text-sm cursor-pointer hover:text-primary-600 line-clamp-1">{qa.tieu_de}</h4>
              <p className="text-sm text-slate-500 mt-1 pl-4 border-l-2 border-slate-200 line-clamp-2">{qa.noi_dung}</p>
            </div>
          ))}
          {articles.filter(a => a.phan_loai === 'Hỏi đáp').length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 italic">Chưa có câu hỏi nào được cập nhật.</p>
            </div>
          )}
        </div>
        <button className="mt-4 text-sm text-primary-600 font-medium hover:underline">Xem thêm câu hỏi...</button>
      </div>
    </div>
  );
};

const FormModal: React.FC<FormModalProps> = ({
  formData, setFormData, onClose, onSave, saving, fileUpload, setFileUpload, coQuanList, loaiVbList, onAddCoQuan
}) => {
  const [isAddingLoai, setIsAddingLoai] = useState(false);
  const [newLoai, setNewLoai] = useState('');
  const [isAddingCoQuan, setIsAddingCoQuan] = useState(false);
  const [newCoQuan, setNewCoQuan] = useState('');

  const handleAddNewLoai = () => {
    if (newLoai.trim()) {
      setFormData({ ...formData, loai_vb: newLoai.trim() });
      setIsAddingLoai(false);
      setNewLoai('');
    }
  }

  const handleAddNewCoQuan = async () => {
    if (newCoQuan.trim()) {
      await onAddCoQuan(newCoQuan.trim());
      setFormData({ ...formData, co_quan_ban_hanh: newCoQuan.trim() });
      setIsAddingCoQuan(false);
      setNewCoQuan('');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">Thêm văn bản mới</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">File văn bản (PDF, DOC...)</label>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.jpg,.png" onChange={e => setFileUpload(e.target.files?.[0] || null)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
              {fileUpload && <div className="text-xs text-slate-600 mt-1">Đã chọn: {fileUpload.name}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số hiệu VB *</label>
              <input type="text" value={formData.so_hieu_vb} onChange={e => setFormData({ ...formData, so_hieu_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="15/2023/QH15" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tên văn bản *</label>
              <input type="text" value={formData.ten_vb} onChange={e => setFormData({ ...formData, ten_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Thông tư hướng dẫn..." />
            </div>

            {/* Loại Văn Bản */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Loại văn bản *</label>
                {!isAddingLoai && <button onClick={() => setIsAddingLoai(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Thêm mới</button>}
              </div>
              {isAddingLoai ? (
                <div className="flex gap-2">
                  <input type="text" value={newLoai} onChange={e => setNewLoai(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Nhập loại mới..." autoFocus />
                  <button onClick={handleAddNewLoai} className="px-3 bg-primary-600 text-white rounded-lg text-xs">OK</button>
                  <button onClick={() => setIsAddingLoai(false)} className="px-3 bg-slate-200 text-slate-600 rounded-lg text-xs">Hủy</button>
                </div>
              ) : (
                <select value={formData.loai_vb} onChange={e => setFormData({ ...formData, loai_vb: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">-- Chọn loại văn bản --</option>
                  {loaiVbList.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            {/* Cơ Quan Ban Hành */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Cơ quan ban hành *</label>
                {!isAddingCoQuan && <button onClick={() => setIsAddingCoQuan(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Thêm mới</button>}
              </div>
              {isAddingCoQuan ? (
                <div className="flex gap-2">
                  <input type="text" value={newCoQuan} onChange={e => setNewCoQuan(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Nhập cơ quan mới..." autoFocus />
                  <button onClick={handleAddNewCoQuan} className="px-3 bg-primary-600 text-white rounded-lg text-xs">OK</button>
                  <button onClick={() => setIsAddingCoQuan(false)} className="px-3 bg-slate-200 text-slate-600 rounded-lg text-xs">Hủy</button>
                </div>
              ) : (
                <select value={formData.co_quan_ban_hanh} onChange={e => setFormData({ ...formData, co_quan_ban_hanh: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">-- Chọn cơ quan --</option>
                  {coQuanList.map((cq: any) => <option key={cq.id} value={cq.ten_co_quan}>{cq.ten_co_quan}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày có hiệu lực *</label>
              <input type="date" value={formData.hieu_luc} onChange={e => setFormData({ ...formData, hieu_luc: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái *</label>
              <select value={formData.trang_thai} onChange={e => setFormData({ ...formData, trang_thai: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                <option value="Còn hiệu lực">Còn hiệu lực</option>
                <option value="Hết hiệu lực">Hết hiệu lực</option>
                <option value="Dự thảo">Dự thảo</option>
                <option value="Hủy bỏ">Hủy bỏ</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Hủy</button>
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save size={16} />}
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ doc, onClose, onEdit, onView, onDelete }: { doc: any, onClose: () => void, onEdit: (d: any) => void, onView: (d: any) => void, onDelete: (id: string) => void }) => {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Chi tiết văn bản</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">{doc.so_hieu_vb}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên văn bản</label>
            <p className="text-slate-800 font-medium text-sm leading-relaxed">{doc.ten_vb}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Loại văn bản</label>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary-500" />
                <span className="text-sm text-slate-700">{doc.loai_vb || '---'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái</label>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${doc.trang_thai === 'Còn hiệu lực' ? 'bg-green-50 text-green-700 border-green-200' :
                doc.trang_thai === 'Hết hiệu lực' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                {doc.trang_thai}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Cơ quan ban hành</label>
              <div className="flex items-center gap-2">
                <Building size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700">{doc.co_quan_ban_hanh || '---'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày hiệu lực</label>
              <span className="text-sm text-slate-700">{doc.hieu_luc ? new Date(doc.hieu_luc).toLocaleDateString('vi-VN') : '---'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">File đính kèm</label>
            {doc.file_van_ban ? (
              <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary-100 rounded-lg group hover:border-primary-300 transition-colors cursor-pointer" onClick={() => onView(doc)}>
                <div className="bg-white p-2 rounded border border-primary-100">
                  <Download size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-primary-700 truncate">{doc.file_van_ban.split('/').pop()}</p>
                  <p className="text-xs text-primary-500">Nhấn để xem hoặc tải về</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Không có file đính kèm.</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={() => { onEdit(doc); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Edit2 size={16} /> Sửa văn bản
          </button>
          <button onClick={() => { if (window.confirm('Xóa?')) { onDelete(doc.id); onClose(); } }} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
            <Trash2 size={16} /> Xóa
          </button>
          <button onClick={() => onView(doc)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Eye size={16} /> Xem nội dung
          </button>
        </div>
      </div>
    </div>
  );
};

const SharingFormModal = ({ formData, setFormData, fileUpload, setFileUpload, onSave, onClose, saving, isEdit }: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-slate-800">{isEdit ? 'Sửa bài viết' : 'Đóng góp bài viết mới'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề *</label>
            <input
              type="text"
              value={formData.tieu_de}
              onChange={e => setFormData({ ...formData, tieu_de: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại *</label>
            <select
              value={formData.phan_loai}
              onChange={e => setFormData({ ...formData, phan_loai: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="Thực hành tốt">Thực hành tốt</option>
              <option value="Bài học kinh nghiệm">Bài học kinh nghiệm</option>
              <option value="Hỏi đáp">Hỏi đáp</option>
              <option value="Thảo luận">Thảo luận</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung *</label>
            <textarea
              rows={6}
              value={formData.noi_dung}
              onChange={e => setFormData({ ...formData, noi_dung: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Nhập nội dung chia sẻ..."
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">File đính kèm (Ảnh, Video, Tài liệu)</label>
            <input
              type="file"
              onChange={e => setFileUpload(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {fileUpload && <p className="text-xs text-slate-500 mt-1">Đã chọn: {fileUpload.name}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Hủy</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save size={16} />}
            {saving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Đăng bài')}
          </button>
        </div>
      </div>
    </div>
  );
};

const SharingDetailModal = ({ article, onClose }: any) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [reactions, setReactions] = useState<any[]>([]);
  const { user } = useAuth();
  const [loadingComments, setLoadingComments] = useState(false);

  const loadSocialData = async () => {
    try {
      const [commentsData, reactionsData] = await Promise.all([
        fetchComments(article.id),
        fetchReactions(article.id)
      ]);
      setComments(commentsData);
      setReactions(reactionsData);
    } catch (err) {
      console.error('Error loading social data:', err);
    }
  };

  useEffect(() => {
    const getFileUrl = async () => {
      const path = article.hinh_anh || article.video || article.file_tai_lieu;
      if (path) {
        const { data } = supabase.storage.from('chia_se_file').getPublicUrl(path);
        if (data?.publicUrl) setFileUrl(data.publicUrl);
      }
    };
    getFileUrl();
    loadSocialData();
  }, [article]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setLoadingComments(true);
    try {
      await addComment(article.id, user.id, user.full_name, newComment);
      setNewComment('');
      loadSocialData();
    } catch (err) {
      alert('Lỗi khi gửi bình luận');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleReaction = async (type: 'like' | 'dislike') => {
    if (!user) return;
    const currentReaction = reactions.find(r => r.user_id === user.id);
    const newType = currentReaction?.type === type ? null : type;
    try {
      await toggleReaction(article.id, user.id, newType);
      loadSocialData();
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  const likeCount = reactions.filter(r => r.type === 'like').length;
  const dislikeCount = reactions.filter(r => r.type === 'dislike').length;
  const userReaction = reactions.find(r => r.user_id === user?.id)?.type;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-20 flex justify-between items-start">
          <div>
            <span className="px-2 py-0.5 rounded bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest">{article.phan_loai || 'Chia sẻ'}</span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">{article.tieu_de}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={24} /></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Main Content */}
          <div className="lg:col-span-2 p-8">
            <div className="flex items-center gap-4 mb-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                  {article.nguoi_dang?.[0]?.toUpperCase()}
                </div>
                <span className="font-bold text-slate-700">{article.nguoi_dang || 'Anonymous'}</span>
              </div>
              <span>•</span>
              <span>{article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : '-'}</span>
            </div>

            <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap mb-8">
              {article.noi_dung}
            </div>

            {fileUrl && (
              <div className="my-8">
                {article.hinh_anh && <img src={fileUrl} alt="Article attachment" className="rounded-xl shadow-lg w-full object-cover" />}
                {article.video && <video src={fileUrl} controls className="w-full rounded-xl shadow-lg" />}
                {article.file_tai_lieu && (
                  <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                    <FileText className="text-primary-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Tải tài liệu đính kèm</p>
                      <p className="text-xs text-slate-500">Nhấn để xem hoặc tải về máy</p>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Reaction Bar */}
            <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
              <button
                onClick={() => handleToggleReaction('like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${userReaction === 'like' ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ThumbsUp size={20} fill={userReaction === 'like' ? 'currentColor' : 'none'} />
                <span className="font-bold">{likeCount || 0}</span>
              </button>
              <button
                onClick={() => handleToggleReaction('dislike')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${userReaction === 'dislike' ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ThumbsDown size={20} fill={userReaction === 'dislike' ? 'currentColor' : 'none'} />
                <span className="font-bold">{dislikeCount || 0}</span>
              </button>
            </div>
          </div>

          {/* Comment Section (Right Column) */}
          <div className="p-6 bg-slate-50 flex flex-col max-h-[70vh] lg:max-h-full overflow-hidden">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageCircle size={14} /> Bình luận ({comments.length})
            </h4>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
              {comments.map((comment, idx) => (
                <div key={comment.id || idx} className="bg-white p-3 rounded-xl shadow-sm border border-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-700">{comment.user_full_name}</span>
                    <span className="text-[8px] text-slate-400 font-mono">{new Date(comment.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="text-slate-300 mx-auto mb-2 opacity-30" />
                  <p className="text-xs text-slate-400 italic">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                </div>
              )}
            </div>

            <div className="mt-auto">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="w-full p-3 pr-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none shadow-sm"
                  rows={2}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loadingComments}
                  className="absolute right-3 bottom-3 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-200"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

