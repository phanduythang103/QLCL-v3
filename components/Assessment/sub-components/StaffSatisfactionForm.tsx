import React, { useState } from 'react';
import { ArrowLeft, Save, ClipboardList, Info } from 'lucide-react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

interface Props {
  initialData?: StaffSatisfactionSurvey;
  readOnly?: boolean;
  onSave: (data: StaffSatisfactionSurvey) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

const SCALE_LABELS: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng'
};

const QUESTIONS = [
  { id: 'q1', text: 'Thu nhập tương xứng công việc', group: 'A. THU NHẬP & PHÚC LỢI' },
  { id: 'q2', text: 'Minh bạch thu nhập tăng thêm', group: 'A. THU NHẬP & PHÚC LỢI' },
  { id: 'q3', text: 'Phụ cấp trực, thưởng', group: 'A. THU NHẬP & PHÚC LỢI' },
  { id: 'q4', text: 'Chăm sóc đời sống NVYT', group: 'A. THU NHẬP & PHÚC LỢI' },
  { id: 'q5', text: 'Nhân lực đủ để đáp ứng công việc', group: 'B. ÁP LỰC CÔNG VIỆC' },
  { id: 'q6', text: 'Tần suất trực hợp lý', group: 'B. ÁP LỰC CÔNG VIỆC' },
  { id: 'q7', text: 'Phân công công việc công bằng', group: 'B. ÁP LỰC CÔNG VIỆC' },
  { id: 'q8', text: 'Hệ thống CNTT (Phần mềm, máy tính)', group: 'C. ĐIỀU KIỆN LÀM VIỆC' },
  { id: 'q9', text: 'Trang thiết bị chuyên môn', group: 'C. ĐIỀU KIỆN LÀM VIỆC' },
  { id: 'q10', text: 'Hậu cần (ăn, nghỉ)', group: 'C. ĐIỀU KIỆN LÀM VIỆC' },
  { id: 'q11', text: 'Ban Giám đốc lắng nghe ý kiến', group: 'D. LÃNH ĐẠO & PHÁT TRIỂN' },
  { id: 'q12', text: 'Cơ hội đào tạo nghiệp vụ', group: 'D. LÃNH ĐẠO & PHÁT TRIỂN' },
  { id: 'q13', text: 'Sự đoàn kết nội bộ', group: 'D. LÃNH ĐẠO & PHÁT TRIỂN' },
];

const PRESSURE_OPTIONS = [
  { value: 'low_income', label: 'Thu nhập thấp' },
  { value: 'too_many_shifts', label: 'Trực nhiều' },
  { value: 'system_slow', label: 'Phần mềm chậm' },
  { value: 'unfair', label: 'Thiếu công bằng' },
  { value: 'other', label: 'Khác' },
];

export const StaffSatisfactionForm: React.FC<Props> = ({
  initialData,
  readOnly = false,
  onSave,
  onCancel,
  saving,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<StaffSatisfactionSurvey>(
    initialData || {
      block: '',
      position: '',
      years: 0,
      q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null, q10: null, q11: null, q12: null, q13: null,
      pressure: [],
      pressure_other: '',
      financial_suggestion: '',
      stay_intent: '',
      suggestion: ''
    }
  );

  const handleChange = (field: keyof StaffSatisfactionSurvey, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePressureToggle = (value: string) => {
    if (readOnly) return;
    const current = formData.pressure || [];
    if (current.includes(value)) {
      setFormData({ ...formData, pressure: current.filter(v => v !== value) });
    } else {
      setFormData({ ...formData, pressure: [...current, value] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.block) return alert('Chưa nhập thông tin: Khối công tác');
    if (!formData.position) return alert('Chưa nhập thông tin: Vị trí công tác');
    if (formData.years === null || formData.years === undefined) return alert('Chưa nhập thông tin: Thâm niên');

    for (const q of QUESTIONS) {
      if (formData[q.id as keyof StaffSatisfactionSurvey] === null) {
        return alert(`Chưa nhập thông tin: ${q.text}`);
      }
    }

    if (!formData.stay_intent) return alert('Chưa nhập thông tin: Ý định gắn bó');

    onSave(formData);
  };

  const groupedQuestions = QUESTIONS.reduce((acc, q) => {
    const group = q.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(q);
    return acc;
  }, {} as Record<string, typeof QUESTIONS>);

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="bg-[#009900] text-white p-10 md:p-14 rounded-3xl shadow-2xl space-y-4 mx-auto max-w-6xl mt-4 relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />

        {!isPublic && (
          <div className="flex justify-start mb-4 relative z-10 text-left">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
        )}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight relative z-10">Khảo sát hài lòng Nhân viên y tế</h1>
        <p className="text-sm opacity-90 max-w-3xl mx-auto font-medium relative z-10">
          Chương trình khảo sát dành cho NVYT năm 2026 nhằm nâng cao chất lượng môi trường làm việc và đời sống cán bộ.
          Ý kiến của bạn sẽ được bảo mật tuyệt đối.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 mt-8 px-4">
        {/* Section 1: Thông tin chung */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full" />
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">1. THÔNG TIN CHUNG</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">1.1. Khối công tác:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'clinical', label: 'Khối Lâm sàng' },
                  { value: 'subclinical', label: 'Khối Cận lâm sàng' },
                  { value: 'admin', label: 'Khối Hành chính' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('block', opt.value)}
                    className={`px-6 py-4 rounded-xl border-2 transition-all text-xs font-black uppercase ${formData.block === opt.value ? 'bg-[#009900] border-[#009900] text-white shadow-md' : 'bg-white border-slate-50 text-slate-500 hover:border-[#009900]/30'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">1.2. Vị trí:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'doctor', label: 'Bác sĩ' },
                  { value: 'nurse', label: 'Điều dưỡng/Kỹ thuật viên' },
                  { value: 'contract', label: 'Hợp đồng lao động' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('position', opt.value)}
                    className={`px-6 py-4 rounded-xl border-2 transition-all text-xs font-black uppercase ${formData.position === opt.value ? 'bg-[#009900] border-[#009900] text-white shadow-md' : 'bg-white border-slate-50 text-slate-500 hover:border-[#009900]/30'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">1.3. Thâm niên (năm):</label>
              <input
                type="number"
                min="0"
                value={formData.years}
                onChange={(e) => handleChange('years', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 text-2xl font-black text-slate-800 focus:border-[#009900] outline-none transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Đánh giá */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full" />
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">2. ĐÁNH GIÁ MÔI TRƯỜNG LÀM VIỆC</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {Object.entries(groupedQuestions).map(([groupName, questions]) => (
              <div key={groupName} className="py-10 first:pt-0 last:pb-0 space-y-6">
                <h4 className="text-sm font-black text-[#009900] uppercase tracking-[0.2em] bg-emerald-50 px-4 py-2 rounded-lg inline-block">{groupName}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {questions.map((q) => (
                    <div key={q.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-50 hover:bg-white hover:border-emerald-100 transition-all gap-6">
                      <p className="text-[17px] font-bold text-slate-700 leading-relaxed flex-1">{q.text}</p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleChange(q.id as any, val)}
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xs font-black ${formData[q.id as keyof StaffSatisfactionSurvey] === val ? 'bg-[#009900] border-[#009900] text-white shadow-lg scale-110' : 'bg-white border-slate-100 text-slate-300 hover:border-emerald-300'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Phân tích & Đề xuất */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full" />
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">3. PHÂN TÍCH & ĐỀ XUẤT CẢI TIẾN</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest pl-2">Áp lực chính bạn đang gặp:</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESSURE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePressureToggle(opt.value)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${formData.pressure?.includes(opt.value) ? 'bg-emerald-50 border-[#009900] text-[#009900]' : 'bg-white border-slate-50 text-slate-400 hover:border-emerald-200'}`}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${formData.pressure?.includes(opt.value) ? 'bg-[#009900] border-[#009900]' : 'bg-white border-slate-200'}`}>
                      {formData.pressure?.includes(opt.value) && <Info size={12} className="text-white" />}
                    </div>
                    <span className="text-[13px] font-black uppercase">{opt.label}</span>
                  </button>
                ))}
              </div>
              {formData.pressure?.includes('other') && (
                <input
                  type="text"
                  placeholder="Vui lòng nhập áp lực khác..."
                  value={formData.pressure_other}
                  onChange={(e) => handleChange('pressure_other', e.target.value)}
                  className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none"
                />
              )}
            </div>

            <div className="space-y-6">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest pl-2">Ý định gắn bó (Năm 2026):</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'stay', label: 'Tôi sẽ tiếp tục gắn bó' },
                  { value: 'consider', label: 'Tôi đang xem xét các lựa chọn' },
                  { value: 'leave', label: 'Tôi có kế hoạch thay đổi' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('stay_intent', opt.value)}
                    className={`px-8 py-5 rounded-2xl border-2 text-left transition-all text-xs font-black uppercase ${formData.stay_intent === opt.value ? 'bg-[#009900] border-[#009900] text-white shadow-xl' : 'bg-white border-slate-50 text-slate-500'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <label className="text-[13px] font-black text-slate-500 uppercase tracking-widest pl-2">Đề xuất cụ thể để cải thiện thu nhập & môi trường:</label>
              <textarea
                value={formData.suggestion}
                onChange={(e) => handleChange('suggestion', e.target.value)}
                placeholder="Vui lòng chia sẻ mong muốn/đề xuất chi tiết với Ban Giám đốc..."
                className="w-full bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#009900] min-h-[150px] transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="group flex items-center gap-4 px-20 py-6 bg-[#009900] hover:bg-emerald-700 text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
            {saving ? 'Đang gửi...' : 'Xác nhận gửi khảo sát'}
          </button>
        </div>
      </div>
    </div>
  );
};
