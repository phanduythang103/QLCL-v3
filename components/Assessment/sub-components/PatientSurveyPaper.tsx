import React from 'react';
import {
  GENDER_OPTIONS, HOSPITAL_NAME, INPATIENT_RETURN_OPTIONS, INPATIENT_RETURN_OTHER, INPATIENT_SECTIONS,
  OUTPATIENT_RETURN_OPTIONS, OUTPATIENT_RETURN_OTHER, OUTPATIENT_SECTIONS, SURVEY_INTRO,
} from '../types/patientSatisfactionMauByt';
import { DepartmentSelect } from '../../DepartmentSelect';
import { MauSoRow, Opt, PaperViewShell, RatedSections, ScaleLegend, lineInput, paperCell, paperRoot } from './SurveyPaperKit';

/**
 * Phiếu khảo sát ý kiến người bệnh trình bày giống bản giấy mẫu Bộ Y tế
 * (Mẫu số 1 - Nội trú, Mẫu số 2 - Ngoại trú). Dùng cho cả form nhập (bấm chọn trực tiếp
 * trên phiếu) và trang xem chi tiết (readOnly).
 */

type SurveyKind = 'noi_tru' | 'ngoai_tru';

/** Trang xem chi tiết phiếu (chỉ đọc) kèm nút quay lại và in phiếu */
export const PatientSurveyPaperView: React.FC<{ kind: SurveyKind; data: Record<string, any>; onBack: () => void }> = ({ kind, data, onBack }) => (
  <PaperViewShell onBack={onBack}>
    <PatientSurveyPaper kind={kind} data={data} readOnly />
  </PaperViewShell>
);

interface Props {
  kind: SurveyKind;
  data: Record<string, any>;
  readOnly?: boolean;
  onChange?: (field: string, value: any) => void;
  /** Danh mục khoa cho ô chọn khoa (chỉ phiếu nội trú) */
  departments?: any[];
}

const cell = paperCell;

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
    <div className={paperRoot}>
      {/* Tiêu đề */}
      <h1 className="text-center font-bold uppercase text-[16px] md:text-[19px]">
        Phiếu khảo sát ý kiến người bệnh {isNoiTru ? 'nội trú' : 'ngoại trú'}
      </h1>
      <MauSoRow so={isNoiTru ? 1 : 2} />

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
      <ScaleLegend readOnly={readOnly} />
      <RatedSections sections={sections} data={data} readOnly={readOnly} onSet={set} />

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
