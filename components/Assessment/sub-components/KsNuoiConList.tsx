import React from 'react';
import { CheckCircle2, Calendar, Eye, Edit2, Trash2, Plus } from 'lucide-react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';

interface Props {
  records: KsNuoiConRecord[];
  loading: boolean;
  error?: string | null;
  onAddNew: () => void;
  onEdit: (rec: KsNuoiConRecord) => void;
  onView: (rec: KsNuoiConRecord) => void;
  onDelete: (id: string) => void;
}

export const KsNuoiConList: React.FC<Props> = ({
  records,
  loading,
  error,
  onAddNew,
  onEdit,
  onView,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#009900]/20 border-t-[#009900] rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase text-xs">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-center mt-4">{error}</p>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Danh sách khảo sát nuôi con bằng sữa mẹ</h3>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-6 py-3 bg-[#009900] text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <Plus size={18} /> Thêm phiếu
        </button>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-wider">
              <th className="px-4 md:px-6 py-5">Ngày khảo sát</th>
              <th className="px-4 md:px-6 py-5">Bệnh viện</th>
              <th className="px-4 md:px-6 py-5">Khoa</th>
              <th className="px-4 md:px-6 py-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <Calendar size={48} />
                    <p className="text-sm font-black uppercase">Chưa có dữ liệu khảo sát</p>
                  </div>
                </td>
              </tr>
            ) : (
              records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 md:px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg text-[#009900]"><Calendar size={16} /></div>
                      <span className="text-sm font-bold text-slate-700">{rec.survey_date ? new Date(rec.survey_date).toLocaleDateString('vi-VN') : ''}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-5"><span className="text-sm text-slate-800">{rec.hospital}</span></td>
                  <td className="px-4 md:px-6 py-5"><span className="text-sm text-slate-800">{rec.department}</span></td>
                  <td className="px-4 md:px-6 py-5 text-right space-x-2">
                    <button onClick={() => onView(rec)} className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-[#009900] hover:bg-emerald-50 rounded-xl transition-all text-[10px] uppercase tracking-wider" title="Xem chi tiết"><Eye size={16} /></button>
                    <button onClick={() => onEdit(rec)} className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-[#009900] hover:bg-emerald-50 rounded-xl transition-all text-[10px] uppercase tracking-wider" title="Chỉnh sửa"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(rec.id!)} className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-[#009900] hover:bg-emerald-50 rounded-xl transition-all text-[10px] uppercase tracking-wider" title="Xóa"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
