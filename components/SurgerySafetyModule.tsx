import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye, Calendar, Building2,
  Users, CheckCircle2, AlertTriangle, XCircle, FileText,
  X, LayoutDashboard, List, Filter, RotateCcw, Stethoscope,
  ClipboardCheck, Clock, UserCheck, ShieldCheck, BarChart3,
  TrendingUp, BarChart, ArrowLeft, Activity, LogOut, Save, Percent, Check
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { SurgerySafety } from '../types';
import { fetchSurgerySafety, addSurgerySafety, updateSurgerySafety, deleteSurgerySafety } from '../readSurgerySafety';
import { fetchDmDonVi, DmDonVi } from '../readDmDonVi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const CRITERIA = [
  { id: 'tc1_xac_nhan_danh_tinh', section: 'I', stage: 'SIGN IN', label: 'Xác nhận danh tính người bệnh: Họ tên, ngày sinh, mã số người bệnh.', role: 'BS gây mê, ĐD, Người bệnh' },
  { id: 'tc2_xac_nhan_vi_tri', section: 'I', stage: 'SIGN IN', label: 'Xác nhận vị trí phẫu thuật: Đã được đánh dấu bằng mũi tên hướng vào vùng mổ (không dùng dấu X).', role: 'Phẫu thuật viên chính' },
  { id: 'tc3_cam_ket_phau_thuat', section: 'I', stage: 'SIGN IN', label: 'Cam kết phẫu thuật: Đã ký đủ chữ ký của phẫu thuật viên, BS gây mê và người bệnh/người đại diện.', role: 'Điều dưỡng dụng cụ' },
  { id: 'tc4_kiem_tra_thiet_bi', section: 'I', stage: 'SIGN IN', label: 'Kiểm tra thiết bị & thuốc: Máy mê, máy theo dõi, nguồn oxy dự phòng, thuốc cấp cứu.', role: 'Bác sĩ gây mê' },
  { id: 'tc5_danh_gia_nguy_co', section: 'I', stage: 'SIGN IN', label: 'Đánh giá nguy cơ: Kiểm soát đường thở, nguy cơ mất máu (>500ml), tiền sử dị ứng thuốc.', role: 'Bác sĩ gây mê' },
  { id: 'tc6_gioi_thieu_nhan_su', section: 'II', stage: 'TIME OUT', label: 'Giới thiệu nhân sự: Từng thành viên trong ê-kíp giới thiệu tên và vai trò.', role: 'Cả kíp phẫu thuật' },
  { id: 'tc7_xac_nhan_lan_cuoi', section: 'II', stage: 'TIME OUT', label: 'Xác nhận lại lần cuối: Đúng người bệnh, đúng vị trí và đúng phương pháp phẫu thuật', role: 'Phẫu thuật viên chính' },
  { id: 'tc8_du_phong_nhiem_khuan', section: 'II', stage: 'TIME OUT', label: 'Dự phòng nhiễm khuẩn: Đã tiêm kháng sinh dự phòng trong vòng 60 phút trước đó (nếu có chỉ định).', role: 'Bác sĩ gây mê' },
  { id: 'tc9_cac_van_de_phat_sinh', section: 'II', stage: 'TIME OUT', label: 'Các vấn đề phát sinh: Phẫu thuật viên, bác sĩ gây mê và điều dưỡng trao đổi về các nguy cơ đột biến có thể xảy ra.', role: 'Cả kíp phẫu thuật' },
  { id: 'tc10_kiem_dem_dung_cu', section: 'III', stage: 'SIGN OUT', label: 'Kiểm đếm dụng cụ: Xác nhận đã kiểm đếm đủ gạc, dụng cụ phẫu thuật, vật tư tiêu hao.', role: 'Điều dưỡng dụng cụ' },
  { id: 'tc11_mau_benh_pham', section: 'III', stage: 'SIGN OUT', label: 'Mẫu bệnh phẩm: Đã dán nhãn chính xác thông tin người bệnh và loại bệnh phẩm.', role: 'Phẫu thuật viên' },
  { id: 'tc12_ghi_chep_ho_so', section: 'III', stage: 'SIGN OUT', label: 'Ghi chép hồ sơ: Hoàn thiện biên bản phẫu thuật, các tai biến phát sinh (nếu có).', role: 'Phẫu thuật viên' },
  { id: 'tc13_ban_giao_hoi_tinh', section: 'III', stage: 'SIGN OUT', label: 'Bàn giao hồi tỉnh: Các lưu ý đặc biệt về chăm sóc và theo dõi sau mổ.', role: 'Bác sĩ gây mê' },
];

export const SurgerySafetyModule: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [data, setData] = useState<SurgerySafety[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DmDonVi[]>([]);
  const { user } = useAuth();

  const [editingItem, setEditingItem] = useState<SurgerySafety | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DANH_SACH' | 'REPORT'>('OVERVIEW');
  const [showFilters, setShowFilters] = useState(false);
  const [filterConfig, setFilterConfig] = useState({
    timeRange: 'Tháng này',
    fromDate: '',
    toDate: '',
    department: 'Tất cả',
    orTable: 'Tất cả'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [atptData, dmData] = await Promise.all([
        fetchSurgerySafety(),
        fetchDmDonVi()
      ]);
      setData(atptData);
      setDepartments(dmData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const departmentList = useMemo(() => departments.map(d => d.ten_don_vi).filter(Boolean), [departments]);
  const orTableList = useMemo(() => {
    const list = data.map(item => item.ban_mo_so).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchDept = filterConfig.department === 'Tất cả' || item.khoa_phau_thuat === filterConfig.department;
      const matchOR = filterConfig.orTable === 'Tất cả' || item.ban_mo_so === filterConfig.orTable;

      let matchTime = true;
      const itemDate = new Date(item.ngay_giam_sat);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterConfig.timeRange === 'Hôm nay') {
        matchTime = itemDate >= today;
      } else if (filterConfig.timeRange === 'Tuần này') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        matchTime = itemDate >= startOfWeek;
      } else if (filterConfig.timeRange === 'Tháng này') {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        matchTime = itemDate >= startOfMonth;
      } else if (filterConfig.timeRange === 'Quý này') {
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        matchTime = itemDate >= startOfQuarter;
      } else if (filterConfig.timeRange === 'Năm này') {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        matchTime = itemDate >= startOfYear;
      } else if (filterConfig.timeRange === 'Tùy chọn') {
        const matchFromDate = !filterConfig.fromDate || item.ngay_giam_sat >= filterConfig.fromDate;
        const matchToDate = !filterConfig.toDate || item.ngay_giam_sat <= filterConfig.toDate;
        matchTime = matchFromDate && matchToDate;
      }

      return matchDept && matchOR && matchTime;
    });
  }, [data, filterConfig]);

  const exportToExcel = () => {
    try {
      if (activeTab === 'REPORT') {
        const groups: Record<string, any> = {};
        filteredData.forEach(item => {
          const dept = item.khoa_phau_thuat || 'Chưa xác định';
          if (!groups[dept]) groups[dept] = { dept, total: 0, pass100: 0, errors: {} };
          groups[dept].total++;
          if (Number(item.ty_le_tuan_thu) >= 100) groups[dept].pass100++;
          else {
            CRITERIA.forEach(c => {
              if (!item[c.id as keyof SurgerySafety]) {
                groups[dept].errors[c.label] = (groups[dept].errors[c.label] || 0) + 1;
              }
            });
          }
        });

        const reportRows = Object.values(groups).map((g: any) => [
          g.dept,
          g.total,
          g.pass100,
          ((g.pass100 / g.total) * 100).toFixed(1) + '%',
          Object.entries(g.errors)
            .sort((a: any, b: any) => b[1] - a[1])
            .map(([err, count]) => `- ${err} (x${count})`)
            .join('\n')
        ]);

        const title = "TỔNG HỢP GIÁM SÁT AN TOÀN PHẪU THUẬT";
        const dateStr = filterConfig.timeRange === 'Tùy chọn'
          ? `Từ ngày ${filterConfig.fromDate || '...'} đến ngày ${filterConfig.toDate || '...'}`
          : `Kỳ báo cáo: ${filterConfig.timeRange}`;

        const wsData = [
          [title],
          [dateStr],
          [],
          ['Khoa lâm sàng', 'Số ca giám sát (A)', 'Số ca đạt 100% (B)', 'Tỷ lệ % (B/A)', 'Lỗi thường gặp nhất']
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.sheet_add_aoa(ws, reportRows, { origin: 'A5' });

        ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 60 }];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TongHop");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, `GiamSatATPT_TongHop_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Xuất file thất bại.");
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-8rem)]">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-slate-100/50 p-1.5 gap-1 rounded-[28px] border border-slate-200/50 shrink-0">
            <TabButton
              active={activeTab === 'OVERVIEW'}
              onClick={() => { setActiveTab('OVERVIEW'); setViewMode('LIST'); }}
              icon={LayoutDashboard}
              label="Tổng quan"
            />
            <TabButton
              active={activeTab === 'DANH_SACH'}
              onClick={() => { setActiveTab('DANH_SACH'); setViewMode('LIST'); }}
              icon={List}
              label="Danh sách"
            />
            <TabButton
              active={activeTab === 'REPORT'}
              onClick={() => { setActiveTab('REPORT'); setViewMode('LIST'); }}
              icon={BarChart3}
              label="Tổng hợp"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'REPORT' && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                <FileText size={18} /> <span className="hidden md:inline">Xuất Excel</span>
              </button>
            )}
            {viewMode === 'LIST' && (
              <button
                onClick={() => { setEditingItem(null); setActiveTab('DANH_SACH'); setViewMode('FORM'); }}
                className="flex items-center gap-2 bg-[#059669] hover:bg-[#0d6e39] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-green-200 active:scale-95"
              >
                <Plus size={18} /> Thêm giám sát mới
              </button>
            )}
          </div>
        </div>

        <div className="p-4 lg:p-4 pt-0 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Thời gian</label>
              <select
                value={filterConfig.timeRange}
                onChange={e => setFilterConfig({ ...filterConfig, timeRange: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#059669]/10 focus:ring-4 transition-all"
              >
                {['Hôm nay', 'Tuần này', 'Tháng này', 'Quý này', 'Năm này', 'Tùy chọn'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {filterConfig.timeRange === 'Tùy chọn' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Từ ngày</label>
                  <input
                    type="date"
                    value={filterConfig.fromDate}
                    onChange={e => setFilterConfig({ ...filterConfig, fromDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#059669]/10 focus:ring-4 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Đến ngày</label>
                  <input
                    type="date"
                    value={filterConfig.toDate}
                    onChange={e => setFilterConfig({ ...filterConfig, toDate: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#059669]/10 focus:ring-4 transition-all"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Khoa</label>
              <select
                value={filterConfig.department}
                onChange={e => setFilterConfig({ ...filterConfig, department: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#059669]/10 focus:ring-4 transition-all"
              >
                <option value="Tất cả">Tất cả khoa</option>
                {departmentList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phòng mổ</label>
              <select
                value={filterConfig.orTable}
                onChange={e => setFilterConfig({ ...filterConfig, orTable: e.target.value })}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none ring-[#059669]/10 focus:ring-4 transition-all"
              >
                <option value="Tất cả">Tất cả phòng</option>
                {orTableList.map(or => (
                  <option key={or} value={or}>Bàn mổ {or}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-[#059669] border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold">Lỗi: {error}</div>
        ) : activeTab === 'OVERVIEW' ? (
          <SurgeryOverview data={filteredData} />
        ) : activeTab === 'REPORT' ? (
          <SurgeryReport data={filteredData} />
        ) : viewMode === 'LIST' ? (
          <SurgeryList
            data={filteredData}
            onView={(item: SurgerySafety) => { setEditingItem(item); setViewMode('DETAIL'); }}
            onEdit={(item: SurgerySafety) => { setEditingItem(item); setViewMode('FORM'); }}
            onDelete={async (id: string) => {
              if (window.confirm('Bạn có chắc muốn xóa bản ghi này?')) {
                await deleteSurgerySafety(id);
                loadData();
              }
            }}
          />
        ) : viewMode === 'DETAIL' && editingItem ? (
          <SurgerySafetyDetailView
            item={editingItem}
            currentUser={user}
            onClose={() => setViewMode('LIST')}
            onEdit={() => setViewMode('FORM')}
            onDelete={async () => {
              if (window.confirm('Bạn có chắc muốn xóa bản ghi này?')) {
                await deleteSurgerySafety(editingItem.id!);
                setViewMode('LIST');
                loadData();
              }
            }}
          />
        ) : (
          <SurgerySafetyFormView
            item={editingItem}
            onClose={() => setViewMode('LIST')}
            onSaved={() => { setViewMode('LIST'); loadData(); }}
            currentUser={user}
            departmentList={departmentList}
          />
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`supervision-tab-button flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active
      ? 'bg-white text-[#059669] shadow-lg shadow-green-100 border border-green-50'
      : 'text-slate-400 hover:text-slate-600'
      }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const SurgeryOverview = ({ data }: { data: SurgerySafety[] }) => {
  const stats = useMemo(() => {
    const total = data.length;
    if (total === 0) return { total: 0, complianceRate: 0, signInRate: 0, timeOutRate: 0, signOutRate: 0 };

    let totalSignInPass = 0;
    let totalTimeOutPass = 0;
    let totalSignOutPass = 0;

    data.forEach(d => {
      // Stage 1: tc1 - tc5 (5 items)
      if (d.tc1_xac_nhan_danh_tinh) totalSignInPass++;
      if (d.tc2_xac_nhan_vi_tri) totalSignInPass++;
      if (d.tc3_cam_ket_phau_thuat) totalSignInPass++;
      if (d.tc4_kiem_tra_thiet_bi) totalSignInPass++;
      if (d.tc5_danh_gia_nguy_co) totalSignInPass++;

      // Stage 2: tc6 - tc9 (4 items)
      if (d.tc6_gioi_thieu_nhan_su) totalTimeOutPass++;
      if (d.tc7_xac_nhan_lan_cuoi) totalTimeOutPass++;
      if (d.tc8_du_phong_nhiem_khuan) totalTimeOutPass++;
      if (d.tc9_cac_van_de_phat_sinh) totalTimeOutPass++;

      // Stage 3: tc10 - tc13 (4 items)
      if (d.tc10_kiem_dem_dung_cu) totalSignOutPass++;
      if (d.tc11_mau_benh_pham) totalSignOutPass++;
      if (d.tc12_ghi_chep_ho_so) totalSignOutPass++;
      if (d.tc13_ban_giao_hoi_tinh) totalSignOutPass++;
    });

    const avgCompliance = data.reduce((acc, curr) => acc + (Number(curr.ty_le_tuan_thu) || 0), 0) / total;

    return {
      total,
      complianceRate: avgCompliance,
      signInRate: (totalSignInPass / (5 * total)) * 100,
      timeOutRate: (totalTimeOutPass / (4 * total)) * 100,
      signOutRate: (totalSignOutPass / (4 * total)) * 100,
    };
  }, [data]);

  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    // Group by Date for trend
    const dayMap: Record<string, { date: string, count: number, pass: number }> = {};

    // Determine date range for aggregation
    data.forEach(item => {
      const d = new Date(item.ngay_giam_sat);
      const key = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (!dayMap[key]) {
        dayMap[key] = { date: key, count: 0, pass: 0 };
      }
      dayMap[key].count++;
      if (Number(item.ty_le_tuan_thu) >= 100) {
        dayMap[key].pass++;
      }
    });

    return Object.values(dayMap).sort((a, b) => {
      const [d1, m1] = a.date.split('/');
      const [d2, m2] = b.date.split('/');
      return new Date(2026, Number(m1) - 1, Number(d1)).getTime() - new Date(2026, Number(m2) - 1, Number(d2)).getTime();
    }).map(d => ({
      ...d,
      rate: Number(((d.pass / d.count) * 100).toFixed(1))
    }));
  }, [data]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5 sm:gap-3 max-w-5xl">
        <div className="col-span-3 lg:col-span-1">
          <StatCard icon={<Stethoscope size={24} />} label="Tổng số ca" value={stats.total} color="slate" />
        </div>
        <div className="col-span-3 lg:col-span-1">
          <StatCard icon={<CheckCircle2 size={24} />} label="Tỷ lệ tuân thủ" value={`${stats.complianceRate.toFixed(1)}%`} color="green" />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={<Clock size={20} />} label="Sign In đạt" value={`${stats.signInRate.toFixed(1)}%`} color="indigo" />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={<Clock size={20} />} label="Time Out đạt" value={`${stats.timeOutRate.toFixed(1)}%`} color="amber" />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <StatCard icon={<ClipboardCheck size={20} />} label="Sign Out đạt" value={`${stats.signOutRate.toFixed(1)}%`} color="blue" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend Chart */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              Xu hướng tỷ lệ tuân thủ (%)
            </h3>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#059669"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Tỷ lệ đạt (%)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Volume Chart */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <BarChart size={18} className="text-[#059669]" />
              Số ca giám sát (Ca)
            </h3>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Bar
                  dataKey="count"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  name="Số ca giám sát"
                  opacity={0.8}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate === 100 ? '#059669' : '#4ade80'} />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  name="Xu hướng"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-600',
    green: 'bg-green-50 text-[#059669]',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };
  return (
    <div className="bg-white p-2 sm:p-3 rounded-[20px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start lg:items-center text-center sm:text-left gap-1 sm:gap-2 h-full min-w-0">
      <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 16, className: "sm:w-5 sm:h-5" })}
      </div>
      <div className="min-w-0 w-full overflow-hidden">
        <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-tight sm:tracking-widest leading-tight truncate sm:whitespace-normal">{label}</p>
        <h3 className="text-[10px] sm:text-sm font-black text-slate-800 tracking-tight truncate">{value}</h3>
      </div>
    </div>
  );
};

const SurgeryReport = ({ data }: { data: SurgerySafety[] }) => {
  const reportData = useMemo(() => {
    const groups: Record<string, { a: number, b: number, errors: Record<string, number> }> = {};

    data.forEach(item => {
      const dept = item.khoa_phau_thuat || 'Chưa xác định';
      if (!groups[dept]) groups[dept] = { a: 0, b: 0, errors: {} };

      groups[dept].a++;
      if (Number(item.ty_le_tuan_thu) >= 100) {
        groups[dept].b++;
      } else {
        // Find failed criteria
        CRITERIA.forEach(c => {
          if (!item[c.id as keyof SurgerySafety]) {
            groups[dept].errors[c.label] = (groups[dept].errors[c.label] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(groups).map(([dept, stats]) => {
      // Find all errors, sorted by frequency
      const allErrors = Object.entries(stats.errors)
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count }));

      return {
        department: dept,
        a: stats.a,
        b: stats.b,
        rate: stats.a > 0 ? (stats.b / stats.a) * 100 : 0,
        errors: allErrors
      };
    }).sort((a, b) => a.department.localeCompare(b.department));
  }, [data]);

  const totals = useMemo(() => {
    const a = reportData.reduce((acc, curr) => acc + curr.a, 0);
    const b = reportData.reduce((acc, curr) => acc + curr.b, 0);
    return {
      a,
      b,
      rate: a > 0 ? (b / a) * 100 : 0
    };
  }, [reportData]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <h2 className="text-main-title font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <FileText className="text-[#059669]" size={18} />
          Phiếu tổng hợp chỉ số giám sát
        </h2>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr>
              <th className="p-6">Khoa lâm sàng</th>
              <th className="p-6 text-center">Số ca giám sát (A)</th>
              <th className="p-6 text-center">Số ca đạt 100% (B)</th>
              <th className="p-6 text-center">Tỷ lệ % (B/A)</th>
              <th className="p-6">Lỗi thường gặp nhất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reportData.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-6 text-table font-normal text-slate-700">{row.department}</td>
                <td className="p-6 text-center text-table font-normal text-slate-600">{row.a}</td>
                <td className="p-6 text-center text-table font-normal text-slate-600">{row.b}</td>
                <td className="p-6 text-center">
                  <span className={`text-table font-normal ${row.rate >= 100 ? 'text-[#059669]' : 'text-amber-600'}`}>
                    {row.rate.toFixed(1)}%
                  </span>
                </td>
                <td className="p-6 text-[12pt] text-slate-900 border-l border-slate-100">
                  {row.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {row.errors.map((err, i) => (
                        <li key={i} className="text-[12pt] text-slate-900 font-bold italic leading-tight flex items-start gap-1">
                          <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-slate-900" />
                          {err.label} {err.count > 1 && <span className="text-[11pt] bg-slate-100 px-1 rounded not-italic font-black">x{err.count}</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic">---</span>
                  )}
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic text-sm">Không có dữ liệu tổng hợp</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#059669] text-white font-black">
            <tr>
              <td className="p-6 text-table uppercase tracking-widest">Toàn viện</td>
              <td className="p-6 text-center text-table">{totals.a}</td>
              <td className="p-6 text-center text-table">{totals.b}</td>
              <td className="p-6 text-center text-table text-[#00ff00]">{totals.rate.toFixed(1)}%</td>
              <td className="p-6"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-slate-100">
        {reportData.map((row, idx) => (
          <div key={idx} className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 uppercase">{row.department}</h3>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tỷ lệ đạt</p>
                <span className={`text-lg font-black ${row.rate >= 100 ? 'text-[#059669]' : 'text-amber-600'}`}>
                  {row.rate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng ca (A)</p>
                  <p className="text-xs font-black text-slate-600">{row.a}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Đạt (B)</p>
                  <p className="text-xs font-black text-slate-600">{row.b}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Mobile Total Row */}
        <div className="p-4 bg-[#059669] text-white space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest">Toàn viện</span>
            <span className="text-lg font-black">{totals.rate.toFixed(1)}%</span>
          </div>
          <div className="flex gap-6 text-[10px] font-bold opacity-90 uppercase tracking-widest">
            <span>Tổng (A): {totals.a}</span>
            <span>Đạt (B): {totals.b}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SurgeryList = ({ data, onView, onEdit, onDelete }: {
  data: SurgerySafety[],
  onView: (item: SurgerySafety) => void,
  onEdit: (item: SurgerySafety) => void,
  onDelete: (id: string) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const filtered = data.filter((item: SurgerySafety) =>
    item.ho_ten_nguoi_benh.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.khoa_phau_thuat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm NB, khoa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-green-500/10 transition-all"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="table-standardized">
          <thead>
            <tr>
              <th className="p-6">Ngày</th>
              <th className="p-6">Khoa</th>
              <th className="p-6">Bệnh nhân</th>
              <th className="p-6">Phòng mổ</th>
              <th className="p-6 text-center">Tỷ lệ</th>
              <th className="p-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item: SurgerySafety) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-6 text-table font-normal text-slate-700">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</td>
                <td className="p-6 text-table font-normal text-slate-600">{item.khoa_phau_thuat}</td>
                <td className="p-6 text-table font-normal text-slate-800 uppercase">{item.ho_ten_nguoi_benh}</td>
                <td className="p-6 text-table font-normal text-slate-600">Bàn {item.ban_mo_so}</td>
                <td className="p-6 text-center">
                  <span className={`text-table font-normal ${Number(item.ty_le_tuan_thu) >= 100 ? 'text-[#059669]' : 'text-amber-600'}`}>
                    {Number(item.ty_le_tuan_thu).toFixed(0)}%
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onView(item)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-1 text-[10px] font-bold px-3 uppercase"><Eye size={14} /> Chi tiết</button>
                    {(isAdmin || item.nguoi_giam_sat === user?.full_name) && (
                      <button onClick={() => onEdit(item)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-100"><Edit2 size={16} /></button>
                    )}
                    {isAdmin && (
                      <button onClick={() => onDelete(item.id!)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100"><Trash2 size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden grid grid-cols-1 divide-y divide-slate-100">
        {filtered.map((item: SurgerySafety) => (
          <div key={item.id} className="p-4 space-y-4 hover:bg-slate-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')}</p>
                <p className="text-sm font-black text-slate-800 uppercase leading-snug">{item.ho_ten_nguoi_benh}</p>
                <p className="text-xs font-bold text-slate-500">{item.khoa_phau_thuat}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Bàn mổ {item.ban_mo_so}</p>
                <div className="pt-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${Number(item.ty_le_tuan_thu) >= 100 ? 'bg-green-100 text-[#059669]' : 'bg-amber-100 text-amber-600'}`}>
                    {Number(item.ty_le_tuan_thu).toFixed(0)}% Đạt
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <button
                onClick={() => onView(item)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest"
              >
                <Eye size={14} /> Xem
              </button>
              {(isAdmin || item.nguoi_giam_sat === user?.full_name) && (
                <button
                  onClick={() => onEdit(item)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest"
                >
                  <Edit2 size={14} /> Sửa
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => onDelete(item.id!)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SurgerySafetyFormView = ({ item, onClose, onSaved, currentUser, departmentList }: {
  item: SurgerySafety | null,
  onClose: () => void,
  onSaved: () => void,
  currentUser: any,
  departmentList: string[]
}) => {
  const [formData, setFormData] = useState<SurgerySafety>({
    ngay_giam_sat: item?.ngay_giam_sat || new Date().toISOString().split('T')[0],
    nguoi_giam_sat: item?.nguoi_giam_sat || currentUser?.full_name || '',
    ban_mo_so: item?.ban_mo_so || '',
    khoa_phau_thuat: item?.khoa_phau_thuat || '',
    ho_ten_nguoi_benh: item?.ho_ten_nguoi_benh || '',
    kip_phau_thuat: item?.kip_phau_thuat || '',
    ghi_chu_chung: item?.ghi_chu_chung || '',
    tc1_xac_nhan_danh_tinh: item?.tc1_xac_nhan_danh_tinh ?? null,
    tc2_xac_nhan_vi_tri: item?.tc2_xac_nhan_vi_tri ?? null,
    tc3_cam_ket_phau_thuat: item?.tc3_cam_ket_phau_thuat ?? null,
    tc4_kiem_tra_thiet_bi: item?.tc4_kiem_tra_thiet_bi ?? null,
    tc5_danh_gia_nguy_co: item?.tc5_danh_gia_nguy_co ?? null,
    tc6_gioi_thieu_nhan_su: item?.tc6_gioi_thieu_nhan_su ?? null,
    tc7_xac_nhan_lan_cuoi: item?.tc7_xac_nhan_lan_cuoi ?? null,
    tc8_du_phong_nhiem_khuan: item?.tc8_du_phong_nhiem_khuan ?? null,
    tc9_cac_van_de_phat_sinh: item?.tc9_cac_van_de_phat_sinh ?? null,
    tc10_kiem_dem_dung_cu: item?.tc10_kiem_dem_dung_cu ?? null,
    tc11_mau_benh_pham: item?.tc11_mau_benh_pham ?? null,
    tc12_ghi_chep_ho_so: item?.tc12_ghi_chep_ho_so ?? null,
    tc13_ban_giao_hoi_tinh: item?.tc13_ban_giao_hoi_tinh ?? null,
    tong_dat: item?.tong_dat || 0,
    ty_le_tuan_thu: item?.ty_le_tuan_thu || 0,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ids = CRITERIA.map(c => c.id) as (keyof SurgerySafety)[];
    const count = ids.filter(id => formData[id] === true).length;
    const rate = (count / CRITERIA.length) * 100;
    setFormData((prev: SurgerySafety) => ({ ...prev, tong_dat: count, ty_le_tuan_thu: rate }));
  }, [
    formData.tc1_xac_nhan_danh_tinh, formData.tc2_xac_nhan_vi_tri, formData.tc3_cam_ket_phau_thuat,
    formData.tc4_kiem_tra_thiet_bi, formData.tc5_danh_gia_nguy_co, formData.tc6_gioi_thieu_nhan_su,
    formData.tc7_xac_nhan_lan_cuoi, formData.tc8_du_phong_nhiem_khuan, formData.tc9_cac_van_de_phat_sinh,
    formData.tc10_kiem_dem_dung_cu, formData.tc11_mau_benh_pham, formData.tc12_ghi_chep_ho_so,
    formData.tc13_ban_giao_hoi_tinh
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Check if all criteria are answered
    const unanswered = CRITERIA.some(c => formData[c.id as keyof SurgerySafety] === null);
    if (unanswered) {
      alert("Vui lòng hoàn thành đánh giá Đạt/Không đạt cho tất cả 13 tiêu chí.");
      setSaving(false);
      return;
    }

    const dataToSend: any = {
      ngay_giam_sat: formData.ngay_giam_sat,
      nguoi_giam_sat: formData.nguoi_giam_sat,
      ban_mo_so: formData.ban_mo_so,
      khoa_phau_thuat: formData.khoa_phau_thuat,
      ho_ten_nguoi_benh: formData.ho_ten_nguoi_benh,
      kip_phau_thuat: formData.kip_phau_thuat,
      ghi_chu_chung: formData.ghi_chu_chung,
      tong_dat: formData.tong_dat,
      ty_le_tuan_thu: formData.ty_le_tuan_thu,
    };

    CRITERIA.forEach(c => {
      dataToSend[c.id] = (formData as any)[c.id] ?? false;
    });

    try {
      if (item?.id) await updateSurgerySafety(item.id, dataToSend);
      else await addSurgerySafety(dataToSend);
      onSaved();
    } catch (err: any) {
      console.error('Error saving surgery safety:', err);
      alert('Lỗi khi lưu dữ liệu: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, color }: { icon: any, title: string, color: string }) => (
    <div className={`flex items-center gap-2 p-3 ${color} text-white rounded-t-xl font-bold uppercase text-[10px] tracking-wider shadow-sm`}>
      <Icon size={14} />
      {title}
    </div>
  );

  const CriteriaItem = ({ criteria, formData, setFormData }: { criteria: any, formData: SurgerySafety, setFormData: any }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col gap-3 transition-all hover:border-indigo-100 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold leading-tight text-slate-700">{criteria.label}</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic mt-0.5">Xác nhận: {criteria.role}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFormData((prev: any) => ({ ...prev, [criteria.id]: true }))}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${formData[criteria.id as keyof SurgerySafety] === true
            ? 'bg-emerald-600 text-white border-transparent shadow-md'
            : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
            }`}
        >
          <Check size={14} strokeWidth={3} /> Đạt
        </button>
        <button
          type="button"
          onClick={() => setFormData((prev: any) => ({ ...prev, [criteria.id]: false }))}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${formData[criteria.id as keyof SurgerySafety] === false
            ? 'bg-red-600 text-white border-transparent shadow-md'
            : 'bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-600'
            }`}
        >
          <X size={14} strokeWidth={3} /> K.Đạt
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white animate-in fade-in duration-500">
      <div className="w-full flex flex-col h-full">

        {/* Main Header - Premium Green Layout */}
        <div className="bg-[#059669] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck size={160} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95 border border-white/10"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight leading-tight max-w-2xl">
                  BẢNG KIỂM GIÁM SÁT TUÂN THỦ BẢNG KIỂM ATPT
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] italic">An toàn Phẫu thuật WHO</span>
                  <div className="w-1 h-1 bg-white/40 rounded-full" />
                  <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Audit Tool</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 px-8 py-3 rounded-3xl backdrop-blur-md border border-white/20 text-center min-w-[160px] shadow-2xl">
              <p className="text-[10px] uppercase font-black text-white/70 tracking-widest leading-none mb-1">Tỷ lệ tuân thủ</p>
              <p className="text-4xl font-black italic">{formData.ty_le_tuan_thu.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">

          {/* Administrative Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-[32px] border border-slate-200 shadow-inner">
            <FormField label="Ngày giám sát" icon={<Calendar size={18} />}>
              <input
                type="date" required
                className="w-full p-3.5 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold transition bg-white"
                value={formData.ngay_giam_sat}
                onChange={(e) => setFormData({ ...formData, ngay_giam_sat: e.target.value })}
              />
            </FormField>
            <FormField label="Người giám sát" icon={<UserCheck size={18} />}>
              <input
                type="text" disabled
                className="w-full p-3.5 rounded-2xl border border-slate-300 outline-none text-sm font-bold bg-slate-100 text-slate-500"
                value={formData.nguoi_giam_sat}
              />
            </FormField>
            <FormField label="Bàn mổ số" icon={<ClipboardCheck size={18} />}>
              <input
                type="text" placeholder="Số hiệu..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold transition bg-white"
                value={formData.ban_mo_so}
                onChange={(e) => setFormData({ ...formData, ban_mo_so: e.target.value })}
              />
            </FormField>
            <FormField label="Họ tên người bệnh" icon={<Users size={18} />}>
              <input
                type="text" placeholder="NGUYỄN VĂN A" required
                className="w-full p-3.5 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-black transition bg-white uppercase"
                value={formData.ho_ten_nguoi_benh}
                onChange={(e) => setFormData({ ...formData, ho_ten_nguoi_benh: e.target.value })}
              />
            </FormField>
            <FormField label="Khoa phẫu thuật" icon={<Building2 size={18} />}>
              <select
                value={formData.khoa_phau_thuat} required
                onChange={(e) => setFormData({ ...formData, khoa_phau_thuat: e.target.value })}
                className="w-full p-3.5 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold transition bg-white appearance-none"
              >
                <option value="">-- Chọn khoa --</option>
                {departmentList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Kíp phẫu thuật" icon={<Users size={18} />}>
              <input
                type="text" placeholder="BS chính, kíp gây mê..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold transition bg-white"
                value={formData.kip_phau_thuat}
                onChange={(e) => setFormData({ ...formData, kip_phau_thuat: e.target.value })}
              />
            </FormField>
          </div>

          {/* Checklist 3 Stages - Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Stage 1: SIGN IN */}
            <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader icon={Clock} title="I. TRƯỚC GÂY MÊ (SI)" color="bg-orange-500" />
              <div className="p-4 space-y-4 flex-1">
                {CRITERIA.filter(c => c.section === 'I').map(item => (
                  <CriteriaItem
                    key={item.id}
                    criteria={item}
                    formData={formData}
                    setFormData={setFormData}
                  />
                ))}
              </div>
            </div>

            {/* Stage 2: TIME OUT */}
            <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader icon={Activity} title="II. TRƯỚC RẠCH DA (TO)" color="bg-indigo-600" />
              <div className="p-4 space-y-4 flex-1">
                {CRITERIA.filter(c => c.section === 'II').map(item => (
                  <CriteriaItem
                    key={item.id}
                    criteria={item}
                    formData={formData}
                    setFormData={setFormData}
                  />
                ))}
              </div>
            </div>

            {/* Stage 3: SIGN OUT */}
            <div className="flex flex-col h-full bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader icon={LogOut} title="III. TRƯỚC RỜI PHÒNG (SO)" color="bg-emerald-600" />
              <div className="p-4 space-y-4 flex-1">
                {CRITERIA.filter(c => c.section === 'III').map(item => (
                  <CriteriaItem
                    key={item.id}
                    criteria={item}
                    formData={formData}
                    setFormData={setFormData}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Footer Info & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest pl-2">
                <AlertTriangle size={18} className="text-amber-500" /> Ghi chú đặc biệt / Kiến nghị
              </div>
              <textarea
                className="w-full p-5 rounded-[28px] border border-slate-300 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium transition h-32 shadow-inner bg-slate-50/30"
                placeholder="Nhập các sự cố hoặc lỗi quy trình quan sát được..."
                value={formData.ghi_chu_chung}
                onChange={(e) => setFormData({ ...formData, ghi_chu_chung: e.target.value })}
              />
            </div>

            <div className="flex flex-col justify-end space-y-6">
              <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Percent size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Tổng kết giám sát</p>
                    <p className="text-xl font-black italic">Tuân thủ: {formData.ty_le_tuan_thu.toFixed(1)}%</p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black transition active:scale-95 uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-500/40 border border-indigo-400/30 relative z-10 disabled:opacity-50"
                >
                  <Save size={18} className="inline mr-2" /> {saving ? 'Đang lưu...' : 'Lưu kết quả'}
                </button>
              </div>

            </div>
          </div>
        </form>

        <div className="bg-slate-50 px-8 py-5 border-t text-[9px] text-slate-400 flex justify-between uppercase tracking-[0.25em] font-black italic">
          <span></span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-200" />

          </span>
        </div>
      </div>
    </div>
  );
};

const SurgerySafetyDetailView = ({ item, currentUser, onClose, onEdit, onDelete }: {
  item: SurgerySafety,
  currentUser: any,
  onClose: () => void,
  onEdit: () => void,
  onDelete: () => void
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const isCreator = item.nguoi_giam_sat === currentUser?.full_name;

  return (
    <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-slate-200">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Actions Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-8">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all group">
            <X className="group-hover:rotate-90 transition-all duration-300" />
            <span className="text-xs font-black uppercase tracking-widest" id="close-btn">Đóng</span>
          </button>
          <div className="flex gap-3">
            {(isAdmin || isCreator) && (
              <button onClick={onEdit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center gap-2" id="edit-btn">
                <Edit2 size={16} /> Sửa bản ghi
              </button>
            )}
            {isAdmin && (
              <button onClick={onDelete} className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2" id="delete-btn">
                <Trash2 size={16} /> Xóa
              </button>
            )}
          </div>
        </div>

        {/* Traditional Form Layout */}
        <div className="text-center space-y-4">
          <h1 className="text-main-title font-bold text-slate-900 uppercase tracking-tight leading-tight">
            BẢNG KIỂM GIÁM SÁT TUÂN THỦ BẢNG KIỂM AN TOÀN PHẪU THUẬT
          </h1>
          <p className="text-slate-500 italic text-sm">(Sử dụng để giám sát đột xuất hoặc định kỳ tại phòng mổ)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-sm border-t border-b border-slate-100 py-8">
          <DetailField label="Khoa - Phòng mổ" value={`${item.khoa_phau_thuat} - Bàn ${item.ban_mo_so}`} />
          <DetailField label="Ngày giám sát" value={new Date(item.ngay_giam_sat).toLocaleDateString('vi-VN')} />
          <DetailField label="Tên người bệnh" value={item.ho_ten_nguoi_benh} uppercase />
          <DetailField label="Kíp PT" value={item.kip_phau_thuat} />
          <DetailField label="Người giám sát" value={item.nguoi_giam_sat} />
          <DetailField label="Kết quả chung" value={`Đạt ${item.tong_dat}/13 tiêu chí (${item.ty_le_tuan_thu}%)`} color={Number(item.ty_le_tuan_thu) >= 100 ? 'text-[#059669]' : 'text-amber-600'} />
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse text-[12pt]">
            <thead>
              <tr className="bg-slate-50 text-[12pt] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <th className="p-4 w-16 text-center border-r border-slate-200">STT</th>
                <th className="p-4 border-r border-slate-200">Tiêu chí giám sát</th>
                <th className="p-4 w-24 text-center border-r border-slate-200">Đạt</th>
                <th className="p-4 w-24 text-center border-r border-slate-200">Không đạt</th>
                <th className="p-4 w-48">Ghi chú/Người xác nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {['I', 'II', 'III'].map(section => (
                <React.Fragment key={section}>
                  <tr className="bg-slate-50/50">
                    <td className="p-4 text-center border-r border-slate-200 font-black text-slate-800">{section}</td>
                    <td colSpan={4} className="p-4 font-black text-slate-800 uppercase tracking-wide">
                      GIAI ĐOẠN {section === 'I' ? '1: TRƯỚC GÂY MÊ (SIGN IN)' : section === 'II' ? '2: TRƯỚC RẠCH DA (TIME OUT)' : '3: TRƯỚC KHI RỜI PHÒNG MỔ (SIGN OUT)'}
                    </td>
                  </tr>
                  {CRITERIA.filter(c => c.section === section).map((c, idx) => {
                    const isDat = item[c.id as keyof SurgerySafety] === true;
                    return (
                      <tr key={c.id}>
                        <td className="p-4 text-center border-r border-slate-200 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-4 border-r border-slate-200 font-bold text-slate-700 leading-tight">{c.label}</td>
                        <td className="p-4 text-center border-r border-slate-200">
                          {isDat && <div className="mx-auto w-6 h-6 bg-[#059669] text-white rounded-full flex items-center justify-center shadow-lg shadow-green-100"><CheckCircle2 size={14} /></div>}
                        </td>
                        <td className="p-4 text-center border-r border-slate-200">
                          {!isDat && <div className="mx-auto w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-100"><XCircle size={14} /></div>}
                        </td>
                        <td className="p-4 text-[10px] font-bold text-slate-400 uppercase leading-snug">{c.role}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DetailField = ({ label, value, uppercase, color }: { label: string, value: string, uppercase?: boolean, color?: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
    <span className={`text-[15px] font-bold ${uppercase ? 'uppercase' : ''} ${color || 'text-slate-800'}`}>{value || '---'}</span>
  </div>
);

const FormField = ({ label, icon, children }: { label: string, icon: React.ReactElement, children: React.ReactNode }) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2 transition-colors group-focus-within:text-indigo-600">
      {React.cloneElement(icon, { size: 12 } as any)}
      {label}
    </label>
    {children}
  </div>
);
