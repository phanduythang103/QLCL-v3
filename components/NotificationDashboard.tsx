import React, { useEffect, useState } from 'react';
import { fetchThongBao, ThongBao } from '../readThongBao';
import { Bell, Calendar, ChevronRight, Paperclip, Loader } from 'lucide-react';

export const NotificationDashboard: React.FC = () => {
    const [notifications, setNotifications] = useState<ThongBao[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchThongBao().then(data => {
            // Lấy 5 thông báo mới nhất
            setNotifications(data?.slice(0, 5) || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin text-primary-600" /></div>;
    if (notifications.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bell className="text-primary-600" size={18} />
                    Thông báo mới nhất
                </h3>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto">
                {notifications.map((noti) => (
                    <div key={noti.id} className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">
                                {noti.ngay_tao ? new Date(noti.ngay_tao).toLocaleDateString('vi-VN') : 'Mới'}
                            </span>
                            {noti.file_dinh_kem && (
                                <a href={noti.file_dinh_kem} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-primary-600 transition-colors">
                                    <Paperclip size={14} />
                                </a>
                            )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-primary-700 transition-colors line-clamp-2 mb-1">
                            {noti.noi_dung}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                            <Calendar size={12} />
                            <span>Hiệu lực: {noti.ngay_bat_dau ? new Date(noti.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}</span>
                            <ChevronRight size={8} />
                            <span>{noti.ngay_ket_thuc ? new Date(noti.ngay_ket_thuc).toLocaleDateString('vi-VN') : '---'}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                <button className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
                    Xem tất cả thông báo
                </button>
            </div>
        </div>
    );
};
