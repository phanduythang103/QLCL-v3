
import React, { useState } from 'react';
import { Target, CheckCircle2, Clock, ArrowUpRight, Plus, FileText, ArrowLeft, Save, Calendar, Users, BarChart3, Filter, Search, MoreHorizontal } from 'lucide-react';

const IMPROVEMENTS = [
  { id: 1, title: 'Cải tiến quy trình cấp phát thuốc nội trú', dept: 'Khoa Dược', status: 'In Progress', progress: 65, date: 'T6/2024' },
  { id: 2, title: 'Giảm thời gian chờ tại Khoa Khám bệnh', dept: 'Khoa Khám bệnh', status: 'Completed', progress: 100, date: 'T4/2024' },
  { id: 3, title: 'Chuẩn hóa phác đồ điều trị viêm phổi', dept: 'Khoa Hô hấp', status: 'Planning', progress: 15, date: 'T7/2024' },
];

type ViewState = 'LIST' | 'CREATE_PLAN' | 'CREATE_REPORT';

// Define props interface for ImprovementCard to ensure key and other React props are handled correctly
interface ImprovementCardProps {
    item: any;
    color: 'primary' | 'green' | 'amber';
}

// Correctly typed ImprovementCard using React.FC
const ImprovementCard: React.FC<ImprovementCardProps> = ({ item, color }) => {
    const colorClasses = {
        primary: 'bg-primary-50 border-primary-100',
        green: 'bg-green-50 border-green-100',
        amber: 'bg-amber-50 border-amber-100'
    };
    
    const progressColors = {
        primary: 'bg-primary-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500'
    };

    return (
        <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-shadow hover:shadow-md cursor-pointer`}>
            <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{item.title}</h4>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><FileText size={12} /> {item.dept}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {item.date}</span>
            </div>
            <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                <div 
                    className={`h-1.5 rounded-full ${progressColors[color]}`} 
                    style={{ width: `${item.progress}%` }}
                ></div>
            </div>
        </div>
    );
};

export const ImprovementModule: React.FC = () => {
  const [view, setView] = useState<ViewState>('LIST');

  const renderContent = () => {
    switch (view) {
      case 'CREATE_PLAN':
        return <PlanForm onCancel={() => setView('LIST')} />;
      case 'CREATE_REPORT':
        return <ReportForm onCancel={() => setView('LIST')} />;
      default:
        return <ImprovementList onCreate={() => setView('CREATE_PLAN')} onReport={() => setView('CREATE_REPORT')} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

// --- Sub-component: Improvement List (Default View) ---
const ImprovementList = ({ onCreate, onReport }: { onCreate: () => void, onReport: () => void }) => {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Completed': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Đã hoàn thành</span>;
      case 'In Progress': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 border border-primary-200">Đang thực hiện</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">Lập kế hoạch</span>;
    }
  };

  return (
    <>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Cải tiến Chất lượng (PDCA)</h2>
        <p className="text-sm text-slate-500">Quản lý các đề án và kế hoạch cải tiến chất lượng.</p>
      </div>
      <div className="flex gap-2">
         <button 
           onClick={onReport}
           className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors"
         >
           <FileText size={16} /> Viết báo cáo
         </button>
         <button 
           onClick={onCreate}
           className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors shadow-sm"
         >
           <Plus size={16} /> Lập kế hoạch mới
         </button>
      </div>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">Đang thực hiện</h3>
            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-full">5</span>
          </div>
          <div className="space-y-4">
            {IMPROVEMENTS.filter(i => i.status === 'In Progress').map(item => (
                <ImprovementCard key={item.id} item={item} color="primary" />
            ))}
          </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">Đã hoàn thành</h3>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">12</span>
          </div>
          <div className="space-y-4">
            {IMPROVEMENTS.filter(i => i.status === 'Completed').map(item => (
                <ImprovementCard key={item.id} item={item} color="green" />
            ))}
          </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">Kế hoạch mới</h3>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">3</span>
          </div>
          <div className="space-y-4">
            {IMPROVEMENTS.filter(i => i.status === 'Planning').map(item => (
                <ImprovementCard key={item.id} item={item} color="amber" />
            ))}
          </div>
      </div>
    </div>
    
    {/* Main List Table */}
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Danh sách Kế hoạch Cải tiến</h3>
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm đề tài..." 
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
                <thead className="bg-primary-600 text-white font-semibold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Mã KH</th>
                        <th className="px-6 py-4">Tên đề tài cải tiến</th>
                        <th className="px-6 py-4">Khoa/Phòng</th>
                        <th className="px-6 py-4">Trạng thái</th>
                        <th className="px-6 py-4">Tiến độ</th>
                        <th className="px-6 py-4">Thời gian</th>
                        <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {IMPROVEMENTS.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">KH-24-{item.id.toString().padStart(3, '0')}</td>
                            <td className="px-6 py-4">
                                <span className="font-medium text-slate-800 block mb-1">{item.title}</span>
                                <span className="text-xs text-slate-500">Phụ trách: TS. BS Nguyễn Văn A</span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{item.dept}</td>
                            <td className="px-6 py-4">
                                {getStatusBadge(item.status)}
                            </td>
                            <td className="px-6 py-4 w-48">
                                <div className="flex items-center gap-2">
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${
                                            item.progress === 100 ? 'bg-green-500' : 
                                            item.status === 'Planning' ? 'bg-amber-500' : 'bg-primary-500'
                                        }`} style={{ width: `${item.progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium w-8 text-right">{item.progress}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs flex items-center gap-1">
                                <Clock size={12} /> {item.date}
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
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
            <span>Hiển thị 3/3 kế hoạch</span>
            <div className="flex gap-1">
                <button className="px-2 py-1 border border-slate-200 rounded bg-white disabled:opacity-50" disabled>Trước</button>
                <button className="px-2 py-1 border border-slate-200 rounded bg-white disabled:opacity-50" disabled>Sau</button>
            </div>
        </div>
    </div>

    <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-white rounded-lg text-primary-600 shadow-sm">
              <Target size={24} />
          </div>
          <div>
              <h3 className="font-bold text-primary-900">Kết quả đầu ra</h3>
              <p className="text-sm text-primary-700">Xem báo cáo hiệu quả các đề án cải tiến đã nghiệm thu trong năm 2024.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-primary-700 font-semibold hover:underline">
          Xem chi tiết <ArrowUpRight size={18} />
        </button>
    </div>
  </>
  );
};

// --- Sub-component: Plan Form (Kế hoạch) ---
const PlanForm = ({ onCancel }: { onCancel: () => void }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
    <div className="border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">PHIẾU ĐỀ XUẤT CẢI TIẾN CHẤT LƯỢNG</h2>
          <p className="text-xs text-slate-500">Mẫu kế hoạch PDCA</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium text-sm rounded-lg">Hủy</button>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm shadow-sm">
          <Save size={16} /> Lưu kế hoạch
        </button>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* 1. General Info */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">1</span>
          Thông tin chung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">Tên vấn đề/Đề tài cải tiến <span className="text-red-500">*</span></label>
             <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="VD: Giảm thời gian chờ xét nghiệm máu..." />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Khoa/Phòng chủ trì</label>
             <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white">
                <option>Khoa Khám bệnh</option>
                <option>Khoa Xét nghiệm</option>
                <option>Khoa Dược</option>
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Người chịu trách nhiệm</label>
             <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Họ và tên..." />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian dự kiến</label>
             <div className="flex gap-2">
               <input type="date" className="w-1/2 p-2.5 border border-slate-300 rounded-lg text-sm" />
               <span className="self-center">-</span>
               <input type="date" className="w-1/2 p-2.5 border border-slate-300 rounded-lg text-sm" />
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Kinh phí dự trù</label>
             <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="VNĐ" />
          </div>
        </div>
      </section>

      {/* 2. Problem Definition */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">2</span>
          Xác định vấn đề & Nguyên nhân (Plan)
        </h3>
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Lý do chọn đề tài (Thực trạng)</label>
             <textarea rows={3} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Mô tả tình hình hiện tại, các tồn tại, rủi ro..."></textarea>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Số liệu ban đầu (Trước cải tiến)</label>
             <textarea rows={2} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="VD: Thời gian chờ trung bình 45 phút, Tỷ lệ hài lòng 70%..."></textarea>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Phân tích nguyên nhân gốc rễ (Phương pháp 5 Whys / Xương cá)</label>
             <textarea rows={4} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" placeholder="- Nguyên nhân 1: ... &#10;- Nguyên nhân 2: ..."></textarea>
          </div>
        </div>
      </section>

      {/* 3. Goals & Solutions */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">3</span>
          Mục tiêu & Giải pháp (Do)
        </h3>
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Mục tiêu cụ thể (SMART)</label>
             <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="VD: Giảm thời gian chờ xuống dưới 30 phút..." />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Các giải pháp can thiệp dự kiến</label>
             <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-primary-600 text-white font-bold text-xs uppercase">
                    <tr>
                      <th className="p-3 border-r border-primary-500 w-12 text-center">#</th>
                      <th className="p-3 border-r border-primary-500">Nội dung giải pháp</th>
                      <th className="p-3 border-r border-primary-500 w-32">Người thực hiện</th>
                      <th className="p-3 w-32">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 text-center">1</td>
                      <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 text-sm" placeholder="Nhập giải pháp 1..." /></td>
                      <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm" /></td>
                      <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm" /></td>
                    </tr>
                    <tr>
                      <td className="p-2 text-center">2</td>
                      <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 text-sm" placeholder="Nhập giải pháp 2..." /></td>
                      <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm" /></td>
                      <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm" /></td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                  <button className="text-primary-600 text-xs font-medium hover:underline">+ Thêm dòng</button>
                </div>
             </div>
          </div>
        </div>
      </section>
      
      <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-start gap-3">
         <FileText size={18} className="mt-0.5 shrink-0" />
         <div>
           <strong>Ghi chú:</strong> Sau khi lưu, kế hoạch sẽ được gửi đến Phòng QLCL để rà soát.
         </div>
      </div>
    </div>
  </div>
);

// --- Sub-component: Report Form (Báo cáo) ---
const ReportForm = ({ onCancel }: { onCancel: () => void }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
    <div className="border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">BÁO CÁO KẾT QUẢ CẢI TIẾN</h2>
          <p className="text-xs text-slate-500">Đánh giá hiệu quả sau can thiệp (Check & Act)</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium text-sm rounded-lg">Hủy</button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm shadow-sm">
          <Save size={16} /> Nộp báo cáo
        </button>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* 1. Project Selection */}
      <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-2">Chọn đề tài/kế hoạch cần báo cáo</label>
        <select className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white">
          <option>-- Chọn đề tài đang thực hiện --</option>
          <option selected>Cải tiến quy trình cấp phát thuốc nội trú (Khoa Dược)</option>
          <option>Giảm thời gian chờ tại Khoa Khám bệnh</option>
        </select>
      </section>

      {/* 2. Implementation Results */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">1</span>
          Kết quả thực hiện (Check)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian bắt đầu</label>
              <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50" value="2024-01-01" readOnly />
           </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian kết thúc</label>
              <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
           </div>
        </div>
        
        <div className="mb-4">
           <label className="block text-sm font-medium text-slate-700 mb-2">So sánh chỉ số (Trước vs Sau)</label>
           <div className="border border-slate-200 rounded-lg overflow-hidden">
             <table className="w-full text-sm text-left">
               <thead className="bg-primary-600 text-white font-bold text-xs uppercase">
                 <tr>
                   <th className="p-3 border-r border-primary-500">Chỉ số đo lường</th>
                   <th className="p-3 border-r border-primary-500 w-32 text-white">Trước cải tiến</th>
                   <th className="p-3 border-r border-primary-500 w-32 text-white">Sau cải tiến</th>
                   <th className="p-3 w-32">Tỷ lệ thay đổi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 <tr>
                   <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 text-sm" placeholder="VD: Thời gian chờ trung bình" /></td>
                   <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-medium" /></td>
                   <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-bold text-green-700" /></td>
                   <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center" placeholder="%" /></td>
                 </tr>
                 <tr>
                   <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 text-sm" placeholder="VD: Số sự cố y khoa" /></td>
                   <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-medium" /></td>
                   <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center font-bold text-green-700" /></td>
                   <td className="p-2 border-l border-slate-100"><input type="text" className="w-full border-none focus:ring-0 text-sm text-center" placeholder="%" /></td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>
      </section>

      {/* 3. Analysis & Evaluation */}
      <section>
        <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs mr-2">2</span>
          Đánh giá & Bài học kinh nghiệm (Act)
        </h3>
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Đánh giá chung về hiệu quả</label>
             <textarea rows={3} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Đề án đã đạt được mục tiêu đề ra chưa? Những lợi ích mang lại là gì?"></textarea>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Những tồn tại/Khó khăn</label>
             <textarea rows={2} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder=""></textarea>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Bài học kinh nghiệm & Hướng phát triển tiếp theo</label>
             <textarea rows={3} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" placeholder="Cần duy trì hoạt động nào? Có mở rộng đề án không?"></textarea>
          </div>
          <div className="flex items-center gap-2 mt-2">
             <input type="checkbox" id="standardize" className="rounded text-primary-600 focus:ring-primary-500" />
             <label htmlFor="standardize" className="text-sm text-slate-700">Đề xuất chuẩn hóa thành quy trình thường quy (SOP)</label>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tài liệu minh chứng đính kèm</label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
           <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
           <p className="text-sm text-slate-500">Kéo thả file báo cáo chi tiết, hình ảnh, biểu đồ tại đây</p>
           <p className="text-xs text-slate-400 mt-1">(Hỗ trợ: .doc, .pdf, .xlsx, .jpg)</p>
        </div>
      </section>
    </div>
  </div>
);
