import React from 'react';
import { Calendar, User, Eye, Edit2, Trash2, Plus, BarChart3, Home } from 'lucide-react';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';

interface Props {
  surveys: InpatientSurveyResponse[];
  loading: boolean;
  onEdit: (data: InpatientSurveyResponse) => void;
  onView: (data: InpatientSurveyResponse) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const InpatientSatisfactionList: React.FC<Props> = ({ surveys, loading, onEdit, onView, onDelete, onAddNew }) => {
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
