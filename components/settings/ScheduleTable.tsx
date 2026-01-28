import React, { useEffect, useState } from 'react';
import { fetchLichGiamSat, addLichGiamSat, updateLichGiamSat, deleteLichGiamSat } from '../../readLichGiamSat';
import { fetchDmDonVi } from '../../readDmDonVi';
import { fetchUsers } from '../../userApi';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';

// Hàm tính trạng thái tự động dựa trên ngày
const getAutoStatus = (tuNgay: string, denNgay: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(tuNgay);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(denNgay);
  endDate.setHours(0, 0, 0, 0);
  
  if (today < startDate) return 'Chưa thực hiện';
  if (today > endDate) return 'Quá hạn';
  return 'Đang thực hiện';
};

// Hàm format ngày dd/mm/yyyy
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function ScheduleTable() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [donViList, setDonViList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    tu_ngay: '',
    den_ngay: '',
    nd_giam_sat: '',
    nhan_vien_gs: '',
    dv_duoc_gs: '',
    trang_thai: 'Chưa thực hiện'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, donVi, users] = await Promise.all([
        fetchLichGiamSat(),
        fetchDmDonVi(),
        fetchUsers()
      ]);
      console.log('LichGiamSat from Supabase:', data);
      setItems(data || []);
      setDonViList(donVi || []);
      setUsersList(users || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching lich_giam_sat:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ tu_ngay: '', den_ngay: '', nd_giam_sat: '', nhan_vien_gs: '', dv_duoc_gs: '', trang_thai: 'Chưa thực hiện' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateLichGiamSat(editingId, form);
        setMessage('Cập nhật thành công!');
      } else {
        // Thêm nguoi_tao khi tạo lịch mới
        await addLichGiamSat({
          ...form,
          nguoi_tao: user?.full_name || user?.username || 'Hệ thống'
        });
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
      tu_ngay: item.tu_ngay || '',
      den_ngay: item.den_ngay || '',
      nd_giam_sat: item.nd_giam_sat || '',
      nhan_vien_gs: item.nhan_vien_gs || '',
      dv_duoc_gs: item.dv_duoc_gs || '',
      trang_thai: item.trang_thai || 'Chưa thực hiện'
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa lịch giám sát này?')) {
      try {
        await deleteLichGiamSat(id);
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
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm mb-4">
        <p>Cấu hình lịch giám sát định kỳ cho các khoa phòng. Hệ thống sẽ tự động gửi thông báo nhắc nhở.</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-slate-800">{editingId ? 'Sửa lịch giám sát' : 'Thêm lịch giám sát mới'}</h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Từ ngày *</label>
              <input type="date" required value={form.tu_ngay} onChange={e => setForm(f => ({ ...f, tu_ngay: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Đến ngày *</label>
              <input type="date" required value={form.den_ngay} onChange={e => setForm(f => ({ ...f, den_ngay: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Trạng thái *</label>
              <select required value={form.trang_thai} onChange={e => setForm(f => ({ ...f, trang_thai: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                <option value="Chưa thực hiện">Chưa thực hiện</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Quá hạn">Quá hạn</option>
              </select>
              {form.tu_ngay && form.den_ngay && (
                <p className="text-xs text-slate-500 mt-1">
                  Trạng thái tự động: <span className="font-medium text-primary-600">{getAutoStatus(form.tu_ngay, form.den_ngay)}</span>
                </p>
              )}
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs text-slate-500 mb-1">Nội dung giám sát *</label>
              <input required placeholder="Nội dung giám sát" value={form.nd_giam_sat} onChange={e => setForm(f => ({ ...f, nd_giam_sat: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nhân viên giám sát *</label>
              <select required value={form.nhan_vien_gs} onChange={e => setForm(f => ({ ...f, nhan_vien_gs: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                <option value="">-- Chọn nhân viên --</option>
                {usersList.map(user => (
                  <option key={user.id} value={user.full_name}>{user.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Đơn vị được giám sát *</label>
              <select required value={form.dv_duoc_gs} onChange={e => setForm(f => ({ ...f, dv_duoc_gs: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500">
                <option value="">-- Chọn đơn vị --</option>
                {donViList.map(dv => (
                  <option key={dv.id} value={`${dv.ma_don_vi} - ${dv.ten_don_vi}`}>
                    {dv.ma_don_vi} - {dv.ten_don_vi}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 items-end">
              <button type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
                <Check size={16} /> {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium">
          <Plus size={16} /> Thêm lịch giám sát
        </button>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-primary-600 text-white font-bold uppercase text-xs">
            <tr>
              <th className="px-4 py-3 w-12 text-center">#</th>
              <th className="px-4 py-3">Từ ngày</th>
              <th className="px-4 py-3">Đến ngày</th>
              <th className="px-4 py-3">Nội dung giám sát</th>
              <th className="px-4 py-3">Nhân viên GS</th>
              <th className="px-4 py-3">ĐV được GS</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu</td></tr>
            ) : (
              items.map((item, idx) => {
                const autoStatus = getAutoStatus(item.tu_ngay, item.den_ngay);
                return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.tu_ngay)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(item.den_ngay)}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{item.nd_giam_sat}</td>
                  <td className="px-4 py-3 text-slate-600">{item.nhan_vien_gs}</td>
                  <td className="px-4 py-3 text-slate-600">{item.dv_duoc_gs}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.trang_thai === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' : 
                        item.trang_thai === 'Hoàn thành' ? 'bg-green-100 text-green-700' : 
                        item.trang_thai === 'Quá hạn' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.trang_thai}
                      </span>
                      {item.trang_thai !== autoStatus && (
                        <span className="text-[10px] text-slate-400">Tự động: {autoStatus}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
