import React from 'react';
import { ArrowLeft, Printer, CheckCircle2, User, UserCheck, Briefcase, Calendar, Info, Star, ClipboardList } from 'lucide-react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

interface Props {
  data: StaffSatisfactionSurvey | null | undefined;
  onBack: () => void;
}

const CATEGORIES = [
  {
    stt: 'A',
    name: 'THU NHẬP & PHÚC LỢI',
    questions: [
      { id: 'q1', text: 'Thu nhập tương xứng công việc' },
      { id: 'q2', text: 'Minh bạch thu nhập tăng thêm' },
      { id: 'q3', text: 'Phụ cấp trực, thưởng' },
      { id: 'q4', text: 'Chăm sóc đời sống NVYT' },
    ],
  },
  {
    stt: 'B',
    name: 'ÁP LỰC CÔNG VIỆC',
    questions: [
      { id: 'q5', text: 'Nhân lực đủ để đáp ứng công việc' },
      { id: 'q6', text: 'Tần suất trực hợp lý' },
      { id: 'q7', text: 'Phân công công việc công bằng' },
    ],
  },
  {
    stt: 'C',
    name: 'ĐIỀU KIỆN LÀM VIỆC',
    questions: [
      { id: 'q8', text: 'Hệ thống CNTT (Phần mềm, máy tính)' },
      { id: 'q9', text: 'Trang thiết bị chuyên môn' },
      { id: 'q10', text: 'Hậu cần (ăn, nghỉ)' },
    ],
  },
  {
    stt: 'D',
    name: 'LÃNH ĐẠO & PHÁT TRIỂN',
    questions: [
      { id: 'q11', text: 'Ban Giám đốc lắng nghe ý kiến' },
      { id: 'q12', text: 'Cơ hội đào tạo nghiệp vụ' },
      { id: 'q13', text: 'Sự đoàn kết nội bộ' },
    ],
  },
];

const BLOCK_LABELS: Record<string, string> = {
  'clinical': 'Khối Lâm sàng',
  'subclinical': 'Khối Cận lâm sàng',
  'admin': 'Khối Hành chính'
};

const POSITION_LABELS: Record<string, string> = {
  'doctor': 'Bác sĩ',
  'nurse': 'Điều dưỡng/Kỹ thuật viên',
  'contract': 'Hợp đồng lao động'
};

const STAY_INTENT_LABELS: Record<string, string> = {
  'stay': 'Tiếp tục gắn bó',
  'consider': 'Đang xem xét lựa chọn',
  'leave': 'Có kế hoạch thay đổi'
};

export const StaffSatisfactionDetail: React.FC<Props> = ({ data, onBack }) => {
  if (!data) return null;

  const handlePrint = () => window.print();

  const renderScore = (val: number) => (
    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shadow-sm ${val >= 4 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
      val >= 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
        'bg-rose-50 text-rose-600 border-rose-100'
      }`}>
      {val}
    </span>
  );

  return (
    <div className="w-full h-full bg-slate-50 p-4 md:p-8 animate-in fade-in duration-500 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between no-print">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-[10px] uppercase p-3 hover:bg-emerald-50 rounded-2xl transition-all"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg hover:bg-slate-900 transition-all"
          >
            <Printer size={16} /> In phiếu khảo sát
          </button>
        </div>

        {/* Paper Container */}
        <div className="bg-white p-8 md:p-14 shadow-2xl rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#009900]/5 rounded-full -mr-32 -mt-32 blur-3xl no-print" />

          {/* Header */}
          <div className="text-center mb-12 relative z-10">
            <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
              KẾT QUẢ KHẢO SÁT HÀI LÒNG NVYT
            </h1>
            <p className="text-sm font-bold text-[#009900] uppercase tracking-widest mt-1">Cán bộ, Nhân viên y tế Năm 2026</p>
            <div className="w-24 h-1 bg-[#009900] mx-auto mt-6 rounded-full" />
          </div>

          {/* Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                <User size={12} /> Thông tin cán bộ
              </h3>
              <div className="space-y-2 pl-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Khối:</span>
                  <span className="text-xs font-black text-slate-800">{BLOCK_LABELS[data.block] || data.block}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Vị trí:</span>
                  <span className="text-xs font-black text-slate-800">{POSITION_LABELS[data.position] || data.position}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Thâm niên:</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{data.years} năm</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                <Star size={12} /> Ý định công tác
              </h3>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 h-[calc(100%-2rem)] flex flex-col justify-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Dự kiến năm 2026</span>
                <span className={`text-sm font-black uppercase ${data.stay_intent === 'stay' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {STAY_INTENT_LABELS[data.stay_intent] || data.stay_intent}
                </span>
              </div>
            </div>
          </div>

          {/* Evaluation Detail */}
          <div className="space-y-8 mb-12">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
              <ClipboardList size={12} /> Chi tiết điểm đánh giá
            </h3>

            <div className="space-y-12">
              {CATEGORIES.map(cat => (
                <div key={cat.stt} className="space-y-4">
                  <h4 className="text-[10px] font-black text-white bg-[#009900] px-4 py-1.5 rounded-full inline-block shadow-sm">
                    {cat.stt}. {cat.name}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.questions.map(q => (
                      <div key={q.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition-colors shadow-sm">
                        <span className="text-[11px] font-bold text-slate-600 pr-4 leading-relaxed line-clamp-2">
                          {q.text}
                        </span>
                        {renderScore((data as any)[q.id])}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues & Suggestions */}
          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Áp lực công việc đang gặp phải:</p>
              <div className="flex flex-wrap gap-2">
                {data.pressure && data.pressure.length > 0 ? (
                  data.pressure.map(p => (
                    <span key={p} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase shadow-sm">
                      {p === 'low_income' ? 'Thu nhập thấp' : p === 'too_many_shifts' ? 'Trực nhiều' : p === 'system_slow' ? 'Phần mềm chậm' : p === 'unfair' ? 'Thiếu công bằng' : 'Áp lực khác'}
                    </span>
                  ))
                ) : <span className="text-xs text-slate-400 italic">Không có phản ánh</span>}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Đề xuất cải tiến cụ thể:</p>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-inner text-sm italic font-medium text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                {data.suggestion || "Không có đề xuất cụ thể."}
              </div>
            </div>
          </div>

          {/* Footer Card */}
          <div className="mt-16 text-center border-t border-slate-50 pt-8 no-print">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">&copy; 2026 BỆNH VIỆN QUÂN Y - PHÒNG QUẢN LÝ CHẤT LƯỢNG</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0 !important; }
          .max-w-4xl { max-width: 100% !important; border: none !important; }
          .shadow-2xl, .shadow-xl { box-shadow: none !important; }
          .rounded-[2.5rem] { border-radius: 0 !important; border: 1px solid #eee !important; }
          .p-14 { padding: 3rem !important; }
        }
      `}} />
    </div>
  );
};
