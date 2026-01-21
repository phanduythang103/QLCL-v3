import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, CheckSquare, PlayCircle, FolderClock, 
  ShieldCheck, HandMetal, LayoutGrid, FileText, Pill, Users, ArrowLeft,
  Calendar, LayoutList, Plus, AlertCircle, Syringe, Stethoscope, RefreshCw
} from 'lucide-react';
import { SupervisionCategory } from '../types';
import { fetchLichGiamSat, LichGiamSat } from '../readLichGiamSat';
import { fetchPhieuGiamSat, PhieuGiamSat } from '../readPhieuGiamSat';

interface Props {
  category: SupervisionCategory;
  onCategoryChange: (category: SupervisionCategory) => void;
}

export const Supervision: React.FC<Props> = ({ category, onCategoryChange }) => {
  const [schedules, setSchedules] = useState<LichGiamSat[]>([]);
  const [checklists, setChecklists] = useState<PhieuGiamSat[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedCategory = category;

  const loadData = async () => {
    setLoading(true);
    try {
      const [lichData, phieuData] = await Promise.all([
        fetchLichGiamSat(),
        fetchPhieuGiamSat()
      ]);
      setSchedules(lichData || []);
      setChecklists(phieuData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const supervisionTypes = [
    { 
      id: 'SURGERY' as SupervisionCategory, 
      title: 'Giám sát An toàn phẫu thuật', 
      desc: 'Checklist WHO 3 bước (Sign In/Time Out/Sign Out)', 
      icon: <ShieldCheck size={28} className="text-green-600" />,
      bgIcon: 'bg-green-50' 
    },
    { 
      id: 'DRUGS' as SupervisionCategory, 
      title: 'Giám sát Công khai thuốc', 
      desc: 'Nhập dữ liệu công khai thuốc theo từng ca/sự kiện', 
      icon: <Pill size={28} className="text-red-600" />,
      bgIcon: 'bg-red-50' 
    },
    { 
      id: 'HAND_HYGIENE' as SupervisionCategory, 
      title: 'Giám sát Vệ sinh tay', 
      desc: 'Tuân thủ 5 thời điểm vệ sinh tay', 
      icon: <HandMetal size={28} className="text-teal-600" />,
      bgIcon: 'bg-teal-50' 
    },
    { 
      id: '5S' as SupervisionCategory, 
      title: 'Giám sát 5S', 
      desc: 'Sàng lọc - Sắp xếp - Sạch sẽ - Săn sóc - Sẵn sàng', 
      icon: <LayoutGrid size={28} className="text-orange-600" />,
      bgIcon: 'bg-orange-50' 
    },
    { 
      id: 'PROFESSIONAL' as SupervisionCategory, 
      title: 'Giám sát 55 Chế độ', 
      desc: 'Tuân thủ các chế độ công tác chuyên môn', 
      icon: <Users size={28} className="text-purple-600" />,
      bgIcon: 'bg-purple-50' 
    },
    { 
      id: 'RECORDS' as SupervisionCategory, 
      title: 'Giám sát Hồ sơ bệnh án', 
      desc: 'Kiểm tra quy chế ghi chép HSBA', 
      icon: <FileText size={28} className="text-blue-600" />,
      bgIcon: 'bg-blue-50' 
    },
    { 
      id: 'GENERAL' as SupervisionCategory, 
      title: 'Giám sát chung', 
      desc: 'Các nội dung kiểm tra đột xuất khác', 
      icon: <LayoutList size={28} className="text-slate-600" />,
      bgIcon: 'bg-slate-100' 
    },
  ];

  const renderDetailContent = (cat: SupervisionCategory) => {
    switch(cat) {
        case 'DRUGS':
            return (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                        <Syringe className="text-blue-600 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-800 text-sm">Ghi nhận sự kiện công khai thuốc</h4>
                            <p className="text-xs text-blue-600 mt-1">Hệ thống yêu cầu nhập liệu ngay tại thời điểm thực hiện công khai thuốc cho người bệnh/người nhà.</p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                        <span className="font-semibold text-slate-700">Lịch sử nhập liệu gần đây</span>
                        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2 shadow-sm">
                            <Plus size={16} /> Nhập liệu Ca mới
                        </button>
                    </div>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
                                <tr>
                                    <th className="p-3">Thời gian</th>
                                    <th className="p-3">Mã BN</th>
                                    <th className="p-3">Loại thuốc/Dịch truyền</th>
                                    <th className="p-3 text-center">Xác nhận của NB</th>
                                    <th className="p-3">Điều dưỡng thực hiện</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-3">12/06 08:30</td>
                                    <td className="p-3 font-mono">BN-10293</td>
                                    <td className="p-3">Kháng sinh Ceftriaxon 1g</td>
                                    <td className="p-3 text-center"><CheckSquare className="inline text-green-600" size={16} /></td>
                                    <td className="p-3">Nguyễn Thị C</td>
                                </tr>
                                <tr>
                                    <td className="p-3">12/06 09:15</td>
                                    <td className="p-3 font-mono">BN-10294</td>
                                    <td className="p-3">Paracetamol Kabi</td>
                                    <td className="p-3 text-center"><CheckSquare className="inline text-green-600" size={16} /></td>
                                    <td className="p-3">Nguyễn Thị C</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        case 'SURGERY':
            return (
                <div className="space-y-4">
                     <div className="flex gap-4 mb-4">
                        <div className="flex-1 bg-green-50 p-3 rounded border border-green-100 text-center">
                            <div className="text-xs text-green-600 uppercase font-bold">Sign In</div>
                            <div className="font-bold text-green-800 text-lg">100%</div>
                        </div>
                         <div className="flex-1 bg-amber-50 p-3 rounded border border-amber-100 text-center">
                            <div className="text-xs text-amber-600 uppercase font-bold">Time Out</div>
                            <div className="font-bold text-amber-800 text-lg">98%</div>
                        </div>
                         <div className="flex-1 bg-blue-50 p-3 rounded border border-blue-100 text-center">
                            <div className="text-xs text-blue-600 uppercase font-bold">Sign Out</div>
                            <div className="font-bold text-blue-800 text-lg">100%</div>
                        </div>
                     </div>
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                        <span className="font-semibold text-slate-700">Danh sách các ca phẫu thuật cần giám sát</span>
                        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2 shadow-sm">
                            <Stethoscope size={16} /> Checklist An toàn PT
                        </button>
                    </div>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
                                <tr>
                                    <th className="p-3">Phòng mổ</th>
                                    <th className="p-3">Kíp mổ</th>
                                    <th className="p-3">Bệnh nhân</th>
                                    <th className="p-3 text-center">Trạng thái Checklist</th>
                                    <th className="p-3 text-right">Kết quả</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="p-3">PM số 1</td>
                                    <td className="p-3">BS. Bình, ĐD. An</td>
                                    <td className="p-3">Lê Văn Tám</td>
                                    <td className="p-3 text-center">
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">Đủ 3 bước</span>
                                    </td>
                                    <td className="p-3 text-right text-green-600 font-bold">Đạt</td>
                                </tr>
                                <tr>
                                    <td className="p-3">PM số 3</td>
                                    <td className="p-3">BS. Hùng, BS. Tú</td>
                                    <td className="p-3">Trần Văn Ba</td>
                                    <td className="p-3 text-center">
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold border border-amber-200">Thiếu Sign Out</span>
                                    </td>
                                    <td className="p-3 text-right text-amber-600 font-bold">Chưa đạt</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        default:
            return (
               <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg">
                     <span className="font-semibold text-slate-700">Phiếu kiểm tra hiện có</span>
                     <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2 shadow-sm">
                        <PlayCircle size={16} /> Thực hiện giám sát mới
                     </button>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
                           <tr>
                              <th className="p-3">Mã phiếu</th>
                              <th className="p-3">Ngày kiểm tra</th>
                              <th className="p-3">Người kiểm tra</th>
                              <th className="p-3">Khoa/Phòng</th>
                              <th className="p-3 text-right">Kết quả</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           <tr className="border-t border-slate-100">
                              <td className="p-3 font-mono text-xs">PK-001</td>
                              <td className="p-3">12/06/2024</td>
                              <td className="p-3">Nguyễn Văn A</td>
                              <td className="p-3">Khoa Nội</td>
                              <td className="p-3 text-right"><span className="text-green-600 font-bold">Đạt (95%)</span></td>
                           </tr>
                           <tr className="border-t border-slate-100">
                              <td className="p-3 font-mono text-xs">PK-002</td>
                              <td className="p-3">10/06/2024</td>
                              <td className="p-3">Trần Thị B</td>
                              <td className="p-3">Khoa Ngoại</td>
                              <td className="p-3 text-right"><span className="text-amber-600 font-bold">Khá (80%)</span></td>
                           </tr>
                        </tbody>
                     </table>
                  </div>
               </div>
            );
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Section: Grid Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">Kiểm tra & Giám sát tuân thủ</h2>
             {selectedCategory && (
               <button 
                onClick={() => onCategoryChange(null)}
                className="flex items-center text-sm text-slate-500 hover:text-primary-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
               >
                 <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
               </button>
             )}
        </div>

        {selectedCategory ? (
            // Detail View when a card is selected
            <div className="bg-white rounded-xl border border-primary-200 p-6 shadow-sm animate-in fade-in zoom-in duration-300">
               <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className={`p-3 rounded-xl ${supervisionTypes.find(t => t.id === selectedCategory)?.bgIcon}`}>
                     {supervisionTypes.find(t => t.id === selectedCategory)?.icon}
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">{supervisionTypes.find(t => t.id === selectedCategory)?.title}</h3>
                     <p className="text-slate-500">{supervisionTypes.find(t => t.id === selectedCategory)?.desc}</p>
                  </div>
               </div>
               
               {renderDetailContent(selectedCategory)}
            </div>
        ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {supervisionTypes.map((item) => (
                <div 
                key={item.id}
                onClick={() => onCategoryChange(item.id)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-300 cursor-pointer transition-all group h-full flex flex-col"
                >
                <div className="flex items-start gap-4 mb-3">
                    <div className={`p-3 rounded-xl ${item.bgIcon} group-hover:scale-110 transition-transform shrink-0`}>
                        {item.icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-primary-700 leading-tight mb-1">{item.title}</h3>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-auto pl-1 border-l-2 border-slate-100">{item.desc}</p>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Bottom Section: Activities & Schedule (Only show in Overview) */}
      {!selectedCategory && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Left: Recent Activities List */}
            <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-primary-600" />
                Hoạt động giám sát gần đây
                <button onClick={loadData} className="ml-2 text-slate-400 hover:text-primary-600">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {loading && <div className="p-4 text-center text-slate-400">Đang tải...</div>}
                    {!loading && checklists.length === 0 && (
                      <div className="p-4 text-center text-slate-400 italic">Chưa có phiếu giám sát nào</div>
                    )}
                    {!loading && checklists.map((list) => (
                        <div key={list.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                    (list.ty_le_tuan_thu || 0) >= 90 ? 'bg-primary-50 text-primary-600' : 
                                    (list.ty_le_tuan_thu || 0) >= 75 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                }`}>
                                    <CheckSquare size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">{list.ten_phieu}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                        <FolderClock size={12} /> 
                                        {list.ngay_kiem_tra ? new Date(list.ngay_kiem_tra).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                                        {list.khoa_phong && <span> • {list.khoa_phong}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`font-bold text-sm ${
                                    (list.ty_le_tuan_thu || 0) >= 90 ? 'text-primary-600' : 
                                    (list.ty_le_tuan_thu || 0) >= 75 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                    {list.ty_le_tuan_thu || 0}%
                                </span>
                                <p className="text-[10px] text-slate-400">Tuân thủ</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-3 text-center border-t border-slate-100">
                    <button className="text-sm text-primary-600 hover:underline font-medium">Xem tất cả hoạt động</button>
                </div>
            </div>
            </div>

            {/* Right: Schedule */}
            <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-primary-600" />
                Lịch giám sát tuần này
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <ol className="relative border-l border-slate-200 ml-2">
                    {loading && <li className="ml-4 text-slate-400">Đang tải...</li>}
                    {!loading && schedules.length === 0 && (
                      <li className="ml-4 text-slate-400 italic">Chưa có lịch giám sát</li>
                    )}
                    {!loading && schedules.slice(0, 3).map((schedule, idx) => (
                      <li key={schedule.id} className={`${idx < schedules.length - 1 ? 'mb-6' : ''} ml-4`}>
                        <div className={`absolute w-3 h-3 ${idx === 0 ? 'bg-primary-500' : 'bg-slate-200'} rounded-full mt-1.5 -left-1.5 border border-white`}></div>
                        <time className="mb-1 text-xs font-normal text-slate-400">
                          {schedule.ngay_giam_sat ? new Date(schedule.ngay_giam_sat).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                          {schedule.gio_bat_dau && `, ${schedule.gio_bat_dau}`}
                        </time>
                        <h3 className="text-sm font-semibold text-slate-900">{schedule.noi_dung || 'Giám sát chung'}</h3>
                        <p className="text-xs text-slate-500">{schedule.khoa_phong || schedule.don_vi || 'Chưa xác định'}</p>
                      </li>
                    ))}
                </ol>
                <button className="w-full mt-4 py-2 border border-primary-200 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors">
                    Xem toàn bộ lịch
                </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};