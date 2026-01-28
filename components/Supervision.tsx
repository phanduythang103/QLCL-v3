import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, CheckSquare, PlayCircle, FolderClock, 
  ShieldCheck, HandMetal, LayoutGrid, FileText, Pill, Users, ArrowLeft,
  Calendar, LayoutList, Plus, AlertCircle, Syringe, Stethoscope, RefreshCw,
  X, Edit2, Trash2, Eye
} from 'lucide-react';
import { SupervisionCategory } from '../types';
import { fetchLichGiamSat, LichGiamSat, addLichGiamSat, updateLichGiamSat, deleteLichGiamSat } from '../readLichGiamSat';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchUsers } from '../userApi';
import { useSupervision } from './SupervisionContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

// Hàm tính trạng thái tự động dựa trên ngày
const getAutoStatus = (tuNgay: string, denNgay: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(tuNgay);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(denNgay);
  endDate.setHours(0, 0, 0, 0);
  
  if (today < startDate) return 'Chưa thực hiện';
  if (today > endDate) return 'Quá hạn';
  return 'Đang thực hiện';
};

// Hàm format ngày dd/mm/yyyy
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const Supervision: React.FC = () => {
  const { category, setCategory } = useSupervision();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<LichGiamSat[]>([]);
  const [donViList, setDonViList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<LichGiamSat | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    tu_ngay: '',
    den_ngay: '',
    nd_giam_sat: '',
    nhan_vien_gs: '',
    dv_duoc_gs: '',
    trang_thai: 'Chưa thực hiện'
  });
  const [activityFilter, setActivityFilter] = useState('all');

  // Filter function for activities
  const filterByDate = (schedule: LichGiamSat) => {
    if (activityFilter === 'all') return true;
    const createdAt = schedule.created_at ? new Date(schedule.created_at) : null;
    if (!createdAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    createdAt.setHours(0, 0, 0, 0);
    switch (activityFilter) {
      case 'today': return createdAt.getTime() === today.getTime();
      case 'yesterday': return createdAt.getTime() === yesterday.getTime();
      case 'thisWeek': return createdAt >= startOfWeek && createdAt <= today;
      case 'lastWeek': return createdAt >= startOfLastWeek && createdAt <= endOfLastWeek;
      case 'thisMonth': return createdAt >= startOfMonth && createdAt <= today;
      case 'lastMonth': return createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
      default: return true;
    }
  };

  const filteredSchedules = schedules.filter(filterByDate);

  const isAdmin = user?.role === 'Quản trị viên';

  const loadData = async () => {
    setLoading(true);
    try {
      const [lichData, donVi, users] = await Promise.all([
        fetchLichGiamSat(),
        fetchDmDonVi(),
        fetchUsers()
      ]);
      console.log('Supervision - Loaded schedules:', lichData);
      setSchedules(lichData || []);
      setDonViList(donVi || []);
      setUsersList(users || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime changes for lich_giam_sat
    const channel = supabase
      .channel('lich_giam_sat_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lich_giam_sat'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        {category && (
          <div className="flex justify-end items-center">
            <button 
              onClick={() => setCategory(null)}
              className="flex items-center text-sm text-slate-500 hover:text-primary-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
            </button>
          </div>
        )}

        {category ? (
            // Detail View when a card is selected
            <div className="bg-white rounded-xl border border-primary-200 p-6 shadow-sm animate-in fade-in zoom-in duration-300">
               <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className={`p-3 rounded-xl ${supervisionTypes.find(t => t.id === category)?.bgIcon}`}>
                     {supervisionTypes.find(t => t.id === category)?.icon}
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">{supervisionTypes.find(t => t.id === category)?.title}</h3>
                     <p className="text-slate-500">{supervisionTypes.find(t => t.id === category)?.desc}</p>
                  </div>
               </div>
               
               {renderDetailContent(category)}
            </div>
        ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {supervisionTypes.map((item) => (
                <div 
                key={item.id}
                onClick={() => setCategory(item.id)}
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
      {!category && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Left: Recent Activities List */}
            <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                <ClipboardCheck size={20} className="text-primary-600" />
                Hoạt động gần đây
                <select 
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="ml-2 text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="yesterday">Hôm qua</option>
                  <option value="thisWeek">Tuần này</option>
                  <option value="lastWeek">Tuần trước</option>
                  <option value="thisMonth">Tháng này</option>
                  <option value="lastMonth">Tháng trước</option>
                </select>
                <button onClick={loadData} className="ml-2 text-slate-400 hover:text-primary-600">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {loading && <div className="p-4 text-center text-slate-400">Đang tải...</div>}
                    {!loading && filteredSchedules.length === 0 && (
                      <div className="p-4 text-center text-slate-400 italic">Không có hoạt động nào trong khoảng thời gian này</div>
                    )}
                    {!loading && filteredSchedules.slice(0, 10).map((schedule) => (
                        <div key={schedule.id} className="p-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg flex-shrink-0 ${
                                    schedule.trang_thai === 'Đã hoàn thành' ? 'bg-green-50 text-green-600' : 
                                    schedule.trang_thai === 'Đang thực hiện' ? 'bg-blue-50 text-blue-600' : 
                                    'bg-slate-50 text-slate-600'
                                }`}>
                                    <CheckSquare size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800 text-sm mb-1">
                                      Đã thêm lịch giám sát mới: <span className="text-primary-600">{schedule.nd_giam_sat || 'Giám sát chung'}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mb-1">
                                      Người thực hiện: <span className="font-medium">{schedule.nhan_vien_gs || 'Chưa phân công'}</span> tại đơn vị <span className="font-medium">{schedule.dv_duoc_gs || 'Chưa xác định'}</span>
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <FolderClock size={11} /> 
                                        {schedule.created_at ? new Date(schedule.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        schedule.trang_thai === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                        schedule.trang_thai === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' :
                                        schedule.trang_thai === 'Quá hạn' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {schedule.trang_thai || 'Chưa thực hiện'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
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
                    {!loading && schedules.slice(0, 3).map((schedule, idx) => {
                      const autoStatus = getAutoStatus(schedule.tu_ngay || '', schedule.den_ngay || '');
                      return (
                        <li key={schedule.id} className={`${idx < schedules.length - 1 ? 'mb-6' : ''} ml-4`}>
                          <div className={`absolute w-3 h-3 ${idx === 0 ? 'bg-primary-500' : 'bg-slate-200'} rounded-full mt-1.5 -left-1.5 border border-white`}></div>
                          <time className="mb-1 text-xs font-normal text-slate-400">
                            {formatDate(schedule.tu_ngay || '')} - {formatDate(schedule.den_ngay || '')}
                          </time>
                          <h3 className="text-sm font-semibold text-slate-900">{schedule.nd_giam_sat || 'Giám sát chung'}</h3>
                          <p className="text-xs text-slate-500">
                            {schedule.dv_duoc_gs || 'Chưa xác định'} - {schedule.nhan_vien_gs || 'Chưa phân công'}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                            autoStatus === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                            autoStatus === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' :
                            autoStatus === 'Quá hạn' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {autoStatus}
                          </span>
                        </li>
                      );
                    })}
                </ol>
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full mt-4 py-2 border border-primary-200 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors">
                    Xem toàn bộ lịch
                </button>
            </div>
            </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Lịch giám sát</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {isAdmin && (
                <div className="mb-4 flex justify-end">
                  <button 
                    onClick={() => {
                      setEditingSchedule(null);
                      setScheduleForm({
                        tu_ngay: '',
                        den_ngay: '',
                        nd_giam_sat: '',
                        nhan_vien_gs: '',
                        dv_duoc_gs: '',
                        trang_thai: 'Chưa thực hiện'
                      });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                    <Plus size={16} /> Thêm lịch mới
                  </button>
                </div>
              )}

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-primary-600 text-white font-bold uppercase text-xs">
                    <tr>
                      <th className="p-3 text-left">Từ ngày</th>
                      <th className="p-3 text-left">Đến ngày</th>
                      <th className="p-3 text-left">Nội dung giám sát</th>
                      <th className="p-3 text-left">Nhân viên GS</th>
                      <th className="p-3 text-left">Đơn vị được GS</th>
                      <th className="p-3 text-left">Trạng thái</th>
                      {isAdmin && <th className="p-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schedules.map((schedule) => {
                      const autoStatus = getAutoStatus(schedule.tu_ngay || '', schedule.den_ngay || '');
                      return (
                        <tr key={schedule.id} className="hover:bg-slate-50">
                          <td className="p-3">{formatDate(schedule.tu_ngay || '')}</td>
                          <td className="p-3">{formatDate(schedule.den_ngay || '')}</td>
                          <td className="p-3">{schedule.nd_giam_sat || '---'}</td>
                          <td className="p-3">{schedule.nhan_vien_gs || '---'}</td>
                          <td className="p-3">{schedule.dv_duoc_gs || '---'}</td>
                          <td className="p-3">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                schedule.trang_thai === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                schedule.trang_thai === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' :
                                schedule.trang_thai === 'Quá hạn' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {schedule.trang_thai || 'Chưa thực hiện'}
                              </span>
                              {schedule.trang_thai !== autoStatus && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Tự động: {autoStatus}
                                </div>
                              )}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingSchedule(schedule);
                                    setScheduleForm({
                                      tu_ngay: schedule.tu_ngay || '',
                                      den_ngay: schedule.den_ngay || '',
                                      nd_giam_sat: schedule.nd_giam_sat || '',
                                      nhan_vien_gs: schedule.nhan_vien_gs || '',
                                      dv_duoc_gs: schedule.dv_duoc_gs || '',
                                      trang_thai: schedule.trang_thai || 'Chưa thực hiện'
                                    });
                                  }}
                                  className="text-blue-600 hover:bg-blue-50 p-1 rounded">
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    if (window.confirm('Bạn có chắc muốn xóa lịch này?')) {
                                      try {
                                        await deleteLichGiamSat(schedule.id!);
                                        loadData();
                                      } catch (err) {
                                        alert('Lỗi khi xóa');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {schedules.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-400 italic">
                          Chưa có lịch giám sát nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Form thêm/sửa (chỉ hiển thị khi admin đang edit) */}
              {isAdmin && (editingSchedule !== null || scheduleForm.nd_giam_sat) && (
                <div className="mt-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4">
                    {editingSchedule ? 'Chỉnh sửa lịch' : 'Thêm lịch mới'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                      <input 
                        type="date"
                        value={scheduleForm.tu_ngay}
                        onChange={(e) => setScheduleForm({...scheduleForm, tu_ngay: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày</label>
                      <input 
                        type="date"
                        value={scheduleForm.den_ngay}
                        onChange={(e) => setScheduleForm({...scheduleForm, den_ngay: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung giám sát</label>
                      <input 
                        type="text"
                        value={scheduleForm.nd_giam_sat}
                        onChange={(e) => setScheduleForm({...scheduleForm, nd_giam_sat: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="VD: Giám sát vệ sinh tay"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nhân viên giám sát</label>
                      <select
                        value={scheduleForm.nhan_vien_gs}
                        onChange={(e) => setScheduleForm({...scheduleForm, nhan_vien_gs: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                        <option value="">-- Chọn nhân viên --</option>
                        {usersList.map(user => (
                          <option key={user.id} value={user.full_name}>{user.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị được giám sát</label>
                      <select
                        value={scheduleForm.dv_duoc_gs}
                        onChange={(e) => setScheduleForm({...scheduleForm, dv_duoc_gs: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                        <option value="">-- Chọn đơn vị --</option>
                        {donViList.map(dv => (
                          <option key={dv.id} value={`${dv.ma_don_vi} - ${dv.ten_don_vi}`}>
                            {dv.ma_don_vi} - {dv.ten_don_vi}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                      <select 
                        value={scheduleForm.trang_thai}
                        onChange={(e) => setScheduleForm({...scheduleForm, trang_thai: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                        <option value="Chưa thực hiện">Chưa thực hiện</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Đã hoàn thành">Đã hoàn thành</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button 
                      onClick={() => {
                        setEditingSchedule(null);
                        setScheduleForm({
                          tu_ngay: '',
                          den_ngay: '',
                          nd_giam_sat: '',
                          nhan_vien_gs: '',
                          dv_duoc_gs: '',
                          trang_thai: 'Chưa thực hiện'
                        });
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                      Hủy
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          if (editingSchedule) {
                            await updateLichGiamSat(editingSchedule.id!, scheduleForm);
                          } else {
                            // Thêm nguoi_tao khi tạo lịch mới
                            await addLichGiamSat({
                              ...scheduleForm,
                              nguoi_tao: user?.full_name || user?.username || 'Hệ thống'
                            });
                          }
                          setEditingSchedule(null);
                          setScheduleForm({
                            tu_ngay: '',
                            den_ngay: '',
                            nd_giam_sat: '',
                            nhan_vien_gs: '',
                            dv_duoc_gs: '',
                            trang_thai: 'Chưa thực hiện'
                          });
                          loadData();
                        } catch (err) {
                          alert('Lỗi khi lưu: ' + (err as Error).message);
                        }
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                      {editingSchedule ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};