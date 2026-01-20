import React, { useEffect, useState } from 'react';
import { fetchCoQuanBanHanh } from '../readCoQuanBanHanh';
export default function CoQuanBanHanhList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchCoQuanBanHanh().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu cơ quan ban hành...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Cơ quan ban hành</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
