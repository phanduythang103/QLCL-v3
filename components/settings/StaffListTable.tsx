import React, { useEffect, useState, useMemo } from 'react';
import { fetchDanhSachNhanVien, addDanhSachNhanVien, updateDanhSachNhanVien, deleteDanhSachNhanVien } from '../../readDanhSachNhanVien';
import { fetchDmDonVi } from '../../readDmDonVi';
import { Edit2, Trash2, Plus, X, Check, Search, Stethoscope, HeartPulse } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DOI_TUONG_OPTIONS = ['Điều dưỡng', 'Bác sỹ'];

export default function StaffListTable() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterDoiTuong, setFilterDoiTuong] = useState('');
  const [filterDonVi, setFilterDonVi] = useState('');

  // Quản trị: xem tất cả + lọc theo đơn vị. User thường: chỉ xem đơn vị của mình.
  const isAdmin = useMemo(() => {
    const r = (user?.role || '').toLowerCase();
    return r.includes('admin') || r.includes('quản trị');
  }, [user]);
  const userDept = (user?.department || '').trim();
  const norm = (s?: string | null) => (s || '').trim().toLowerCase();

  const emptyForm = () => ({
    // Tự điền sẵn theo Khoa/Đơn vị của user, nhưng cho phép sửa
    khoa_don_vi: user?.department || '',
    ho_ten: '',
    doi_tuong: 'Điều dưỡng',
  });

  const [form, setForm] = useState(emptyForm());

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, depts] = await Promise.all([fetchDanhSachNhanVien(), fetchDmDonVi()]);
      setItems(data || []);
      setDepartments(depts || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching danh_sach_nhan_vien:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDanhSachNhanVien(editingId, form);
        setMessage('Cập nhật thành công!');
      } else {
        await addDanhSachNhanVien(form);
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
      khoa_don_vi: item.khoa_don_vi || '',
      ho_ten: item.ho_ten || '',
      doi_tuong: item.doi_tuong || 'Điều dưỡng',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      try {
        await deleteDanhSachNhanVien(id);
        setMessage('Đã xóa thành công!');
        loadData();
      } catch (err: any) {
        setMessage('Lỗi: ' + err.message);
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Danh sách đơn vị (chỉ admin dùng để lọc), lấy từ dữ liệu hiện có để luôn khớp
  const donViOptions = useMemo(() => {
    const set = new Set(items.map(it => (it.khoa_don_vi || '').trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [items]);

  const filteredItems = useMemo(() => items.filter(it => {
    const matchName = norm(it.ho_ten).includes(norm(filterName));
    const matchDoiTuong = filterDoiTuong ? it.doi_tuong === filterDoiTuong : true;
    const matchDonVi = isAdmin
      ? (filterDonVi ? norm(it.khoa_don_vi) === norm(filterDonVi) : true)
      : norm(it.khoa_don_vi) === norm(userDept);
    return matchName && matchDoiTuong && matchDonVi;
  }), [items, filterName, filterDoiTuong, filterDonVi, isAdmin, userDept]);

  if (loading) return <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Lỗi: {error}</div>;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-3 rounded-lg text-sm font-bold ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-label font-black text-black uppercase">{editingId ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Khoa / Đơn vị</label>
              <input
                list="staff-dept-options"
                placeholder="Khoa/Đơn vị công tác"
                value={form.khoa_don_vi}
                onChange={e => setForm(f => ({ ...f, khoa_don_vi: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
              <datalist id="staff-dept-options">
                {departments.map(d => <option key={d.id} value={`${d.ma_don_vi} - ${d.ten_don_vi}`} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Họ và tên *</label>
              <input
                required
                placeholder="Nhập họ và tên"
                value={form.ho_ten}
                onChange={e => setForm(f => ({ ...f, ho_ten: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Đối tượng</label>
              <select
                value={form.doi_tuong}
                onChange={e => setForm(f => ({ ...f, doi_tuong: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-800 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
              >
                {DOI_TUONG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="flex items-center gap-2 bg-[#059669] text-white px-4 py-2 rounded-lg hover:bg-[#0d6e39] text-input font-black uppercase shadow-md">
                <Check size={16} /> {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-200 rounded-lg text-input font-black text-black hover:bg-slate-50 uppercase">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <button onClick={() => { setForm(emptyForm()); setShowForm(true); }} className="flex items-center gap-2 bg-[#059669] text-white px-4 py-2.5 rounded-xl hover:bg-[#0d6e39] text-input font-black uppercase shadow-md shrink-0">
            <Plus size={16} /> Thêm nhân viên
          </button>
          <div className={`flex-1 grid grid-cols-1 gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Tìm theo họ tên..."
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none"
              />
            </div>
            {isAdmin && (
              <select
                value={filterDonVi}
                onChange={e => setFilterDonVi(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
              >
                <option value="">-- Tất cả đơn vị --</option>
                {donViOptions.map(dv => <option key={dv} value={dv}>{dv}</option>)}
              </select>
            )}
            <select
              value={filterDoiTuong}
              onChange={e => setFilterDoiTuong(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
            >
              <option value="">-- Tất cả đối tượng --</option>
              {DOI_TUONG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#059669] text-white font-black uppercase text-table h-12">
              <tr>
                <th className="px-4 py-3 w-12 text-center hidden sm:table-cell">#</th>
                <th className="px-4 py-3">Khoa / Đơn vị</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu</td></tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-center text-slate-500 hidden sm:table-cell">{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-bold uppercase">{item.khoa_don_vi || '---'}</td>
                    <td className="px-4 py-3 text-black font-black text-table">{item.ho_ten}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${item.doi_tuong === 'Bác sỹ' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {item.doi_tuong === 'Bác sỹ' ? <Stethoscope size={12} /> : <HeartPulse size={12} />}
                        {item.doi_tuong}
                      </span>
                    </td>
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
      </div>
    </div>
  );
}
