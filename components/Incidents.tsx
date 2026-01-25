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
import { fetchBaoCaoScyk, addBaoCaoScyk, updateBaoCaoScyk, deleteBaoCaoScyk } from '../readBaoCaoScyk';

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
  const [saving, setSaving] = useState(false);
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
    phan_loai_ban_dau: editingItem?.phan_loai_ban_dau || 'Nhóm A',
    ho_ten_nguoi_bc: editingItem?.ho_ten_nguoi_bc || '',
    sdt: editingItem?.sdt || '',
    email: editingItem?.email || '',
    trang_thai: editingItem?.trang_thai || 'Mới'
  });

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.so_bc_ma_scyk || !formData.don_vi_bao_cao || !formData.ho_ten_nb) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc: Số BC/Mã SCYK, Đơn vị báo cáo, Họ tên người bệnh');
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

  const handleAIAnalysis = () => {
    if (!formData.mo_ta_su_co) return;
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiResult(`
**Phân tích Nguyên nhân gốc rễ (RCA) - Mô hình Xương cá:**

1. **Con người (Man):**
   - Khả năng giao tiếp giữa các kíp trực chưa hiệu quả.
   - Nhân viên có thể đang trong trạng thái mệt mỏi hoặc thiếu tập trung.

2. **Quy trình (Method):**
   - Quy trình bàn giao ca trực có thể chưa được tuân thủ nghiêm ngặt.
   - Thiếu bảng kiểm (checklist) đối chiếu tại thời điểm xảy ra sự cố.

3. **Phương tiện/Thiết bị (Machine):**
   - Hệ thống cảnh báo tự động trên phần mềm (nếu có) chưa kích hoạt hoặc bị bỏ qua.

4. **Môi trường (Environment):**
   - Khu vực làm việc có thể quá ồn hoặc ánh sáng không đảm bảo.

**Đề xuất giải pháp sơ bộ:**
   - Tổ chức tập huấn lại quy trình nhận diện người bệnh/thuốc.
   - Rà soát lại quy trình bàn giao ca.
      `);
      setAiAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="bg-slate-50 pb-10">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm -mx-6 -mt-6 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 uppercase">
            {editingItem ? 'Chỉnh sửa Báo cáo Sự cố' : 'Báo cáo Sự cố Y khoa'}
          </h2>
          <p className="text-xs text-slate-500">Mẫu theo Phụ lục I - Thông tư 43/2018/TT-BYT</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Đang lưu...' : (editingItem ? 'Cập nhật' : 'Gửi báo cáo')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Section 1: Reporter Info */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
            <h3 className="text-sm font-bold text-primary-800 uppercase">1. Thông tin người báo cáo</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hình thức báo cáo</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      checked={formData.hinh_thuc_bao_cao === 'Tự nguyện'}
                      onChange={() => handleChange('hinh_thuc_bao_cao', 'Tự nguyện')}
                      className="text-primary-600 focus:ring-primary-500"
                    /> Tự nguyện
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="reportType"
                      checked={formData.hinh_thuc_bao_cao === 'Bắt buộc'}
                      onChange={() => handleChange('hinh_thuc_bao_cao', 'Bắt buộc')}
                      className="text-primary-600 focus:ring-primary-500"
                    /> Bắt buộc
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số BC/Mã SCYK *</label>
                <input
                  type="text"
                  value={formData.so_bc_ma_scyk}
                  onChange={(e) => handleChange('so_bc_ma_scyk', e.target.value)}
                  placeholder="VD: SCYK-2025-001"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên người báo cáo</label>
                <input
                  type="text"
                  value={formData.ho_ten_nguoi_bc}
                  onChange={(e) => handleChange('ho_ten_nguoi_bc', e.target.value)}
                  placeholder="Họ và tên người báo cáo"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị báo cáo *</label>
                <input
                  type="text"
                  value={formData.don_vi_bao_cao}
                  onChange={(e) => handleChange('don_vi_bao_cao', e.target.value)}
                  placeholder="Khoa/Phòng báo cáo"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={formData.sdt}
                  onChange={(e) => handleChange('sdt', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Incident Details & Patient Info */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
            <h3 className="text-sm font-bold text-primary-800 uppercase">2. Thông tin sự cố & Đối tượng xảy ra</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày xảy ra sự cố</label>
                <input
                  type="date"
                  value={formData.ngay_xay_ra_sc}
                  onChange={(e) => handleChange('ngay_xay_ra_sc', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian</label>
                <input
                  type="time"
                  value={formData.thoi_gian}
                  onChange={(e) => handleChange('thoi_gian', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Khoa/Phòng xảy ra</label>
                <select
                  value={formData.khoa_phong}
                  onChange={(e) => handleChange('khoa_phong', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- Chọn khoa phòng --</option>
                  <option>Khoa Nội Tiêu hóa</option>
                  <option>Khoa Ngoại Dã chiến</option>
                  <option>Khoa Hồi sức tích cực</option>
                  <option>Khoa Dược</option>
                  <option>Khoa Nội Tổng hợp</option>
                  <option>Khoa Sản</option>
                  <option>Khoa Nhi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí cụ thể</label>
                <input
                  type="text"
                  value={formData.vi_tri_cu_the}
                  onChange={(e) => handleChange('vi_tri_cu_the', e.target.value)}
                  placeholder="VD: Buồng bệnh số 5, Nhà vệ sinh..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Đối tượng xảy ra sự cố</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Người bệnh', 'Người nhà/Khách', 'Nhân viên y tế', 'Trang thiết bị'].map(option => (
                  <label key={option} className={`flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border cursor-pointer hover:border-primary-300 ${formData.doi_tuong_xay_ra_sc === option ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="subject"
                      checked={formData.doi_tuong_xay_ra_sc === option}
                      onChange={() => handleChange('doi_tuong_xay_ra_sc', option)}
                      className="text-primary-600 focus:ring-primary-500"
                    /> {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Patient Specific Info */}
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h4 className="text-xs font-bold text-primary-800 uppercase mb-3">Thông tin người bệnh *</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.ho_ten_nb}
                  onChange={(e) => handleChange('ho_ten_nb', e.target.value)}
                  placeholder="Họ và tên NB *"
                  className="w-full p-2 border border-primary-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={formData.so_benh_an}
                  onChange={(e) => handleChange('so_benh_an', e.target.value)}
                  placeholder="Số HSBA"
                  className="w-full p-2 border border-primary-200 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={formData.ngay_sinh}
                    onChange={(e) => handleChange('ngay_sinh', e.target.value)}
                    placeholder="Ngày sinh"
                    className="w-1/2 p-2 border border-primary-200 rounded-lg text-sm"
                  />
                  <select
                    value={formData.gioi}
                    onChange={(e) => handleChange('gioi', e.target.value)}
                    className="w-1/2 p-2 border border-primary-200 rounded-lg text-sm bg-white"
                  >
                    <option>Nam</option>
                    <option>Nữ</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Incident Description & AI Analysis */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-primary-800 uppercase">3. Diễn biến sự cố & Phân tích RCA</h3>
            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm border border-primary-100">
              <span className="text-xs text-slate-500 font-medium">Có hỗ trợ bởi AI</span>
              <BrainCircuit className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="p-6">

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả ngắn gọn diễn biến</label>
              <textarea
                rows={5}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all"
                placeholder="Mô tả chi tiết: Đang làm gì? Ở đâu? Như thế nào?..."
                value={formData.mo_ta_su_co}
                onChange={(e) => handleChange('mo_ta_su_co', e.target.value)}
              ></textarea>
            </div>

            {/* AI Analysis Box */}
            <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/50">
              <div className="p-4 flex items-center justify-between bg-purple-100/50 border-b border-purple-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900 text-sm">Trợ lý Phân tích RCA (AI Assistant)</span>
                </div>
                <button
                  onClick={handleAIAnalysis}
                  disabled={!formData.mo_ta_su_co || aiAnalyzing}
                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {aiAnalyzing ? (
                    <>
                      <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                      Đang phân tích...
                    </>
                  ) : (
                    'Phân tích ngay'
                  )}
                </button>
              </div>

              {aiResult ? (
                <div className="p-4 bg-white animate-in fade-in duration-500">
                  <div className="prose prose-sm text-slate-700 max-w-none whitespace-pre-line">
                    {aiResult}
                  </div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button className="text-xs text-slate-500 hover:text-purple-600 underline">Sao chép kết quả</button>
                    <button className="text-xs text-slate-500 hover:text-purple-600 underline">Phản hồi kết quả này</button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  Nhập mô tả sự cố ở trên và nhấn "Phân tích ngay" để AI gợi ý nguyên nhân gốc rễ.
                </div>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Đề xuất giải pháp khắc phục ngay</label>
              <textarea
                rows={2}
                value={formData.de_xuat_giai_phap_ban_dau}
                onChange={(e) => handleChange('de_xuat_giai_phap_ban_dau', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Đã xử lý như thế nào ngay sau khi sự cố xảy ra?"
              ></textarea>
            </div>
          </div>
        </section>

        {/* Section 4: Classification */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
            <h3 className="text-sm font-bold text-primary-800 uppercase">4. Phân loại sự cố (NC)</h3>
          </div>
          <div className="p-6">

            <div className="space-y-4">
              <div
                onClick={() => handleChange('phan_loai_ban_dau', 'Nhóm A')}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.phan_loai_ban_dau === 'Nhóm A' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    checked={formData.phan_loai_ban_dau === 'Nhóm A'}
                    onChange={() => handleChange('phan_loai_ban_dau', 'Nhóm A')}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="block font-bold text-slate-800 text-sm">Nhóm A (Nguy cơ)</span>
                    <span className="text-xs text-slate-500">Đã xảy ra tình huống có thể dẫn đến sự cố, nhưng đã được ngăn chặn kịp thời (Near miss).</span>
                  </div>
                </label>
              </div>

              <div
                onClick={() => handleChange('phan_loai_ban_dau', 'Nhóm B')}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.phan_loai_ban_dau === 'Nhóm B' ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    checked={formData.phan_loai_ban_dau === 'Nhóm B'}
                    onChange={() => handleChange('phan_loai_ban_dau', 'Nhóm B')}
                    className="mt-1 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="block font-bold text-slate-800 text-sm">Nhóm B (Sự cố nhẹ)</span>
                    <span className="text-xs text-slate-500">Sự cố đã xảy ra nhưng chưa gây tổn thương cho bệnh nhân.</span>
                  </div>
                </label>
              </div>

              <div
                onClick={() => handleChange('phan_loai_ban_dau', 'Nhóm C-D')}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.phan_loai_ban_dau === 'Nhóm C-D' ? 'border-amber-500 bg-amber-100' : 'border-amber-200 bg-amber-50'}`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    checked={formData.phan_loai_ban_dau === 'Nhóm C-D'}
                    onChange={() => handleChange('phan_loai_ban_dau', 'Nhóm C-D')}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="block font-bold text-amber-900 text-sm">Nhóm C - D (Sự cố trung bình)</span>
                    <span className="text-xs text-amber-700">Đã gây tổn thương nhẹ, cần theo dõi hoặc can thiệp điều trị tối thiểu.</span>
                  </div>
                </label>
              </div>

              <div
                onClick={() => handleChange('phan_loai_ban_dau', 'Nhóm E-I')}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.phan_loai_ban_dau === 'Nhóm E-I' ? 'border-red-500 bg-red-100' : 'border-red-200 bg-red-50'}`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    checked={formData.phan_loai_ban_dau === 'Nhóm E-I'}
                    onChange={() => handleChange('phan_loai_ban_dau', 'Nhóm E-I')}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="block font-bold text-red-900 text-sm">Nhóm E - I (Sự cố nặng - Sentinel Event)</span>
                    <span className="text-xs text-red-700">Gây tổn thương tạm thời/vĩnh viễn, cần can thiệp cấp cứu, kéo dài nằm viện hoặc tử vong.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}