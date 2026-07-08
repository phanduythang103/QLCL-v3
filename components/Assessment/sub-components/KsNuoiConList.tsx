import React from 'react';
import { Calendar, Eye, Edit2, Trash2, Plus, Download, Trophy, Users, BarChart3, Baby } from 'lucide-react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';
import DateRangeFilter, { DateFilterState } from '../../DateRangeFilter';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  records: KsNuoiConRecord[];
  loading: boolean;
  error?: string | null;
  onAddNew: () => void;
  onEdit: (rec: KsNuoiConRecord) => void;
  onView: (rec: KsNuoiConRecord) => void;
  onDelete: (id: string) => void;
  dateFilter: DateFilterState;
  setDateFilter: (filter: DateFilterState) => void;
  deptFilter: string;
  setDeptFilter: (dept: string) => void;
  deliveryFilter: string;
  setDeliveryFilter: (d: string) => void;
  departments: string[];
  totalRecords: number;
  normalBirthPercent: number;
}

export const KsNuoiConList: React.FC<Props> = ({
  records, loading, error, onAddNew, onEdit, onView, onDelete,
  dateFilter, setDateFilter, deptFilter, setDeptFilter,
  deliveryFilter, setDeliveryFilter, departments,
  totalRecords, normalBirthPercent
}) => {
  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin')
  );

  const handleExportExcel = () => {
    if (records.length === 0) {
      alert('Không có dữ liệu để xuất.');
      return;
    }

    const data = records.map((r, index) => {
      const d = r.survey_date ? new Date(r.survey_date) : new Date();
      return {
        'STT': index + 1,
        'Ngày khảo sát': d.toLocaleDateString('vi-VN'),
        'Bệnh viện': r.hospital || '',
        'Khoa': r.department || '',
        'Mã người bệnh': r.patient_id || '',
        'Tuổi': r.age || 0,
        'HÌnh thức sinh': r.delivery_type === 1 ? 'Đẻ thường' : 'Mổ đẻ',
        'Ngày sinh trẻ': r.baby_birth_date ? new Date(r.baby_birth_date).toLocaleDateString('vi-VN') : '',
        'Bú hoàn toàn (tháng)': r.exclusive_months || 0,
        'Kiến nghị': r.suggestions || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NCBSM');
    XLSX.writeFile(workbook, `NCBSM_${new Date().getTime()}.xlsx`);
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
    return <p className="text-red-600 text-center mt-4">{error}</p>;
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
          <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 rounded-lg md:rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shrink-0">
            <Baby size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Đẻ thường (%)</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{normalBirthPercent}%</h3>
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
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-[10px] md:text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#059669] transition-all"
            >
              <option value="all">Tất cả Khoa</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-100 text-slate-700 text-[10px] md:text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#059669] transition-all"
            >
              <option value="all">Hình thức sinh</option>
              <option value="1">Đẻ thường</option>
              <option value="2">Mổ đẻ</option>
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
            <Plus size={16} /><span className="md:inline">Thêm phiếu</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="px-4 md:px-6 py-5 hidden md:table-cell">Ngày khảo sát</th>
                <th className="px-4 md:px-6 py-5">Bệnh viện / Khoa</th>
                <th className="px-4 md:px-6 py-5 text-center">Hình thức sinh</th>
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
                records.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onView(rec)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 md:px-6 py-5 hidden md:table-cell">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-[#059669]"><Calendar size={16} /></div>
                        <span className="text-sm font-bold text-slate-700">{rec.survey_date ? new Date(rec.survey_date).toLocaleDateString('vi-VN') : ''}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 md:py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-800">{rec.hospital}</span>
                        <span className="text-[10px] font-black text-[#059669] uppercase tracking-wider">{rec.department}</span>
                        <span className="text-[9px] font-bold text-slate-400 md:hidden">{rec.survey_date ? new Date(rec.survey_date).toLocaleDateString('vi-VN') : ''}</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <div className={`px-2 md:px-4 py-1.5 rounded-full text-[10px] font-black ${rec.delivery_type === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {rec.delivery_type === 1 ? 'Đẻ thường' : 'Mổ đẻ'}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
