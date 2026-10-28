import React from 'react';
import { HOSPITAL_NAME } from '../types/patientSatisfactionMauByt';
import { IsoForm, IsoGroup, IsoQuestion, IsoScaleLevel } from '../types/isoSatisfaction';
import { CheckBox, PaperViewShell, lineInput, paperCell, paperRoot } from './SurveyPaperKit';

/**
 * Phiếu khảo sát hài lòng khách hàng (ISO 15189) của các khoa xét nghiệm, trình bày giống bản giấy.
 * Nội dung lấy từ cấu hình ISO_FORMS; dùng cho form nhập và trang xem chi tiết (readOnly).
 */

interface Props {
  form: IsoForm;
  answers: Record<string, any>;
  readOnly?: boolean;
  onChange?: (code: string, value: any) => void;
  ngayKhaoSat?: string;
}

const cell = paperCell;

/** Ô đánh dấu X trong bảng mức đánh giá */
const MarkCell: React.FC<{ selected: boolean; readOnly?: boolean; title: string; onClick: () => void }> = ({ selected, readOnly, title, onClick }) => (
  <button
    type="button"
    title={title}
    disabled={readOnly}
    onClick={onClick}
    className={`kshl-circle ${selected ? 'kshl-circle-on' : ''} w-7 h-7 inline-flex items-center justify-center rounded-md border font-sans font-bold text-[15px] transition-all ${readOnly ? '' : 'cursor-pointer hover:border-[#059669]'}`}
  >
    {selected ? '✕' : ''}
  </button>
);

const TextAnswer: React.FC<{ q: Extract<IsoQuestion, { type: 'text' }>; value?: string; readOnly?: boolean; onChange: (v: string) => void }> = ({ q, value, readOnly, onChange }) =>
  q.multiline ? (
    <textarea
      disabled={readOnly}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      rows={2}
      placeholder={readOnly ? '' : '……………………………………………'}
      className={`${lineInput} w-full resize-none`}
    />
  ) : (
    <input
      type="text"
      disabled={readOnly}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`${lineInput} flex-1 min-w-[160px]`}
    />
  );

export const IsoSurveyPaper: React.FC<Props> = ({ form, answers, readOnly = false, onChange, ngayKhaoSat }) => {
  const set = (code: string, value: any) => { if (!readOnly) onChange?.(code, value); };
  const surveyDate = ngayKhaoSat ? new Date(ngayKhaoSat) : new Date();

  const toggleMulti = (code: string, value: string) => {
    const cur: string[] = Array.isArray(answers[code]) ? answers[code] : [];
    set(code, cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]);
  };

  /** Câu chọn một / chọn nhiều / tự do ngoài bảng */
  const renderQuestion = (q: IsoQuestion) => {
    if (q.type === 'text') {
      return (
        <div key={q.code} className={q.multiline ? 'space-y-1' : 'flex flex-wrap items-end gap-x-2'}>
          <span className={q.multiline ? 'block' : ''}>{q.text}</span>
          <TextAnswer q={q} value={answers[q.code]} readOnly={readOnly} onChange={v => set(q.code, v)} />
        </div>
      );
    }
    if (q.type === 'single' || q.type === 'multi') {
      const isMulti = q.type === 'multi';
      const selected = (v: string) => (isMulti ? (answers[q.code] || []).includes(v) : answers[q.code] === v);
      const otherOpt = q.options.find(o => o.other);
      const showOther = otherOpt && selected(otherOpt.value);
      const inline = q.type === 'single' && q.inline;
      return (
        <div key={q.code} className="space-y-1">
          <p>{q.text}</p>
          <div className={inline ? 'flex flex-wrap gap-x-5 gap-y-1 pl-2' : 'space-y-0.5 pl-2'}>
            {q.options.map(o => (
              <CheckBox
                key={o.value}
                round={!isMulti}
                label={o.label}
                checked={selected(o.value)}
                readOnly={readOnly}
                onClick={() => (isMulti ? toggleMulti(q.code, o.value) : set(q.code, o.value))}
              />
            ))}
          </div>
          {showOther && (
            <input
              type="text"
              disabled={readOnly}
              value={answers[`${q.code}_other`] || ''}
              onChange={e => set(`${q.code}_other`, e.target.value)}
              placeholder="ghi rõ..."
              className={`${lineInput} w-full ml-2`}
            />
          )}
        </div>
      );
    }
    return null;
  };

  /** Nhóm câu chấm điểm dạng bảng (máy tính) / dạng thẻ (điện thoại) */
  const renderTable = (g: IsoGroup, gi: number) => {
    const scale: IsoScaleLevel[] = g.scale || form.scale;
    let tt = 0;
    return (
      <div key={gi} className="mb-4">
        {/* Điện thoại */}
        <div className="md:hidden space-y-2">
          {g.questions.map(q => {
            tt++;
            return (
              <div key={q.code} className="border border-slate-300 rounded-xl px-3 py-2.5">
                <p><b>{tt}.</b> {q.text}</p>
                {q.type === 'rating' ? (
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {scale.map(s => {
                      const on = answers[q.code] === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          disabled={readOnly}
                          onClick={() => set(q.code, s.value)}
                          className={`kshl-circle ${on ? 'kshl-circle-on' : ''} rounded-lg border px-0.5 py-1.5 font-sans text-[11px] leading-tight font-semibold`}
                        >
                          {s.label}
                          {s.sub && <span className="block text-[10px] font-normal opacity-80">{s.sub}</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : q.type === 'text' ? (
                  <TextAnswer q={q} value={answers[q.code]} readOnly={readOnly} onChange={v => set(q.code, v)} />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Máy tính: bảng kẻ ô như bản giấy */}
        <table className="kshl-q-desktop w-full border-collapse">
          <tbody>
            <tr>
              <td className={`${cell} kshl-code font-bold`} rowSpan={2}>TT</td>
              <td className={`${cell} kshl-center kshl-mid font-bold`} rowSpan={2}>NỘI DUNG</td>
              <td className={`${cell} kshl-center font-bold`} colSpan={scale.length}>{(g.scaleTitle || 'MỨC ĐỘ ĐÁNH GIÁ').toUpperCase()}</td>
            </tr>
            <tr>
              {scale.map(s => (
                <td key={s.value} className={`${cell} kshl-iso-lv font-bold text-[14px]`}>
                  {s.label}
                  {s.sub && <div className="font-normal text-[12px]">{s.sub}</div>}
                </td>
              ))}
            </tr>
            {(() => { tt = 0; return null; })()}
            {g.questions.map(q => {
              tt++;
              return (
                <tr key={q.code}>
                  <td className={`${cell} kshl-code`}>{tt}.</td>
                  <td className={cell}>{q.text}</td>
                  {q.type === 'rating' ? (
                    scale.map(s => (
                      <td key={s.value} className={`${cell} kshl-iso-lv`}>
                        <MarkCell
                          title={s.label}
                          selected={answers[q.code] === s.value}
                          readOnly={readOnly}
                          onClick={() => set(q.code, s.value)}
                        />
                      </td>
                    ))
                  ) : (
                    <td className={cell} colSpan={scale.length}>
                      {q.type === 'text' && <TextAnswer q={q} value={answers[q.code]} readOnly={readOnly} onChange={v => set(q.code, v)} />}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={paperRoot}>
      {form.orgHeader && (
        <div className="text-center w-fit mb-3 leading-tight">
          <p className="uppercase">Học viện Quân y</p>
          <p className="uppercase font-bold underline underline-offset-4">{HOSPITAL_NAME}</p>
        </div>
      )}
      <h1 className="text-center font-bold uppercase text-[16px] md:text-[19px]">{form.title || 'Phiếu khảo sát hài lòng khách hàng'}</h1>
      <p className="text-center font-bold italic mb-1">{form.subtitle}</p>
      <p className="text-center text-[14px] mb-3">Ngày điền phiếu: <span className="font-semibold text-[#047857]">{surveyDate.toLocaleDateString('vi-VN')}</span></p>

      {form.intro?.map((p, i) => <p key={i} className="text-justify indent-10 mb-1">{p}</p>)}
      {form.instruction && <p className="italic font-bold my-2">{readOnly ? form.instruction : form.instruction.replace('Sử dụng dấu X để tích vào', 'Bấm chọn').replace('đánh dấu X vào', 'bấm chọn')}</p>}

      {form.groups.map((g, gi) => (
        <div key={gi} className="mt-2">
          {g.title && <h2 className="font-bold mt-3 mb-1">{g.title}</h2>}
          {g.note && <p className="italic mb-2">{g.note}</p>}
          {g.table ? renderTable(g, gi) : <div className="space-y-2.5">{g.questions.map(renderQuestion)}</div>}
        </div>
      ))}

      <p className="text-right italic font-bold mt-5">{form.closing}</p>
    </div>
  );
};

export const IsoSurveyPaperView: React.FC<{ form: IsoForm; answers: Record<string, any>; ngayKhaoSat?: string; onBack: () => void }> = ({ form, answers, ngayKhaoSat, onBack }) => (
  <PaperViewShell onBack={onBack}>
    <IsoSurveyPaper form={form} answers={answers} ngayKhaoSat={ngayKhaoSat} readOnly />
  </PaperViewShell>
);
