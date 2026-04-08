import React from 'react';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, Clock, Baby, CheckCircle2, AlertCircle
} from 'lucide-react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';

interface Props {
  data: KsNuoiConRecord;
  onBack: () => void;
}

const OPTIONS = {
  see_policy: [
    'Quy định về nuôi con bằng sữa mẹ',
    'Lợi ích của việc cho trẻ bú sớm trong vòng 1 giờ đầu',
    'Tầm quan trọng của việc nuôi con hoàn toàn bằng sữa mẹ trong 6 tháng đầu',
    'Tác hại của việc cho trẻ ăn thêm sữa công thức, nước, thức ăn khác trước 6 tháng',
    'Cách giữ sữa khi bà mẹ phải đi làm hoặc ở xa con',
    'Không dùng bình bú, vú ngậm nhân tạo'
  ],
  see_media: [
    'Bảng biểu/Poster',
    'Tờ rơi/Sách hướng dẫn',
    'Video/Clip truyền thông',
    'Phát thanh nội bộ',
    'Trò chuyện trực tiếp với nhân viên y tế',
    'Trang web/Mạng xã hội bệnh viện',
    'Khác'
  ],
  cord_cut: [
    'Cắt ngay sau khi sinh (dưới 1 phút)',
    'Cắt dây rốn muộn (sau 1-3 phút hoặc khi dây rốn ngừng đập)',
    'Không rõ'
  ],
  first_breastfeed: [
    'Trong vòng 1 giờ đầu sau sinh',
    'Từ 1 đến 6 giờ sau sinh',
    'Từ 6 đến 12 giờ sau sinh',
    'Sau 24 giờ sau sinh',
    'Khi về nhà mới cho bú',
    'Chưa cho con bú',
    'Không có sữa/Tắc sữa',
    'Trẻ bị bệnh/Phải nằm hồi sức'
  ],
  other_food: [
    'Không cho ăn gì khác ngoài sữa mẹ',
    'Nước chín/Nước cam cảm',
    'Sữa công thức',
    'Nước đường',
    'Khác'
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
          Chi tiết phiếu khảo sát
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm font-bold relative z-10 opacity-90">
             <span className="flex items-center gap-1"><Calendar size={14} /> {data.survey_date ? new Date(data.survey_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
             <span className="flex items-center gap-1"><MapPin size={14} /> {data.hospital || 'N/A'}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 px-4">
        {/* INFO SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Hành chính & Người bệnh</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Mã người bệnh</span>
                        <span className="text-sm font-black text-slate-700">{data.patient_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Khoa điều trị</span>
                        <span className="text-sm font-black text-slate-700">{data.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Tuổi & SĐT</span>
                        <span className="text-sm font-black text-slate-700">{data.age} Tuổi | {data.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 pb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Baby size={12} /> Ngày sinh của trẻ</span>
                        <span className="text-sm font-black text-slate-700">{data.baby_birth_date ? new Date(data.baby_birth_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Hình thức sinh</span>
                        <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">{data.delivery_type === 1 ? 'Đẻ thường' : 'Mổ đẻ'}</span>
                    </div>
                </div>
            </section>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Thực hành & Hỗ trợ</h3>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> Cắt dây rốn</label>
                        <p className="text-sm font-bold text-slate-700 px-4 py-3 bg-slate-50 rounded-2xl">{OPTIONS.cord_cut[(data.cord_cut || 1) - 1]}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10} /> Bú lần đầu</label>
                        <p className="text-sm font-bold text-slate-700 px-4 py-3 bg-slate-50 rounded-2xl">{OPTIONS.first_breastfeed[(data.first_breastfeed || 1) - 1]}</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> Sữa mẹ là duy nhất?</label>
                        <p className="text-sm font-bold text-slate-700 px-4 py-3 bg-slate-50 rounded-2xl">{OPTIONS.other_food[(data.other_food || 1) - 1]}</p>
                    </div>
                </div>
            </section>
        </div>

        {/* POLICY & MEDIA */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
            <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Tiếp cận thông tin quy định</h3>
            </div>
            <div className="space-y-8">
                <div className="space-y-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Quy định đã được nghe/thấy:</p>
                    {renderArrayValues('see_policy', data.see_policy)}
                </div>
                <div className="space-y-3">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Kênh truyền thông đã thấy:</p>
                    {renderArrayValues('see_media', data.see_media)}
                </div>
            </div>
        </section>

        {/* FEEDBACK */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-10">
             <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-[#009900] rounded-full"></div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">Cảm nhận & Đề xuất</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cảm nhận lợi ích sữa mẹ:</p>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed shadow-inner">
                        {data.benefits || 'Không có ý kiến'}
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kiến nghị cho BV:</p>
                    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed shadow-inner">
                        {data.suggestions || 'Không có kiến nghị'}
                    </div>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-8 justify-center">
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Dự định bú mẹ hoàn toàn</p>
                    <p className="text-2xl font-black text-[#009900]">{data.exclusive_months} <span className="text-xs">tháng</span></p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tổng thời gian bú mẹ</p>
                    <p className="text-2xl font-black text-[#009900]">{data.total_months} <span className="text-xs">tháng</span></p>
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
