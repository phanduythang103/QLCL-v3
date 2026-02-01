import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Search, Calendar, Edit2, Trash2, Printer,
    Download, ArrowLeft, Save, X, User, Users, MapPin, Clock, Copy, Mail
} from 'lucide-react';
import {
    BienBanXacMinh, ThanhVienDoan, NguoiThamDu,
    fetchBienBanXacMinh, addBienBanXacMinh, updateBienBanXacMinh, deleteBienBanXacMinh
} from '../readBienBanXacMinh';
import { fetchBaoCaoScyk, BaoCaoScyk } from '../readBaoCaoScyk';
import { fetchNhanSuQlcl, NhanSuQlcl } from '../readNhanSuQlcl';
import { useAuth } from '../contexts/AuthContext';

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
                className="w-full text-sm font-medium border-b border-slate-200 focus:border-primary-500 outline-none pb-1"
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
                            <div className="font-bold text-slate-700">{item.ho_ten}</div>
                            <div className="text-slate-500">{item.chuc_vu} - {item.don_vi}</div>
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
    const [items, setItems] = useState<BienBanXacMinh[]>([]);
    const [incidents, setIncidents] = useState<BaoCaoScyk[]>([]);
    const [personnel, setPersonnel] = useState<NhanSuQlcl[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'PRINT'>('LIST');
    const [editingItem, setEditingItem] = useState<BienBanXacMinh | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    if (viewMode === 'PRINT' && editingItem) {
        return (
            <div className="bg-white min-h-screen p-8 text-black font-serif relative" id="print-area">
                <style>{`
          @page { size: A4; margin-top: 2cm; margin-bottom: 2cm; margin-left: 2.5cm; margin-right: 1.5cm; }
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          #print-area { font-family: 'Times New Roman', Times, serif; }
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
                    <button onClick={() => setViewMode('LIST')} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded shadow text-sm font-bold">
                        Đóng
                    </button>
                </div>

                <div className="max-w-[210mm] mx-auto leading-relaxed">
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

                    <div className="grid grid-cols-2 gap-8 text-center mt-12 font-bold uppercase">
                        <div>
                            <p className="mb-16">THÀNH VIÊN ĐOÀN</p>
                        </div>
                        <div>
                            <p className="mb-16">CHỦ TRÌ ĐOÀN</p>
                        </div>
                        <div>
                            <p className="mb-16">NGƯỜI LÀM CHỨNG</p>
                        </div>
                        <div>
                            <p className="mb-16">NGƯỜI LẬP BIÊN BẢN</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (viewMode === 'FORM') {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-5xl mx-auto my-4">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <FileText className="text-primary-600" />
                        {editingItem ? 'Cập nhật Biên bản' : 'Lập Biên bản xác minh mới'}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setViewMode('LIST')} className="px-4 py-2 hover:bg-slate-200 rounded-lg text-slate-600 text-sm font-medium">Hủy bỏ</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-primary-600 hovered:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2">
                            <Save size={16} /> Lưu biên bản
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
                    {/* Section 0: Incident Code Link */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                        <label className="text-sm font-bold text-blue-800 mb-2 block">Liên kết với Sự cố Y khoa (Bắt buộc)</label>
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
                                className="w-full border border-blue-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">-- Chọn sự cố y khoa để lập biên bản --</option>
                                {incidents.map(inc => (
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
                            <label className="text-sm font-bold text-slate-700">Thời gian bắt đầu</label>
                            <input
                                type="datetime-local"
                                value={formData.thoi_gian_bat_dau}
                                onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700">Tại địa điểm</label>
                            <input
                                type="text"
                                placeholder="VD: Phòng họp Khoa Hồi sức tích cực..."
                                value={formData.dia_diem}
                                onChange={(e) => setFormData({ ...formData, dia_diem: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Section 2: Participants */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 uppercase text-sm">Thành phần đoàn xác minh</h3>
                            <button onClick={addMember} className="text-primary-600 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={14} /> Thêm thành viên</button>
                        </div>
                        <div className="space-y-3">
                            {formData.thanh_phan?.map((mem, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1">
                                        <div className="md:col-span-3">
                                            <label className="text-xs text-slate-500 block">Họ tên</label>
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
                                            <label className="text-xs text-slate-500 block">Chức vụ</label>
                                            <input type="text" className="w-full text-sm border-b border-slate-200 focus:border-primary-500 outline-none pb-1" value={mem.chuc_vu} onChange={(e) => updateMember(idx, 'chuc_vu', e.target.value)} placeholder="Chức vụ..." />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-xs text-slate-500 block">Đơn vị</label>
                                            <input type="text" className="w-full text-sm border-b border-slate-200 focus:border-primary-500 outline-none pb-1" value={mem.don_vi} onChange={(e) => updateMember(idx, 'don_vi', e.target.value)} placeholder="Khoa/Phòng..." />
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-xs text-slate-500 block">Vai trò</label>
                                            <select className="w-full text-sm border-b border-slate-200 bg-transparent py-1" value={mem.vai_tro} onChange={(e) => updateMember(idx, 'vai_tro', e.target.value as any)}>
                                                <option value="CHU_TRI">Chủ trì đoàn</option>
                                                <option value="THANH_VIEN">Thành viên</option>
                                                <option value="THU_KY">Thư ký</option>
                                                <option value="NGUOI_CHUNG_KIEN">Người chứng kiến</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => removeMember(idx)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2b: Attendees */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 uppercase text-sm">Với sự tham dự của (Khách mời)</h3>
                            <button onClick={addAttendee} className="text-primary-600 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={14} /> Thêm người tham dự</button>
                        </div>
                        <div className="space-y-3">
                            {formData.nguoi_tham_du?.map((mem, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
                                        <div>
                                            <label className="text-xs text-slate-500 block">Họ tên</label>
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
                                            <label className="text-xs text-slate-500 block">Chức vụ</label>
                                            <input type="text" className="w-full text-sm border-b border-slate-200 focus:border-primary-500 outline-none pb-1" value={mem.chuc_vu} onChange={(e) => updateAttendee(idx, 'chuc_vu', e.target.value)} placeholder="Chức vụ..." />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block">Đơn vị</label>
                                            <input type="text" className="w-full text-sm border-b border-slate-200 focus:border-primary-500 outline-none pb-1" value={mem.don_vi} onChange={(e) => updateAttendee(idx, 'don_vi', e.target.value)} placeholder="Khoa/Phòng..." />
                                        </div>
                                    </div>
                                    <button onClick={() => removeAttendee(idx)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                                </div>
                            ))}
                            {(!formData.nguoi_tham_du || formData.nguoi_tham_du.length === 0) && (
                                <p className="text-center text-xs text-slate-400 italic py-2">Chưa có người tham dự nào.</p>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Content & Result */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 uppercase">1. Nội dung xác minh</label>
                            <textarea
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
                                value={formData.noi_dung_xac_minh}
                                onChange={(e) => setFormData({ ...formData, noi_dung_xac_minh: e.target.value })}
                                placeholder="Tiến hành xác minh về việc..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 uppercase text-red-600">2. Kết quả xác minh (Quan trọng)</label>
                            <textarea
                                rows={10}
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 font-medium"
                                value={formData.ket_qua_xac_minh}
                                onChange={(e) => setFormData({ ...formData, ket_qua_xac_minh: e.target.value })}
                                placeholder="Ghi chi tiết kết quả xác minh..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-700 uppercase">3. Ý kiến tham gia</label>
                            <textarea
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500"
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
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Tìm kiếm biên bản..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button onClick={handleCreate} className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all">
                    <Plus size={18} /> Lập biên bản mới
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {items.length === 0 && !loading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <FileText size={48} className="text-slate-300 mb-4" />
                        <p>Chưa có biên bản xác minh nào.</p>
                        <button onClick={handleCreate} className="mt-4 text-primary-600 font-bold hover:underline">Tạo ngay</button>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Mã SCYK</th>
                                <th className="px-6 py-4">Thời gian / Địa điểm</th>
                                <th className="px-6 py-4">Chủ trì đoàn</th>
                                <th className="px-6 py-4">Nội dung xác minh</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.filter(i => i.dia_diem.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => {
                                const chuTri = Array.isArray(item.thanh_phan) ? item.thanh_phan.find(m => m.vai_tro === 'CHU_TRI') : null;
                                const linkedInc = incidents.find(inc => inc.id === item.scyk_id);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold font-mono">
                                                {linkedInc?.so_bc_ma_scyk || '---'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{new Date(item.thoi_gian_bat_dau).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Clock size={12} /> {new Date(item.thoi_gian_bat_dau).toLocaleTimeString('vi-VN').slice(0, 5)}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin size={12} /> {item.dia_diem}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {chuTri ? (
                                                <div>
                                                    <div className="font-bold text-slate-800">{chuTri.ho_ten}</div>
                                                    <div className="text-xs text-slate-500">{chuTri.chuc_vu} - {chuTri.don_vi}</div>
                                                </div>
                                            ) : <span className="text-slate-400 italic">Chưa cập nhật</span>}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate text-slate-600">
                                            {item.noi_dung_xac_minh || 'Không có nội dung'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handlePrint(item)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Xem & Tải PDF">
                                                    <Printer size={18} />
                                                </button>
                                                <button onClick={() => handleEdit(item)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Chỉnh sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                    <Trash2 size={18} />
                                                </button>
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
