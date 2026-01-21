import React, { useEffect, useState } from 'react';
import { fetchUsers, addUser, updateUser, deleteUser } from '../readUsers';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ username: '', full_name: '', department: '', role: 'Người dùng', status: 'Hoạt động' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');


  const loadUsers = () => {
    setLoading(true);
    fetchUsers()
      .then(data => {
        console.log('Supabase users data:', data);
        setUsers(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Supabase users error:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);


  if (loading) return <div>Đang tải dữ liệu người dùng...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      <h2>Danh sách người dùng</h2>
      {message && <div style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
      <form
        onSubmit={async e => {
          e.preventDefault();
          try {
            if (editingId) {
              await updateUser(editingId, form);
              setMessage('Cập nhật thành công!');
            } else {
              await addUser(form);
              setMessage('Thêm mới thành công!');
            }
            setForm({ username: '', full_name: '', department: '', role: 'Người dùng', status: 'Hoạt động' });
            setEditingId(null);
            loadUsers();
          } catch (err) {
            setMessage('Lỗi: ' + err.message);
          }
        }}
        style={{ marginBottom: 16 }}
      >
        <input
          required
          placeholder="Tài khoản"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          style={{ marginRight: 8 }}
        />
        <input
          required
          placeholder="Họ và tên"
          value={form.full_name}
          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          style={{ marginRight: 8 }}
        />
        <input
          placeholder="Khoa/Phòng"
          value={form.department}
          onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
          style={{ marginRight: 8 }}
        />
        <select
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          style={{ marginRight: 8 }}
        >
          <option value="Quản trị viên">Quản trị viên</option>
          <option value="Người dùng">Người dùng</option>
        </select>
        <select
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          style={{ marginRight: 8 }}
        >
          <option value="Hoạt động">Hoạt động</option>
          <option value="Khóa">Khóa</option>
        </select>
        <button type="submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm({ username: '', full_name: '', department: '', role: 'Người dùng', status: 'Hoạt động' }); }}>Hủy</button>
        )}
      </form>
      <ul>
        {users.map((user, idx) => (
          <li key={user.id || idx} style={{ marginBottom: 4 }}>
            {user.username} - {user.full_name} - {user.department} - {user.role} - {user.status}
            <button style={{ marginLeft: 8 }} onClick={() => { setEditingId(user.id); setForm({ username: user.username, full_name: user.full_name, department: user.department || '', role: user.role, status: user.status }); }}>Sửa</button>
            <button style={{ marginLeft: 8, color: 'red' }} onClick={async () => {
              if (window.confirm('Bạn có chắc muốn xóa?')) {
                try {
                  await deleteUser(user.id);
                  setMessage('Đã xóa thành công!');
                  loadUsers();
                } catch (err) {
                  setMessage('Lỗi: ' + err.message);
                }
              }
            }}>Xóa</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
