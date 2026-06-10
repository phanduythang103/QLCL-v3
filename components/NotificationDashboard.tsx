import React, { useEffect, useState } from 'react';
import { fetchThongBao, fetchThongBaoReadIds, markThongBaoAsRead, THONG_BAO_READ_EVENT, ThongBao } from '../readThongBao';
import { fetchLichGiamSat, LichGiamSat } from '../readLichGiamSat';
import { Bell, Calendar, ChevronRight, Paperclip, Loader, X, FileText, Activity, Clock, MapPin, Eye, Info, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const NotificationDashboard: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<ThongBao[]>([]);
    const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
    const [schedules, setSchedules] = useState<LichGiamSat[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [selectedNoti, setSelectedNoti] = useState<ThongBao | null>(null);
    const [showNotiDetail, setShowNotiDetail] = useState(false);
    const [showAllNoti, setShowAllNoti] = useState(false);
    const [showAllSchedule, setShowAllSchedule] = useState(false);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [notiData, scheduleData, readIds] = await Promise.all([
                    fetchThongBao(),
                    fetchLichGiamSat(),
                    user?.id
                        ? fetchThongBaoReadIds(user.id).catch(err => {
                            console.error('Error loading notification click logs:', err);
                            return [];
                        })
                        : Promise.resolve([])
                ]);
                setNotifications(notiData || []);
                setSchedules(scheduleData || []);
                setReadNotificationIds(new Set(readIds));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();

        const handleReadEvent = (event: Event) => {
            const { thongBaoId, userId } = (event as CustomEvent<{ thongBaoId: string; userId: string }>).detail;
            if (userId === user?.id) {
                setReadNotificationIds(current => new Set(current).add(thongBaoId));
            }
        };
        window.addEventListener(THONG_BAO_READ_EVENT, handleReadEvent);
        return () => window.removeEventListener(THONG_BAO_READ_EVENT, handleReadEvent);
    }, [user?.id]);

    const unreadCount = notifications.reduce(
        (count, notification) => count + (readNotificationIds.has(notification.id) ? 0 : 1),
        0
    );

    const safeText = (value: unknown, fallback = '---') => {
        if (value === null || value === undefined) return fallback;
        const text = String(value).trim();
        return text || fallback;
    };

    const safeDate = (value: unknown, format: 'date' | 'datetime' = 'date') => {
        if (!value) return '---';
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return '---';
        return format === 'datetime' ? date.toLocaleString('vi-VN') : date.toLocaleDateString('vi-VN');
    };

    const safeLink = (value: unknown) => safeText(value, '');

    const openNotiDetail = async (noti: ThongBao) => {
        setSelectedNoti({
            ...noti,
            nguoi_tao_name: safeText(noti.nguoi_tao_name, 'Người tạo'),
            noi_dung: safeText(noti.noi_dung, 'Không có nội dung'),
        });
        setShowNotiDetail(true);
        if (!user?.id || readNotificationIds.has(noti.id)) return;

        setReadNotificationIds(current => new Set(current).add(noti.id));
        try {
            await markThongBaoAsRead(noti.id, user.id);
        } catch (err) {
            console.error('Error logging notification click:', err);
            setReadNotificationIds(current => {
                const next = new Set(current);
                next.delete(noti.id);
                return next;
            });
        }
    };

    if (loading) return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex items-center justify-center">
            <Loader className="animate-spin text-[#009900]" />
        </div>
    );

    return (
        <>
            <div className="flex flex-col gap-6 h-full">

                {/* PART 1: TOP - LATEST NOTIFICATIONS */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="p-5 border-b border-slate-50 bg-white flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Bell className="text-[#009900]" size={16} />
                            Thông báo mới nhất
                            {unreadCount > 0 && (
                                <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[9px] text-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </h3>
                        <button
                            onClick={() => setShowAllNoti(true)}
                            className="text-[10px] font-black text-[#009900] uppercase hover:underline"
                        >
                            Tất cả
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Không có thông báo</div>
                        ) : (
                            notifications.slice(0, 5).map((noti) => (
                                <div
                                    key={noti.id}
                                    onClick={() => openNotiDetail(noti)}
                                    className={`p-5 hover:bg-slate-50 transition-all group cursor-pointer ${readNotificationIds.has(noti.id) ? 'bg-white' : 'bg-green-50/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {!readNotificationIds.has(noti.id) && <span className="size-2 rounded-full bg-blue-500" />}
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                {safeDate(noti.ngay_tao, 'date') === '---' ? 'Mới' : safeDate(noti.ngay_tao, 'date')}
                                            </span>
                                        </div>
                                        {noti.file_dinh_kem && (
                                            <Paperclip size={10} className="text-slate-300 group-hover:text-primary-500" />
                                        )}
                                    </div>
                                    <p className="text-[11px] font-black text-slate-700 group-hover:text-[#009900] transition-colors line-clamp-2 uppercase leading-relaxed">
                                        {safeText(noti.noi_dung, 'Không có nội dung')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* PART 2: BOTTOM - SUPERVISION SCHEDULE */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="p-5 border-b border-slate-50 bg-white flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="text-indigo-600" size={16} />
                            Lịch giám sát
                        </h3>
                        <button
                            onClick={() => setShowAllSchedule(true)}
                            className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                        >
                            Chi tiết
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 scrollbar-hide">
                        {schedules.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Không có lịch GS</div>
                        ) : (
                            schedules.slice(0, 5).map((item) => (
                                <div
                                    key={item.id}
                                    className="p-5 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-md border border-indigo-100">
                                            {item.trang_thai || 'Kế hoạch'}
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={10} />
                                            {safeDate(item.tu_ngay, 'date')}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-1 uppercase mb-2">
                                        {item.nd_giam_sat}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                        <MapPin size={10} className="text-rose-500" />
                                        <span className="truncate">{item.dv_duoc_gs || 'Toàn viện'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL: ALL NOTIFICATIONS */}
            {showAllNoti && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-[#009900] shadow-sm">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tất cả thông báo</h3>
                                    <p className="text-[10px] font-black uppercase text-slate-400">{unreadCount} thông báo chưa xem</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAllNoti(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-y-auto divide-y divide-slate-50">
                            {notifications.map((noti) => (
                                <div
                                    key={noti.id}
                                    onClick={() => { openNotiDetail(noti); setShowAllNoti(false); }}
                                    className={`p-6 hover:bg-slate-50 transition-all group cursor-pointer rounded-2xl ${readNotificationIds.has(noti.id) ? 'bg-white' : 'bg-green-50/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            {!readNotificationIds.has(noti.id) && <span className="size-2 rounded-full bg-blue-500" />}
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full">
                                                {safeDate(noti.ngay_tao, 'date')}
                                            </span>
                                        </div>
                                        {noti.file_dinh_kem && <Paperclip size={14} className="text-slate-300" />}
                                    </div>
                                    <p className="text-sm font-black text-slate-700 group-hover:text-[#009900] uppercase transition-colors leading-relaxed">
                                        {safeText(noti.noi_dung, 'Không có nội dung')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ALL SCHEDULES */}
            {showAllSchedule && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Calendar size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Chi tiết lịch giám sát</h3>
                            </div>
                            <button onClick={() => setShowAllSchedule(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                            {schedules.map((item) => (
                                <div key={item.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex flex-wrap items-center gap-4 mb-4">
                                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">
                                            {item.trang_thai || 'KẾ HOẠCH'}
                                        </span>
                                        <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock size={16} className="text-indigo-400" />
                                            {safeDate(item.tu_ngay, 'date')}
                                            {safeDate(item.den_ngay, 'date') !== '---' && ` - ${safeDate(item.den_ngay, 'date')}`}
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4">{item.nd_giam_sat}</p>
                                    <div className="flex flex-wrap gap-x-8 gap-y-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-rose-500" />
                                            <span className="text-[11px] font-black text-slate-500 uppercase">{item.dv_duoc_gs || 'TOÀN VIỆN'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Activity size={14} className="text-[#009900]" />
                                            <span className="text-[11px] font-black text-slate-500 uppercase">Người GS: {item.nhan_vien_gs || '---'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: NOTIFICATION DETAIL */}
            {showNotiDetail && selectedNoti && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/30 relative">
                            <button onClick={() => { setShowNotiDetail(false); setSelectedNoti(null); }} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#009900] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-900/20">
                                    {safeText(selectedNoti.nguoi_tao_name, 'U').charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{safeText(selectedNoti.nguoi_tao_name, 'Người tạo')}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeDate(selectedNoti.ngay_tao, 'datetime')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nội dung thông báo</label>
                                <p className="text-sm font-black text-slate-700 uppercase leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    {safeText(selectedNoti.noi_dung, 'Không có nội dung')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hiệu lực</p>
                                    <p className="text-[11px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                                        <Calendar size={14} className="text-[#009900]" />
                                        {safeDate(selectedNoti.ngay_bat_dau, 'date')}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Đến ngày</p>
                                    <p className="text-[11px] font-black text-slate-700 uppercase">
                                        {safeDate(selectedNoti.ngay_ket_thuc, 'date')}
                                    </p>
                                </div>
                            </div>

                            {safeLink(selectedNoti.file_dinh_kem) && (
                                <a
                                    href={safeLink(selectedNoti.file_dinh_kem)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full text-center py-4 bg-[#009900] text-white rounded-2xl text-[11px] font-black uppercase hover:opacity-90 transition-all shadow-lg shadow-green-900/20"
                                >
                                    Xem tài liệu đính kèm
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
