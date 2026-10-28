import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SurveyQuestion, SurveySection } from '../types/patientSatisfactionMauByt';

/**
 * Phần dùng chung cho phiếu khảo sát hài lòng người bệnh mẫu BYT
 * (nội trú & ngoại trú): kiểm tra câu chưa chấm và bảng kết quả cho phiếu mẫu cũ.
 */

/** Tìm câu chưa chấm đầu tiên (để báo cho người điền) */
export const firstUnanswered = (sections: SurveySection[], values: Record<string, any>): SurveyQuestion | undefined =>
  sections.flatMap(s => s.questions).find(q => values[q.code] == null);

// ── Trang chi tiết ──

const ScoreDots: React.FC<{ score: number | null | undefined; scale: number[] }> = ({ score, scale }) => (
  <div className="flex items-center justify-center gap-1.5 md:gap-3 font-sans py-1">
    {scale.map(val => (
      <span
        key={val}
        className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-slate-300 text-[9px] md:text-[11px] font-bold transition-all
          ${score === val ? 'bg-[#059669] text-white border-[#059669] ring-2 ring-[#059669]/20 scale-110 md:scale-125' : 'text-slate-400 opacity-60'}`}
      >
        {val}
      </span>
    ))}
  </div>
);

export const ScoreTable: React.FC<{
  sections: SurveySection[];
  data: Record<string, any>;
  /** Thang hiển thị; mẫu cũ có thêm 0 = không áp dụng */
  scale?: number[];
}> = ({ sections, data, scale = [1, 2, 3, 4, 5] }) => (
  <div className="border border-slate-900 overflow-hidden text-[11px] md:text-[13px]">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-slate-50/50">
          <th className="border border-slate-900 px-1 md:px-3 py-2 md:py-3 w-10 md:w-12 text-center uppercase font-black">Mã</th>
          <th className="border border-slate-900 px-2 md:px-4 py-2 md:py-3 text-left uppercase font-black tracking-tight">Nội dung khảo sát</th>
          <th className="border border-slate-900 px-2 md:px-6 py-2 md:py-3 w-32 md:w-56 text-center uppercase font-black">Mức độ hài lòng</th>
        </tr>
      </thead>
      <tbody>
        {sections.map(sec => (
          <React.Fragment key={sec.stt}>
            {sec.name && (
              <tr>
                <td className="border border-slate-900 bg-slate-50 font-black text-center px-1 py-2 md:py-3">{sec.stt}</td>
                <td className="border border-slate-900 bg-slate-50 font-black px-2 md:px-4 py-2 md:py-3 uppercase tracking-tight">{sec.name}</td>
                <td className="border border-slate-900 bg-slate-50"></td>
              </tr>
            )}
            {sec.questions.map(q => (
              <tr key={q.code}>
                <td className="border border-slate-900 text-center px-1 py-3 md:py-4 text-slate-600 font-bold uppercase">{q.code}</td>
                <td className="border border-slate-900 px-2 md:px-4 py-3 md:py-4 leading-relaxed font-medium text-slate-800">{q.text}</td>
                <td className="border border-slate-900 px-1 md:px-4 py-3 md:py-4">
                  <ScoreDots score={data[q.code]} scale={scale} />
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);

export const CheckOption: React.FC<{ checked: boolean; label: string }> = ({ checked, label }) => (
  <div className="flex items-center gap-1.5 md:gap-2">
    <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 shrink-0 ${checked ? 'bg-[#059669] border-[#059669]' : ''}`}>
      {checked && <CheckCircle2 size={10} className="text-white" />}
    </div>
    <span className={checked ? 'font-bold text-[#059669]' : 'text-slate-600'}>{label}</span>
  </div>
);
