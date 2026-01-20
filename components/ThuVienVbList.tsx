import React, { useEffect, useState } from 'react';
import { fetchThuVienVb } from '../readThuVienVb';
export default function ThuVienVbList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchThuVienVb().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu thư viện VB...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Thư viện VB</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
