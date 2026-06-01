import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, CheckSquare, PlayCircle, FolderClock,
  ShieldCheck, HandMetal, LayoutGrid, FileText, Pill, Users, ArrowLeft,
  Calendar, LayoutList, Plus, AlertCircle, Syringe, Stethoscope, RefreshCw,
  X, Edit2, Trash2, Eye, Activity, DoorOpen
} from 'lucide-react';
import { SupervisionCategory } from '../types';
import { fetchLichGiamSat, LichGiamSat, addLichGiamSat, updateLichGiamSat, deleteLichGiamSat } from '../readLichGiamSat';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchUsers } from '../userApi';
import { useSupervision } from './SupervisionContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { HandHygieneModule } from './HandHygieneModule';
import { SurgerySafetyModule } from './SurgerySafetyModule';
import { DrugMonitoringModule } from './DrugMonitoringModule';
import { FiveSMonitoringModule } from './FiveSMonitoringModule';
import { NdnbMonitoringModule } from './NdnbMonitoringModule';
import { HsbaMonitoringModule } from './HsbaMonitoringModule';
import { DutyMonitoringModule } from './DutyMonitoringModule';
import { EmergencyMonitoringModule } from './EmergencyMonitoringModule';
import { AdmissionDischargeModule } from './AdmissionDischargeModule';
import { GeneralMonitoringModule } from './GeneralMonitoringModule';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin');

  // Load criteria data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, dData, uData] = await Promise.all([
        fetchLichGiamSat(),
        fetchDmDonVi(),
        fetchUsers()
      ]);
      setSchedules(sData);
      setDonViList(dData);
      setUsersList(uData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteClick = (id: string) => {
    setTargetDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetDeleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteLichGiamSat(targetDeleteId);
      await loadData();
    } catch (err) {
      alert('Lỗi khi xóa: ' + (err as Error).message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setTargetDeleteId(null);
    }
  };

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

  if (category) {
    switch (category) {
      case 'HAND_HYGIENE': return <HandHygieneModule onBack={() => setCategory(null)} />;
      case 'SURGERY': return <SurgerySafetyModule onBack={() => setCategory(null)} />;
      case 'DRUGS': return <DrugMonitoringModule onBack={() => setCategory(null)} />;
      case '5S': return <FiveSMonitoringModule onBack={() => setCategory(null)} />;
      case 'NDNB': return <NdnbMonitoringModule onBack={() => setCategory(null)} />;
      case 'RECORDS': return <HsbaMonitoringModule onBack={() => setCategory(null)} />;
      case 'PROF_DUTY': return <DutyMonitoringModule onBack={() => setCategory(null)} />;
      case 'PROF_EMERGENCY': return <EmergencyMonitoringModule onBack={() => setCategory(null)} />;
      case 'PROF_ADMISSION': return <AdmissionDischargeModule onBack={() => setCategory(null)} />;
      case 'GENERAL': return <GeneralMonitoringModule onBack={() => setCategory(null)} />;
      default: break;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section with Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[
          { label: 'Tổng số lịch', value: schedules.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Đang thực hiện', value: schedules.filter(s => s.trang_thai === 'Đang thực hiện').length, icon: PlayCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Đã hoàn thành', value: schedules.filter(s => s.trang_thai === 'Đã hoàn thành').length, icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Quá hạn', value: schedules.filter(s => s.trang_thai === 'Quá hạn').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:p-4 md:gap-4 md:p-6">
            <div className={`shrink-0 rounded-xl p-3 md:p-4 ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase leading-tight tracking-normal text-slate-400 sm:text-[10px] md:tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 md:text-2xl">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Management & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Supervision Categories */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <LayoutGrid className="text-[#009900]" size={24} /> Các nội dung giám sát
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-8">
              {[
                { id: 'HAND_HYGIENE', label: 'Vệ sinh tay', icon: HandMetal, desc: 'Giám sát tuân thủ 5 thời điểm vệ sinh tay', color: 'bg-teal-50 text-teal-600' },
                { id: 'SURGERY', label: 'An toàn phẫu thuật', icon: ShieldCheck, desc: 'Checklist an toàn phẫu thuật WHO', color: 'bg-orange-50 text-orange-600' },
                { id: 'DRUGS', label: 'Công khai thuốc', icon: Pill, desc: 'Giám sát thực hành công khai thuốc tại khoa', color: 'bg-blue-50 text-blue-600' },
                { id: '5S', label: 'Quản lý 5S', icon: LayoutList, desc: 'Đánh giá duy trì 5S tại các khoa phòng', color: 'bg-green-50 text-green-600' },
                { id: 'NDNB', label: 'Nhận diện NB', icon: Users, desc: 'Giám sát nhận diện người bệnh tại các điểm', color: 'bg-purple-50 text-purple-600' },
                { id: 'RECORDS', label: 'Hồ sơ bệnh án', icon: FileText, desc: 'Kiểm tra tính hoàn thiện của HSBA nội trú', color: 'bg-indigo-50 text-indigo-600' },
                { id: 'PROF_DUTY', label: 'Trực chuyên môn', icon: Stethoscope, desc: 'Giám sát chế độ trực và thường trực', color: 'bg-rose-50 text-rose-600' },
                { id: 'PROF_EMERGENCY', label: 'Cấp cứu', icon: Activity, desc: 'Giám sát chế độ cấp cứu và xe tiêm cấp cứu', color: 'bg-cyan-50 text-cyan-600' },
                { id: 'PROF_ADMISSION', label: 'Ra,vào viện/CK, CV', icon: DoorOpen, desc: 'Giám sát chế độ vào viện, chuyển khoa, ra viện', color: 'bg-indigo-50 text-indigo-600' },
                { id: 'GENERAL', label: 'Giám sát chung', icon: ClipboardCheck, desc: 'Giám sát các nội dung chuyên môn khác', color: 'bg-emerald-50 text-emerald-600' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id as any)}
                  className="group flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:border-[#009900]/30 hover:shadow-xl hover:shadow-[#009900]/5 active:scale-[0.98] sm:flex-row sm:items-start sm:justify-start sm:gap-4 sm:p-5 sm:text-left">
                  <div className={`shrink-0 rounded-2xl p-3 shadow-sm transition-transform group-hover:scale-110 sm:p-4 ${item.color}`}>
                    <item.icon size={26} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black uppercase leading-snug text-slate-900 transition-colors group-hover:text-[#009900] sm:text-table sm:normal-case">{item.label}</h4>
                    <p className="mt-1 hidden text-xs font-medium leading-relaxed text-slate-500 sm:block">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FolderClock className="text-[#009900]" size={24} /> Lịch giám sát
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* <button
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
                  setShowScheduleModal(true);
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#009900] text-white rounded-2xl font-black uppercase text-sm shadow-lg shadow-green-900/10 hover:bg-[#0d6e39] hover:-translate-y-0.5 transition-all active:scale-95">
                <Plus size={20} /> Lên lịch giám sát mới
              </button> */}

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
                {schedules.slice(0, 5).map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:border-[#009900]/20 transition-all">
                    <div className={`p-3 rounded-xl bg-white shadow-sm shrink-0 ${s.trang_thai === 'Quá hạn' ? 'text-red-500' : 'text-[#009900]'}`}>
                      <Calendar size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-table">{s.nd_giam_sat}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                        <Users size={12} /> {s.dv_duoc_gs}
                      </div>
                      <p className={`text-[10px] font-black uppercase mt-2 ${s.trang_thai === 'Quá hạn' ? 'text-red-600' : 'text-[#009900]'}`}>
                        📅 {formatDate(s.tu_ngay || '')} - {formatDate(s.den_ngay || '')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="w-full py-3 text-sm font-black text-[#009900] hover:bg-green-50 rounded-xl transition-all uppercase tracking-widest">
                Xem tất cả lịch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lịch giám sát */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Calendar className="text-[#009900]" size={24} /> Quản lý tất cả lịch giám sát
              </h2>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto">
              {/* Filter bar and list within modal */}
              <div className="mb-6 flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {['all', 'today', 'thisWeek', 'thisMonth'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activityFilter === f ? 'bg-black text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                    {f === 'all' ? 'Tất cả' : f === 'today' ? 'Hôm nay' : f === 'thisWeek' ? 'Tuần này' : 'Tháng này'}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="table-standardized">
                  <thead>
                    <tr>
                      <th>Từ ngày</th>
                      <th>Đến ngày</th>
                      <th>Nội dung</th>
                      <th>Người GS</th>
                      <th>Đơn vị</th>
                      <th>Trạng thái</th>
                      {isAdmin && <th className="text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.map((schedule) => {
                      return (
                        <tr key={schedule.id} className="hover:bg-slate-50 text-table text-black">
                          <td className="p-3">{formatDate(schedule.tu_ngay || '')}</td>
                          <td className="p-3">{formatDate(schedule.den_ngay || '')}</td>
                          <td className="p-3 font-bold">{schedule.nd_giam_sat || '---'}</td>
                          <td className="p-3">{schedule.nhan_vien_gs || '---'}</td>
                          <td className="p-3">{schedule.dv_duoc_gs || '---'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[12px] font-normal ${schedule.trang_thai === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                              schedule.trang_thai === 'Đang thực hiện' ? 'bg-blue-100 text-blue-700' :
                                schedule.trang_thai === 'Quá hạn' ? 'bg-red-100 text-red-700' :
                                  'bg-slate-100 text-slate-700'
                              }`}>
                              {schedule.trang_thai || 'Chưa thực hiện'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-right">
                              <div className="flex gap-2 justify-end">
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
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                  title="Sửa">
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(schedule.id!)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Xóa">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Form thêm/sửa ngay trong modal */}
              {isAdmin && (editingSchedule !== null || scheduleForm.nd_giam_sat !== '' || scheduleForm.tu_ngay !== '') && (
                <div className="mt-8 p-8 bg-slate-50 rounded-3xl border border-slate-200">
                  <h3 className="text-sm font-black text-black uppercase mb-6 tracking-widest flex items-center gap-2">
                    {editingSchedule ? <Edit2 size={18} className="text-blue-600" /> : <Plus size={18} className="text-[#009900]" />}
                    {editingSchedule ? 'Chỉnh sửa lịch' : 'Thêm lịch giám sát mới'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Từ ngày</label>
                      <input type="date" value={scheduleForm.tu_ngay} onChange={(e) => setScheduleForm({ ...scheduleForm, tu_ngay: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đến ngày</label>
                      <input type="date" value={scheduleForm.den_ngay} onChange={(e) => setScheduleForm({ ...scheduleForm, den_ngay: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</label>
                      <select value={scheduleForm.trang_thai} onChange={(e) => setScheduleForm({ ...scheduleForm, trang_thai: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                        <option value="Chưa thực hiện">Chưa thực hiện</option>
                        <option value="Đang thực hiện">Đang thực hiện</option>
                        <option value="Đã hoàn thành">Đã hoàn thành</option>
                        <option value="Quá hạn">Quá hạn</option>
                      </select>
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung giám sát</label>
                        <input type="text" value={scheduleForm.nd_giam_sat} onChange={(e) => setScheduleForm({ ...scheduleForm, nd_giam_sat: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" placeholder="Nội dung gì?" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhân viên GS</label>
                        <select value={scheduleForm.nhan_vien_gs} onChange={(e) => setScheduleForm({ ...scheduleForm, nhan_vien_gs: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                          <option value="">-- Chọn nhân viên --</option>
                          {usersList.map((u, i) => <option key={i} value={u.full_name}>{u.full_name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị được GS</label>
                        <select value={scheduleForm.dv_duoc_gs} onChange={(e) => setScheduleForm({ ...scheduleForm, dv_duoc_gs: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                          <option value="">-- Chọn đơn vị --</option>
                          {donViList.map((dv, i) => <option key={i} value={`${dv.ma_don_vi} - ${dv.ten_don_vi}`}>{dv.ma_don_vi} - {dv.ten_don_vi}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-8">
                    <button
                      onClick={() => {
                        setEditingSchedule(null);
                        setScheduleForm({ tu_ngay: '', den_ngay: '', nd_giam_sat: '', nhan_vien_gs: '', dv_duoc_gs: '', trang_thai: 'Chưa thực hiện' });
                      }}
                      className="px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900 transition-all">
                      Hủy bỏ
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          if (editingSchedule) await updateLichGiamSat(editingSchedule.id!, scheduleForm);
                          else await addLichGiamSat({ ...scheduleForm, nguoi_tao: user?.full_name || 'Hệ thống' });
                          setEditingSchedule(null);
                          setScheduleForm({ tu_ngay: '', den_ngay: '', nd_giam_sat: '', nhan_vien_gs: '', dv_duoc_gs: '', trang_thai: 'Chưa thực hiện' });
                          loadData();
                        } catch (err) {
                          alert('Lỗi: ' + (err as Error).message);
                        }
                      }}
                      className="px-10 py-3 bg-[#009900] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/10 hover:bg-[#0d6e39] transition-all active:scale-95">
                      {editingSchedule ? 'Cập nhật lịch' : 'Lưu lịch mới'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa lịch giám sát"
        message="Bạn có chắc chắn muốn xóa lịch giám sát này không? Thao tác này không thể hoàn tác."
        isLoading={isDeleting}
      />
    </div>
  );
};
