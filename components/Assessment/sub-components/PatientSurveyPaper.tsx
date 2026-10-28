import React from 'react';
import {
  GENDER_OPTIONS, HOSPITAL_NAME, INPATIENT_RETURN_OPTIONS, INPATIENT_RETURN_OTHER, INPATIENT_SECTIONS,
  OUTPATIENT_RETURN_OPTIONS, OUTPATIENT_RETURN_OTHER, OUTPATIENT_SECTIONS, SCALE_OPTIONS, SURVEY_INTRO,
} from '../types/patientSatisfactionMauByt';
import { DepartmentSelect } from '../../DepartmentSelect';

/**
 * Phiếu khảo sát ý kiến người bệnh trình bày giống bản giấy mẫu Bộ Y tế
 * (Mẫu số 1 - Nội trú, Mẫu số 2 - Ngoại trú). Dùng cho cả form nhập (bấm chọn trực tiếp
 * trên phiếu) và trang xem chi tiết (readOnly).
 */

type SurveyKind = 'noi_tru' | 'ngoai_tru';

/** Trang xem chi tiết phiếu (chỉ đọc) kèm nút quay lại và in phiếu */
export const PatientSurveyPaperView: React.FC<{ kind: SurveyKind; data: Record<string, any>; onBack: () => void }> = ({ kind, data, onBack }) => (
  <div className="w-full min-h-full bg-slate-100/50 p-2 md:p-8 animate-in fade-in duration-500 paper-view">
    <div className="max-w-[860px] mx-auto no-print flex items-center justify-between mb-3">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-[#059669] font-black text-[10px] md:text-xs uppercase p-2 md:p-3 hover:bg-emerald-50 rounded-2xl transition-all"
      >
        ← Quay lại
      </button>
      <button
        onClick={() => window.print()}
        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase shadow hover:bg-black transition-all"
      >
        In phiếu
      </button>
    </div>
    <div className="max-w-[860px] mx-auto bg-white shadow-xl border border-slate-200 px-3 py-5 md:px-12 md:py-10 paper-sheet">
      <PatientSurveyPaper kind={kind} data={data} readOnly />
    </div>
    <style dangerouslySetInnerHTML={{
      __html: `
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; }
        .paper-view { padding: 0 !important; background: white !important; }
        .paper-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
        .paper-sheet button { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}} />
  </div>
);

interface Props {
  kind: SurveyKind;
  data: Record<string, any>;
  readOnly?: boolean;
  onChange?: (field: string, value: any) => void;
  /** Danh mục khoa cho ô chọn khoa (chỉ phiếu nội trú) */
  departments?: any[];
}

const cell = 'border border-black px-1.5 py-1 align-top';
const lineInput = 'bg-transparent border-0 border-b border-dotted border-slate-500 outline-none px-1 font-semibold text-[#047857] focus:border-[#059669] disabled:text-[#047857] disabled:opacity-100';

/** Số trong vòng tròn giống ①..⑤ trên phiếu giấy */
const Circle: React.FC<{ n: number | string; selected?: boolean; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; disabled?: boolean; title?: string }> = ({ n, selected, size = 'md', onClick, disabled, title }) => {
  const dim = size === 'sm' ? 'w-[18px] h-[18px] text-[11px]'
    : size === 'lg' ? 'w-11 h-11 text-[17px]'
      : 'w-[25px] h-[25px] md:w-8 md:h-8 text-[12px] md:text-[15px]';
  const cls = `kshl-circle ${selected ? 'kshl-circle-on' : ''} ${dim} inline-flex items-center justify-center rounded-full border border-black font-sans font-semibold shrink-0 transition-all ${selected ? 'bg-[#059669] border-[#059669] text-white shadow' : 'bg-white text-black'}`;
  if (!onClick) return <span className={cls}>{n}</span>;
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={`${cls} ${disabled ? '' : 'hover:border-[#059669] hover:text-[#059669] cursor-pointer'} ${selected && !disabled ? 'hover:text-white' : ''}`}>
      {n}
    </button>
  );
};

/** Lựa chọn dạng chữ trên phiếu (VD "1. Nam"): khi chọn thì được khoanh tròn */
const Opt: React.FC<{ label: string; selected: boolean; readOnly?: boolean; onClick: () => void }> = ({ label, selected, readOnly, onClick }) => (
  <button
    type="button"
    disabled={readOnly}
    onClick={onClick}
    className={`inline-block px-1.5 rounded-full border transition-all ${selected
      ? 'border-[#059669] bg-emerald-50 text-[#047857] font-bold'
      : `border-transparent ${readOnly ? '' : 'hover:border-slate-400 cursor-pointer'}`}`}
  >
    {label}
  </button>
);

export const PatientSurveyPaper: React.FC<Props> = ({ kind, data, readOnly = false, onChange, departments = [] }) => {
  const isNoiTru = kind === 'noi_tru';
  const sections = isNoiTru ? INPATIENT_SECTIONS : OUTPATIENT_SECTIONS;
  const returnOptions = isNoiTru ? INPATIENT_RETURN_OPTIONS : OUTPATIENT_RETURN_OPTIONS;
  const returnOther = isNoiTru ? INPATIENT_RETURN_OTHER : OUTPATIENT_RETURN_OTHER;
  const set = (field: string, value: any) => { if (!readOnly) onChange?.(field, value); };
  const num = (v: string) => (v === '' ? null : Number(v));

  const surveyDate = data.ngay_khao_sat ? new Date(data.ngay_khao_sat) : new Date();
  const maKhoa = (data.department || '').includes(' - ') ? data.department.split(' - ')[0] : '';

  return (
    <div className="kshl-paper bg-white text-black font-['Times_New_Roman',Times,serif] text-[15px] md:text-[17px] leading-snug">
      {/* Tiêu đề */}
      <h1 className="text-center font-bold uppercase text-[16px] md:text-[19px]">
        Phiếu khảo sát ý kiến người bệnh {isNoiTru ? 'nội trú' : 'ngoại trú'}
      </h1>
      <div className="flex items-center gap-2 md:gap-4 mt-1 mb-3 md:pl-16">
        <span className="font-bold whitespace-nowrap">MẪU SỐ {isNoiTru ? 1 : 2}</span>
        <div className="flex flex-1 max-w-[460px]">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="flex-1 h-5 md:h-6 border border-black -ml-px first:ml-0" />
          ))}
        </div>
      </div>

      <p className="italic text-justify indent-10 mb-1">{SURVEY_INTRO}</p>

      {/* Thông tin chung */}
      <div className="space-y-1">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>1. Tên bệnh viện: <span className="font-semibold text-[#047857]">{HOSPITAL_NAME}</span></span>
          <span>2. Ngày điền phiếu: <span className="font-semibold text-[#047857]">{surveyDate.toLocaleDateString('vi-VN')}</span></span>
        </div>
        {isNoiTru && (
          <>
            <div className="flex flex-wrap items-center gap-x-2">
              <span>3. Người trả lời</span>
              <Opt label="a. Người bệnh" selected={data.respondent === 'patient'} readOnly={readOnly} onClick={() => set('respondent', 'patient')} />
              <Opt label="b. Người nhà" selected={data.respondent === 'relative'} readOnly={readOnly} onClick={() => set('respondent', 'relative')} />
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>4. Tên khoa nằm điều trị trước ra viện</span>
              <div className="flex-1 min-w-[220px] font-sans text-[14px]">
                {readOnly ? (
                  <span className="font-['Times_New_Roman',Times,serif] font-semibold text-[#047857] text-[15px] md:text-[17px]">{data.department || '…………'}</span>
                ) : (
                  <DepartmentSelect
                    value={data.department || ''}
                    onChange={v => set('department', v)}
                    departments={departments}
                    required
                    className="w-full bg-emerald-50/40 border border-dotted border-slate-500 rounded px-2 py-1 text-sm font-semibold text-[#047857] outline-none focus:border-[#059669]"
                  />
                )}
              </div>
              <span>5. Mã khoa (do BV ghi) <span className="font-semibold text-[#047857]">{maKhoa || '……'}</span></span>
            </div>
          </>
        )}
      </div>

      {/* Thông tin người bệnh */}
      <h2 className="font-bold uppercase mt-2">Thông tin người bệnh</h2>
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className={cell}>
              A1. Giới tính:{' '}
              {GENDER_OPTIONS.map(o => (
                <Opt key={o.value} label={o.label} selected={data.gender === o.value} readOnly={readOnly} onClick={() => set('gender', o.value)} />
              ))}
            </td>
            <td className={`${cell} kshl-half`}>
              A2. Tuổi{' '}
              <input type="number" min={0} max={120} disabled={readOnly} value={data.age ?? ''} onChange={e => set('age', num(e.target.value))} className={`${lineInput} w-16`} />
            </td>
          </tr>
          {isNoiTru ? (
            <>
              <tr>
                <td className={cell}>
                  A3. Số di động <i>(bắt buộc)</i>:{' '}
                  <input type="tel" disabled={readOnly} value={data.phone || ''} onChange={e => set('phone', e.target.value)} className={`${lineInput} w-36`} />
                </td>
                <td className={cell}>
                  A4. Tổng số ngày nằm viện{' '}
                  <input type="number" min={0} disabled={readOnly} value={data.hospital_days ?? ''} onChange={e => set('hospital_days', num(e.target.value))} className={`${lineInput} w-12`} /> ngày
                </td>
              </tr>
              <tr>
                <td className={cell} colSpan={2}>
                  A5. Ông/Bà có sử dụng thẻ BHYT cho lần điều trị này không?{' '}
                  <Opt label="1. Có" selected={data.has_bhyt === true} readOnly={readOnly} onClick={() => set('has_bhyt', true)} />
                  <Opt label="2. Không" selected={data.has_bhyt === false} readOnly={readOnly} onClick={() => set('has_bhyt', false)} />
                </td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <td className={cell} colSpan={2}>
                  A3. Số di động <i>(bắt buộc)</i>:{' '}
                  <input type="tel" disabled={readOnly} value={data.phone || ''} onChange={e => set('phone', e.target.value)} className={`${lineInput} w-40`} />
                </td>
              </tr>
              <tr>
                <td className={cell} colSpan={2}>
                  A4. Ước tính khoảng cách từ nơi sinh sống đến bệnh viện:{' '}
                  <input type="number" min={0} step="0.1" disabled={readOnly} value={data.distance_km ?? ''} onChange={e => set('distance_km', num(e.target.value))} className={`${lineInput} w-16`} /> km
                </td>
              </tr>
              <tr>
                <td className={cell} colSpan={2}>
                  A5. Ông/Bà có sử dụng thẻ BHYT cho lần khám bệnh này không?{' '}
                  <Opt label="1. Có" selected={data.has_bhyt === true} readOnly={readOnly} onClick={() => set('has_bhyt', true)} />
                  <Opt label="2. Không" selected={data.has_bhyt === false} readOnly={readOnly} onClick={() => set('has_bhyt', false)} />
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* Đánh giá */}
      <h2 className="font-bold uppercase mt-2">Đánh giá việc sử dụng dịch vụ y tế</h2>
      <p>
        Ông/Bà {readOnly ? 'đánh dấu' : 'bấm chọn'} vào một số <b>từ 1 đến 5</b>, tương ứng với <b>mức độ hài lòng hoặc nhận xét từ rất kém đến rất tốt</b> cho từng câu hỏi dưới đây:
      </p>
      <table className="w-full border-collapse text-center text-[13px] md:text-[16px] mb-4">
        <tbody>
          <tr>
            {SCALE_OPTIONS.map(o => (
              <td key={o.value} className="border border-black px-1 py-1 align-top">
                <div className="flex items-center justify-center gap-1"><Circle n={o.value} size="sm" /> là:</div>
                <div>{o.label}</div>
                <div className="mt-1"><i>hoặc:</i> {o.alt}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Điện thoại: mỗi câu một thẻ, "B1. Nội dung" trên một dòng, thang điểm chia đều 5 cột */}
      <div className="md:hidden space-y-4 mb-4">
        {sections.map(sec => (
          <div key={sec.stt} className="space-y-2">
            <div className="bg-[#059669] text-white font-bold rounded-lg px-3 py-2">{sec.stt}. {sec.name}</div>
            {sec.questions.map(q => (
              <div key={q.code} className="border border-slate-300 rounded-xl px-3 py-2.5">
                <p><b>{q.code.toUpperCase()}.</b> {q.text}</p>
                <div className="grid grid-cols-5 gap-1 mt-2 justify-items-center">
                  {SCALE_OPTIONS.map(o => (
                    <Circle
                      key={o.value}
                      n={o.value}
                      size="lg"
                      title={o.label}
                      selected={data[q.code] === o.value}
                      disabled={readOnly}
                      onClick={readOnly ? undefined : () => set(q.code, o.value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Máy tính: bảng kẻ ô như bản giấy */}
      <table className="kshl-q-desktop w-full border-collapse">
        <tbody>
          {sections.map(sec => (
            <React.Fragment key={sec.stt}>
              <tr>
                <td className={`${cell} kshl-sec font-bold`} colSpan={3}>{sec.stt}. {sec.name}</td>
              </tr>
              {sec.questions.map(q => (
                <tr key={q.code}>
                  <td className={`${cell} kshl-code`}>{q.code.toUpperCase()}.</td>
                  <td className={cell}>{q.text}</td>
                  <td className={`${cell} kshl-rate`}>
                    <div className="flex items-center justify-center gap-[3px] md:gap-1.5">
                      {SCALE_OPTIONS.map(o => (
                        <Circle
                          key={o.value}
                          n={o.value}
                          title={o.label}
                          selected={data[q.code] === o.value}
                          disabled={readOnly}
                          onClick={readOnly ? undefined : () => set(q.code, o.value)}
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <table className="kshl-after-q w-full border-collapse">
        <tbody>
          {/* G1 / F */}
          <tr>
            <td className={`${cell} kshl-code font-bold`}>{isNoiTru ? 'G1' : 'F'}</td>
            <td className={cell}>
              {isNoiTru
                ? <>Đánh giá chung, bệnh viện <b>đã đáp ứng được bao nhiêu % so với mong đợi</b> của Ông/Bà trước khi nằm viện?</>
                : <>Đánh giá chung bệnh viện <b>đã đáp ứng được bao nhiêu % so với mong đợi</b> trước khi tới khám bệnh?</>}
              <br />
              <i>(điền số từ 0% đến 100% hoặc có thể điền trên 100% nếu bệnh viện điều trị tốt, vượt quá mong đợi của Ông/Bà)</i>
            </td>
            <td className={`${cell} kshl-rate kshl-center whitespace-nowrap`}>
              <input type="number" min={0} max={200} disabled={readOnly} value={data.satisfaction_percent ?? ''} onChange={e => set('satisfaction_percent', num(e.target.value))} className={`${lineInput} w-16 text-center text-lg`} />%
            </td>
          </tr>

          {/* G2 / G */}
          <tr>
            <td className={`${cell} kshl-code font-bold`}>{isNoiTru ? 'G2' : 'G'}</td>
            <td className={cell} colSpan={2}>
              <div className="flex flex-col md:flex-row gap-1 md:gap-3">
                <div className="md:w-[38%] shrink-0">
                  {isNoiTru
                    ? 'Nếu có nhu cầu khám, chữa những bệnh tương tự, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?'
                    : 'Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?'}
                </div>
                <div className="flex-1 md:border-l md:border-black md:pl-2 flex flex-col items-start">
                  {returnOptions.map(o => (
                    <Opt
                      key={o.value}
                      label={`${o.value}. ${o.label}`}
                      selected={data.return_intent === o.value}
                      readOnly={readOnly}
                      onClick={() => set('return_intent', o.value)}
                    />
                  ))}
                  {data.return_intent === returnOther && (
                    <input
                      type="text"
                      disabled={readOnly}
                      value={data.return_intent_other || ''}
                      onChange={e => set('return_intent_other', e.target.value)}
                      placeholder="ghi rõ..."
                      className={`${lineInput} w-full mt-1`}
                    />
                  )}
                </div>
              </div>
            </td>
          </tr>

          {/* H (chỉ nội trú) */}
          {isNoiTru && (
            <tr>
              <td className={`${cell} kshl-code font-bold`}>H</td>
              <td className={cell} colSpan={2}>
                <div className="flex flex-col md:flex-row gap-1 md:gap-3">
                  <div className="md:w-[38%] shrink-0">Ông/Bà có ý kiến gì khác, xin ghi rõ?</div>
                  <textarea
                    disabled={readOnly}
                    value={data.feedback || ''}
                    onChange={e => set('feedback', e.target.value)}
                    rows={readOnly ? 2 : 3}
                    className={`${lineInput} flex-1 resize-none md:border-l md:border-l-black md:border-solid`}
                    placeholder={readOnly ? '' : '……………………………………………'}
                  />
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="text-right font-bold uppercase mt-4">
        Xin trân trọng cảm ơn{isNoiTru ? ' Ông/Bà' : ''}!
      </p>
    </div>
  );
};
