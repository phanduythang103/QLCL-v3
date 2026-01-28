import React, { useEffect, useState } from 'react';
import { fetchDmCapBac, addDmCapBac, updateDmCapBac, deleteDmCapBac } from '../../readDmCapBac';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';

export default function RankTable() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        ten_cap_bac: '',
        thu_tu: 0
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchDmCapBac();
            console.log('DmCapBac from Supabase:', data);
            setItems(data || []);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching dm_cap_bac:', err);
            setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setForm({ ten_cap_bac: '', thu_tu: 0 });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDmCapBac(editingId, form);
                setMessage('Cập nhật thành công!');
            } else {
                await addDmCapBac(form);
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
            ten_cap_bac: item.ten_cap_bac || '',
            thu_tu: item.thu_tu || 0
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa cấp bậc này?')) {
            try {
                await deleteDmCapBac(id);
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

            {showForm && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-slate-800">{editingId ? 'Sửa cấp bậc' : 'Thêm cấp bậc mới'}</h4>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                required
                                placeholder="Tên cấp bậc *"
                                value={form.ten_cap_bac}
                                onChange={e => setForm(f => ({ ...f, ten_cap_bac: e.target.value }))}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                            />
                            <input
                                type="number"
                                placeholder="Thứ tự"
                                value={form.thu_tu}
                                onChange={e => setForm(f => ({ ...f, thu_tu: parseInt(e.target.value) || 0 }))}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div className="flex gap-2">
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
                    <Plus size={16} /> Thêm cấp bậc
                </button>
            )}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-primary-600 text-white font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center">#</th>
                            <th className="px-4 py-3">Tên cấp bậc</th>
                            <th className="px-4 py-3 w-24 text-center">Thứ tự</th>
                            <th className="px-4 py-3 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu</td></tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                                    <td className="px-4 py-3 text-slate-700 font-medium">{item.ten_cap_bac}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">{item.thu_tu || '-'}</td>
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
    );
}
