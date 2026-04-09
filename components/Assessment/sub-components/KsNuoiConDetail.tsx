import React from 'react';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Clock, Baby, CheckCircle2, AlertCircle, Info, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';

interface Props {
  data: KsNuoiConRecord;
  onBack: () => void;
}

const OPTIONS = {
  see_policy: [
    'Khoa khám',
    'Phòng chờ sinh',
    'Khoa sau sinh',
    'Phòng tư vấn',
    'Nơi khác',
    'Không thấy'
  ],
  see_media: [
    'Khoa khám',
    'Phòng chờ sinh',
    'Khoa sau sinh',
    'Buồng bệnh',
    'Phòng tư vấn',
    'Khác',
    'Không thấy'
  ],
  consultation_time: [
    'Không tư vấn',
    'Khám thai',
    'Trước sinh',
    'Sau sinh',
    'Khác'
  ],
  reason_no_consult: [
    'Không khám tại BV',
    'Sinh cấp cứu',
    'NVYT bỏ qua',
    'Khác',
    'Có tư vấn'
  ],
  cord_cut: [
    'Cắt ngay',
    'Cắt chậm',
    'Không nhớ'
  ],
  skin_to_skin: [
    'Có',
    'Không'
  ],
  first_breastfeed: [
    'Ngay sau sinh',
    '< 30 phút',
    '< 1 giờ',
    '< 2 giờ',
    '2–24 giờ',
    '> 1 ngày',
    'Không bú mẹ',
    'Khác'
  ],
  support_person: [
    'Điều dưỡng/hộ sinh',
    'Bác sĩ',
    'Người nhà',
    'Khác',
    'Không hỗ trợ'
  ],
  support_type: [
    'Hướng dẫn bú',
    'Mát-xa vú',
    'Vắt sữa',
    'Thông tắc tia sữa',
    'Khác'
  ],
  other_food: [
    'Chỉ bú mẹ',
    'Nước',
    'Sữa mẹ khác',
    'Sữa công thức',
    'Khác'
  ],
  suggest_formula: [
    'Có',
    'Không'
  ]
};

export const KsNuoiConDetail: React.FC<Props> = ({ data, onBack }) => {
  const themeColor = "#009900";

  const renderArrayValues = (field: keyof typeof OPTIONS, values?: number[]) => {
    if (!values || values.length === 0) return <span className="text-slate-400 italic">Không có dữ liệu</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {values.map(v => (
          <span key={v} className="px-3 py-1 bg-emerald-50 text-[#009900] text-[10px] font-black uppercase rounded-full border border-emerald-100">
            {OPTIONS[field][v - 1]}
          </span>
        ))}
      </div>
    );
  };

  const renderSingleValue = (field: keyof typeof OPTIONS, value?: number) => {
    if (!value || value === 0) return <span className="text-slate-400 italic font-medium px-4 py-2 bg-slate-50 rounded-xl">N/A</span>;
    return (
      <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
        {OPTIONS[field][value - 1]}
      </span>
    );
  };

  return (
    <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className={`bg-[${themeColor}] text-white p-8 md:p-12 rounded-3xl shadow-2xl text-center space-y-4 mb-8 mx-auto max-w-5xl mt-4 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex justify-start mb-4 relative z-10">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white font-black text-[10px] uppercase transition-all"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-black uppercase relative z-10">
          Chi tiết phiếu khảo sát nuôi con
        </h1>
        <div className="flex items-center justify-center gap-4 text-xs font-bold relative z-10 opacity-90 overflow-x-auto whitespace-nowrap pb-2">
          <span className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full shrink-0"><Calendar size={12} /> {data.survey_date ? new Date(data.survey_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
          <span className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full shrink-0"><MapPin size={12} /> {data.hospital || 'N/A'}</span>
          <span className="flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full shrink-0"><Clock size={12} /> {data.department_code || 'No Code'}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 px-4">
        {/* ADMINISTRATIVE SECTION */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">I. Thông tin hành chính & Người bệnh</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Mã người bệnh</span>
              <span className="text-sm font-black text-slate-700">{data.patient_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Khoa điều trị</span>
              <span className="text-sm font-black text-slate-700">{data.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Tuổi</span>
              <span className="text-sm font-black text-slate-700">{data.age} Tuổi</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Phone size={12} /> Số điện thoại</span>
              <span className="text-sm font-black text-slate-700">{data.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Baby size={12} /> Sinh của trẻ</span>
              <span className="text-sm font-black text-slate-700">{data.baby_birth_date ? new Date(data.baby_birth_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Baby size={12} /> Hình thức sinh</span>
              <span className="px-3 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">{data.delivery_type === 1 ? 'Đẻ thường' : 'Mổ đẻ'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Lần nhập viện / Ngày nằm</span>
              <span className="text-sm font-black text-slate-700">{data.visit_count} lần / {data.days_in_hospital} ngày</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Baby size={12} /> Số lần sinh</span>
              <span className="text-sm font-black text-slate-700">{data.birth_count} lần</span>
            </div>
          </div>
        </section>

        {/* PRACTICE SECTION */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">II. Thực hành nuôi con bằng sữa mẹ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2"><Info size={14} /> 1. Nghe thấy quy định tại:</h4>
              {renderArrayValues('see_policy', data.see_policy)}
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2"><Info size={14} /> 2. Kênh truyền thông đã thấy:</h4>
              {renderArrayValues('see_media', data.see_media)}
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2"><CheckCircle2 size={14} /> 3. Thời điểm được tư vấn/hướng dẫn:</h4>
              {renderArrayValues('consultation_time', data.consultation_time)}
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2"><AlertCircle size={14} /> 4. Lý do không được tư vấn:</h4>
              {renderSingleValue('reason_no_consult', data.reason_no_consult)}
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">5. Cắt dây rốn</span>
              {renderSingleValue('cord_cut', data.cord_cut)}
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">6. Tiếp xúc Da kề da</span>
              {renderSingleValue('skin_to_skin', data.skin_to_skin)}
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">7. Thời điểm bú lần đầu</span>
              {renderSingleValue('first_breastfeed', data.first_breastfeed)}
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">10. Ăn thêm sữa công thức?</span>
              {renderSingleValue('other_food', data.other_food)}
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2"><ThumbsUp size={14} /> 8. Người hỗ trợ bú mẹ:</h4>
              {renderArrayValues('support_person', data.support_person)}
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2"><CheckCircle2 size={14} /> 9. Hình thức hỗ trợ:</h4>
              {renderArrayValues('support_type', data.support_type)}
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-50 md:col-span-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">11. Được gợi ý/khuyên dùng sữa công thức?</span>
              <span className={`px-5 py-2 rounded-xl text-sm font-black ${data.suggest_formula === 1 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                {data.suggest_formula === 1 ? <ThumbsDown className="inline mr-2" size={16} /> : <ThumbsUp className="inline mr-2" size={16} />}
                {data.suggest_formula === 1 ? 'Có' : 'Không'}
              </span>
            </div>
          </div>
        </section>

        {/* FEEDBACK & INTENT */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">III. Cảm nhận & Dự định</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cảm nhận lợi ích sữa mẹ:</p>
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed shadow-inner">
                {data.benefits || 'Không có ý kiến'}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kiến nghị/Góp ý:</p>
              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed shadow-inner">
                {data.suggestions || 'Không có kiến nghị'}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50 flex flex-wrap gap-12 justify-center">
            <div className="text-center group">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest group-hover:text-emerald-500 transition-colors">Dự định bú mẹ hoàn toàn</p>
              <p className="text-3xl font-black text-[#009900] bg-emerald-50 px-8 py-4 rounded-[2rem] shadow-sm">{data.exclusive_months} <span className="text-xs">tháng</span></p>
            </div>
            <div className="text-center group">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest group-hover:text-emerald-500 transition-colors">Tổng thời gian cho con bú</p>
              <p className="text-3xl font-black text-[#009900] bg-emerald-50 px-8 py-4 rounded-[2rem] shadow-sm">{data.total_months} <span className="text-xs">tháng</span></p>
            </div>
          </div>
        </section>
      </div>

      <div className="py-12 text-center text-slate-300">
        <p className="text-[9px] font-black uppercase tracking-[0.3em]">&copy; 2026 Bệnh viện Quân y - Hệ thống quản lý chất lượng</p>
      </div>
    </div>
  );
};
