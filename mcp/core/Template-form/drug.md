import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  User, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Save, 
  Camera, 
  ClipboardCheck,
  Search,
  MessageSquare,
  Layout,
  Check,
  X,
  Bed,
  Hash,
  FileText
} from 'lucide-react';

const App = () => {
  // 1. Khởi tạo State khớp hoàn toàn với cấu trúc bảng public.giam_sat_drug
  const [formData, setFormData] = useState({
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: '',
    don_vi_duoc_giam_sat: '', 
    ho_ten_nb: '',
    nam_sinh: '',
    ma_nb: '',
    ghi_chu: '', 
    hinh_anh: [], 
    // Trạng thái đạt (true), không đạt (false), hoặc chưa chọn (null)
    tc1: null, tc2: null, tc3: null, tc4: null, tc5: null,
    tc6: null, tc7: null, tc8: null, tc9: null, tc10: null,
    // Ghi chú lỗi cho từng tiêu chí
    note1: '', note2: '', note3: '', note4: '', note5: '',
    note6: '', note7: '', note8: '', note9: '', note10: ''
  });

  const [stats, setStats] = useState({
    tong_dat: 0,
    ty_le_tuan_thu: 0
  });

  // 2. Tự động tính tổng điểm và tỷ lệ khi dữ liệu thay đổi
  useEffect(() => {
    const count = [
      formData.tc1, formData.tc2, formData.tc3, formData.tc4, formData.tc5,
      formData.tc6, formData.tc7, formData.tc8, formData.tc9, formData.tc10
    ].filter(v => v === true).length;
    
    setStats({
      tong_dat: count,
      ty_le_tuan_thu: (count / 10) * 100
    });
  }, [formData]);

  const updateStatus = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const unanswered = [1,2,3,4,5,6,7,8,9,10].some(i => formData[`tc${i}`] === null);
    if (unanswered) {
      alert("Vui lòng đánh giá Đạt/Không đạt cho tất cả 10 tiêu chí.");
      return;
    }

    const sqlData = {
      ...formData,
      nam_sinh: formData.nam_sinh ? parseInt(formData.nam_sinh) : null,
      tong_dat: stats.tong_dat,
      ty_le_tuan_thu: stats.ty_le_tuan_thu
    };

    console.log("Dữ liệu sẵn sàng INSERT vào public.giam_sat_drug:", sqlData);
    alert(`Đã lưu kết quả! Tổng đạt: ${stats.tong_dat}/10 (${stats.ty_le_tuan_thu}%)`);
  };

  const CriteriaRow = ({ id, label }) => {
    const statusKey = `tc${id}`;
    const noteKey = `note${id}`;

    return (
      <div className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all ${
        formData[statusKey] === true ? 'bg-emerald-50/50 border-emerald-100' : 
        formData[statusKey] === false ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
              {id}
            </span>
            <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{label}</p>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => updateStatus(statusKey, true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                formData[statusKey] === true 
                  ? 'bg-[#009900] border-transparent text-white shadow-md font-bold' 
                  : 'bg-white border-slate-200 text-slate-400 hover:border-[#009900] hover:text-[#009900]'
              }`}
            >
              <Check size={14} strokeWidth={3} /> Đạt
            </button>
            <button
              type="button"
              onClick={() => updateStatus(statusKey, false)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                formData[statusKey] === false 
                  ? 'bg-red-600 border-transparent text-white shadow-md font-bold' 
                  : 'bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-600'
              }`}
            >
              <X size={14} strokeWidth={3} /> Không đạt
            </button>
          </div>
        </div>

        {/* Chỉ hiển thị ô mô tả lỗi khi trạng thái là Không đạt (false) */}
        {formData[statusKey] === false && (
          <div className="flex items-center gap-2 pl-9 animate-in fade-in slide-in-from-top-1 duration-200">
            <MessageSquare size={14} className="text-red-400" />
            <input 
              type="text"
              placeholder="Mô tả lỗi vi phạm cụ thể..."
              className="w-full bg-transparent border-b border-dashed border-red-200 focus:border-red-500 outline-none text-[11px] italic text-red-600 py-1"
              value={formData[noteKey]}
              onChange={(e) => updateField(noteKey, e.target.value)}
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  const SectionHeader = ({ title, color }) => (
    <div className={`flex items-center gap-2 px-4 py-2 ${color} text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-sm mb-4`}>
      <ClipboardCheck size={14} />
      {title}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
      <div className="max-w-6xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header - Màu chủ đạo #009900 */}
        <div className="bg-[#009900] p-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                <Pill size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Giám sát Sử dụng thuốc</h1>
                <p className="text-white/80 text-[10px] font-bold italic tracking-widest uppercase">Hệ thống Quản lý chất lượng bệnh viện</p>
              </div>
            </div>
            <div className="bg-white/10 px-6 py-2 rounded-2xl backdrop-blur-sm border border-white/20 text-center flex flex-col items-center min-w-[140px]">
              <p className="text-[9px] uppercase font-black text-white/70 tracking-widest mb-0.5 leading-none">Tỷ lệ tuân thủ</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black">{stats.ty_le_tuan_thu}%</span>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Thông tin hành chính */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-inner">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12} className="text-[#009900]" /> Ngày giám sát
              </label>
              <input 
                type="date" required
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition bg-white font-medium"
                value={formData.ngay_giam_sat}
                onChange={(e) => updateField('ngay_giam_sat', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <User size={12} className="text-[#009900]" /> Người giám sát
              </label>
              <input 
                type="text" placeholder="Tên cán bộ GS" required
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition bg-white font-medium"
                value={formData.nguoi_giam_sat}
                onChange={(e) => updateField('nguoi_giam_sat', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 size={12} className="text-[#009900]" /> Đơn vị giám sát
              </label>
              <input 
                type="text" placeholder="Khoa/Phòng" required
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition bg-white font-medium"
                value={formData.don_vi_duoc_giam_sat}
                onChange={(e) => updateField('don_vi_duoc_giam_sat', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText size={12} className="text-[#009900]" /> Họ tên người bệnh
              </label>
              <input 
                type="text" placeholder="Tên bệnh nhân" required
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition bg-white font-medium"
                value={formData.ho_ten_nb} 
                onChange={(e) => updateField('ho_ten_nb', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Hash size={12} className="text-[#009900]" /> Năm sinh
              </label>
              <input 
                type="number" placeholder="Ví dụ: 1985"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition bg-white font-medium"
                value={formData.nam_sinh}
                onChange={(e) => updateField('nam_sinh', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Search size={12} className="text-[#009900]" /> Mã số BN
              </label>
              <input 
                type="text" placeholder="PID"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition bg-white font-medium"
                value={formData.ma_nb}
                onChange={(e) => updateField('ma_nb', e.target.value)}
              />
            </div>
          </div>

          {/* Checklist Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
            
            {/* Column 1 */}
            <div className="space-y-8">
              <div>
                <SectionHeader title="I. Hình thức công khai" color="bg-[#009900]" />
                <div className="grid grid-cols-1 gap-4">
                  <CriteriaRow id="1" label="Có Phiếu công khai thuốc đặt tại đầu giường hoặc vị trí thuận tiện." />
                  <CriteriaRow id="2" label="Phiếu công khai in/ghi rõ ràng, không tẩy xóa, đúng mẫu Bộ Y tế." />
                </div>
              </div>

              <div>
                <SectionHeader title="II. Nội dung công khai" color="bg-[#009900]" />
                <div className="grid grid-cols-1 gap-4">
                  <CriteriaRow id="3" label="Thông tin thuốc trên phiếu khớp hoàn toàn với Y lệnh trong Bệnh án." />
                  <CriteriaRow id="4" label="Ghi công khai hàng ngày ngay sau khi thực hiện/cấp phát thuốc." />
                  <CriteriaRow id="5" label="Vật tư tiêu hao (bơm kim tiêm...) được công khai đầy đủ." />
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-8">
              <div>
                <SectionHeader title="III. Tư vấn và giải thích" color="bg-[#009900]" />
                <div className="grid grid-cols-1 gap-4">
                  <CriteriaRow id="6" label="Điều dưỡng có khai thác tiền sử dị ứng; giải thích thuốc trước khi thực hiện." />
                  <CriteriaRow id="7" label="Người bệnh hoặc người nhà ký xác nhận vào phiếu công khai hàng ngày." />
                </div>
              </div>

              <div>
                <SectionHeader title="IV. Kiểm tra thực tế (Phỏng vấn NB)" color="bg-[#009900]" />
                <div className="grid grid-cols-1 gap-4">
                  <CriteriaRow id="8" label="Người bệnh biết được số lượng thuốc mình đã dùng trong ngày." />
                  <CriteriaRow id="9" label="Số thuốc thực tế nhận được khớp với số lượng ghi trên Phiếu." />
                  <CriteriaRow id="10" label="Người bệnh không phải tự mua thuốc có trong danh mục được hưởng." />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" /> Nhận xét tổng quát
              </label>
              <textarea 
                className="w-full p-4 rounded-2xl border border-slate-200 focus:border-[#009900] outline-none text-sm transition h-24 bg-slate-50 shadow-inner font-medium"
                placeholder="Ghi nhận các kiến nghị cải thiện chất lượng..."
                value={formData.ghi_chu}
                onChange={(e) => updateField('ghi_chu', e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-3 min-w-[280px]">
              <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 leading-none">Tổng đạt</p>
                  <p className="text-xl font-black">{stats.tong_dat} / 10</p>
                </div>
                <button 
                  type="submit"
                  className="bg-[#009900] hover:bg-[#008800] text-white px-6 py-2.5 rounded-xl font-black transition active:scale-95 uppercase tracking-widest text-[10px] border border-white/10"
                >
                  <Save size={16} className="inline mr-1.5" /> Lưu SQL
                </button>
              </div>
              <div className="flex justify-center gap-6">
                <button type="button" className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#009900] transition flex items-center gap-1.5 font-bold uppercase">
                  <Camera size={14} /> Chụp minh chứng
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="bg-slate-100 px-8 py-3 text-[8px] text-slate-400 flex justify-between uppercase tracking-widest font-black border-t">
           <span>Medication Audit System v2.3</span>
           <span>Table: giam_sat_drug</span>
        </div>
      </div>
    </div>
  );
};

export default App;