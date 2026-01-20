import React, { useState, useRef } from 'react';
import { 
  Plus, User, Search, Filter, Phone, Award, Users, 
  FileSpreadsheet, Download, Upload, MoreHorizontal 
} from 'lucide-react';
import { Personnel, QARoleType } from '../types';

const MOCK_STAFF: Personnel[] = [
  { id: '1', name: 'Nguyễn Văn A', rank: 'Thiếu tướng', position: 'Giám đốc Bệnh viện', department: 'Ban Giám đốc', hasCertificate: true, phone: '0988.111.222', qaRoles: ['COUNCIL'] },
  { id: '2', name: 'Trần Thị B', rank: 'Đại tá', position: 'Trưởng ban QLCL', department: 'Ban QLCL', hasCertificate: true, phone: '0912.333.444', qaRoles: ['COUNCIL', 'BOARD'] },
  { id: '3', name: 'Lê Văn C', rank: 'Thượng tá', position: 'Chủ nhiệm khoa', department: 'Khoa Nội Tiêu hóa', hasCertificate: true, phone: '0909.555.666', qaRoles: ['COUNCIL', 'NETWORK'] },
  { id: '4', name: 'Phạm Thị D', rank: 'Đại úy', position: 'Trợ lý QLCL', department: 'Ban QLCL', hasCertificate: true, phone: '0977.888.999', qaRoles: ['BOARD'] },
  { id: '5', name: 'Hoàng Văn E', rank: 'Thiếu tá', position: 'Điều dưỡng trưởng', department: 'Khoa Ngoại Dã chiến', hasCertificate: false, phone: '0911.222.333', qaRoles: ['NETWORK'] },
  { id: '6', name: 'Vũ Thị F', rank: 'Trung tá', position: 'Kỹ thuật viên trưởng', department: 'Khoa Xét nghiệm', hasCertificate: true, phone: '0989.000.111', qaRoles: ['NETWORK'] },
  { id: '7', name: 'Đặng Văn G', rank: 'Đại tá', position: 'Phó Giám đốc', department: 'Ban Giám đốc', hasCertificate: true, phone: '0988.999.888', qaRoles: ['COUNCIL'] },
];

export const HRModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | QARoleType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStaff = MOCK_STAFF.filter(staff => {
    const matchesTab = activeTab === 'ALL' || staff.qaRoles.includes(activeTab as QARoleType);
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          staff.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Giả lập quá trình đọc file Excel
      alert(`Hệ thống đang tải lên và xử lý file: ${file.name}\nDữ liệu nhân sự sẽ được cập nhật sau giây lát.`);
    }
  };

  const handleExportExcel = () => {
    alert("Đang chuẩn bị dữ liệu kết xuất Excel...");
    // Logic xuất file thực tế sẽ được tích hợp tại đây
  };

  const getRoleBadge = (role: QARoleType) => {
    switch(role) {
      case 'COUNCIL': return <span key="council" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Hội đồng</span>;
      case 'BOARD': return <span key="board" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800 border border-primary-200">Ban QLCL</span>;
      case 'NETWORK': return <span key="network" className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Mạng lưới</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Excel Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Nhân sự & Mạng lưới QLCL</h2>
          <p className="text-sm text-slate-500">Cập nhật thông tin Hội đồng, Ban chuyên trách và Mạng lưới viên.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={handleExportExcel}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} /> Xuất Excel
          </button>
          <button 
            onClick={handleImportClick}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
          >
            <Upload size={16} /> Nhập Excel
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors shadow-sm">
            <Plus size={16} /> Thêm nhân sự
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
         {[
           { id: 'ALL', label: 'Tất cả nhân sự' },
           { id: 'COUNCIL', label: 'Hội đồng QLCLBV' },
           { id: 'BOARD', label: 'Ban QLCLBV (Chuyên trách)' },
           { id: 'NETWORK', label: 'Mạng lưới QLCLBV' },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
               activeTab === tab.id 
                 ? 'bg-primary-900 text-white shadow-sm' 
                 : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, khoa phòng..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
           </div>
           <div className="flex gap-2">
             <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white text-sm bg-white">
               <Filter size={16} /> Lọc nâng cao
             </button>
             <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white text-sm bg-white">
               <Award size={16} /> Chỉ hiện có chứng chỉ
             </button>
           </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="bg-primary-600 text-white font-bold border-b border-primary-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Họ và tên / Cấp bậc</th>
                <th className="px-6 py-4">Chức vụ / Đơn vị</th>
                <th className="px-6 py-4">Vai trò QLCL</th>
                <th className="px-6 py-4">Số điện thoại</th>
                <th className="px-6 py-4 text-center">Chứng chỉ QLCL</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-primary-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-base">{staff.name}</p>
                        <p className="text-xs font-medium text-primary-600 bg-primary-50 inline-block px-1.5 rounded mt-0.5">{staff.rank}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{staff.position}</p>
                    <p className="text-xs text-slate-500">{staff.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {staff.qaRoles.map(role => getRoleBadge(role))}
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                       <Phone size={14} className="text-slate-400" />
                       <span className="font-mono">{staff.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {staff.hasCertificate ? (
                      <div className="flex flex-col items-center">
                         <CheckIcon />
                         <span className="text-[10px] text-green-600 font-medium mt-1">Đã có</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                         <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                           <span className="block w-2 h-2 rounded-full bg-slate-300"></span>
                         </span>
                         <span className="text-[10px] text-slate-400 font-medium mt-1">Chưa có</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary-600 p-2 rounded transition-colors" title="Chỉnh sửa">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                   <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                      Không tìm thấy nhân sự nào phù hợp với bộ lọc.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
           <span>Hiển thị {filteredStaff.length} nhân sự</span>
           <div className="flex gap-1">
              <button className="px-3 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-50" disabled>Trước</button>
              <button className="px-3 py-1 border rounded bg-white hover:bg-slate-100">Sau</button>
           </div>
        </div>
      </div>
      
      {/* Excel Info Banner */}
      <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl flex gap-3 items-center">
          <FileSpreadsheet className="text-primary-600 shrink-0" size={24} />
          <div className="text-sm">
             <p className="text-primary-900 font-bold">Hỗ trợ định dạng Excel (.xlsx)</p>
             <p className="text-primary-700">Tải xuống <strong>tệp mẫu</strong> để đảm bảo dữ liệu nhập vào chính xác với hệ thống.</p>
          </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </span>
);