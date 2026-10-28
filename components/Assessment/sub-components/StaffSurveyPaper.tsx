import React from 'react';
import { GENDER_OPTIONS, HOSPITAL_NAME } from '../types/patientSatisfactionMauByt';
import {
  ChoiceOption, STAFF_BANG_CAP, STAFF_CHUYEN_MON, STAFF_INTRO, STAFF_KIEM_NHIEM, STAFF_PHAM_VI,
  STAFF_SECTIONS, STAFF_VI_TRI,
} from '../types/staffSatisfactionMauByt';
import { MauSoRow, Opt, PaperViewShell, RatedSections, ScaleLegend, lineInput, paperCell, paperRoot } from './SurveyPaperKit';

/**
 * Phiếu khảo sát ý kiến nhân viên y tế trình bày giống bản giấy mẫu Bộ Y tế (Mẫu số 3).
 * Dùng cho form nhập (bấm chọn trên phiếu) và trang xem chi tiết (readOnly).
 */

interface Props {
  data: Record<string, any>;
  readOnly?: boolean;
  onChange?: (field: string, value: any) => void;
}

/** Nhóm lựa chọn một đáp án, có ô ghi rõ khi chọn "Khác" */
const Choices: React.FC<{
  options: ChoiceOption[];
  value?: string | null;
  otherValue?: string | null;
  readOnly?: boolean;
  onPick: (v: string) => void;
  onOther: (v: string) => void;
}> = ({ options, value, otherValue, readOnly, onPick, onOther }) => {
  const picked = options.find(o => o.value === value);
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 items-center">
      {options.map(o => (
        <Opt key={o.value} label={o.label} selected={value === o.value} readOnly={readOnly} onClick={() => onPick(o.value)} />
      ))}
      {picked?.other && (
        <input
          type="text"
          disabled={readOnly}
          value={otherValue || ''}
          onChange={e => onOther(e.target.value)}
          placeholder="ghi rõ..."
          className={`${lineInput} flex-1 min-w-[140px]`}
        />
      )}
    </div>
  );
};

export const StaffSurveyPaper: React.FC<Props> = ({ data, readOnly = false, onChange }) => {
  const set = (field: string, value: any) => { if (!readOnly) onChange?.(field, value); };
  const num = (v: string) => (v === '' ? null : Number(v));
  const surveyDate = data.ngay_khao_sat ? new Date(data.ngay_khao_sat) : new Date();
  const cell = paperCell;

  const numberInput = (field: string, width = 'w-16') => (
    <input
      type="number"
      min={0}
      disabled={readOnly}
      value={data[field] ?? ''}
      onChange={e => set(field, num(e.target.value))}
      className={`${lineInput} ${width}`}
    />
  );

  const choiceRow = (code: string, label: string, field: string, options: ChoiceOption[]) => (
    <tr>
      <td className={`${cell} kshl-code`}>{code}.</td>
      <td className={cell}>
        <div className="mb-0.5">{label}</div>
        <Choices
          options={options}
          value={data[field]}
          otherValue={data[`${field}_other`]}
          readOnly={readOnly}
          onPick={v => set(field, v)}
          onOther={v => set(`${field}_other`, v)}
        />
      </td>
    </tr>
  );

  return (
    <div className={paperRoot}>
      <h1 className="text-center font-bold uppercase text-[16px] md:text-[19px]">Phiếu khảo sát ý kiến nhân viên y tế</h1>
      <MauSoRow so={3} />

      <p className="italic text-justify indent-10 mb-1">{STAFF_INTRO}</p>

      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>1. Tên bệnh viện: <span className="font-semibold text-[#047857]">{HOSPITAL_NAME}</span></span>
        <span>2. Ngày điền phiếu: <span className="font-semibold text-[#047857]">{surveyDate.toLocaleDateString('vi-VN')}</span></span>
      </div>

      <h2 className="font-bold uppercase mt-2">Thông tin người điền phiếu</h2>
      <table className="w-full border-collapse mb-2">
        <tbody>
          <tr>
            <td className={`${cell} kshl-code`}>A1.</td>
            <td className={cell}>
              Giới tính:{' '}
              {GENDER_OPTIONS.map(o => (
                <Opt key={o.value} label={o.label} selected={data.gender === o.value} readOnly={readOnly} onClick={() => set('gender', o.value)} />
              ))}
              <span className="ml-4">A2. Tuổi: {numberInput('age')}</span>
            </td>
          </tr>
          {choiceRow('A3', 'Chuyên môn đào tạo chính:', 'chuyen_mon', STAFF_CHUYEN_MON)}
          {choiceRow('A4', 'Bằng cấp cao nhất của Ông/Bà:', 'bang_cap', STAFF_BANG_CAP)}
          <tr>
            <td className={`${cell} kshl-code`}>A5.</td>
            <td className={cell}>Số năm công tác trong ngành Y: {numberInput('nam_nganh_y')} năm</td>
          </tr>
          <tr>
            <td className={`${cell} kshl-code`}>A6.</td>
            <td className={cell}>Số năm công tác tại bệnh viện hiện nay: {numberInput('nam_tai_bv')} năm</td>
          </tr>
          {choiceRow('A7', 'Vị trí công tác hiện tại:', 'vi_tri', STAFF_VI_TRI)}
          {choiceRow('A8', 'Phạm vi hoạt động chuyên môn:', 'pham_vi', STAFF_PHAM_VI)}
          {choiceRow('A9', 'Anh/Chị có được phân công kiêm nhiệm nhiều công việc không?', 'kiem_nhiem', STAFF_KIEM_NHIEM)}
          <tr>
            <td className={`${cell} kshl-code`}>A10.</td>
            <td className={cell}>Trung bình Anh/Chị trực mấy lần trong một tháng? {numberInput('so_lan_truc')} lần</td>
          </tr>
        </tbody>
      </table>

      <h2 className="font-bold uppercase mt-2">Đánh giá sự hài lòng về bệnh viện</h2>
      <ScaleLegend readOnly={readOnly} />
      <RatedSections sections={STAFF_SECTIONS} data={data} readOnly={readOnly} onSet={set} />

      <div className="mt-4 space-y-1">
        <p className="font-bold">G. Anh/Chị có ý kiến hoặc đề xuất nào khác với Bộ Y tế và lãnh đạo bệnh viện?</p>
        <textarea
          disabled={readOnly}
          value={data.suggestion || ''}
          onChange={e => set('suggestion', e.target.value)}
          rows={3}
          placeholder={readOnly ? '' : '……………………………………………'}
          className={`${lineInput} w-full resize-none`}
        />
      </div>

      <p className="text-right italic font-bold mt-4">
        Xin chân thành cảm ơn sự nhiệt tình cung cấp thông tin của Quý đồng nghiệp!
      </p>
    </div>
  );
};

export const StaffSurveyPaperView: React.FC<{ data: Record<string, any>; onBack: () => void }> = ({ data, onBack }) => (
  <PaperViewShell onBack={onBack}>
    <StaffSurveyPaper data={data} readOnly />
  </PaperViewShell>
);
