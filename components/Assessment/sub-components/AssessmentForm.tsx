import React, { useMemo } from 'react';
import {
  ChevronRight, ChevronDown, CheckCircle2, XCircle,
  RefreshCw, Minus, Camera
} from 'lucide-react';
import { Data83tc, DmDonVi, KqDanhGia83 } from '../types';
import { calculateAssessment83Scores } from '../../../utils/assessment83Scoring';

const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
const formatScore = (score: number | null | undefined) =>
  score === null || score === undefined ? null : Number(score.toFixed(2));

interface AssessmentFormProps {
  ngayDanhGia: string;
  setNgayDanhGia: (v: string) => void;
  nguoiDanhGia: string;
  setNguoiDanhGia: (v: string) => void;
  donViDuocDanhGia: string;
  setDonViDuocDanhGia: (v: string) => void;
  units: DmDonVi[];
  fontSize: number;
  setFontSize: (v: number) => void;
  groupedCriteria: any;
  results: Record<string, Partial<KqDanhGia83>>;
  onScoreChange: (ma: string, field: keyof Partial<KqDanhGia83>, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isAdmin: boolean;
  expandedPhan: string | null;
  setExpandedPhan: (v: string | null) => void;
  expandedChuong: string | null;
  setExpandedChuong: (v: string | null) => void;
  expandedTieuChi: string | null;
  setExpandedTieuChi: (v: string | null) => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  ngayDanhGia, setNgayDanhGia,
  nguoiDanhGia, setNguoiDanhGia,
  donViDuocDanhGia, setDonViDuocDanhGia,
  units, fontSize, setFontSize,
  groupedCriteria, results, onScoreChange, onSave, onCancel,
  saving, isAdmin,
  expandedPhan, setExpandedPhan,
  expandedChuong, setExpandedChuong,
  expandedTieuChi, setExpandedTieuChi
}) => {
  const scoreSummary = useMemo(() => {
    const criteria = Object.values(groupedCriteria).flatMap((phan: any) =>
      Object.values(phan.chuongs).flatMap((chuong: any) =>
        Object.values(chuong.tieuChis).flatMap(items => items as Data83tc[])
      )
    );
    const resultRows = Object.entries(results).map(([ma_tieu_muc, result]) => ({
      ma_tieu_muc,
      dat_muc: result.dat_muc
    }));

    return calculateAssessment83Scores(criteria, resultRows).parts.map(part => ({
      ...part,
      level: part.average,
      chapters: part.chapters.map(chapter => ({
        ...chapter,
        level: chapter.average
      }))
    }));
  }, [groupedCriteria, results]);

  const evaluationProgress = useMemo(() => {
    const criteriaGroups: string[][] = [];
    Object.values(groupedCriteria).forEach((phan: any) => {
      Object.values(phan.chuongs).forEach((chuong: any) => {
        Object.values(chuong.tieuChis).forEach((items: any) => {
          const itemCodes = (items as Data83tc[])
            .map(item => item.ma_tieu_muc)
            .filter((code): code is string => Boolean(code));
          if (itemCodes.length > 0) criteriaGroups.push(itemCodes);
        });
      });
    });

    const evaluated = criteriaGroups.filter(itemCodes =>
      itemCodes.some(code => !!results[code]?.dat_muc)
    ).length;

    return {
      evaluated,
      total: criteriaGroups.length,
      percent: criteriaGroups.length > 0 ? Math.round((evaluated / criteriaGroups.length) * 100) : 0
    };
  }, [groupedCriteria, results]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in slide-in-from-right duration-500 pb-32 md:pb-20">
      {/* Header Toolbar */}
      <div className="bg-white border border-slate-200 shadow-sm md:shadow-xl sticky top-0 z-20 -mx-3 px-4 py-3 md:mx-0 md:p-8 md:rounded-2xl">
        <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#009900]">Phiếu chấm điểm 83 tiêu chí</p>
            <p className="mt-0.5 text-xs font-bold text-slate-500">{evaluationProgress.evaluated}/{evaluationProgress.total} tiêu chí đã chấm</p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="shrink-0 rounded-xl bg-[#009900] px-3 py-2 text-[10px] font-black uppercase text-white shadow-md disabled:bg-slate-300"
          >
            {saving ? 'Đang lưu...' : 'Lưu phiếu'}
          </button>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100 md:hidden">
          <div className="h-full rounded-full bg-[#009900] transition-all duration-300" style={{ width: `${evaluationProgress.percent}%` }} />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-6">
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-end gap-2 md:gap-4 text-sm font-black uppercase text-slate-800">
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-[10px] text-slate-400">Ngày đánh giá</label>
            <input type="date" value={ngayDanhGia} onChange={(e) => setNgayDanhGia(e.target.value)} className="min-w-0 w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs md:px-4 md:py-2 md:text-sm focus:ring-2 ring-[#009900]" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label className="text-[10px] text-slate-400">Người đánh giá</label>
            <input type="text" value={nguoiDanhGia} onChange={(e) => setNguoiDanhGia(e.target.value)} className="min-w-0 w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs md:px-4 md:py-2 md:text-sm focus:ring-2 ring-[#009900]" />
          </div>
          <div className="col-span-2 flex min-w-0 flex-col gap-1 md:col-span-1">
            <label className="text-[10px] text-slate-400">Đơn vị được đánh giá</label>
            {isAdmin ? (
              <select value={donViDuocDanhGia} onChange={(e) => setDonViDuocDanhGia(e.target.value)} className="min-w-0 w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-xs md:px-4 md:py-2 md:text-sm focus:ring-2 ring-[#009900]">
                <option value="">-- Chọn đơn vị --</option>
                {units.map(u => <option key={u.ma_don_vi} value={`${u.ma_don_vi} - ${u.ten_don_vi}`}>{u.ma_don_vi} - {u.ten_don_vi}</option>)}
              </select>
            ) : (
              <input type="text" readOnly value={donViDuocDanhGia} className="min-w-0 w-full bg-slate-100 border-none rounded-xl px-3 py-2.5 text-xs text-slate-500 md:px-4 md:py-2 md:text-sm" />
            )}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button onClick={onCancel} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-slate-200 transition-all active:scale-95">Hủy</button>
          <button onClick={onSave} disabled={saving} className="bg-[#009900] text-white px-8 py-3 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-[#007700] transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-200">
            {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            Lưu phiếu ngay
          </button>
        </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="space-y-3 md:space-y-6" style={{ fontSize: `${fontSize}pt` }}>
        {Object.keys(groupedCriteria).sort().map(phan => {
          const isPhanOpen = expandedPhan === phan;
          const phanScore = scoreSummary.find(item => item.name === phan);
          return (
            <div key={phan} className="bg-white rounded-xl md:rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all mb-3 md:mb-4">
              <button
                onClick={() => setExpandedPhan(isPhanOpen ? null : phan)}
                className="w-full text-left bg-slate-50/80 hover:bg-slate-100/80 px-3 py-3.5 md:px-6 md:py-4 flex items-start md:items-center gap-2.5 md:gap-3 transition-colors border-b border-slate-100"
              >
                <div className={`mt-0.5 md:mt-0 ${isPhanOpen ? 'text-[#009900]' : 'text-slate-400'}`}>
                  {isPhanOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
                <h2 className="text-xs md:text-sm font-black uppercase text-slate-800 tracking-tight leading-relaxed flex-1">{phan}</h2>
                <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-black uppercase ${
                  phanScore?.level === null
                    ? 'bg-slate-200 text-slate-500'
                    : 'bg-[#009900] text-white'
                }`}>
                  {phanScore?.level === null ? 'Chưa chấm' : `Đạt mức ${formatScore(phanScore?.level)}`}
                </span>
                <div className="hidden md:block bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400">{Object.keys(groupedCriteria[phan].chuongs).length} Chương</div>
              </button>

              {isPhanOpen && (
                <div className="bg-white divide-y divide-slate-50">
                  {Object.keys(groupedCriteria[phan].chuongs).sort().map(chuong => {
                    const isChuongOpen = expandedChuong === chuong;
                    const chapterScore = phanScore?.chapters.find(item => item.name === chuong);
                    return (
                      <div key={chuong} className="md:ml-4 md:border-l-2 md:border-slate-100">
                        <button
                          onClick={() => setExpandedChuong(isChuongOpen ? null : chuong)}
                          className="px-3 py-3.5 md:px-6 md:py-3 flex items-start md:items-center gap-2.5 md:gap-3 w-full hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className={`mt-0.5 md:mt-0 ${isChuongOpen ? 'text-[#009900]' : 'text-slate-400'}`}>
                            {isChuongOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </div>
                          <h3 className="text-[11px] md:text-xs font-black text-slate-600 uppercase italic leading-relaxed flex-1">{chuong}</h3>
                          <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-black uppercase ${
                            chapterScore?.level === null
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {chapterScore?.level === null ? 'Chưa chấm' : `Đạt mức ${formatScore(chapterScore?.level)}`}
                          </span>
                        </button>

                        {isChuongOpen && (
                          <div className="divide-y divide-slate-50">
                            {Object.keys(groupedCriteria[phan].chuongs[chuong].tieuChis).sort().map(tieuChi => {
                              const isTCOpen = expandedTieuChi === tieuChi;
                              const tieuChiData = groupedCriteria[phan].chuongs[chuong].tieuChis[tieuChi];
                              const criterionScore = chapterScore?.criteria.find(item => item.name === tieuChi);
                              return (
                                <div key={tieuChi} className="md:ml-6 md:mb-2 border-t border-slate-100 md:border-t-0">
                                  <button
                                    onClick={() => setExpandedTieuChi(isTCOpen ? null : tieuChi)}
                                    className="w-full flex items-start md:items-center gap-2.5 md:gap-3 px-3 py-3.5 md:px-6 md:py-4 hover:bg-slate-50 transition-colors"
                                  >
                                    <div className={`mt-0.5 md:mt-0 ${isTCOpen ? 'text-[#009900]' : 'text-slate-400'}`}>
                                      {isTCOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                    <span className="font-bold text-[11px] md:text-xs text-[#009900] uppercase tracking-wide leading-relaxed text-left flex-1">{tieuChi}</span>
                                    <span className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-black uppercase ${
                                      criterionScore?.level === null
                                        ? 'bg-slate-100 text-slate-400'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    }`}>
                                      {criterionScore?.level === null ? 'Chưa chấm' : `Đạt mức ${formatScore(criterionScore?.level)}`}
                                    </span>
                                  </button>

                                  {isTCOpen && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                      <div className="bg-slate-50/80 px-3 py-2.5 md:px-10 md:py-3 border-y border-slate-100 flex items-center justify-between gap-3">
                                        <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Nội dung tiểu mục</span>
                                        <span className="text-[9px] font-bold text-slate-400 md:hidden">Chạm để chọn kết quả</span>
                                      </div>

                                      <div className="divide-y divide-slate-100">
                                        {(() => {
                                          let shouldHideSubsequent = false;
                                          return tieuChiData.map((tc: Data83tc) => {
                                            const currentRes = results[tc.ma_tieu_muc!];
                                            const isSelected = !!currentRes?.dat_muc;
                                            const isNotMet = currentRes?.dat_muc === "Chưa đạt";

                                            if (shouldHideSubsequent) return null;
                                            if (isNotMet) shouldHideSubsequent = true;

                                            return (
                                              <div key={tc.ma_tieu_muc} className={`p-3.5 md:p-6 md:pl-10 group transition-all ${isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50'}`}>
                                                <div className="flex items-start gap-3 md:gap-4">
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected && !isNotMet}
                                                    onChange={(e) => onScoreChange(tc.ma_tieu_muc!, 'dat_muc', e.target.checked ? 'Đạt' : 'Chưa đạt')}
                                                    className="hidden md:block mt-1 w-5 h-5 rounded border-slate-300 text-[#009900] focus:ring-[#009900] cursor-pointer"
                                                  />

                                                  <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="block rounded-md bg-slate-100 px-2 py-1 text-[10px] md:text-[11px] font-bold text-slate-500 font-mono">{tc.ma_tieu_muc}</span>
                                                      <span className="md:hidden rounded-md bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">{tc.muc}</span>
                                                    </div>
                                                    <p className="pt-1 font-bold text-[13px] md:text-[14px] text-slate-800 leading-relaxed md:leading-snug">
                                                      {tc.tieu_muc}
                                                    </p>

                                                    <div className="pt-3 md:pt-4 flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 md:gap-6">
                                                      <div className="grid grid-cols-3 md:flex bg-white shadow-sm border border-slate-200 p-1 rounded-xl gap-1">
                                                        {[
                                                          { label: "Đạt", value: "Đạt", icon: <CheckCircle2 size={12} />, color: "hover:bg-emerald-500 hover:text-white" },
                                                          { label: "Không đạt", value: "Chưa đạt", icon: <XCircle size={12} />, color: "hover:bg-red-500 hover:text-white" },
                                                          { label: "K.ĐG", value: "Không đánh giá", icon: <Minus size={12} />, color: "hover:bg-slate-400 hover:text-white" }
                                                        ].map((btn) => (
                                                          <button
                                                            key={btn.value}
                                                            type="button"
                                                            onClick={() => onScoreChange(tc.ma_tieu_muc!, 'dat_muc', btn.value)}
                                                            className={`min-h-11 md:min-h-0 justify-center flex items-center gap-1 px-1.5 md:gap-1.5 md:px-3 py-2 md:py-1.5 rounded-lg font-black text-[9px] uppercase transition-all ${currentRes?.dat_muc === btn.value
                                                                ? (btn.value === 'Đạt' ? 'bg-emerald-500 text-white' : btn.value === 'Chưa đạt' ? 'bg-red-500 text-white' : 'bg-slate-400 text-white')
                                                                : `text-slate-400 ${btn.color}`
                                                              }`}
                                                          >
                                                            {btn.icon} {btn.label}
                                                          </button>
                                                        ))}
                                                      </div>

                                                      {isNotMet && (
                                                        <div className="flex items-stretch md:items-center gap-2 md:gap-4 flex-1">
                                                          <div className="flex-1 flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2">
                                                            <textarea
                                                              rows={2}
                                                              value={currentRes?.ghi_chu || ""}
                                                              onChange={(e) => onScoreChange(tc.ma_tieu_muc!, 'ghi_chu', e.target.value)}
                                                              placeholder="Ghi chú minh chứng..."
                                                              className="flex-1 bg-transparent border-none text-[11px] text-slate-600 focus:ring-0 placeholder:italic p-0 resize-none"
                                                            />
                                                          </div>
                                                          <button type="button" aria-label="Thêm ảnh minh chứng" className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-400 hover:text-[#009900] transition-colors">
                                                            <Camera size={16} />
                                                          </button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="hidden md:block text-[14px] font-black text-[#009900] bg-slate-100 px-2 py-1 rounded-md">
                                                    {tc.muc}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden md:flex justify-end gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={onCancel} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-slate-200 transition-all active:scale-95">
          Hủy
        </button>
        <button onClick={onSave} disabled={saving} className="bg-[#009900] text-white px-10 py-3 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-[#007700] transition-all flex items-center gap-2 active:scale-95 disabled:bg-slate-200">
          {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
          {saving ? 'Đang lưu...' : 'Lưu phiếu chấm điểm'}
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button onClick={onCancel} className="min-h-12 flex-1 rounded-xl bg-slate-100 px-4 text-xs font-black uppercase text-slate-600 active:scale-[0.98]">
            Hủy
          </button>
          <button onClick={onSave} disabled={saving} className="min-h-12 flex-[2] rounded-xl bg-[#009900] px-4 text-xs font-black uppercase text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:bg-slate-300">
            <span className="flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
              {saving ? 'Đang lưu...' : `Lưu phiếu (${evaluationProgress.percent}%)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
