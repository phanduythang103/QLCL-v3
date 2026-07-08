import React from 'react';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';

interface Props {
  data: InpatientSurveyResponse | undefined;
  onBack: () => void;
}

const CATEGORIES = [
  {
    stt: 'A',
    name: "KHẢ NĂNG TIẾP CẬN VÀ DI CHUYỂN",
    questions: [
      { id: 1, text: "Thời gian chờ đợi và mật độ sử dụng thang máy" },
      { id: 2, text: "Sự hỗ trợ di chuyển bệnh nhân giữa các khu vực" }
    ]
  },
  {
    stt: 'B',
    name: "MINH BẠCH THÔNG TIN VÀ THỦ TỤC",
    questions: [
      { id: 3, text: "Thời gian thực hiện thủ tục ra viện" },
      { id: 4, text: "Bác sĩ giải thích tình trạng bệnh rõ ràng" }
    ]
  },
  {
    stt: 'C',
    name: "CƠ SỞ VẬT CHẤT",
    questions: [
      { id: 5, text: "Wifi/Internet tại buồng bệnh" },
      { id: 6, text: "Vệ sinh buồng bệnh và nhà vệ sinh" },
      { id: 7, text: "Đảm bảo sự riêng tư" },
      { id: 8, text: "Tình trạng giường bệnh" }
    ]
  },
  {
    stt: 'D',
    name: "THÁI ĐỘ NHÂN VIÊN",
    questions: [
      { id: 9, text: "Nhân viên không sử dụng điện thoại khi làm việc" },
      { id: 10, text: "Thái độ bảo vệ, hành chính, phát cơm" }
    ]
  },
  {
    stt: 'E',
    name: "KẾT QUẢ DỊCH VỤ",
    questions: [
      { id: 11, text: "Cung ứng thuốc/vật tư" },
      { id: 12, text: "Chất lượng chế độ ăn" }
    ]
  }
];

export const InpatientSatisfactionDetail: React.FC<Props> = ({ data, onBack }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderScore = (qId: number, currentScore: number) => {
    const scores1 = [1, 2, 3];
    const scores2 = [4, 5, 0];

    const ScoreIcon = ({ val }: { val: number }) => (
      <span
        key={val}
        className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-slate-300 text-[9px] md:text-[11px] font-bold transition-all
          ${currentScore === val ? 'bg-[#059669] text-white border-[#059669] ring-2 ring-[#059669]/20 scale-110 md:scale-125' : 'text-slate-400 opacity-60'}`}
      >
        {val}
      </span>
    );

    return (
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 font-sans py-1">
        <div className="flex items-center gap-2 md:gap-4">
          {scores1.map(val => <ScoreIcon key={val} val={val} />)}
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {scores2.map(val => <ScoreIcon key={val} val={val} />)}
        </div>
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
              PHIẾU KHẢO SÁT SỰ HÀI LÒNG NGƯỜI BỆNH NỘI TRÚ
            </h1>
            {data.ngay_khao_sat && (() => {
              const d = new Date(data.ngay_khao_sat);
              const pad = (n: number) => String(n).padStart(2, '0');
              const code = `NOITRU-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
              return (
                <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide">
                  (Mã khảo sát: {code})
                </p>
              );
            })()}
          </div>

          {/* Section 1: Thông tin chung */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">1. THÔNG TIN NGƯỜI BỆNH</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">1.1. Họ và tên:</span>
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
                <span className="font-bold whitespace-nowrap">1.2. Khoa điều trị:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold uppercase">
                  {data.department || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Số ngày nằm viện:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.hospital_days} ngày
                </span>
              </div>

              <div className="flex flex-col gap-2 md:gap-3 md:col-span-2 mt-2">
                <span className="font-bold">1.3. Đối tượng trả lời:</span>
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
                              {renderScore(q.id, (data as any)[`q${q.id}`])}
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

          {/* Section 3: Đánh giá chung */}
          <div className="space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              3. ĐÁNH GIÁ CHUNG VÀ GÓP Ý
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm">
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="font-bold uppercase tracking-tight">Mức độ hài lòng chung:</span>
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-[#059669] px-4 py-2 rounded-xl border border-emerald-100 font-black text-xl tracking-tight">
                      {data.satisfaction_percent}%
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= (data.satisfaction_percent / 20) ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <span className="font-bold uppercase tracking-tight">Dự định quay lại hoặc giới thiệu:</span>
                  <div className="flex flex-col gap-2 pl-2">
                    {[
                      { val: 'no', label: 'Chắc chắn không' },
                      { val: 'maybe', label: 'Có thể' },
                      { val: 'yes', label: 'Chắc chắn' }
                    ].map(opt => (
                      <div key={opt.val} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.return_intent === opt.val ? 'bg-[#059669] border-[#059669]' : ''}`}>
                          {data.return_intent === opt.val && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className={data.return_intent === opt.val ? 'font-bold text-[#059669]' : 'text-slate-600'}>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight">Ý kiến đóng góp:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 min-h-[120px] whitespace-pre-wrap leading-relaxed">
                  {data.feedback || "Không có nội dung góp ý."}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-20 pt-10">
            <p className="font-black text-lg md:text-xl tracking-widest uppercase text-slate-800">
              TRÂN TRỌNG CẢM ƠN Ý KIẾN ĐÓNG GÓP!
            </p>
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
