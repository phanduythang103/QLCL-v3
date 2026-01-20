import React, { useState } from 'react';
import { 
  Users, Building, Briefcase, Award, FileBadge, 
  Layout, Bell, CalendarClock, ChevronRight, Plus, Edit2, Trash2,
  ShieldCheck, Save, Check, Eye, Pencil, Trash
} from 'lucide-react';
import { ModuleType } from '../types';

type SettingTab = 'USER' | 'DEPT' | 'POSITION' | 'ROLE' | 'PERMISSIONS' | 'AUTHORITY' | 'THEME' | 'NOTI' | 'SCHEDULE';

export const SettingsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTab>('USER');

  const menuItems = [
    { id: 'USER', label: 'Quản lý người dùng', icon: <Users size={18} /> },
    { id: 'PERMISSIONS', label: 'Phân quyền Module', icon: <ShieldCheck size={18} /> },
    { id: 'DEPT', label: 'Danh mục Đơn vị', icon: <Building size={18} /> },
    { id: 'POSITION', label: 'Danh mục Chức vụ', icon: <Briefcase size={18} /> },
    { id: 'ROLE', label: 'Danh mục Vai trò QLCL', icon: <Award size={18} /> },
    { id: 'AUTHORITY', label: 'Cơ quan ban hành', icon: <FileBadge size={18} /> },
    { id: 'THEME', label: 'Cài đặt giao diện', icon: <Layout size={18} /> },
    { id: 'NOTI', label: 'Quản lý thông báo', icon: <Bell size={18} /> },
    { id: 'SCHEDULE', label: 'Quản lý lịch giám sát', icon: <CalendarClock size={18} /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Settings Sidebar */}
      <div className="w-full md:w-64 bg-white rounded-xl border border-slate-200 shadow-sm flex-shrink-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Danh mục cấu hình</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SettingTab)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                activeTab === item.id 
                  ? 'bg-primary-50 text-primary-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         {/* Header of Content */}
         <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-slate-500">Thiết lập và quản lý dữ liệu danh mục hệ thống.</p>
            </div>
            {activeTab === 'PERMISSIONS' ? (
              <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors shadow-sm">
                <Save size={16} /> Lưu cấu hình
              </button>
            ) : activeTab !== 'THEME' && (
              <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors shadow-sm">
                <Plus size={16} /> Thêm mới
              </button>
            )}
         </div>

         {/* Body of Content */}
         <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
            {renderContent(activeTab)}
         </div>
      </div>
    </div>
  );
};

const PermissionManager = () => {
  const roles = [
    { id: 'admin', name: 'Quản trị hệ thống' },
    { id: 'council', name: 'Hội đồng QLCL' },
    { id: 'network', name: 'Mạng lưới QLCL' },
    { id: 'staff', name: 'Nhân viên Khoa/Phòng' },
  ];

  const [selectedRole, setSelectedRole] = useState('network');

  // Map ModuleType to Readable Name
  const moduleLabels: Record<ModuleType, string> = {
    [ModuleType.DASHBOARD]: 'Trang chủ / Tổng quan',
    [ModuleType.HR]: 'Quản lý Nhân sự',
    [ModuleType.DOCS]: 'Văn bản & Đào tạo',
    [ModuleType.ASSESSMENT]: 'Đánh giá Chất lượng',
    [ModuleType.INCIDENTS]: 'Sự cố Y khoa',
    [ModuleType.IMPROVEMENT]: 'Cải tiến Chất lượng',
    [ModuleType.INDICATORS]: 'Chỉ số QLCL',
    [ModuleType.SUPERVISION]: 'Kiểm tra Giám sát',
    [ModuleType.REPORTS]: 'Báo cáo Tổng hợp',
    [ModuleType.SETTINGS]: 'Cấu hình Hệ thống',
  };

  return (
    <div className="space-y-6">
      {/* Role Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              selectedRole === role.id
                ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
            }`}
          >
            {role.name}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Module hệ thống</th>
              <th className="px-6 py-4 text-center">Xem</th>
              <th className="px-6 py-4 text-center">Thêm</th>
              <th className="px-6 py-4 text-center">Sửa</th>
              <th className="px-6 py-4 text-center">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.values(ModuleType).map((module) => (
              <tr key={module} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-700">{moduleLabels[module]}</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{module}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <PermissionCheckbox defaultChecked={true} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <PermissionCheckbox defaultChecked={module !== ModuleType.SETTINGS} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <PermissionCheckbox defaultChecked={selectedRole === 'admin' || selectedRole === 'network'} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <PermissionCheckbox defaultChecked={selectedRole === 'admin'} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg flex gap-3 items-start">
        <ShieldCheck className="text-primary-600 shrink-0" size={20} />
        <p className="text-xs text-primary-700 leading-relaxed">
          <strong>Lưu ý:</strong> Quyền <strong>Xóa</strong> là quyền nhạy cảm, chỉ nên cấp cho các tài khoản có trách nhiệm cao. 
          Các thay đổi về phân quyền sẽ có hiệu lực ngay sau khi người dùng tải lại trang.
        </p>
      </div>
    </div>
  );
};

const PermissionCheckbox = ({ defaultChecked }: { defaultChecked: boolean }) => {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${
        checked 
          ? 'bg-primary-600 border-primary-600 text-white' 
          : 'bg-white border-slate-200 text-transparent hover:border-primary-300'
      }`}
    >
      <Check size={14} strokeWidth={3} />
    </button>
  );
};

const renderContent = (tab: SettingTab) => {
  switch (tab) {
    case 'PERMISSIONS':
      return <PermissionManager />;
    case 'USER':
      return <GenericTable columns={['Tài khoản', 'Họ và tên', 'Khoa/Phòng', 'Vai trò', 'Trạng thái']} 
        data={[
          ['admin', 'Nguyễn Văn A', 'Ban QLCL', 'Quản trị viên', 'Hoạt động'],
          ['user1', 'Trần Thị B', 'Khoa Nội', 'Người dùng', 'Hoạt động'],
          ['user2', 'Lê Văn C', 'Khoa Ngoại', 'Người dùng', 'Khóa'],
        ]} />;
    case 'DEPT':
      return <GenericTable columns={['Mã ĐV', 'Tên đơn vị', 'Loại hình', 'Trưởng đơn vị', 'Ghi chú']} 
        data={[
          ['K01', 'Khoa Nội Tiêu hóa', 'Lâm sàng', 'TS. Lê Văn C', ''],
          ['K02', 'Khoa Ngoại Dã chiến', 'Lâm sàng', 'ThS. Hoàng Văn E', ''],
          ['P01', 'Phòng Kế hoạch tổng hợp', 'Chức năng', 'Đại tá Nguyễn Văn X', ''],
        ]} />;
    case 'POSITION':
       return <GenericTable columns={['Mã CV', 'Tên chức vụ', 'Mô tả', 'Thứ tự hiển thị']} 
        data={[
          ['GD', 'Giám đốc', 'Lãnh đạo cao nhất', '1'],
          ['PGD', 'Phó Giám đốc', 'Ban Giám đốc', '2'],
          ['TK', 'Chủ nhiệm khoa', 'Lãnh đạo khoa', '3'],
        ]} />;
    case 'SCHEDULE':
       return (
         <div className="space-y-4">
           <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm mb-4">
             <p>Cấu hình lịch giám sát định kỳ cho các khoa phòng. Hệ thống sẽ tự động gửi thông báo nhắc nhở.</p>
           </div>
           <GenericTable columns={['Tên đợt giám sát', 'Tần suất', 'Đối tượng', 'Ngày bắt đầu', 'Trạng thái']} 
             data={[
               ['Giám sát Vệ sinh tay', 'Hàng tuần', 'Toàn viện', '01/01/2024', 'Đang chạy'],
               ['Kiểm tra Hồ sơ bệnh án', 'Hàng tháng', 'Khối Nội', '15/06/2024', 'Sắp tới'],
             ]} />
         </div>
       );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
             <SettingsIcon tab={tab} />
           </div>
           <p>Tính năng đang được cập nhật cho mục này.</p>
        </div>
      );
  }
};

const GenericTable = ({ columns, data }: { columns: string[], data: string[][] }) => (
  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
    <table className="w-full text-sm text-left">
      <thead className="bg-primary-600 text-white font-bold uppercase text-xs border-b border-primary-700">
        <tr>
          <th className="px-6 py-4 w-12 text-center">#</th>
          {columns.map((col, idx) => <th key={idx} className="px-6 py-4">{col}</th>)}
          <th className="px-6 py-4 text-right">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {data.map((row, rIdx) => (
          <tr key={rIdx} className="hover:bg-slate-50">
            <td className="px-6 py-4 text-center text-slate-500">{rIdx + 1}</td>
            {row.map((cell, cIdx) => (
              <td key={cIdx} className="px-6 py-4 text-slate-700">{cell}</td>
            ))}
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Edit2 size={16} /></button>
                <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SettingsIcon = ({ tab }: { tab: SettingTab }) => {
   switch(tab) {
     case 'USER': return <Users size={32} />;
     case 'DEPT': return <Building size={32} />;
     case 'SCHEDULE': return <CalendarClock size={32} />;
     case 'PERMISSIONS': return <ShieldCheck size={32} />;
     default: return <Layout size={32} />;
   }
}