import React from 'react';
import { ArrowLeft, Printer, CheckCircle2, User, Phone, MapPin, Clock, Info } from 'lucide-react';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';

interface Props {
  data: OutpatientSurveyResponse | undefined;
  onBack: () => void;
}

const CATEGORIES = [
  {
    stt: 'A',
    name: "TIẾP CẬN VÀ CHỈ DẪN",
    questions: [
      { id: 1, text: "Sự thuận tiện và an toàn tại khu vực gửi xe" },
      { id: 2, text: "Hiệu quả của việc phân luồng Quân - Dân (có rõ ràng, tránh chồng chéo không?)" },
      { id: 3, text: "Sơ đồ biển báo và sự hướng dẫn của nhân viên tại sảnh chính/khu đón tiếp" }
    ]
  },
  {
    stt: 'B',
    name: "THỜI GIAN CHỜ ĐỢI (NÚT THẮT QUY TRÌNH)",
    questions: [
      { id: 4, text: "Thời gian chờ làm thủ tục đăng ký và thanh toán viện phí" },
      { id: 5, text: "Thời gian chờ Siêu âm, Chiếu chụp (có quá lâu so với mong đợi không?)" },
      { id: 6, text: "Thời gian từ lúc lấy mẫu đến khi có kết quả Xét nghiệm" }
    ]
  },
  {
    stt: 'C',
    name: "CƠ SỞ VẬT CHẤT TẠI KHU KHÁM BỆNH",
    questions: [
      { id: 7, text: "Ghế ngồi chờ tại các phòng khám và khu vực cận lâm sàng (đủ chỗ, sạch sẽ)" },
      { id: 8, text: "Vệ sinh và tiện nghi tại Nhà vệ sinh khu vực khám bệnh (giấy, nước, mùi hôi)" },
      { id: 9, text: "Hệ thống Wifi miễn phí phục vụ người bệnh trong lúc chờ đợi kết quả" }
    ]
  },
  {
    stt: 'D',
    name: "THÁI ĐỘ VÀ NĂNG LỰC NHÂN VIÊN",
    questions: [
      { id: 10, text: "Thái độ của nhân viên thanh toán/hành chính (có nhã nhặn, giải thích rõ không?)" },
      { id: 11, text: "Bác sĩ khám bệnh: Dành thời gian tư vấn, lắng nghe (không khám sơ sài/hời hợt)" },
      { id: 12, text: "Mức độ hài lòng khi được học viên thực hiện kỹ thuật dưới sự giám sát của bác sĩ chính (Ông/Bà có hài lòng khi học viên thực hiện không?)" },
      { id: 13, text: "Tác phong nhân viên: Không làm việc riêng, không sử dụng điện thoại khi đang tiếp bệnh" }
    ]
  },
  {
    stt: 'E',
    name: "KẾT QUẢ VÀ CHI PHÍ",
    questions: [
      { id: 14, text: "Mức độ tin tưởng vào kết quả chẩn đoán và điều trị" },
      { id: 15, text: "Sự công khai, minh bạch trong các khoản thu/chi phí dịch vụ" }
    ]
  }
];

export const OutpatientSatisfactionDetail: React.FC<Props> = ({ data, onBack }) => {
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
          ${currentScore === val ? 'bg-[#009900] text-white border-[#009900] ring-2 ring-[#009900]/20 scale-110 md:scale-125' : 'text-slate-400 opacity-60'}`}
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

  const isSelected = (field: string[] | undefined, value: string) => {
    return field?.includes(value);
  };

  return (
    <div className="w-full h-full bg-slate-100/50 p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Navigation Actions */}
        <div className="flex items-center justify-start no-print">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-xs uppercase p-3 hover:bg-emerald-50 rounded-2xl transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
          </button>
        </div>

        {/* Paper Container */}
        <div className="bg-white p-10 md:p-16 shadow-2xl rounded-sm border border-slate-200 min-h-[1200px] font-sans relative">

          {/* Header Title */}
          <div className="text-center mb-10">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight uppercase">
              PHIẾU KHẢO SÁT HÀI LÒNG NGƯỜI BỆNH NGOẠI TRÚ
            </h1>
            {data.ngay_khao_sat && (() => {
              const d = new Date(data.ngay_khao_sat);
              const pad = (n: number) => String(n).padStart(2, '0');
              const code = `NGOAITRU-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
              return (
                <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide">
                  (Mã khảo sát: {code})
                </p>
              );
            })()}
          </div>

          {/* Section 1: Thông tin chung */}
          <div className="space-y-6 mb-12">
            <h3 className="font-black text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">1. THÔNG TIN CHUNG</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">1.1. Họ và tên:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-[#009900] uppercase tracking-wide">
                  {data.full_name || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Số điện thoại:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.phone || '...........................................'}
                </span>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2">
                <span className="font-bold">1.2. Khu vực khám:</span>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pl-4">
                  {[
                    { val: 'kham_dan', label: 'Khám Dân' },
                    { val: 'kham_quan', label: 'Khám Quân' },
                    { val: 'bhyt', label: 'Khám BHYT' },
                    { val: 'yeu_cau', label: 'KKB Theo yêu cầu' },
                    { val: 'pk232', label: 'PK232' }
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.area === opt.val ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {data.area === opt.val && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={data.area === opt.val ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <span className="font-bold whitespace-nowrap">1.3. Thời điểm khảo sát:</span>
                <span className="border-b border-dotted border-slate-400 px-2 font-bold">
                  {data.visit_time || '..../..../2026'}
                </span>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2">
                <span className="font-bold">1.4. Đối tượng trả lời:</span>
                <div className="flex gap-8 pl-4">
                  {[
                    { val: 'patient', label: 'Người bệnh' },
                    { val: 'relative', label: 'Người nhà' }
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.respondent === opt.val ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {data.respondent === opt.val && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={data.respondent === opt.val ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Đánh giá quy trình */}
          <div className="space-y-4 mb-12">
            <div className="flex flex-col gap-2">
              <h3 className="font-black text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
                2. ĐÁNH GIÁ QUY TRÌNH VÀ DỊCH VỤ KHÁM BỆNH
              </h3>
            </div>

            <div className="border border-slate-900 overflow-hidden text-[11px] md:text-[13px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="border border-slate-900 px-1 md:px-3 py-2 md:py-3 w-8 md:w-12 text-center uppercase font-black">STT</th>
                    <th className="border border-slate-900 px-2 md:px-4 py-2 md:py-3 text-left uppercase font-black tracking-tight">Nội dung khảo sát</th>
                    <th className="border border-slate-900 px-2 md:px-6 py-2 md:py-3 w-28 md:w-48 text-center uppercase font-black">Mức độ</th>
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

          {/* Section 3: Câu hỏi truy vấn */}
          <div className="space-y-8 mb-12">
            <h3 className="font-black text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              3. CÂU HỎI TRUY VẤN NGUYÊN NHÂN (Dành cho mức điểm 1, 2, 3)
            </h3>

            <div className="space-y-8 pl-4 text-sm leading-relaxed">
              {/* 3.1: Waiting Issues */}
              <div className="space-y-4">
                <span className="font-bold">3.1. Nếu Ông/Bà không hài lòng về thời gian chờ đợi, công đoạn nào khiến Ông/Bà mệt mỏi nhất?</span>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 pl-6">
                  {["Đăng ký khám", "Chờ bác sĩ gọi", "Chờ siêu âm/chụp X-quang", "Thanh toán", "Lấy thuốc", "Khác"].map(issue => (
                    <div key={issue} className="flex items-center gap-3">
                      <div className={`w-4 h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${isSelected(data.waiting_issues, issue) ? 'bg-amber-500 border-amber-500' : ''}`}>
                        {isSelected(data.waiting_issues, issue) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={isSelected(data.waiting_issues, issue) ? 'font-bold text-amber-700' : 'text-slate-600'}>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3.2: Additional Detail */}
              <div className="space-y-2">
                <span className="font-bold">3.2. Nếu Ông/Bà không hài lòng về thái độ, vui lòng cho biết đặc điểm nhân viên đó (Ví dụ: tên, vị trí trực, mô tả ngoại hình):</span>
                <div className="border-b border-dotted border-slate-400 min-h-[60px] py-1 font-bold italic text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.feedback ? data.feedback : "................................................................................................................................"}
                </div>
              </div>

              {/* 3.3: Priority */}
              <div className="space-y-4">
                <span className="font-bold">3.3. Đề xuất ưu tiên nhất để Bệnh viện thay đổi ngay trong tháng tới là gì?</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 pl-6">
                  {["Tăng thêm máy siêu âm", "Mở thêm cửa thanh toán", "Wifi mạnh hơn", "Thay đổi bảo vệ", "Khác"].map(opt => (
                    <div key={opt} className="flex items-center gap-3">
                      <div className={`w-4 h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${isSelected(data.priority_improvement, opt) ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {isSelected(data.priority_improvement, opt) && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={isSelected(data.priority_improvement, opt) ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-20 pt-10">
            <p className="font-black text-xl tracking-widest uppercase text-slate-800">
              XIN TRÂN TRỌNG CẢM ƠN Ý KIẾN CỦA ÔNG/BÀ!
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
          .shadow-2xl { shadow: none !important; border: none !important; }
          .p-4, .p-10, .p-16 { padding: 0 !important; }
        }
      `}} />
    </div>
  );
};
