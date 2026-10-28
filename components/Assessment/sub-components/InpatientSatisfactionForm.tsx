import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';
import { INPATIENT_RETURN_OTHER, INPATIENT_SECTIONS } from '../types/patientSatisfactionMauByt';
import { firstUnanswered } from './PatientSatisfactionMauByt';
import { PatientSurveyPaper } from './PatientSurveyPaper';
import { fetchDmDonVi, DmDonVi } from '../../../readDmDonVi';

interface Props {
  initialData?: InpatientSurveyResponse;
  readOnly?: boolean;
  onSave: (data: InpatientSurveyResponse) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

export const InpatientSatisfactionForm: React.FC<Props> = ({
  initialData,
  readOnly = false,
  onSave,
  onCancel,
  saving,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<InpatientSurveyResponse>(
    initialData || {
      phone: '',
      department: '',
      hospital_days: null as any,
      respondent: '' as any,
      gender: null,
      age: null,
      has_bhyt: null,
      satisfaction_percent: null as any,
      return_intent: '',
      return_intent_other: '',
      feedback: ''
    }
  );
  const [units, setUnits] = useState<DmDonVi[]>([]);

  useEffect(() => {
    fetchDmDonVi().then(setUnits).catch(err => console.error('Error loading departments:', err));
  }, []);

  const handleChange = (field: string, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.respondent) return alert('Chưa nhập thông tin: 3. Người trả lời (người bệnh / người nhà)');
    if (!formData.department?.trim()) return alert('Chưa nhập thông tin: 4. Tên khoa nằm điều trị trước ra viện');
    if (!formData.gender) return alert('Chưa nhập thông tin: A1. Giới tính');
    if (!formData.age) return alert('Chưa nhập thông tin: A2. Tuổi');
    if (!formData.phone?.trim()) return alert('Chưa nhập thông tin: A3. Số di động');
    if (!formData.hospital_days) return alert('Chưa nhập thông tin: A4. Tổng số ngày nằm viện');
    if (formData.has_bhyt == null) return alert('Chưa nhập thông tin: A5. Sử dụng thẻ BHYT');

    const missing = firstUnanswered(INPATIENT_SECTIONS, formData);
    if (missing) return alert(`Chưa đánh giá câu ${missing.code.toUpperCase()}: ${missing.text}`);

    if (formData.satisfaction_percent == null) return alert('Chưa nhập thông tin: G1. Mức đáp ứng so với mong đợi (%)');
    if (!formData.return_intent) return alert('Chưa nhập thông tin: G2. Dự định quay lại hoặc giới thiệu');
    if (formData.return_intent === INPATIENT_RETURN_OTHER && !formData.return_intent_other?.trim()) {
      return alert('Vui lòng ghi rõ lựa chọn "Khác" ở câu G2');
    }

    onSave({
      ...formData,
      return_intent_other: formData.return_intent === INPATIENT_RETURN_OTHER ? formData.return_intent_other : ''
    });
  };

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-100 min-h-screen px-2 md:px-8">
      {!isPublic && (
        <div className="max-w-[860px] mx-auto pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-500 hover:text-[#059669] font-black text-[10px] md:text-xs uppercase p-2 transition-all"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
      )}

      <div className="max-w-[860px] mx-auto mt-4 bg-white shadow-xl border border-slate-200 px-3 py-5 md:px-12 md:py-10">
        <PatientSurveyPaper kind="noi_tru" data={formData} readOnly={readOnly} onChange={handleChange} departments={units} />
      </div>

      {!readOnly && (
        <div className="pt-8 flex justify-center">
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
  );
};
