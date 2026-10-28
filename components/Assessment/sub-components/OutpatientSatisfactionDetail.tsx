import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';
import {
  GENDER_OPTIONS, HOSPITAL_NAME, LEGACY_OUTPATIENT_QUESTIONS, OUTPATIENT_RETURN_OPTIONS,
  OUTPATIENT_SECTIONS, isMauByt, outpatientPercent,
} from '../types/patientSatisfactionMauByt';
import { CheckOption, ScoreTable } from './PatientSatisfactionMauByt';
import { PatientSurveyPaperView } from './PatientSurveyPaper';

interface Props {
  data: OutpatientSurveyResponse | undefined;
  onBack: () => void;
}

// Mẫu cũ
const AREA_LABELS: Record<string, string> = {
  'kham_dan': 'K. Khám bệnh (Dân)',
  'kham_quan': 'Khám Quân',
  'bhyt': 'Khám BHYT',
  'yeu_cau': 'KKB theo yêu cầu',
  'pk232': 'PK232'
};

const RESPONDENT_LABELS: Record<string, string> = {
  'patient': 'Người bệnh',
  'relative': 'Người nhà'
};

export const OutpatientSatisfactionDetail: React.FC<Props> = ({ data, onBack }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const mauByt = isMauByt(data, OUTPATIENT_SECTIONS);
  if (mauByt) return <PatientSurveyPaperView kind="ngoai_tru" data={data} onBack={onBack} />;

  return (
    <div className="w-full h-full bg-slate-100/50 p-2 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

        {/* Navigation Actions */}
        <div className="flex items-center justify-start no-print px-2 md:px-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#059669] font-black text-[10px] md:text-xs uppercase p-2 md:p-3 hover:bg-emerald-50 rounded-2xl transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
          </button>
        </div>

        {/* Paper Container */}
        <div className="bg-white p-6 md:p-16 shadow-2xl rounded-sm border border-slate-200 min-h-[800px] md:min-h-[1200px] font-sans relative">

          {/* Header Title */}
          <div className="text-center mb-6 md:mb-10">
            {mauByt && <p className="text-right text-[11px] md:text-xs font-black uppercase mb-2">Mẫu số 2</p>}
            <h1 className="text-lg md:text-2xl font-black text-slate-900 leading-tight uppercase">
              PHIẾU KHẢO SÁT Ý KIẾN NGƯỜI BỆNH NGOẠI TRÚ
            </h1>
            {data.ngay_khao_sat && (() => {
              const d = new Date(data.ngay_khao_sat);
              const pad = (n: number) => String(n).padStart(2, '0');
              const code = `NGOAITRU-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
              return (
                <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide">
                  (Mã khảo sát: {code})
                </p>
              );
            })()}
            {!mauByt && (
              <p className="mt-2 text-[11px] md:text-xs text-amber-600 font-bold">Phiếu thu theo mẫu cũ (trước khi áp dụng mẫu Bộ Y tế)</p>
            )}
          </div>

          {/* Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm mb-8">
            <Field label="1. Tên bệnh viện:" value={HOSPITAL_NAME} />
            <Field label="2. Ngày điền phiếu:" value={data.ngay_khao_sat ? new Date(data.ngay_khao_sat).toLocaleDateString('vi-VN') : ''} />
            {!mauByt && (
              <>
                {data.full_name && <Field label="Họ và tên:" value={data.full_name} upper />}
                <Field label="Khu vực khám:" value={AREA_LABELS[data.area || ''] || data.area} />
                <Field label="Thời điểm khám:" value={data.visit_time} />
                <Field label="Đối tượng trả lời:" value={RESPONDENT_LABELS[data.respondent || ''] || data.respondent} />
              </>
            )}
          </div>

          {/* Thông tin người bệnh */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">THÔNG TIN NGƯỜI BỆNH</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm">
              <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
                <span className="font-bold">A1. Giới tính:</span>
                {GENDER_OPTIONS.map(o => <CheckOption key={o.value} checked={data.gender === o.value} label={o.label} />)}
              </div>
              <Field label="A2. Tuổi:" value={data.age ?? ''} />
              <Field label="A3. Số di động:" value={data.phone} />
              <Field label="A4. Khoảng cách đến bệnh viện:" value={data.distance_km != null ? `${data.distance_km} km` : ''} />
              <div className="flex flex-wrap gap-x-6 gap-y-2 items-center md:col-span-2">
                <span className="font-bold">A5. Sử dụng thẻ BHYT cho lần khám bệnh này:</span>
                <CheckOption checked={data.has_bhyt === true} label="1. Có" />
                <CheckOption checked={data.has_bhyt === false} label="2. Không" />
              </div>
            </div>
          </div>

          {/* Đánh giá */}
          <div className="space-y-4 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              ĐÁNH GIÁ VIỆC SỬ DỤNG DỊCH VỤ Y TẾ
            </h3>
            {mauByt ? (
              <ScoreTable sections={OUTPATIENT_SECTIONS} data={data} />
            ) : (
              <ScoreTable sections={[{ stt: '', name: '', questions: LEGACY_OUTPATIENT_QUESTIONS }]} data={data} scale={[1, 2, 3, 4, 5, 0]} />
            )}
          </div>

          {/* Đánh giá chung */}
          <div className="space-y-6 mb-8 md:mb-12 text-xs md:text-sm">
            <div className="flex flex-col gap-2">
              <span className="font-bold">F. Bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi trước khi tới khám bệnh?</span>
              <div className="bg-emerald-50 text-[#059669] px-4 py-2 rounded-xl border border-emerald-100 font-black text-xl tracking-tight w-fit">
                {outpatientPercent(data)}%
              </div>
              {!mauByt && <span className="italic text-slate-400 text-[11px]">(phiếu mẫu cũ: quy đổi từ điểm trung bình các câu)</span>}
            </div>

            {mauByt ? (
              <div className="flex flex-col gap-3">
                <span className="font-bold">G. Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?</span>
                <div className="flex flex-col gap-2 pl-2">
                  {OUTPATIENT_RETURN_OPTIONS.map(opt => (
                    <CheckOption
                      key={opt.value}
                      checked={data.return_intent === opt.value}
                      label={`${opt.value}. ${opt.label}${data.return_intent === opt.value && data.return_intent_other ? `: ${data.return_intent_other}` : ''}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Field label="Nguyên nhân chờ đợi:" value={(data.waiting_issues || []).join(', ')} />
                <Field label="Ưu tiên cải tiến:" value={(data.priority_improvement || []).join(', ')} />
                <span className="font-bold block pt-2">Ý kiến khác:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {data.feedback || 'Không có nội dung góp ý.'}
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <p className="font-black text-lg md:text-xl tracking-widest uppercase text-slate-800">XIN TRÂN TRỌNG CẢM ƠN!</p>
          </div>

          {/* Footer */}
          <div className="no-print border-t border-slate-100 pt-8 mt-10">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all"
            >
              Tạo bản In phiếu khảo sát
            </button>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; }
          .animate-in { animation: none !important; }
          .max-w-4xl { max-width: 100% !important; margin: 0 !important; }
          .shadow-2xl { box-shadow: none !important; border: none !important; }
          .p-2, .p-8, .p-6, .p-16 { padding: 0 !important; }
          .bg-slate-100\\/50 { background: white !important; }
        }
      `}} />
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode; upper?: boolean }> = ({ label, value, upper }) => (
  <div className="flex gap-2">
    <span className="font-bold whitespace-nowrap">{label}</span>
    <span className={`border-b border-dotted border-slate-400 flex-1 px-1 font-bold ${upper ? 'uppercase' : ''}`}>
      {value === '' || value == null ? '...........................' : value}
    </span>
  </div>
);
