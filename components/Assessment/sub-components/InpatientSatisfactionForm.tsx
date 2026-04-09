import React, { useState } from 'react';
import {
  ArrowLeft, Save, Info, User, Phone, MapPin, Calendar, Clock
} from 'lucide-react';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';

interface Props {
  initialData?: InpatientSurveyResponse;
  readOnly?: boolean;
  onSave: (data: InpatientSurveyResponse) => void;
  onCancel: () => void;
  saving: boolean;
  isPublic?: boolean;
}

const SCALE_LABELS: Record<number, string> = {
  1: 'Rất kém',
  2: 'Kém',
  3: 'Trung bình',
  4: 'Tốt',
  5: 'Rất tốt',
  0: 'Không áp dụng'
};

const CATEGORIES = [
  {
    name: "A. Khả năng tiếp cận và di chuyển",
    questions: [
      { id: 1, text: "Thời gian chờ đợi và mật độ sử dụng thang máy" },
      { id: 2, text: "Sự hỗ trợ di chuyển bệnh nhân giữa các khu vực" }
    ]
  },
  {
    name: "B. Minh bạch thông tin và thủ tục",
    questions: [
      { id: 3, text: "Thời gian thực hiện thủ tục ra viện" },
      { id: 4, text: "Bác sĩ giải thích tình trạng bệnh rõ ràng" }
    ]
  },
  {
    name: "C. Cơ sở vật chất",
    questions: [
      { id: 5, text: "Wifi/Internet tại buồng bệnh" },
      { id: 6, text: "Vệ sinh buồng bệnh và nhà vệ sinh" },
      { id: 7, text: "Đảm bảo sự riêng tư" },
      { id: 8, text: "Tình trạng giường bệnh" }
    ]
  },
  {
    name: "D. Thái độ nhân viên",
    questions: [
      { id: 9, text: "Nhân viên không sử dụng điện thoại khi làm việc" },
      { id: 10, text: "Thái độ bảo vệ, hành chính, phát cơm" }
    ]
  },
  {
    name: "E. Kết quả dịch vụ",
    questions: [
      { id: 11, text: "Cung ứng thuốc/vật tư" },
      { id: 12, text: "Chất lượng chế độ ăn" }
    ]
  }
];

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
      full_name: '',
      phone: '',
      department: '',
      hospital_days: 1,
      respondent: 'patient',
      q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3, q8: 3, q9: 3, q10: 3, q11: 3, q12: 3,
      satisfaction_percent: 80,
      return_intent: 'yes',
      feedback: ''
    }
  );

  const handleChange = (field: keyof InpatientSurveyResponse, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScoreChange = (qId: number, value: number) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [`q${qId}`]: value } as any));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const themeColor = "#009900";

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen px-4 md:px-8">
      {/* HEADER SECTION - GREEN BACKGROUND */}
      <div className={`bg-[${themeColor}] text-white p-5 md:p-8 rounded-2xl shadow-xl text-center space-y-4 mt-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        {!isPublic && (
          <div className="flex justify-start mb-2 relative z-10">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-1 mb-2 relative z-10">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight uppercase text-center">
            Phiếu khảo sát sự hài lòng
          </h1>
          <div className="flex items-center gap-3 flex-wrap justify-center font-black uppercase tracking-tight text-lg md:text-xl lg:text-2xl">
            <span>Người bệnh Nội trú</span>
            <span>NĂM 2026</span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-white/90 w-full max-w-5xl mx-auto font-medium leading-relaxed px-6 text-center relative z-10">
          Mục tiêu: Đánh giá chất lượng dịch vụ y tế tại các khoa nội trú nhằm cải thiện trải nghiệm và
          chất lượng điều trị. Ý kiến của Anh/Chị là cơ sở quan trọng để bệnh viện đổi mới phục vụ.
        </p>
      </div>

      <div className="space-y-8 mt-8">
        {/* Section 1: Thông tin chung */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">1. THÔNG TIN NGƯỜI BỆNH</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User size={14} className="text-[#009900]" /> 1.1. Họ và tên:
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Nhập tên người bệnh..."
                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Phone size={14} className="text-[#009900]" /> 1.2. Số điện thoại:
              </label>
              <input
                type="tel"
                disabled={readOnly}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Nhập số điện thoại..."
                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={14} className="text-[#009900]" /> 1.3. Khoa điều trị:
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Nhập tên khoa..."
                className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} className="text-[#009900]" /> 1.4. Số ngày nằm viện:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  disabled={readOnly}
                  value={formData.hospital_days}
                  onChange={(e) => handleChange('hospital_days', parseInt(e.target.value) || 0)}
                  className="w-24 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-black text-slate-800 text-lg outline-none focus:border-blue-500 transition-all"
                />
                <span className="font-bold text-slate-500 text-sm">ngày</span>
              </div>
            </div>

            <div className="space-y-3 lg:col-span-2">
              <label className="text-[11px] font-black text-slate-900 uppercase tracking-wider">1.5. Đối tượng trả lời:</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'patient', label: 'Người bệnh' },
                  { value: 'relative', label: 'Người nhà' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleChange('respondent', opt.value)}
                    className={`px-10 py-4 rounded-xl border transition-all text-xs font-black uppercase ${formData.respondent === opt.value
                        ? 'border-[#009900] bg-[#009900] text-white shadow-lg ring-1 ring-[#009900]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Đánh giá dịch vụ */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">2. ĐÁNH GIÁ CỦA NGƯỜI BỆNH</h3>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
            <Info className="text-emerald-600 shrink-0" size={20} />
            <p className="italic text-emerald-800 text-sm font-medium leading-relaxed">
              Vui lòng chọn mức độ từ 1 đến 5 (1: Rất kém {"->"} 5: Rất tốt). Trường hợp không sử dụng dịch vụ hãy chọn số 0.
            </p>
          </div>

          <div className="space-y-12 mt-8">
            {CATEGORIES.map((cat, catIdx) => (
              <div key={cat.name} className="space-y-6">
                <div className="bg-[#009900] p-4 rounded-xl shadow-md border-l-8 border-emerald-900/30">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">{cat.name}</h4>
                </div>

                <div className="divide-y divide-slate-100">
                  {cat.questions.map((q) => (
                    <div key={q.id} className="flex flex-col lg:flex-row lg:items-center gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="flex gap-4 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0 border border-emerald-100">
                          {q.id}
                        </span>
                        <p className="text-sm font-black text-black leading-relaxed">{q.text}</p>
                      </div>

                      <div className="flex items-center justify-between gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar py-1">
                        {[1, 2, 3, 4, 5, 0].map(val => (
                          <div key={val} className="flex flex-col items-center gap-1 min-w-[50px]">
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() => handleScoreChange(q.id, val)}
                              className={`w-11 h-11 rounded-full border-2 transition-all flex items-center justify-center text-sm font-black ${(formData[`q${q.id}` as keyof InpatientSurveyResponse] as number) === val
                                  ? 'bg-[#009900] border-[#009900] text-white shadow-lg scale-110'
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-400'
                                }`}
                            >
                              {val === 0 ? '0' : val}
                            </button>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                              {val === 1 ? 'Rất kém' : val === 5 ? 'Rất tốt' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Đánh giá chung */}
        <div className="bg-white p-8 md:p-10 rounded-[2rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">3. ĐÁNH GIÁ CHUNG VÀ GÓP Ý</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-black uppercase tracking-widest flex items-center justify-between">
                  <span>Mức độ hài lòng chung:</span>
                  <span className="text-emerald-600 font-black text-base">{formData.satisfaction_percent}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  disabled={readOnly}
                  value={formData.satisfaction_percent}
                  onChange={(e) => handleChange('satisfaction_percent', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#009900]"
                />
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <label className="text-[11px] font-black text-black uppercase tracking-widest">Dự định quay lại hoặc giới thiệu:</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: 'no', label: 'Chắc chắn không', color: '#ef4444' },
                    { value: 'maybe', label: 'Có thể', color: '#f59e0b' },
                    { value: 'yes', label: 'Chắc chắn', color: '#009900' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleChange('return_intent', opt.value)}
                      className={`p-5 rounded-2xl border text-left transition-all ${formData.return_intent === opt.value
                          ? 'border-[#009900] bg-[#009900] text-white shadow-xl'
                          : 'border-slate-100 bg-slate-50/50 text-slate-600'
                        }`}
                    >
                      <span className="text-xs font-black uppercase">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-black uppercase tracking-widest">Ý kiến đóng góp khác:</label>
              <textarea
                disabled={readOnly}
                value={formData.feedback}
                onChange={(e) => handleChange('feedback', e.target.value)}
                placeholder="Vui lòng chia sẻ thêm ý kiến của Anh/Chị để bệnh viện phục vụ tốt hơn..."
                className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 min-h-[280px] resize-none transition-all shadow-inner"
              />
            </div>
          </div>

          {!readOnly && (
            <div className="pt-10 border-t border-slate-100 flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-3 px-16 py-5 bg-[#009900] hover:bg-emerald-700 text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
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

      {/* Footer Meta */}
      <div className="py-12 text-center text-slate-400">
        <p className="text-[9px] font-black uppercase tracking-[0.2em]">&copy; 2026 Bệnh viện Quân y - Hệ thống quản lý chất lượng</p>
      </div>
    </div>
  );
};
