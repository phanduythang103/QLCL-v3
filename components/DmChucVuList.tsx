import React, { useEffect, useState } from 'react';
import { fetchDmChucVu } from '../readDmChucVu';
export default function DmChucVuList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDmChucVu().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu chức vụ...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Chức vụ</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
