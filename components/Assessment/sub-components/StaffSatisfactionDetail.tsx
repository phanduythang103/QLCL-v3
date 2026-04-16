import React from 'react';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { StaffSatisfactionSurvey } from '../types/staffSatisfaction';

interface Props {
  data: StaffSatisfactionSurvey | undefined;
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

export const StaffSatisfactionDetail: React.FC<Props> = ({ data, onBack }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderScore = (currentScore: number) => {
    const scores = [1, 2, 3, 4, 5];

    return (
      <div className="flex items-center gap-2 md:gap-3 font-sans">
        {scores.map(val => (
          <span
            key={val}
            className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-slate-300 text-[9px] md:text-[11px] font-bold transition-all
              ${currentScore === val ? 'bg-[#009900] text-white border-[#009900] ring-2 ring-[#009900]/20 scale-110 md:scale-125' : 'text-slate-400 opacity-60'}`}
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
            className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-[10px] md:text-xs uppercase p-2 md:p-3 hover:bg-emerald-50 rounded-2xl transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
          </button>
        </div>

        {/* Paper Container */}
        <div className="bg-white p-6 md:p-16 shadow-2xl rounded-sm border border-slate-200 min-h-[800px] md:min-h-[1200px] font-sans relative">

          {/* Header Title */}
          <div className="text-center mb-6 md:mb-10">
            <h1 className="text-lg md:text-2xl font-black text-slate-900 leading-tight uppercase">
              PHIẾU KHẢO SÁT SỰ HÀI LÒNG NHÂN VIÊN Y TẾ
            </h1>
            <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide uppercase">
              Năm 2026 - Bệnh viện Quân y
            </p>
          </div>

          {/* Section 1: Thông tin chung */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">1. THÔNG TIN NHÂN VIÊN</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Khối công tác:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-[#009900] uppercase tracking-wide">
                  {BLOCK_LABELS[data.block] || data.block || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Vị trí:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {POSITION_LABELS[data.position] || data.position || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Thâm niên công tác:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold uppercase">
                  {data.years} năm
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Ngày khảo sát:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.ngay_khao_sat ? new Date(data.ngay_khao_sat).toLocaleDateString('vi-VN') : '...........................................'}
                </span>
              </div>

              <div className="flex flex-col gap-2 md:gap-3 md:col-span-2 mt-2">
                <span className="font-bold">Ý định tiếp tục gắn bó:</span>
                <div className="flex flex-wrap gap-4 md:gap-8 pl-2 md:pl-4">
                  {[
                    { val: 'stay', label: 'Tiếp tục gắn bó' },
                    { val: 'consider', label: 'Đang xem xét' },
                    { val: 'leave', label: 'Có kế hoạch thay đổi' }
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-1.5 md:gap-2">
                      <div className={`w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.stay_intent === opt.val ? 'bg-[#009900] border-[#009900]' : ''}`}>
                        {data.stay_intent === opt.val && <CheckCircle2 size={10} className="text-white" />}
                      </div>
                      <span className={data.stay_intent === opt.val ? 'font-bold text-[#009900]' : 'text-slate-600'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Đánh giá */}
          <div className="space-y-4 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              2. ĐÁNH GIÁ CHI TIẾT
            </h3>

            <div className="border border-slate-900 overflow-hidden text-[11px] md:text-[13px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="border border-slate-900 px-1 md:px-3 py-2 md:py-3 w-8 md:w-12 text-center uppercase font-black">STT</th>
                    <th className="border border-slate-900 px-2 md:px-4 py-2 md:py-3 text-left uppercase font-black tracking-tight">Nội dung khảo sát</th>
                    <th className="border border-slate-900 px-2 md:px-6 py-2 md:py-3 w-28 md:w-48 text-center uppercase font-black">Điểm</th>
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
                          <td className="border border-slate-900 text-center px-1 py-3 md:py-4 text-slate-600 font-bold">{q.id.replace('q', '')}</td>
                          <td className="border border-slate-900 px-2 md:px-4 py-3 md:py-4 leading-relaxed font-medium text-slate-800">{q.text}</td>
                          <td className="border border-slate-900 px-2 md:px-6 py-3 md:py-4">
                            <div className="flex justify-center">
                              {renderScore((data as any)[q.id] || 0)}
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
              3. ÁP LỰC VÀ GÓP Ý
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm">
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <span className="font-bold uppercase tracking-tight">Áp lực công việc:</span>
                  <div className="flex flex-wrap gap-2">
                    {data.pressure && data.pressure.length > 0 ? (
                      data.pressure.map(p => {
                        const label = p === 'low_income' ? 'Thu nhập thấp' : p === 'too_many_shifts' ? 'Trực nhiều' : p === 'system_slow' ? 'Phần mềm chậm' : p === 'unfair' ? 'Thiếu công bằng' : 'Áp lực khác';
                        return (
                          <span key={p} className="px-3 py-1 bg-emerald-50 text-[#009900] rounded-lg border border-emerald-100 font-bold text-[10px] uppercase">
                            {label}
                          </span>
                        );
                      })
                    ) : <span className="italic text-slate-400">Không có phản ánh</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="font-bold uppercase tracking-tight">Tỷ lệ hài lòng tính toán:</span>
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-[#009900] px-4 py-2 rounded-xl border border-emerald-100 font-black text-xl tracking-tight">
                      {(() => {
                        const scores = CATEGORIES.flatMap(c => c.questions.map(q => (data as any)[q.id] || 0));
                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                        return Math.round((avg / 5) * 100);
                      })()}%
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={16} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight">Ý kiến đề xuất cụ thể:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 min-h-[120px] whitespace-pre-wrap leading-relaxed">
                  {data.suggestion || "Không có nội dung góp ý."}
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
