import React, { useEffect, useState } from 'react';
import { fetchThuVienVideo } from '../readThuVienVideo';
export default function ThuVienVideoList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchThuVienVideo().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu thư viện video...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Thư viện Video</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
