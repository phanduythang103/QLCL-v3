import React from 'react';
import { FileText, ChevronRight, ClipboardList } from 'lucide-react';

export const AssessmentReports: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-section font-black text-black uppercase tracking-tight flex items-center gap-2">
          <ClipboardList className="text-[#009900]" size={24} />
          Các bộ tiêu chuẩn đánh giá khác
        </h3>
        <p className="text-slate-500 font-bold uppercase text-[10px]">Danh sách các tiêu chuẩn đánh giá chuyên biệt</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'standard-1', title: 'Tiêu chuẩn chất lượng cơ bản', desc: 'Đánh giá các tiêu chí cơ bản của bệnh viện' },
          { id: 'standard-2', title: 'Tiêu chuẩn mức đo lường', desc: 'Đo lường mức độ hài lòng người bệnh' },
          { id: 'standard-3', title: 'Tiêu chuẩn kiểm soát nhiễm khuẩn', desc: 'Đánh giá công tác kiểm soát nhiễm khuẩn' }
        ].map(item => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-[#009900] mb-4 group-hover:bg-[#009900] group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <h4 className="font-black text-slate-800 uppercase text-xs mb-2">{item.title}</h4>
            <p className="text-slate-500 text-[10px] uppercase font-bold leading-relaxed">{item.desc}</p>
            <div className="mt-6 flex items-center text-[#009900] font-black text-[10px] uppercase gap-2 group-hover:gap-4 transition-all">
              Truy cập đánh giá <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
