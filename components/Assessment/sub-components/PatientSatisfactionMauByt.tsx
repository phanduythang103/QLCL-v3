import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { SCALE_OPTIONS, SurveyQuestion, SurveySection } from '../types/patientSatisfactionMauByt';

/**
 * Phần dùng chung cho phiếu khảo sát hài lòng người bệnh mẫu BYT
 * (nội trú & ngoại trú): khối chấm điểm 1-5 trên form và bảng kết quả ở trang chi tiết.
 */

export const ScaleLegend: React.FC = () => (
  <div className="bg-emerald-50/50 p-4 md:p-6 rounded-2xl border border-emerald-100 space-y-3">
    <div className="flex items-start gap-3">
      <Info className="text-emerald-600 shrink-0 mt-0.5" size={18} />
      <p className="italic text-emerald-800 text-sm font-medium leading-relaxed">
        Ông/Bà chọn một số từ 1 đến 5, tương ứng với mức độ hài lòng hoặc nhận xét từ rất kém đến rất tốt cho từng câu hỏi dưới đây:
      </p>
    </div>
    <div className="grid grid-cols-5 gap-1.5 md:gap-3">
      {SCALE_OPTIONS.map(o => (
        <div key={o.value} className="bg-white rounded-xl border border-emerald-100 p-1.5 md:p-3 text-center">
          <div className="w-7 h-7 md:w-8 md:h-8 mx-auto rounded-full bg-[#059669] text-white flex items-center justify-center text-sm font-black">{o.value}</div>
          <p className="mt-1 text-[9px] md:text-xs font-black text-slate-700 leading-tight">{o.label}</p>
          <p className="text-[9px] md:text-[11px] font-bold text-slate-400 leading-tight">hoặc: {o.alt}</p>
        </div>
      ))}
    </div>
  </div>
);

interface RatingSectionsProps {
  sections: SurveySection[];
  values: Record<string, any>;
  readOnly?: boolean;
  onChange: (code: string, value: number) => void;
}

export const RatingSections: React.FC<RatingSectionsProps> = ({ sections, values, readOnly, onChange }) => (
  <div className="space-y-10 mt-6">
    {sections.map(sec => (
      <div key={sec.stt} className="space-y-4">
        <div className="bg-[#059669] p-4 rounded-xl shadow-md border-l-8 border-emerald-900/30">
          <h4 className="text-sm font-black text-white uppercase tracking-wider">{sec.stt}. {sec.name}</h4>
        </div>

        <div className="divide-y divide-slate-100">
          {sec.questions.map(q => {
            const current = values[q.code];
            return (
              <div key={q.code} className="flex flex-col lg:flex-row lg:items-center gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex gap-3 flex-1">
                  <span className="min-w-[2.25rem] h-7 px-1 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-100 uppercase">
                    {q.code}
                  </span>
                  <p className="text-[16px] font-bold text-slate-900 leading-relaxed">{q.text}</p>
                </div>

                <div className="flex items-start justify-between lg:justify-end gap-1 w-full lg:w-auto">
                  {SCALE_OPTIONS.map(o => (
                    <div key={o.value} className="flex flex-col items-center gap-1 w-14 md:w-16">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => onChange(q.code, o.value)}
                        title={o.label}
                        className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center text-sm font-black ${current === o.value
                          ? 'bg-[#059669] border-[#059669] text-white shadow-lg scale-110'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-400'
                          }`}
                      >
                        {o.value}
                      </button>
                      <span className={`text-[9px] font-bold text-center leading-tight ${current === o.value ? 'text-[#059669]' : 'text-slate-400'}`}>
                        {o.alt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ))}
  </div>
);

/** Ô lựa chọn dạng nút (giới tính, BHYT, người trả lời...) */
export const ChoiceButtons: React.FC<{
  options: { value: any; label: string }[];
  value: any;
  readOnly?: boolean;
  onChange: (v: any) => void;
}> = ({ options, value, readOnly, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <button
        key={String(opt.value)}
        type="button"
        disabled={readOnly}
        onClick={() => onChange(opt.value)}
        className={`px-6 py-3 rounded-xl border transition-all text-xs font-black uppercase ${value === opt.value
          ? 'border-[#059669] bg-[#059669] text-white shadow-lg'
          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
          }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

/** Danh sách lựa chọn dọc có ô "Khác (ghi rõ)" */
export const ReturnIntentChoices: React.FC<{
  options: { value: string; label: string }[];
  otherValue: string;
  value?: string;
  otherText?: string;
  readOnly?: boolean;
  onChange: (v: string) => void;
  onOtherChange: (v: string) => void;
}> = ({ options, otherValue, value, otherText, readOnly, onChange, onOtherChange }) => (
  <div className="flex flex-col gap-2">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        disabled={readOnly}
        onClick={() => onChange(opt.value)}
        className={`p-4 rounded-2xl border text-left transition-all text-sm font-bold ${value === opt.value
          ? 'border-[#059669] bg-[#059669] text-white shadow-xl'
          : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:border-emerald-300'
          }`}
      >
        {opt.value}. {opt.label}
      </button>
    ))}
    {value === otherValue && (
      <input
        type="text"
        disabled={readOnly}
        value={otherText || ''}
        onChange={e => onOtherChange(e.target.value)}
        placeholder="Ghi rõ..."
        className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#059669] transition-all"
      />
    )}
  </div>
);

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
