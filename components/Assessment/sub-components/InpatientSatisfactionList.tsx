import React from 'react';
import { Calendar, User, Eye, Edit2, Trash2, Plus, BarChart3, Home, AlertTriangle } from 'lucide-react';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';

interface Props {
  surveys: InpatientSurveyResponse[];
  loading: boolean;
  error: string | null;
  onEdit: (data: InpatientSurveyResponse) => void;
  onView: (data: InpatientSurveyResponse) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onRetry: () => void;
}

export const InpatientSatisfactionList: React.FC<Props> = ({ 
  surveys, loading, error, onEdit, onView, onDelete, onAddNew, onRetry 
}) => {
  const getScoreColor = (percent: number) => {
    if (percent >= 90) return 'text-emerald-600 bg-emerald-50';
    if (percent >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#009900]/20 border-t-[#009900] rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Đang tải danh sách khảo sát người bệnh...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-lg font-black text-rose-900 uppercase">Lỗi kết nối cơ sở dữ liệu</h4>
          <p className="text-sm text-rose-700 font-medium max-w-md mx-auto">{error}</p>
        </div>
        <div className="bg-white/50 p-4 rounded-2xl border border-rose-200 text-left space-y-2 max-w-md w-full">
           <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Gợi ý sửa lỗi:</p>
           <ul className="text-[10px] text-rose-700 font-bold uppercase tracking-tight list-disc pl-4 space-y-1">
             <li>Kiểm tra xem đã chạy SQL RLS policies chưa?</li>
             <li>Kiểm tra quyền truy cập (Role) của tài khoản hiện tại</li>
             <li>Đảm bảo bảng <code className="bg-rose-100 px-1 rounded">ksnb_noi_tru</code> đã tồn tại trong Supabase</li>
           </ul>
        </div>
        <button 
          onClick={onRetry}
          className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
        >
          Thử tải lại dữ liệu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Danh sách khảo sát người bệnh nội trú</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Tổng số: {surveys.length} phiếu đã thu thập</p>
        </div>
        <button 
          onClick={onAddNew}
          className="flex items-center gap-2 px-6 py-3 bg-[#009900] text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} /> Khảo sát mới
        </button>
      </div>

      {/* Modern Table List */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="px-4 md:px-6 py-5">Ngày khảo sát</th>
                <th className="px-4 md:px-6 py-5">Mã khảo sát</th>
                <th className="px-4 md:px-6 py-5 text-center">Mức độ hài lòng</th>
                <th className="px-4 md:px-6 py-5 text-right uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <BarChart3 size={48} />
                      <p className="text-sm font-black uppercase">Chưa có dữ liệu khảo sát</p>
                    </div>
                    <div className="mt-4 flex flex-col items-center gap-2">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                         Gợi ý: Thử nhấn "Khảo sát mới" để tạo dữ liệu test.
                       </p>
                       <p className="text-[9px] text-slate-300 font-medium max-w-xs mx-auto">
                         Nếu đã có dữ liệu thực tế nhưng không hiển thị, có thể do chính sách bảo mật RLS đang chặn quyền xem.
                       </p>
                    </div>
                  </td>
                </tr>
              ) : (
                surveys.map((s) => {
                  const percent = s.satisfaction_percent || 0;
                  const d = s.ngay_khao_sat ? new Date(s.ngay_khao_sat) : new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const dateStr = d.toLocaleDateString('vi-VN');
                  const fullCode = `NOITRU-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
                  
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 md:px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg text-[#009900]">
                            <Calendar size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5">
                        <span className="text-[10px] md:text-xs font-black text-[#009900] tracking-tight bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          {fullCode}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-center">
                        <div className="flex justify-center">
                          <div className={`px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black ring-1 ring-inset ${getScoreColor(percent)} ring-current/20`}>
                            {percent}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-right">
                        <button
                          onClick={() => onView(s)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-[#009900] hover:bg-emerald-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                          <span className="hidden md:inline">Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
