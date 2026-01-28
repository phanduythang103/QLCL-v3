import React, { useState, useEffect } from 'react';
import {
  Users, Building, Briefcase, Award, FileBadge,
  Layout, Bell, CalendarClock, ChevronRight, Plus, Edit2, Trash2,
  ShieldCheck, Save, Check, Eye, Pencil, Trash, Loader2
} from 'lucide-react';
import { ModuleType } from '../types';
import UsersTable from './settings/UsersTable';
import DeptTable from './settings/DeptTable';
import PositionTable from './settings/PositionTable';
import RankTable from './settings/RankTable';
import RoleTable from './settings/RoleTable';
import ScheduleTable from './settings/ScheduleTable';
import AuthorityTable from './settings/AuthorityTable';
import ThemeSettings from './settings/ThemeSettings';
import NotificationTable from './settings/NotificationTable';
import { useNavigation } from '../contexts/NavigationContext';
import { fetchPermissionsByRole, updatePermissionsForRole, Permission } from '../readPhanQuyen';
import { useAuth } from '../contexts/AuthContext';

type SettingTab = 'USER' | 'DEPT' | 'POSITION' | 'RANK' | 'ROLE' | 'PERMISSIONS' | 'AUTHORITY' | 'THEME' | 'NOTI' | 'SCHEDULE';

export const SettingsModule: React.FC = () => {
  const { activeSettingsTab: activeTab, setSettingsTab: setActiveTab } = useNavigation();
  const { user } = useAuth();

  // Check if user is restricted (Non-Admin)
  // Assuming 'admin' and 'quản trị' are powerful roles. 'mạng lưới' might be semi-powerful?
  // User request: "Nếu người dùng không phải là admin... ẩn tab".
  // Let's use getPermissionRoleId logic or similar.
  const isRestricted = !user?.role?.toLowerCase().includes('admin') && !user?.role?.toLowerCase().includes('quản trị');

  const menuItems = [
    { id: 'USER', label: 'Người dùng', icon: <Users size={18} /> },
    { id: 'NOTI', label: 'Thông báo', icon: <Bell size={18} /> },
    { id: 'PERMISSIONS', label: 'Phân quyền', icon: <ShieldCheck size={18} /> },
    { id: 'DEPT', label: 'Đơn vị', icon: <Building size={18} /> },
    { id: 'POSITION', label: 'Chức vụ', icon: <Briefcase size={18} /> },
    { id: 'RANK', label: 'Cấp bậc', icon: <Award size={18} /> },
    { id: 'AUTHORITY', label: 'Cơ quan BH', icon: <FileBadge size={18} /> },
    { id: 'SCHEDULE', label: 'Lịch giám sát', icon: <CalendarClock size={18} /> },
    { id: 'THEME', label: 'Giao diện', icon: <Layout size={18} /> },
  ];

  /* ... renderContent function ... */
  const renderContent = (tab: SettingTab) => {
    switch (tab) {
      case 'PERMISSIONS':
        return <PermissionManager />;
      case 'USER':
        return <UsersTable />;
      case 'NOTI':
        return <NotificationTable />;
      case 'DEPT':
        return <DeptTable />;
      case 'POSITION':
        return <PositionTable />;
      case 'RANK':
        return <RankTable />;
      case 'ROLE':
        return <RoleTable />;
      case 'AUTHORITY':
        return <AuthorityTable />;
      case 'SCHEDULE':
        return <ScheduleTable />;
      case 'THEME':
        return <ThemeSettings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
              <SettingsIcon tab={tab} />
            </div>
            <p className="font-bold text-slate-300 uppercase tracking-widest text-xs">Sắp ra mắt</p>
            <p className="text-sm mt-1">Tính năng đang được cập nhật cho mục này.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-140px)]">
      {/* Mobile: Horizontal Menu | Desktop: Vertical Sidebar */}
      {!isRestricted && (
        <div className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0 overflow-hidden flex flex-col">
          <div className="hidden lg:block p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Danh mục cấu hình</h3>
          </div>

          {/* Horizontal scroll on mobile, vertical on desktop */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto p-2 scrollbar-none">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingTab)}
                className={`flex-shrink-0 lg:w-full flex items-center lg:justify-between px-4 py-3 lg:p-3 rounded-xl text-xs lg:text-sm font-bold transition-all mr-2 lg:mr-0 lg:mb-1 border-2 ${activeTab === item.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-900/20'
                  : 'text-slate-500 bg-white border-transparent hover:bg-slate-50 hover:text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`${activeTab === item.id ? 'text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                <div className="hidden lg:block">
                  {activeTab === item.id && <ChevronRight size={16} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[500px]">
        {/* Header of Content */}
        <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="lg:hidden p-2 bg-primary-50 text-primary-600 rounded-lg">
                {menuItems.find(i => i.id === activeTab)?.icon}
              </span>
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-xs lg:text-sm text-slate-400 font-medium">Cấu hình chi tiết cho phần quản lý {menuItems.find(i => i.id === activeTab)?.label.toLowerCase()}.</p>
          </div>
        </div>

        {/* Body of Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-slate-50/30 custom-scrollbar">
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
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  // Load permissions when role changes
  useEffect(() => {
    loadPermissions();
  }, [selectedRole]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await fetchPermissionsByRole(selectedRole);
      setPermissions(data);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setMessage('Lỗi khi tải phân quyền');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const getPermission = (module: string) => {
    return permissions.find(p => p.module === module) || {
      can_view: true,
      can_create: false,
      can_update: false,
      can_delete: false,
    };
  };

  const updatePermission = (module: string, field: 'can_view' | 'can_create' | 'can_update' | 'can_delete', value: boolean) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module === module);
      if (existing) {
        return prev.map(p => p.module === module ? { ...p, [field]: value } : p);
      } else {
        return [...prev, {
          id: '',
          role_id: selectedRole,
          module,
          can_view: field === 'can_view' ? value : true,
          can_create: field === 'can_create' ? value : false,
          can_update: field === 'can_update' ? value : false,
          can_delete: field === 'can_delete' ? value : false,
        }];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissionsToUpdate = permissions.map(p => ({
        module: p.module,
        can_view: p.can_view,
        can_create: p.can_create,
        can_update: p.can_update,
        can_delete: p.can_delete,
      }));

      await updatePermissionsForRole(selectedRole, permissionsToUpdate);
      setMessage('Lưu cấu hình thành công!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage('Lỗi khi lưu cấu hình');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary-600" size={32} />
        <span className="ml-3 text-slate-600">Đang tải phân quyền...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            disabled={saving}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedRole === role.id
              ? 'bg-primary-600 text-white border-primary-600 shadow-md'
              : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {role.name}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
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
            {Object.values(ModuleType).map((module) => {
              const perm = getPermission(module);
              return (
                <tr key={module} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{moduleLabels[module]}</span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{module}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={perm.can_view}
                        onChange={(val) => updatePermission(module, 'can_view', val)}
                        disabled={saving}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={perm.can_create}
                        onChange={(val) => updatePermission(module, 'can_create', val)}
                        disabled={saving}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={perm.can_update}
                        onChange={(val) => updatePermission(module, 'can_update', val)}
                        disabled={saving}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <PermissionCheckbox
                        checked={perm.can_delete}
                        onChange={(val) => updatePermission(module, 'can_delete', val)}
                        disabled={saving}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 text-sm font-bold transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Đang lưu...
            </>
          ) : (
            <>
              <Save size={18} />
              Lưu cấu hình
            </>
          )}
        </button>
        <button
          onClick={loadPermissions}
          disabled={saving}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-200 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tải lại
        </button>
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

const PermissionCheckbox = ({
  checked,
  onChange,
  disabled = false
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-6 h-6 rounded flex items-center justify-center transition-all border-2 ${checked
        ? 'bg-primary-600 border-primary-600 text-white'
        : 'bg-white border-slate-200 text-transparent hover:border-primary-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Check size={14} strokeWidth={3} />
    </button>
  );
};

const SettingsIcon = ({ tab }: { tab: SettingTab }) => {
  switch (tab) {
    case 'USER': return <Users size={32} />;
    case 'DEPT': return <Building size={32} />;
    case 'SCHEDULE': return <CalendarClock size={32} />;
    case 'PERMISSIONS': return <ShieldCheck size={32} />;
    case 'NOTI': return <Bell size={32} />;
    default: return <Layout size={32} />;
  }
}