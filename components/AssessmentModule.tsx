import React, { useState, useRef } from 'react';
import { 
  ClipboardList, Award, ChevronRight, FileCheck, Star, 
  Upload, Plus, FileSpreadsheet, Search, Filter, Download,
  MoreHorizontal, CheckCircle2, AlertCircle, Paperclip,
  UserPlus, FileText, Printer, Save
} from 'lucide-react';

// --- Types & Mock Data ---

type AssessmentTab = 'CRITERIA_83' | 'BASIC';

// Mock Data for 83 Criteria Summary
const CRITERIA_GROUPS = [
  { id: 'A', name: 'Phần A: Hướng đến người bệnh', score: 4.5, total: 5, items: 19 },
  { id: 'B', name: 'Phần B: Phát triển nguồn nhân lực', score: 3.8, total: 5, items: 14 },
  { id: 'C', name: 'Phần C: Hoạt động chuyên môn', score: 4.0, total: 5, items: 35 },
  { id: 'D', name: 'Phần D: Cải tiến chất lượng', score: 3.5, total: 5, items: 11 },
  { id: 'E', name: 'Phần E: Đặc thù chuyên khoa', score: 4.2, total: 5, items: 4 },
];

// Mock Data for 83 Criteria Detailed Scoring
const SCORES_83 = [
  { code: 'A1.1', name: 'Người bệnh được chỉ dẫn rõ ràng, đón tiếp niềm nở', assignedDept: 'Phòng KHTH', selfScore: 4, officialScore: 4, evidenceCount: 3, status: 'DONE' },
  { code: 'A1.2', name: 'Thủ tục khám bệnh, chữa bệnh cải tiến, đơn giản', assignedDept: 'Khoa Khám bệnh', selfScore: 3, officialScore: 3, evidenceCount: 1, status: 'DONE' },
  { code: 'B2.1', name: 'Nhân viên y tế được đào tạo về kỹ năng giao tiếp', assignedDept: 'Phòng TCCB', selfScore: 5, officialScore: 4, evidenceCount: 5, status: 'REVIEW' },
  { code: 'C3.1', name: 'Bảo đảm an toàn sinh học tại phòng xét nghiệm', assignedDept: 'Khoa Xét nghiệm', selfScore: 0, officialScore: 0, evidenceCount: 0, status: 'PENDING' },
  { code: 'C4.2', name: 'Tuân thủ quy trình kiểm soát nhiễm khuẩn', assignedDept: 'Khoa KSNK', selfScore: 4, officialScore: 0, evidenceCount: 2, status: 'DRAFT' },
];

// Mock Data for Basic Standards (Bộ tiêu chuẩn cơ bản)
const BASIC_STANDARDS = [
  { id: 1, code: 'TC-VS', name: 'Tiêu chuẩn Vệ sinh bệnh viện (Xanh - Sạch - Đẹp)', inCharge: 'Phòng HCQT', frequency: 'Hàng tháng', status: 'ACTIVE' },
  { id: 2, code: 'TC-ATNB', name: 'Tiêu chuẩn An toàn người bệnh cơ bản', inCharge: 'Phòng KHTH', frequency: 'Hàng quý', status: 'ACTIVE' },
  { id: 3, code: 'TC-DD', name: 'Tiêu chuẩn Chăm sóc người bệnh toàn diện', inCharge: 'Phòng Điều dưỡng', frequency: 'Hàng tháng', status: 'ACTIVE' },
  { id: 4, code: 'TC-GT', name: 'Tiêu chuẩn Giao tiếp ứng xử', inCharge: 'Phòng TCCB', frequency: 'Đột xuất', status: 'ACTIVE' },
];

const BASIC_EVALUATIONS = [
    { id: 1, standard: 'Tiêu chuẩn Vệ sinh bệnh viện', unit: 'Khoa Nội Tiêu hóa', date: '15/06/2024', score: 95, result: 'Đạt' },
    { id: 2, standard: 'Tiêu chuẩn Vệ sinh bệnh viện', unit: 'Khoa Ngoại Dã chiến', date: '15/06/2024', score: 88, result: 'Đạt' },
    { id: 3, standard: 'Tiêu chuẩn An toàn người bệnh cơ bản', unit: 'Khoa Hồi sức tích cực', date: '12/06/2024', score: 92, result: 'Đạt' },
];

export const AssessmentModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssessmentTab>('CRITERIA_83');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(`Đã tải lên file danh mục: ${file.name}. Hệ thống đang cập nhật bộ tiêu chí...`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Đánh giá Chất lượng Bệnh viện</h2>
          <p className="text-sm text-slate-500">Tự đánh giá, chấm điểm và theo dõi cải tiến chất lượng theo các bộ tiêu chuẩn.</p>
        </div>
        
        {/* Global Actions */}
        <div className="flex flex-wrap gap-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
          />
          <button 
            onClick={handleFileUpload}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            <Upload size={16} /> Upload Danh mục Excel
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
            <Printer size={16} /> Xuất mẫu báo cáo
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl inline-flex mb-2">
        <button
          onClick={() => setActiveTab('CRITERIA_83')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'CRITERIA_83'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award size={18} />
          Bộ 83 Tiêu chí Chất lượng
        </button>
        <button
          onClick={() => setActiveTab('BASIC')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'BASIC'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList size={18} />
          Bộ Tiêu chuẩn Cơ bản
        </button>
      </div>

      {/* Content Rendering */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'CRITERIA_83' ? <Criteria83View /> : <BasicStandardsView />}
      </div>
    </div>
  );
};

// --- View 1: Bộ 83 Tiêu chí ---
const Criteria83View = () => {
  const avgScore = (CRITERIA_GROUPS.reduce((acc, curr) => acc + curr.score, 0) / CRITERIA_GROUPS.length).toFixed(2);
  
  return (
    <div className="space-y-6">
       {/* Top Stats & Summary */}
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-yellow-500 fill-yellow-500" /> 
                    Kết quả Tự đánh giá (Tổng hợp)
                  </h3>
                  <span className="text-2xl font-bold text-primary-600">{avgScore}/5.0</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {CRITERIA_GROUPS.map((group) => (
                    <div key={group.id} className="text-center p-2 rounded-lg bg-slate-50 hover:bg-primary-50 transition-colors cursor-pointer border border-transparent hover:border-primary-100">
                        <div className="text-xs font-bold text-slate-500 mb-1">{group.id}</div>
                        <div className={`text-lg font-bold ${
                            group.score >= 4 ? 'text-primary-600' : group.score >= 3 ? 'text-amber-500' : 'text-red-500'
                        }`}>{group.score}</div>
                        <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                             <div className={`h-full ${group.score >= 4 ? 'bg-primary-500' : group.score >= 3 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width: `${(group.score/5)*100}%`}}></div>
                        </div>
                    </div>
                ))}
              </div>
          </div>
          
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-600 shadow-sm mb-3">
                  <FileText size={24} />
              </div>
              <h4 className="font-bold text-primary-800 mb-1">Báo cáo Sở Y tế</h4>
              <p className="text-xs text-primary-600 mb-4">Xuất dữ liệu theo mẫu kiểm tra đánh giá chất lượng hàng năm.</p>
              <button className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
                  Xuất báo cáo
              </button>
          </div>
       </div>

       {/* Detailed Scoring Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
             <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-primary-600" size={20} />
                <h3 className="font-bold text-slate-800">Bảng chấm điểm chi tiết & Minh chứng</h3>
             </div>
             
             <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm tiêu chí, đơn vị phụ trách..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                    />
                </div>
                <button className="px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600">
                    <Filter size={18} />
                </button>
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-primary-600 text-white font-bold border-b border-primary-700 uppercase text-xs">
                   <tr>
                      <th className="px-6 py-4 w-20">Mã</th>
                      <th className="px-6 py-4 min-w-[250px]">Tên tiêu chí</th>
                      <th className="px-6 py-4 w-40">Phân công</th>
                      <th className="px-6 py-4 text-center w-24">Tự chấm</th>
                      <th className="px-6 py-4 text-center w-24">Đoàn chấm</th>
                      <th className="px-6 py-4 text-center w-24">Minh chứng</th>
                      <th className="px-6 py-4 text-center w-32">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {SCORES_83.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 font-bold text-primary-700">{item.code}</td>
                         <td className="px-6 py-4 text-slate-700 font-medium">
                            {item.name}
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">Cập nhật: 12/06/2024</div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded w-fit">
                                <UserPlus size={12} className="text-slate-500" />
                                <span className="text-slate-700 font-medium">{item.assignedDept}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            {item.status !== 'PENDING' ? (
                                <span className="inline-block w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold leading-8">{item.selfScore}</span>
                            ) : <span className="text-slate-300">-</span>}
                         </td>
                         <td className="px-6 py-4 text-center">
                            {item.officialScore > 0 ? (
                                <span className={`inline-block w-8 h-8 rounded-full font-bold leading-8 text-white ${
                                    item.officialScore >= 4 ? 'bg-green-500' : item.officialScore >= 3 ? 'bg-amber-500' : 'bg-red-500'
                                }`}>
                                    {item.officialScore}
                                </span>
                            ) : <span className="text-slate-300">-</span>}
                         </td>
                         <td className="px-6 py-4 text-center">
                            <button className={`flex items-center justify-center gap-1 mx-auto px-2 py-1 rounded text-xs transition-colors ${
                                item.evidenceCount > 0 ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' : 'text-slate-400 hover:bg-slate-100'
                            }`}>
                                <Paperclip size={14} />
                                <span className="font-bold">{item.evidenceCount}</span>
                            </button>
                         </td>
                         <td className="px-6 py-4 text-center">
                            {item.status === 'DONE' && <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Hoàn thành</span>}
                            {item.status === 'REVIEW' && <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Đang rà soát</span>}
                            {item.status === 'DRAFT' && <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Đang chấm</span>}
                            {item.status === 'PENDING' && <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full">Chưa chấm</span>}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="flex items-center gap-1 ml-auto text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-primary-200 hover:border-primary-300">
                                <FileCheck size={14} /> Chấm điểm
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
             <span>Hiển thị 5/83 tiêu chí</span>
             <div className="flex gap-2">
                 <button disabled className="px-2 py-1 bg-white border border-slate-200 rounded opacity-50">Trước</button>
                 <button className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100">Sau</button>
             </div>
          </div>
       </div>
    </div>
  );
}

// --- View 2: Bộ Tiêu chuẩn Cơ bản ---
const BasicStandardsView = () => {
  return (
    <div className="space-y-6">
      {/* List of Standards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800">Danh mục Bộ tiêu chuẩn chất lượng</h3>
                <p className="text-sm text-slate-500">Các bộ tiêu chuẩn xây dựng riêng cho từng lĩnh vực.</p>
             </div>
             <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium shadow-sm">
                <Plus size={16} /> Thêm bộ tiêu chuẩn mới
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-primary-600 text-white font-bold border-b border-primary-700 uppercase text-xs">
                 <tr>
                   <th className="px-6 py-4">Mã & Tên bộ tiêu chuẩn</th>
                   <th className="px-6 py-4">Đơn vị phụ trách</th>
                   <th className="px-6 py-4">Tần suất đánh giá</th>
                   <th className="px-6 py-4 text-center">Trạng thái</th>
                   <th className="px-6 py-4 text-right">Thao tác</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {BASIC_STANDARDS.map(std => (
                   <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="font-bold text-slate-800">{std.name}</div>
                       <div className="text-xs text-slate-500 font-mono mt-1">{std.code}</div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-slate-700">
                           <UserPlus size={14} className="text-slate-400" />
                           {std.inCharge}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-slate-600">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                         {std.frequency}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Đang áp dụng</span>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-primary-600 hover:bg-primary-50 rounded" title="Xem"><Eye size={16} /></button>
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa"><Edit2 size={16} /></button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={16} /></button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase">Kết quả chấm điểm gần đây</h3>
            <div className="flex gap-2">
               <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Search size={14} /></button>
               <button className="p-1.5 hover:bg-white rounded border border-transparent hover:border-slate-300 transition-colors"><Filter size={14} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="bg-primary-600 text-white font-bold text-xs uppercase border-b border-primary-700">
                 <tr>
                   <th className="px-6 py-3">Đơn vị được đánh giá</th>
                   <th className="px-6 py-3">Bộ tiêu chuẩn áp dụng</th>
                   <th className="px-6 py-3">Ngày đánh giá</th>
                   <th className="px-6 py-3 text-center">Điểm số</th>
                   <th className="px-6 py-3 text-right">Kết quả</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {BASIC_EVALUATIONS.map(evalItem => (
                   <tr key={evalItem.id} className="hover:bg-slate-50">
                     <td className="px-6 py-3 font-bold text-slate-800">{evalItem.unit}</td>
                     <td className="px-6 py-3 text-slate-600">{evalItem.standard}</td>
                     <td className="px-6 py-3 text-slate-500 text-xs">{evalItem.date}</td>
                     <td className="px-6 py-3 text-center font-bold text-primary-600">{evalItem.score}/100</td>
                     <td className="px-6 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                             {evalItem.result}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 text-center">
             <button className="text-sm text-slate-500 hover:text-primary-600 font-medium">Xem toàn bộ lịch sử</button>
          </div>
        </div>
    </div>
  );
}