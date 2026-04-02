import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Search, Filter, Calendar, MapPin, Clock,
    Trash2, Edit2, Download, CheckCircle2, AlertCircle, Loader2,
    ChevronRight, ArrowLeft, Eye
} from 'lucide-react';
import { fetchBcCqy, addBcCqy, updateBcCqy, deleteBcCqy } from '../readBcCqy';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import { BcCqy } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
export default function BcCqyList() {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
    const uDept = user?.department?.trim().toLowerCase() || '';
    const [items, setItems] = useState<BcCqy[]>([]);
    const [depts, setDepts] = useState<DmDonVi[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'VIEW'>('LIST');
    const [editingItem, setEditingItem] = useState<BcCqy | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formData, setFormData] = useState<Omit<BcCqy, 'id' | 'created_at'>>({
        ngay_bao_cao: new Date().toISOString().split('T')[0],
        noi_dung_bao_cao: '',
        noi_xay_ra: '',
        thoi_gian_xay_ra: '',
        noi_dung_ket_luan: ''
    });

    const loadItems = async () => {
        setLoading(true);
        try {
            const [reportsData, deptsData] = await Promise.all([
                fetchBcCqy(),
                fetchDmDonVi()
            ]);
            setItems(reportsData);
            setDepts(deptsData || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem?.id) {
                await updateBcCqy(editingItem.id, formData);
            } else {
                await addBcCqy(formData);
            }
            setViewMode('LIST');
            setEditingItem(null);
            setFormData({
                ngay_bao_cao: new Date().toISOString().split('T')[0],
                noi_dung_bao_cao: '',
                noi_xay_ra: '',
                thoi_gian_xay_ra: '',
                noi_dung_ket_luan: ''
            });
            loadItems();
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleEdit = (item: BcCqy) => {
        setEditingItem(item);
        setFormData({
            ngay_bao_cao: item.ngay_bao_cao,
            noi_dung_bao_cao: item.noi_dung_bao_cao,
            noi_xay_ra: item.noi_xay_ra,
            thoi_gian_xay_ra: item.thoi_gian_xay_ra,
            noi_dung_ket_luan: item.noi_dung_ket_luan
        });
        setViewMode('FORM');
    };

    const handleDelete = (id: string) => {
        setTargetDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!targetDeleteId) return;
        setIsDeleting(true);
        try {
            await deleteBcCqy(targetDeleteId);
            loadItems();
            setIsDeleteModalOpen(false);
            setTargetDeleteId(null);
            if (viewMode === 'VIEW') setViewMode('LIST');
        } catch (err: any) {
            alert('Lỗi: ' + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExportWord = (item: BcCqy) => {
        const timeMatch = item.thoi_gian_xay_ra.match(/(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
        const hour = timeMatch ? timeMatch[1] : '...';
        const minute = timeMatch ? timeMatch[2] : '...';
        const day = timeMatch ? timeMatch[3] : '...';
        const month = timeMatch ? timeMatch[4] : '...';
        const year = timeMatch ? timeMatch[5] : '...';

        const now = new Date();
        const curDay = String(now.getDate()).padStart(2, '0');
        const curMonth = String(now.getMonth() + 1).padStart(2, '0');
        const curYear = now.getFullYear();

        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <style>
                    @page {
                        size: 21cm 29.7cm;
                        margin: 2cm 2cm 2cm 2.5cm;
                        mso-page-orientation: portrait;
                    }
                    body {
                        font-family: "Times New Roman", Times, serif;
                        font-size: 14pt;
                        color: #000;
                        line-height: 1.5;
                    }
                    .header-table { width: 100%; border: none; margin-bottom: 30pt; }
                    .header-table td { border: none; padding: 0; vertical-align: top; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .uppercase { text-transform: uppercase; }
                    .title { font-size: 16pt; font-weight: bold; text-align: center; margin-top: 20pt; margin-bottom: 5pt; }
                    .subject { text-align: center; font-weight: bold; margin-bottom: 25pt; }
                    .body-text { text-align: justify; text-indent: 1cm; margin-bottom: 15pt; }
                    .footer-table { width: 100%; border: none; margin-top: 40pt; }
                    .footer-table td { border: none; padding: 0; vertical-align: top; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td style="width: 45%; text-align: center;">
                            HỌC VIỆN QUÂN Y<br/>
                            <span class="font-bold" style="text-decoration: underline;">BỆNH VIỆN QUÂN Y 103</span>
                        </td>
                        <td style="width: 55%; text-align: center;">
                            <span class="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
                            <span class="font-bold" style="text-decoration: underline;">Độc lập – Tự do – Hạnh phúc</span>
                        </td>
                    </tr>
                </table>

                <div class="title uppercase">BÁO CÁO</div>
                <div class="subject">Về việc ${item.noi_dung_bao_cao.toLowerCase()}</div>

                <div style="margin-bottom: 20pt;">Kính gửi : Cục Quân y.</div>

                <div class="body-text">
                    Bệnh viện Quân y 103, Học viện Quân y xin báo cáo Cục Quân y về việc: ${item.noi_dung_bao_cao.toLowerCase()} xảy ra tại ${item.noi_xay_ra} – Bệnh viện Quân y 103 vào thời gian ${hour} giờ ${minute} phút ngày ${day} tháng ${month} năm ${year}.
                </div>

                <div class="body-text">
                    Bệnh viện Quân y 103 đã thực hiện theo đúng Thông tư 43/2018/TT-BYT ngày 26/12/2018 về việc hướng dẫn phòng ngừa sự cố y khoa trong các cơ sở khám bệnh, chữa bệnh của Bộ Y tế và theo quy trình quản lý sự cố y khoa đã được thông qua Hội đồng Quản lý chất lượng Bệnh viện – Bệnh viện Quân y 103. Sau khi tiến hành tổ chức xác minh, phân tích nhanh đưa ra nguyên nhân chính dẫn đến xảy ra sự việc. Bệnh viện Quân y 103 xin đưa ra kết luận như sau:
                </div>

                <div class="body-text" style="min-height: 100pt;">
                    ${item.noi_dung_ket_luan || '..............................................................................................................................................................................................................................................................................................'}
                </div>

                <div class="body-text">
                    Trên đây là báo cáo nhanh của Bệnh viện Quân y 103 về sự việc nêu trên. 
                </div>
                <div class="body-text">
                    Kính mong nhận được chỉ thị từ Thủ trưởng Cục Quân y./.
                </div>

                <table class="footer-table">
                    <tr>
                        <td style="width: 50%;">
                            <span class="font-bold italic">Nơi nhận:</span><br/>
                            - Như trên;<br/>
                            - Lưu: (Đơn vị soạn thảo)
                        </td>
                        <td style="width: 50%; text-align: center;">
                            <span class="italic">Hà Nội, ngày ${curDay} tháng ${curMonth} năm ${curYear}</span><br/>
                            <span class="font-bold">GIÁM ĐỐC</span><br/>
                            <span style="font-size: 10pt;">(Ký và ghi rõ họ tên)</span>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bao_cao_Cuc_Quan_y_${item.id?.slice(0, 8)}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.noi_dung_bao_cao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             item.noi_xay_ra.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (isAdmin || !uDept) return matchesSearch;
        
        const iDept = (item.noi_xay_ra || '').trim().toLowerCase();
        const matchesUnit = iDept !== '' && (uDept === iDept || iDept.includes(uDept) || uDept.includes(iDept));
        return matchesSearch && matchesUnit;
    });

    if (viewMode === 'FORM') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium transition-colors">
                        <ArrowLeft size={18} /> Quay lại danh sách
                    </button>
                    <h2 className="font-bold text-slate-800">{editingItem ? 'Cập nhật báo cáo' : 'Thêm báo cáo mới'}</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Ngày báo cáo</label>
                            <input
                                type="date"
                                required
                                value={formData.ngay_bao_cao}
                                onChange={e => setFormData({ ...formData, ngay_bao_cao: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-[14pt]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Thời gian xảy ra (hh:mm dd/mm/yyyy)</label>
                            <input
                                type="text"
                                placeholder="hh:mm dd/mm/yyyy (VD: 10:30 20/03/2024)"
                                value={formData.thoi_gian_xay_ra}
                                onChange={e => setFormData({ ...formData, thoi_gian_xay_ra: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-[14pt]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nơi xảy ra (Gợi ý từ danh sách khoa/phòng hoặc nhập mới)</label>
                        <input
                            type="text"
                            list="dept-suggestions"
                            placeholder="Nhập hoặc chọn địa điểm xảy ra..."
                            value={formData.noi_xay_ra}
                            onChange={e => setFormData({ ...formData, noi_xay_ra: e.target.value })}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-[14pt]"
                        />
                        <datalist id="dept-suggestions">
                            {depts.map(d => (
                                <option key={d.id} value={d.ten_don_vi}>
                                    {d.ma_don_vi} - {d.ten_don_vi}
                                </option>
                            ))}
                        </datalist>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nội dung báo cáo</label>
                        <textarea
                            rows={4}
                            required
                            placeholder="Mô tả nội dung báo cáo..."
                            value={formData.noi_dung_bao_cao}
                            onChange={e => setFormData({ ...formData, noi_dung_bao_cao: e.target.value })}
                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-[14pt]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nội dung kết luận</label>
                        <textarea
                            rows={4}
                            placeholder="Nhập kết luận..."
                            value={formData.noi_dung_ket_luan}
                            onChange={e => setFormData({ ...formData, noi_dung_ket_luan: e.target.value })}
                            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none text-[14pt]"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setViewMode('LIST')}
                            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-8 py-2.5 bg-[#009900] text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 size={20} />
                            {editingItem ? 'Lưu cập nhật' : 'Gửi báo cáo'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    if (viewMode === 'VIEW' && editingItem) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <button onClick={() => setViewMode('LIST')} className="flex items-center gap-2 text-slate-600 hover:text-primary-600 font-medium transition-colors">
                        <ArrowLeft size={18} /> Quay lại danh sách
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExportWord(editingItem)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                        >
                            <Download size={18} /> Xuất Word
                        </button>
                        <button
                            onClick={() => handleEdit(editingItem)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                        >
                            <Edit2 size={18} /> Sửa
                        </button>
                        <button
                            onClick={() => handleDelete(editingItem.id!)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={18} /> Xóa
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-10" style={{ fontFamily: 'Times New Roman, serif', fontSize: '14pt', color: '#1e293b' }}>
                    <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 mb-8">
                        <h1 className="text-2xl font-bold uppercase tracking-tight">BÁO CÁO CỤC QUÂN Y</h1>
                        <p className="italic text-slate-500">Mã báo cáo: {editingItem.id?.slice(0, 8).toUpperCase()}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                            <span className="font-bold text-slate-900 border-b border-slate-200 block pb-1">Ngày báo cáo</span>
                            <p className="">{editingItem.ngay_bao_cao ? new Date(editingItem.ngay_bao_cao).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        </div>
                        <div className="space-y-2">
                            <span className="font-bold text-slate-900 border-b border-slate-200 block pb-1">Thời gian xảy ra</span>
                            <p className="">{editingItem.thoi_gian_xay_ra || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="font-bold text-slate-900 border-b border-slate-200 block pb-1">Nơi xảy ra</span>
                        <p className="leading-relaxed">{editingItem.noi_xay_ra}</p>
                    </div>

                    <div className="space-y-3">
                        <span className="font-bold text-slate-900 border-b border-slate-200 block pb-1">Nội dung báo cáo</span>
                        <div className="leading-relaxed whitespace-pre-wrap min-h-[100px]">
                            {editingItem.noi_dung_bao_cao}
                        </div>
                    </div>

                    <div className="space-y-3 p-6 bg-green-50/50 rounded-xl border border-green-100 italic">
                        <span className="font-bold text-green-900 block pb-1">Nội dung kết luận</span>
                        <div className="leading-relaxed whitespace-pre-wrap">
                            {editingItem.noi_dung_ket_luan || 'Chưa có kết luận.'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm báo cáo..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { setEditingItem(null); setViewMode('FORM'); }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-[#009900] text-white rounded-lg font-bold shadow-sm hover:bg-green-700 transition-all"
                >
                    <Plus size={20} /> Thêm báo cáo
                </button>
            </div>

            {/* List content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="table-standardized">
                        <thead>
                            <tr>
                                <th className="text-left">Ngày báo cáo</th>
                                <th className="text-left">Nội dung báo cáo</th>
                                <th className="text-left">Nơi xảy ra</th>
                                <th className="text-left">Thời gian</th>
                                <th className="text-left">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin w-8 h-8 text-primary-500 mx-auto mb-2" />
                                        <span className="text-slate-500">Đang tải dữ liệu...</span>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Chưa có dữ liệu báo cáo nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const iDept = (item.noi_xay_ra || '').trim().toLowerCase();
                                    const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept || iDept.includes(uDept) || uDept.includes(iDept)));

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                                                {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                                {item.noi_dung_bao_cao}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.noi_xay_ra}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.thoi_gian_xay_ra}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleExportWord(item)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-bold text-sm border border-blue-100"
                                                    >
                                                        <Download size={16} /> Xuất Word
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingItem(item); setViewMode('VIEW'); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-bold text-sm border border-emerald-100"
                                                    >
                                                        <Eye size={16} /> Xem
                                                    </button>
                                                    {isOwnUnit && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold text-sm border border-blue-100"
                                                            >
                                                                <Edit2 size={16} /> Sửa
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id!)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold text-sm border border-red-100"
                                                            >
                                                                <Trash2 size={16} /> Xóa
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredItems.map(item => {
                        const iDept = (item.noi_xay_ra || '').trim().toLowerCase();
                        const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept || iDept.includes(uDept) || uDept.includes(iDept)));

                        return (
                            <div key={item.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                        {item.ngay_bao_cao ? new Date(item.ngay_bao_cao).toLocaleDateString('vi-VN') : 'N/A'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleExportWord(item)}
                                            className="flex items-center gap-1 px-2 py-1 text-blue-600 bg-blue-50 rounded text-xs font-bold"
                                        >
                                            <Download size={14} /> Xuất
                                        </button>
                                        <button
                                            onClick={() => { setEditingItem(item); setViewMode('VIEW'); }}
                                            className="flex items-center gap-1 px-2 py-1 text-emerald-600 bg-emerald-50 rounded text-xs font-bold"
                                        >
                                            <Eye size={14} /> Xem
                                        </button>
                                        {isOwnUnit && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="flex items-center gap-1 px-2 py-1 text-blue-600 bg-blue-50 rounded text-xs font-bold"
                                                >
                                                    <Edit2 size={14} /> Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id!)}
                                                    className="flex items-center gap-1 px-2 py-1 text-red-600 bg-red-50 rounded text-xs font-bold"
                                                >
                                                    <Trash2 size={14} /> Xóa
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-slate-800 line-clamp-2">{item.noi_dung_bao_cao}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {item.noi_xay_ra}</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> {item.thoi_gian_xay_ra}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDelete}
            title="Xác nhận xóa báo cáo"
            message="Bạn có chắc chắn muốn xóa báo cáo Cục Quân y này không? Thao tác này không thể hoàn tác."
            isLoading={isDeleting}
        />
    </div>
);
}
