import React, { useEffect, useState } from 'react';
import { fetchThuVienVb, ThuVienVb } from '../readThuVienVb';

export default function ThuVienVbList() {
  const [items, setItems] = useState<ThuVienVb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchThuVienVb().then(data => { setItems(data || []); setLoading(false); }).catch(err => { setError(err.message); setLoading(false); });
  }, []);
  if (loading) return <div>Đang tải dữ liệu thư viện VB...</div>;
  if (error) return <div>Lỗi: {error}</div>;
  return (
    <div>
      <h2>Thư viện Văn bản</h2>
      <table border={1} cellPadding={6} style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Số hiệu</th>
            <th>Tên văn bản</th>
            <th>Loại VB</th>
            <th>Cơ quan ban hành</th>
            <th>Ngày hiệu lực</th>
            <th>Trạng thái</th>
            <th>File đính kèm</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td>{idx + 1}</td>
              <td>{item.so_hieu_vb || ''}</td>
              <td>{item.ten_vb}</td>
              <td>{item.loai_vb || ''}</td>
              <td>{item.co_quan_ban_hanh || ''}</td>
              <td>{item.ngay_hieu_luc || ''}</td>
              <td>{item.trang_thai || ''}</td>
              <td>
                {item.file_dinh_kem ? (
                  <a href={item.file_dinh_kem} target="_blank" rel="noopener noreferrer">Tải file</a>
                ) : 'Chưa có'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
