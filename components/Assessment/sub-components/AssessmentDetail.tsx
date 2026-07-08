import React, { useMemo, useState } from 'react';
import { Printer, XCircle, ChevronDown, ChevronRight, CheckCircle2, XCircle as XIcon, Minus, Edit2 } from 'lucide-react';
import { KqDanhGia83, AssessmentSheet } from '../types';
import { calculateAssessment83Scores } from '../../../utils/assessment83Scoring';

interface AssessmentDetailProps {
  phieuId: string;
  data: KqDanhGia83[];
  onClose: () => void;
  onEdit?: () => void;
  sheetInfo?: AssessmentSheet;
}

const naturalSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
const formatScore = (score: number | null | undefined) =>
  score === null || score === undefined ? null : Number(score.toFixed(2));

const normalizeStatus = (value?: string) => (value || '').trim().toLowerCase();

const getStatusType = (value?: string) => {
  const status = normalizeStatus(value);
  if (status === 'đạt') return 'passed';
  if (status === 'chưa đạt' || status === 'không đạt') return 'failed';
  if (status === 'không đánh giá' || status === 'k.đg') return 'notEvaluated';
  return 'unknown';
};

const StatusBadge: React.FC<{ status?: string; compact?: boolean }> = ({ status, compact }) => {
  const commonClass = compact
    ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-black text-[9px] uppercase'
    : 'inline-flex items-center gap-1 px-2 py-1 rounded-lg font-black text-[10px] uppercase';
  const statusType = getStatusType(status);

  if (statusType === 'passed') return <span className={`${commonClass} bg-emerald-100 text-emerald-700`}><CheckCircle2 size={10} /> Đạt</span>;
  if (statusType === 'failed') return <span className={`${commonClass} bg-red-100 text-red-700`}><XIcon size={10} /> Chưa đạt</span>;
  if (statusType === 'notEvaluated') return <span className={`${commonClass} bg-slate-100 text-slate-500`}><Minus size={10} /> K.ĐG</span>;
  return <span className={`${commonClass} bg-amber-100 text-amber-700`}>{status?.trim() || 'Đã lưu'}</span>;
};

export const AssessmentDetail: React.FC<AssessmentDetailProps> = ({
  phieuId, data, onClose, onEdit, sheetInfo
}) => {
  const [expandedTCs, setExpandedTCs] = useState<Record<string, boolean>>({});

  const toggleTC = (tcKey: string) => {
    setExpandedTCs(prev => ({ ...prev, [tcKey]: !prev[tcKey] }));
  };

  const hierarchyData = useMemo(() => {
    const hierarchy: any = {};
    data.forEach(item => {
      const p = item.phan || "Khác";
      const c = item.chuong || "Khác";
      const tc = item.tieu_chi || "Khác";

      if (!hierarchy[p]) hierarchy[p] = { chuongs: {} };
      if (!hierarchy[p].chuongs[c]) hierarchy[p].chuongs[c] = { tieuChis: {} };
      if (!hierarchy[p].chuongs[c].tieuChis[tc]) hierarchy[p].chuongs[c].tieuChis[tc] = [];

      hierarchy[p].chuongs[c].tieuChis[tc].push(item);
    });

    Object.values(hierarchy).forEach((phan: any) => {
      Object.values(phan.chuongs).forEach((chuong: any) => {
        Object.values(chuong.tieuChis).forEach((items: any) => {
          items.sort((a: KqDanhGia83, b: KqDanhGia83) =>
            naturalSort(a.ma_tieu_muc || '', b.ma_tieu_muc || '')
          );
        });
      });
    });

    return hierarchy;
  }, [data]);

  const allCriteriaKeys = useMemo(() => Object.keys(hierarchyData).flatMap(phan =>
    Object.keys(hierarchyData[phan].chuongs).flatMap(chuong =>
      Object.keys(hierarchyData[phan].chuongs[chuong].tieuChis).map(tc => `${phan}|${chuong}|${tc}`)
    )
  ), [hierarchyData]);

  const allExpanded = allCriteriaKeys.length > 0 && allCriteriaKeys.every(key => expandedTCs[key]);

  const toggleAllCriteria = () => {
    setExpandedTCs(allExpanded ? {} : Object.fromEntries(allCriteriaKeys.map(key => [key, true])));
  };

  const scoreSummary = useMemo(() => {
    const criteria = data.map(item => ({
      phan: item.phan,
      chuong: item.chuong,
      tieu_chi: item.tieu_chi,
      muc: item.nhom || item.muc_dat_duoc,
      ma_tieu_muc: item.ma_tieu_muc
    }));

    return calculateAssessment83Scores(criteria, data, { includeUnevaluatedAsLevelOne: true }).parts.map(part => ({
      ...part,
      level: part.average,
      chapters: part.chapters.map(chapter => ({
        ...chapter,
        level: chapter.average
      }))
    }));
  }, [data]);

  return (
    <div className="bg-white md:rounded-2xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in duration-500 min-h-[600px] overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 md:px-6 md:py-4 bg-[#059669] text-white flex justify-between items-center gap-3 shadow-md print:hidden md:rounded-t-2xl">
          <div className="flex min-w-0 items-center gap-3">
            <Printer size={20} className="shrink-0" />
            <div className="min-w-0">
              <h3 className="font-black uppercase text-xs md:text-sm tracking-wide md:tracking-widest flex flex-wrap items-center gap-2">
                Chi tiết chấm điểm tiêu chí
                {sheetInfo?.nhom && (
                  <span className="bg-yellow-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                    PHIẾU CHẤM ĐIỂM TỔ
                  </span>
                )}
              </h3>
              <p className="text-[10px] opacity-80 font-bold uppercase truncate">{sheetInfo?.don_vi_duoc_danh_gia} - {sheetInfo?.ngay_danh_gia}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onEdit && (
              <button onClick={onEdit} className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-[10px] font-black uppercase transition-colors hover:bg-white/25" aria-label="Sửa phiếu">
                <Edit2 size={16} />
                <span className="hidden sm:inline">Sửa phiếu</span>
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors" aria-label="Đóng chi tiết">
              <XCircle size={22} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-10 bg-white print:p-0 print:overflow-visible">
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-12">
            {/* Report Header */}
            <div className="space-y-4 border-b border-slate-100 pb-6 md:text-center md:pb-10">
              <h1 className="text-lg md:text-3xl font-black text-slate-900 uppercase leading-tight">Kết quả đánh giá chất lượng bệnh viện</h1>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500 uppercase md:flex md:justify-center md:gap-8 md:text-sm md:tracking-widest">
                <p className="col-span-2 rounded-xl bg-slate-50 p-3 md:col-span-1 md:bg-transparent md:p-0">Đơn vị: <span className="block mt-1 text-[#059669] md:inline md:mt-0">{sheetInfo?.don_vi_duoc_danh_gia}</span></p>
                <p className="rounded-xl bg-slate-50 p-3 md:bg-transparent md:p-0">Ngày: <span className="block mt-1 text-[#059669] md:inline md:mt-0">{sheetInfo?.ngay_danh_gia}</span></p>
                <p className="rounded-xl bg-emerald-50 p-3 md:bg-transparent md:p-0">Điểm TB: <span className="block mt-1 text-lg text-[#059669] md:inline md:mt-0 md:text-inherit">{sheetInfo?.score || '0'}</span></p>
              </div>
            </div>

            {/* Hierarchy Data */}
            <div className="space-y-5 md:space-y-8">
              <div className="flex items-center justify-between gap-3 print:hidden">
                <p className="text-xs font-bold text-slate-500">{data.length} nội dung đã lưu</p>
                <button
                  type="button"
                  onClick={toggleAllCriteria}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase text-[#059669] shadow-sm transition-colors hover:bg-emerald-50"
                >
                  {allExpanded ? 'Thu gọn tất cả' : 'Mở tất cả nội dung'}
                </button>
              </div>
              {Object.keys(hierarchyData).sort().map(phan => {
                const phanScore = scoreSummary.find(item => item.name === phan);
                return (
                <div key={phan} className="space-y-4">
                  <h2 className="bg-[#059669] text-white px-4 py-3 md:px-6 rounded-xl font-black uppercase text-xs md:text-sm tracking-wide md:tracking-widest shadow-lg flex items-center justify-between gap-3">
                    <span>{phan}</span>
                    <span className="shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-[10px]">
                      {phanScore?.level === null || phanScore?.level === undefined ? 'Chưa chấm' : `Đạt mức ${formatScore(phanScore.level)}`}
                    </span>
                  </h2>
                  <div className="space-y-5 md:pl-4 md:space-y-6">
                    {Object.keys(hierarchyData[phan].chuongs).sort().map(chuong => {
                      const chapterScore = phanScore?.chapters.find(item => item.name === chuong);
                      return (
                      <div key={chuong} className="space-y-3">
                        <h3 className="bg-[#059669] text-white font-black uppercase text-xs rounded-xl px-4 py-3 leading-relaxed flex items-center justify-between gap-3 shadow-sm">
                          <span>{chuong}</span>
                          <span className="shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-[10px]">
                            {chapterScore?.level === null || chapterScore?.level === undefined ? 'Chưa chấm' : `Đạt mức ${formatScore(chapterScore.level)}`}
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {Object.keys(hierarchyData[phan].chuongs[chuong].tieuChis).sort().map(tc => {
                            const items = hierarchyData[phan].chuongs[chuong].tieuChis[tc];
                            const tcKey = `${phan}|${chuong}|${tc}`;
                            const isExpanded = expandedTCs[tcKey];
                            const criterionScore = chapterScore?.criteria.find(item => item.name === tc);
                            return (
                              <div key={tc} className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                                <button
                                  onClick={() => toggleTC(tcKey)}
                                className="w-full flex items-start justify-between gap-3 bg-[#059669] px-4 py-4 text-white transition-colors hover:bg-[#007700] md:px-5"
                              >
                                  <span className="font-black text-xs uppercase text-left leading-relaxed flex-1">
                                    {tc}
                                    <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[9px] text-white/80">{items.length} nội dung</span>
                                  </span>
                                  <span className="shrink-0 rounded-md bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase text-white">
                                    {criterionScore?.level === null || criterionScore?.level === undefined ? 'Chưa chấm' : `Đạt mức ${formatScore(criterionScore.level)}`}
                                  </span>
                                  {isExpanded ? <ChevronDown size={18} className="shrink-0" /> : <ChevronRight size={18} className="shrink-0" />}
                                </button>

                                {isExpanded && (
                                  <div className="px-3 pb-3 md:px-5 md:pb-5 animate-in slide-in-from-top-2 duration-300">
                                    <div className="hidden md:block print:block">
                                    <table className="w-full text-[11px]">
                                      <thead>
                                        <tr className="text-slate-400 font-bold uppercase border-b border-slate-200">
                                          <th className="py-2 text-left w-12">Mức</th>
                                          <th className="py-2 text-left">Tiêu chí con</th>
                                          <th className="py-2 text-center w-24">Kết quả</th>
                                          <th className="py-2 text-left">Ghi chú / Minh chứng</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {items.map((item: KqDanhGia83) => (
                                          <tr key={item.ma_tieu_muc} className="group">
                                            <td className="py-3 font-black text-[#059669]">{item.nhom}</td>
                                            <td className="py-3 font-bold text-slate-600 pr-4">{item.tieu_muc}</td>
                                            <td className="py-3 text-center">
                                              <StatusBadge status={item.dat_muc} compact />
                                            </td>
                                            <td className="py-3 text-slate-500 italic text-[10px]">
                                              {item.ghi_chu || '-'}
                                              {item.hinh_anh_minh_chung && item.hinh_anh_minh_chung.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                  {item.hinh_anh_minh_chung.map((img: string, idx: number) => (
                                                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="text-[8px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">Ảnh {idx + 1}</a>
                                                  ))}
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    </div>

                                    <div className="space-y-3 md:hidden print:hidden">
                                      {items.map((item: KqDanhGia83) => (
                                        <div key={item.ma_tieu_muc} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase text-[#059669]">{item.nhom || 'Mức 1'}</span>
                                              <p className="mt-2 text-[13px] font-bold leading-relaxed text-slate-700">{item.tieu_muc}</p>
                                            </div>
                                            <div className="shrink-0">
                                              <StatusBadge status={item.dat_muc} />
                                            </div>
                                          </div>
                                          {item.ghi_chu && (
                                            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium italic text-amber-800">
                                              {item.ghi_chu}
                                            </div>
                                          )}
                                          {item.hinh_anh_minh_chung && item.hinh_anh_minh_chung.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              {item.hinh_anh_minh_chung.map((img: string, idx: number) => (
                                                <a key={idx} href={img} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase text-blue-600">
                                                  Ảnh {idx + 1}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
