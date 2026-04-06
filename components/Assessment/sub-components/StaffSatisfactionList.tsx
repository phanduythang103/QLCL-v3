import React from 'react';
import { Calendar, User, Eye, Edit2, Trash2, Plus, BarChart3, Briefcase } from 'lucide-react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

interface Props {
  surveys: StaffSatisfactionSurvey[];
  loading: boolean;
  onEdit: (data: StaffSatisfactionSurvey) => void;
  onView: (data: StaffSatisfactionSurvey) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const StaffSatisfactionList: React.FC<Props> = ({ surveys, loading, onEdit, onView, onDelete, onAddNew }) => {
  const calculatePercentage = (s: StaffSatisfactionSurvey) => {
    let totalScore = 0;
    let validCount = 0;
    // Iterate through q1 to q13
    for (let i = 1; i <= 13; i++) {
      const val = (s as any)[`q${i}`];
      if (val && val > 0) {
        totalScore += val;
        validCount++;
      }
    }
    if (validCount === 0) return 0;
    return Math.round((totalScore / (validCount * 5)) * 100);
  };

  const getScoreColor = (percent: number) => {
    if (percent >= 90) return 'text-emerald-600 bg-emerald-50';
    if (percent >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'doctor': return 'Bác sĩ';
      case 'nurse': return 'Điều dưỡng/KTV';
      case 'other': return 'Nhân viên khác';
      default: return 'N/A';
    }
  };

  const getBlockLabel = (block: string) => {
    switch (block) {
      case 'clinical': return 'Lâm sàng';
      case 'subclinical': return 'Cận lâm sàng';
      case 'admin': return 'Hành chính';
      default: return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#009900]/20 border-t-[#009900] rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest animate-pulse">Đang tải danh sách khảo sát...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Danh sách khảo sát nhân viên</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Tổng số: {surveys.length} phiếu</p>
        </div>
        <button 
          onClick={onAddNew}
          className="flex items-center gap-2 px-6 py-3 bg-[#009900] text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} /> Thêm phiếu khảo sát
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
                <th className="px-4 md:px-6 py-5 text-center">Mức độ hài lòng (%)</th>
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
                  </td>
                </tr>
              ) : (
                surveys.map((s) => {
                  const percent = calculatePercentage(s);
                  const d = s.ngay_khao_sat ? new Date(s.ngay_khao_sat) : new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const dateStr = d.toLocaleDateString('vi-VN');
                  const fullCode = `NVYT-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
                  
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
