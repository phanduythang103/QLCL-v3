import React from 'react';
import {
  ArrowLeft, CheckCircle2, Star
} from 'lucide-react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';

interface Props {
  data: KsNuoiConRecord;
  onBack: () => void;
}

const OPTIONS = {
  see_policy: ['Khoa khám', 'Phòng chờ sinh', 'Khoa sau sinh', 'Phòng tư vấn', 'Nơi khác', 'Không thấy'],
  see_media: ['Khoa khám', 'Phòng chờ sinh', 'Khoa sau sinh', 'Buồng bệnh', 'Phòng tư vấn', 'Khác', 'Không thấy'],
  consultation_time: ['Không tư vấn', 'Khám thai', 'Trước sinh', 'Sau sinh', 'Khác'],
  reason_no_consult: ['Không khám tại BV', 'Sinh cấp cứu', 'NVYT bỏ qua', 'Khác', 'Có tư vấn'],
  cord_cut: ['Cắt ngay', 'Cắt chậm', 'Không nhớ'],
  skin_to_skin: ['Có', 'Không'],
  first_breastfeed: ['Ngay sau sinh', '< 30 phút', '< 1 giờ', '< 2 giờ', '2–24 giờ', '> 1 ngày', 'Không bú mẹ', 'Khác'],
  support_person: ['Điều dưỡng/hộ sinh', 'Bác sĩ', 'Người nhà', 'Khác', 'Không hỗ trợ'],
  support_type: ['Hướng dẫn bú', 'Mát-xa vú', 'Vắt sữa', 'Thông tắc tia sữa', 'Khác'],
  other_food: ['Chỉ bú mẹ', 'Nước', 'Sữa mẹ khác', 'Sữa công thức', 'Khác'],
  suggest_formula: ['Có', 'Không']
};

export const KsNuoiConDetail: React.FC<Props> = ({ data, onBack }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const renderArrayValues = (field: keyof typeof OPTIONS, values?: number[]) => {
    if (!values || values.length === 0) return <span className="text-slate-400 italic font-medium">Không có dữ liệu</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {values.map(v => (
          <span key={v} className="px-3 py-1 bg-emerald-50 text-[#009900] text-[10px] md:text-[11px] font-black uppercase rounded-lg border border-emerald-100/50">
            {OPTIONS[field][v - 1]}
          </span>
        ))}
      </div>
    );
  };

  const renderSingleValue = (label: string, field: keyof typeof OPTIONS, value?: number) => {
    const valText = value && value > 0 ? OPTIONS[field][value - 1] : 'N/A';
    return (
      <div className="flex gap-2">
        <span className="font-bold whitespace-nowrap">{label}:</span>
        <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-[#009900] uppercase tracking-wide">
          {valText}
        </span>
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
              PHIẾU KHẢO SÁT NUÔI CON BẰNG SỮA MẸ
            </h1>
            <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide uppercase">
              Bệnh viện Quân y
            </p>
          </div>

          {/* Section 1: Thông tin chung */}
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">I. THÔNG TIN HÀNH CHÍNH</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Mã người bệnh:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-[#009900] uppercase tracking-wide">
                  {data.patient_id || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">SĐT:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.phone || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Khoa điều trị:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold uppercase">
                  {data.department || '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Tuổi mẹ:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.age || '....'} Tuổi
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Ngày sinh trẻ:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                  {data.baby_birth_date ? new Date(data.baby_birth_date).toLocaleDateString('vi-VN') : '...........................................'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">Phương pháp sinh:</span>
                <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold uppercase">
                  {data.delivery_type === 1 ? 'Đẻ thường' : 'Mổ đẻ'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Thực hành */}
          <div className="space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              II. THỰC HÀNH NUÔI CON
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-xs md:text-sm">
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">1. Đã thấy/nghe quy định tại:</span>
                {renderArrayValues('see_policy', data.see_policy)}
              </div>
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">2. Kênh truyền thông đã tiếp cận:</span>
                {renderArrayValues('see_media', data.see_media)}
              </div>
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">3. Thời điểm được tư vấn/hướng dẫn:</span>
                {renderArrayValues('consultation_time', data.consultation_time)}
              </div>
              <div className="space-y-3">
                {renderSingleValue('4. Lý do không được tư vấn', 'reason_no_consult', data.reason_no_consult)}
              </div>

              <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 border-t border-slate-100 pt-6 mt-4">
                {renderSingleValue('5. Cắt dây rốn', 'cord_cut', data.cord_cut)}
                {renderSingleValue('6. Tiếp xúc Da kề da', 'skin_to_skin', data.skin_to_skin)}
                {renderSingleValue('7. Thời điểm bú lần đầu', 'first_breastfeed', data.first_breastfeed)}
                {renderSingleValue('10. Ăn thêm sữa công thức?', 'other_food', data.other_food)}
              </div>

              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">8. Người hỗ trợ bú mẹ:</span>
                {renderArrayValues('support_person', data.support_person)}
              </div>
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">9. Nội dung hỗ trợ:</span>
                {renderArrayValues('support_type', data.support_type)}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-bold uppercase tracking-tight text-[10px] text-slate-500">11. Được gợi ý/khuyên dùng sữa công thức?</span>
                <div className="flex items-center gap-6 mt-1">
                  {[
                    { val: 1, label: 'Có' },
                    { val: 2, label: 'Không' }
                  ].map(opt => (
                    <div key={opt.val} className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 border-slate-400 rounded-sm flex items-center justify-center p-0.5 ${data.suggest_formula === opt.val ? 'bg-[#ff9900] border-[#ff9900]' : ''}`}>
                        {data.suggest_formula === opt.val && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className={data.suggest_formula === opt.val ? 'font-black text-slate-900 border-b border-slate-900' : 'text-slate-400 font-bold'}>{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cảm nhận */}
          <div className="space-y-6 mb-8 md:mb-12">
            <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
              III. CẢM NHẬN & DỰ ĐỊNH
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm">
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">Cảm nhận về lợi ích sữa mẹ:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 min-h-[80px] leading-relaxed">
                  {data.benefits || "Không có ý kiến cụ thể."}
                </div>
              </div>
              <div className="space-y-3">
                <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">Kiến nghị/Góp ý:</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 min-h-[80px] leading-relaxed">
                  {data.suggestions || "Không có nội dung góp ý."}
                </div>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-8 justify-around pt-8 border-t border-slate-100 mt-4">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dự định bú mẹ hoàn toàn</span>
                  <div className="bg-emerald-50 text-[#009900] px-8 py-4 rounded-3xl border border-emerald-100 font-black text-3xl">
                    {data.exclusive_months} <span className="text-sm">tháng</span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng thời gian nuôi sữa mẹ</span>
                  <div className="bg-emerald-50 text-[#009900] px-8 py-4 rounded-3xl border border-emerald-100 font-black text-3xl">
                    {data.total_months} <span className="text-sm">tháng</span>
                  </div>
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
