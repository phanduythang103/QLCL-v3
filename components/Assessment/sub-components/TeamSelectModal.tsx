import React from 'react';
import { Users2, X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface TeamSelectModalProps {
  teams: string[];
  onSelect: (teamName?: string) => void;
  onClose: () => void;
  hidePersonalOption?: boolean;
}

export const TeamSelectModal: React.FC<TeamSelectModalProps> = ({ teams, onSelect, onClose, hidePersonalOption }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#009900] to-[#007700] p-5 sm:p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Users2 size={24} />
            </div>
            <div>
              <h3 className="pr-8 text-base sm:text-lg font-black uppercase tracking-tight">Chọn Tổ chấm điểm</h3>
              <p className="text-white/70 text-xs font-bold uppercase italic">Bạn đang tham gia nhiều tổ đánh giá</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-slate-500 font-bold mb-4">
            Vui lòng chọn tổ mà bạn đang đại diện để hiển thị đúng cấu hình tiêu chí được phân công:
          </p>

          <div className="space-y-3 max-h-[46dvh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            {teams.map((team, index) => (
              <button
                key={index}
                onClick={() => onSelect(team)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 hover:border-[#009900] hover:bg-green-50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-[#009900]/10 flex items-center justify-center text-slate-400 group-hover:text-[#009900] transition-colors">
                    <span className="font-black text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <span className="block text-sm font-black text-slate-800 uppercase leading-none mb-1 group-hover:text-[#009900] transition-colors">
                      {team}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổ chấm điểm chất lượng</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#009900] transition-all transform group-hover:translate-x-1" />
              </button>
            ))}

            {!hidePersonalOption && (
              <>
                <div className="h-px bg-slate-100 my-4" />
                <button
                  onClick={() => onSelect()}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-slate-600 uppercase leading-none mb-1">
                        Cá nhân / Khoa (Mặc định)
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Không chọn tổ cụ thể</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 transform group-hover:translate-x-1" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase italic tabular-nums leading-relaxed max-w-[200px]">
            Hệ thống sẽ lọc 83 tiêu chí theo phân công của tổ bạn đã chọn.
          </p>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-white transition-all border border-transparent hover:border-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
