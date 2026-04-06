import React from 'react';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

interface Props {
  data: StaffSatisfactionSurvey | null | undefined;
  onBack: () => void;
}

const CATEGORIES = [
  {
    stt: 'A',
    name: 'TIỀN LƯƠNG, PHỤ CẤP VÀ PHÚC LỢI',
    questions: [
      { id: 1, text: 'Sự tương xứng giữa thu nhập (Lương, ABC, Phụ cấp) với cường độ lao động' },
      { id: 2, text: 'Tính minh bạch, công bằng trong việc chi trả thu nhập tăng thêm tại đơn vị' },
      { id: 3, text: 'Chế độ phụ cấp trực đêm, phụ cấp độc hại và các khoản thưởng lễ, tết' },
      { id: 4, text: 'Các chính sách chăm sóc sức khỏe, tham quan, nghỉ mát cho NVYT' },
    ],
  },
  {
    stt: 'B',
    name: 'ÁP LỰC CÔNG VIỆC VÀ PHÂN CÔNG NHÂN LỰC',
    questions: [
      { id: 5, text: 'Định mức nhân sự tại khoa/phòng hiện tại (có đủ người để đảm bảo công việc?)' },
      { id: 6, text: 'Tần suất trực đêm (số buổi trực/tuần) và thời gian nghỉ bù sau trực' },
      { id: 7, text: 'Sự phân công công việc của lãnh đạo khoa/phòng (công bằng, hợp lý)' },
    ],
  },
  {
    stt: 'C',
    name: 'ĐIỀU KIỆN LÀM VIỆC VÀ CÔNG CỤ HỖ TRỢ',
    questions: [
      { id: 8, text: 'Hiệu năng của hệ thống CNTT (HIS, RIS, LIS) và tốc độ của máy tính tại nơi làm việc' },
      { id: 9, text: 'Chất lượng và số lượng vật tư y tế, trang thiết bị phục vụ chuyên môn' },
      { id: 10, text: 'Điều kiện hậu cần tại viện (nhà ăn, khu nghỉ trưa, vệ sinh cho nhân viên)' },
    ],
  },
  {
    stt: 'D',
    name: 'LÃNH ĐẠO VÀ PHÁT TRIỂN NGHỀ NGHIỆP',
    questions: [
      { id: 11, text: 'Sự quan tâm, lắng nghe và phản hồi của Ban Giám đốc đối với tâm tư NVYT' },
      { id: 12, text: 'Cơ hội được đào tạo, nâng cao trình độ chuyên môn và thăng tiến' },
      { id: 13, text: 'Văn hóa giao tiếp, ứng xử và sự đoàn kết giữa các đồng nghiệp trong đơn vị' },
    ],
  },
];

const PRESSURE_OPTIONS = [
  'Thu nhập thấp',
  'Trực quá dày',
  'Máy tính/Phần mềm chậm',
  'Thiếu sự công bằng',
  'Khác',
];

const STAY_INTENT_OPTIONS = [
  { val: 'stay', label: 'Chắc chắn ở lại' },
  { val: 'considering', label: 'Đang cân nhắc' },
  { val: 'leave', label: 'Sẽ chuyển đi nếu có cơ hội' },
];

export const StaffSatisfactionDetail: React.FC<Props> = ({ data, onBack }) => {
  if (!data) return null;

  const handlePrint = () => window.print();

  const renderScore = (currentScore: number) => {
    const scores1 = [1, 2, 3];
    const scores2 = [4, 5];

    const ScoreIcon = ({ val }: { val: number }) => (
      <span
        className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-slate-300 text-[9px] md:text-[11px] font-bold transition-all
          ${currentScore === val
            ? 'bg-[#009900] text-white border-[#009900] ring-2 ring-[#009900]/20 scale-110 md:scale-125'
            : 'text-slate-400 opacity-60'}`}
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

  const isSelected = (field: string[] | undefined, value: string) =>
    field?.includes(value);

  const getBlockLabel = (b: string) => {
    if (b === 'clinical') return 'Lâm sàng';
    if (b === 'subclinical') return 'Cận lâm sàng';
    return 'Cơ quan';
  };

  const getPositionLabel = (p: string) => {
    if (p === 'doctor') return 'Bác sĩ/Sĩ quan';
    if (p === 'nurse') return 'Điều dưỡng/Kỹ thuật viên/QNCN';
    return 'Lao động hợp đồng';
  };

  return (
    <div className="w-full h-full bg-slate-100/50 p-2 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

        {/* Navigation Actions */}
        <div className="flex items-center justify-start no-print px-2 md:px-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-[10px] md:text-xs uppercase p-2 md:p-3 hover:bg-emerald-50 rounded-2xl transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
          </button>
        </div>

        {/* Paper Container */}
        <div className="bg-white p-6 md:p-16 shadow-2xl rounded-sm border border-slate-200 min-h-[800px] md:min-h-[1200px] font-sans relative">

          {/* Header */}
          <div className="mb-8 md:mb-10 text-center">
            <h1 className="text-base md:text-2xl font-black text-slate-900 leading-tight uppercase">
              PHIẾU KHẢO SÁT SỰ HÀI LÒNG NHÂN VIÊN Y TẾ
            </h1>
            {data.ngay_khao_sat && (() => {
              const d = new Date(data.ngay_khao_sat);
              const pad = (n: number) => String(n).padStart(2, '0');
              const code = `NVYT-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
              return (
                <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide">
                  (Mã khảo sát: {code})
                </p>
              );
            })()}
          </div>

          {/* Section 1 */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 uppercase">1. THÔNG TIN CHUNG (Tùy chọn)</h3>

            <div className="space-y-4 text-xs md:text-sm">
              {/* 1.1 Block */}
              <div className="space-y-2">
                <span className="font-bold">1.1. Khối công tác:</span>
                <div className="flex flex-wrap gap-x-6 gap-y-2 pl-2 md:pl-4">
                  {[
                    { val: 'clinical', label: 'Lâm sàng' },
                    { val: 'subclinical', label: 'Cận lâm sàng' },
                    { val: 'admin', label: 'Cơ quan' },
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.block === opt.val ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {data.block === opt.val && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className={data.block === opt.val ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1.2 Position */}
              <div className="space-y-2">
                <span className="font-bold">1.2. Vị trí:</span>
                <div className="flex flex-col gap-2 pl-2 md:pl-4">
                  {[
                    { val: 'doctor', label: 'Bác sĩ/Sĩ quan' },
                    { val: 'nurse', label: 'Điều dưỡng/Kỹ thuật viên/QNCN' },
                    { val: 'other', label: 'Lao động hợp đồng' },
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.position === opt.val ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {data.position === opt.val && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className={data.position === opt.val ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1.3 Years */}
              <div className="flex gap-2 items-center">
                <span className="font-bold whitespace-nowrap">1.3. Thâm niên công tác tại viện:</span>
                <span className="border-b border-dotted border-slate-400 px-2 font-bold min-w-[60px]">
                  {data.years || '..........'}
                </span>
                <span className="font-bold text-slate-600">năm.</span>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 mb-8 md:mb-12">
            <div className="flex flex-col gap-2">
              <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 uppercase">
                2. ĐÁNH GIÁ MÔI TRƯỜNG LÀM VIỆC VÀ CHẾ ĐỘ CHÍNH SÁCH
              </h3>
            </div>

            <div className="border border-slate-900 overflow-hidden text-[11px] md:text-[13px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="border border-slate-900 px-1 md:px-3 py-2 md:py-3 w-8 md:w-12 text-center uppercase font-black">STT</th>
                    <th className="border border-slate-900 px-2 md:px-4 py-2 md:py-3 text-left uppercase font-black tracking-tight">Nội dung khảo sát (Trọng tâm các vấn đề tồn tại)</th>
                    <th className="border border-slate-900 px-2 md:px-4 py-2 md:py-3 w-28 md:w-40 text-center uppercase font-black">Mức độ hài lòng</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map(cat => (
                    <React.Fragment key={cat.stt}>
                      <tr>
                        <td className="border border-slate-900 bg-slate-50 font-black text-center px-1 py-2 md:py-3">{cat.stt}</td>
                        <td className="border border-slate-900 bg-slate-50 font-black px-2 md:px-4 py-2 md:py-3 uppercase tracking-tight">{cat.name}</td>
                        <td className="border border-slate-900 bg-slate-50"></td>
                      </tr>
                      {cat.questions.map(q => (
                        <tr key={q.id}>
                          <td className="border border-slate-900 text-center px-1 py-3 md:py-4 text-slate-600 font-bold">{q.id}</td>
                          <td className="border border-slate-900 px-2 md:px-4 py-3 md:py-4 leading-relaxed font-medium text-slate-800">{q.text}</td>
                          <td className="border border-slate-900 px-2 md:px-4 py-3 md:py-4">
                            <div className="flex justify-center">
                              {renderScore((data as any)[`q${q.id}`])}
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

          {/* Section 3 */}
          <div className="space-y-6 md:space-y-8 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 uppercase">
              3. CÂU HỎI TRUY VẤN TÂM TƯ (Dành cho mức điểm 1, 2, 3)
            </h3>

            <div className="space-y-6 md:space-y-8 pl-2 md:pl-4 text-xs md:text-sm leading-relaxed">
              {/* 3.1 Pressure */}
              <div className="space-y-3">
                <p className="font-bold">3.1. Vấn đề nào khiến Anh/Chị cảm thấy áp lực/mệt mỏi nhất hiện nay?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 pl-2">
                  {PRESSURE_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${isSelected(data.pressure, opt) ? 'bg-amber-500 border-amber-500' : ''}`}>
                        {isSelected(data.pressure, opt) && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className={isSelected(data.pressure, opt) ? 'font-bold text-amber-700' : 'text-slate-600'}>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3.2 Financial suggestion */}
              <div className="space-y-2">
                <p className="font-bold">3.2. Về việc chi trả tài chính (TNTT, lương, thưởng), Anh/Chị có đề xuất gì để tăng tính minh bạch không?</p>
                {data.financial_suggestion ? (
                  <p className="pl-2 py-1 text-slate-700 leading-relaxed whitespace-pre-wrap border-l-2 border-[#009900]">{data.financial_suggestion}</p>
                ) : (
                  <p className="pl-2 py-1 text-slate-400 italic text-xs">Không có</p>
                )}
              </div>

              {/* 3.3 Stay intent */}
              <div className="space-y-3">
                <p className="font-bold">3.3. Nếu có cơ hội chuyển công tác sang đơn vị khác với cùng mức lương, Anh/Chị có ở lại Bệnh viện không?</p>
                <div className="flex flex-col gap-2 pl-2">
                  {STAY_INTENT_OPTIONS.map(opt => (
                    <div key={opt.val} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.stay_intent === opt.val ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {data.stay_intent === opt.val && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className={data.stay_intent === opt.val ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3.4 Suggestion */}
              <div className="space-y-2">
                <p className="font-bold">3.4. Đề xuất cụ thể với Ban Giám đốc để cải thiện chất lượng môi trường làm việc và thu nhập của NVYT trong năm 2026:</p>
                {data.suggestion ? (
                  <p className="pl-2 py-1 text-slate-700 leading-relaxed whitespace-pre-wrap border-l-2 border-[#009900]">{data.suggestion}</p>
                ) : (
                  <p className="pl-2 py-1 text-slate-400 italic text-xs">Không có</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16 pt-8">
            <p className="font-black text-base md:text-xl tracking-widest uppercase text-slate-800">
              XIN TRÂN TRỌNG CẢM ƠN ANH/CHỊ ĐÃ ĐÓNG GÓP Ý KIẾN!
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
        }
      `}} />
    </div>
  );
};
