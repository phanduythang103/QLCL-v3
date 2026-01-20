import React, { useEffect, useState } from 'react';
import { fetchChiaSe } from '../readChiaSe';
export default function ChiaSeList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchChiaSe().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu chia sẻ...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Chia sẻ</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
