import React from 'react';
import { ArrowLeft, Printer, CheckCircle2, User, Phone, MapPin, Clock, Info, Star, AlertCircle } from 'lucide-react';
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

  const renderScore = (val: number) => {
    if (val === 0) return <span className="text-slate-300 font-black italic">N/A</span>;
    return (
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm border ${val >= 4 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          val >= 3 ? 'bg-amber-50 text-amber-600 border-amber-100' :
            'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
        {val}
      </span>
    );
  };

  return (
    <div className="w-full h-full bg-slate-50 p-4 md:p-8 animate-in fade-in duration-500 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Actions */}
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
        <div className="bg-white p-8 md:p-14 shadow-2xl rounded-3xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#009900]/5 rounded-full -mr-32 -mt-32 blur-3xl no-print" />

          {/* Header Title */}
          <div className="text-center mb-12 relative z-10">
            <h1 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
              KẾT QUẢ KHẢO SÁT HÀI LÒNG NGƯỜI BỆNH
            </h1>
            <p className="text-sm font-bold text-[#009900] uppercase tracking-widest mt-1">Khám bệnh Ngoại trú Năm 2026</p>
            <div className="w-24 h-1 bg-[#009900] mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                <User size={12} /> Thông tin cá nhân
              </h3>
              <div className="space-y-3 pl-4">
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500 uppercase">Họ và tên:</span>
                  <span className="text-sm font-black text-slate-800 uppercase">{data.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500 uppercase">Số điện thoại:</span>
                  <span className="text-sm font-black text-slate-800">{data.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500 uppercase">Đối tượng:</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{RESPONDENT_LABELS[data.respondent || 'patient']}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                <MapPin size={12} /> Chi tiết đợt khám
              </h3>
              <div className="space-y-3 pl-4">
                <div className="flex flex-col gap-1 bg-slate-50/50 p-3 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Khu vực khám</span>
                  <span className="text-sm font-black text-slate-800">{AREA_LABELS[data.area || ''] || data.area || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-slate-50/50 p-3 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Thời điểm khám</span>
                  <span className="text-sm font-black text-slate-800">{data.visit_time || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Evaluation */}
          <div className="space-y-6 mb-12">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
              <Star size={12} /> Đánh giá chi tiết (Thang điểm 1-5)
            </h3>

            <div className="space-y-10">
              {CATEGORIES.map(cat => (
                <div key={cat.stt} className="space-y-3">
                  <h4 className="text-[11px] font-black text-white bg-[#009900] px-4 py-1.5 rounded-full inline-block shadow-sm">
                    {cat.stt}. {cat.name}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cat.questions.map(q => (
                      <div key={q.id} className="p-4 bg-white border border-slate-100 rounded-3xl flex items-center justify-between shadow-sm hover:border-[#009900]/30 transition-colors">
                        <span className="text-[11px] font-bold text-slate-600 flex-1 pr-4 line-clamp-2 leading-relaxed">
                          <span className="text-[10px] opacity-30 mr-1">{q.id}.</span> {q.text}
                        </span>
                        {renderScore((data as any)[`q${q.id}`])}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Issues & Feedback */}
          <div className="space-y-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative">
            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} /> Nguyên nhân & Đề xuất cải tiến
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nguyên nhân mệt mỏi/chờ đợi:</p>
                <div className="flex flex-wrap gap-2">
                  {data.waiting_issues && data.waiting_issues.length > 0 ? (
                    data.waiting_issues.map(issue => (
                      <span key={issue} className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg border border-amber-200">
                        {issue}
                      </span>
                    ))
                  ) : <span className="text-slate-400 italic text-xs">Không phản ánh</span>}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ưu tiên cải tiến ngay:</p>
                <div className="flex flex-wrap gap-2">
                  {data.priority_improvement && data.priority_improvement.length > 0 ? (
                    data.priority_improvement.map(item => (
                      <span key={item} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-200">
                        {item}
                      </span>
                    ))
                  ) : <span className="text-slate-400 italic text-xs">Không phản ánh</span>}
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ý kiến khác / Chi tiết phản ánh:</p>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-inner text-sm italic font-medium text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                  {data.feedback || "Không có ý kiến cụ thể."}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center border-t border-slate-100 pt-8 no-print">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Hệ thống khảo sát 2026 - QLCL-v3</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: white !important; margin: 0 !important; padding: 0 !important; }
          .max-w-4xl { max-width: 100% !important; border: none !important; }
          .shadow-2xl, .shadow-xl, .shadow-sm { box-shadow: none !important; }
          .rounded-3xl, .rounded-[2.5rem] { border-radius: 0 !important; border-bottom: 1px solid #eee !important; }
          .p-8, .p-14 { padding: 2rem !important; }
          .bg-slate-50 { background-color: transparent !important; }
          .bg-slate-50\/50 { background-color: transparent !important; border-bottom: 1px solid #f8f8f8; }
        }
      `}} />
    </div>
  );
};
