import React from 'react';
import { ArrowLeft, Calendar, User, Edit, ChevronRight, FileText, CheckCircle } from 'lucide-react';
import { TieuChiCoBan } from '../types/tieuChiCoBan';

interface Props {
  assessments: TieuChiCoBan[];
  loading: boolean;
  onEdit: (data: TieuChiCoBan) => void;
  onView: (data: TieuChiCoBan) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onBack?: () => void;
}

export const TieuChiCoBanList: React.FC<Props> = ({ assessments, loading, onEdit, onView, onDelete, onAddNew, onBack }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#059669] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Đang tải danh sách đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="hidden md:flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-[#059669] rounded-2xl flex items-center justify-center shadow-inner">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Lịch sử đánh giá Tiêu chí cơ bản</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tổng số: {assessments.length} bản ghi</p>
          </div>
        </div>
        <button
          onClick={onAddNew}
          className="px-6 py-3 bg-[#059669] hover:bg-[#007700] text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-emerald-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Edit size={16} /> Bắt đầu đánh giá mới
        </button>
      </div>

      <div className="md:hidden space-y-3">
        <div className="grid grid-cols-2 gap-3 rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/40">
          <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-3 py-4 text-center border border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669]">
              <FileText size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase leading-snug text-slate-800">Lịch sử đánh giá</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tổng số: {assessments.length}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddNew}
            className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-2xl bg-[#059669] px-3 py-4 text-center text-white shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
              <Edit size={24} />
            </div>
            <span className="text-[11px] font-black uppercase leading-snug">Bắt đầu đánh giá mới</span>
          </button>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#059669] active:scale-[0.98] md:inline-flex"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.length === 0 ? (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
              <FileText size={40} />
            </div>
            <h4 className="text-slate-800 font-black uppercase text-xs mb-2">Chưa có bản đánh giá nào</h4>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[200px]">Hãy nhấn nút "Bắt đầu đánh giá mới" để thực hiện đánh giá đầu tiên.</p>
          </div>
        ) : (
          assessments.map(item => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-wrap items-center gap-2 p-1 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg shadow-sm">
                      <Calendar size={12} className="text-[#059669]" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{item.ngay_danh_gia}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1">
                      <User size={12} className="text-[#059669]/60" />
                      <span className="text-[10px] font-black text-[#059669] uppercase tracking-tight truncate max-w-[150px]">{item.nguoi_danh_gia || 'N/A'}</span>
                    </div>
                  </div>
                  <div></div>
                </div>

                  {/* RESULTS STATS (New Part) */}
                  {(() => {
                    const totalCriteria = 43;
                    const metCount = Object.keys(item).filter(k => k.startsWith('c_') && (item as any)[k] === true).length;
                    const percent = ((metCount / totalCriteria) * 100).toFixed(1);

                    return (
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Số tiêu chí đạt</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-[#059669]">{metCount}</span>
                            <span className="text-[10px] text-slate-400 font-bold">/ {totalCriteria}</span>
                          </div>
                        </div>
                        <div className="space-y-1 border-l border-slate-200 pl-4">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Tỷ lệ đạt %</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-indigo-600">{percent}</span>
                            <span className="text-[10px] text-indigo-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.trang_thai}</span>
                  </div>
                  <button
                    onClick={() => onView(item)}
                    className="flex items-center gap-1 text-[#059669] font-black text-[10px] uppercase group-hover:gap-2 transition-all"
                  >
                    Chi tiết <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
