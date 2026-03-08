import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Search, Calendar, Edit2, Trash2, Printer,
    Download, ArrowLeft, Save, X, User, Users, MapPin, Clock, Copy, Mail, Eye, CheckCircle, Loader2
} from 'lucide-react';
import {
    BienBanXacMinh, ThanhVienDoan, NguoiThamDu,
    fetchBienBanXacMinh, addBienBanXacMinh, updateBienBanXacMinh, deleteBienBanXacMinh
} from '../readBienBanXacMinh';
import { fetchBaoCaoScyk, BaoCaoScyk } from '../readBaoCaoScyk';
import { fetchNhanSuQlcl, NhanSuQlcl } from '../readNhanSuQlcl';
import { useAuth } from '../contexts/AuthContext';
import { exportBienBanToPdf } from '../utils/generateBienBanPdf';

const SuggestionInput = ({ value, onChange, onSelect, list, placeholder }: {
    value: string,
    onChange: (val: string) => void,
    onSelect: (item: NhanSuQlcl) => void,
    list: NhanSuQlcl[],
    placeholder?: string
}) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative w-full">
            <input
                type="text"
                className="w-full text-input font-bold border-b border-slate-200 focus:border-[#009900] outline-none pb-1 bg-transparent"
                value={value}
                onChange={(e) => { onChange(e.target.value); setShow(true); }}
                onFocus={() => setShow(true)}
                onBlur={() => setTimeout(() => setShow(false), 200)}
                placeholder={placeholder}
            />
            {show && value.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1">
                    {list.filter(item => item.ho_ten.toLowerCase().includes(value.toLowerCase())).map(item => (
                        <div
                            key={item.id}
                            className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-xs"
                            onClick={() => onSelect(item)}
                        >
                            <div className="font-black text-black uppercase text-table">{item.ho_ten}</div>
                            <div className="text-black/40 uppercase text-[10px] font-bold">{item.chuc_vu} - {item.don_vi}</div>
                        </div>
                    ))}
                    {list.filter(item => item.ho_ten.toLowerCase().includes(value.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-slate-400 text-xs italic">Không tìm thấy (Nhập mới)</div>
                    )}
                </div>
            )}
        </div>
    );
};

const VerificationMinutes = () => {
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');
    const uDept = user?.department?.trim().toLowerCase() || '';
    const [items, setItems] = useState<BienBanXacMinh[]>([]);
    const [incidents, setIncidents] = useState<BaoCaoScyk[]>([]);
    const [personnel, setPersonnel] = useState<NhanSuQlcl[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'PRINT' | 'VIEW'>('LIST');
    const [editingItem, setEditingItem] = useState<BienBanXacMinh | null>(null);
    const [viewingItem, setViewingItem] = useState<BienBanXacMinh | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [exportResult, setExportResult] = useState<{ success: boolean; message: string; fileUrl?: string } | null>(null);

    // Form State
    const initialForm: Partial<BienBanXacMinh> = {
        thoi_gian_bat_dau: new Date().toISOString().slice(0, 16), // datetime-local format
        dia_diem: '',
        thanh_phan: [
            { ho_ten: '', chuc_vu: '', don_vi: '', vai_tro: 'CHU_TRI' },
            { ho_ten: '', chuc_vu: '', don_vi: '', vai_tro: 'THU_KY' }
        ],
        nguoi_tham_du: [],
        noi_dung_xac_minh: '',
        ket_qua_xac_minh: '',
        y_kien_tham_gia: ''
    };

    const [formData, setFormData] = useState<Partial<BienBanXacMinh>>(initialForm);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [minutesData, incidentData, personnelData] = await Promise.all([
                fetchBienBanXacMinh(),
                fetchBaoCaoScyk(),
                fetchNhanSuQlcl()
            ]);
            setItems(minutesData);
            setIncidents(incidentData);
            setPersonnel(personnelData);
        } catch (error) {
            console.error(error);
            // Fallback or empty
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            ...initialForm,
            thanh_phan: [
                { ho_ten: user?.full_name || '', chuc_vu: '', don_vi: '', vai_tro: 'CHU_TRI' },
                { ho_ten: '', chuc_vu: '', don_vi: '', vai_tro: 'THANH_VIEN' },
                { ho_ten: '', chuc_vu: '', don_vi: '', vai_tro: 'NGUOI_CHUNG_KIEN' }
            ]
        });
        setViewMode('FORM');
    };

    const handleView = (item: BienBanXacMinh) => {
        setViewingItem(item);
        setViewMode('VIEW');
    };

    const handleEdit = (item: BienBanXacMinh) => {
        setEditingItem(item);
        // Ensure arrays exist
        const safeItem = {
            ...item,
            thanh_phan: Array.isArray(item.thanh_phan) ? item.thanh_phan : [],
            nguoi_tham_du: Array.isArray(item.nguoi_tham_du) ? item.nguoi_tham_du : []
        };

        // Convert 'Hồi ...' text to datetime input format if possible, otherwise use current
        // Note: If we saved as text, we might need a parser. 
        // For simplicity, let's assume we store ISO string or handle text manually.
        // If strict match to UI "Hồi HH:mm ngày...", we might store formatted string. 
        // But for DB, ISO is better. Let's assume input text for now to match user expectation of "Text".

        setFormData(safeItem);
        setViewMode('FORM');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa biên bản này?')) {
            try {
                await deleteBienBanXacMinh(id);
                loadData();
            } catch (e: any) {
                alert('Lỗi khi xóa: ' + e.message);
            }
        }
    };

    const handleSave = async () => {
        try {
            // Remove UI-only fields before saving
            const { ma_baocao_scyk, ...payload } = formData as any;

            if (editingItem && editingItem.id) {
                await updateBienBanXacMinh(editingItem.id, payload);
            } else {
                await addBienBanXacMinh(payload);
            }
            loadData();
            setViewMode('LIST');
        } catch (e: any) {
            alert('Lỗi lưu dữ liệu: ' + e.message);
        }
    };

    const handleExportPdf = async (item: BienBanXacMinh) => {
        const linkedInc = incidents.find(inc => inc.id === item.scyk_id);
        setExportLoading(true);
        setExportResult(null);
        try {
            const { fileUrl, fileName } = await exportBienBanToPdf({
                ...item,
                ma_baocao_scyk: linkedInc?.so_bc_ma_scyk || item.scyk_id || '',
            });

            // Cập nhật state items ngay (không cần reload trang)
            setItems(prev => prev.map(i =>
                i.id === item.id ? { ...i, file_url: fileUrl, file_name: fileName } : i
            ));
            // Cập nhật viewingItem nếu đang xem chi tiết
            if (viewingItem?.id === item.id) {
                setViewingItem(prev => prev ? { ...prev, file_url: fileUrl, file_name: fileName } : prev);
            }

            // Lưu vào DB (silent)
            if (item.id) {
                updateBienBanXacMinh(item.id, { file_url: fileUrl, file_name: fileName } as any).catch(() => { });
            }

            setExportResult({ success: true, message: `File "${fileName}" đã được lưu thành công.`, fileUrl });
            setTimeout(() => setExportResult(null), 8000);
        } catch (err: any) {
            setExportResult({
                success: false,
                message: `Xuất PDF thất bại: ${err.message}. (Kiểm tra bucket 'scyk' đã được tạo trong Supabase chưa?)`,
            });
            setTimeout(() => setExportResult(null), 8000);
        } finally {
            setExportLoading(false);
        }
    };


    const handlePrint = (item: BienBanXacMinh) => {
        setEditingItem(item); // Set context for print
        setViewMode('PRINT');
        setTimeout(() => {
            window.print();
        }, 500);
    };

    // --- Form Helper ---
    const updateMember = (index: number, field: keyof ThanhVienDoan, value: string) => {
        const newMembers = [...(formData.thanh_phan || [])];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setFormData({ ...formData, thanh_phan: newMembers });
    };

    const addMember = () => {
        setFormData({
            ...formData,
            thanh_phan: [...(formData.thanh_phan || []), { ho_ten: '', chuc_vu: '', don_vi: '', vai_tro: 'THANH_VIEN' }]
        });
    };

    const removeMember = (index: number) => {
        const newMembers = [...(formData.thanh_phan || [])];
        newMembers.splice(index, 1);
        setFormData({ ...formData, thanh_phan: newMembers });
    };

    const updateAttendee = (index: number, field: keyof NguoiThamDu, value: string) => {
        const newAttendees = [...(formData.nguoi_tham_du || [])];
        newAttendees[index] = { ...newAttendees[index], [field]: value };
        setFormData({ ...formData, nguoi_tham_du: newAttendees });
    };

    const addAttendee = () => {
        setFormData({
            ...formData,
            nguoi_tham_du: [...(formData.nguoi_tham_du || []), { ho_ten: '', chuc_vu: '', don_vi: '' }]
        });
    };

    const removeAttendee = (index: number) => {
        const newAttendees = [...(formData.nguoi_tham_du || [])];
        newAttendees.splice(index, 1);
        setFormData({ ...formData, nguoi_tham_du: newAttendees });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép đường dẫn thành công! Bạn có thể dán vào Zalo ngay.');
    };

    const handleSendEmail = () => {
        const subject = encodeURIComponent(`Biên bản xác minh sự cố: ${editingItem?.ma_baocao_scyk || 'Chưa có mã'}`);
        const bodyContent = `Kính gửi,\n\nGửi kèm biên bản xác minh sự cố tại ${editingItem?.dia_diem || '...'}.\n\n(Vui lòng đính kèm file PDF biên bản đã lưu vào email này)\n\nTrân trọng.`;
        const body = encodeURIComponent(bodyContent);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    // --- Render ---

    // --- TOAST NOTIFICATION ---
    const ExportToast = () => exportResult ? (
        <div className={`fixed bottom-6 right-6 z-50 max-w-md px-5 py-4 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300 ${exportResult.success
            ? 'bg-green-50 border-green-300 text-green-900'
            : 'bg-red-50 border-red-300 text-red-900'
            }`}>
            <div className="mt-0.5">{exportResult.success ? <CheckCircle size={20} className="text-green-600" /> : <X size={20} className="text-red-600" />}</div>
            <div className="flex-1">
                <p className="font-black text-label uppercase">{exportResult.success ? 'Xuất báo cáo thành công' : 'Xuất báo cáo thất bại'}</p>
                <p className="text-table font-bold uppercase mt-1 opacity-70">{exportResult.message}</p>
                {exportResult.fileUrl && (
                    <a
                        href={exportResult.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-green-700 hover:underline"
                    >
                        <Download size={12} /> Tải file PDF
                    </a>
                )}
            </div>
            <button onClick={() => setExportResult(null)} className="text-current opacity-60 hover:opacity-100">
                <X size={16} />
            </button>
        </div>
    ) : null;

    // --- VIEW MODE: Chi tiết biên bản ---
    if (viewMode === 'VIEW' && viewingItem) {
        const chuTri = Array.isArray(viewingItem.thanh_phan) ? viewingItem.thanh_phan.find(m => m.vai_tro === 'CHU_TRI') : null;
        const thuKy = Array.isArray(viewingItem.thanh_phan) ? viewingItem.thanh_phan.find(m => m.vai_tro === 'THU_KY') : null;
        const thanhVien = Array.isArray(viewingItem.thanh_phan) ? viewingItem.thanh_phan.filter(m => m.vai_tro !== 'CHU_TRI' && m.vai_tro !== 'THU_KY' && m.vai_tro !== 'NGUOI_CHUNG_KIEN') : [];
        const chungKien = Array.isArray(viewingItem.thanh_phan) ? viewingItem.thanh_phan.filter(m => m.vai_tro === 'NGUOI_CHUNG_KIEN') : [];
        const linkedInc = incidents.find(inc => inc.id === viewingItem.scyk_id);
        const iDept1 = (linkedInc?.khoa_phong || '').trim().toLowerCase();
        const iDept2 = (linkedInc?.don_vi_bao_cao || '').trim().toLowerCase();
        const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
        return (
            <div className="space-y-4 animate-in fade-in duration-200">
                <ExportToast />
                {/* Header bar */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-section font-black text-black uppercase flex items-center gap-2">
                                <FileText className="text-[#009900]" size={20} />
                                Chi tiết Biên bản xác minh
                            </h2>
                            {linkedInc && <span className="text-table font-black text-black/40 uppercase">Liên kết SCYK: <span className="font-mono font-black text-blue-700">{linkedInc.so_bc_ma_scyk}</span></span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isOwnUnit && (
                            <button
                                onClick={() => handleEdit(viewingItem)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-input font-black uppercase shadow-xl shadow-indigo-900/20 active:scale-95 transition-all"
                            >
                                <Edit2 size={16} /> Chỉnh sửa
                            </button>
                        )}
                        <button
                            onClick={() => handleExportPdf(viewingItem)}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#009900] hover:bg-[#0d6e39] disabled:bg-green-400 text-white rounded-xl text-input font-black uppercase shadow-xl shadow-green-900/20 active:scale-95 transition-all"
                        >
                            {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {exportLoading ? 'Đang xuất PDF...' : 'Xuất báo cáo PDF'}
                        </button>
                    </div>
                </div>

                {/* Detail content */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8" style={{ fontSize: '14pt', fontFamily: 'Arial, sans-serif' }}>
                    {/* Thời gian và địa điểm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-table font-black text-black/40 uppercase mb-1">Thời gian bắt đầu</p>
                            <p className="text-input font-black text-black flex items-center gap-2">
                                <Clock size={16} className="text-[#009900]" />
                                {new Date(viewingItem.thoi_gian_bat_dau).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-table font-black text-black/40 uppercase mb-1">Địa điểm</p>
                            <p className="text-input font-black text-black flex items-center gap-2">
                                <MapPin size={16} className="text-[#009900]" />
                                {viewingItem.dia_diem || 'Chưa cập nhật'}
                            </p>
                        </div>
                    </div>

                    {/* Thành phần đoàn */}
                    <div>
                        <h3 className="text-label font-black text-black uppercase mb-3 flex items-center gap-2">
                            <Users size={16} className="text-[#009900]" /> Thành phần đoàn xác minh
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-[#009900] text-white text-table font-black uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Họ tên</th>
                                        <th className="px-4 py-3 text-left">Chức vụ</th>
                                        <th className="px-4 py-3 text-left">Đơn vị</th>
                                        <th className="px-4 py-3 text-left">Vai trò</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-table font-black text-black uppercase">
                                    {(viewingItem.thanh_phan || []).map((mem, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">{mem.ho_ten}</td>
                                            <td className="px-4 py-3 text-black/40">{mem.chuc_vu}</td>
                                            <td className="px-4 py-3 text-black/40">{mem.don_vi}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${mem.vai_tro === 'CHU_TRI' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                                    mem.vai_tro === 'THU_KY' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                        mem.vai_tro === 'NGUOI_CHUNG_KIEN' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                                                            'bg-green-100 text-[#009900] border border-green-200'
                                                    }`}>
                                                    {mem.vai_tro === 'CHU_TRI' ? 'Chủ trì' :
                                                        mem.vai_tro === 'THU_KY' ? 'Thư ký' :
                                                            mem.vai_tro === 'NGUOI_CHUNG_KIEN' ? 'Người chứng kiến' : 'Thành viên'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Người tham dự */}
                    {viewingItem.nguoi_tham_du && viewingItem.nguoi_tham_du.length > 0 && (
                        <div>
                        <h3 className="text-label font-black text-black uppercase mb-3 flex items-center gap-2">
                            <User size={16} className="text-black/40" /> Với sự tham dự của
                        </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {viewingItem.nguoi_tham_du.map((mem, idx) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-table uppercase font-black">
                                        <div className="text-black">{mem.ho_ten}</div>
                                        <div className="text-black/40 text-[10px] mt-0.5">{mem.chuc_vu} {mem.don_vi ? `- ${mem.don_vi}` : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Nội dung xác minh */}
                    <div>
                        <h3 className="text-[14pt] font-bold text-slate-700 uppercase mb-2">1. Nội dung xác minh</h3>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-[14pt] text-black font-black uppercase whitespace-pre-wrap min-h-[60px] leading-relaxed">
                            {viewingItem.noi_dung_xac_minh || <span className="italic text-black/20">Không có nội dung</span>}
                        </div>
                    </div>

                    {/* Kết quả xác minh */}
                    <div>
                        <h3 className="text-[14pt] font-bold text-red-600 uppercase mb-2 flex items-center gap-2">
                            <CheckCircle size={20} /> 2. Kết quả xác minh
                        </h3>
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-[14pt] text-black font-black uppercase whitespace-pre-wrap min-h-[100px] leading-relaxed shadow-lg shadow-red-900/5">
                            {viewingItem.ket_qua_xac_minh || <span className="italic text-black/20">Chưa có kết quả</span>}
                        </div>
                    </div>

                    {/* Ý kiến tham gia */}
                    {viewingItem.y_kien_tham_gia && (
                        <div>
                            <h3 className="text-[14pt] font-bold text-slate-700 uppercase mb-2">3. Ý kiến tham gia</h3>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-[14pt] text-black font-black uppercase whitespace-pre-wrap leading-relaxed">
                                {viewingItem.y_kien_tham_gia}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (viewMode === 'PRINT' && editingItem) {
        return (
            <div className="bg-white min-h-screen p-8 text-black font-serif relative" id="print-area">
                <style>{`
          @page { size: A4; margin-top: 2cm; margin-bottom: 2cm; margin-left: 2.5cm; margin-right: 2cm; }
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          #print-area { font-family: 'Arial', sans-serif; }
        `}</style>

                <div className="absolute top-4 right-4 no-print flex gap-2">
                    <button onClick={handleCopyLink} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold">
                        <Copy size={16} /> Copy Link Zalo
                    </button>
                    <button onClick={handleSendEmail} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold">
                        <Mail size={16} /> Gửi Email
                    </button>
                    <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center gap-2 text-sm font-bold">
                        <Printer size={16} /> In ngay
                    </button>
                    <button onClick={() => setViewMode('LIST')} className="bg-slate-200 hover:bg-slate-300 text-black px-4 py-2 rounded-xl shadow-xl text-table font-black uppercase transition-all active:scale-95">
                        Đóng
                    </button>
                </div>

                <div className="max-w-[210mm] mx-auto leading-relaxed text-[14pt]">
                    <div className="text-center font-bold mb-6">
                        <p className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-bold underline mb-4">Độc lập – Tự do – Hạnh phúc</p>
                        <h1 className="text-xl uppercase mt-8">BIÊN BẢN XÁC MINH SỰ CỐ Y KHOA</h1>
                    </div>

                    <div className="mb-4">
                        <p>
                            Hồi {editingItem.thoi_gian_bat_dau ? new Date(editingItem.thoi_gian_bat_dau).getHours() : '........'} giờ {editingItem.thoi_gian_bat_dau ? new Date(editingItem.thoi_gian_bat_dau).getMinutes().toString().padStart(2, '0') : '........'} ngày {editingItem.thoi_gian_bat_dau ? new Date(editingItem.thoi_gian_bat_dau).getDate() : '........'} tháng {editingItem.thoi_gian_bat_dau ? (new Date(editingItem.thoi_gian_bat_dau).getMonth() + 1) : '........'} năm {editingItem.thoi_gian_bat_dau ? new Date(editingItem.thoi_gian_bat_dau).getFullYear() : '........'} tại {editingItem.dia_diem || '................................'}
                        </p>
                        <p className="font-bold mt-2">Chúng tôi gồm:</p>
                        {editingItem.thanh_phan?.map((mem, idx) => (
                            <div key={idx} className="pl-4 mb-2">
                                <p>
                                    Ông/bà: <span className="font-bold">{mem.ho_ten}</span> - Chức vụ: {mem.chuc_vu || '..............'} - thuộc Đơn vị: {mem.don_vi || '..............'}
                                </p>
                                <p className="italic pl-2">- Là {mem.vai_tro === 'CHU_TRI' ? 'Chủ trì xác minh sự cố y khoa' : mem.vai_tro === 'NGUOI_CHUNG_KIEN' ? 'Người chứng kiến' : 'Thành viên đoàn xác minh'}.</p>
                            </div>
                        ))}

                        <p className="font-bold mt-4">Với sự tham dự của:</p>
                        {editingItem.nguoi_tham_du?.length ? editingItem.nguoi_tham_du.map((mem, idx) => (
                            <p key={idx} className="pl-4">
                                Ông/bà: <span className="font-bold">{mem.ho_ten}</span> - Chức vụ: {mem.chuc_vu || '..............'} - thuộc Đơn vị: {mem.don_vi || '..............'}
                            </p>
                        )) : <p className="pl-4 italic">(Không có)</p>}
                    </div>

                    <div className="mb-4">
                        <p className="font-bold uppercase">Tiến hành xác minh về việc:</p>
                        <p className="whitespace-pre-wrap text-justify border-b border-dotted border-slate-400 min-h-[100px]">{editingItem.noi_dung_xac_minh}</p>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-bold text-center uppercase my-4">KẾT QUẢ XÁC MINH</h3>
                        <div className="whitespace-pre-wrap text-justify border-b border-dotted border-slate-400 min-h-[300px] leading-8">
                            {editingItem.ket_qua_xac_minh}
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="font-bold uppercase">Ý kiến của những người tham gia xác minh (nếu có):</p>
                        <p className="whitespace-pre-wrap text-justify border-b border-dotted border-slate-400 min-h-[100px]">{editingItem.y_kien_tham_gia}</p>
                    </div>

                    <div className="mb-4">
                        <p>Biên bản này gồm có ..... trang, được lập thành ..... bản có nội dung và giá trị pháp lý như nhau.</p>
                        <p>Biên bản này được đọc cho những người có tên phía trên nghe, công nhận đúng sự việc và cùng ký tên xác nhận dưới đây.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-center mt-12 font-black uppercase text-[12pt]">
                        <div>
                            <p className="mb-24">THÀNH VIÊN ĐOÀN</p>
                        </div>
                        <div>
                            <p className="mb-24">CHỦ TRÌ ĐOÀN</p>
                        </div>
                        <div>
                            <p className="mb-24">NGƯỜI LÀM CHỨNG</p>
                        </div>
                        <div>
                            <p className="mb-24">NGƯỜI LẬP BIÊN BẢN</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (viewMode === 'FORM') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-5xl mx-auto my-4">
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-section font-black text-black uppercase flex items-center gap-2">
                        <FileText className="text-[#009900]" />
                        {editingItem ? 'Cập nhật Biên bản' : 'Lập Biên bản xác minh mới'}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('LIST')} className="px-6 py-2 hover:bg-slate-200 rounded-xl text-black text-table font-black uppercase transition-all active:scale-95">Hủy bỏ</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-[#009900] hover:bg-[#0d6e39] text-white rounded-xl text-input font-black uppercase shadow-xl shadow-green-900/10 flex items-center gap-2 active:scale-95 transition-all">
                            <Save size={16} /> Lưu biên bản
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
                    {/* Section 0: Incident Code Link */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-4">
                        <label className="text-label font-black text-blue-900 mb-2 block uppercase">Liên kết với Sự cố Y khoa (Bắt buộc)</label>
                        <div className="relative">
                            <select
                                value={formData.scyk_id || ''}
                                onChange={(e) => {
                                    const sc = incidents.find(i => i.id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        scyk_id: e.target.value,
                                        ma_baocao_scyk: sc?.so_bc_ma_scyk
                                    });
                                }}
                                className="w-full border border-blue-300 rounded-xl p-3 text-input font-black uppercase focus:ring-2 focus:ring-blue-500 bg-white shadow-xl shadow-blue-900/5"
                            >
                                <option value="">-- Chọn sự cố y khoa để lập biên bản --</option>
                                {incidents
                                    .filter(inc => {
                                        if (isAdmin || !uDept) return true;
                                        const iDept1 = (inc.khoa_phong || '').trim().toLowerCase();
                                        const iDept2 = (inc.don_vi_bao_cao || '').trim().toLowerCase();
                                        return (iDept1 !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1))) ||
                                               (iDept2 !== '' && (uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
                                    })
                                    .map(inc => (
                                    <option key={inc.id} value={inc.id}>
                                        {inc.so_bc_ma_scyk} - {inc.don_vi_bao_cao} (Ngày báo cáo: {new Date(inc.ngay_bao_cao || '').toLocaleDateString('vi-VN')})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Time & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-label font-bold text-black uppercase block ml-1">Thời gian bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={formData.thoi_gian_bat_dau}
                                onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                                className="w-full border border-slate-300 rounded-xl p-3 text-input font-bold text-black focus:ring-2 focus:ring-[#009900] bg-white transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-label font-bold text-black uppercase block ml-1">Tại địa điểm</label>
                            <input
                                type="text"
                                placeholder="VD: Phòng họp Khoa Hồi sức tích cực..."
                                value={formData.dia_diem}
                                onChange={(e) => setFormData({ ...formData, dia_diem: e.target.value })}
                                className="w-full border border-slate-300 rounded-xl p-3 text-input font-bold text-black focus:ring-2 focus:ring-[#009900] bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Section 2: Participants */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-label font-black text-black uppercase">Thành phần đoàn xác minh</h3>
                            <button onClick={addMember} className="text-[#009900] text-table font-black uppercase hover:underline flex items-center gap-1"><Plus size={14} /> Thêm thành viên</button>
                        </div>
                        <div className="space-y-3">
                            {formData.thanh_phan?.map((mem, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 flex-1">
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Họ tên</label>
                                            <SuggestionInput
                                                value={mem.ho_ten}
                                                onChange={(val) => updateMember(idx, 'ho_ten', val)}
                                                onSelect={(item) => {
                                                    const newMembers = [...(formData.thanh_phan || [])];
                                                    newMembers[idx] = { ...newMembers[idx], ho_ten: item.ho_ten, chuc_vu: item.chuc_vu || '', don_vi: item.don_vi || '' };
                                                    setFormData({ ...formData, thanh_phan: newMembers });
                                                }}
                                                list={personnel}
                                                placeholder="Nhập họ tên..."
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Chức vụ</label>
                                            <input type="text" className="w-full text-input font-bold border-b border-slate-200 focus:border-[#009900] outline-none pb-1 bg-transparent" value={mem.chuc_vu} onChange={(e) => updateMember(idx, 'chuc_vu', e.target.value)} placeholder="Chức vụ..." />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Đơn vị</label>
                                            <input type="text" className="w-full text-input font-bold border-b border-slate-200 focus:border-[#009900] outline-none pb-1 bg-transparent" value={mem.don_vi} onChange={(e) => updateMember(idx, 'don_vi', e.target.value)} placeholder="Khoa/Phòng..." />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Vai trò</label>
                                            <select className="w-full text-table font-black text-black uppercase border-b border-slate-200 bg-transparent py-1 cursor-pointer" value={mem.vai_tro} onChange={(e) => updateMember(idx, 'vai_tro', e.target.value as any)}>
                                                <option value="CHU_TRI">Chủ trì đoàn</option>
                                                <option value="THANH_VIEN">Thành viên</option>
                                                <option value="THU_KY">Thư ký</option>
                                                <option value="NGUOI_CHUNG_KIEN">Người chứng kiến</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => removeMember(idx)} className="text-black/20 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all active:scale-95"><X size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2b: Attendees */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-label font-black text-black uppercase">Với sự tham dự của (Khách mời)</h3>
                            <button onClick={addAttendee} className="text-[#009900] text-table font-black uppercase hover:underline flex items-center gap-1"><Plus size={14} /> Thêm người tham dự</button>
                        </div>
                        <div className="space-y-3">
                            {formData.nguoi_tham_du?.map((mem, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 flex-1">
                                        <div>
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Họ tên</label>
                                            <SuggestionInput
                                                value={mem.ho_ten}
                                                onChange={(val) => updateAttendee(idx, 'ho_ten', val)}
                                                onSelect={(item) => {
                                                    const newAttendees = [...(formData.nguoi_tham_du || [])];
                                                    newAttendees[idx] = { ...newAttendees[idx], ho_ten: item.ho_ten, chuc_vu: item.chuc_vu || '', don_vi: item.don_vi || '' };
                                                    setFormData({ ...formData, nguoi_tham_du: newAttendees });
                                                }}
                                                list={personnel}
                                                placeholder="Nhập họ tên..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Chức vụ</label>
                                            <input type="text" className="w-full text-input font-bold border-b border-slate-200 focus:border-[#009900] outline-none pb-1 bg-transparent" value={mem.chuc_vu} onChange={(e) => updateAttendee(idx, 'chuc_vu', e.target.value)} placeholder="Chức vụ..." />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-black/40 uppercase block mb-1">Đơn vị</label>
                                            <input type="text" className="w-full text-input font-bold border-b border-slate-200 focus:border-[#009900] outline-none pb-1 bg-transparent" value={mem.don_vi} onChange={(e) => updateAttendee(idx, 'don_vi', e.target.value)} placeholder="Khoa/Phòng..." />
                                        </div>
                                    </div>
                                    <button onClick={() => removeAttendee(idx)} className="text-black/20 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all active:scale-95"><X size={18} /></button>
                                </div>
                            ))}
                            {(!formData.nguoi_tham_du || formData.nguoi_tham_du.length === 0) && (
                                <p className="text-center text-table font-black text-black/20 uppercase py-2 tracking-widest">Chưa có người tham dự nào.</p>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Content & Result */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-label font-black text-black uppercase block ml-1">1. Nội dung xác minh</label>
                            <textarea
                                rows={3}
                                className="w-full border border-slate-300 rounded-2xl p-4 text-input font-bold text-black focus:ring-2 focus:ring-[#009900] bg-white transition-all shadow-sm"
                                value={formData.noi_dung_xac_minh}
                                onChange={(e) => setFormData({ ...formData, noi_dung_xac_minh: e.target.value })}
                                placeholder="Tiến hành xác minh về việc..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-label font-black text-red-600 uppercase block ml-1">2. Kết quả xác minh (Quan trọng)</label>
                            <textarea
                                rows={10}
                                className="w-full border border-red-200 rounded-2xl p-4 text-input font-bold text-black focus:ring-2 focus:ring-red-500 bg-white transition-all shadow-lg shadow-red-900/5 leading-relaxed"
                                value={formData.ket_qua_xac_minh}
                                onChange={(e) => setFormData({ ...formData, ket_qua_xac_minh: e.target.value })}
                                placeholder="Ghi chi tiết kết quả xác minh..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-label font-bold text-black uppercase block ml-1">3. Ý kiến tham gia</label>
                            <textarea
                                rows={3}
                                className="w-full border border-slate-300 rounded-2xl p-4 text-input font-bold text-black focus:ring-2 focus:ring-[#009900] bg-white transition-all shadow-sm"
                                value={formData.y_kien_tham_gia}
                                onChange={(e) => setFormData({ ...formData, y_kien_tham_gia: e.target.value })}
                                placeholder="Ý kiến của các thành viên khác (nếu có)..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- List Mode ---
    return (
        <div className="space-y-6">
            <ExportToast />
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                    <input
                        className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-input font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#009900] bg-slate-50/50 transition-all"
                        placeholder="Tìm kiếm biên bản..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={handleCreate} className="bg-[#009900] hover:bg-[#0d6e39] text-white px-6 py-2.5 rounded-xl text-input font-black uppercase shadow-xl shadow-green-900/10 flex items-center gap-2 transition-all active:scale-95">
                    <Plus size={18} /> Lập biên bản mới
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {items.length === 0 && !loading ? (
                    <div className="p-16 text-center text-black/20 flex flex-col items-center">
                        <FileText size={64} className="text-slate-100 mb-6" />
                        <p className="text-section font-black uppercase tracking-widest">Chưa có biên bản xác minh nào.</p>
                        <button onClick={handleCreate} className="mt-6 px-6 py-2.5 bg-[#009900] text-white rounded-xl text-input font-black uppercase shadow-xl shadow-green-900/10 active:scale-95 transition-all">Tạo ngay</button>
                    </div>
                ) : (
                    <table className="w-full text-table text-left uppercase">
                        <thead className="bg-[#009900] text-white font-black uppercase text-table border-b border-green-700">
                            <tr>
                                <th className="px-6 py-4">Mã SCYK</th>
                                <th className="px-6 py-4">Thời gian / Địa điểm</th>
                                <th className="px-6 py-4">Chủ trì đoàn</th>
                                <th className="px-6 py-4">Nội dung xác minh</th>
                                <th className="px-6 py-4 w-28">Báo cáo</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items
                                .filter(i => {
                                    const matchesSearch = i.dia_diem.toLowerCase().includes(searchTerm.toLowerCase());
                                    if (isAdmin || !uDept) return matchesSearch;
                                    
                                    const linkedInc = incidents.find(inc => inc.id === i.scyk_id);
                                    if (!linkedInc) return false; // Or true if orphans should be seen
                                    
                                    const iDept1 = (linkedInc.khoa_phong || '').trim().toLowerCase();
                                    const iDept2 = (linkedInc.don_vi_bao_cao || '').trim().toLowerCase();
                                    const matchesUnit = (iDept1 !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1))) ||
                                                       (iDept2 !== '' && (uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
                                    return matchesSearch && matchesUnit;
                                })
                                .map((item) => {
                                const chuTri = Array.isArray(item.thanh_phan) ? item.thanh_phan.find(m => m.vai_tro === 'CHU_TRI') : null;
                                const linkedInc = incidents.find(inc => inc.id === item.scyk_id);
                                const iDept1 = (linkedInc?.khoa_phong || '').trim().toLowerCase();
                                const iDept2 = (linkedInc?.don_vi_bao_cao || '').trim().toLowerCase();
                                const isOwnUnit = isAdmin || (uDept !== '' && (uDept === iDept1 || iDept1.includes(uDept) || uDept.includes(iDept1) || uDept === iDept2 || iDept2.includes(uDept) || uDept.includes(iDept2)));
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-all font-black text-black">
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-black font-mono border border-blue-200 uppercase">
                                                {linkedInc?.so_bc_ma_scyk || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-black">{new Date(item.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-[10px] text-black/40 flex items-center gap-1 mt-1 font-bold uppercase"><Clock size={12} className="text-[#009900]" /> {new Date(item.thoi_gian_bat_dau).toLocaleTimeString('vi-VN').slice(0, 5)}</div>
                                            <div className="text-[10px] text-black/40 flex items-center gap-1 mt-1 font-bold uppercase"><MapPin size={12} className="text-[#009900]" /> {item.dia_diem}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {chuTri ? (
                                                <div className="uppercase">
                                                    <div className="text-black">{chuTri.ho_ten}</div>
                                                    <div className="text-[10px] text-black/40 font-bold">{chuTri.chuc_vu} - {chuTri.don_vi}</div>
                                                </div>
                                            ) : <span className="text-black/20 italic tracking-widest text-[10px]">Chưa cập nhật</span>}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-[10px] uppercase font-bold text-black/60">
                                            {item.noi_dung_xac_minh || 'Không có nội dung'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.file_url ? (
                                                <a
                                                    href={item.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#009900] hover:bg-[#0d6e39] text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-xl shadow-green-900/10 active:scale-95"
                                                    title={item.file_name || 'Mở file PDF'}
                                                >
                                                    <FileText size={14} /> Xem BC
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={() => handleExportPdf(item)}
                                                    disabled={exportLoading}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-black/40 rounded-xl text-[10px] font-black uppercase transition-all disabled:opacity-40 active:scale-95 shadow-sm"
                                                    title="Xuất PDF và lưu báo cáo"
                                                >
                                                    {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                                    Xuất PDF
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right w-44">
                                            <div className="grid grid-cols-2 gap-1.5 uppercase">
                                                <button onClick={() => handleView(item)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200 shadow-sm active:scale-95">
                                                    <Eye size={12} /> Xem
                                                </button>
                                                {isOwnUnit && (
                                                    <>
                                                        <button onClick={() => handleEdit(item)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-200 shadow-sm active:scale-95">
                                                            <Edit2 size={12} /> Sửa
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-black text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200 shadow-sm col-span-2 active:scale-95">
                                                            <Trash2 size={12} /> Xóa biên bản
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default VerificationMinutes;
