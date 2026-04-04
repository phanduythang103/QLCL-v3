import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  User, 
  Calendar, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Camera
} from 'lucide-react';

const App = () => {
  // 1. Khởi tạo State theo cấu trúc DB
  const [formData, setFormData] = useState({
    ngay_giam_sat: new Date().toISOString().split('T')[0],
    nguoi_giam_sat: '',
    khoa_duoc_giam_sat: '',
    doi_tuong: '',
    nguoi_duoc_giam_sat: '',
    ghi_chu_chung: '',
    hinh_anh_minh_chung: [], 
  });

  // Tên hiển thị cố định cho 5 thời điểm chuẩn (Chữ thường đậm)
  const momentLabels = {
    '1': '1. Trước khi tiếp xúc người bệnh',
    '2': '2. Trước khi làm thủ thuật vô khuẩn',
    '3': '3. Sau khi tiếp xúc dịch tiết cơ thể',
    '4': '4. Sau khi tiếp xúc người bệnh',
    '5': '5. Sau khi tiếp xúc vật dụng xung quanh người bệnh'
  };

  // Checklist mặc định hiển thị sẵn 5 thời điểm cố định
  const initialObservations = [
    { id: 1, thoi_diem: '1', co_hoi: false, tuan_thu: false, dung_ky_thuat: false, ghi_chu: '' },
    { id: 2, thoi_diem: '2', co_hoi: false, tuan_thu: false, dung_ky_thuat: false, ghi_chu: '' },
    { id: 3, thoi_diem: '3', co_hoi: false, tuan_thu: false, dung_ky_thuat: false, ghi_chu: '' },
    { id: 4, thoi_diem: '4', co_hoi: false, tuan_thu: false, dung_ky_thuat: false, ghi_chu: '' },
    { id: 5, thoi_diem: '5', co_hoi: false, tuan_thu: false, dung_ky_thuat: false, ghi_chu: '' },
  ];

  const [observations, setObservations] = useState(initialObservations);

  // Các giá trị tính toán tự động
  const [stats, setStats] = useState({
    tong_co_hoi: 0,
    so_lan_tuan_thu: 0,
    so_lan_dung_ky_thuat: 0
  });

  // 2. Tự động tính toán số liệu khi checklist thay đổi
  useEffect(() => {
    const tong_co_hoi = observations.filter(o => o.co_hoi).length;
    const so_lan_tuan_thu = observations.filter(o => o.co_hoi && o.tuan_thu).length;
    const so_lan_dung_ky_thuat = observations.filter(o => o.co_hoi && o.tuan_thu && o.dung_ky_thuat).length;

    setStats({ tong_co_hoi, so_lan_tuan_thu, so_lan_dung_ky_thuat });
  }, [observations]);

  const updateObservation = (id, field, value) => {
    setObservations(observations.map(o => {
      if (o.id === id) {
        const updated = { ...o, [field]: value };
        // Ràng buộc: Nếu không tuân thủ thì không thể đúng kỹ thuật
        if (field === 'tuan_thu' && value === false) updated.dung_ky_thuat = false;
        // Ràng buộc: Nếu không có cơ hội thì không có tuân thủ/kỹ thuật
        if (field === 'co_hoi' && value === false) {
            updated.tuan_thu = false;
            updated.dung_ky_thuat = false;
        }
        return updated;
      }
      return o;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Chỉ lấy các dòng có tích "Cơ hội" để gửi lên SQL
    const activeObservations = observations.filter(o => o.co_hoi);
    
    const finalData = {
      ...formData,
      checklist_data: activeObservations, 
      ...stats 
    };

    console.log("Dữ liệu sẵn sàng gửi lên SQL:", finalData);
    alert("Dữ liệu đã được đóng gói chuẩn cấu trúc SQL!");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <ClipboardCheck size={32} />
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">Giám sát Vệ sinh tay</h1>
              <p className="text-emerald-100 text-sm italic">Hệ thống quản lý chất lượng bệnh viện</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Section 1: Thông tin chung */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Calendar size={14} /> Ngày giám sát
              </label>
              <input 
                type="date" 
                required
                className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                value={formData.ngay_giam_sat}
                onChange={(e) => setFormData({...formData, ngay_giam_sat: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <User size={14} /> Người giám sát
              </label>
              <input 
                type="text" 
                required
                placeholder="Tên giám sát viên"
                className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                value={formData.nguoi_giam_sat}
                onChange={(e) => setFormData({...formData, nguoi_giam_sat: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Building2 size={14} /> Khoa giám sát
              </label>
              <select 
                required
                className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                value={formData.khoa_duoc_giam_sat}
                onChange={(e) => setFormData({...formData, khoa_duoc_giam_sat: e.target.value})}
              >
                <option value="">Chọn khoa/phòng</option>
                <option value="Khoa Nội">Khoa Nội</option>
                <option value="Khoa Ngoại">Khoa Ngoại</option>
                <option value="Hồi sức tích cực">Hồi sức tích cực</option>
                <option value="Phòng khám">Phòng khám</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <Users size={14} /> Đối tượng được giám sát
              </label>
              <div className="flex gap-1">
                <select 
                  required
                  className="w-24 p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                  value={formData.doi_tuong}
                  onChange={(e) => setFormData({...formData, doi_tuong: e.target.value})}
                >
                  <option value="">Loại</option>
                  <option value="Bác sĩ">BS</option>
                  <option value="Điều dưỡng">ĐD</option>
                  <option value="Hộ lý">HL</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Họ tên NVYT"
                  className="flex-1 p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                  value={formData.nguoi_duoc_giam_sat}
                  onChange={(e) => setFormData({...formData, nguoi_duoc_giam_sat: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Checklist Quan sát */}
          <div className="space-y-3">
            <div className="flex items-center border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase">
                <CheckCircle2 size={18} className="text-emerald-600" /> Bảng quan sát chi tiết (5 Thời điểm)
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3 border-b w-[280px]">Thời điểm</th>
                    <th className="p-3 border-b text-center w-20">Cơ hội</th>
                    <th className="p-3 border-b text-center w-20">Tuân thủ</th>
                    <th className="p-3 border-b text-center w-20">Đúng KT</th>
                    <th className="p-3 border-b">Ghi chú chi tiết</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {observations.map((obs) => (
                    <tr key={obs.id} className={`${obs.co_hoi ? 'bg-emerald-50/30' : ''} hover:bg-slate-50 transition border-b last:border-0`}>
                      <td className="p-3 border-r border-slate-100">
                        <span className="font-bold text-slate-700 block text-[11px] leading-tight">
                          {momentLabels[obs.thoi_diem]}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded cursor-pointer accent-blue-600 align-middle"
                          checked={obs.co_hoi}
                          onChange={(e) => updateObservation(obs.id, 'co_hoi', e.target.checked)}
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <input 
                          type="checkbox" 
                          disabled={!obs.co_hoi}
                          className="w-5 h-5 rounded cursor-pointer accent-emerald-600 disabled:opacity-10 align-middle"
                          checked={obs.tuan_thu}
                          onChange={(e) => updateObservation(obs.id, 'tuan_thu', e.target.checked)}
                        />
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <input 
                          type="checkbox" 
                          disabled={!obs.tuan_thu}
                          className="w-5 h-5 rounded cursor-pointer accent-orange-500 disabled:opacity-10 align-middle"
                          checked={obs.dung_ky_thuat}
                          onChange={(e) => updateObservation(obs.id, 'dung_ky_thuat', e.target.checked)}
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <input 
                          type="text"
                          placeholder="Lỗi cụ thể hoặc mô tả..."
                          className="w-full bg-transparent p-1 text-xs border-b border-transparent focus:border-emerald-300 outline-none italic text-slate-600"
                          value={obs.ghi_chu}
                          onChange={(e) => updateObservation(obs.id, 'ghi_chu', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Tổng kết chỉ số */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cơ hội quan sát</p>
                <p className="text-3xl font-black text-slate-800">{stats.tong_co_hoi}</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-full text-slate-400">
                 <Users size={24} />
              </div>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Tuân thủ</p>
                <p className="text-3xl font-black text-emerald-800">
                  {stats.tong_co_hoi > 0 ? Math.round((stats.so_lan_tuan_thu / stats.tong_co_hoi) * 100) : 0}%
                </p>
                <p className="text-[10px] text-emerald-600 mt-1 font-semibold">{stats.so_lan_tuan_thu}/{stats.tong_co_hoi} lần thực hiện</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                 <CheckCircle2 size={24} />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1">Đúng Kỹ thuật</p>
                <p className="text-3xl font-black text-orange-800">
                  {stats.so_lan_tuan_thu > 0 ? Math.round((stats.so_lan_dung_ky_thuat / stats.so_lan_tuan_thu) * 100) : 0}%
                </p>
                <p className="text-[10px] text-orange-600 mt-1 font-semibold">{stats.so_lan_dung_ky_thuat}/{stats.so_lan_tuan_thu} lần đúng bước</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                 <AlertCircle size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase">
              <AlertCircle size={14} className="text-emerald-600" /> Nhận xét tổng quát & Kiến nghị cải thiện
            </label>
            <textarea 
              className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition h-24 text-sm shadow-inner"
              placeholder="Ghi nhận nhận xét chung cho đợt giám sát này..."
              value={formData.ghi_chu_chung}
              onChange={(e) => setFormData({...formData, ghi_chu_chung: e.target.value})}
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <button type="button" className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition font-bold text-xs uppercase tracking-wider">
                <Camera size={18} /> Ảnh minh chứng
            </button>
            <button 
              type="submit"
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-14 py-4 rounded-2xl font-black hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-200 uppercase tracking-widest"
            >
              <Save size={22} /> Gửi dữ liệu
            </button>
          </div>
        </form>

        <div className="bg-slate-50 px-6 py-3 border-t text-[9px] text-slate-400 flex justify-between uppercase tracking-[0.2em] font-bold">
           <span>Audit Form v2.1</span>
           <span>Khoa Kiểm soát nhiễm khuẩn</span>
        </div>
      </div>
    </div>
  );
};

export default App;