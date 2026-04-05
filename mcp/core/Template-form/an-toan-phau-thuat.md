import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  User, 
  Stethoscope, 
  Activity, 
  ShieldCheck, 
  Clock, 
  LogOut, 
  Save, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Layout,
  Users,
  Building2,
  Camera,
  Percent,
  Check,
  X
} from 'lucide-react';

const App = () => {
  // Khởi tạo state khớp với cấu trúc SQL và 13 tiêu chí mới
  // Sử dụng null để biểu thị chưa đánh giá, true là Đạt, false là Không đạt
  const [formData, setFormData] = useState({
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: '',
    ban_mo_so: '',
    khoa_phau_thuat: '',
    ho_ten_nguoi_benh: '',
    kip_phau_thuat: '',
    ghi_chu_chung: '',
    // 13 tiêu chí
    tc1: null, tc2: null, tc3: null, tc4: null, tc5: null,
    tc6: null, tc7: null, tc8: null, tc9: null,
    tc10: null, tc11: null, tc12: null, tc13: null
  });

  const [complianceRate, setComplianceRate] = useState(0);

  // Tính toán tỷ lệ tuân thủ khi dữ liệu thay đổi
  useEffect(() => {
    const metCriteria = [
      formData.tc1, formData.tc2, formData.tc3, formData.tc4, formData.tc5,
      formData.tc6, formData.tc7, formData.tc8, formData.tc9,
      formData.tc10, formData.tc11, formData.tc12, formData.tc13
    ].filter(v => v === true).length;
    
    setComplianceRate(((metCriteria / 13) * 100).toFixed(1));
  }, [formData]);

  const setStatus = (field, status) => {
    setFormData(prev => ({ ...prev, [field]: status }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra xem đã đánh giá hết các tiêu chí chưa
    const unanswered = [1,2,3,4,5,6,7,8,9,10,11,12,13].some(i => formData[`tc${i}`] === null);
    if (unanswered) {
      alert("Vui lòng hoàn thành đánh giá Đạt/Không đạt cho tất cả 13 tiêu chí.");
      return;
    }

    console.log("Dữ liệu gửi lên SQL (13 tiêu chí):", {
      ...formData,
      ty_le_tuan_thu: complianceRate
    });
    alert(`Bảng kiểm đã hoàn tất! Tỷ lệ tuân thủ: ${complianceRate}%`);
  };

  const SectionHeader = ({ icon: Icon, title, color }) => (
    <div className={`flex items-center gap-2 p-3 ${color} text-white rounded-t-lg font-bold uppercase text-[11px] tracking-wider shadow-sm`}>
      <Icon size={16} />
      {title}
    </div>
  );

  const CriteriaItem = ({ item, colorClass, activeMetClass, activeUnmetClass }) => (
    <div className={`flex flex-col gap-3 p-3 rounded-xl border transition-all bg-white border-slate-100 shadow-sm`}>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold leading-snug text-slate-700">{item.l}</span>
        <p className="text-[9px] text-slate-400 font-medium italic uppercase tracking-tighter">Xác nhận: {item.p}</p>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => setStatus(item.k, true)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
            formData[item.k] === true 
              ? `${activeMetClass} border-transparent shadow-md` 
              : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
          }`}
        >
          <Check size={14} strokeWidth={3} /> Đạt
        </button>
        <button
          type="button"
          onClick={() => setStatus(item.k, false)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
            formData[item.k] === false 
              ? `${activeUnmetClass} border-transparent shadow-md` 
              : 'bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-600'
          }`}
        >
          <X size={14} strokeWidth={3} /> Không đạt
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Main Header */}
        <div className="bg-indigo-700 p-6 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight leading-tight">Giám sát An toàn Phẫu thuật</h1>
                <p className="text-indigo-100 text-xs opacity-90 italic tracking-wide">Audit Tool - Bảng kiểm 13 tiêu chí chuẩn</p>
              </div>
            </div>
            <div className="bg-white/10 px-6 py-2 rounded-2xl backdrop-blur-sm border border-white/20 text-center min-w-[140px]">
              <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-widest leading-none mb-1">Tỷ lệ tuân thủ</p>
              <p className="text-3xl font-black">{complianceRate}%</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Thông tin hành chính */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} /> Ngày giám sát
              </label>
              <input 
                type="date" required
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition bg-white"
                value={formData.ngay_giam_sat}
                onChange={(e) => setFormData({...formData, ngay_giam_sat: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <User size={12} /> Người giám sát
              </label>
              <input 
                type="text" placeholder="Tên giám sát viên" required
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition bg-white"
                value={formData.nguoi_giam_sat}
                onChange={(e) => setFormData({...formData, nguoi_giam_sat: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Layout size={12} /> Bàn mổ số
              </label>
              <input 
                type="text" placeholder="Số hiệu bàn mổ"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition bg-white"
                value={formData.ban_mo_so}
                onChange={(e) => setFormData({...formData, ban_mo_so: e.target.value})}
              />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <FileText size={12} /> Họ tên người bệnh
              </label>
              <input 
                type="text" placeholder="Tên bệnh nhân" required
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition bg-white"
                value={formData.ho_ten_nguoi_benh} 
                onChange={(e) => setFormData({...formData, ho_ten_nguoi_benh: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Building2 size={12} /> Khoa phẫu thuật
              </label>
              <input 
                type="text" placeholder="Khoa điều trị"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition bg-white"
                value={formData.khoa_phau_thuat}
                onChange={(e) => setFormData({...formData, khoa_phau_thuat: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Users size={12} /> Kíp phẫu thuật
              </label>
              <input 
                type="text" placeholder="Phẫu thuật viên chính"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition bg-white"
                value={formData.kip_phau_thuat}
                onChange={(e) => setFormData({...formData, kip_phau_thuat: e.target.value})}
              />
            </div>
          </div>

          {/* Checklist 3 Giai đoạn */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Giai đoạn 1: SIGN IN */}
            <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader icon={Clock} title="I. TRƯỚC GÂY MÊ (SI)" color="bg-orange-500" />
              <div className="p-3 space-y-4 flex-1">
                {[
                  { k: 'tc1', l: 'Xác nhận danh tính: Họ tên, ngày sinh, mã số người bệnh', p: 'BS gây mê, ĐD, BN' },
                  { k: 'tc2', l: 'Xác nhận vị trí phẫu thuật: Đã đánh dấu mũi tên (không dùng X)', p: 'PTV chính' },
                  { k: 'tc3', l: 'Cam kết PT: Đã ký đủ chữ ký PTV, BS gây mê, BN/Người thân', p: 'ĐD dụng cụ' },
                  { k: 'tc4', l: 'Kiểm tra thiết bị & thuốc: Máy mê, máy theo dõi, oxy, thuốc cấp cứu', p: 'BS gây mê' },
                  { k: 'tc5', l: 'Đánh giá nguy cơ: Đường thở, mất máu (>500ml), dị ứng thuốc', p: 'BS gây mê' }
                ].map(item => (
                  <CriteriaItem 
                    key={item.k} 
                    item={item} 
                    activeMetClass="bg-emerald-600 text-white" 
                    activeUnmetClass="bg-red-600 text-white" 
                  />
                ))}
              </div>
            </div>

            {/* Giai đoạn 2: TIME OUT */}
            <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader icon={Activity} title="II. TRƯỚC RẠCH DA (TO)" color="bg-indigo-600" />
              <div className="p-3 space-y-4 flex-1">
                {[
                  { k: 'tc6', l: 'Giới thiệu nhân sự: Từng thành viên giới thiệu tên và vai trò', p: 'Cả kíp phẫu thuật' },
                  { k: 'tc7', l: 'Xác nhận lần cuối: Đúng BN, đúng vị trí và đúng phương pháp', p: 'PTV chính' },
                  { k: 'tc8', l: 'Dự phòng nhiễm khuẩn: Kháng sinh dự phòng trong vòng 60 phút', p: 'BS gây mê' },
                  { k: 'tc9', l: 'Các vấn đề phát sinh: Trao đổi về các nguy cơ đột biến', p: 'Cả kíp phẫu thuật' }
                ].map(item => (
                  <CriteriaItem 
                    key={item.k} 
                    item={item} 
                    activeMetClass="bg-emerald-600 text-white" 
                    activeUnmetClass="bg-red-600 text-white" 
                  />
                ))}
              </div>
            </div>

            {/* Giai đoạn 3: SIGN OUT */}
            <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader icon={LogOut} title="III. TRƯỚC RỜI PHÒNG (SO)" color="bg-emerald-600" />
              <div className="p-3 space-y-4 flex-1">
                {[
                  { k: 'tc10', l: 'Kiểm đếm dụng cụ: Xác nhận đủ gạc, dụng cụ, vật tư tiêu hao', p: 'ĐD dụng cụ' },
                  { k: 'tc11', l: 'Mẫu bệnh phẩm: Dán nhãn chính xác thông tin BN và loại bệnh phẩm', p: 'Phẫu thuật viên' },
                  { k: 'tc12', l: 'Ghi chép hồ sơ: Hoàn thiện biên bản PT, các tai biến phát sinh', p: 'Phẫu thuật viên' },
                  { k: 'tc13', l: 'Bàn giao hồi tỉnh: Các lưu ý về chăm sóc và theo dõi sau mổ', p: 'BS gây mê' }
                ].map(item => (
                  <CriteriaItem 
                    key={item.k} 
                    item={item} 
                    activeMetClass="bg-emerald-600 text-white" 
                    activeUnmetClass="bg-red-600 text-white" 
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Footer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest">
                <AlertTriangle size={16} className="text-amber-500" /> Ghi chú đặc biệt / Kiến nghị
              </div>
              <textarea 
                className="w-full p-4 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition h-28 shadow-inner"
                placeholder="Nhập các sự cố hoặc lỗi quy trình quan sát được..."
                value={formData.ghi_chu_chung}
                onChange={(e) => setFormData({...formData, ghi_chu_chung: e.target.value})}
              />
            </div>
            <div className="flex flex-col justify-end gap-4">
              <div className="flex items-center justify-between px-6 py-5 bg-slate-900 rounded-2xl text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <Percent size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mb-1">Tổng kết giám sát</p>
                    <p className="text-lg font-black italic">Tuân thủ: {complianceRate}%</p>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-black transition active:scale-95 uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
                >
                  <Save size={18} className="inline mr-2" /> Lưu kết quả
                </button>
              </div>
              <div className="flex justify-center gap-6">
                <button type="button" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition flex items-center gap-1.5">
                  <Camera size={14} /> Chụp ảnh thực tế
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="bg-slate-50 px-8 py-4 border-t text-[9px] text-slate-400 flex justify-between uppercase tracking-[0.25em] font-black">
           <span>WHO Surgical Safety Checklist Audit</span>
           <span>Database: public.giam_sat_atpt</span>
        </div>
      </div>
    </div>
  );
};

export default App;