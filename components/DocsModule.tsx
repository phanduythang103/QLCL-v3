import React, { useState, useEffect } from 'react';
import {
  Search, FileText, Download, Filter, Bookmark, Globe, Building,
  Landmark, ShieldCheck, Eye, Link, PlayCircle, GraduationCap,
  HelpCircle, CheckSquare, Youtube, Lightbulb, MessageCircle,
  BookOpen, Video, Plus, Edit2, Trash2, Heart, X, Save,
  ThumbsUp, ThumbsDown, MessageSquare, ChevronDown
} from 'lucide-react';
import { fetchThuVienVb, addThuVienVb, updateThuVienVb, deleteThuVienVb } from '../readThuVienVb';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { fetchDaoTao, addDaoTao, updateDaoTao, deleteDaoTao, DaoTao } from '../readDaoTao';
import {
  fetchChiaSe, addChiaSe, deleteChiaSe, updateChiaSe,
  fetchComments, addComment, fetchReactions, toggleReaction, fetchBookmarks, toggleBookmark
} from '../readChiaSe';
import { compressFile, compressFileForStorage } from '../utils/compression';

import { fetchCoQuanBanHanh, addCoQuanBanHanh } from '../readCoQuanBanHanh';
import { usePermissions } from '../contexts/PermissionsContext';

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
  return (
    <div className="docs-page min-h-full w-full">
      <DocumentLibrary />
    </div>
  );
};

// --- SUB-COMPONENT: DOCUMENT LIBRARY ---
const DocumentLibrary = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
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
    file_van_ban: '',
    phan_loai: 'Ban Quản lý chất lượng'
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
        // Nén file trước khi upload
        const compressedFile = await compressFile(fileUpload);

        // Tạo tên file duy nhất
        const ext = compressedFile.name.split('.').pop();
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { data, error } = await supabase.storage
          .from('vanban')
          .upload(uniqueName, compressedFile, { cacheControl: '31536000' });
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
      hieu_luc: doc.hieu_luc || '',
      trang_thai: doc.trang_thai || 'Còn hiệu lực',
      file_van_ban: doc.file_van_ban || '',
      phan_loai: doc.phan_loai || 'BYT'
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

  const uniqueAgencies = Array.from(new Set(docs.map(d => d.co_quan_ban_hanh).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));

  const filteredDocs = docs.filter(doc =>
    (docCategory === 'ALL' || (doc.co_quan_ban_hanh || '').trim().toLowerCase() === docCategory.toLowerCase().trim()) &&
    ((doc.ten_vb || '').toLowerCase().includes(searchTerm.toLowerCase()) || (doc.so_hieu_vb || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );
  // Pagination
  const totalRows = filteredDocs.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const pagedDocs = filteredDocs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // FormModal moved outside

  return (
    <div className="min-h-full w-full bg-white">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <label className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Bộ lọc:</label>
          <div className="relative flex-1 lg:w-80">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#059669] transition-colors" />
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">Tất cả cơ quan ban hành</option>
              {uniqueAgencies.map(agency => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex gap-2">
            {canCreate('DOCS') && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 bg-[#059669] text-white rounded-lg text-label font-black hover:bg-[#008800] transition-colors shadow-sm">
                <Plus size={16} /> <span>Thêm văn bản</span>
              </button>
            )}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm số hiệu, trích yếu..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-table text-black focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-[#059669]"
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
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="table-standardized w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 w-32">Số hiệu</th>
                  <th className="px-3 py-2">Tên văn bản</th>
                  <th className="px-3 py-2 w-40 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-3 font-mono text-table text-black truncate w-32" title={doc.so_hieu_vb}>{doc.so_hieu_vb}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                      <div className="text-black text-table line-clamp-2 hover:text-green-700 hover:underline transition-all" title="Bấm để xem chi tiết">{doc.ten_vb}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(doc)} className="flex items-center gap-1 px-2 py-1 text-primary-600 hover:bg-primary-50 rounded text-xs font-medium border border-primary-100" title="Xem"><Eye size={14} /> <span>Xem</span></button>
                        {canUpdate('DOCS') && (
                          <button onClick={() => handleEdit(doc)} className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium border border-blue-100" title="Sửa"><Edit2 size={14} /> <span>Sửa</span></button>
                        )}
                        {canDelete('DOCS') && (
                          <button onClick={() => handleDelete(doc.id)} className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium border border-red-100" title="Xóa"><Trash2 size={14} /> <span>Xóa</span></button>
                        )}
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
          <div className="md:hidden space-y-3 p-3">
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
                    <span>{doc.hieu_luc ? (!isNaN(Date.parse(doc.hieu_luc)) ? new Date(doc.hieu_luc).toLocaleDateString('vi-VN') : doc.hieu_luc) : 'N/A'}</span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 mt-1">
                  <button onClick={() => handleView(doc)} className="flex items-center justify-center gap-1 px-3 py-2 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded text-xs font-semibold" title="Xem">
                    <Eye size={16} /> Xem
                  </button>
                  {canUpdate('DOCS') && (
                    <button onClick={() => handleEdit(doc)} className="flex items-center justify-center gap-1 px-3 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-xs font-semibold" title="Sửa">
                      <Edit2 size={16} /> Sửa
                    </button>
                  )}
                  {canDelete('DOCS') && (
                    <button onClick={() => handleDelete(doc.id)} className="flex items-center justify-center gap-1 px-3 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded text-xs font-semibold" title="Xóa">
                      <Trash2 size={16} /> Xóa
                    </button>
                  )}
                </div>
              </div>
            ))}
            {pagedDocs.length === 0 && (
              <div className="py-12 text-center text-slate-500 italic">Chưa có văn bản nào.</div>
            )}
          </div>
          {/* Pagination controls */}
          {totalRows > 0 && (
            <div className="flex flex-wrap justify-between items-center gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs">
              <span>Trang {page}/{totalPages || 1}</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 rounded border text-slate-600 disabled:opacity-50">Trước</button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 rounded border text-slate-600 disabled:opacity-50">Sau</button>
              </div>
              <span>Hiển thị {pagedDocs.length} / {totalRows} văn bản</span>
            </div>
          )}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
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
export const TrainingCenter = () => {
  const { canCreate } = usePermissions();
  const { user } = useAuth();
  const [items, setItems] = useState<DaoTao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DaoTao | null>(null);
  const [saving, setSaving] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);

  const initialFormData = {
    tieu_de: '',
    noi_dung: '',
    link: '',
    link_embed: '',
    file_dinh_kem: '',
    file_ten_goc: '',
    file_ten_nen: '',
    file_mime_type: '',
    file_kich_thu_goc: undefined as number | undefined,
    file_kich_thu_nen: undefined as number | undefined,
    nguoi_tao_id: user?.id,
    nguoi_tao_name: user?.full_name || 'Anonymous'
  };
  const [formData, setFormData] = useState<any>(initialFormData);
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin')
  );

  const canManageTraining = (item: DaoTao) => {
    return isAdmin || (!!user?.id && item.nguoi_tao_id === user.id);
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    const trimmedUrl = url.trim();

    const youtubeMatch = trimmedUrl.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (youtubeMatch?.[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

    const driveFileMatch = trimmedUrl.match(/drive\.google\.com\/file\/d\/([^\/\s?]+)/);
    if (driveFileMatch?.[1]) return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;

    const driveIdMatch = trimmedUrl.match(/[?&]id=([^&\s]+)/);
    if (trimmedUrl.includes('drive.google.com') && driveIdMatch?.[1]) {
      return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
    }

    if (trimmedUrl.includes('/preview') || trimmedUrl.includes('/embed/')) return trimmedUrl;
    return '';
  };

  const getTrainingEmbedUrl = (item: DaoTao) => getEmbedUrl(item.link_embed) || getEmbedUrl(item.link);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchDaoTao();
      setItems(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openAttachment = async (item: DaoTao) => {
    if (!item.file_dinh_kem) return;
    const { data } = supabase.storage.from('dao_tao').getPublicUrl(item.file_dinh_kem);
    if (data?.publicUrl) window.open(data.publicUrl, '_blank');
  };

  const handleSave = async () => {
    if (!formData.tieu_de.trim() || !formData.noi_dung.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung');
      return;
    }

    setSaving(true);
    try {
      let fileFields: Partial<DaoTao> = {};
      if (fileUpload) {
        const compressedFile = await compressFileForStorage(fileUpload);
        const ext = compressedFile.name.split('.').pop() || 'gz';
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('dao_tao')
          .upload(uniqueName, compressedFile, { cacheControl: '31536000', upsert: true });
        if (uploadError) throw uploadError;
        fileFields = {
          file_dinh_kem: uniqueName,
          file_ten_goc: fileUpload.name,
          file_ten_nen: compressedFile.name,
          file_mime_type: compressedFile.type || fileUpload.type,
          file_kich_thu_goc: fileUpload.size,
          file_kich_thu_nen: compressedFile.size
        };
      }

      const saveData = {
        ...formData,
        ...fileFields,
        link_embed: getEmbedUrl(formData.link) || formData.link_embed || '',
        nguoi_tao_id: user?.id || formData.nguoi_tao_id,
        nguoi_tao_name: user?.full_name || formData.nguoi_tao_name || 'Anonymous'
      };

      if (editingId) {
        await updateDaoTao(editingId, saveData);
      } else {
        await addDaoTao(saveData);
      }

      setShowForm(false);
      setEditingId(null);
      setFileUpload(null);
      setFormData(initialFormData);
      loadItems();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: DaoTao) => {
    setFormData({
      tieu_de: item.tieu_de || '',
      noi_dung: item.noi_dung || '',
      link: item.link || '',
      link_embed: item.link_embed || '',
      file_dinh_kem: item.file_dinh_kem || '',
      file_ten_goc: item.file_ten_goc || '',
      file_ten_nen: item.file_ten_nen || '',
      file_mime_type: item.file_mime_type || '',
      file_kich_thu_goc: item.file_kich_thu_goc,
      file_kich_thu_nen: item.file_kich_thu_nen,
      nguoi_tao_id: item.nguoi_tao_id || user?.id,
      nguoi_tao_name: item.nguoi_tao_name || user?.full_name || 'Anonymous'
    });
    setEditingId(item.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm('Bạn có chắc muốn xóa nội dung đào tạo này?')) return;
    try {
      await deleteDaoTao(id);
      loadItems();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const filteredItems = items.filter(item =>
    `${item.tieu_de || ''} ${item.noi_dung || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="min-h-full w-full bg-white">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 justify-between bg-slate-50/50">
          <div>
            <h3 className="text-main-title text-black flex items-center gap-2 uppercase">
              <Youtube className="text-red-600" size={20} />
              Video đào tạo & quy trình
            </h3>
            <p className="text-xs text-slate-500 mt-1">Dữ liệu lấy từ bảng dao_tao và bucket dao_tao.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tiêu đề, nội dung..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-table text-black focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-[#059669]"
              />
            </div>
            {canCreate('DOCS') && (
              <button onClick={() => { setEditingId(null); setFormData(initialFormData); setFileUpload(null); setShowForm(true); }} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#059669] text-white rounded-lg text-label font-black hover:bg-[#008800] transition-colors shadow-sm">
                <Plus size={16} /> Thêm nội dung
              </button>
            )}
          </div>
        </div>

        {loading && <div className="p-8 text-center text-slate-500">Đang tải nội dung đào tạo...</div>}
        {error && (
          <div className="p-8 text-center text-red-500 space-y-3">
            <p>Lỗi: {error}</p>
            <button onClick={loadItems} className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100">
              Tải lại
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => {
              const embedUrl = getTrainingEmbedUrl(item);
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  <button onClick={() => setSelectedItem(item)} className="aspect-video bg-slate-100 relative flex items-center justify-center text-left group">
                    {embedUrl ? (
                      <iframe src={embedUrl} className="w-full h-full pointer-events-none" title={item.tieu_de} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <PlayCircle size={42} />
                        <span className="text-xs font-bold uppercase">Chưa có link xem</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-table text-black line-clamp-2 leading-tight">{item.tieu_de}</h4>
                      <div className="flex gap-1 shrink-0">
                        {canManageTraining(item) && <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 size={14} /></button>}
                        {canManageTraining(item) && <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                    <p className="text-table text-black/70 line-clamp-3 mt-2 leading-relaxed">{item.noi_dung}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{item.ngay_tao ? new Date(item.ngay_tao).toLocaleDateString('vi-VN') : '-'}</span>
                      <div className="flex gap-2">
                        {item.file_dinh_kem && (
                          <button onClick={() => openAttachment(item)} className="flex items-center gap-1 text-primary-700 hover:underline">
                            <Download size={14} /> File
                          </button>
                        )}
                        <button onClick={() => setSelectedItem(item)} className="flex items-center gap-1 text-[#059669] font-bold hover:underline">
                          <Eye size={14} /> Xem
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 italic">Chưa có nội dung đào tạo nào.</div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <TrainingFormModal
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

      {selectedItem && (
        <TrainingDetailModal
          item={selectedItem}
          embedUrl={getTrainingEmbedUrl(selectedItem)}
          onClose={() => setSelectedItem(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenAttachment={openAttachment}
          canManage={canManageTraining(selectedItem)}
        />
      )}
    </div>
  );
};

const TrainingFormModal = ({ formData, setFormData, fileUpload, setFileUpload, onSave, onClose, saving, isEdit }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <h3 className="text-title font-black text-black uppercase">{isEdit ? 'Sửa nội dung đào tạo' : 'Thêm nội dung đào tạo'}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-label font-bold text-slate-500 uppercase tracking-widest mb-1">Tiêu đề *</label>
          <input
            type="text"
            value={formData.tieu_de}
            onChange={e => setFormData({ ...formData, tieu_de: e.target.value })}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold bg-white"
            placeholder="Nhập tên video, quy trình hoặc tài liệu đào tạo..."
          />
        </div>
        <div>
          <label className="block text-label font-bold text-slate-500 uppercase tracking-widest mb-1">Nội dung *</label>
          <textarea
            rows={6}
            value={formData.noi_dung}
            onChange={e => setFormData({ ...formData, noi_dung: e.target.value })}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
            placeholder="Mô tả nội dung đào tạo, quy trình, đối tượng áp dụng..."
          />
        </div>
        <div>
          <label className="block text-label font-bold text-slate-500 uppercase tracking-widest mb-1">Link Google Drive / YouTube</label>
          <input
            type="text"
            value={formData.link}
            onChange={e => setFormData({ ...formData, link: e.target.value })}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
            placeholder="Dán link Google Drive hoặc YouTube..."
          />
          <p className="text-[10px] text-slate-500 mt-1 italic">Hệ thống sẽ tự chuyển link Google Drive sang chế độ preview khi lưu.</p>
        </div>
        <div>
          <label className="block text-label font-bold text-slate-500 uppercase tracking-widest mb-1">File đính kèm</label>
          <input
            type="file"
            onChange={e => setFileUpload(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {fileUpload ? (
            <p className="text-xs text-slate-500 mt-1">Đã chọn: {fileUpload.name}</p>
          ) : formData.file_dinh_kem ? (
            <p className="text-xs text-slate-500 mt-1">File hiện tại: {formData.file_ten_goc || formData.file_dinh_kem}</p>
          ) : null}
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Hủy</button>
        <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save size={16} />}
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  </div>
);

const TrainingDetailModal = ({ item, embedUrl, onClose, onEdit, onDelete, onOpenAttachment, canManage }: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-20 flex justify-between items-start gap-4">
          <div>
            <h3 className="text-title font-black text-black uppercase leading-tight">{item.tieu_de}</h3>
            <p className="text-xs text-slate-500 mt-1">{item.ngay_tao ? new Date(item.ngay_tao).toLocaleDateString('vi-VN') : '-'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {embedUrl ? (
            <div className="space-y-3">
              <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={item.tieu_de}
                />
              </div>
              {item.link && (
                <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <Link size={14} /> Mở link gốc
                </a>
              )}
            </div>
          ) : item.link ? (
            <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <Link className="text-primary-600" />
              <span className="text-sm font-bold text-slate-800 break-all">{item.link}</span>
            </a>
          ) : null}

          <div className="prose max-w-none text-input font-bold text-black/80 leading-relaxed whitespace-pre-wrap">
            {item.noi_dung}
          </div>

          {item.file_dinh_kem && (
            <button onClick={() => onOpenAttachment(item)} className="w-full flex items-center gap-3 p-4 bg-primary-50 border border-primary-100 rounded-xl hover:bg-primary-100 transition-colors text-left">
              <FileText className="text-primary-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary-800 truncate">{item.file_ten_goc || item.file_dinh_kem}</p>
                <p className="text-xs text-primary-600">File đã nén trong bucket dao_tao. Nhấn để tải/xem.</p>
              </div>
            </button>
          )}
        </div>

        {canManage && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button onClick={() => { onEdit(item); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Edit2 size={16} /> Sửa
            </button>
            <button onClick={() => { onDelete(item.id); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: KNOWLEDGE SHARING ---
export const KnowledgeSharing = () => {
  const { canCreate, canUpdate, canDelete } = usePermissions();
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
    video_url: '',
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
        // Nén file trước khi upload
        const compressedFile = await compressFile(fileUpload);

        const ext = compressedFile.name.split('.').pop();
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from('chia_se_file')
          .upload(uniqueName, compressedFile, { cacheControl: '31536000' });
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
      video_url: article.video_url || '',
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
                  {canUpdate('DOCS') && (
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(article); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 size={14} /></button>
                  )}
                  {canDelete('DOCS') && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(article.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>

            <h3 className="text-table text-black mb-2 line-clamp-2 group-hover:text-green-700 transition-colors leading-tight">{article.tieu_de}</h3>
            <p className="text-table text-black/80 line-clamp-3 mb-4 leading-relaxed">{article.noi_dung}</p>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-bold">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden uppercase">
                  {article.nguoi_dang?.[0]?.toUpperCase()}
                </div>
                <span className="text-black font-bold text-table capitalize">{(article.nguoi_dang || 'Anonymous').toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-4 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <MessageSquare size={12} className="opacity-60" />
                  <span>{article.phan_loai === 'Hỏi đáp' ? 'Q&A' : ''}</span>
                </div>
                <span>{article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : '-'}</span>
              </div>
            </div>
          </div>
        ))}

        {canCreate('DOCS') && (
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
        )}
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
        <h3 className="font-black text-black text-title mb-4 flex items-center gap-2 uppercase">
          <HelpCircle className="text-purple-600" /> Câu hỏi thường gặp (Q&A)
        </h3>
        <div className="divide-y divide-slate-100">
          {articles.filter(a => a.phan_loai === 'Hỏi đáp').slice(0, 5).map((qa) => (
            <div key={qa.id} className="py-3">
              <h4 onClick={() => setSelectedArticle(qa)} className="font-bold text-black text-table cursor-pointer hover:text-green-600 line-clamp-1 uppercase">{qa.tieu_de}</h4>
              <p className="text-input text-black/70 font-bold mt-1 pl-4 border-l-2 border-slate-200 line-clamp-2">{qa.noi_dung}</p>
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
          <h3 className="text-title font-black text-black uppercase">Thông tin văn bản</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-label font-bold text-black mb-1">File văn bản (PDF, DOC...)</label>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip,.rar,.jpg,.png" onChange={e => setFileUpload(e.target.files?.[0] || null)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
              {fileUpload && <div className="text-xs text-slate-600 mt-1">Đã chọn: {fileUpload.name}</div>}
            </div>
            <div>
              <label className="block text-label font-bold text-black mb-1">Số hiệu VB *</label>
              <input type="text" value={formData.so_hieu_vb} onChange={e => setFormData({ ...formData, so_hieu_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-input font-bold text-black" placeholder="15/2023/QH15" />
            </div>
            <div>
              <label className="block text-label font-bold text-black mb-1">Tên văn bản *</label>
              <input type="text" value={formData.ten_vb} onChange={e => setFormData({ ...formData, ten_vb: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-input font-bold text-black" placeholder="Thông tư hướng dẫn..." />
            </div>

            {/* Loại Văn Bản */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-label font-bold text-black">Loại văn bản *</label>
                {!isAddingLoai && <button onClick={() => setIsAddingLoai(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Thêm mới</button>}
              </div>
              {isAddingLoai ? (
                <div className="flex gap-2">
                  <input type="text" value={newLoai} onChange={e => setNewLoai(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Nhập loại mới..." autoFocus />
                  <button onClick={handleAddNewLoai} className="px-3 bg-primary-600 text-white rounded-lg text-xs">OK</button>
                  <button onClick={() => setIsAddingLoai(false)} className="px-3 bg-slate-200 text-slate-600 rounded-lg text-xs">Hủy</button>
                </div>
              ) : (
                <select value={formData.loai_vb} onChange={e => setFormData({ ...formData, loai_vb: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-input font-bold text-black bg-white">
                  <option value="">-- Chọn loại văn bản --</option>
                  {Array.from(new Set([...loaiVbList, formData.loai_vb])).filter(Boolean).map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
              )}
            </div>

            {/* Cơ Quan Ban Hành */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-label font-bold text-black">Cơ quan ban hành *</label>
                {!isAddingCoQuan && <button onClick={() => setIsAddingCoQuan(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">+ Thêm mới</button>}
              </div>
              {isAddingCoQuan ? (
                <div className="flex gap-2">
                  <input type="text" value={newCoQuan} onChange={e => setNewCoQuan(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Nhập cơ quan mới..." autoFocus />
                  <button onClick={handleAddNewCoQuan} className="px-3 bg-primary-600 text-white rounded-lg text-xs">OK</button>
                  <button onClick={() => setIsAddingCoQuan(false)} className="px-3 bg-slate-200 text-slate-600 rounded-lg text-xs">Hủy</button>
                </div>
              ) : (
                <select value={formData.co_quan_ban_hanh} onChange={e => setFormData({ ...formData, co_quan_ban_hanh: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-input font-bold text-black bg-white">
                  <option value="">-- Chọn cơ quan --</option>
                  {coQuanList.map((cq: any) => <option key={cq.id} value={cq.ten_co_quan}>{cq.ten_co_quan}</option>)}
                  {formData.co_quan_ban_hanh && !coQuanList.find(cq => cq.ten_co_quan === formData.co_quan_ban_hanh) && (
                    <option value={formData.co_quan_ban_hanh}>{formData.co_quan_ban_hanh}</option>
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-label font-bold text-black mb-1">Ngày hiệu lực *</label>
              <input type="date" value={!isNaN(Date.parse(formData.hieu_luc)) ? new Date(formData.hieu_luc).toISOString().split('T')[0] : ''} onChange={e => setFormData({ ...formData, hieu_luc: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-input font-bold text-black" />
            </div>

            <div>
              <label className="block text-label font-bold text-black mb-1">Trạng thái *</label>
              <select value={formData.trang_thai} onChange={e => setFormData({ ...formData, trang_thai: e.target.value })} className="w-full p-2 border border-slate-300 rounded-lg text-input font-bold text-black bg-white">
                <option value="Còn hiệu lực">Còn hiệu lực</option>
                <option value="Hết hiệu lực">Hết hiệu lực</option>
                <option value="Dự thảo">Dự thảo</option>
                <option value="Hủy bỏ">Hủy bỏ</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-label font-bold text-black mb-1">Phân loại (Lọc nhanh) *</label>
              <select
                value={formData.phan_loai}
                onChange={e => setFormData({ ...formData, phan_loai: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-primary-50/50"
              >
                <option value="Bộ Y tế">BYT</option>
                <option value="Bộ Quốc phòng">BQP</option>
                <option value="Cục quân y">CQY</option>
                <option value="BVQY103">BVQY103</option>
                <option value="Học viện Quân y">HVQY</option>
                <option value="Ban Quản lý chất lượng">QLCL</option>
                <option value="Khác">Khác</option>
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
  const { canUpdate, canDelete } = usePermissions();
  if (!doc) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="font-black text-black text-title uppercase">Chi tiết văn bản</h3>
            <p className="text-xs text-slate-500 font-mono mt-1">{doc.so_hieu_vb}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-label font-bold text-black/60 uppercase tracking-wider block mb-1">Tên văn bản</label>
            <p className="text-black font-black text-input leading-relaxed">{doc.ten_vb}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label font-bold text-black/60 uppercase tracking-wider block mb-1">Loại văn bản</label>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary-500" />
                <span className="text-input font-black text-black">{doc.loai_vb || '---'}</span>
              </div>
            </div>
            <div>
              <label className="text-label font-bold text-black/60 uppercase tracking-wider block mb-1">Trạng thái</label>
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
              <label className="text-label font-bold text-black/60 uppercase tracking-wider block mb-1">Cơ quan ban hành</label>
              <div className="flex items-center gap-2">
                <Building size={16} className="text-slate-400" />
                <span className="text-input font-black text-black">{doc.co_quan_ban_hanh || '---'}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Hiệu lực</label>
              <span className="text-sm text-slate-700">{doc.hieu_luc ? (!isNaN(Date.parse(doc.hieu_luc)) ? new Date(doc.hieu_luc).toLocaleDateString('vi-VN') : doc.hieu_luc) : '---'}</span>
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
          {canUpdate('DOCS') && (
            <button onClick={() => { onEdit(doc); onClose(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Edit2 size={16} /> Sửa văn bản
            </button>
          )}
          {canDelete('DOCS') && (
            <button onClick={() => { if (window.confirm('Xóa?')) { onDelete(doc.id); onClose(); } }} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
              <Trash2 size={16} /> Xóa
            </button>
          )}
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
          <h3 className="text-title font-black text-black uppercase">{isEdit ? 'Sửa bài viết' : 'Đóng góp bài viết mới'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-label font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Tiêu đề *</label>
            <input
              type="text"
              value={formData.tieu_de}
              onChange={e => setFormData({ ...formData, tieu_de: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-bold bg-white"
              placeholder="Nhập tiêu đề bài viết..."
            />
          </div>
          <div>
            <label className="block text-label font-bold text-black mb-1">Phân loại *</label>
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
            <label className="block text-label font-bold text-black mb-1">Nội dung *</label>
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
          <div>
            <label className="block text-label font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Link video (YouTube, Google Drive)</label>
            <input
              type="text"
              value={formData.video_url}
              onChange={e => setFormData({ ...formData, video_url: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Dán link YouTube hoặc Google Drive vào đây..."
            />
            <p className="text-[10px] text-slate-500 mt-1 italic">* Hệ thống sẽ tự động chuyển sang chế độ xem trực tiếp.</p>
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

  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch && youtubeMatch[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Google Drive
    const driveRegex = /drive\.google\.com\/file\/d\/([^\/\s?]+)/;
    const driveMatch = url.match(driveRegex);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl(article.video_url);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-20 flex justify-between items-start">
          <div className="flex items-center gap-2">
            {/* Header Title and Classification Removed */}
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
                <span className="font-bold text-slate-700 capitalize">{(article.nguoi_dang || 'Anonymous').toLowerCase()}</span>
              </div>
              <span>•</span>
              <span>{article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : '-'}</span>
            </div>

            <div className="prose max-w-none text-input font-bold text-black/80 leading-relaxed whitespace-pre-wrap mb-8">
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

            {embedUrl && (
              <div className="my-8 aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Embedded video"
                ></iframe>
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
            <h4 className="text-label font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageCircle size={14} /> Bình luận ({comments.length})
            </h4>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar mb-4">
              {comments.map((comment, idx) => (
                <div key={comment.id || idx} className="bg-white p-3 rounded-xl shadow-sm border border-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-700 capitalize">{(comment.user_full_name || 'Anonymous').toLowerCase()}</span>
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
