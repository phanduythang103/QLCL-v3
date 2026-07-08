import React from 'react';
import { ArrowLeft, FileText, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { AssessmentSheet } from '../types';

interface AssessmentListProps {
  sheetList: AssessmentSheet[];
  loading: boolean;
  uDept: string;
  isAdmin: boolean;
  currUserId?: string;
  currUserName?: string;
  assessmentType?: 'UNIT' | 'TEAM';
  onAddNew: () => void;
  onEdit: (sheet: AssessmentSheet) => void;
  onView: (sheet: AssessmentSheet) => void;
  onDelete: (id: string) => void;
  onBack?: () => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  sheetList, loading, uDept, isAdmin, currUserId, currUserName,
  assessmentType = 'UNIT',
  onAddNew, onEdit, onView, onDelete, onBack
}) => {
  const normalizeName = (value?: string | null) => (value || '').trim().toLowerCase();
  const canEditSheet = (sheet: AssessmentSheet) => {
    if (currUserId && sheet.nguoi_tao_id === currUserId) return true;
    return !sheet.nguoi_tao_id && normalizeName(sheet.nguoi_danh_gia) === normalizeName(currUserName);
  };

  const renderActions = (sheet: AssessmentSheet) => (
    <>
      <button aria-label="Xem phiếu" onClick={() => onView(sheet)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"><Eye size={18} /></button>
      {canEditSheet(sheet) && (
        <button aria-label="Sửa phiếu" onClick={() => onEdit(sheet)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"><Edit2 size={18} /></button>
      )}
      {canEditSheet(sheet) && (
        <button aria-label="Xóa phiếu" onClick={() => onDelete(sheet.phieu_id)} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors hover:bg-red-100">
          <Trash2 size={18} />
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm text-[12pt] md:flex-row md:justify-between md:items-center">
        <div className="w-full min-w-0">
          <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
            <FileText className="text-[#059669]" size={24} />
            {assessmentType === 'TEAM' ? 'Danh sách phiếu chấm điểm theo tổ' : 'Danh sách phiếu đánh giá 83 tiêu chí theo đơn vị'}
          </h3>
          <p className="text-slate-500 font-bold uppercase text-[10px]">
            {assessmentType === 'TEAM' ? 'Tổ đánh giá' : 'Đơn vị'}: {uDept || 'Tất cả'}
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="flex w-full items-center justify-center gap-2 bg-[#059669] text-white px-6 py-3 rounded-xl hover:bg-[#007700] font-black transition-all shadow-lg active:scale-95 md:w-auto md:shrink-0 md:py-2.5"
        >
          <Plus size={20} /> Tạo chấm điểm mới
        </button>
      </div>

      {onBack && (
        <div className="hidden justify-start md:flex">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#059669] active:scale-[0.98]"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-400">Đang tải danh sách...</div>
        ) : sheetList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center text-sm italic text-slate-400">Chưa có dữ liệu.</div>
        ) : sheetList.map(sheet => (
          <article key={sheet.phieu_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {new Date(sheet.ngay_danh_gia).toLocaleDateString('vi-VN')}
                </p>
                <h4 className="mt-1 line-clamp-2 text-sm font-black uppercase leading-relaxed text-slate-800">{sheet.don_vi_duoc_danh_gia}</h4>
                <p className="mt-1 truncate text-[10px] font-bold uppercase text-slate-500">{sheet.nguoi_danh_gia}</p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${assessmentType === 'TEAM' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {assessmentType === 'TEAM' ? `Theo tổ: ${sheet.nhom || uDept}` : 'Theo đơn vị'}
                </span>
              </div>
              <span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${sheet.score > 0 ? 'bg-emerald-50 text-[#059669]' : 'bg-slate-100 text-slate-500'}`}>
                {sheet.score > 0 ? `Mức ${sheet.score}` : 'Chưa chấm'}
              </span>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
              {renderActions(sheet)}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm text-[12pt] md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#059669] text-white font-black uppercase text-table tracking-widest h-12">
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
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      assessmentType === 'TEAM'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {assessmentType === 'TEAM' ? `Theo tổ: ${sheet.nhom || uDept}` : 'Theo đơn vị'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-[#059669]">
                      {sheet.score > 0 ? `Mức trung bình ${sheet.score}` : 'Chưa đánh giá'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">{renderActions(sheet)}</div>
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
