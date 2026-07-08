import React from 'react';
import { Plus, Edit2, Eye, Trash2, Calendar, User, Star, Download, Trophy, Users, BarChart3, Activity } from 'lucide-react';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';
import DateRangeFilter, { DateFilterState } from '../../DateRangeFilter';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  records: KsMeSinhConRecord[];
  loading: boolean;
  error: string | null;
  onAddNew: () => void;
  onEdit: (rec: KsMeSinhConRecord) => void;
  onView: (rec: KsMeSinhConRecord) => void;
  onDelete: (id: string) => void;
  dateFilter: DateFilterState;
  setDateFilter: (filter: DateFilterState) => void;
  birthMethodFilter: string;
  setBirthMethodFilter: (method: string) => void;
  totalRecords: number;
  avgSatisfaction: number;
}

export const KsMeSinhConList: React.FC<Props> = ({
  records, loading, error, onAddNew, onEdit, onView, onDelete,
  dateFilter, setDateFilter,
  birthMethodFilter, setBirthMethodFilter,
  totalRecords, avgSatisfaction
}) => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin')
  );

  const getBirthMethodLabel = (method?: number) => {
    switch (method) {
      case 1: return 'Đẻ thường';
      case 2: return 'Mổ cấp cứu';
      case 3: return 'Mổ chuẩn bị';
      case 4: return 'Khác';
      default: return 'N/A';
    }
  };

  const handleExportExcel = () => {
    if (records.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    const data = records.map((r, index) => {
      return {
        'STT': index + 1,
        'Ngày khảo sát': r.survey_date || '',
        'Mã người mẹ': r.mother_id || '',
        'Khoa': r.departments || '',
        'Tuổi': r.age || 0,
        'Sử dụng BHYT': r.bhyt === 1 ? 'Có' : 'Không',
        'Cách sinh': getBirthMethodLabel(r.birth_method),
        'Mức hài lòng chung': r.overall_satisfaction || 5,
        'Tỷ lệ hài lòng (%)': r.satisfaction_percent || 0,
        'Ý kiến thêm': r.note || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MeSinhCon');
    XLSX.writeFile(workbook, `MeSinhCon_${new Date().getTime()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase text-xs">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 bg-red-50 text-red-600 rounded-3xl border border-red-100 text-center">
        <p className="font-black uppercase text-xs">Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-emerald-50 rounded-lg md:rounded-2xl flex items-center justify-center text-[#059669] group-hover:scale-110 transition-transform shrink-0">
            <Users size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Số phiếu</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{totalRecords}</h3>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6 group hover:-translate-y-1 transition-all">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-amber-50 rounded-lg md:rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shrink-0">
            <Trophy size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Hài lòng TB</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{avgSatisfaction}%</h3>
          </div>
        </div>
      </div>

      {/* Header Summary & Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto">
          <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight hidden md:block shrink-0">Bộ lọc:</h3>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
            <select
              value={birthMethodFilter}
              onChange={(e) => setBirthMethodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-[10px] md:text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#059669] transition-all"
            >
              <option value="all">Hình thức sinh</option>
              <option value="1">Đẻ thường</option>
              <option value="2">Mổ cấp cứu</option>
              <option value="3">Mổ chuẩn bị</option>
              <option value="4">Khác</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {isAdmin && (
          <button
            onClick={handleExportExcel}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Download size={16} /><span className="md:inline">Xuất Excel</span>
          </button>
          )}
          <button
            onClick={onAddNew}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-[#059669] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Plus size={16} /><span className="md:inline">Thêm phiếu mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="px-4 md:px-6 py-5 hidden md:table-cell">Ngày khảo sát</th>
                <th className="px-4 md:px-6 py-5">Mã người mẹ / Khoa</th>
                <th className="px-4 md:px-6 py-5 text-center font-black">Hài lòng (%)</th>
                <th className="px-4 md:px-6 py-5 text-right uppercase hidden md:table-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <BarChart3 size={48} />
                      <p className="text-sm font-black uppercase">Chưa có dữ liệu</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((rec) => {
                  const percent = rec.satisfaction_percent || 0;
                  const getScoreColor = (p: number) => {
                    if (p >= 90) return 'text-emerald-600 bg-emerald-50';
                    if (p >= 70) return 'text-amber-600 bg-amber-50';
                    return 'text-rose-600 bg-rose-50';
                  };

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => onView(rec)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 md:px-6 py-5 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg text-[#059669]"><Calendar size={16} /></div>
                          <span className="text-sm font-bold text-slate-700">{rec.survey_date}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Mẹ: {rec.mother_id}</span>
                          <span className="text-[10px] font-black text-[#059669] uppercase tracking-wider">{rec.departments}</span>
                          <span className="text-[9px] font-bold text-slate-400 md:hidden">{rec.survey_date}</span>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-center">
                        <div className="flex justify-center">
                          <div className={`px-2 md:px-4 py-1.5 rounded-full text-[10px] font-black ring-1 ring-inset ${getScoreColor(percent)} ring-current/20`}>
                            {percent}%
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-5 text-right hidden md:table-cell">
                        <div className="flex justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onView(rec); }} className="p-2 text-slate-400 hover:text-[#059669] transition-colors"><Eye size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onEdit(rec); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(rec.id!); }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                        </div>
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
