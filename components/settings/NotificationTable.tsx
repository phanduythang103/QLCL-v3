import React, { useEffect, useState, useRef } from 'react';
import { fetchThongBao, addThongBao, updateThongBao, deleteThongBao, uploadCVFile, ThongBao } from '../../readThongBao';
import { fetchDmDonVi, addDmDonVi } from '../../readDmDonVi';
import { useAuth } from '../../contexts/AuthContext';
import {
    Edit2, Trash2, Plus, X, Check, Paperclip, Loader,
    Calendar, Users, Info, Bell, Eye, ChevronRight,
    MoreHorizontal, Download, FileText, User, Table as TableIcon, CreditCard
} from 'lucide-react';

export default function NotificationTable() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<ThongBao[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    // Modals state
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddUnitModal, setShowAddUnitModal] = useState(false); // New modal state
    const [selectedNoti, setSelectedNoti] = useState<ThongBao | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New unit form state
    const [newUnit, setNewUnit] = useState({ ma_don_vi: '', ten_don_vi: '', khoi: '' });
    const [addingUnit, setAddingUnit] = useState(false);

    const [form, setForm] = useState({
        noi_dung: '',
        don_vi_thuc_hien: [] as string[],
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        ghi_chu: '',
        file_dinh_kem: ''
    });

    // Check permissions
    const isAdmin = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('quản trị');

    const loadData = async () => {
        setLoading(true);
        try {
            const [notiData, unitData] = await Promise.all([
                fetchThongBao(),
                fetchDmDonVi()
            ]);
            setNotifications(notiData || []);
            setUnits(unitData || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setForm({
            noi_dung: '',
            don_vi_thuc_hien: [],
            ngay_bat_dau: '',
            ngay_ket_thuc: '',
            ghi_chu: '',
            file_dinh_kem: ''
        });
        setEditingId(null);
        setShowFormModal(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const publicUrl = await uploadCVFile(file);
            setForm(f => ({ ...f, file_dinh_kem: publicUrl }));
            setMessage('Tải lên thành công!');
        } catch (err: any) {
            setMessage('Lỗi tải lên: ' + err.message);
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...form,
                nguoi_tao_id: user?.id,
                nguoi_tao_name: user?.full_name
            };

            if (editingId) {
                await updateThongBao(editingId, dataToSave);
                setMessage('Cập nhật thành công!');
            } else {
                await addThongBao(dataToSave);
                setMessage('Thêm mới thành công!');
            }
            resetForm();
            loadData();
        } catch (err: any) {
            setMessage('Lỗi: ' + err.message);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleEdit = (noti: ThongBao) => {
        setForm({
            noi_dung: noti.noi_dung || '',
            don_vi_thuc_hien: noti.don_vi_thuc_hien || [],
            ngay_bat_dau: noti.ngay_bat_dau || '',
            ngay_ket_thuc: noti.ngay_ket_thuc || '',
            ghi_chu: noti.ghi_chu || '',
            file_dinh_kem: noti.file_dinh_kem || ''
        });
        setEditingId(noti.id);
        setShowFormModal(true);
        setShowDetailModal(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
            try {
                await deleteThongBao(id);
                setMessage('Đã xóa thành công!');
                loadData();
                setShowDetailModal(false);
            } catch (err: any) {
                setMessage('Lỗi: ' + err.message);
            }
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const toggleUnit = (unitName: string) => {
        setForm(f => ({
            ...f,
            don_vi_thuc_hien: f.don_vi_thuc_hien.includes(unitName)
                ? f.don_vi_thuc_hien.filter(u => u !== unitName)
                : [...f.don_vi_thuc_hien, unitName]
        }));
    };

    const handleSaveUnit = () => {
        if (!newUnit.ten_don_vi) {
            alert('Vui lòng nhập tên đơn vị');
            return;
        }

        // Check if already exists in selected list
        if (form.don_vi_thuc_hien.includes(newUnit.ten_don_vi)) {
            alert('Đơn vị này đã được chọn');
            return;
        }

        // Add direct to form state, no DB save
        setForm(f => ({
            ...f,
            don_vi_thuc_hien: [...f.don_vi_thuc_hien, newUnit.ten_don_vi]
        }));

        setShowAddUnitModal(false);
        setNewUnit({ ma_don_vi: '', ten_don_vi: '', khoi: '' });
    };

    const openDetail = (noti: ThongBao) => {
        setSelectedNoti(noti);
        setShowDetailModal(true);
    };

    if (loading) return <div className="text-center py-12"><Loader className="animate-spin mx-auto mb-2 text-primary-600" /> Đang tải dữ liệu...</div>;
    if (error) return <div className="text-center py-12 text-red-500">Lỗi: {error}</div>;

    return (
        <div className="space-y-6">
            {message && (
                <div className={`fixed top-20 right-6 z-[100] p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 font-bold ${message.includes('Lỗi') ? 'bg-red-500 text-white border-red-400' : 'bg-green-600 text-white border-green-500'
                    }`}>
                    {message}
                </div>
            )}

            {/* Header & New Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 lg:p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <p className="text-xs lg:text-sm text-slate-400 font-bold uppercase tracking-widest">Quản lý hệ thống</p>
                    <p className="text-lg lg:text-xl font-black text-slate-800">Danh sách thông báo</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({ noi_dung: '', don_vi_thuc_hien: [], ngay_bat_dau: '', ngay_ket_thuc: '', ghi_chu: '', file_dinh_kem: '' });
                            setShowFormModal(true);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl hover:bg-primary-700 font-black transition-all shadow-xl shadow-primary-900/20 active:scale-95"
                    >
                        <Plus size={20} />
                        Tạo thông báo
                    </button>
                )}
            </div>

            {/* Content View: Table (Desktop) / Cards (Mobile) */}
            <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Ngày tạo</th>
                            <th className="px-6 py-4">Nội dung</th>
                            <th className="px-6 py-4">Đơn vị áp dụng</th>
                            <th className="px-6 py-4">Thời hạn</th>
                            <th className="px-6 py-4 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Chưa có thông báo nào.</td>
                            </tr>
                        ) : (
                            notifications.map((noti) => (
                                <tr key={noti.id} className="hover:bg-primary-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleDateString('vi-VN') : '---'}</span>
                                            <span className="text-[10px] text-slate-400">{noti.nguoi_tao_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="font-medium text-slate-800 line-clamp-2">{noti.noi_dung}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {noti.don_vi_thuc_hien?.slice(0, 2).map((u, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">
                                                    {u}
                                                </span>
                                            ))}
                                            {(noti.don_vi_thuc_hien?.length || 0) > 2 && (
                                                <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold rounded">
                                                    +{noti.don_vi_thuc_hien.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <span>{noti.ngay_bat_dau ? new Date(noti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}</span>
                                            <ChevronRight size={10} className="text-slate-300" />
                                            <span>{noti.ngay_ket_thuc ? new Date(noti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openDetail(noti)}
                                                className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(noti)}
                                                        className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(noti.id)}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
                {notifications.map((noti) => (
                    <div
                        key={noti.id}
                        onClick={() => openDetail(noti)}
                        className="bg-white border border-slate-200 rounded-3xl p-5 active:bg-slate-50 transition-all shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black border border-primary-200">
                                    {noti.nguoi_tao_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">{noti.nguoi_tao_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleString('vi-VN') : '---'}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed line-clamp-3 mb-4">{noti.noi_dung}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <Calendar size={14} className="text-primary-500" />
                                <span className="text-[10px] font-bold text-slate-500">{noti.ngay_bat_dau ? new Date(noti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'} - {noti.ngay_ket_thuc ? new Date(noti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal: Form (Create/Edit) */}
            {showFormModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                    <Bell size={24} />
                                </div>
                                {editingId ? 'Sửa thông báo' : 'Tạo thông báo mới'}
                            </h3>
                            <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nội dung thông báo *</label>
                                    <textarea
                                        required
                                        placeholder="Nhập nội dung thông báo chi tiết tại đây..."
                                        value={form.noi_dung}
                                        onChange={e => setForm(f => ({ ...f, noi_dung: e.target.value }))}
                                        className="w-full px-5 py-4 border-2 border-slate-100 rounded-[20px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 min-h-[120px] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ngày bắt đầu</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={form.ngay_bat_dau}
                                            onChange={e => setForm(f => ({ ...f, ngay_bat_dau: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        />
                                        <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ngày kết thúc</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={form.ngay_ket_thuc}
                                            onChange={e => setForm(f => ({ ...f, ngay_ket_thuc: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-3 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                        />
                                        <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Chọn đơn vị thực hiện</label>

                                    <div className="flex gap-2 mb-3">
                                        <select
                                            className="flex-1 px-4 py-3 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all bg-white"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val && !form.don_vi_thuc_hien.includes(val)) {
                                                    toggleUnit(val);
                                                }
                                                e.target.value = ""; // Reset select
                                            }}
                                        >
                                            <option value="">-- Chọn đơn vị để thêm --</option>
                                            {units.map(unit => (
                                                <option key={unit.id} value={unit.ten_don_vi || unit.ten}>{unit.ten_don_vi || unit.ten}</option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => setShowAddUnitModal(true)}
                                            className="px-4 py-3 bg-primary-100 text-primary-700 rounded-2xl font-bold hover:bg-primary-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Plus size={20} /> Thêm khác
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[60px]">
                                        {form.don_vi_thuc_hien.map((u, i) => (
                                            <span key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                                                {u}
                                                <button type="button" onClick={() => toggleUnit(u)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                        {form.don_vi_thuc_hien.length === 0 && <p className="text-xs text-slate-400 italic py-1">Chưa chọn đơn vị nào.</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Ghi chú</label>
                                    <input
                                        placeholder="Ghi chú thêm..."
                                        value={form.ghi_chu}
                                        onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))}
                                        className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">File đính kèm</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-primary-500 hover:text-primary-600 transition-all bg-slate-50/50"
                                        >
                                            {uploading ? <Loader className="animate-spin text-primary-600" size={18} /> : <Paperclip size={18} />}
                                            {form.file_dinh_kem ? 'Đã đính kèm file' : 'PDF / Hình ảnh'}
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-2xl hover:bg-primary-700 font-black shadow-xl shadow-primary-900/20 active:scale-95 transition-all">
                                    <Check size={24} /> {editingId ? 'Lưu thay đổi' : 'Đăng thông báo'}
                                </button>
                                <button type="button" onClick={resetForm} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Detail View & Actions */}
            {showDetailModal && selectedNoti && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 relative">
                            <button onClick={() => setShowDetailModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full shadow-sm transition-all border border-slate-100">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border border-slate-100">
                                    <div className="w-full h-full rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-xl">
                                        {selectedNoti.nguoi_tao_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-800">{selectedNoti.nguoi_tao_name}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedNoti.ngay_tao ? new Date(selectedNoti.ngay_tao).toLocaleString('vi-VN') : '---'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <FileText size={14} /> Nội dung chi tiết
                                </label>
                                <p className="text-base font-bold text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-3xl border border-slate-100 italic">
                                    "{selectedNoti.noi_dung}"
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày bắt đầu</p>
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Calendar size={14} className="text-primary-600" />
                                        {selectedNoti.ngay_bat_dau ? new Date(selectedNoti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày kết thúc</p>
                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <Calendar size={14} className="text-orange-500" />
                                        {selectedNoti.ngay_ket_thuc ? new Date(selectedNoti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <Users size={14} /> Đơn vị thực hiện
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedNoti.don_vi_thuc_hien?.map((u, i) => (
                                        <span key={i} className="px-3 py-1 bg-primary-50 text-primary-600 text-[11px] font-black rounded-full border border-primary-100">
                                            {u}
                                        </span>
                                    ))}
                                    {(!selectedNoti.don_vi_thuc_hien || selectedNoti.don_vi_thuc_hien.length === 0) && (
                                        <span className="text-xs text-slate-400 italic">Tất cả các đơn vị trong hệ thống.</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions with Icon + Text */}
                            <div className="pt-8 grid grid-cols-2 gap-3">
                                {isAdmin && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(selectedNoti)}
                                            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-950 transition-all shadow-lg active:scale-95"
                                        >
                                            <Edit2 size={18} />
                                            <span>Chỉnh sửa</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedNoti.id)}
                                            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 hover:text-red-700 transition-all active:scale-95 border border-red-100"
                                        >
                                            <Trash2 size={18} />
                                            <span>Xóa bỏ</span>
                                        </button>
                                    </>
                                )}
                                {selectedNoti.file_dinh_kem && (
                                    <a
                                        href={selectedNoti.file_dinh_kem}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="col-span-2 flex items-center justify-center gap-3 px-6 py-3.5 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/10 active:scale-95"
                                    >
                                        <Eye size={18} />
                                        <span>Xem công văn đính kèm</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Unit */}
            {showAddUnitModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800">Thêm đơn vị khác</h3>
                            <button onClick={() => setShowAddUnitModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tên đơn vị *</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nhập tên đơn vị..."
                                value={newUnit.ten_don_vi}
                                onChange={e => setNewUnit({ ...newUnit, ten_don_vi: e.target.value })}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveUnit();
                                    }
                                }}
                                className="w-full px-4 py-3 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
                            />
                        </div>
                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={handleSaveUnit}
                                className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 active:scale-95"
                            >
                                Thêm vào danh sách
                            </button>
                            <button
                                onClick={() => setShowAddUnitModal(false)}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
