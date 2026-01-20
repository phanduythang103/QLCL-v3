import React, { useEffect, useState } from 'react';
import { fetchBaoCaoScyk } from '../readBaoCaoScyk';

export default function BaoCaoScykList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBaoCaoScyk()
      .then(data => {
        setItems(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Đang tải dữ liệu báo cáo sự cố...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      <h2>Báo cáo Sự cố Y khoa</h2>
      <ul>
        {items.map((item, idx) => (
          <li key={item.id || idx}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}
