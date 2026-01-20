import React, { useState } from 'react';
import { 
  Plus, Search, Filter, FileText, AlertTriangle, 
  ArrowRight, BrainCircuit, Save, X, Sparkles,
  ChevronDown, ChevronUp, CheckCircle2, AlertOctagon,
  BarChart2, PieChart as PieChartIcon, Calendar, Download, Printer,
  History
} from 'lucide-react';
import { IncidentReport } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

// --- Mock Data ---
const MOCK_INCIDENTS: IncidentReport[] = [
  { id: 'SC-2024-001', date: '2024-06-01', location: 'Khoa Ngoại', description: 'Ngã tại nhà vệ sinh', severity: 'Mild', status: 'Closed' },
  { id: 'SC-2024-002', date: '2024-06-05', location: 'Khoa Dược', description: 'Cấp phát thuốc nhầm liều lượng', severity: 'Moderate', status: 'Analyzing' },
  { id: 'SC-2024-003', date: '2024-06-10', location: 'Khoa Cấp cứu', description: 'Bệnh nhân dị ứng thuốc cản quang', severity: 'Severe', status: 'New' },
  { id: 'SC-2024-004', date: '2024-06-12', location: 'Khoa Nội', description: 'Nhầm lẫn hồ sơ bệnh án', severity: 'Near Miss', status: 'New' },
  { id: 'SC-2024-005', date: '2024-06-14', location: 'Khoa Xét nghiệm', description: 'Mẫu bệnh phẩm bị vỡ', severity: 'Mild', status: 'Closed' },
];

const STATS_DATA = [
  { name: 'Khoa Nội', mild: 4, moderate: 2, severe: 0 },
  { name: 'Khoa Ngoại', mild: 2, moderate: 3, severe: 1 },
  { name: 'Khoa Dược', mild: 5, moderate: 1, severe: 0 },
  { name: 'Cấp cứu', mild: 1, moderate: 2, severe: 2 },
  { name: 'Xét nghiệm', mild: 3, moderate: 0, severe: 0 },
];

const PIE_DATA = [
  { name: 'Chưa xử lý', value: 5, color: '#3b82f6' }, // blue-500
  { name: 'Đang phân tích RCA', value: 3, color: '#f59e0b' }, // amber-500
  { name: 'Đã kết luận', value: 12, color: '#10b981' }, // emerald-500
];

type ViewMode = 'LIST' | 'STATS' | 'FORM';

export const Incidents: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [incidents, setIncidents] = useState<IncidentReport[]>(MOCK_INCIDENTS);

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

      {viewMode === 'LIST' && (
        <IncidentList 
          data={incidents} 
          onCreate={() => setViewMode('FORM')} 
        />
      )}

      {viewMode === 'STATS' && (
        <IncidentStatistics />
      )}

      {viewMode === 'FORM' && (
        <IncidentForm onCancel={() => setViewMode('LIST')} />
      )}
    </div>
  );
};

// --- Component: Incident List ---
const IncidentList = ({ data, onCreate }: { data: IncidentReport[], onCreate: () => void }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm mã SC, khoa phòng..." 
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
            {data.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{inc.id}</td>
                <td className="px-6 py-4">
                   <div className="text-slate-800 font-medium">{inc.location}</div>
                   <div className="text-xs text-slate-500">{inc.date}</div>
                </td>
                <td className="px-6 py-4 max-w-xs truncate" title={inc.description}>{inc.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    inc.severity === 'Severe' || inc.severity === 'Death' ? 'bg-red-50 border-red-100 text-red-700' :
                    inc.severity === 'Moderate' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                    'bg-blue-50 border-blue-100 text-blue-700'
                  }`}>
                    {inc.severity === 'Near Miss' ? 'Nhóm A (Nguy cơ)' : 
                     inc.severity === 'Mild' ? 'Nhóm B (Nhẹ)' :
                     inc.severity === 'Moderate' ? 'Nhóm C-D (TB)' : 'Nhóm E-I (Nặng)'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold ${
                        inc.status === 'New' ? 'text-blue-600' :
                        inc.status === 'Analyzing' ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {inc.status === 'New' ? 'Mới tiếp nhận' :
                         inc.status === 'Analyzing' ? 'Đang phân tích RCA' :
                         'Đã kết luận'}
                      </span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                           inc.status === 'New' ? 'bg-blue-500 w-1/3' :
                           inc.status === 'Analyzing' ? 'bg-amber-500 w-2/3' :
                           'bg-green-500 w-full'
                        }`}></div>
                      </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="text-slate-500 hover:text-primary-600 p-1.5 hover:bg-slate-100 rounded" title="Xem chi tiết">
                        <FileText size={18} />
                    </button>
                    <button className="text-slate-500 hover:text-primary-600 p-1.5 hover:bg-slate-100 rounded" title="Phân tích RCA">
                        <BrainCircuit size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
         <span>Hiển thị {data.length} sự cố</span>
         <div className="flex gap-1">
            <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Trước</button>
            <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Sau</button>
         </div>
      </div>
    </div>
  )
}

// --- Component: Incident Statistics ---
const IncidentStatistics = () => {
  const [period, setPeriod] = useState('MONTH'); // MONTH, QUARTER, YEAR

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
                <option value="MONTH">Tháng này (06/2024)</option>
                <option value="QUARTER">Quý II / 2024</option>
                <option value="YEAR">Năm 2024</option>
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
             <h3 className="text-3xl font-bold text-slate-800">24</h3>
             <span className="text-xs text-green-600 font-medium flex items-center mt-2">
                <ArrowRight size={12} className="rotate-45" /> +12% so với kỳ trước
             </span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 text-xs font-medium uppercase mb-1">Sự cố nặng (E-I)</p>
             <h3 className="text-3xl font-bold text-red-600">2</h3>
             <span className="text-xs text-slate-400 mt-2">Chiếm 8.3% tổng số</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 text-xs font-medium uppercase mb-1">Đã phân tích RCA</p>
             <h3 className="text-3xl font-bold text-primary-600">18</h3>
             <span className="text-xs text-slate-400 mt-2">Đạt tỷ lệ 75%</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <p className="text-slate-500 text-xs font-medium uppercase mb-1">Thời gian xử lý TB</p>
             <h3 className="text-3xl font-bold text-slate-800">2.5 <span className="text-sm font-normal text-slate-500">ngày</span></h3>
             <span className="text-xs text-green-600 font-medium mt-2">Nhanh hơn 0.5 ngày</span>
          </div>
       </div>

       {/* Charts Row */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6">Phân bố sự cố theo Khoa/Phòng và Mức độ</h3>
             <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={STATS_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Legend />
                      <Bar dataKey="mild" name="Nhẹ (Nhóm B)" stackId="a" fill="#60a5fa" barSize={40} />
                      <Bar dataKey="moderate" name="Trung bình (C-D)" stackId="a" fill="#f59e0b" barSize={40} />
                      <Bar dataKey="severe" name="Nặng (E-I)" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-800 mb-6">Trạng thái xử lý</h3>
             <div className="h-60 relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={PIE_DATA}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                   <span className="block text-2xl font-bold text-slate-800">20</span>
                   <span className="text-xs text-slate-400">Sự cố</span>
                </div>
             </div>
             <div className="space-y-3 mt-4">
                {PIE_DATA.map((item, idx) => (
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
const IncidentForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [description, setDescription] = useState("");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleAIAnalysis = () => {
    if (!description) return;
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
          <h2 className="text-lg font-bold text-slate-800 uppercase">Báo cáo Sự cố Y khoa</h2>
          <p className="text-xs text-slate-500">Mẫu theo Phụ lục I - Thông tư 43/2018/TT-BYT</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
             Hủy bỏ
           </button>
           <button className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
             <Save className="w-4 h-4" /> Gửi báo cáo
           </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Section 1: Reporter Info */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4">1. Thông tin người báo cáo</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hình thức báo cáo</label>
                <div className="flex gap-4 mt-2">
                   <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="reportType" className="text-primary-600 focus:ring-primary-500" defaultChecked /> Tự nguyện
                   </label>
                   <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="radio" name="reportType" className="text-primary-600 focus:ring-primary-500" /> Bắt buộc
                   </label>
                </div>
             </div>
             <div>
               <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-primary-600 focus:ring-primary-500" /> 
                  Tôi muốn ẩn danh
               </label>
               <input type="text" placeholder="Họ và tên (nếu có)" className="w-full p-2 border border-slate-300 rounded-lg text-sm mt-1" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại liên hệ</label>
                <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
             </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
             </div>
           </div>
        </section>

        {/* Section 2: Incident Details & Patient Info */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4">2. Thông tin sự cố & Đối tượng xảy ra</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian xảy ra sự cố</label>
                 <input type="datetime-local" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian phát hiện</label>
                 <input type="datetime-local" className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Khoa/Phòng xảy ra</label>
                 <select className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white">
                    <option value="">-- Chọn khoa phòng --</option>
                    <option>Khoa Nội Tiêu hóa</option>
                    <option>Khoa Ngoại Dã chiến</option>
                    <option>Khoa Hồi sức tích cực</option>
                    <option>Khoa Dược</option>
                 </select>
              </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Vị trí cụ thể</label>
                 <input type="text" placeholder="VD: Buồng bệnh số 5, Nhà vệ sinh..." className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
              </div>
           </div>
           
           <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Đối tượng xảy ra sự cố</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-300">
                    <input type="radio" name="subject" className="text-primary-600 focus:ring-primary-500" /> Người bệnh
                 </label>
                 <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-300">
                    <input type="radio" name="subject" className="text-primary-600 focus:ring-primary-500" /> Người nhà/Khách
                 </label>
                 <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-300">
                    <input type="radio" name="subject" className="text-primary-600 focus:ring-primary-500" /> Nhân viên y tế
                 </label>
                 <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 cursor-pointer hover:border-primary-300">
                    <input type="radio" name="subject" className="text-primary-600 focus:ring-primary-500" /> Trang thiết bị
                 </label>
              </div>
           </div>

           {/* Patient Specific Info */}
           <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
              <h4 className="text-xs font-bold text-primary-800 uppercase mb-3">Thông tin người bệnh (Nếu có)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <input type="text" placeholder="Họ và tên NB" className="w-full p-2 border border-primary-200 rounded-lg text-sm" />
                 <input type="text" placeholder="Số HSBA" className="w-full p-2 border border-primary-200 rounded-lg text-sm" />
                 <div className="flex gap-2">
                    <input type="text" placeholder="Năm sinh" className="w-1/2 p-2 border border-primary-200 rounded-lg text-sm" />
                    <select className="w-1/2 p-2 border border-primary-200 rounded-lg text-sm bg-white">
                       <option>Nam</option>
                       <option>Nữ</option>
                    </select>
                 </div>
              </div>
           </div>
        </section>

        {/* Section 3: Incident Description & AI Analysis */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase">3. Diễn biến sự cố & Phân tích RCA</h3>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500">Có hỗ trợ bởi AI</span>
                 <BrainCircuit className="w-4 h-4 text-purple-600" />
              </div>
           </div>

           <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả ngắn gọn diễn biến</label>
              <textarea 
                rows={5} 
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all" 
                placeholder="Mô tả chi tiết: Đang làm gì? Ở đâu? Như thế nào?..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                    disabled={!description || aiAnalyzing}
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
              <textarea rows={2} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Đã xử lý như thế nào ngay sau khi sự cố xảy ra?"></textarea>
           </div>
        </section>

        {/* Section 4: Classification */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4">4. Phân loại sự cố (NC)</h3>
           
           <div className="space-y-4">
              <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                 <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="severity" className="mt-1 text-primary-600 focus:ring-primary-500" />
                    <div>
                       <span className="block font-bold text-slate-800 text-sm">Nhóm A (Nguy cơ)</span>
                       <span className="text-xs text-slate-500">Đã xảy ra tình huống có thể dẫn đến sự cố, nhưng đã được ngăn chặn kịp thời (Near miss).</span>
                    </div>
                 </label>
              </div>
              
              <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                 <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="severity" className="mt-1 text-primary-600 focus:ring-primary-500" />
                    <div>
                       <span className="block font-bold text-slate-800 text-sm">Nhóm B (Sự cố nhẹ)</span>
                       <span className="text-xs text-slate-500">Sự cố đã xảy ra nhưng chưa gây tổn thương cho bệnh nhân.</span>
                    </div>
                 </label>
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg cursor-pointer transition-colors">
                 <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="severity" className="mt-1 text-amber-600 focus:ring-amber-500" />
                    <div>
                       <span className="block font-bold text-amber-900 text-sm">Nhóm C - D (Sự cố trung bình)</span>
                       <span className="text-xs text-amber-700">Đã gây tổn thương nhẹ, cần theo dõi hoặc can thiệp điều trị tối thiểu.</span>
                    </div>
                 </label>
              </div>

              <div className="p-4 border border-red-200 bg-red-50 rounded-lg cursor-pointer transition-colors">
                 <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" name="severity" className="mt-1 text-red-600 focus:ring-red-500" />
                    <div>
                       <span className="block font-bold text-red-900 text-sm">Nhóm E - I (Sự cố nặng - Sentinel Event)</span>
                       <span className="text-xs text-red-700">Gây tổn thương tạm thời/vĩnh viễn, cần can thiệp cấp cứu, kéo dài nằm viện hoặc tử vong.</span>
                    </div>
                 </label>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}