import React, { useEffect, useState } from 'react';
import { fetchDmVaiTroQlcl } from '../readDmVaiTroQlcl';
export default function DmVaiTroQlclList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchDmVaiTroQlcl().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu vai trò QLCL...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return <div><h2>Vai trò QLCL</h2><ul>{items.map((item, idx) => (<li key={item.id || idx}>{JSON.stringify(item)}</li>))}</ul></div>;
}
