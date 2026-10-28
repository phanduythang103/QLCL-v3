import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import { ISO_FORMS, IsoSurveyResponse, getIsoForm, isoPercent } from '../types/isoSatisfaction';
import { PaperFormShell } from './SurveyPaperKit';
import { IsoSurveyPaper } from './IsoSurveyPaper';

interface Props {
  initialData?: IsoSurveyResponse;
  /** Mẫu phiếu chọn sẵn (VD từ link QR ?mau=vi_sinh) */
  defaultMau?: string;
  readOnly?: boolean;
  onSave: (data: IsoSurveyResponse) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

export const IsoSatisfactionForm: React.FC<Props> = ({
  initialData,
  defaultMau,
  readOnly = false,
  onSave,
  onCancel,
  saving,
  isPublic = false
}) => {
  const [mau, setMau] = useState<string>(initialData?.mau || (getIsoForm(defaultMau) ? defaultMau! : ''));
  const [answers, setAnswers] = useState<Record<string, any>>(initialData?.answers || {});
  const form = getIsoForm(mau);

  const handleChange = (code: string, value: any) => {
    if (readOnly) return;
    setAnswers(prev => ({ ...prev, [code]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    let tt = 0;
    for (const g of form.groups) {
      for (const q of g.questions) {
        if (g.table) tt++;
        const label = g.table ? `câu ${tt}` : q.text.split(/[.:]/)[0];
        if (q.type === 'rating' && answers[q.code] == null) return alert(`Chưa đánh giá ${label}: ${q.text}`);
        if (q.type === 'single' && !answers[q.code]) return alert(`Chưa trả lời: ${q.text}`);
        if ((q.type === 'single' || q.type === 'multi')) {
          const other = q.options.find(o => o.other);
          const picked = q.type === 'multi' ? (answers[q.code] || []).includes(other?.value) : answers[q.code] === other?.value;
          if (other && picked && !answers[`${q.code}_other`]?.trim()) return alert(`Vui lòng ghi rõ lựa chọn "${other.label}" ở câu: ${q.text}`);
        }
      }
    }

    onSave({
      ...(initialData || {}),
      mau,
      answers,
      satisfaction_percent: isoPercent(form, answers),
    });
  };

  if (!form) {
    return (
      <div className="w-full min-h-screen bg-slate-100 px-3 py-6 md:px-8">
        <div className="max-w-[860px] mx-auto space-y-5">
          {!isPublic && (
            <button type="button" onClick={onCancel} className="text-slate-500 hover:text-[#059669] font-black text-[10px] md:text-xs uppercase p-2">
              ← Quay lại
            </button>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 md:p-8 space-y-5">
            <div className="text-center space-y-1">
              <h1 className="text-lg md:text-2xl font-black uppercase text-slate-900">Phiếu khảo sát hài lòng khách hàng</h1>
              <p className="text-sm text-slate-500 font-bold">Bác sĩ và điều dưỡng lâm sàng sử dụng dịch vụ xét nghiệm</p>
            </div>
            <p className="font-black text-slate-700 text-sm uppercase">Chọn khoa xét nghiệm cần đánh giá:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ISO_FORMS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => { setMau(f.key); setAnswers({}); }}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-100 hover:border-[#059669] hover:bg-emerald-50 text-left transition-all"
                >
                  <span className="w-10 h-10 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center shrink-0"><FlaskConical size={20} /></span>
                  <span className="font-black text-slate-800">{f.khoa}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PaperFormShell isPublic={isPublic} readOnly={readOnly} saving={saving} onCancel={onCancel} onSubmit={handleSubmit}>
      {!initialData && !readOnly && (
        <div className="mb-4 -mt-1 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm font-sans">
          <span className="font-bold text-[#047857]">Khoa xét nghiệm: {form.khoa}</span>
          <button type="button" onClick={() => setMau('')} className="text-xs font-black uppercase text-slate-500 hover:text-[#059669]">
            Đổi khoa
          </button>
        </div>
      )}
      <IsoSurveyPaper form={form} answers={answers} readOnly={readOnly} onChange={handleChange} ngayKhaoSat={initialData?.ngay_khao_sat} />
    </PaperFormShell>
  );
};
