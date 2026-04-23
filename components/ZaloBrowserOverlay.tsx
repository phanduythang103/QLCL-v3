import React from 'react';
import { Globe, MoreVertical, Share, ExternalLink } from 'lucide-react';

export const ZaloBrowserOverlay: React.FC = () => {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  const handleOpenBrowser = () => {
    // Kích hoạt mở trình duyệt hệ thống (Zalo thường sẽ gợi ý mở ngoài khi reload)
    window.location.href = window.location.href;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center px-6 py-12 font-sans animate-in fade-in duration-500">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Icon Globe */}
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-10 shadow-sm border border-emerald-100">
          <Globe className="text-[#009900]" size={40} />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-slate-800 text-center leading-tight mb-4 tracking-tight uppercase">
          Mở bằng trình<br />duyệt
        </h1>

        {/* Description */}
        <p className="text-slate-500 text-center font-bold text-lg leading-relaxed mb-10 px-4">
          Trình duyệt trong ứng dụng không hỗ trợ đầy đủ. Vui lòng mở bằng trình duyệt hệ thống để tiếp tục.
        </p>

        {/* Instructions Card */}
        <div className="w-full bg-slate-50 rounded-3xl p-8 mb-10 border border-slate-100 relative shadow-inner">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Hướng dẫn</p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                {isAndroid ? <MoreVertical size={20} className="text-slate-600" /> : <Share size={18} className="text-slate-600" />}
              </div>
              <p className="text-slate-700 text-sm font-bold leading-snug pt-1">
                Nhấn dấu <span className="text-[#009900]">{isAndroid ? "⋮" : "..."}</span> hoặc <span className="text-[#009900]">...</span> ở góc trên
              </p>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                <ExternalLink size={18} className="text-slate-600" />
              </div>
              <p className="text-slate-700 text-sm font-bold leading-snug pt-1">
                Chọn <span className="text-[#009900]">"Mở bằng trình duyệt"</span>
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4">
          <button
            onClick={handleOpenBrowser}
            className="w-full py-5 bg-[#009900] text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all"
          >
            Mở bằng Chrome
          </button>
          
          <button
            onClick={handleOpenBrowser}
            className="w-full py-5 border-2 border-[#009900] text-[#009900] rounded-2xl font-black uppercase text-sm tracking-widest active:scale-95 transition-all"
          >
            Hoặc nhấn vào đây
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Bệnh viện Quân y 103</p>
        </div>
      </div>
    </div>
  );
};
