import React, { useEffect, useState } from 'react';
import { fetchDmDonVi, addDmDonVi, updateDmDonVi, deleteDmDonVi } from '../../readDmDonVi';
import { Edit2, Trash2, Plus, X, Check, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DeptTable() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ma_don_vi: '',
    ten_don_vi: '',
    khoi: ''
  });

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterKhoi, setFilterKhoi] = useState('all');

  const khoiOptions = [
    { id: 'all', label: 'Tất cả' },
    { id: 'Nội', label: 'Khối Nội' },
    { id: 'Ngoại', label: 'Khối Ngoại' },
    { id: 'Cận lâm sàng', label: 'Cận lâm sàng' },
    { id: 'Cơ quan', label: 'Khối Cơ quan' },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDmDonVi();
      console.log('DmDonVi from Supabase:', data);
      setItems(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dm_don_vi:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter/Pagination Logic
  const filteredItems = items.filter(item => {
    if (filterKhoi === 'all') return true;
    return item.khoi === filterKhoi;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  const resetForm = () => {
    setForm({ ma_don_vi: '', ten_don_vi: '', khoi: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDmDonVi(editingId, form);
        setMessage('Cập nhật thành công!');
      } else {
        await addDmDonVi(form);
        setMessage('Thêm mới thành công!');
      }
      resetForm();
      loadData();
    } catch (err: any) {
      setMessage('Lỗi: ' + err.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (item: any) => {
    setForm({
      ma_don_vi: item.ma_don_vi || '',
      ten_don_vi: item.ten_don_vi || '',
      khoi: item.khoi || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn vị này?')) {
      try {
        await deleteDmDonVi(id);
        setMessage('Đã xóa thành công!');
        loadData();
      } catch (err: any) {
        setMessage('Lỗi: ' + err.message);
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {khoiOptions.map(opt => (
          <button
            key={opt.id}
            onClick={() => { setFilterKhoi(opt.id); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filterKhoi === opt.id
                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-800">{editingId ? 'Sửa đơn vị' : 'Thêm đơn vị mới'}</h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required placeholder="Mã đơn vị *" value={form.ma_don_vi} onChange={e => setForm(f => ({ ...f, ma_don_vi: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
            <input required placeholder="Tên đơn vị *" value={form.ten_don_vi} onChange={e => setForm(f => ({ ...f, ten_don_vi: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
            <select
              required
              value={form.khoi}
              onChange={e => setForm(f => ({ ...f, khoi: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 bg-white"
            >
              <option value="">-- Chọn khối *--</option>
              <option value="Nội">Nội</option>
              <option value="Ngoại">Ngoại</option>
              <option value="Cận lâm sàng">Cận lâm sàng</option>
              <option value="Cơ quan">Cơ quan</option>
            </select>
            <div className="flex gap-2 col-span-full">
              <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
                <Check size={16} /> {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="flex justify-between items-center">
          <div className="text-sm font-bold text-slate-500">
            Tổng số: {filteredItems.length} đơn vị
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Plus size={16} /> Thêm đơn vị
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-primary-600 text-white font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Mã ĐV</th>
              <th className="px-4 py-3">Tên đơn vị</th>
              <th className="px-4 py-3">Khối</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu</td></tr>
            ) : (
              paginatedItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{item.ma_don_vi}</td>
                  <td className="px-4 py-3 text-slate-700">{item.ten_don_vi}</td>
                  <td className="px-4 py-3 text-slate-600">{item.khoi || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Hiển thị</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-primary-500"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-xs font-bold text-slate-500 uppercase">dòng / trang</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <span className="text-xs font-bold text-slate-600">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
