import React, { useEffect, useState } from 'react';
import { fetchLichGiamSat } from '../readLichGiamSat';
export default function LichGiamSatList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchLichGiamSat().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu lịch giám sát...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Lịch giám sát</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
