import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { fetchCoQuanBanHanh, addCoQuanBanHanh, updateCoQuanBanHanh, deleteCoQuanBanHanh } from '../../readCoQuanBanHanh';

interface Authority {
    id: number;
    ten_co_quan: string;
    mo_ta?: string;
}

const AuthorityTable = () => {
    const [authorities, setAuthorities] = useState<Authority[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ten_co_quan: '', mo_ta: '' });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchCoQuanBanHanh();
            if (data) setAuthorities(data);
        } catch (err) {
            console.error('Error loading authorities:', err);
            setError('Không thể tải danh sách cơ quan ban hành.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (auth?: Authority) => {
        if (auth) {
            setEditingId(auth.id);
            setFormData({ ten_co_quan: auth.ten_co_quan, mo_ta: auth.mo_ta || '' });
        } else {
            setEditingId(null);
            setFormData({ ten_co_quan: '', mo_ta: '' });
        }
        setError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ ten_co_quan: '', mo_ta: '' });
        setEditingId(null);
        setError(null);
    };

    const handleSave = async () => {
        if (!formData.ten_co_quan.trim()) {
            setError('Tên cơ quan không được để trống.');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            if (editingId) {
                await updateCoQuanBanHanh(editingId, {
                    ten_co_quan: formData.ten_co_quan.trim(),
                    // mo_ta: formData.mo_ta.trim() // Disabled for now to be safe, uncomment if column exists
                });
            } else {
                await addCoQuanBanHanh({
                    ten_co_quan: formData.ten_co_quan.trim(),
                    // mo_ta: formData.mo_ta.trim() 
                });
            }

            await loadData();
            handleCloseModal();
        } catch (err: any) {
            console.error('Error saving authority:', err);
            const detailedError = err?.message || err?.error_description || JSON.stringify(err);
            const hint = err?.hint || err?.details || '';
            setError(`Lỗi: ${detailedError} ${hint ? `(${hint})` : ''}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa cơ quan này?')) return;

        try {
            await deleteCoQuanBanHanh(id);
            setAuthorities(authorities.filter(a => a.id !== id));
        } catch (err) {
            console.error('Error deleting authority:', err);
            alert('Không thể xóa cơ quan này. Có thể dữ liệu đang được sử dụng.');
        }
    };

    const filteredData = authorities.filter(a =>
        a.ten_co_quan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm cơ quan ban hành..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus size={16} /> Thêm mới
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-16 text-center">STT</th>
                                <th className="px-6 py-4">Tên cơ quan ban hành</th>
                                <th className="px-6 py-4 w-32 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">
                                        {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-center text-slate-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{item.ten_co_quan}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">{editingId ? 'Cập nhật cơ quan' : 'Thêm cơ quan mới'}</h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên cơ quan ban hành *</label>
                                <input
                                    type="text"
                                    value={formData.ten_co_quan}
                                    onChange={(e) => setFormData({ ...formData, ten_co_quan: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                    placeholder="Nhập tên cơ quan..."
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                {saving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorityTable;
