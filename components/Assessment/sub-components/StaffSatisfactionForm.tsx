import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, ClipboardList, Info
} from 'lucide-react';
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
  { id: 'q1', text: 'Sự tương xứng giữa thu nhập (Lương, ABC, Phụ cấp) với cường độ lao động', group: 'A. TIỀN LƯƠNG, PHỤ CẤP VÀ PHÚC LỢI' },
  { id: 'q2', text: 'Tính minh bạch, công bằng trong việc chi trả thu nhập tăng thêm tại đơn vị', group: 'A. TIỀN LƯƠNG, PHỤ CẤP VÀ PHÚC LỢI' },
  { id: 'q3', text: 'Chế độ phụ cấp trực đêm, phụ cấp độc hại và các khoản thưởng lễ, tết', group: 'A. TIỀN LƯƠNG, PHỤ CẤP VÀ PHÚC LỢI' },
  { id: 'q4', text: 'Các chính sách chăm sóc sức khỏe, tham quan, nghỉ mát cho NVYT', group: 'A. TIỀN LƯƠNG, PHỤ CẤP VÀ PHÚC LỢI' },
  { id: 'q5', text: 'Định mức nhân sự tại khoa/phòng hiện tại (có đủ người để đảm bảo công việc?)', group: 'B. ÁP LỰC CÔNG VIỆC VÀ PHÂN CÔNG NHÂN LỰC' },
  { id: 'q6', text: 'Tần suất trực đêm (số buổi trực/tuần) và thời gian nghỉ bù sau trực', group: 'B. ÁP LỰC CÔNG VIỆC VÀ PHÂN CÔNG NHÂN LỰC' },
  { id: 'q7', text: 'Phân công công việc công bằng giữa các vị trí trong khoa/phòng', group: 'B. ÁP LỰC CÔNG VIỆC VÀ PHÂN CÔNG NHÂN LỰC' },
  { id: 'q8', text: 'Hệ thống phần mềm CNTT (HIS, LIS, PACS) hoạt động ổn định, hiệu quả', group: 'C. ĐIỀU KIỆN LÀM VIỆC VÀ HẬU CẦN' },
  { id: 'q9', text: 'Trang thiết bị, vật tư tiêu hao đầy đủ cho công tác chuyên môn', group: 'C. ĐIỀU KIỆN LÀM VIỆC VÀ HẬU CẦN' },
  { id: 'q10', text: 'Hệ thống hậu cần (ăn, nghỉ tại viện) đáp ứng nhu cầu NVYT', group: 'C. ĐIỀU KIỆN LÀM VIỆC VÀ HẬU CẦN' },
  { id: 'q11', text: 'Ban Giám đốc luôn lắng nghe và giải quyết kịp thời các kiến nghị của NVYT', group: 'D. LÃNH ĐẠO VÀ PHÁT TRIỂN NGHỀ NGHIỆP' },
  { id: 'q12', text: 'Cơ hội đào tạo nâng cao trình độ chuyên môn, kỹ năng nghiệp vụ', group: 'D. LÃNH ĐẠO VÀ PHÁT TRIỂN NGHỀ NGHIỆP' },
  { id: 'q13', text: 'Sự đoàn kết, hỗ trợ lẫn nhau giữa các đồng nghiệp trong viện', group: 'D. LÃNH ĐẠO VÀ PHÁT TRIỂN NGHỀ NGHIỆP' },
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
      block: 'clinical',
      position: 'doctor',
      years: 0,
      q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3, q11: 3, q12: 3, q13: 3,
      pressure: [],
      pressure_other: '',
      financial_suggestion: '',
      stay_intent: 'stay',
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
    onSave(formData);
  };

  const groupedQuestions = QUESTIONS.reduce((acc, q) => {
    const group = q.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(q);
    return acc;
  }, {} as Record<string, typeof QUESTIONS>);

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen px-4 md:px-8">
      {/* HEADER SECTION - GREEN BACKGROUND */}
      <div className="bg-[#009900] text-white p-8 md:p-12 rounded-2xl shadow-xl text-center space-y-6 mt-6">
        {!isPublic && (
          <div className="flex justify-start mb-4">
               <button 
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all"
              >
                  <ArrowLeft size={16} /> Quay lại
              </button>
          </div>
        )}
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight uppercase text-center">
            Phiếu khảo sát sự hài lòng
          </h1>
          <div className="flex items-center gap-3 flex-wrap justify-center font-black uppercase tracking-tight text-xl md:text-2xl lg:text-3xl">
             <span>Nhân viên y tế</span>
             <span>NĂM 2026</span>
          </div>
        </div>
        <p className="text-sm md:text-base text-white/90 w-full max-w-5xl mx-auto font-medium leading-relaxed px-6 text-center">
          Mục tiêu: Nhận diện các khó khăn, vướng mắc trong môi trường làm việc và chế độ đãi ngộ 
          để xây dựng chính sách hỗ trợ tốt hơn. Bệnh viện cam kết bảo mật danh tính người điền phiếu.
        </p>
      </div>

      <div className="space-y-8 mt-8">
        {/* Section 1: Thông tin chung */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-[#009900] rounded-full"></div>
             <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">1. THÔNG TIN CHUNG (TÙY CHỌN)</h3>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider">1.1. Khối công tác:</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'clinical', label: 'Lâm sàng' },
                  { value: 'subclinical', label: 'Cận lâm sàng' },
                  { value: 'admin', label: 'Cơ quan' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleChange('block', opt.value)}
                    className={`px-8 py-4 rounded-xl border transition-all text-xs font-bold ${
                      formData.block === opt.value 
                        ? 'border-[#009900] bg-white text-[#009900] ring-1 ring-[#009900]' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider">1.2. Vị trí:</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'doctor', label: 'Bác sĩ / Sĩ quan' },
                  { value: 'nurse', label: 'Điều dưỡng / Kỹ thuật viên / QNCN' },
                  { value: 'contract', label: 'Lao động hợp đồng' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleChange('position', opt.value)}
                    className={`px-8 py-4 rounded-xl border transition-all text-xs font-bold ${
                      formData.position === opt.value 
                        ? 'border-[#009900] bg-white text-[#009900] ring-1 ring-[#009900]' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider">1.3. Thâm niên công tác tại viện:</label>
              <div className="flex items-center gap-4">
                <input 
                    type="number"
                    disabled={readOnly}
                    value={formData.years}
                    onChange={(e) => handleChange('years', parseInt(e.target.value) || 0)}
                    className="w-24 bg-white p-4 rounded-xl border border-slate-200 text-center font-black text-slate-800 text-lg outline-none focus:border-[#009900] transition-all"
                />
                <span className="font-bold text-slate-500 text-sm">năm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Đánh giá */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-[#009900] rounded-full"></div>
             <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">2. ĐÁNH GIÁ MÔI TRƯỜNG LÀM VIỆC VÀ CHẾ ĐỘ CHÍNH SÁCH</h3>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
            <Info className="text-[#009900] shrink-0" size={20} />
            <p className="italic text-[#007700] text-sm font-medium">
              Anh/Chị vui lòng chọn mức độ từ 1 đến 5 (1: Rất không hài lòng  &rarr;  5: Rất hài lòng).
            </p>
          </div>

          <div className="space-y-12 mt-8">
            {Object.entries(groupedQuestions).map(([groupName, questions], groupIdx) => (
              <div key={groupName} className="space-y-6">
                <div className="bg-emerald-50 p-4 rounded-xl border-l-4 border-[#009900]">
                  <h4 className="text-[11px] font-black text-[#007700] uppercase tracking-wider">{groupName}</h4>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="flex flex-col md:flex-row md:items-center gap-6 py-8 first:pt-0 last:pb-0">
                      <div className="flex gap-4 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#009900] flex items-center justify-center text-xs font-black shrink-0">
                            {q.id.replace('q', '')}
                        </span>
                        <p className="text-sm font-black text-black leading-relaxed">{q.text}</p>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 w-full md:w-auto">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleChange(q.id as any, val)}
                            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border transition-all flex items-center justify-center text-sm font-black ${
                              formData[q.id as keyof StaffSatisfactionSurvey] === val
                                ? 'bg-[#009900] border-[#009900] text-white shadow-lg'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-[#009900]'
                            }`}
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
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-[#009900] rounded-full"></div>
             <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">3. PHÂN TÍCH NGUYÊN NHÂN & ĐỀ XUẤT</h3>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-black uppercase tracking-widest">Áp lực chính bạn đang gặp:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRESSURE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handlePressureToggle(opt.value)}
                    className={`flex items-center gap-3 p-5 rounded-2xl border transition-all ${
                      formData.pressure?.includes(opt.value)
                        ? 'border-[#009900] bg-emerald-50 text-[#009900]'
                        : 'border-slate-100 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${
                      formData.pressure?.includes(opt.value) ? 'bg-[#009900] border-[#009900]' : 'bg-white border-slate-200'
                    }`}>
                      {formData.pressure?.includes(opt.value) && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                    </div>
                    <span className="text-xs font-bold uppercase">{opt.label}</span>
                  </button>
                ))}
              </div>
              {formData.pressure?.includes('other') && (
                <input 
                  type="text"
                  placeholder="Vui lòng nhập áp lực khác..."
                  disabled={readOnly}
                  value={formData.pressure_other}
                  onChange={(e) => handleChange('pressure_other', e.target.value)}
                  className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                 <label className="text-[11px] font-black text-black uppercase tracking-widest">Ý định gắn bó lâu dài:</label>
                 <div className="flex flex-col gap-2">
                    {[
                      { value: 'stay', label: 'Tôi sẽ gắn bó lâu dài', color: '#009900' },
                      { value: 'consider', label: 'Tôi đang cân nhắc các lựa chọn', color: '#f59e0b' },
                      { value: 'leave', label: 'Tôi có dự kiến rời đi', color: '#ef4444' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleChange('stay_intent', opt.value)}
                        className={`p-5 rounded-2xl border text-left transition-all ${
                          formData.stay_intent === opt.value
                            ? 'border-[#009900] bg-[#009900] text-white shadow-xl shadow-emerald-100'
                            : 'border-slate-100 bg-slate-50/50 text-slate-600'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase">{opt.label}</span>
                      </button>
                    ))}
                 </div>
               </div>

               <div className="space-y-4">
                 <label className="text-[11px] font-black text-black uppercase tracking-widest">Đề xuất cải tiến môi trường làm việc:</label>
                 <textarea 
                  disabled={readOnly}
                  value={formData.suggestion}
                  onChange={(e) => handleChange('suggestion', e.target.value)}
                  placeholder="Vui lòng chia sẻ mong muốn/đề xuất của Anh/Chị..."
                  className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#009900] min-h-[200px] resize-none"
                 />
               </div>
            </div>
          </div>

          {!readOnly && (
             <div className="pt-10 border-t border-slate-100 flex justify-center">
                <button 
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-3 px-16 py-5 bg-[#009900] hover:bg-[#007700] text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
                >
                    {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : <Save size={20} />}
                    {saving ? 'Đang gửi...' : 'Xác nhận gửi khảo sát'}
                </button>
             </div>
          )}
        </div>
      </div>
      
      {/* Footer Meta */}
      <div className="py-12 text-center text-slate-400">
         <p className="text-[9px] font-black uppercase tracking-[0.2em]">&copy; 2026 Bệnh viện Quân y - Hệ thống quản lý chất lượng</p>
      </div>
    </div>
  );
};
