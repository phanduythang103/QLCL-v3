import React, { useEffect, useState, useRef } from 'react';
import { fetchUsers, addUser, updateUser, deleteUser, bulkUpdateUsers } from '../../readUsers';
import { fetchDmDonVi } from '../../readDmDonVi';
import { uploadAvatar } from '../../userApi';
import { Edit2, Trash2, Plus, X, Check, ChevronDown, Upload, Image, Eye, EyeOff, Lock, User as UserIcon, Building2, Save, MoreHorizontal, Search, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';

const CATEGORIES = ['Mạng lưới', 'Tổ chấm điểm', 'Quản trị', 'Nhân viên'];

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const deptInputRef = useRef<HTMLInputElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Quản trị viên';

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Selection states
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    role: '',
    category: '',
    notes: ''
  });

  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    department: '',
    role: 'Người dùng',
    status: 'Hoạt động',
    category: 'Nhân viên',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        fetchUsers(),
        fetchDmDonVi()
      ]);
      setUsers(usersData || []);
      setDepartments(deptsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(event.target as Node) &&
        deptInputRef.current &&
        !deptInputRef.current.contains(event.target as Node)
      ) {
        setShowDeptDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setForm({ username: '', password: '', full_name: '', department: '', role: 'Người dùng', status: 'Hoạt động', category: 'Nhân viên', notes: '' });
    setEditingId(null);
    setShowForm(false);
    setShowDeptDropdown(false);
    setDeptSearchTerm('');
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let userId = editingId;
      if (editingId) {
        const isDuplicate = users.some(u =>
          u.id !== editingId &&
          u.username.toLowerCase() === form.username.toLowerCase()
        );
        if (isDuplicate) {
          setMessage('Lỗi: Tên đăng nhập đã tồn tại!');
          return;
        }
        const updateData = form.password
          ? { ...form, username: form.username.toLowerCase() }
          : { username: form.username.toLowerCase(), full_name: form.full_name, department: form.department, role: form.role, status: form.status, category: form.category, notes: form.notes };
        await updateUser(editingId, updateData);
        setMessage('Cập nhật thành công!');
      } else {
        if (users.some(u => u.username.toLowerCase() === form.username.toLowerCase())) {
          setMessage('Lỗi: Tên đăng nhập đã tồn tại!');
          return;
        }
        const newUser = await addUser({ ...form, username: form.username.toLowerCase() });
        userId = newUser.id;
        setMessage('Thêm mới thành công!');
      }

      if (avatarFile && userId) {
        setUploadingAvatar(true);
        try {
          await uploadAvatar(avatarFile, userId);
        } catch (avatarErr: any) {
          console.error('Avatar error:', avatarErr);
        }
        setUploadingAvatar(false);
      }

      resetForm();
      loadData();
    } catch (err: any) {
      setMessage('Lỗi: ' + err.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (user: any) => {
    setForm({
      username: user.username || '',
      password: '',
      full_name: user.full_name || '',
      department: user.department || '',
      role: user.role || 'Người dùng',
      status: user.status || 'Hoạt động',
      category: user.category || 'Nhân viên',
      notes: user.notes || ''
    });
    setEditingId(user.id);
    setShowForm(true);
    if (user.avatar) {
      setAvatarPreview(user.avatar);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await deleteUser(id);
        setMessage('Đã xóa thành công!');
        loadData();
      } catch (err: any) {
        setMessage('Lỗi: ' + err.message);
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async (): Promise<void> => {
    if (selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      const updates: any = {};
      if (bulkForm.role) updates.role = bulkForm.role;
      if (bulkForm.category) updates.category = bulkForm.category;
      if (bulkForm.notes) updates.notes = bulkForm.notes;

      if (Object.keys(updates).length > 0) {
        await bulkUpdateUsers(selectedUserIds, updates);
        setMessage(`Đã cập nhật hàng loạt cho ${selectedUserIds.length} người dùng!`);
        setSelectedUserIds([]);
        setShowBulkUpdate(false);
        setBulkForm({ role: '', category: '', notes: '' });
        loadData();
      } else {
        setMessage('Vui lòng chọn ít nhất một thông tin để cập nhật!');
      }
    } catch (err: any) {
      setMessage('Lỗi: ' + err.message);
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExportExcel = () => {
    const listToExport = selectedUserIds.length > 0
      ? users.filter(u => selectedUserIds.includes(u.id))
      : filteredUsers;

    if (listToExport.length === 0) {
      setMessage('Lỗi: Không có dữ liệu để xuất!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const data = listToExport.map((u: any, index: number) => ({
      'STT': index + 1,
      'Tài khoản': u.username,
      'Họ và tên': u.full_name,
      'Đơn vị': u.department,
      'Vai trò': u.role,
      'Đối tượng': u.category,
      'Ghi chú': u.notes,
      'Ngày tạo': u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách người dùng');

    // Auto-size columns
    const maxWidths = Object.keys(data[0] || {}).map((key: string) => {
      const lengths = data.map((row: any) => String(row[key as keyof typeof row]).length);
      return { wch: Math.max(key.length, ...lengths) + 2 };
    });
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Danh_sach_nguoi_dung_${new Date().getTime()}.xlsx`);
    setMessage('Đã xuất file Excel thành công!');
    setTimeout(() => setMessage(''), 3000);
  };

  const filteredUsers = users.filter(user => {
    const matchName = (user.full_name || '').toLowerCase().includes(filterName.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(filterName.toLowerCase());
    const matchRole = filterRole ? user.role === filterRole : true;
    const matchCategory = filterCategory ? user.category === filterCategory : true;
    return matchName && matchRole && matchCategory;
  });

  if (loading && users.length === 0) return <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${message.includes('Lỗi') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          <div className="flex items-center gap-2">
            {message.includes('Lỗi') ? <X size={16} /> : <Check size={16} />}
            {message}
          </div>
        </div>
      )}

      {/* Bulk Update Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="sticky top-0 z-30 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-wrap items-center gap-4 animate-in slide-in-from-top-8 duration-300">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <Check size={16} className="text-green-400" />
            <span className="font-black uppercase text-[10px] tracking-widest">Đang chọn {selectedUserIds.length} người dùng</span>
          </div>

          <div className="flex-1 flex flex-wrap gap-4 items-center">
            <select
              value={bulkForm.role}
              onChange={e => setBulkForm(b => ({ ...b, role: e.target.value }))}
              className="bg-white/10 border-none outline-none text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-green-400"
            >
              <option value="" className="text-slate-900">-- Chỉnh vai trò --</option>
              <option value="Quản trị viên" className="text-slate-900">Quản trị viên</option>
              <option value="Người dùng" className="text-slate-900">Người dùng</option>
            </select>

            <select
              value={bulkForm.category}
              onChange={e => setBulkForm(b => ({ ...b, category: e.target.value }))}
              className="bg-white/10 border-none outline-none text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-green-400"
            >
              <option value="" className="text-slate-900">-- Chỉnh đối tượng --</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
            </select>

            <input
              placeholder="Ghi chú hàng loạt..."
              value={bulkForm.notes}
              onChange={e => setBulkForm(b => ({ ...b, notes: e.target.value }))}
              className="bg-white/10 border-none outline-none text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-green-400 flex-1 min-w-[200px]"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBulkUpdate}
              className="bg-[#059669] text-white px-4 py-1.5 rounded-lg font-black uppercase text-[10px] hover:bg-[#0d6e39] transition-all flex items-center gap-2"
            >
              <Save size={14} /> Cập nhật
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-black uppercase text-[10px] hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Xuất Excel ({selectedUserIds.length})
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="bg-white/10 text-white px-4 py-1.5 rounded-lg font-black uppercase text-[10px] hover:bg-white/20 transition-all"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <UserIcon size={20} className="text-[#059669]" />
              {editingId ? 'Cập nhật tài khoản' : 'Đăng ký tài khoản mới'}
            </h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-full"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Tài khoản *</label>
              <input
                required
                placeholder="Ví dụ: nva123"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Mật khẩu *</label>
              <input
                type="password"
                required={!editingId}
                placeholder={editingId ? "Để trống nếu không đổi" : "Tối thiểu 6 ký tự"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Họ và tên *</label>
              <input
                required
                placeholder="Nhập họ và tên đầy đủ"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Đơn vị công tác</label>
              <input
                ref={deptInputRef}
                placeholder="Tìm khoa/phòng..."
                value={form.department}
                onChange={e => {
                  setForm(f => ({ ...f, department: e.target.value }));
                  setDeptSearchTerm(e.target.value);
                  setShowDeptDropdown(true);
                }}
                onFocus={() => setShowDeptDropdown(true)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
              <ChevronDown className="absolute right-4 top-[42px] text-slate-400" size={16} />

              {showDeptDropdown && (
                <div ref={deptDropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-1">
                  {departments
                    .filter(dept => (`${dept.ma_don_vi} - ${dept.ten_don_vi}`).toLowerCase().includes(deptSearchTerm.toLowerCase()))
                    .map(dept => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          const val = `${dept.ma_don_vi} - ${dept.ten_don_vi}`;
                          setForm(f => ({ ...f, department: val }));
                          setShowDeptDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-table font-bold hover:bg-green-50 rounded-xl transition-colors border-b border-slate-50 last:border-0 uppercase group"
                      >
                        <span className="text-[#059669] group-hover:scale-110 transition-transform">{dept.ma_don_vi}</span> - {dept.ten_don_vi}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Vai trò</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
              >
                <option value="Quản trị viên">Quản trị viên</option>
                <option value="Người dùng">Người dùng</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Đối tượng</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Khóa">Khóa</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Ghi chú</label>
              <input
                placeholder="Ghi chú thêm về nhân sự..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-6 py-4 border-t border-slate-100 mt-2">
              <div className="w-20 h-20 rounded-[28px] bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg shrink-0">
                {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <Image size={32} className="text-slate-300" />}
              </div>
              <div className="space-y-2">
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <Upload size={14} /> {avatarPreview ? 'Đổi ảnh đại diện' : 'Tải lên ảnh mới'}
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hỗ trợ JPG, PNG, WebP (Tỷ lệ 1:1 đề xuất)</p>
              </div>
            </div>

            <div className="md:col-span-4 flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={uploadingAvatar}
                className="flex-1 flex items-center justify-center gap-3 bg-[#059669] text-white px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-green-900/10 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                {uploadingAvatar ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <Save size={20} />}
                {editingId ? 'Lưu thay đổi' : 'Khởi tạo tài khoản'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-4 border border-slate-200 rounded-2xl font-black uppercase text-sm text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#059669] text-white px-6 py-3 rounded-xl hover:bg-[#0d6e39] font-black text-input uppercase shadow-xl shadow-green-900/10 active:scale-95 transition-all outline-none"
          >
            <Plus size={20} /> Đăng ký người dùng
          </button>

          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <input
                placeholder="Tìm tên hoặc tài khoản..."
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none transition-all pl-10"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
            >
              <option value="">-- Tất cả vai trò --</option>
              <option value="Quản trị viên">Quản trị viên</option>
              <option value="Người dùng">Người dùng</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
            >
              <option value="">-- Tất cả đối tượng --</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="hidden bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#059669] text-white font-black uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-5 w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedUserIds.length === users.length && users.length > 0}
                    className="w-4 h-4 rounded accent-slate-900 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-5">Tài khoản & Vai trò</th>
                <th className="px-6 py-5">Họ và tên & Đơn vị</th>
                <th className="px-6 py-5">Đối tượng</th>
                <th className="px-6 py-5">Ghi chú</th>
                <th className="px-6 py-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`hover:bg-green-50/50 transition-colors group ${selectedUserIds.includes(user.id) ? 'bg-green-50' : ''}`}
                >
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-4 h-4 rounded accent-[#059669] cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 min-w-[180px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-primary-700 font-black text-[10px] uppercase overflow-hidden shrink-0">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.username.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-[12px] tracking-tight">{user.username}</span>
                        <span className={`text-[9px] font-black w-fit px-1.5 rounded ${user.role === 'Quản trị viên' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'
                          }`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{user.full_name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{user.department || 'Chưa phân khoa'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">
                      {user.category || 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-400 max-w-[200px] truncate" title={user.notes}>
                    {user.notes || '-'}
                  </td>
                  <td className="px-6 py-4 text-right min-w-[300px]">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedUserDetail(user)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-black text-[10px] uppercase transition-all" title="Xem chi tiết">
                        <Eye size={14} /> Xem
                      </button>
                      <button onClick={() => handleEdit(user)} className="flex items-center gap-1.5 px-3 py-1.5 text-[#059669] hover:bg-green-50 rounded-lg font-black text-[10px] uppercase transition-all" title="Sửa">
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-black text-[10px] uppercase transition-all" title="Xóa">
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 uppercase font-black tracking-widest text-[10px]">
                    Hệ thống chưa ghi nhận dữ liệu người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            Hệ thống chưa ghi nhận dữ liệu người dùng
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors ${selectedUserIds.includes(user.id) ? 'border-[#059669]/40 bg-green-50/40' : 'border-slate-200'}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleSelectUser(user.id)}
                  className="mt-3 h-4 w-4 rounded accent-[#059669] cursor-pointer"
                />
                <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-primary-700 font-black text-[10px] uppercase overflow-hidden shrink-0">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.username.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black uppercase tracking-tight text-slate-800">{user.full_name || user.username}</p>
                      <p className="truncate text-[10px] font-bold uppercase text-slate-400">{user.department || 'Chưa phân khoa'}</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-black uppercase ${user.role === 'Quản trị viên' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{user.username}</span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{user.category || 'Nhân viên'}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-[11px] font-bold text-slate-500">{user.notes || '-'}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button onClick={() => setSelectedUserDetail(user)} className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase text-blue-600">
                  <Eye size={14} /> Xem
                </button>
                <button onClick={() => handleEdit(user)} className="flex items-center justify-center gap-1.5 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-[10px] font-black uppercase text-[#059669]">
                  <Edit2 size={14} /> Sửa
                </button>
                <button onClick={() => handleDelete(user.id)} className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-black uppercase text-red-600">
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-gradient-to-br from-[#059669] to-[#0d6e39] text-white flex justify-between items-center relative overflow-hidden">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3 relative z-10">
                <UserIcon size={28} /> Hồ sơ tài khoản
              </h3>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-2xl transition-all relative z-10"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-10">
              <div className="flex items-center gap-8">
                <div className="w-32 h-32 rounded-[44px] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden shrink-0">
                  {selectedUserDetail.avatar ? (
                    <img src={selectedUserDetail.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                      <UserIcon size={48} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="text-3xl font-black text-slate-800 uppercase leading-tight tracking-tight">{selectedUserDetail.full_name}</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase border border-green-100">
                      {selectedUserDetail.department || 'Chưa phân khoa'}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-black uppercase border border-slate-100">
                      {selectedUserDetail.category || 'Nhân viên'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Tài khoản & Vai trò</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="font-black text-slate-800 uppercase text-sm mb-1">{selectedUserDetail.username}</p>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedUserDetail.role}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Mật khẩu truy cập</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <Lock size={16} className="text-[#059669]" />
                          <span className="font-mono font-black text-[#059669] tracking-[0.2em] text-lg">{selectedUserDetail.password}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-300 italic">
                          <EyeOff size={16} />
                          <span className="text-[11px] font-bold uppercase tracking-tight">Quyền hạn hạn chế</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Thông tin bổ sung</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[56px]">
                      <p className="text-xs font-bold text-slate-600">{selectedUserDetail.notes || 'Không có ghi chú'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Trạng thái hiện tại</label>
                    <div className={`p-4 rounded-2xl border text-center ${selectedUserDetail.status === 'Hoạt động' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
                      }`}>
                      <span className="text-[11px] font-black uppercase tracking-widest">{selectedUserDetail.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm shadow-2xl shadow-slate-900/30 hover:shadow-slate-900/50 hover:-translate-y-1 transition-all active:scale-95"
                >
                  Đóng hồ sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
