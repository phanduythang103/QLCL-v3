import React, { useEffect, useState } from 'react';
import { fetchBienBanThanhVien } from '../readBienBanThanhVien';

export default function BienBanThanhVienList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBienBanThanhVien()
      .then(data => {
        setItems(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Đang tải dữ liệu biên bản thành viên...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      <h2>Biên bản Thành viên</h2>
      <ul>
        {items.map((item, idx) => (
          <li key={item.id || idx}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}
