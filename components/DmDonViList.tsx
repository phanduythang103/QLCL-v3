import React, { useEffect, useState } from 'react';
import { fetchDmDonVi } from '../readDmDonVi';
export default function DmDonViList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDmDonVi().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu đơn vị...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Đơn vị</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
