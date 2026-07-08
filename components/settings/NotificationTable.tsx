import React, { useEffect, useState, useRef } from 'react';
import { fetchThongBao, addThongBao, updateThongBao, deleteThongBao, uploadCVFile, ThongBao } from '../../readThongBao';
import { fetchDmDonVi, addDmDonVi } from '../../readDmDonVi';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
    Edit2, Trash2, Plus, X, Check, Paperclip, Loader,
    Calendar, Users, Info, Bell, Eye, ChevronRight, ArrowLeft,
    MoreHorizontal, Download, FileText, User, Table as TableIcon, CreditCard
} from 'lucide-react';

export default function NotificationTable() {
    const { user } = useAuth();
    const { canCreate, canUpdate, canDelete } = usePermissions();
    const [notifications, setNotifications] = useState<ThongBao[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const [selectedNoti, setSelectedNoti] = useState<ThongBao | null>(null);
    const [viewMode, setViewMode] = useState<'LIST' | 'DETAIL' | 'FORM'>('LIST');
    const [showAddUnitModal, setShowAddUnitModal] = useState(false);

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

    const canCreateNotification = canCreate('SETTINGS', 'NOTI');
    const canUpdateNotification = canUpdate('SETTINGS', 'NOTI');
    const canDeleteNotification = canDelete('SETTINGS', 'NOTI');

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
        setViewMode('LIST');
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
        if (editingId && !canUpdateNotification) {
            setMessage('Bạn không có quyền sửa thông báo.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (!editingId && !canCreateNotification) {
            setMessage('Bạn không có quyền tạo thông báo.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
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
        if (!canUpdateNotification) {
            setMessage('Bạn không có quyền sửa thông báo.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        setForm({
            noi_dung: noti.noi_dung || '',
            don_vi_thuc_hien: noti.don_vi_thuc_hien || [],
            ngay_bat_dau: noti.ngay_bat_dau || '',
            ngay_ket_thuc: noti.ngay_ket_thuc || '',
            ghi_chu: noti.ghi_chu || '',
            file_dinh_kem: noti.file_dinh_kem || ''
        });
        setEditingId(noti.id);
        setViewMode('FORM');
    };

    const handleDelete = async (id: string) => {
        if (!canDeleteNotification) {
            setMessage('Bạn không có quyền xóa thông báo.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
            try {
                await deleteThongBao(id);
                setMessage('Đã xóa thành công!');
                loadData();
                setViewMode('LIST');
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
        setViewMode('DETAIL');
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
                    <p className="text-title font-black text-black uppercase">Danh sách thông báo</p>
                </div>
                {canCreateNotification && (
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({ noi_dung: '', don_vi_thuc_hien: [], ngay_bat_dau: '', ngay_ket_thuc: '', ghi_chu: '', file_dinh_kem: '' });
                            setViewMode('FORM');
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#059669] text-white px-6 py-3 rounded-2xl hover:bg-[#0d6e39] text-input font-black uppercase transition-all shadow-xl shadow-green-900/20 active:scale-95"
                    >
                        <Plus size={20} />
                        Tạo thông báo
                    </button>
                )}
            </div>

            {/* Content View: Table (Desktop) */}
            <div className="hidden lg:block bg-white rounded-3xl border border-blue-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#059669] text-white uppercase text-[12px] tracking-widest h-10">
                        <tr>
                            <th className="px-6 py-3 border border-blue-200">Ngày tạo</th>
                            <th className="px-6 py-3 border border-blue-200">Nội dung</th>
                            <th className="px-6 py-3 border border-blue-200">Thời gian</th>
                            <th className="px-6 py-3 border border-blue-200 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50 text-[13px]">
                        {notifications.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic border border-blue-100">Chưa có thông báo nào.</td>
                            </tr>
                        ) : (
                            notifications.map((noti) => (
                                <tr key={noti.id} className="hover:bg-primary-50/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap border border-blue-100">
                                        <div className="flex flex-col">
                                            <span className="font-black text-black uppercase">{noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleDateString('vi-VN') : '---'}</span>
                                            <span className="font-bold text-black/40 uppercase tracking-tighter">{noti.nguoi_tao_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border border-blue-100">
                                        <div className="max-w-md">
                                            <p className="text-black font-medium leading-relaxed">{noti.noi_dung}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {noti.don_vi_thuc_hien?.slice(0, 3).map((u, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">
                                                        {u}
                                                    </span>
                                                ))}
                                                {(noti.don_vi_thuc_hien?.length || 0) > 3 && (
                                                    <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-bold rounded">
                                                        +{noti.don_vi_thuc_hien.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap border border-blue-100 italic">
                                        <div className="flex flex-col gap-0.5 text-black/60">
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <span className="text-[10px] uppercase text-primary-600">Từ</span>
                                                <span>{noti.ngay_bat_dau ? new Date(noti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <span className="text-[10px] uppercase text-orange-500">Đến</span>
                                                <span>{noti.ngay_ket_thuc ? new Date(noti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center border border-blue-100">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openDetail(noti)}
                                                className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {(canUpdateNotification || canDeleteNotification) && (
                                                <>
                                                    {canUpdateNotification && (
                                                    <button
                                                        onClick={() => handleEdit(noti)}
                                                        className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    )}
                                                    {canDeleteNotification && (
                                                    <button
                                                        onClick={() => handleDelete(noti.id)}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    )}
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
                                    <p className="text-label font-black text-black uppercase">{noti.nguoi_tao_name}</p>
                                    <p className="text-table text-black/40 font-black uppercase">{noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleString('vi-VN') : '---'}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[13px] text-black leading-relaxed line-clamp-3 mb-4">{noti.noi_dung}</p>
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

            {viewMode === 'FORM' && (
                <div className="fixed inset-0 z-[110] bg-white animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto p-4 lg:p-12 mb-20">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <button onClick={resetForm} className="flex items-center gap-2 text-slate-400 hover:text-primary-600 transition-colors font-black uppercase text-[11px] tracking-widest mb-4 group">
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    Quay lại danh sách
                                </button>
                                <h3 className="text-3xl font-black text-black uppercase flex items-center gap-3">
                                    <div className="p-3 bg-green-50 text-[#059669] rounded-2xl">
                                        <Bell size={32} />
                                    </div>
                                    {editingId ? 'Sửa thông báo' : 'Tạo thông báo mới'}
                                </h3>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-[40px] border border-slate-100 p-8 lg:p-12 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2">
                                    <label className="block text-label font-bold text-black uppercase mb-3">Nội dung thông báo *</label>
                                    <textarea
                                        required
                                        placeholder="Nhập nội dung thông báo chi tiết tại đây..."
                                        value={form.noi_dung}
                                        onChange={e => setForm(f => ({ ...f, noi_dung: e.target.value }))}
                                        className="w-full px-6 py-5 border-2 border-slate-100 rounded-[24px] text-input font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 min-h-[160px] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-label font-bold text-black uppercase mb-3">Ngày bắt đầu</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={form.ngay_bat_dau}
                                            onChange={e => setForm(f => ({ ...f, ngay_bat_dau: e.target.value }))}
                                            className="w-full pl-14 pr-6 py-4 border-2 border-slate-100 rounded-2xl text-input font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white"
                                        />
                                        <Calendar className="absolute left-5 top-4.5 text-black/40" size={20} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-label font-bold text-black uppercase mb-3">Ngày kết thúc</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={form.ngay_ket_thuc}
                                            onChange={e => setForm(f => ({ ...f, ngay_ket_thuc: e.target.value }))}
                                            className="w-full pl-14 pr-6 py-4 border-2 border-slate-100 rounded-2xl text-input font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white"
                                        />
                                        <Calendar className="absolute left-5 top-4.5 text-black/40" size={20} />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-label font-bold text-black uppercase mb-3">Chọn đơn vị thực hiện</label>
                                    <div className="flex gap-3 mb-4">
                                        <select
                                            className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl text-input font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all bg-white"
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
                                            className="px-6 py-4 bg-green-100 text-[#059669] rounded-2xl text-input font-black uppercase hover:bg-green-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <Plus size={20} /> Thêm khác
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 p-6 bg-slate-50 rounded-[24px] border border-slate-100 min-h-[80px]">
                                        {form.don_vi_thuc_hien.map((u, i) => (
                                            <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
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
                                    <label className="block text-label font-bold text-black uppercase mb-3">Ghi chú</label>
                                    <input
                                        placeholder="Ghi chú thêm..."
                                        value={form.ghi_chu}
                                        onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))}
                                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl text-input font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-label font-bold text-black uppercase mb-3">File đính kèm</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-bold text-slate-400 hover:border-primary-500 hover:text-primary-600 transition-all bg-slate-50/50"
                                        >
                                            {uploading ? <Loader className="animate-spin text-primary-600" size={18} /> : <Paperclip size={20} />}
                                            {form.file_dinh_kem ? 'Đã đính kèm file' : 'Tải lên PDF / Hình ảnh'}
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-8 border-t border-slate-100">
                                <button type="submit" className="flex-1 flex items-center justify-center gap-3 bg-[#059669] text-white px-8 py-5 rounded-2xl hover:bg-[#0d6e39] text-input font-black uppercase shadow-xl shadow-green-900/20 active:scale-95 transition-all">
                                    <Check size={24} /> {editingId ? 'Lưu thay đổi' : 'Đăng thông báo'}
                                </button>
                                <button type="button" onClick={resetForm} className="px-10 py-5 bg-slate-100 text-black rounded-2xl text-input font-black uppercase hover:bg-slate-200 transition-all">
                                    Quay lại
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewMode === 'DETAIL' && selectedNoti && (
                <div className="fixed inset-0 z-[110] bg-white animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto p-4 lg:p-12 mb-20">
                        <div className="p-8 lg:p-12 border-b border-slate-50 bg-slate-50/50 relative rounded-[40px] mb-8 shadow-sm overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-400 hover:text-primary-600 transition-colors font-black uppercase text-[11px] tracking-widest mb-6 relative group">
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Quay lại danh sách
                            </button>

                            <div className="flex items-center gap-6 relative">
                                <div className="w-20 h-20 rounded-3xl bg-white p-1.5 shadow-xl border border-slate-100">
                                    <div className="w-full h-full rounded-2xl bg-[#059669] flex items-center justify-center text-white font-black text-3xl">
                                        {selectedNoti.nguoi_tao_name?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-2xl font-black text-black uppercase tracking-tight mb-1">{selectedNoti.nguoi_tao_name}</p>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                            <Calendar size={12} className="text-primary-500" />
                                            {selectedNoti.ngay_tao ? new Date(selectedNoti.ngay_tao).toLocaleString('vi-VN') : '---'}
                                        </div>
                                        <div className="flex items-center gap-2 font-black uppercase text-[11px] tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                            <Bell size={12} className="text-orange-500" />
                                            Thông báo từ Hệ thống
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-12 px-2">
                            <div className="space-y-6">
                                <label className="flex items-center gap-2 text-[12px] font-black text-black/40 uppercase tracking-[0.3em]">
                                    <FileText size={16} /> Nội dung thông báo
                                </label>
                                <div className="bg-blue-50/20 p-8 lg:p-12 rounded-[48px] border border-blue-100/50 shadow-inner">
                                    <p className="text-lg lg:text-xl font-medium text-slate-800 leading-relaxed text-justify">
                                        {selectedNoti.noi_dung}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Thời gian bắt đầu</p>
                                    <p className="text-xl font-black text-slate-800 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#059669]">
                                          <Calendar size={20} />
                                        </div>
                                        {selectedNoti.ngay_bat_dau ? new Date(selectedNoti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}
                                    </p>
                                </div>
                                <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Thời gian kết thúc</p>
                                    <p className="text-xl font-black text-slate-800 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                          <Calendar size={20} />
                                        </div>
                                        {selectedNoti.ngay_ket_thuc ? new Date(selectedNoti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="flex items-center gap-2 text-[12px] font-black text-black/40 uppercase tracking-[0.3em]">
                                    <Users size={16} /> Đối tượng áp dụng
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {selectedNoti.don_vi_thuc_hien?.map((u, i) => (
                                        <span key={i} className="px-6 py-3 bg-white text-slate-700 text-[14px] font-bold rounded-2xl border border-slate-200 shadow-sm hover:border-primary-500 transition-colors cursor-default">
                                            {u}
                                        </span>
                                    ))}
                                    {(!selectedNoti.don_vi_thuc_hien || selectedNoti.don_vi_thuc_hien.length === 0) && (
                                        <span className="text-sm text-slate-400 italic font-medium bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">Toàn bộ các khoa, phòng, đơn vị trực thuộc Bệnh viện.</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-12 flex flex-col sm:flex-row gap-6 border-t border-slate-100">
                                <button onClick={() => setViewMode('LIST')} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-slate-100 text-slate-600 rounded-3xl text-[14px] font-black uppercase hover:bg-slate-200 transition-all active:scale-95">
                                    <ArrowLeft size={20} />
                                    <span>Quay lại danh sách</span>
                                </button>
                                {canUpdateNotification && (
                                    <button
                                        onClick={() => handleEdit(selectedNoti)}
                                        className="flex-1 flex items-center justify-center gap-3 px-10 py-5 bg-slate-800 text-white rounded-3xl text-[14px] font-black uppercase hover:bg-black transition-all shadow-xl active:scale-95"
                                    >
                                        <Edit2 size={20} />
                                        <span>Chỉnh sửa thông báo</span>
                                    </button>
                                )}
                                {selectedNoti.file_dinh_kem && (
                                    <a
                                        href={selectedNoti.file_dinh_kem}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-[1.5] flex items-center justify-center gap-3 px-10 py-5 bg-[#059669] text-white rounded-3xl text-[14px] font-black uppercase hover:bg-[#0d6e39] transition-all shadow-xl shadow-green-900/20 active:scale-95"
                                    >
                                        <Eye size={24} />
                                        <span>Xem file công văn (PDF)</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add Unit */}
            {showAddUnitModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 font-bold">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-black uppercase tracking-tight">Thêm đơn vị khác</h3>
                            <button onClick={() => setShowAddUnitModal(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8">
                            <label className="block text-label font-bold text-black uppercase mb-3">Tên đơn vị *</label>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nhập tên đơn vị chính xác..."
                                value={newUnit.ten_don_vi}
                                onChange={e => setNewUnit({ ...newUnit, ten_don_vi: e.target.value })}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSaveUnit();
                                    }
                                }}
                                className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl text-input font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 bg-white"
                            />
                        </div>
                        <div className="p-8 border-t border-slate-100 flex gap-4">
                            <button
                                onClick={handleSaveUnit}
                                className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/20 active:scale-95"
                            >
                                Xác nhận thêm
                            </button>
                            <button
                                onClick={() => setShowAddUnitModal(false)}
                                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all"
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
