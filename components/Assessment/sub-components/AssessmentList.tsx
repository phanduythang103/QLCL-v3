import React from 'react';
import { FileText, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { AssessmentSheet } from '../types';

interface AssessmentListProps {
  sheetList: AssessmentSheet[];
  loading: boolean;
  uDept: string;
  isAdmin: boolean;
  currUserId?: string;
  onAddNew: () => void;
  onEdit: (sheet: AssessmentSheet) => void;
  onView: (sheet: AssessmentSheet) => void;
  onDelete: (id: string) => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  sheetList, loading, uDept, isAdmin, currUserId,
  onAddNew, onEdit, onView, onDelete
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-[12pt]">
        <div>
          <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-[#009900]" size={24} />
            Danh sách Phiếu đánh giá 83 tiêu chí
          </h3>
          <p className="text-slate-500 font-bold uppercase text-[10px]">Đơn vị: {uDept || 'Tất cả'}</p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 bg-[#009900] text-white px-6 py-2.5 rounded-xl hover:bg-[#007700] font-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} /> Tạo chấm điểm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-[12pt]">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#009900] text-white font-black uppercase text-table tracking-widest h-12">
            <tr>
              <th className="px-6 py-4">Ngày đánh giá</th>
              <th className="px-6 py-4">Đơn vị / Người đánh giá</th>
              <th className="px-6 py-4 text-center">Kết quả</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Đang tải danh sách...</td></tr>
            ) : sheetList.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">Chưa có dữ liệu.</td></tr>
            ) : (
              sheetList.map((sheet) => (
                <tr key={sheet.phieu_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {new Date(sheet.ngay_danh_gia).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-black uppercase">{sheet.don_vi_duoc_danh_gia}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{sheet.nguoi_danh_gia}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-[#009900]">
                      {sheet.score > 0 ? `Mức trung bình ${sheet.score}` : 'Chưa đánh giá'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onView(sheet)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Eye size={18} /></button>
                      {(isAdmin || sheet.nguoi_tao_id === currUserId) && (
                        <>
                          <button onClick={() => onEdit(sheet)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => onDelete(sheet.phieu_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group" title="Xóa">
                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                          </button>
                        </>
                      )}
                    </div>
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
