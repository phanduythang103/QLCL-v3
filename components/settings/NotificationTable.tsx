import React, { useEffect, useState, useRef } from 'react';
import { fetchThongBao, addThongBao, updateThongBao, deleteThongBao, uploadCVFile, ThongBao } from '../../readThongBao';
import { fetchDmDonVi } from '../../readDmDonVi';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Trash2, Plus, X, Check, Paperclip, Loader, Calendar, Users, Info, Bell, Eye, ChevronRight } from 'lucide-react';

export default function NotificationTable() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<ThongBao[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        noi_dung: '',
        don_vi_thuc_hien: [] as string[],
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        ghi_chu: '',
        file_dinh_kem: ''
    });

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
        setShowForm(false);
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
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
            try {
                await deleteThongBao(id);
                setMessage('Đã xóa thành công!');
                loadData();
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

    if (loading) return <div className="text-center py-12"><Loader className="animate-spin mx-auto mb-2 text-primary-600" /> Đang tải dữ liệu...</div>;
    if (error) return <div className="text-center py-12 text-red-500">Lỗi: {error}</div>;

    return (
        <div className="space-y-6">
            {message && (
                <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl shadow-lg border animate-in slide-in-from-right duration-300 ${message.includes('Lỗi') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                    }`}>
                    {message}
                </div>
            )}

            {showForm && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <Bell className="text-primary-600" size={20} />
                            {editingId ? 'Sửa thông báo' : 'Tạo thông báo mới'}
                        </h4>
                        <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung thông báo *</label>
                                <textarea
                                    required
                                    placeholder="Nhập nội dung thông báo..."
                                    value={form.noi_dung}
                                    onChange={e => setForm(f => ({ ...f, noi_dung: e.target.value }))}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[100px]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ngày bắt đầu</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={form.ngay_bat_dau}
                                        onChange={e => setForm(f => ({ ...f, ngay_bat_dau: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ngày kết thúc</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={form.ngay_ket_thuc}
                                        onChange={e => setForm(f => ({ ...f, ngay_ket_thuc: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Đơn vị thực hiện (Chọn nhiều)</label>
                                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                                    {units.length > 0 ? units.map(unit => (
                                        <button
                                            key={unit.id}
                                            type="button"
                                            onClick={() => toggleUnit(unit.ten_don_vi || unit.ten)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${form.don_vi_thuc_hien.includes(unit.ten_don_vi || unit.ten)
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                                                }`}
                                        >
                                            {unit.ten_don_vi || unit.ten}
                                        </button>
                                    )) : <p className="text-xs text-slate-400 italic">Chưa có danh mục đơn vị</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ghi chú</label>
                                <input
                                    placeholder="Ghi chú thêm..."
                                    value={form.ghi_chu}
                                    onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Công văn đính kèm</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-all bg-slate-50/50"
                                    >
                                        {uploading ? <Loader className="animate-spin" size={18} /> : <Paperclip size={18} />}
                                        {form.file_dinh_kem ? 'Đã chọn file' : 'Tải lên PDF/Ảnh'}
                                    </button>
                                    {form.file_dinh_kem && (
                                        <a href={form.file_dinh_kem} target="_blank" rel="noreferrer" className="p-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors">
                                            <Eye size={20} />
                                        </a>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,image/*" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-900/20 transition-all">
                                <Check size={20} /> {editingId ? 'Cập nhật thông báo' : 'Lưu thông báo'}
                            </button>
                            <button type="button" onClick={resetForm} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!showForm && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Tổng số: <strong>{notifications.length}</strong> thông báo</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 font-bold transition-all shadow-md shadow-primary-900/10"
                    >
                        <Plus size={20} /> Tạo thông báo
                    </button>
                </div>
            )}

            {/* Notification Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {notifications.length === 0 ? (
                    <div className="lg:col-span-2 text-center py-20 bg-white rounded-3xl border border-slate-100 italic text-slate-400">
                        Chưa có thông báo nào được tạo.
                    </div>
                ) : (
                    notifications.map((noti) => (
                        <div key={noti.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary-300 transition-all hover:shadow-xl hover:shadow-slate-200/50 group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold border border-primary-100 shadow-sm">
                                        {noti.nguoi_tao_name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{noti.nguoi_tao_name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                            {noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleString('vi-VN') : 'Mới'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(noti)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Sửa"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(noti.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-slate-700 leading-relaxed font-medium line-clamp-3">{noti.noi_dung}</p>

                                <div className="flex flex-wrap gap-1.5">
                                    {noti.don_vi_thuc_hien?.map((u, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded border border-slate-100">
                                            {u}
                                        </span>
                                    ))}
                                    {(!noti.don_vi_thuc_hien || noti.don_vi_thuc_hien.length === 0) && (
                                        <span className="text-[10px] text-slate-400 italic">Tất cả đơn vị</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                        <Calendar size={14} className="text-primary-500" />
                                        <span>{noti.ngay_bat_dau ? new Date(noti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}</span>
                                        <ChevronRight size={10} />
                                        <span>{noti.ngay_ket_thuc ? new Date(noti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}</span>
                                    </div>
                                    {noti.file_dinh_kem && (
                                        <div className="flex justify-end">
                                            <a href={noti.file_dinh_kem} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-primary-600 hover:text-primary-700">
                                                <Paperclip size={14} /> Công văn kèm theo
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {noti.ghi_chu && (
                                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-700">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span>{noti.ghi_chu}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
