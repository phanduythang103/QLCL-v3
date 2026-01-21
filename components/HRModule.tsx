import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, User, Search, Filter, Phone, Award, Mail, MapPin,
  FileSpreadsheet, Download, Upload, MoreHorizontal, Edit2, Trash2, X, Save, Eye 
} from 'lucide-react';
import { fetchNhanSuQlcl, addNhanSuQlcl, updateNhanSuQlcl, deleteNhanSuQlcl, NhanSuQlcl } from '../readNhanSuQlcl';
import * as XLSX from 'xlsx';

type QARoleType = 'COUNCIL' | 'BOARD' | 'NETWORK';

export const HRModule: React.FC = () => {
  const [staff, setStaff] = useState<NhanSuQlcl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | QARoleType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NhanSuQlcl | null>(null);
  const [viewingItem, setViewingItem] = useState<NhanSuQlcl | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<{
    vai_tro_qlcl: string[];
    co_chung_chi?: boolean;
    trang_thai?: string;
  }>({ vai_tro_qlcl: [] });
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterOnlyWithCert, setFilterOnlyWithCert] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    cap_bac: '',
    don_vi: '',
    trang_thai: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    ho_ten: '',
    cap_bac: '',
    chuc_vu: '',
    don_vi: '',
    so_dien_thoai: '',
    email: '',
    co_chung_chi: false,
    vai_tro_qlcl: [] as string[],
    ghi_chu: '',
    trang_thai: 'Hoạt động'
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchNhanSuQlcl();
      setStaff(data);
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

  const resetForm = () => {
    setFormData({
      ho_ten: '',
      cap_bac: '',
      chuc_vu: '',
      don_vi: '',
      so_dien_thoai: '',
      email: '',
      co_chung_chi: false,
      vai_tro_qlcl: [],
      ghi_chu: '',
      trang_thai: 'Hoạt động'
    });
    setEditingItem(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: NhanSuQlcl) => {
    setFormData({
      ho_ten: item.ho_ten || '',
      cap_bac: item.cap_bac || '',
      chuc_vu: item.chuc_vu || '',
      don_vi: item.don_vi || '',
      so_dien_thoai: item.so_dien_thoai || '',
      email: item.email || '',
      co_chung_chi: item.co_chung_chi || false,
      vai_tro_qlcl: item.vai_tro_qlcl || [],
      ghi_chu: item.ghi_chu || '',
      trang_thai: item.trang_thai || 'Hoạt động'
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.ho_ten.trim()) {
      alert('Vui lòng nhập họ và tên');
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateNhanSuQlcl(editingItem.id, formData);
      } else {
        await addNhanSuQlcl(formData);
      }
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nhân sự này?')) {
      try {
        await deleteNhanSuQlcl(id);
        loadData();
      } catch (err: any) {
        alert('Lỗi: ' + err.message);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStaff.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStaff.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    try {
      setSaving(true);
      const updates: any = {};
      if (bulkEditData.vai_tro_qlcl.length > 0) updates.vai_tro_qlcl = bulkEditData.vai_tro_qlcl;
      if (bulkEditData.co_chung_chi !== undefined) updates.co_chung_chi = bulkEditData.co_chung_chi;
      if (bulkEditData.trang_thai) updates.trang_thai = bulkEditData.trang_thai;

      await Promise.all(selectedIds.map(id => updateNhanSuQlcl(id, updates)));
      setShowBulkEditModal(false);
      setSelectedIds([]);
      setBulkEditData({ vai_tro_qlcl: [] });
      loadData();
      alert(`Đã cập nhật ${selectedIds.length} nhân sự thành công!`);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBulkRole = (role: string) => {
    setBulkEditData(prev => ({
      ...prev,
      vai_tro_qlcl: prev.vai_tro_qlcl.includes(role)
        ? prev.vai_tro_qlcl.filter(r => r !== role)
        : [...prev.vai_tro_qlcl, role]
    }));
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      vai_tro_qlcl: prev.vai_tro_qlcl.includes(role)
        ? prev.vai_tro_qlcl.filter(r => r !== role)
        : [...prev.vai_tro_qlcl, role]
    }));
  };

  const filteredStaff = staff.filter(s => {
    const matchesTab = activeTab === 'ALL' || (s.vai_tro_qlcl && s.vai_tro_qlcl.includes(activeTab));
    const matchesSearch = s.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.don_vi && s.don_vi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCert = !filterOnlyWithCert || s.co_chung_chi === true;
    const matchesCapBac = !advancedFilters.cap_bac || s.cap_bac === advancedFilters.cap_bac;
    const matchesDonVi = !advancedFilters.don_vi || (s.don_vi && s.don_vi.includes(advancedFilters.don_vi));
    const matchesTrangThai = !advancedFilters.trang_thai || s.trang_thai === advancedFilters.trang_thai;
    
    return matchesTab && matchesSearch && matchesCert && matchesCapBac && matchesDonVi && matchesTrangThai;
  });

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
    setShowImportModal(false);
  };

  const handleDownloadTemplate = () => {
    // Tạo dữ liệu cho file Excel mẫu
    const headers = ['Họ và tên', 'Cấp bậc', 'Chức vụ', 'Đơn vị', 'Số điện thoại', 'Email', 'Có chứng chỉ (TRUE/FALSE)', 'Vai trò QLCL (COUNCIL,BOARD,NETWORK)', 'Ghi chú', 'Trạng thái'];
    const dataKeys = ['ho_ten', 'cap_bac', 'chuc_vu', 'don_vi', 'so_dien_thoai', 'email', 'co_chung_chi', 'vai_tro_qlcl', 'ghi_chu', 'trang_thai'];
    const sampleData = [
      { ho_ten: 'Nguyễn Văn A', cap_bac: 'Đại tá', chuc_vu: 'Giám đốc', don_vi: 'Ban Giám đốc', so_dien_thoai: '0912.345.678', email: 'nguyenvana@example.com', co_chung_chi: 'TRUE', vai_tro_qlcl: 'COUNCIL,BOARD', ghi_chu: 'Ghi chú mẫu', trang_thai: 'Hoạt động' },
      { ho_ten: 'Trần Thị B', cap_bac: 'Thượng tá', chuc_vu: 'Trưởng khoa', don_vi: 'Khoa Nội', so_dien_thoai: '0912.345.679', email: 'tranthib@example.com', co_chung_chi: 'TRUE', vai_tro_qlcl: 'BOARD', ghi_chu: '', trang_thai: 'Hoạt động' },
      { ho_ten: 'Lê Văn C', cap_bac: 'Thiếu tá', chuc_vu: 'Phó Trưởng khoa', don_vi: 'Khoa Ngoại', so_dien_thoai: '0912.345.680', email: 'levanc@example.com', co_chung_chi: 'FALSE', vai_tro_qlcl: 'NETWORK', ghi_chu: '', trang_thai: 'Hoạt động' },
    ];
    
    // Tạo worksheet với headers tiếng Việt
    const wsData = [headers, ...sampleData.map(row => dataKeys.map(key => (row as any)[key]))];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Điều chỉnh độ rộng cột
    ws['!cols'] = [
      { wch: 20 }, // Họ và tên
      { wch: 12 }, // Cấp bậc
      { wch: 18 }, // Chức vụ
      { wch: 20 }, // Đơn vị
      { wch: 15 }, // Số điện thoại
      { wch: 25 }, // Email
      { wch: 20 }, // Có chứng chỉ
      { wch: 30 }, // Vai trò QLCL
      { wch: 20 }, // Ghi chú
      { wch: 12 }, // Trạng thái
    ];
    
    // Tạo workbook và xuất file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhân sự QLCL');
    XLSX.writeFile(wb, 'mau_nhan_su_qlcl.xlsx');
    
    setShowImportModal(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      
      // Đọc file Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        alert('File không có dữ liệu hoặc sai định dạng!');
        return;
      }
      
      // Bỏ qua dòng header, lấy dữ liệu từ dòng 2
      const records = jsonData.slice(1).filter(row => row[0]); // Chỉ lấy dòng có họ tên
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of records) {
        try {
          // Map cột theo thứ tự: ho_ten, cap_bac, chuc_vu, don_vi, so_dien_thoai, email, co_chung_chi, vai_tro_qlcl, ghi_chu, trang_thai
          const record = {
            ho_ten: String(row[0] || '').trim(),
            cap_bac: String(row[1] || '').trim(),
            chuc_vu: String(row[2] || '').trim(),
            don_vi: String(row[3] || '').trim(),
            so_dien_thoai: String(row[4] || '').trim(),
            email: String(row[5] || '').trim(),
            co_chung_chi: String(row[6] || '').toUpperCase() === 'TRUE',
            vai_tro_qlcl: String(row[7] || '').split(',').map(s => s.trim()).filter(s => s),
            ghi_chu: String(row[8] || '').trim(),
            trang_thai: String(row[9] || 'Hoạt động').trim(),
          };
          
          if (record.ho_ten) {
            await addNhanSuQlcl(record);
            successCount++;
          }
        } catch (err) {
          errorCount++;
          console.error('Lỗi thêm bản ghi:', err);
        }
      }
      
      alert(`Hoàn thành!\n✅ Thêm thành công: ${successCount} nhân sự\n❌ Lỗi: ${errorCount} bản ghi`);
      loadData(); // Tải lại dữ liệu
      
    } catch (err: any) {
      alert('Lỗi đọc file Excel: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
      // Reset input để có thể chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportExcel = () => {
    // Tạo dữ liệu từ danh sách nhân sự hiện tại
    const headers = ['Họ và tên', 'Cấp bậc', 'Chức vụ', 'Đơn vị', 'Số điện thoại', 'Email', 'Có chứng chỉ', 'Vai trò QLCL', 'Ghi chú', 'Trạng thái'];
    const dataRows = staff.map(item => [
      item.ho_ten || '',
      item.cap_bac || '',
      item.chuc_vu || '',
      item.don_vi || '',
      item.so_dien_thoai || '',
      item.email || '',
      item.co_chung_chi ? 'TRUE' : 'FALSE',
      (item.vai_tro_qlcl || []).join(','),
      item.ghi_chu || '',
      item.trang_thai || '',
    ]);
    
    const wsData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Điều chỉnh độ rộng cột
    ws['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
      { wch: 25 }, { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhân sự QLCL');
    XLSX.writeFile(wb, `nhan_su_qlcl_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'COUNCIL': return <span key="council" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Hội đồng</span>;
      case 'BOARD': return <span key="board" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800 border border-primary-200">Ban QLCL</span>;
      case 'NETWORK': return <span key="network" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Mạng lưới</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Nhân sự & Mạng lưới QLCL</h2>
          <p className="text-sm text-slate-500">Cập nhật thông tin Hội đồng, Ban chuyên trách và Mạng lưới viên.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={handleExportExcel}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} /> Xuất Excel
          </button>
          <button 
            onClick={handleImportClick}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
          >
            <Upload size={16} /> Nhập Excel
          </button>
          <button 
            onClick={openAddForm}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} /> Thêm nhân sự
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
         {[
           { id: 'ALL', label: 'Tất cả nhân sự' },
           { id: 'COUNCIL', label: 'Hội đồng QLCLBV' },
           { id: 'BOARD', label: 'Ban QLCLBV (Chuyên trách)' },
           { id: 'NETWORK', label: 'Mạng lưới QLCLBV' },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               activeTab === tab.id 
                 ? 'bg-primary-900 text-white shadow-sm' 
                 : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, khoa phòng..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
           </div>
           <div className="flex gap-2">
             <button 
               onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
               className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                 showAdvancedFilter || advancedFilters.cap_bac || advancedFilters.don_vi || advancedFilters.trang_thai
                   ? 'bg-primary-100 border-primary-500 text-primary-700' 
                   : 'border-slate-200 text-slate-600 hover:bg-white bg-white'
               }`}
             >
               <Filter size={16} /> Lọc nâng cao
             </button>
             <button 
               onClick={() => setFilterOnlyWithCert(!filterOnlyWithCert)}
               className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                 filterOnlyWithCert 
                   ? 'bg-green-100 border-green-500 text-green-700' 
                   : 'border-slate-200 text-slate-600 hover:bg-white bg-white'
               }`}
             >
               <Award size={16} /> Chỉ hiện có chứng chỉ
             </button>
           </div>
        </div>

        {/* Advanced Filter Panel */}
        {showAdvancedFilter && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cấp bậc</label>
                <select 
                  value={advancedFilters.cap_bac}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, cap_bac: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Tất cả</option>
                  <option>Thiếu tướng</option>
                  <option>Đại tá</option>
                  <option>Thượng tá</option>
                  <option>Trung tá</option>
                  <option>Thiếu tá</option>
                  <option>Đại úy</option>
                  <option>Thượng úy</option>
                  <option>Trung úy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Đơn vị</label>
                <input 
                  type="text"
                  value={advancedFilters.don_vi}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, don_vi: e.target.value })}
                  placeholder="Nhập tên đơn vị..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Trạng thái</label>
                <select 
                  value={advancedFilters.trang_thai}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, trang_thai: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Tất cả</option>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setAdvancedFilters({ cap_bac: '', don_vi: '', trang_thai: '' })}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white"
              >
                Xóa bộ lọc
              </button>
              <button
                onClick={() => setShowAdvancedFilter(false)}
                className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
        
        {/* Loading/Error states */}
        {loading && (
          <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>
        )}
        {error && (
          <div className="p-12 text-center text-red-500">Lỗi: {error}</div>
        )}
        
        {/* Mobile Cards View */}
        {!loading && !error && (
          <div className="block lg:hidden">
            {selectedIds.length > 0 && (
              <div className="p-3 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
                <span className="text-sm font-medium text-primary-800">
                  Đã chọn {selectedIds.length} nhân sự
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkEditModal(true)}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Sửa hàng loạt
                  </button>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}
            {filteredStaff.map((item) => (
              <div key={item.id} className="p-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="mt-1 w-4 h-4 text-primary-600 rounded"
                  />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {item.ho_ten.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Tên, cấp bậc, và vai trò cùng hàng */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-base">{item.ho_ten}</h3>
                        {item.cap_bac && (
                          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{item.cap_bac}</span>
                        )}
                      </div>
                      {/* Vai trò ở góc phải */}
                      <div className="flex flex-wrap gap-1 justify-end">
                        {item.vai_tro_qlcl?.map(role => getRoleBadge(role))}
                      </div>
                    </div>
                    {/* Chức vụ và đơn vị cùng hàng */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-sm font-medium text-slate-700">{item.chuc_vu || '-'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm text-slate-500">{item.don_vi || '-'}</span>
                    </div>
                    {/* Thông tin liên hệ */}
                    <div className="flex items-center gap-3 mt-1.5">
                      {item.so_dien_thoai && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone size={12} /> {item.so_dien_thoai}
                        </p>
                      )}
                      {item.co_chung_chi && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckIcon /> Có CC
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Mobile Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button 
                    onClick={() => setViewingItem(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Eye size={14} /> Xem
                  </button>
                  <button 
                    onClick={() => openEditForm(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Edit2 size={14} /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
            ))}
            {filteredStaff.length === 0 && (
              <div className="py-12 text-center text-slate-500 italic">
                Không tìm thấy nhân sự nào phù hợp với bộ lọc.
              </div>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && !error && (
        <div className="hidden lg:block">
          {selectedIds.length > 0 && (
            <div className="p-3 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
              <span className="text-sm font-medium text-primary-800">
                Đã chọn {selectedIds.length} nhân sự
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Edit2 size={14} /> Sửa hàng loạt
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-primary-600 text-white font-bold border-b border-primary-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredStaff.length && filteredStaff.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3">Họ và tên / Cấp bậc</th>
                  <th className="px-4 py-3">Chức vụ / Đơn vị</th>
                  <th className="px-4 py-3">Vai trò QLCL</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3 text-center">Chứng chỉ</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {item.ho_ten.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{item.ho_ten}</p>
                        {item.cap_bac && (
                          <p className="text-xs font-medium text-primary-600 bg-primary-50 inline-block px-1.5 rounded mt-0.5">{item.cap_bac}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-700">{item.chuc_vu || '-'}</p>
                    <p className="text-xs text-slate-500">{item.don_vi || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.vai_tro_qlcl?.map(role => getRoleBadge(role))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {item.so_dien_thoai && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Phone size={12} className="text-slate-400" />
                          <span className="font-mono">{item.so_dien_thoai}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <Mail size={12} className="text-slate-400" />
                          <span className="truncate max-w-[150px]">{item.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.co_chung_chi ? (
                      <div className="flex flex-col items-center">
                        <CheckIcon />
                        <span className="text-[10px] text-green-600 font-medium mt-0.5">Đã có</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="block w-2 h-2 rounded-full bg-slate-300"></span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium mt-0.5">Chưa có</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => setViewingItem(item)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" 
                        title="Xem chi tiết"
                      >
                        <Eye size={14} /> <span className="hidden xl:inline">Xem</span>
                      </button>
                      <button 
                        onClick={() => openEditForm(item)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-100 rounded transition-colors" 
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={14} /> <span className="hidden xl:inline">Sửa</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors" 
                        title="Xóa"
                      >
                        <Trash2 size={14} /> <span className="hidden xl:inline">Xóa</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                    Không tìm thấy nhân sự nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
        )}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
           <span>Hiển thị {filteredStaff.length} nhân sự</span>
           <div className="flex gap-1">
              <button className="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50" disabled>Trước</button>
              <button className="px-3 py-1 border rounded bg-white hover:bg-slate-100">Sau</button>
           </div>
        </div>
      </div>
      
      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="text-primary-600" size={20} />
                Nhập dữ liệu Excel
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={handleUploadFile}
                className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 group-hover:bg-primary-200">
                  <Upload size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Tải lên file Excel</p>
                  <p className="text-sm text-slate-500">Chọn file .xlsx hoặc .xls từ máy tính</p>
                </div>
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-200">
                  <Download size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Tải xuống file mẫu</p>
                  <p className="text-sm text-slate-500">Tải file mẫu để nhập dữ liệu chính xác</p>
                </div>
              </button>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setShowImportModal(false)}
                className="w-full py-2 text-slate-600 hover:text-slate-800 text-sm font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <FormModal 
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          toggleRole={toggleRole}
          handleSave={handleSave}
          saving={saving}
          onClose={() => { setShowForm(false); resetForm(); }}
        />
      )}

      {/* View Detail Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="text-primary-600" size={20} />
                Thông tin nhân sự
              </h3>
              <button onClick={() => setViewingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {/* Header with Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {viewingItem.ho_ten.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{viewingItem.ho_ten}</h4>
                  {viewingItem.cap_bac && (
                    <span className="text-sm font-medium text-primary-600 bg-primary-50 inline-block px-2 py-0.5 rounded mt-1">{viewingItem.cap_bac}</span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Chức vụ</label>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{viewingItem.chuc_vu || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Đơn vị</label>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{viewingItem.don_vi || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Số điện thoại</label>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      {viewingItem.so_dien_thoai || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Email</label>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5 break-all">
                      <Mail size={14} className="text-slate-400 flex-shrink-0" />
                      {viewingItem.email || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase font-medium">Vai trò QLCL</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {viewingItem.vai_tro_qlcl?.length > 0 ? (
                      viewingItem.vai_tro_qlcl.map(role => getRoleBadge(role))
                    ) : (
                      <span className="text-sm text-slate-400">Chưa phân vai trò</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Chứng chỉ QLCL</label>
                    <div className="mt-1.5">
                      {viewingItem.co_chung_chi ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckIcon /> Đã có chứng chỉ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium">
                          Chưa có chứng chỉ
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Trạng thái</label>
                    <p className="mt-1.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        viewingItem.trang_thai === 'Hoạt động' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {viewingItem.trang_thai || 'Hoạt động'}
                      </span>
                    </p>
                  </div>
                </div>

                {viewingItem.ghi_chu && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase font-medium">Ghi chú</label>
                    <p className="text-sm text-slate-700 mt-0.5 bg-slate-50 p-3 rounded-lg">{viewingItem.ghi_chu}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setViewingItem(null)}
                className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Đóng
              </button>
              <button
                onClick={() => { openEditForm(viewingItem); setViewingItem(null); }}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-700"
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="text-primary-600" size={20} />
                Sửa hàng loạt ({selectedIds.length} nhân sự)
              </h3>
              <button onClick={() => setShowBulkEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vai trò QLCL</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'COUNCIL', label: 'Hội đồng QLCLBV' },
                    { id: 'BOARD', label: 'Ban QLCL (Chuyên trách)' },
                    { id: 'NETWORK', label: 'Mạng lưới QLCLBV' },
                  ].map(role => (
                    <label 
                      key={role.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        bulkEditData.vai_tro_qlcl.includes(role.id) 
                          ? 'bg-primary-100 border-primary-500 text-primary-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={bulkEditData.vai_tro_qlcl.includes(role.id)}
                        onChange={() => toggleBulkRole(role.id)}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chứng chỉ QLCL</label>
                <select 
                  value={bulkEditData.co_chung_chi === undefined ? '' : bulkEditData.co_chung_chi.toString()}
                  onChange={(e) => setBulkEditData({ 
                    ...bulkEditData, 
                    co_chung_chi: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- Không thay đổi --</option>
                  <option value="true">Đã có chứng chỉ</option>
                  <option value="false">Chưa có chứng chỉ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                <select 
                  value={bulkEditData.trang_thai || ''}
                  onChange={(e) => setBulkEditData({ ...bulkEditData, trang_thai: e.target.value || undefined })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- Không thay đổi --</option>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Nghỉ việc">Nghỉ việc</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkEdit}
                disabled={saving}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? (
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <Save size={14} />
                )}
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Modal Component - moved outside to prevent re-render issues
interface FormModalProps {
  editingItem: NhanSuQlcl | null;
  formData: {
    ho_ten: string;
    cap_bac: string;
    chuc_vu: string;
    don_vi: string;
    so_dien_thoai: string;
    email: string;
    co_chung_chi: boolean;
    vai_tro_qlcl: string[];
    ghi_chu: string;
    trang_thai: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  toggleRole: (role: string) => void;
  handleSave: () => void;
  saving: boolean;
  onClose: () => void;
}

const FormModal: React.FC<FormModalProps> = ({ 
  editingItem, 
  formData, 
  setFormData, 
  toggleRole, 
  handleSave, 
  saving, 
  onClose 
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
        <h3 className="text-lg font-bold text-slate-800">
          {editingItem ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
            <input 
              type="text"
              value={formData.ho_ten}
              onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cấp bậc</label>
            <select 
              value={formData.cap_bac}
              onChange={(e) => setFormData({ ...formData, cap_bac: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">-- Chọn cấp bậc --</option>
              <option>Thiếu tướng</option>
              <option>Đại tá</option>
              <option>Thượng tá</option>
              <option>Trung tá</option>
              <option>Thiếu tá</option>
              <option>Đại úy</option>
              <option>Thượng úy</option>
              <option>Trung úy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
            <input 
              type="text"
              value={formData.chuc_vu}
              onChange={(e) => setFormData({ ...formData, chuc_vu: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Trưởng khoa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị / Khoa phòng</label>
            <input 
              type="text"
              value={formData.don_vi}
              onChange={(e) => setFormData({ ...formData, don_vi: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Khoa Nội"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
            <input 
              type="text"
              value={formData.so_dien_thoai}
              onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="0912.345.678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="email@example.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Vai trò QLCL</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'COUNCIL', label: 'Hội đồng QLCLBV' },
              { id: 'BOARD', label: 'Ban QLCL (Chuyên trách)' },
              { id: 'NETWORK', label: 'Mạng lưới QLCLBV' },
            ].map(role => (
              <label 
                key={role.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  formData.vai_tro_qlcl.includes(role.id) 
                    ? 'bg-primary-100 border-primary-500 text-primary-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={formData.vai_tro_qlcl.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="hidden"
                />
                {role.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={formData.co_chung_chi}
              onChange={(e) => setFormData({ ...formData, co_chung_chi: e.target.checked })}
              className="rounded text-primary-600"
            />
            <span className="text-sm text-slate-700">Có chứng chỉ QLCL</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
          <textarea 
            value={formData.ghi_chu}
            onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            rows={2}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 p-4 border-t border-slate-200 bg-slate-50">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
        >
          Hủy
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  </div>
);

const CheckIcon = () => (
  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </span>
);