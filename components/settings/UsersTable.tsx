import React, { useEffect, useState } from 'react';
import { fetchUsers, addUser, updateUser, deleteUser } from '../../readUsers';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      const data = await fetchUsers();
      console.log('Users from Supabase:', data);
      setUsers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ username: '', password: '', full_name: '', department: '', role: 'Người dùng', status: 'Hoạt động' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Nếu không nhập mật khẩu mới, bỏ qua trường password khi update
        const updateData = form.password
          ? { ...form, username: form.username.toLowerCase() }
          : { username: form.username.toLowerCase(), full_name: form.full_name, department: form.department, role: form.role, status: form.status };
        await updateUser(editingId, updateData);
        setMessage('Cập nhật thành công!');
      } else {
        await addUser({ ...form, username: form.username.toLowerCase() });
        setMessage('Thêm mới thành công!');
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
            <input
              placeholder="Khoa/Phòng"
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
            />
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
            <div className="flex gap-2">
              <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
                <Check size={16} /> {editingId ? 'Cập nhật' : 'Thêm mới'}
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
