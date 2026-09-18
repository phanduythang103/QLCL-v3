import React, { useEffect, useState, useMemo } from 'react';
import { fetchDanhSachNhanVien, addDanhSachNhanVien, updateDanhSachNhanVien, deleteDanhSachNhanVien, syncNhanVienToPhieuGiamSat, DOI_TUONG_OPTIONS } from '../../readDanhSachNhanVien';
import { fetchDmDonVi } from '../../readDmDonVi';
import { Edit2, Trash2, Plus, X, Check, Search, Stethoscope, HeartPulse, Wrench, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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

  // Cập nhật hàng loạt chức danh
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDoiTuong, setBulkDoiTuong] = useState(DOI_TUONG_OPTIONS[0]);
  const [bulkBusy, setBulkBusy] = useState(false);

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
        const original = items.find(it => it.id === editingId);
        const oldName = (original?.ho_ten || '').trim();
        const nameChanged = oldName !== (form.ho_ten || '').trim();
        const doiTuongChanged = (original?.doi_tuong || '') !== form.doi_tuong;

        await updateDanhSachNhanVien(editingId, form);

        // Đồng bộ sang các phiếu đã giám sát (khớp theo họ tên cũ)
        let syncMsg = '';
        if (oldName && (nameChanged || doiTuongChanged)) {
          const { updated, errors } = await syncNhanVienToPhieuGiamSat(oldName, {
            ...(nameChanged ? { ho_ten: form.ho_ten } : {}),
            ...(doiTuongChanged ? { doi_tuong: form.doi_tuong } : {}),
          });
          if (updated > 0) syncMsg = ` Đã đồng bộ ${updated} phiếu giám sát.`;
          if (errors.length) console.warn('Sync phiếu giám sát lỗi:', errors);
        }
        setMessage('Cập nhật thành công!' + syncMsg);
      } else {
        await addDanhSachNhanVien(form);
        setMessage('Thêm mới thành công!');
      }
      resetForm();
      loadData();
    } catch (err: any) {
      setMessage('Lỗi: ' + err.message);
    }
    setTimeout(() => setMessage(''), 4000);
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    const targets = items.filter(it => selectedIds.has(it.id));
    if (targets.length === 0) return;
    if (!window.confirm(`Đặt chức danh "${bulkDoiTuong}" cho ${targets.length} nhân viên và đồng bộ các phiếu đã giám sát?`)) return;

    setBulkBusy(true);
    let staffUpdated = 0;
    let phieuUpdated = 0;
    try {
      for (const it of targets) {
        if (it.doi_tuong === bulkDoiTuong) continue; // bỏ qua nếu không đổi
        await updateDanhSachNhanVien(it.id, { doi_tuong: bulkDoiTuong });
        staffUpdated++;
        const { updated } = await syncNhanVienToPhieuGiamSat((it.ho_ten || '').trim(), { doi_tuong: bulkDoiTuong });
        phieuUpdated += updated;
      }
      setSelectedIds(new Set());
      setMessage(`Đã cập nhật chức danh cho ${staffUpdated} nhân viên` + (phieuUpdated > 0 ? `, đồng bộ ${phieuUpdated} phiếu giám sát.` : '.'));
      loadData();
    } catch (err: any) {
      setMessage('Lỗi: ' + err.message);
    }
    setBulkBusy(false);
    setTimeout(() => setMessage(''), 4000);
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

  const selectedCount = useMemo(
    () => filteredItems.filter(it => selectedIds.has(it.id)).length,
    [filteredItems, selectedIds]
  );
  const allFilteredSelected = filteredItems.length > 0 && selectedCount === filteredItems.length;

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredItems.forEach(it => next.delete(it.id));
      } else {
        filteredItems.forEach(it => next.add(it.id));
      }
      return next;
    });
  };

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

      {!showForm && selectedCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
          <span className="text-input font-black text-emerald-800 uppercase">Đã chọn {selectedCount} nhân viên</span>
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Đặt chức danh</label>
            <select
              value={bulkDoiTuong}
              onChange={e => setBulkDoiTuong(e.target.value)}
              disabled={bulkBusy}
              className="px-4 py-2 bg-white border border-emerald-200 rounded-xl text-input font-bold text-slate-700 focus:ring-2 focus:ring-[#059669] outline-none appearance-none"
            >
              {DOI_TUONG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkBusy}
              className="flex items-center gap-2 bg-[#059669] text-white px-4 py-2 rounded-xl hover:bg-[#0d6e39] text-input font-black uppercase shadow-md disabled:opacity-60"
            >
              <RefreshCw size={16} className={bulkBusy ? 'animate-spin' : ''} /> {bulkBusy ? 'Đang cập nhật...' : 'Áp dụng & đồng bộ'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkBusy}
              className="px-4 py-2 border border-emerald-200 rounded-xl text-input font-black text-emerald-700 hover:bg-emerald-100 uppercase"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#059669] text-white font-black uppercase text-table h-12">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="Chọn tất cả"
                    className="w-4 h-4 accent-white cursor-pointer align-middle"
                  />
                </th>
                <th className="px-4 py-3 w-12 text-center hidden sm:table-cell">#</th>
                <th className="px-4 py-3">Khoa / Đơn vị</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu</td></tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${selectedIds.has(item.id) ? 'bg-emerald-50/60' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`Chọn ${item.ho_ten}`}
                        className="w-4 h-4 accent-[#059669] cursor-pointer align-middle"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 hidden sm:table-cell">{idx + 1}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-bold uppercase">{item.khoa_don_vi || '---'}</td>
                    <td className="px-4 py-3 text-black font-black text-table">{item.ho_ten}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const style = item.doi_tuong === 'Bác sỹ'
                          ? { cls: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Stethoscope size={12} /> }
                          : item.doi_tuong === 'Kỹ thuật viên'
                          ? { cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Wrench size={12} /> }
                          : { cls: 'bg-purple-50 text-purple-600 border-purple-100', icon: <HeartPulse size={12} /> };
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${style.cls}`}>
                            {style.icon}
                            {item.doi_tuong}
                          </span>
                        );
                      })()}
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
