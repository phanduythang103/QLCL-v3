import React from 'react';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';

interface Props {
  data: OutpatientSurveyResponse | undefined;
  onBack: () => void;
}

const CATEGORIES = [
  {
    stt: 'A',
    name: "Tiếp cận và chỉ dẫn",
    questions: [
      { id: 1, text: "Sự thuận tiện tại khu vực gửi xe" },
      { id: 2, text: "Phân luồng Quân - Dân rõ ràng" },
      { id: 3, text: "Biển báo và hướng dẫn tại sảnh" }
    ]
  },
  {
    stt: 'B',
    name: "Thời gian chờ đợi",
    questions: [
      { id: 4, text: "Thời gian đăng ký và thanh toán" },
      { id: 5, text: "Chờ siêu âm, chiếu chụp" },
      { id: 6, text: "Thời gian trả kết quả xét nghiệm" }
    ]
  },
  {
    stt: 'C',
    name: "Cơ sở vật chất",
    questions: [
      { id: 7, text: "Ghế ngồi chờ" },
      { id: 8, text: "Nhà vệ sinh" },
      { id: 9, text: "Wifi" }
    ]
  },
  {
    stt: 'D',
    name: "Nhân viên",
    questions: [
      { id: 10, text: "Thái độ nhân viên hành chính" },
      { id: 11, text: "Bác sĩ tư vấn, lắng nghe" },
      { id: 12, text: "Thực hiện kỹ thuật của học viên" },
      { id: 13, text: "Không dùng điện thoại khi làm việc" }
    ]
  },
  {
    stt: 'E',
    name: "Kết quả và chi phí",
    questions: [
      { id: 14, text: "Tin tưởng kết quả chẩn đoán" },
      { id: 15, text: "Minh bạch chi phí" }
    ]
  }
];

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

  const renderScore = (currentScore: number) => {
    if (currentScore === 0) return <span className="text-[10px] text-slate-300 font-black italic">N/A</span>;
    const scores = [1, 2, 3, 4, 5];

    return (
      <div className="flex items-center gap-2 md:gap-3 font-sans">
        {scores.map(val => (
          <span
            key={val}
            className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-slate-300 text-[9px] md:text-[11px] font-bold transition-all
              ${currentScore === val ? 'bg-[#059669] text-white border-[#059669] ring-2 ring-[#059669]/20 scale-110 md:scale-125' : 'text-slate-400 opacity-60'}`}
          >
            {val}
          </span>
        ))}
      </div>
    );
  };

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
            <h1 className="text-lg md:text-2xl font-black text-slate-900 leading-tight uppercase">
              PHIẾU KHẢO SÁT SỰ HÀI LÒNG NGƯỜI BỆNH NGOẠI TRÚ
            </h1>
            <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide uppercase">
              Năm 2026 - Bệnh viện Quân y
            </p>
          </div>

          {/* Section 1: Thông tin chung */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">1. THÔNG TIN NGƯỜI BỆNH</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Họ và tên:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-[#059669] uppercase tracking-wide">
                  {data.full_name || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">SĐT:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.phone || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Khu vực khám:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold uppercase">
                  {AREA_LABELS[data.area || ''] || data.area || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Thời điểm khám:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.visit_time || '...........................................'}
                </span>
              </div>

              <div className="flex flex-col gap-2 md:gap-3 md:col-span-2 mt-2">
                <span className="font-bold">Đối tượng trả lời:</span>
                <div className="flex gap-6 md:gap-8 pl-2 md:pl-4">
                  {[
                    { val: 'patient', label: 'Người bệnh' },
                    { val: 'relative', label: 'Người nhà' }
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-1.5 md:gap-2">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.respondent === opt.val ? 'bg-[#059669] border-[#059669]' : ''}`}>
                        {data.respondent === opt.val && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className={data.respondent === opt.val ? 'font-bold text-[#059669]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Đánh giá */}
          <div className="space-y-4 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              2. ĐÁNH GIÁ CỦA NGƯỜI BỆNH
            </h3>

            <div className="border border-slate-900 overflow-hidden text-[11px] md:text-[13px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="border border-slate-900 px-1 md:px-3 py-2 md:py-3 w-8 md:w-12 text-center uppercase font-black">STT</th>
                    <th className="border border-slate-900 px-2 md:px-4 py-2 md:py-3 text-left uppercase font-black tracking-tight">Nội dung khảo sát</th>
                    <th className="border border-slate-900 px-2 md:px-6 py-2 md:py-3 w-28 md:w-48 text-center uppercase font-black">Mức độ hài lòng</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map(cat => (
                    <React.Fragment key={cat.stt}>
                      {/* Category Header Row */}
                      <tr>
                        <td className="border border-slate-900 bg-slate-50 font-black text-center px-1 py-2 md:py-3">{cat.stt}</td>
                        <td className="border border-slate-900 bg-slate-50 font-black px-2 md:px-4 py-2 md:py-3 uppercase tracking-tight">{cat.name}</td>
                        <td className="border border-slate-900 bg-slate-50"></td>
                      </tr>
                      {/* Questions Rows */}
                      {cat.questions.map(q => (
                        <tr key={q.id}>
                          <td className="border border-slate-900 text-center px-1 py-3 md:py-4 text-slate-600 font-bold">{q.id}</td>
                          <td className="border border-slate-900 px-2 md:px-4 py-3 md:py-4 leading-relaxed font-medium text-slate-800">{q.text}</td>
                          <td className="border border-slate-900 px-2 md:px-6 py-3 md:py-4">
                            <div className="flex justify-center">
                              {renderScore((data as any)[`q${q.id}`] || 0)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Góp ý */}
          <div className="space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              3. PHẢN HỒI VÀ GÓP Ý
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <span className="font-bold uppercase tracking-tight text-amber-600">Nguyên nhân mệt mỏi:</span>
                  <div className="flex flex-wrap gap-2">
                    {data.waiting_issues && data.waiting_issues.length > 0 ? (
                      data.waiting_issues.map(issue => (
                        <span key={issue} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 font-bold text-[10px] uppercase">
                          {issue}
                        </span>
                      ))
                    ) : <span className="italic text-slate-400">Không có phản ánh</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="font-bold uppercase tracking-tight text-[#059669]">Ưu tiên cải tiến:</span>
                  <div className="flex flex-wrap gap-2">
                    {data.priority_improvement && data.priority_improvement.length > 0 ? (
                      data.priority_improvement.map(item => (
                        <span key={item} className="px-3 py-1 bg-emerald-50 text-[#059669] rounded-lg border border-emerald-100 font-bold text-[10px] uppercase">
                          {item}
                        </span>
                      ))
                    ) : <span className="italic text-slate-400">Không có phản ánh</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight">Ý kiến khác:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 min-h-[120px] whitespace-pre-wrap leading-relaxed">
                  {data.feedback || "Không có nội dung góp ý."}
                </div>
              </div>
            </div>
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
