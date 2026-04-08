import React from 'react';
import { ArrowLeft, User, Calendar, MapPin, Star, Info } from 'lucide-react';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';

interface Props {
  data: KsMeSinhConRecord;
  onBack: () => void;
}

const SECTION_MAP = [
  { id: 'EA', title: 'Khả năng tiếp cận', questions: [{id: 'ea1', text: 'Biển chỉ dẫn rõ ràng'}, {id: 'ea2', text: 'Dễ gọi nhân viên khi cần'}] },
  { id: 'EB', title: 'Quy trình khám', questions: [{id: 'eb1', text: 'Thủ tục dễ dàng'}, {id: 'eb2', text: 'Thời gian chờ hợp lý'}] },
  { id: 'EC', title: 'Tư vấn', questions: [{id: 'ec1', text: 'Thông tin trước sinh đầy đủ'}, {id: 'ec2', text: 'Tư vấn nguy cơ'}, {id: 'ec3', text: 'Hướng dẫn chăm sóc sau sinh'}] },
  { id: 'ED', title: 'Cơ sở vật chất', questions: [
    {id: 'ed1', text: 'Giường sạch, không nằm ghép'}, {id: 'ed2', text: 'Chăn ga sạch'}, {id: 'ed3', text: 'Nhà vệ sinh sạch'},
    {id: 'ed4', text: 'Buồng bệnh thoáng'}, {id: 'ed5', text: 'Đảm bảo riêng tư'}, {id: 'ed6', text: 'Dịch vụ tiện ích tốt'}
  ]},
  { id: 'EE', title: 'Thái độ nhân viên', questions: [
    {id: 'ee1', text: 'Bác sĩ giao tiếp tốt'}, {id: 'ee2', text: 'Điều dưỡng giao tiếp tốt'}, {id: 'ee3', text: 'Nhân viên phục vụ tốt'}, {id: 'ee4', text: 'Không gợi ý bồi dưỡng'}
  ]},
  { id: 'EG', title: 'Chuyên môn', questions: [
    {id: 'eg1', text: 'Bác sĩ chuyên môn tốt'}, {id: 'eg2', text: 'Điều dưỡng chăm sóc tốt'}, {id: 'eg3', text: 'Phối hợp tốt'}
  ]},
  { id: 'EH', title: 'Kết quả', questions: [
    {id: 'eh1', text: 'Sinh an toàn'}, {id: 'eh2', text: 'Hướng dẫn thuốc đầy đủ'}, {id: 'eh3', text: 'Chi phí hợp lý'}
  ]},
];

export const KsMeSinhConDetail: React.FC<Props> = ({ data, onBack }) => {
  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-[#009900] text-white p-6 md:p-10 rounded-3xl shadow-2xl space-y-4 relative overflow-hidden mb-8 mx-auto max-w-6xl mt-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all mb-4 relative z-10"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase relative z-10">
           Chi tiết: Phiếu Khảo Sát Người Mẹ Sinh Con
        </h1>
        <div className="flex flex-wrap gap-4 text-xs font-bold relative z-10">
           <span className="bg-white/20 px-4 py-2 rounded-xl">ID: {data.id?.split('-')[0]}</span>
           <span className="bg-white/20 px-4 py-2 rounded-xl text-amber-200">Đánh giá: {data.satisfaction_percent}%</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* INFO CARD */}
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <h3 className="font-black text-slate-900 border-b pb-4 uppercase text-sm tracking-widest">Thông tin bản ghi</h3>
              <div className="space-y-4">
                 {[
                    { label: 'Bệnh viện', value: data.hospital, icon: MapPin },
                    { label: 'Ngày điền phiếu', value: data.survey_date, icon: Calendar },
                    { label: 'Mã người mẹ', value: data.mother_id, icon: User },
                    { label: 'Tuổi', value: data.age },
                    { label: 'Số điện thoại', value: data.phone },
                    { label: 'Khoa điều trị', value: data.departments },
                    { label: 'Cách sinh', value: data.birth_method === 1 ? 'Đẻ thường' : data.birth_method === 2 ? 'Mổ cấp cứu' : data.birth_method === 3 ? 'Mổ có chuẩn bị' : data.birth_method_other },
                    { label: 'Dùng BHYT', value: data.bhyt === 1 ? 'Có' : 'Không' }
                 ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                       <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">{item.label}</span>
                       <span className="text-slate-700 font-black">{item.value || 'N/A'}</span>
                    </div>
                 ))}
              </div>
           </section>

           {/* OVERALL CARD */}
           <section className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between">
              <div>
                 <h3 className="font-black border-b border-white/20 pb-4 uppercase text-sm tracking-widest mb-6">Đánh giá chung</h3>
                 <div className="text-center py-6">
                    <div className="text-5xl font-black mb-2">{data.satisfaction_percent}%</div>
                    <p className="text-white/70 uppercase text-[10px] font-black tracking-widest text-center">Mức độ đáp ứng hài lòng</p>
                 </div>
              </div>
              <div className="space-y-4 bg-white/10 p-4 rounded-2xl">
                 <p className="text-[10px] font-black uppercase text-white/50 border-b border-white/10 pb-2">Ý kiến thêm</p>
                 <p className="text-sm italic italic leading-relaxed">"{data.note || 'Không có ý kiến thêm'}"</p>
              </div>
           </section>
        </div>

        {/* EVALUATION MATRIX */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
           <h3 className="font-black text-slate-900 border-b pb-4 uppercase text-sm tracking-widest mb-8">Kết quả khảo sát chi tiết</h3>
           <div className="space-y-10">
              {SECTION_MAP.map(section => (
                 <div key={section.id} className="space-y-4">
                    <h4 className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl inline-block uppercase tracking-wider">{section.title}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {section.questions.map(q => (
                          <div key={q.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                             <span className="text-[11px] font-bold text-slate-600 line-clamp-1 flex-1 pr-4">{q.text}</span>
                             <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-600 font-black text-sm border border-emerald-100">
                                {(data as any)[q.id] || '-'}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
};
