import React, { useEffect, useState } from 'react';
import { fetchBaoCaoScyk, addBaoCaoScyk, updateBaoCaoScyk, deleteBaoCaoScyk } from '../readBaoCaoScyk';

export default function BaoCaoScykList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ ten: '', mo_ta: '' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');


  const loadItems = () => {
    setLoading(true);
    fetchBaoCaoScyk()
      .then(data => {
        setItems(data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, []);


  if (loading) return <div>Đang tải dữ liệu báo cáo sự cố...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div>
      <h2>Báo cáo Sự cố Y khoa</h2>
      {message && <div style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
      <form
        onSubmit={async e => {
          e.preventDefault();
          try {
            if (editingId) {
              await updateBaoCaoScyk(editingId, form);
              setMessage('Cập nhật thành công!');
            } else {
              await addBaoCaoScyk(form);
              setMessage('Thêm mới thành công!');
            }
            setForm({ ten: '', mo_ta: '' });
            setEditingId(null);
            loadItems();
          } catch (err) {
            setMessage('Lỗi: ' + err.message);
          }
        }}
        style={{ marginBottom: 16 }}
      >
        <input
          required
          placeholder="Tên sự cố"
          value={form.ten}
          onChange={e => setForm(f => ({ ...f, ten: e.target.value }))}
          style={{ marginRight: 8 }}
        />
        <input
          placeholder="Mô tả"
          value={form.mo_ta}
          onChange={e => setForm(f => ({ ...f, mo_ta: e.target.value }))}
          style={{ marginRight: 8 }}
        />
        <button type="submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm({ ten: '', mo_ta: '' }); }}>Hủy</button>
        )}
      </form>
      <ul>
        {items.map((item, idx) => (
          <li key={item.id || idx} style={{ marginBottom: 4 }}>
            {item.ten} - {item.mo_ta}
            <button style={{ marginLeft: 8 }} onClick={() => { setEditingId(item.id); setForm({ ten: item.ten, mo_ta: item.mo_ta }); }}>Sửa</button>
            <button style={{ marginLeft: 8, color: 'red' }} onClick={async () => {
              if (window.confirm('Bạn có chắc muốn xóa?')) {
                try {
                  await deleteBaoCaoScyk(item.id);
                  setMessage('Đã xóa thành công!');
                  loadItems();
                } catch (err) {
                  setMessage('Lỗi: ' + err.message);
                }
              }
            }}>Xóa</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
