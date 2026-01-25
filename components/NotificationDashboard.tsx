import React, { useEffect, useState } from 'react';
import { fetchThongBao, ThongBao } from '../readThongBao';
import { Bell, Calendar, ChevronRight, Paperclip, Loader, X, Eye, FileText, User, Info, Building } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import { ModuleType } from '../types';

export const NotificationDashboard: React.FC = () => {
    const { navigateToModule } = useNavigation();
    const [notifications, setNotifications] = useState<ThongBao[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNoti, setSelectedNoti] = useState<ThongBao | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchThongBao().then(data => {
            setNotifications(data?.slice(0, 5) || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const openDetail = (noti: ThongBao) => {
        setSelectedNoti(noti);
        setShowModal(true);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-primary-600" /></div>;
    if (notifications.length === 0) return null;

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Bell className="text-primary-600" size={18} />
                        Thông báo mới nhất
                    </h3>
                </div>
                <div className="divide-y divide-slate-50 overflow-y-auto">
                    {notifications.map((noti) => (
                        <div
                            key={noti.id}
                            onClick={() => openDetail(noti)}
                            className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                                    {noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleDateString('vi-VN') : 'Mới'}
                                </span>
                                {noti.file_dinh_kem && (
                                    <Paperclip size={12} className="text-slate-300 group-hover:text-primary-500" />
                                )}
                            </div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-primary-700 transition-colors line-clamp-2 mb-1">
                                {noti.noi_dung}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <Calendar size={12} />
                                <span>{noti.ngay_bat_dau ? new Date(noti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}</span>
                                <ChevronRight size={8} />
                                <span>{noti.ngay_ket_thuc ? new Date(noti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                    <button
                        onClick={() => navigateToModule(ModuleType.SETTINGS, 'NOTI')}
                        className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center justify-center gap-1 w-full"
                    >
                        Xem tất cả thông báo <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Detail Modal */}
            {showModal && selectedNoti && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50 relative">
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full shadow-sm transition-all border border-slate-100">
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
                                    <FileText size={14} /> Nội dung thông báo
                                </label>
                                <p className="text-base font-bold text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                    {selectedNoti.noi_dung}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hiệu lực</p>
                                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-primary-600" />
                                        {selectedNoti.ngay_bat_dau ? new Date(selectedNoti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'} - {selectedNoti.ngay_ket_thuc ? new Date(selectedNoti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ghi chú</p>
                                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                        <Info size={14} className="text-amber-500" />
                                        {selectedNoti.ghi_chu || 'Không có'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <Building size={14} /> Đơn vị áp dụng
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedNoti.don_vi_thuc_hien?.map((u, i) => (
                                        <span key={i} className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black rounded-full border border-primary-100">
                                            {u}
                                        </span>
                                    ))}
                                    {(!selectedNoti.don_vi_thuc_hien || selectedNoti.don_vi_thuc_hien.length === 0) && (
                                        <span className="text-xs text-slate-400 italic font-medium">Tất cả các đơn vị.</span>
                                    )}
                                </div>
                            </div>

                            {selectedNoti.file_dinh_kem && (
                                <div className="pt-4">
                                    <a
                                        href={selectedNoti.file_dinh_kem}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white rounded-2xl font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/10 active:scale-95"
                                    >
                                        <Eye size={20} />
                                        Xem tài liệu đính kèm
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
