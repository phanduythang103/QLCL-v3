import React, { useEffect, useState } from 'react';
import { fetchUsers } from '../readUsers';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers()
      .then(data => {
        setUsers(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Đang tải dữ liệu người dùng...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      <h2>Danh sách người dùng</h2>
      <ul>
        {users.map((user, idx) => (
          <li key={user.id || idx}>{user.email || JSON.stringify(user)}</li>
        ))}
      </ul>
    </div>
  );
}
