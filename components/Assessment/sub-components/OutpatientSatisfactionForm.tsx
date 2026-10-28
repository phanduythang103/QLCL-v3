import React, { useState } from 'react';
import { ArrowLeft, Save, Phone, Building2, Calendar, MapPin } from 'lucide-react';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';
import {
  GENDER_OPTIONS, HOSPITAL_NAME, OUTPATIENT_RETURN_OPTIONS, OUTPATIENT_RETURN_OTHER,
  OUTPATIENT_SECTIONS, SURVEY_INTRO,
} from '../types/patientSatisfactionMauByt';
import { ChoiceButtons, firstUnanswered, RatingSections, ReturnIntentChoices, ScaleLegend } from './PatientSatisfactionMauByt';

interface Props {
  initialData?: OutpatientSurveyResponse;
  readOnly?: boolean;
  onSave: (data: OutpatientSurveyResponse) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
  setParentViewMode?: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

const labelCls = 'text-[13px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2';
const inputCls = 'w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#059669] transition-all';

export const OutpatientSatisfactionForm: React.FC<Props> = ({
  initialData,
  readOnly = false,
  onSave,
  onCancel,
  saving,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<OutpatientSurveyResponse>(initialData || {
    phone: '',
    gender: null,
    age: null,
    distance_km: null,
    has_bhyt: null,
    satisfaction_percent: null,
    return_intent: '',
    return_intent_other: '',
  });

  const handleChange = (field: keyof OutpatientSurveyResponse | string, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toNumber = (v: string) => (v === '' ? null : Number(v));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    if (!formData.gender) return alert('Chưa nhập thông tin: A1. Giới tính');
    if (!formData.age) return alert('Chưa nhập thông tin: A2. Tuổi');
    if (!formData.phone?.trim()) return alert('Chưa nhập thông tin: A3. Số di động');
    if (formData.distance_km == null) return alert('Chưa nhập thông tin: A4. Khoảng cách từ nơi sinh sống đến bệnh viện');
    if (formData.has_bhyt == null) return alert('Chưa nhập thông tin: A5. Sử dụng thẻ BHYT');

    const missing = firstUnanswered(OUTPATIENT_SECTIONS, formData);
    if (missing) return alert(`Chưa đánh giá câu ${missing.code.toUpperCase()}: ${missing.text}`);

    if (formData.satisfaction_percent == null) return alert('Chưa nhập thông tin: F. Mức đáp ứng so với mong đợi (%)');
    if (!formData.return_intent) return alert('Chưa nhập thông tin: G. Dự định quay lại hoặc giới thiệu');
    if (formData.return_intent === OUTPATIENT_RETURN_OTHER && !formData.return_intent_other?.trim()) {
      return alert('Vui lòng ghi rõ lựa chọn "Khác" ở câu G');
    }

    onSave({
      ...formData,
      return_intent_other: formData.return_intent === OUTPATIENT_RETURN_OTHER ? formData.return_intent_other : ''
    });
  };

  const surveyDate = initialData?.ngay_khao_sat ? new Date(initialData.ngay_khao_sat) : new Date();

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen px-4 md:px-8">
      {/* HEADER SECTION */}
      <div className="bg-[#059669] text-white p-5 md:p-8 rounded-2xl shadow-xl text-center space-y-4 mt-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        <div className="flex justify-between items-center mb-2 relative z-10">
          {!isPublic ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
          ) : <span />}
          <span className="border border-white/60 rounded-lg px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-wider">Mẫu số 2</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 mb-2 relative z-10">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight uppercase text-center">
            Phiếu khảo sát ý kiến
          </h1>
          <span className="font-black uppercase tracking-tight text-lg md:text-xl lg:text-2xl">Người bệnh ngoại trú</span>
        </div>

        <p className="text-xs md:text-sm text-white/90 w-full max-w-5xl mx-auto font-medium leading-relaxed px-2 md:px-6 text-justify md:text-center relative z-10">
          {SURVEY_INTRO}
        </p>
      </div>

      <div className="space-y-8 mt-8">
        {/* Thông tin chung */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <label className={labelCls}><Building2 size={14} className="text-[#059669]" /> 1. Tên bệnh viện:</label>
              <div className={`${inputCls} text-slate-600`}>{HOSPITAL_NAME}</div>
            </div>
            <div className="space-y-3">
              <label className={labelCls}><Calendar size={14} className="text-[#059669]" /> 2. Ngày điền phiếu:</label>
              <div className={`${inputCls} text-slate-600`}>{surveyDate.toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
        </div>

        {/* Thông tin người bệnh */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#059669] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Thông tin người bệnh</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3">
              <label className={labelCls}>A1. Giới tính:</label>
              <ChoiceButtons options={GENDER_OPTIONS} value={formData.gender} readOnly={readOnly} onChange={v => handleChange('gender', v)} />
            </div>
            <div className="space-y-3">
              <label className={labelCls}>A2. Tuổi:</label>
              <input
                type="number"
                min={0}
                max={120}
                disabled={readOnly}
                value={formData.age ?? ''}
                onChange={e => handleChange('age', toNumber(e.target.value))}
                placeholder="Nhập tuổi..."
                className={inputCls}
              />
            </div>
            <div className="space-y-3">
              <label className={labelCls}><Phone size={14} className="text-[#059669]" /> A3. Số di động (bắt buộc):</label>
              <input
                type="tel"
                disabled={readOnly}
                value={formData.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="Nhập số điện thoại..."
                className={inputCls}
              />
            </div>
            <div className="space-y-3">
              <label className={labelCls}><MapPin size={14} className="text-[#059669]" /> A4. Ước tính khoảng cách từ nơi sinh sống đến bệnh viện:</label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  disabled={readOnly}
                  value={formData.distance_km ?? ''}
                  onChange={e => handleChange('distance_km', toNumber(e.target.value))}
                  className="w-32 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-black text-slate-800 text-lg outline-none focus:border-[#059669] transition-all"
                />
                <span className="font-bold text-slate-500 text-sm">km</span>
              </div>
            </div>
            <div className="space-y-3 md:col-span-2">
              <label className={labelCls}>A5. Ông/Bà có sử dụng thẻ BHYT cho lần khám bệnh này không?</label>
              <ChoiceButtons
                options={[{ value: true, label: '1. Có' }, { value: false, label: '2. Không' }]}
                value={formData.has_bhyt}
                readOnly={readOnly}
                onChange={v => handleChange('has_bhyt', v)}
              />
            </div>
          </div>
        </div>

        {/* Đánh giá việc sử dụng dịch vụ y tế */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#059669] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Đánh giá việc sử dụng dịch vụ y tế</h3>
          </div>
          <ScaleLegend />
          <RatingSections
            sections={OUTPATIENT_SECTIONS}
            values={formData}
            readOnly={readOnly}
            onChange={(code, v) => handleChange(code, v)}
          />
        </div>

        {/* F, G */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-10">
          <div className="space-y-4">
            <label className="text-[15px] font-black text-slate-900 leading-relaxed block">
              F. Đánh giá chung bệnh viện đã đáp ứng được bao nhiêu % so với mong đợi trước khi tới khám bệnh?
            </label>
            <p className="text-xs italic text-slate-500 font-medium">
              (điền số từ 0% đến 100% hoặc có thể điền trên 100% nếu bệnh viện điều trị tốt, vượt quá mong đợi của Ông/Bà)
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={200}
                disabled={readOnly}
                value={formData.satisfaction_percent ?? ''}
                onChange={e => handleChange('satisfaction_percent', e.target.value === '' ? null : parseInt(e.target.value))}
                className="w-32 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-black text-[#059669] text-xl outline-none focus:border-[#059669] transition-all"
              />
              <span className="font-black text-slate-500 text-lg">%</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[15px] font-black text-slate-900 leading-relaxed block">
              G. Nếu có nhu cầu khám bệnh, Ông/Bà có quay trở lại hoặc giới thiệu cho người khác đến không?
            </label>
            <ReturnIntentChoices
              options={OUTPATIENT_RETURN_OPTIONS}
              otherValue={OUTPATIENT_RETURN_OTHER}
              value={formData.return_intent}
              otherText={formData.return_intent_other}
              readOnly={readOnly}
              onChange={v => handleChange('return_intent', v)}
              onOtherChange={v => handleChange('return_intent_other', v)}
            />
          </div>

          {!readOnly && (
            <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-6">
              <p className="font-black text-slate-700 uppercase tracking-widest text-sm text-center">Xin trân trọng cảm ơn!</p>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-3 px-16 py-5 bg-[#059669] hover:bg-emerald-700 text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : <Save size={20} />}
                {saving ? 'Đang gửi...' : 'Gửi phiếu khảo sát'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="py-12 text-center text-slate-400">
        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Bệnh viện Quân y 103 &copy; 2026</p>
      </div>
    </div>
  );
};
