import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, AlertTriangle,
  ArrowRight, BrainCircuit, Save, X, Sparkles,
  ChevronDown, ChevronUp, CheckCircle2, AlertOctagon,
  BarChart2, PieChart as PieChartIcon, Calendar, Download, Printer,
  History, Edit2, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { fetchBaoCaoScyk, addBaoCaoScyk, updateBaoCaoScyk, deleteBaoCaoScyk, fetchLatestBaoCaoScykByYear } from '../readBaoCaoScyk';
import { useAuth } from '../contexts/AuthContext';
import { fetchDmDonVi } from '../readDmDonVi';
import { fetchNhanSuQlcl } from '../readNhanSuQlcl';

type ViewMode = 'LIST' | 'STATS' | 'FORM';

export const Incidents: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchBaoCaoScyk();
      console.log('BaoCaoScyk from Supabase:', data);
      setIncidents(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bao_cao_scyk:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute statistics from real data
  const computeStats = () => {
    const byDept: Record<string, { mild: number; moderate: number; severe: number }> = {};
    const byStatus = { 'Mới': 0, 'Đang phân tích': 0, 'Đã kết luận': 0 };

    incidents.forEach(inc => {
      const dept = inc.khoa_phong || inc.don_vi_bao_cao || 'Khác';
      if (!byDept[dept]) byDept[dept] = { mild: 0, moderate: 0, severe: 0 };

      const severity = inc.phan_loai_ban_dau || '';
      if (severity.includes('Nhóm A') || severity.includes('Nhóm B')) {
        byDept[dept].mild++;
      } else if (severity.includes('Nhóm C') || severity.includes('Nhóm D')) {
        byDept[dept].moderate++;
      } else {
        byDept[dept].severe++;
      }

      const status = inc.trang_thai || 'Mới';
      if (byStatus[status as keyof typeof byStatus] !== undefined) {
        byStatus[status as keyof typeof byStatus]++;
      }
    });

    return {
      byDept: Object.entries(byDept).map(([name, vals]) => ({ name, ...vals })),
      byStatus: [
        { name: 'Mới', value: byStatus['Mới'], color: '#3b82f6' },
        { name: 'Đang phân tích', value: byStatus['Đang phân tích'], color: '#f59e0b' },
        { name: 'Đã kết luận', value: byStatus['Đã kết luận'], color: '#10b981' },
      ]
    };
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Sự cố Y khoa (TT43)</h2>
          <p className="text-sm text-slate-500">Ghi nhận, Phân tích nguyên nhân gốc rễ (RCA) và Báo cáo.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'LIST' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Danh sách sự cố
          </button>
          <button
            onClick={() => setViewMode('STATS')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'STATS' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BarChart2 size={16} /> Thống kê & Báo cáo
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-slate-500">Đang tải dữ liệu...</div>}
      {error && <div className="text-center py-8 text-red-500">Lỗi: {error}</div>}

      {!loading && !error && viewMode === 'LIST' && (
        <IncidentList
          data={incidents}
          onCreate={() => { setEditingItem(null); setViewMode('FORM'); }}
          onEdit={(item) => { setEditingItem(item); setViewMode('FORM'); }}
          onDelete={async (id) => {
            if (window.confirm('Bạn có chắc muốn xóa báo cáo này?')) {
              await deleteBaoCaoScyk(id);
              loadData();
            }
          }}
        />
      )}

      {!loading && !error && viewMode === 'STATS' && (
        <IncidentStatistics stats={computeStats()} totalCount={incidents.length} />
      )}

      {viewMode === 'FORM' && (
        <IncidentForm
          editingItem={editingItem}
          onCancel={() => { setViewMode('LIST'); setEditingItem(null); }}
          onSaved={() => { setViewMode('LIST'); setEditingItem(null); loadData(); }}
        />
      )}
    </div>
  );
};

// --- Component: Incident List ---
const IncidentList = ({ data, onCreate, onEdit, onDelete }: {
  data: any[],
  onCreate: () => void,
  onEdit: (item: any) => void,
  onDelete: (id: string) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(inc =>
    (inc.so_bc_ma_scyk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.khoa_phong || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inc.mo_ta_su_co || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Mới': return 'Mới tiếp nhận';
      case 'Đang phân tích': return 'Đang phân tích RCA';
      case 'Đã kết luận': return 'Đã kết luận';
      default: return 'Mới tiếp nhận';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mới': return 'text-blue-600';
      case 'Đang phân tích': return 'text-amber-600';
      case 'Đã kết luận': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusWidth = (status: string) => {
    switch (status) {
      case 'Mới': return 'w-1/3';
      case 'Đang phân tích': return 'w-2/3';
      case 'Đã kết luận': return 'w-full';
      default: return 'w-1/3';
    }
  };

  const getSeverityBadge = (phanLoai: string) => {
    if (!phanLoai) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 border-slate-100 text-slate-700">Chưa phân loại</span>;
    if (phanLoai.includes('Nhóm A')) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 border-blue-100 text-blue-700">Nhóm A (Nguy cơ)</span>;
    if (phanLoai.includes('Nhóm B')) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 border-blue-100 text-blue-700">Nhóm B (Nhẹ)</span>;
    if (phanLoai.includes('Nhóm C') || phanLoai.includes('Nhóm D')) return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 border-amber-100 text-amber-700">Nhóm C-D (TB)</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 border-red-100 text-red-700">Nhóm E-I (Nặng)</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã SC, khoa phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <button className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
        <button
          onClick={onCreate}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Báo cáo sự cố mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
            <tr>
              <th className="px-6 py-4">Mã SC</th>
              <th className="px-6 py-4">Thời gian & Địa điểm</th>
              <th className="px-6 py-4">Mô tả tóm tắt</th>
              <th className="px-6 py-4">Phân loại (NC)</th>
              <th className="px-6 py-4 text-center">Tiến độ xử lý</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chưa có dữ liệu sự cố</td></tr>
            ) : (
              filteredData.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">{inc.so_bc_ma_scyk || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium">{inc.khoa_phong || inc.noi_xay_ra_sc || '-'}</div>
                    <div className="text-xs text-slate-500">{inc.ngay_xay_ra_sc || inc.ngay_bao_cao}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={inc.mo_ta_su_co}>{inc.mo_ta_su_co || '-'}</td>
                  <td className="px-6 py-4">{getSeverityBadge(inc.phan_loai_ban_dau)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold ${getStatusColor(inc.trang_thai)}`}>
                        {getStatusLabel(inc.trang_thai)}
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${inc.trang_thai === 'Mới' || !inc.trang_thai ? 'bg-blue-500' :
                          inc.trang_thai === 'Đang phân tích' ? 'bg-amber-500' :
                            'bg-green-500'
                          } ${getStatusWidth(inc.trang_thai)}`}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onEdit(inc)} className="text-slate-500 hover:text-primary-600 p-1.5 hover:bg-slate-100 rounded" title="Sửa">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => onDelete(inc.id)} className="text-slate-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded" title="Xóa">
                        <Trash2 size={18} />
                      </button>
                      <button className="text-slate-500 hover:text-primary-600 p-1.5 hover:bg-slate-100 rounded" title="Phân tích RCA">
                        <BrainCircuit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
        <span>Hiển thị {filteredData.length} sự cố</span>
        <div className="flex gap-1">
          <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Trước</button>
          <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Sau</button>
        </div>
      </div>
    </div>
  )
}

// --- Component: Incident Statistics ---
const IncidentStatistics = ({ stats, totalCount }: { stats: { byDept: any[], byStatus: any[] }, totalCount: number }) => {
  const [period, setPeriod] = useState('MONTH'); // MONTH, QUARTER, YEAR

  const severeCount = stats.byDept.reduce((sum, d) => sum + d.severe, 0);
  const analyzedCount = stats.byStatus.find(s => s.name === 'Đã kết luận')?.value || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <span className="font-bold text-slate-700 text-sm">Bộ lọc thời gian:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2"
          >
            <option value="MONTH">Tháng này</option>
            <option value="QUARTER">Quý này</option>
            <option value="YEAR">Năm nay</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
            <Printer size={16} /> In báo cáo
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
            <Download size={16} /> Xuất Excel TT43
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Tổng số sự cố</p>
          <h3 className="text-3xl font-bold text-slate-800">{totalCount}</h3>
          <span className="text-xs text-slate-400 mt-2">Dữ liệu từ Supabase</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Sự cố nặng (E-I)</p>
          <h3 className="text-3xl font-bold text-red-600">{severeCount}</h3>
          <span className="text-xs text-slate-400 mt-2">Chiếm {totalCount > 0 ? ((severeCount / totalCount) * 100).toFixed(1) : 0}%</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Đã kết luận</p>
          <h3 className="text-3xl font-bold text-primary-600">{analyzedCount}</h3>
          <span className="text-xs text-slate-400 mt-2">Đạt {totalCount > 0 ? ((analyzedCount / totalCount) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase mb-1">Chưa xử lý</p>
          <h3 className="text-3xl font-bold text-slate-800">{stats.byStatus.find(s => s.name === 'Mới')?.value || 0}</h3>
          <span className="text-xs text-amber-600 font-medium mt-2">Cần xử lý</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Phân bố sự cố theo Khoa/Phòng và Mức độ</h3>
          <div className="h-80">
            {stats.byDept.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byDept}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Legend />
                  <Bar dataKey="mild" name="Nhẹ (Nhóm A-B)" stackId="a" fill="#60a5fa" barSize={40} />
                  <Bar dataKey="moderate" name="Trung bình (C-D)" stackId="a" fill="#f59e0b" barSize={40} />
                  <Bar dataKey="severe" name="Nặng (E-I)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu thống kê</div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Trạng thái xử lý</h3>
          <div className="h-60 relative">
            {totalCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="block text-2xl font-bold text-slate-800">{totalCount}</span>
              <span className="text-xs text-slate-400">Sự cố</span>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {stats.byStatus.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Report Link */}
      <div className="flex justify-center mt-8">
        <button className="text-primary-600 font-medium hover:underline text-sm flex items-center gap-2">
          Xem báo cáo chi tiết toàn viện <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// --- Component: Incident Form (Keep existing logic but wrap in same file) ---
interface IncidentFormProps {
  onCancel: () => void;
  onSaved: () => void;
  editingItem?: any;
}

const IncidentForm: React.FC<IncidentFormProps> = ({ onCancel, onSaved, editingItem }) => {
  // Form states
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [dmDonVi, setDmDonVi] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const stepLabels = [
    { id: 1, title: 'Đơn vị', icon: <FileText size={18} /> },
    { id: 2, title: 'Người bệnh', icon: <History size={18} /> },
    { id: 3, title: 'Sự cố', icon: <AlertTriangle size={18} /> },
    { id: 4, title: 'Diễn biến', icon: <Sparkles size={18} /> },
    { id: 5, title: 'Đánh giá', icon: <CheckCircle2 size={18} /> },
    { id: 6, title: 'Xác nhận', icon: <Save size={18} /> }
  ];

  const [formData, setFormData] = useState({
    hinh_thuc_bao_cao: editingItem?.hinh_thuc_bao_cao || 'Tự nguyện',
    so_bc_ma_scyk: editingItem?.so_bc_ma_scyk || '',
    ngay_bao_cao: editingItem?.ngay_bao_cao || new Date().toISOString().split('T')[0],
    don_vi_bao_cao: editingItem?.don_vi_bao_cao || '',
    ho_ten_nb: editingItem?.ho_ten_nb || '',
    so_benh_an: editingItem?.so_benh_an || '',
    ngay_sinh: editingItem?.ngay_sinh || '',
    gioi: editingItem?.gioi || 'Nam',
    khoa_phong: editingItem?.khoa_phong || '',
    doi_tuong_xay_ra_sc: editingItem?.doi_tuong_xay_ra_sc || 'Người bệnh',
    noi_xay_ra_sc: editingItem?.noi_xay_ra_sc || '',
    vi_tri_cu_the: editingItem?.vi_tri_cu_the || '',
    ngay_xay_ra_sc: editingItem?.ngay_xay_ra_sc || '',
    thoi_gian: editingItem?.thoi_gian || '',
    mo_ta_su_co: editingItem?.mo_ta_su_co || '',
    de_xuat_giai_phap_ban_dau: editingItem?.de_xuat_giai_phap_ban_dau || '',
    dieu_tri_xy_ly_ban_dau_da_thuc_hien: editingItem?.dieu_tri_xy_ly_ban_dau_da_thuc_hien || '',
    thong_bao_bs_npt: editingItem?.thong_bao_bs_npt || 'Không ghi nhận',
    ghi_nhan_vao_hsba: editingItem?.ghi_nhan_vao_hsba || 'Không ghi nhận',
    thong_bao_nn: editingItem?.thong_bao_nn || 'Không ghi nhận',
    thong_bao_nb: editingItem?.thong_bao_nb || 'Không ghi nhận',
    phan_loai_sc: editingItem?.phan_loai_sc || 'Đã xảy ra',
    phan_loai_ban_dau: editingItem?.phan_loai_ban_dau || 'Nhẹ',
    ho_ten_nguoi_bc: editingItem?.ho_ten_nguoi_bc || user?.full_name || '',
    sdt: editingItem?.sdt || '',
    email: editingItem?.email || '',
    vaitro_nguoi_bc: editingItem?.vaitro_nguoi_bc || 'Nhân viên y tế',
    chung_kien1: editingItem?.chung_kien1 || '',
    chung_kien2: editingItem?.chung_kien2 || '',
    trang_thai: editingItem?.trang_thai || 'Mới'
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const units = await fetchDmDonVi();
        setDmDonVi(units || []);

        if (!editingItem && user) {
          // Lấy thông tin SĐT và Email từ bảng nhân sự dựa trên tên user
          const nhanSu = await fetchNhanSuQlcl();
          const currentUserInfo = nhanSu.find(ns => ns.ho_ten === user.full_name);
          if (currentUserInfo) {
            setFormData(prev => ({
              ...prev,
              sdt: currentUserInfo.so_dien_thoai || '',
              email: currentUserInfo.email || ''
            }));
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu phụ:', err);
      }
    };
    initData();
  }, [user, editingItem]);

  const generateNextCode = async (unitCode: string) => {
    if (!unitCode || editingItem) return;
    const currentYear = new Date().getFullYear().toString();
    try {
      const latest = await fetchLatestBaoCaoScykByYear(currentYear);
      let nextSeq = 1;
      if (latest && latest.so_bc_ma_scyk) {
        const parts = latest.so_bc_ma_scyk.split('-');
        if (parts.length >= 4) {
          const lastSeq = parseInt(parts[3]);
          if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }
      }
      const newCode = `SCYK-${currentYear}-${unitCode}-${nextSeq.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, so_bc_ma_scyk: newCode }));
    } catch (err) {
      console.error('Lỗi khi tạo mã SCYK:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.so_bc_ma_scyk || !formData.don_vi_bao_cao || !formData.ho_ten_nb) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc: Số BC, Đơn vị báo cáo, Họ tên người bệnh');
      return;
    }

    setSaving(true);
    try {
      if (editingItem?.id) {
        await updateBaoCaoScyk(editingItem.id, formData);
      } else {
        await addBaoCaoScyk(formData);
      }
      onSaved();
    } catch (err: any) {
      alert('Lỗi khi lưu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const ToggleGroup = ({ label, field, options, value }: { label: string, field: string, options: string[], value: string }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => handleChange(field, opt)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${value === opt ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Form */}
      <div className="bg-white rounded-t-2xl md:rounded-t-3xl border-x border-t border-slate-200 p-5 md:p-10 flex flex-col md:flex-row items-center gap-4 md:gap-8 shadow-sm">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-primary-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-xl ring-4 md:ring-8 ring-primary-50 rotate-3 hover:rotate-0 transition-transform duration-300 shrink-0">
          <FileText size={32} className="md:w-12 md:h-12" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mb-1 md:mb-2">
            <span className="bg-primary-600 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-full uppercase tracking-widest shadow-sm">Hệ thống QLCL</span>
            <span className="text-slate-300 hidden md:inline">•</span>
            <span className="text-slate-500 text-xs md:text-sm font-bold tracking-tight">Bệnh viện Quân y 103</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase leading-tight">Báo cáo Sự cố Y khoa</h1>
          <p className="text-slate-400 text-[10px] md:text-sm mt-1 md:mt-2 font-medium">Mẫu quy chuẩn theo Phụ lục I - Thông tư 43/2018/TT-BYT</p>
        </div>
        <div className="w-full md:w-auto">
          <div className="bg-primary-50 px-4 py-3 rounded-xl md:rounded-2xl border border-primary-100 flex flex-row md:flex-col justify-between items-center md:items-end backdrop-blur-sm gap-2">
            <span className="text-[9px] md:text-[10px] text-primary-600 font-black uppercase tracking-widest whitespace-nowrap">Mã số báo cáo</span>
            <span className="text-lg md:text-2xl font-mono font-black text-primary-700 leading-none">{formData.so_bc_ma_scyk || 'SCYK-0000-000'}</span>
          </div>
        </div>
      </div>

      {/* Stepper Component */}
      <div className="bg-slate-50/50 border-x border-slate-200 px-4 md:px-10 py-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[600px] md:min-w-0">
          {stepLabels.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div
                onClick={() => currentStep > s.id && setCurrentStep(s.id)}
                className={`flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${currentStep === s.id ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${currentStep === s.id ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                  currentStep > s.id ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                  {currentStep > s.id ? <CheckCircle2 size={20} /> : s.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-tighter ${currentStep === s.id ? 'text-primary-700' : 'text-slate-500'}`}>
                  {s.title}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 bg-slate-200 relative mb-6">
                  <div
                    className="absolute inset-0 bg-primary-500 transition-all duration-500"
                    style={{ width: currentStep > s.id ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl border-x border-b border-slate-200 rounded-b-3xl p-6 md:p-10 space-y-12 shadow-2xl shadow-slate-200/50 min-h-[500px] relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-30 -ml-32 -mb-32 pointer-events-none" />

        {/* Section 1: Thông tin chung */}
        {currentStep === 1 && (
          <section className="relative animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="absolute -left-12 top-0 hidden xl:flex w-10 h-10 bg-primary-600 text-white rounded-2xl items-center justify-center font-bold shadow-lg shadow-primary-200 -rotate-6">1</div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 mb-6 md:mb-8 px-2 md:px-0">
              <div className="xl:hidden w-7 h-7 md:w-8 md:h-8 bg-primary-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm shadow-md">1</div>
              Hình thức & Đơn vị báo cáo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 bg-slate-50/70 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-slate-100">
              <ToggleGroup
                label="Hình thức báo cáo"
                field="hinh_thuc_bao_cao"
                options={['Tự nguyện', 'Bắt buộc']}
                value={formData.hinh_thuc_bao_cao}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                  Đơn vị báo cáo <span className="text-red-500 font-black">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.don_vi_bao_cao}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('don_vi_bao_cao', val);
                      const selectedUnit = dmDonVi.find(u => u.ten_don_vi === val);
                      if (selectedUnit) generateNextCode(selectedUnit.ma_don_vi);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {dmDonVi.map(u => <option key={u.id} value={u.ten_don_vi}>{u.ma_don_vi} - {u.ten_don_vi}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày báo cáo</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 md:top-3 text-slate-400" size={16} />
                  <input
                    type="date"
                    value={formData.ngay_bao_cao}
                    onChange={(e) => handleChange('ngay_bao_cao', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          {currentStep === 2 && (
            <section className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 px-2 md:px-0">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm shadow-md">2</div>
                Thông tin người bệnh
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Họ và tên người bệnh <span className="text-red-500 font-black">*</span></label>
                  <input
                    type="text"
                    placeholder="Nhập tên đầy đủ người bệnh..."
                    value={formData.ho_ten_nb}
                    onChange={(e) => handleChange('ho_ten_nb', e.target.value)}
                    className="w-full border-b-2 border-slate-100 hover:border-slate-300 focus:border-primary-500 px-0 py-2 md:py-3 text-base md:text-lg font-bold text-slate-800 transition-all outline-none bg-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Số HSBA / ID</label>
                    <input
                      type="text"
                      placeholder="Mã hồ sơ..."
                      value={formData.so_benh_an}
                      onChange={(e) => handleChange('so_benh_an', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 md:py-3 text-sm font-mono font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Giới tính</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {['Nam', 'Nữ'].map(g => (
                        <button key={g} onClick={() => handleChange('gioi', g)} className={`flex-1 py-1.5 md:py-2 rounded-lg text-xs font-black transition-all ${formData.gioi === g ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày sinh</label>
                    <input type="date" value={formData.ngay_sinh} onChange={(e) => handleChange('ngay_sinh', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Khoa/Phòng điều trị</label>
                    <div className="relative">
                      <select value={formData.khoa_phong} onChange={(e) => handleChange('khoa_phong', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="">-- Chọn khoa --</option>
                        {dmDonVi.map(u => <option key={u.id} value={u.ten_don_vi}>{u.ten_don_vi}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Đối tượng & Địa điểm */}
          {currentStep === 3 && (
            <section className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 px-2 md:px-0">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm shadow-md">3</div>
                Sự cố & Địa điểm xảy ra
              </h2>
              <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 shadow-sm hover:shadow-md transition-shadow">
                <ToggleGroup label="Đối tượng xảy ra sự cố" field="doi_tuong_xay_ra_sc" options={['Người bệnh', 'Người nhà', 'NV y tế', 'Trang thiết bị']} value={formData.doi_tuong_xay_ra_sc} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày xảy ra</label>
                    <input type="date" value={formData.ngay_xay_ra_sc} onChange={(e) => handleChange('ngay_xay_ra_sc', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Thời gian</label>
                    <input type="time" value={formData.thoi_gian} onChange={(e) => handleChange('thoi_gian', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Vị trí cụ thể tại khoa</label>
                  <input type="text" placeholder="VD: Buồng bệnh số 10, Hành lang, Nhà vệ sinh..." value={formData.vi_tri_cu_the} onChange={(e) => handleChange('vi_tri_cu_the', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Section 4: Mô tả diễn biến */}
        {currentStep === 4 && (
          <section className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 px-2 md:px-0">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm shadow-md">4</div>
              Mô tả diễn biến & Biện pháp can thiệp
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl md:rounded-[2.5rem] p-5 md:p-12 space-y-6 md:space-y-10 shadow-sm">
              <div className="flex flex-col gap-2 md:gap-3">
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={14} className="text-primary-400" /> Diễn biến sự cố tóm tắt <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Mô tả chi tiết tình huống đã xảy ra..."
                  value={formData.mo_ta_su_co}
                  onChange={(e) => handleChange('mo_ta_su_co', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-3xl p-4 md:p-6 text-slate-800 text-sm md:text-base focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all leading-relaxed outline-none shadow-inner"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="flex flex-col gap-2 md:gap-3">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Giải pháp khắc phục ngay</label>
                  <textarea rows={4} placeholder="Xử lý tại chỗ ngay sau đó..." value={formData.de_xuat_giai_phap_ban_dau} onChange={(e) => handleChange('de_xuat_giai_phap_ban_dau', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-4 text-slate-700 text-sm outline-none focus:border-primary-500 transition-all shadow-inner" />
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Điều trị lâm sàng bổ sung</label>
                  <textarea rows={4} placeholder="Y lệnh bổ sung, theo dõi tích cực..." value={formData.dieu_tri_xy_ly_ban_dau_da_thuc_hien} onChange={(e) => handleChange('dieu_tri_xy_ly_ban_dau_da_thuc_hien', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl p-4 text-slate-700 text-sm outline-none focus:border-primary-500 transition-all shadow-inner" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Phân loại & Thông báo */}
        {currentStep === 5 && (
          <section className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 px-2 md:px-0">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm shadow-md">5</div>
              Thông báo, Phân loại & Đánh giá
            </h2>
            <div className="bg-slate-50/50 rounded-2xl md:rounded-3xl border border-slate-200/60 p-5 md:p-10 space-y-8 md:space-y-12 shadow-sm">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <ToggleGroup label="Thông báo BS" field="thong_bao_bs_npt" options={['Có', 'Không', 'KGN']} value={formData.thong_bao_bs_npt} />
                <ToggleGroup label="Ghi HSBA" field="ghi_nhan_vao_hsba" options={['Có', 'Không', 'KGN']} value={formData.ghi_nhan_vao_hsba} />
                <ToggleGroup label="Báo NB" field="thong_bao_nb" options={['Có', 'Không', 'KGN']} value={formData.thong_bao_nb} />
                <ToggleGroup label="Báo NN" field="thong_bao_nn" options={['Có', 'Không', 'KGN']} value={formData.thong_bao_nn} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-6 md:pt-10 border-t border-slate-200">
                <div className="flex flex-col gap-3 md:gap-4">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.1em] md:tracking-[0.2em]">Cơ chế sự cố</label>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {['Chưa xảy ra', 'Đã xảy ra'].map(p => (
                      <button key={p} onClick={() => handleChange('phan_loai_sc', p)} className={`px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 text-xs md:text-sm font-black transition-all ${formData.phan_loai_sc === p ? 'border-primary-600 bg-white text-primary-700 shadow-lg scale-102 md:scale-105' : 'border-transparent bg-slate-200/50 text-slate-400 hover:bg-slate-200'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 md:gap-4">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.1em] md:tracking-[0.2em]">Mức độ ảnh hưởng ban đầu</label>
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {[
                      { val: 'Nhẹ', color: 'blue', desc: 'A-B' },
                      { val: 'Trung bình', color: 'amber', desc: 'C-D' },
                      { val: 'Nặng', color: 'red', desc: 'E-I' }
                    ].map(m => (
                      <button key={m.val} onClick={() => handleChange('phan_loai_ban_dau', m.val)} className={`px-1 py-3 md:px-2 md:py-4 rounded-xl md:rounded-2xl border-2 text-[10px] md:text-sm font-black transition-all flex flex-col items-center gap-1 ${formData.phan_loai_ban_dau === m.val ? `border-${m.color}-600 bg-white text-${m.color}-700 shadow-lg scale-102 md:scale-105` : 'border-transparent bg-slate-200/50 text-slate-400 hover:bg-slate-200'}`}>
                        {m.val}
                        <span className="text-[8px] md:text-[10px] uppercase opacity-60">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 6: Người báo cáo */}
        {currentStep === 6 && (
          <section className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-3 px-2 md:px-0">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-primary-600 text-white rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm shadow-md">6</div>
              Nhân sự báo cáo & Nhân chứng
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-5 md:p-10 space-y-6 md:space-y-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Họ tên người báo cáo</label>
                  <div className="flex items-center gap-3 md:gap-4 bg-slate-50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-100">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-black text-xs md:text-sm shrink-0">{user?.username?.[0]?.toUpperCase()}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs md:text-sm font-black text-slate-800 truncate">{formData.ho_ten_nguoi_bc}</span>
                      <span className="text-[9px] md:text-[10px] text-primary-600 font-bold uppercase tracking-widest">Hệ thống xác thực</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">SĐT liên hệ</label>
                    <input type="text" value={formData.sdt} onChange={(e) => handleChange('sdt', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:gap-4">
                <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Vai trò / Chức danh báo cáo</label>
                <div className="flex flex-wrap gap-2">
                  {['Điều dưỡng', 'Bác sĩ', 'NB/NN', 'Khác'].map(role => (
                    <button key={role} onClick={() => handleChange('vaitro_nguoi_bc', role)} className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full border-2 text-[10px] md:text-xs font-black transition-all ${formData.vaitro_nguoi_bc === role ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>{role}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-4 md:pt-6 border-t border-slate-100">
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Người chứng kiến 1</label>
                  <input type="text" placeholder="Họ và tên..." value={formData.chung_kien1} onChange={(e) => handleChange('chung_kien1', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Người chứng kiến 2</label>
                  <input type="text" placeholder="Họ và tên..." value={formData.chung_kien2} onChange={(e) => handleChange('chung_kien2', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 md:py-3 text-sm font-semibold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-4 md:bottom-8 flex flex-col md:flex-row justify-between items-center gap-4 pt-6 md:pt-10 px-2 md:px-6 z-40">
          <button
            onClick={currentStep === 1 ? onCancel : () => setCurrentStep(currentStep - 1)}
            className="w-full md:w-auto px-8 py-3 md:py-4 text-slate-500 font-black uppercase tracking-widest hover:text-slate-800 transition-all text-xs md:text-sm flex items-center justify-center gap-2"
          >
            {currentStep === 1 ? 'Hủy bỏ' : 'Quay lại'}
          </button>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="w-full md:w-auto px-12 py-4 md:py-5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-primary-200 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95 group uppercase tracking-widest text-sm md:text-base"
              >
                Tiếp theo <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full md:w-auto px-12 py-4 md:py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-red-200 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95 disabled:opacity-50 group uppercase tracking-widest text-sm md:text-base"
              >
                {saving ? <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" /> : <Save size={20} />}
                {saving ? 'Đang gửi...' : (editingItem ? 'Cập nhật nội dung' : 'Ký và Gửi báo cáo')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}