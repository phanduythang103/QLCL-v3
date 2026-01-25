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
  return (
    <div>
      <h2>Thư viện Văn bản</h2>
      <table border="1" cellPadding={6} style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên tài liệu</th>
            <th>Loại</th>
            <th>Cơ quan ban hành</th>
            <th>Ngày hiệu lực</th>
            <th>File văn bản</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td>{idx + 1}</td>
              <td>{item.title || item.ten_tai_lieu || item.name}</td>
              <td>{item.docType || item.loai || ''}</td>
              <td>{item.issuingAuthority || item.co_quan_ban_hanh || ''}</td>
              <td>{item.effectiveDate || item.ngay_hieu_luc || ''}</td>
              <td>
                {item.file_van_ban ? (
                  <a href={
                    item.file_van_ban.startsWith('http')
                      ? item.file_van_ban
                      : `https://<YOUR_SUPABASE_PROJECT>.supabase.co/storage/v1/object/public/vanban/${item.file_van_ban}`
                  } target="_blank" rel="noopener noreferrer">Tải file</a>
                ) : 'Chưa có'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
