import React, { useEffect, useState, useRef } from 'react';
import { fetchUsers, addUser, updateUser, deleteUser } from '../../readUsers';
import { fetchDmDonVi } from '../../readDmDonVi';
import { uploadAvatar } from '../../userApi';
import { Edit2, Trash2, Plus, X, Check, ChevronDown, Upload, Image } from 'lucide-react';

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
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    department: '',
    role: 'Người dùng',
    status: 'Hoạt động'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        fetchUsers(),
        fetchDmDonVi()
      ]);
      console.log('Users from Supabase:', usersData);
      console.log('Departments from Supabase:', deptsData);
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

  // Close dropdown when clicking outside
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
    setForm({ username: '', password: '', full_name: '', department: '', role: 'Người dùng', status: 'Hoạt động' });
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
      // Tạo preview
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
        // Nếu không nhập mật khẩu mới, bỏ qua trường password khi update
        const updateData = form.password
          ? { ...form, username: form.username.toLowerCase() }
          : { username: form.username.toLowerCase(), full_name: form.full_name, department: form.department, role: form.role, status: form.status };
        await updateUser(editingId, updateData);
        setMessage('Cập nhật thành công!');
      } else {
        const newUser = await addUser({ ...form, username: form.username.toLowerCase() });
        userId = newUser.id;
        setMessage('Thêm mới thành công!');
      }

      // Upload avatar nếu có
      if (avatarFile && userId) {
        setUploadingAvatar(true);
        try {
          await uploadAvatar(avatarFile, userId);
          setMessage('Lưu thành công (bao gồm avatar)!');
        } catch (avatarErr: any) {
          setMessage('Lưu thành công nhưng lỗi khi upload avatar: ' + avatarErr.message);
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
      password: '', // Không hiển thị mật khẩu cũ khi sửa
      full_name: user.full_name || '',
      department: user.department || '',
      role: user.role || 'Người dùng',
      status: user.status || 'Hoạt động'
    });
    setEditingId(user.id);
    setShowForm(true);
    // Hiển thị avatar hiện tại nếu có
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

  if (loading) return <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Form thêm/sửa */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-800">{editingId ? 'Sửa người dùng' : 'Thêm người dùng mới'}</h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              required
              placeholder="Tài khoản *"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
            <input
              type="password"
              required={!editingId}
              placeholder={editingId ? "Mật khẩu (để trống nếu không đổi)" : "Mật khẩu *"}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
            <input
              required
              placeholder="Họ và tên *"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
            <div className="relative">
              <input
                ref={deptInputRef}
                placeholder="Khoa/Phòng (VD: A1 - Nội tiêu hóa)"
                value={form.department}
                onChange={e => {
                  setForm(f => ({ ...f, department: e.target.value }));
                  setDeptSearchTerm(e.target.value);
                  setShowDeptDropdown(true);
                }}
                onFocus={() => setShowDeptDropdown(true)}
                className="w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              />
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
              />

              {showDeptDropdown && (
                <div
                  ref={deptDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {departments
                    .filter(dept => {
                      const searchLower = deptSearchTerm.toLowerCase();
                      const deptText = `${dept.ma_don_vi} - ${dept.ten_don_vi}`.toLowerCase();
                      return deptText.includes(searchLower);
                    })
                    .map(dept => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => {
                          const deptValue = `${dept.ma_don_vi} - ${dept.ten_don_vi}`;
                          setForm(f => ({ ...f, department: deptValue }));
                          setDeptSearchTerm(deptValue);
                          setShowDeptDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <span className="font-semibold text-primary-600">{dept.ma_don_vi}</span>
                        <span className="text-slate-600"> - {dept.ten_don_vi}</span>
                        {dept.khoi && (
                          <span className="ml-2 text-xs text-slate-400">({dept.khoi})</span>
                        )}
                      </button>
                    ))}
                  {departments.filter(dept => {
                    const searchLower = deptSearchTerm.toLowerCase();
                    const deptText = `${dept.ma_don_vi} - ${dept.ten_don_vi}`.toLowerCase();
                    return deptText.includes(searchLower);
                  }).length === 0 && (
                      <div className="px-3 py-4 text-sm text-slate-400 text-center">
                        Không tìm thấy đơn vị phù hợp
                      </div>
                    )}
                </div>
              )}
            </div>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="Quản trị viên">Quản trị viên</option>
              <option value="Người dùng">Người dùng</option>
            </select>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Khóa">Khóa</option>
            </select>

            {/* Avatar Upload */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ảnh đại diện
              </label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl shadow-md overflow-hidden flex-shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image size={32} className="text-white/70" />
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Upload size={16} />
                    {avatarPreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                  </button>
                  <p className="text-xs text-slate-500 mt-1">
                    Định dạng: JPG, PNG, WebP. Kích thước đề xuất: 200x200px
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={uploadingAvatar}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Check size={16} /> {editingId ? 'Cập nhật' : 'Thêm mới'}
                  </>
                )}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nút thêm mới */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          <Plus size={16} /> Thêm người dùng
        </button>
      )}

      {/* Bảng dữ liệu */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-primary-600 text-white font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Tài khoản</th>
              <th className="px-4 py-3">Họ và tên</th>
              <th className="px-4 py-3">Khoa/Phòng</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Chưa có dữ liệu người dùng
                </td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-slate-700">{user.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.department || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'Quản trị viên' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.status === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
