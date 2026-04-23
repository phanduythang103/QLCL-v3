import React, { useState } from 'react';
import { ArrowLeft, Save, User, Phone, MapPin, Clock, Users, Star, AlertCircle } from 'lucide-react';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';
import { outpatientSatisfactionService } from '../services/outpatientSatisfactionService';

interface Props {
  initialData?: OutpatientSurveyResponse;
  readOnly?: boolean;
  onSave?: (data: OutpatientSurveyResponse) => Promise<void>;
  onCancel?: () => void;
  saving?: boolean;
  setParentViewMode?: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
  isPublic?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất kém",
  2: "Kém",
  3: "Bình thường",
  4: "Tốt",
  5: "Rất tốt",
  0: "Không sử dụng"
};

const CATEGORIES = [
  {
    name: "A. Tiếp cận và chỉ dẫn",
    questions: [
      { id: 1, text: "Sự thuận tiện tại khu vực gửi xe" },
      { id: 2, text: "Phân luồng Quân - Dân rõ ràng" },
      { id: 3, text: "Biển báo và hướng dẫn tại sảnh" }
    ]
  },
  {
    name: "B. Thời gian chờ đợi",
    questions: [
      { id: 4, text: "Thời gian đăng ký và thanh toán" },
      { id: 5, text: "Chờ siêu âm, chiếu chụp" },
      { id: 6, text: "Thời gian trả kết quả xét nghiệm" }
    ]
  },
  {
    name: "C. Cơ sở vật chất",
    questions: [
      { id: 7, text: "Ghế ngồi chờ" },
      { id: 8, text: "Nhà vệ sinh" },
      { id: 9, text: "Wifi" }
    ]
  },
  {
    name: "D. Nhân viên",
    questions: [
      { id: 10, text: "Thái độ nhân viên hành chính" },
      { id: 11, text: "Bác sĩ tư vấn, lắng nghe" },
      { id: 12, text: "Thực hiện kỹ thuật của học viên" },
      { id: 13, text: "Không dùng điện thoại khi làm việc" }
    ]
  },
  {
    name: "E. Kết quả và chi phí",
    questions: [
      { id: 14, text: "Tin tưởng kết quả chẩn đoán" },
      { id: 15, text: "Minh bạch chi phí" }
    ]
  }
];

export const OutpatientSatisfactionForm: React.FC<Props> = ({
  initialData,
  readOnly,
  onSave,
  onCancel,
  saving: propSaving,
  setParentViewMode,
  isPublic = false
}) => {
  const [formData, setFormData] = useState<OutpatientSurveyResponse>(initialData || {
    full_name: '',
    phone: '',
    area: '',
    visit_time: new Date().toISOString().split('T')[0],
    respondent: 'patient',
    q1: null, q2: null, q3: null, q4: null, q5: null, q6: null, q7: null, q8: null, q9: null, q10: null, q11: null, q12: null, q13: null, q14: null, q15: null,
    waiting_issues: [],
    priority_improvement: [],
    feedback: '',
    ngay_khao_sat: new Date().toISOString()
  });

  const [localSaving, setLocalSaving] = useState(false);
  const saving = propSaving !== undefined ? propSaving : localSaving;
  const [shift, setShift] = useState<'Sáng' | 'Chiều'>('Sáng');

  const handleChange = (field: keyof OutpatientSurveyResponse, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (qId: number, val: number) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [`q${qId}`]: val }));
  };

  const toggleWaitingIssue = (issue: string) => {
    if (readOnly) return;
    const current = formData.waiting_issues || [];
    if (current.includes(issue)) {
      setFormData(prev => ({ ...prev, waiting_issues: current.filter(i => i !== issue) }));
    } else {
      setFormData(prev => ({ ...prev, waiting_issues: [...current, issue] }));
    }
  };

  const togglePriorityImprovement = (item: string) => {
    if (readOnly) return;
    const current = formData.priority_improvement || [];
    if (current.includes(item)) {
      setFormData(prev => ({ ...prev, priority_improvement: current.filter(i => i !== item) }));
    } else {
      setFormData(prev => ({ ...prev, priority_improvement: [...current, item] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    // Validation
    if (!formData.full_name?.trim()) return alert('Chưa nhập thông tin: Họ và tên');
    if (!formData.phone?.trim()) return alert('Chưa nhập thông tin: Số điện thoại');
    if (!formData.area) return alert('Chưa nhập thông tin: Khu vực khám');

    for (let i = 1; i <= 15; i++) {
      if ((formData as any)[`q${i}`] === null || (formData as any)[`q${i}`] === undefined) {
        const qText = CATEGORIES.flatMap(c => c.questions).find(q => q.id === i)?.text || `Câu hỏi ${i}`;
        return alert(`Chưa nhập thông tin: ${qText}`);
      }
    }

    if (onSave) {
      await onSave(formData);
    } else {
      setLocalSaving(true);
      try {
        const payload = {
          ...formData,
          visit_time: `${formData.visit_time} (${shift})`,
          ngay_khao_sat: new Date().toISOString()
        };

        await outpatientSatisfactionService.createOutpatientSurvey(payload);
        alert('Gửi phiếu khảo sát thành công!');
        if (setParentViewMode) setParentViewMode('LIST');
      } catch (err) {
        console.error(err);
        alert('Lỗi khi gửi phiếu khảo sát. Vui lòng thử lại sau.');
      } finally {
        setLocalSaving(false);
      }
    }
  };

  const themeColor = '#009900';

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen px-4 md:px-8 pt-8 font-sans">
      {/* Standalone Header Card */}
      <div className="max-w-5xl mx-auto bg-[#009900] text-white p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-2xl" />

        <div className="relative z-10">
          {!isPublic && setParentViewMode && (
            <button
              type="button"
              onClick={() => setParentViewMode('LIST')}
              className="flex items-center gap-2 text-white/80 hover:text-white font-black text-xs uppercase transition-all mb-6 group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
            </button>
          )}

          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase mb-2">PHIẾU KHẢO SÁT HÀI LÒNG</h1>
            <h2 className="text-xl md:text-2xl font-bold opacity-90 uppercase truncate">Người bệnh ngoại trú 2026</h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Section 1: Thông tin chung */}
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8 border-l-4 border-[#009900] pl-4">
            <User className="text-[#009900]" size={24} />
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">1. Thông tin chung</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-500 uppercase ml-2">Họ và tên</label>
              <input
                type="text"
                required
                placeholder="Nhập họ và tên..."
                value={formData.full_name}
                onChange={e => handleChange('full_name', e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#009900] transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-500 uppercase ml-2">Số điện thoại</label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại..."
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#009900] transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[13px] font-black text-slate-500 uppercase ml-2">Khu vực khám</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { value: 'kham_dan', label: 'K. Khám bệnh (Dân)' },
                  { value: 'kham_quan', label: 'Khám Quân' },
                  { value: 'bhyt', label: 'Khám BHYT' },
                  { value: 'yeu_cau', label: 'KKB theo yêu cầu' },
                  { value: 'pk232', label: 'PK232' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('area', opt.value)}
                    className={`px-4 py-3 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.area === opt.value ? 'bg-[#009900] border-[#009900] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-[#009900]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-500 uppercase ml-2">Thời điểm khám</label>
              <div className="flex gap-4">
                <input
                  type="date"
                  value={formData.visit_time}
                  onChange={e => handleChange('visit_time', e.target.value)}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 outline-none flex-1"
                />
                <div className="flex bg-slate-100 rounded-2xl p-1">
                  {['Sáng', 'Chiều'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s as any)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${shift === s ? 'bg-white text-[#009900] shadow-sm' : 'text-slate-500'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Đối tượng trả lời</label>
              <div className="flex bg-slate-100 rounded-2xl p-1">
                {[
                  { value: 'patient', label: 'Người bệnh' },
                  { value: 'relative', label: 'Người nhà' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('respondent', opt.value)}
                    className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${formData.respondent === opt.value ? 'bg-white text-[#009900] shadow-sm' : 'text-slate-500'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Đánh giá dịch vụ */}
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8 border-l-4 border-[#009900] pl-4">
            <Star className="text-[#009900]" size={24} />
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">2. Đánh giá quy trình & dịch vụ</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">(1: Rất kém {"->"} 5: Rất tốt; 0: Không sử dụng)</p>
            </div>
          </div>

          <div className="space-y-12">
            {CATEGORIES.map(category => (
              <div key={category.name} className="space-y-6">
                <h4 className="text-sm font-black text-white uppercase tracking-wider bg-[#009900] px-6 py-2 rounded-full inline-block shadow-md">
                  {category.name}
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  {category.questions.map(q => (
                    <div key={q.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 gap-4 hover:bg-white transition-colors group">
                      <div className="flex-1">
                        <p className="text-[17px] font-bold text-slate-700">
                          <span className="text-[13px] text-slate-400 font-black mr-2 opacity-50">{q.id}.</span> {q.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5, 0].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleRatingChange(q.id, val)}
                            className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-black text-xs transition-all border-2
                              ${(formData as any)[`q${q.id}`] === val
                                ? 'bg-[#009900] border-[#009900] text-white shadow-lg'
                                : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-300'}`}
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

        {/* Section 3: Root Cause */}
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8 border-l-4 border-amber-400 pl-4">
            <AlertCircle className="text-amber-500" size={24} />
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">3. Truy vấn nguyên nhân & góp ý</h3>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-600 uppercase flex items-center gap-2">
                Nếu có chờ đợi, khâu nào khiến Ông/Bà mệt mỏi nhất?
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Đăng ký khám",
                  "Chờ bác sĩ",
                  "Chờ siêu âm/X-quang",
                  "Thanh toán",
                  "Lấy thuốc"
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleWaitingIssue(opt)}
                    className={`px-6 py-3 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.waiting_issues?.includes(opt) ? 'bg-amber-100 border-amber-400 text-amber-700 shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-amber-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-600 uppercase flex items-center gap-2">
                Ưu tiên cần cải thiện ngay:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Tăng máy siêu âm",
                  "Mở thêm quầy thanh toán",
                  "Wifi mạnh hơn",
                  "Thay đổi bảo vệ"
                ].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => togglePriorityImprovement(opt)}
                    className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all text-[10px] font-black uppercase ${formData.priority_improvement?.includes(opt) ? 'bg-[#009900] border-[#009900] text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-[#009900]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[13px] font-black text-slate-600 uppercase">Ý kiến chi tiết (nhân viên, khâu cụ thể):</label>
              <textarea
                rows={4}
                value={formData.feedback}
                onChange={e => handleChange('feedback', e.target.value)}
                placeholder="Ví dụ: mô tả nhân viên, vị trí trực nếu không hài lòng..."
                className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-[#009900] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center gap-4 pt-10">
          <button
            type="submit"
            disabled={saving}
            className="group flex items-center gap-4 px-16 py-6 bg-[#009900] hover:bg-emerald-700 text-white rounded-[2rem] font-black text-lg uppercase shadow-2xl transition-all disabled:bg-slate-300 active:scale-95"
          >
            {saving ? (
              <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Save size={24} />}
            {saving ? 'Đang gửi...' : 'Gửi phiếu khảo sát'}
          </button>
          <p className="text-[9px] font-black text-slate-300 tracking-[0.3em] uppercase">Bệnh viện Quân y 103 &copy; 2026</p>
        </div>
      </form>
    </div>
  );
};
