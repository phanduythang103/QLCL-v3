import React from 'react';
import { ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';

interface Props {
   data: KsMeSinhConRecord;
   onBack: () => void;
}

const SECTION_MAP = [
   { id: 'EA', title: 'Khả năng tiếp cận', questions: [{ id: 'ea1', text: 'Biển chỉ dẫn rõ ràng' }, { id: 'ea2', text: 'Dễ gọi nhân viên khi cần' }] },
   { id: 'EB', title: 'Quy trình khám', questions: [{ id: 'eb1', text: 'Thủ tục dễ dàng' }, { id: 'eb2', text: 'Thời gian chờ hợp lý' }] },
   { id: 'EC', title: 'Tư vấn', questions: [{ id: 'ec1', text: 'Thông tin trước sinh đầy đủ' }, { id: 'ec2', text: 'Tư vấn nguy cơ' }, { id: 'ec3', text: 'Hướng dẫn chăm sóc sau sinh' }] },
   {
      id: 'ED', title: 'Cơ sở vật chất', questions: [
         { id: 'ed1', text: 'Giường sạch, không nằm ghép' }, { id: 'ed2', text: 'Chăn ga sạch' }, { id: 'ed3', text: 'Nhà vệ sinh sạch' },
         { id: 'ed4', text: 'Buồng bệnh thoáng' }, { id: 'ed5', text: 'Đảm bảo riêng tư' }, { id: 'ed6', text: 'Dịch vụ tiện ích tốt' }
      ]
   },
   {
      id: 'EE', title: 'Thái độ nhân viên', questions: [
         { id: 'ee1', text: 'Bác sĩ giao tiếp tốt' }, { id: 'ee2', text: 'Điều dưỡng giao tiếp tốt' }, { id: 'ee3', text: 'Nhân viên phục vụ tốt' }, { id: 'ee4', text: 'Không gợi ý bồi dưỡng' }
      ]
   },
   {
      id: 'EG', title: 'Chuyên môn', questions: [
         { id: 'eg1', text: 'Bác sĩ chuyên môn tốt' }, { id: 'eg2', text: 'Điều dưỡng chăm sóc tốt' }, { id: 'eg3', text: 'Phối hợp tốt' }
      ]
   },
   {
      id: 'EH', title: 'Kết quả', questions: [
         { id: 'eh1', text: 'Sinh an toàn' }, { id: 'eh2', text: 'Hướng dẫn thuốc đầy đủ' }, { id: 'eh3', text: 'Chi phí hợp lý' }
      ]
   },
];

export const KsMeSinhConDetail: React.FC<Props> = ({ data, onBack }) => {
   if (!data) return null;

   const handlePrint = () => {
      window.print();
   };

   const getBirthMethodLabel = (method?: number) => {
      switch (method) {
         case 1: return 'Đẻ thường';
         case 2: return 'Mổ cấp cứu';
         case 3: return 'Mổ chuẩn bị';
         case 4: return 'Khác';
         default: return 'N/A';
      }
   };

   const renderScore = (currentScore: any) => {
      const scores = [1, 2, 3, 4, 5];
      const scoreVal = Number(currentScore);

      return (
         <div className="flex items-center gap-2 md:gap-3 font-sans">
            {scores.map(val => (
               <span
                  key={val}
                  className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full border border-slate-300 text-[8px] md:text-[10px] font-bold transition-all
              ${scoreVal === val ? 'bg-[#059669] text-white border-[#059669] ring-2 ring-[#059669]/20 scale-110 md:scale-125' : 'text-slate-400 opacity-60'}`}
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
            <div className="bg-white p-6 md:p-14 shadow-2xl rounded-sm border border-slate-200 min-h-[800px] md:min-h-[1200px] font-sans relative">

               {/* Header Title */}
               <div className="text-center mb-6 md:mb-10">
                  <h1 className="text-lg md:text-2xl font-black text-slate-900 leading-tight uppercase">
                     PHIẾU KHẢO SÁT NGƯỜI MẸ SINH CON
                  </h1>
                  <p className="mt-2 text-[11px] md:text-xs text-slate-500 font-bold tracking-wide uppercase">
                     Bệnh viện Quân y
                  </p>
               </div>

               {/* Section 1: Thông tin chung */}
               <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
                  <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">1. THÔNG TIN NGƯỜI MẸ</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-12 text-xs md:text-sm">
                     <div className="flex gap-2">
                        <span className="font-bold whitespace-nowrap">Mã người mẹ:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-[#059669] uppercase tracking-wide">
                           {data.mother_id || '...........................................'}
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
                           {data.departments || '...........................................'}
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <span className="font-bold whitespace-nowrap">Tuổi:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                           {data.age || '...........................................'}
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <span className="font-bold whitespace-nowrap">Cách sinh:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                           {getBirthMethodLabel(data.birth_method)}
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <span className="font-bold whitespace-nowrap">Dùng BHYT:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                           {data.bhyt === 1 ? 'Có' : 'Không'}
                        </span>
                     </div>
                     <div className="flex gap-2 md:col-span-2">
                        <span className="font-bold whitespace-nowrap">Ngày khảo sát:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold">
                           {data.survey_date || '...........................................'}
                        </span>
                     </div>
                  </div>
               </div>

               {/* Section 2: Đánh giá */}
               <div className="space-y-4 mb-8 md:mb-12">
                  <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
                     2. KẾT QUẢ KHẢO SÁT CHI TIẾT
                  </h3>

                  <div className="border border-slate-900 overflow-hidden text-[10px] md:text-[12px]">
                     <table className="w-full border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50">
                              <th className="border border-slate-900 px-1 md:px-2 py-2 w-8 md:w-12 text-center uppercase font-black">Mã</th>
                              <th className="border border-slate-900 px-2 md:px-3 py-2 text-left uppercase font-black tracking-tight">Nội dung khảo sát</th>
                              <th className="border border-slate-900 px-2 md:px-4 py-2 w-24 md:w-36 text-center uppercase font-black">Điểm</th>
                           </tr>
                        </thead>
                        <tbody>
                           {SECTION_MAP.map(section => (
                              <React.Fragment key={section.id}>
                                 <tr>
                                    <td className="border border-slate-900 bg-slate-50 font-black text-center px-1 py-2">{section.id}</td>
                                    <td className="border border-slate-900 bg-slate-50 font-black px-2 py-2 uppercase tracking-tight">{section.title}</td>
                                    <td className="border border-slate-900 bg-slate-50"></td>
                                 </tr>
                                 {section.questions.map(q => (
                                    <tr key={q.id}>
                                       <td className="border border-slate-900 text-center px-1 py-2 text-slate-500 font-bold uppercase">{q.id.replace(section.id.toLowerCase(), '')}</td>
                                       <td className="border border-slate-900 px-2 py-2 leading-relaxed font-medium text-slate-800">{q.text}</td>
                                       <td className="border border-slate-900 px-1 md:px-2 py-2 text-center">
                                          <div className="flex justify-center">
                                             {renderScore((data as any)[q.id])}
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

               {/* Section 3: Tỉ lệ hài lòng */}
               <div className="space-y-6 mb-8 md:mb-12">
                  <h3 className="font-black text-sm md:text-lg border-b-2 border-slate-900 pb-1 inline-block uppercase">
                     3. TỈ LỆ HÀI LÒNG & GÓP Ý
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs md:text-sm">
                     <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                           <span className="font-bold whitespace-nowrap">Đánh giá chung:</span>
                           <span className="border-b border-dotted border-slate-400 flex-1 px-1 font-bold text-amber-500 uppercase tracking-wide">
                              {data.overall_satisfaction || 5}/5 - {data.overall_satisfaction === 5 ? 'Rất hài lòng' : data.overall_satisfaction === 4 ? 'Hài lòng' : 'Bình thường'}
                           </span>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                           <span className="text-[10px] font-black text-[#059669]/60 uppercase tracking-widest mb-1">Tỷ lệ hài lòng (%)</span>
                           <div className="text-4xl font-black text-[#059669]">{data.satisfaction_percent}%</div>
                           <p className="text-[9px] text-[#059669]/50 mt-2 font-bold italic leading-tight uppercase">
                              * (Trung bình dịch vụ + Hài lòng chung) / 2
                           </p>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <span className="font-bold uppercase tracking-tight text-slate-500 text-[10px]">Góp ý chi tiết:</span>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 min-h-[100px] whitespace-pre-wrap leading-relaxed">
                           {data.note || "Không có ý kiến cụ thể."}
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
