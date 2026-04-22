import React, { useEffect, useState } from 'react';
import { ExternalLink, Info, X, Compass, MoreVertical } from 'lucide-react';

export const ZaloBrowserOverlay: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check session storage or detect Zalo User Agent
        const dismissed = sessionStorage.getItem('zalo_overlay_dismissed');
        const isZalo = /Zalo/i.test(navigator.userAgent);
        const inappDetected = sessionStorage.getItem('inapp_browser_detected');
        
        if ((isZalo || inappDetected) && !dismissed) {
            setIsVisible(true);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('zalo_overlay_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 duration-500">
                {/* Header Decor */}
                <div className="h-2 bg-[#009900]" />

                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-[#009900] shadow-inner">
                            <Compass size={32} className="animate-pulse" />
                        </div>
                        <button
                            onClick={dismiss}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">
                            Tối ưu trải nghiệm
                        </h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Bạn đang sử dụng trình duyệt nội bộ của Zalo. Để đảm bảo khảo sát hoạt động mượt mà nhất, bạn nên mở trang này bằng trình duyệt hệ thống.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Info size={12} /> Hướng dẫn nhanh
                        </h4>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                                <MoreVertical size={20} />
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-snug">
                                Nhấn vào dấu <span className="text-[#009900]">ba chấm (...)</span> ở góc trên bên phải.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-sm">
                                <ExternalLink size={18} />
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-snug">
                                Chọn <span className="text-[#009900]">"Mở bằng trình duyệt"</span> (hoặc Chrome/Safari).
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={dismiss}
                            className="w-full py-4 bg-[#009900] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Tôi đã hiểu & Tiếp tục
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
                            Bệnh viện Quân y 103 - Hệ thống QLCL
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
