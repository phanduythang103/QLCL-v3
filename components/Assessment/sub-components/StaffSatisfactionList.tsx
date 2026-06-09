import React from 'react';
import { Calendar, User, Eye, Edit2, Trash2, Plus, BarChart3, Briefcase, Download, Trophy, Users } from 'lucide-react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';
import DateRangeFilter, { DateFilterState } from '../../DateRangeFilter';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  surveys: StaffSatisfactionSurvey[];
  loading: boolean;
  onEdit: (data: StaffSatisfactionSurvey) => void;
  onView: (data: StaffSatisfactionSurvey) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  dateFilter: DateFilterState;
  setDateFilter: (filter: DateFilterState) => void;
  blockFilter: string;
  setBlockFilter: (block: string) => void;
  positionFilter: string;
  setPositionFilter: (pos: string) => void;
  totalSurveys: number;
  avgSatisfaction: number;
}

export const StaffSatisfactionList: React.FC<Props> = ({
  surveys, loading, onEdit, onView, onDelete, onAddNew,
  dateFilter, setDateFilter, blockFilter, setBlockFilter,
  positionFilter, setPositionFilter, totalSurveys, avgSatisfaction
}) => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin')
  );

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

  const handleExportExcel = () => {
    if (surveys.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    const getBlockLabel = (b: string) => {
      switch (b) {
        case 'clinical': return 'Khối Lâm sàng';
        case 'subclinical': return 'Khối Cận lâm sàng';
        case 'admin': return 'Khối Hành chính';
        default: return b;
      }
    };

    const getPositionLabel = (p: string) => {
      switch (p) {
        case 'doctor': return 'Bác sĩ';
        case 'nurse': return 'Điều dưỡng/Kỹ thuật viên';
        case 'contract': return 'Hợp đồng lao động';
        default: return p;
      }
    };

    const data = surveys.map((s, index) => {
      const percent = calculatePercentage(s);
      const d = s.ngay_khao_sat ? new Date(s.ngay_khao_sat) : new Date();
      return {
        'STT': index + 1,
        'Ngày khảo sát': d.toLocaleDateString('vi-VN'),
        'Khối': getBlockLabel(s.block),
        'Vị trí': getPositionLabel(s.position),
        'Số năm công tác': s.years || 0,
        'Mức độ hài lòng (%)': percent,
        ...Array.from({ length: 13 }, (_, i) => ({
          [`Câu ${i + 1}`]: (s as any)[`q${i + 1}`] || 0
        })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Khảo sát NVYT');

    // Auto-size columns
    const maxWidths = Object.keys(data[0] || {}).map((key: string) => {
      const lengths = data.map((row: any) => String(row[key as keyof typeof row]).length);
      return { wch: Math.max(key.length, ...lengths) + 2 };
    });
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Khao_sat_NVYT_${new Date().getTime()}.xlsx`);
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-emerald-50 rounded-lg md:rounded-2xl flex items-center justify-center text-[#009900] group-hover:scale-110 transition-transform shrink-0">
            <Users size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Số phiếu</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{totalSurveys}</h3>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-amber-50 rounded-lg md:rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shrink-0">
            <Trophy size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Hài lòng</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{avgSatisfaction}%</h3>
          </div>
        </div>
      </div>

      {/* Header Summary & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
          <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight hidden md:block shrink-0">Bộ lọc:</h3>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />

            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-[10px] md:text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#009900] transition-all"
            >
              <option value="all">Tất cả Khối</option>
              <option value="clinical">Khối Lâm sàng</option>
              <option value="subclinical">Khối Cận lâm sàng</option>
              <option value="admin">Khối Hành chính</option>
            </select>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-[10px] md:text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#009900] transition-all"
            >
              <option value="all">Tất cả Vị trí</option>
              <option value="doctor">Bác sĩ</option>
              <option value="nurse">Điều dưỡng/KTV</option>
              <option value="contract">Hợp đồng lao động</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
          {isAdmin && (
          <button
            onClick={handleExportExcel}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg shadow-blue-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Download size={16} className="md:w-[18px]" /> <span className="md:inline">Xuất Excel</span>
          </button>
          )}
          <button
            onClick={onAddNew}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-[#009900] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg shadow-emerald-100 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus size={16} className="md:w-[18px]" /> <span className="md:inline">Thêm phiếu</span>
          </button>
        </div>
      </div>

      {/* Modern Table List */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="px-4 md:px-6 py-5 hidden md:table-cell">Ngày khảo sát</th>
                <th className="px-4 md:px-6 py-5">Mã khảo sát</th>
                <th className="px-4 md:px-6 py-5 text-center">Hài lòng (%)</th>
                <th className="px-4 md:px-6 py-5 text-right uppercase hidden md:table-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <BarChart3 size={48} />
                      <p className="text-sm font-black uppercase">Chưa có dữ liệu</p>
                    </div>
                  </td>
                </tr>
              ) : (
                surveys.map((s) => {
                  const percent = calculatePercentage(s);
                  const d = s.ngay_khao_sat ? new Date(s.ngay_khao_sat) : new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const dateStr = d.toLocaleDateString('vi-VN');
                  const fullCode = `NVYT-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => onView(s)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 md:px-6 py-5 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg text-[#009900]">
                            <Calendar size={16} />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] md:text-xs font-black text-[#009900] tracking-tight bg-emerald-50 px-2 md:px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                            {fullCode}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 md:hidden">{dateStr}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-center font-black">
                        <div className="flex justify-center">
                          <div className={`px-2 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black ring-1 ring-inset ${getScoreColor(percent)} ring-current/20`}>
                            {percent}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-right hidden md:table-cell">
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-[#009900] hover:bg-emerald-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                          <span>Chi tiết</span>
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
