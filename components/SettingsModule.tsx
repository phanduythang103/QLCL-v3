import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Users, Building, Briefcase, Award, FileBadge,
  Layout, Bell, CalendarClock, ChevronRight, Plus, Edit2, Trash2, Users2,
  ShieldCheck, Save, Check, Eye, Pencil, Trash, Loader2, Copy, Search, CheckCircle2, X, QrCode
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
import Criteria83Config from './Criteria83Config';
import { SurveyPublicConfig } from './settings/SurveyPublicConfig';
import { AssessmentTeamConfig } from './settings/AssessmentTeamConfig';
import { useNavigation, SettingTab } from '../contexts/NavigationContext';
import { fetchPermissionsByRole, upsertPermissionsForUser, Permission, SUB_MODULES } from '../readPhanQuyen';
import { ChevronDown } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';


export const SettingsModule: React.FC = () => {
  const { activeSettingsTab: activeTab, setSettingsTab: setActiveTab } = useNavigation();
  const { user } = useAuth();

  // Check if user is restricted (Non-Admin)
  // Assuming 'admin' and 'quản trị' are powerful roles. 'mạng lưới' might be semi-powerful?
  // User request: "Nếu người dùng không phải là admin... ẩn tab".
  // Let's use getPermissionRoleId logic or similar.
  const isRestricted = !user?.role?.toLowerCase().includes('admin') && !user?.role?.toLowerCase().includes('quản trị');

  const menuItems = [
    { id: 'USER', label: 'Người dùng', icon: <Users size={18} />, iconClass: 'text-indigo-500', bgClass: 'bg-indigo-300' },
    { id: 'NOTI', label: 'Thông báo', icon: <Bell size={18} />, iconClass: 'text-orange-500', bgClass: 'bg-orange-300' },
    { id: 'PERMISSIONS', label: 'Phân quyền', icon: <ShieldCheck size={18} />, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-300' },
    { id: 'DEPT', label: 'Đơn vị', icon: <Building size={18} />, iconClass: 'text-sky-500', bgClass: 'bg-sky-300' },
    { id: 'POSITION', label: 'Chức vụ', icon: <Briefcase size={18} />, iconClass: 'text-purple-500', bgClass: 'bg-purple-300' },
    { id: 'RANK', label: 'Cấp bậc', icon: <Award size={18} />, iconClass: 'text-amber-500', bgClass: 'bg-amber-300' },
    { id: 'AUTHORITY', label: 'Cơ quan BH', icon: <FileBadge size={18} />, iconClass: 'text-red-500', bgClass: 'bg-red-300' },
    { id: 'SCHEDULE', label: 'Lịch giám sát', icon: <CalendarClock size={18} />, iconClass: 'text-blue-500', bgClass: 'bg-blue-300' },
    { id: 'CRITERIA83', label: 'Cấu hình 83 TC', icon: <CheckCircle2 size={18} />, iconClass: 'text-teal-500', bgClass: 'bg-teal-300' },
    { id: 'TEAM_CONFIG', label: 'Danh sách tổ chấm điểm', icon: <Users2 size={18} />, iconClass: 'text-violet-500', bgClass: 'bg-violet-300' },
    { id: 'SURVEY_PUBLIC', label: 'Khảo sát Public', icon: <QrCode size={18} />, iconClass: 'text-pink-500', bgClass: 'bg-pink-300' },
    { id: 'THEME', label: 'Giao diện', icon: <Layout size={18} />, iconClass: 'text-slate-500', bgClass: 'bg-slate-300' },
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
      case 'CRITERIA83':
        return <Criteria83Config />;
      case 'SURVEY_PUBLIC':
        return <SurveyPublicConfig />;
      case 'TEAM_CONFIG':
        return <AssessmentTeamConfig />;
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
            <h3 className="text-section font-black text-black uppercase tracking-tight">Danh mục cấu hình</h3>
          </div>

          <div className="function-icon-grid p-2 lg:hidden">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingTab)}
                className="function-icon-tile"
              >
                <span className={`function-icon-box ${item.bgClass} ${item.iconClass}`}>
                  {React.cloneElement(item.icon, { size: 28 })}
                </span>
                <span className="function-icon-label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden overflow-y-auto p-2 lg:flex lg:flex-col lg:gap-1 scrollbar-none">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingTab)}
                className={`min-w-0 flex items-center justify-between gap-2 rounded-xl border p-3 text-label font-black transition-all uppercase ${activeTab === item.id
                  ? 'bg-[#059669] text-white border-[#059669] shadow-lg shadow-green-900/20'
                  : 'text-black bg-white border-slate-200 hover:bg-slate-50 hover:text-black'
                  }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`${activeTab === item.id ? 'text-white' : 'text-black/40'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
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
        {/* Body of Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-slate-50/30 custom-scrollbar">
          {renderContent(activeTab)}
        </div>
      </div>
    </div>
  );
};

const PermissionManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  const moduleLabels: Record<string, string> = {
    DASHBOARD: 'Trang chủ / Tổng quan',
    HR: 'Quản lý Nhân sự',
    DOCS: 'Văn bản & Đào tạo',
    ASSESSMENT: 'Đánh giá Chất lượng',
    INCIDENTS: 'Sự cố Y khoa',
    IMPROVEMENT: 'Cải tiến Chất lượng',
    INDICATORS: 'Chỉ số QLCL',
    KTCM: 'KTCM theo tuyến',
    SUPERVISION: 'Kiểm tra Giám sát',
    REPORTS: 'Báo cáo Tổng hợp',
    SETTINGS: 'Cấu hình Hệ thống',
  };

  const allModules = Object.keys(moduleLabels);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const { fetchUsers } = await import('../readUsers');
        const data = await fetchUsers();
        setUsers(data || []);
        if (data && data.length > 0) setSelectedUserId(data[0].id);
      } catch (err) {
        console.error('Error loading users:', err);
      }
      setLoadingUsers(false);
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    const load = async () => {
      setLoadingPerms(true);
      try {
        const data = await fetchPermissionsByRole(selectedUserId);
        setPermissions(data);
      } catch (err) {
        console.error('Error loading permissions:', err);
      }
      setLoadingPerms(false);
    };
    load();
  }, [selectedUserId]);

  const getPerm = (module: string, subModule?: string | null) => {
    const key = subModule ?? null;
    const found = permissions.find(p => p.module === module && (p.sub_module ?? null) === key);
    // Default: all users can view everything unless explicitly denied
    return found || { can_view: true, can_create: false, can_update: false, can_delete: false };
  };

  const setPerm = (module: string, subModule: string | null, field: keyof Pick<Permission, 'can_view'|'can_create'|'can_update'|'can_delete'>, value: boolean) => {
    setPermissions(prev => {
      // Update the target row (module or sub-module)
      const updateRow = (arr: Permission[], mod: string, sub: string | null): Permission[] => {
        const idx = arr.findIndex(p => p.module === mod && (p.sub_module ?? null) === sub);
        if (idx >= 0) {
          const next = [...arr];
          next[idx] = { ...next[idx], [field]: value };
          return next;
        }
        return [...arr, {
          id: '', role_id: selectedUserId!, module: mod, sub_module: sub,
          can_view: field === 'can_view' ? value : true,
          can_create: field === 'can_create' ? value : false,
          can_update: field === 'can_update' ? value : false,
          can_delete: field === 'can_delete' ? value : false,
        }];
      };

      let updated = updateRow(prev, module, subModule);

      // If changing a parent module (subModule === null), cascade to all sub-modules
      if (subModule === null) {
        const subs = SUB_MODULES[module] || [];
        subs.forEach(sub => {
          updated = updateRow(updated, module, sub.id);
        });
      }

      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const toSave: any[] = [];
      allModules.forEach(module => {
        toSave.push({ module, sub_module: null, ...getPerm(module, null) });
        (SUB_MODULES[module] || []).forEach(sub => {
          toSave.push({ module, sub_module: sub.id, ...getPerm(module, sub.id) });
        });
      });
      await upsertPermissionsForUser(selectedUserId, toSave);
      setMessage('Lưu thành công!');
    } catch (err) {
      console.error('Error saving permissions:', err);
      setMessage('Lỗi khi lưu');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleConfirmCopy = async (targetUserIds: string[]) => {
    if (!selectedUserId || targetUserIds.length === 0) return;
    setCopying(true);
    try {
      // 1. Lấy quyền của người nguồn (đã có trong state 'permissions')
      // 2. Lấy toàn bộ quyền hiện tại của các người dùng đích để merge
      const { data: targetPermsData, error: fetchError } = await supabase
        .from('phan_quyen')
        .select('*')
        .in('role_id', targetUserIds);

      if (fetchError) throw fetchError;

      // Nhóm quyền theo người dùng để xử lý từng người
      const permsByUser: Record<string, Permission[]> = {};
      targetPermsData?.forEach((p: Permission) => {
        if (!permsByUser[p.role_id]) permsByUser[p.role_id] = [];
        permsByUser[p.role_id].push(p);
      });

      // Hàm merge logic: Giữ nguyên quyền cũ, nếu quyền mới là TRUE thì ghi đè thành TRUE
      const merge = (oldVal: boolean, newVal: boolean) => oldVal || newVal;

      await Promise.all(targetUserIds.map(async (uid) => {
        const userExistingPerms = permsByUser[uid] || [];
        const toSave: any[] = [];

        allModules.forEach(module => {
          // Xử lý module cha
          const sourceMPerm = getPerm(module, null); // Lấy từ state 'permissions' của người đang chọn
          const targetMPermRow = userExistingPerms.find(p => p.module === module && !p.sub_module);

          toSave.push({
            module,
            sub_module: null,
            can_view: merge(targetMPermRow?.can_view ?? true, sourceMPerm.can_view), // Mặc định view là true
            can_create: merge(targetMPermRow?.can_create ?? false, sourceMPerm.can_create),
            can_update: merge(targetMPermRow?.can_update ?? false, sourceMPerm.can_update),
            can_delete: merge(targetMPermRow?.can_delete ?? false, sourceMPerm.can_delete)
          });

          // Xử lý sub-modules
          (SUB_MODULES[module] || []).forEach(sub => {
            const sourceSPerm = getPerm(module, sub.id);
            const targetSPermRow = userExistingPerms.find(p => p.module === module && p.sub_module === sub.id);

            toSave.push({
              module,
              sub_module: sub.id,
              can_view: merge(targetSPermRow?.can_view ?? true, sourceSPerm.can_view),
              can_create: merge(targetSPermRow?.can_create ?? false, sourceSPerm.can_create),
              can_update: merge(targetSPermRow?.can_update ?? false, sourceSPerm.can_update),
              can_delete: merge(targetSPermRow?.can_delete ?? false, sourceSPerm.can_delete)
            });
          });
        });

        await upsertPermissionsForUser(uid, toSave);
      }));

      setMessage(`Đã ghi thêm quyền cho ${targetUserIds.length} người dùng!`);
      setIsCopyModalOpen(false);
    } catch (err) {
      console.error('Error copying permissions:', err);
      setMessage('Lỗi khi sao chép quyền');
    } finally {
      setCopying(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleExpand = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    if (role?.toLowerCase().includes('quản trị') || role?.toLowerCase().includes('admin')) return 'bg-red-100 text-red-700';
    if (role?.toLowerCase().includes('hội đồng')) return 'bg-purple-100 text-purple-700';
    if (role?.toLowerCase().includes('mạng lưới')) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  const FIELDS: (keyof Pick<Permission, 'can_view'|'can_create'|'can_update'|'can_delete'>)[] = ['can_view', 'can_create', 'can_update', 'can_delete'];
  const FIELD_LABELS = { can_view: 'Xem', can_create: 'Thêm', can_update: 'Sửa', can_delete: 'Xóa' };

  return (
    <div className="flex h-full min-h-[600px] flex-col gap-4 lg:flex-row">
      <div className="w-full max-h-[280px] shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm lg:w-64 lg:max-h-none">
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <input type="text" placeholder="Tìm người dùng..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loadingUsers ? (
            <div className="p-6 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" size={24} /></div>
          ) : filteredUsers.map(u => (
            <button key={u.id} onClick={() => setSelectedUserId(u.id)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-slate-50 ${selectedUserId === u.id ? 'bg-green-50 border-l-4 border-[#059669]' : 'border-l-4 border-transparent'}`}>
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-black text-slate-500">{u.full_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] font-black truncate ${selectedUserId === u.id ? 'text-[#059669]' : 'text-slate-800'}`}>{u.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">{u.department || 'Chưa có đơn vị'}</p>
                <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${getRoleBadge(u.role)}`}>{u.role}</span>
              </div>
            </button>
          ))}
          {filteredUsers.length === 0 && !loadingUsers && (
            <div className="p-8 text-center text-slate-300 text-xs font-bold">Không tìm thấy</div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {message && (
          <div className={`p-3 rounded-lg text-sm font-bold ${message.includes('Lỗi') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>
        )}

        {selectedUser ? (
          <>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm sm:flex-row sm:items-center">
              <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {selectedUser.avatar ? <img src={selectedUser.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-base font-black text-slate-500">{selectedUser.full_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{selectedUser.full_name}</p>
                <p className="text-xs text-slate-400 font-bold">{selectedUser.department} · {selectedUser.role}</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
                <button
                  onClick={() => setIsCopyModalOpen(true)}
                  disabled={saving || loadingPerms}
                  className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                >
                  <Copy size={14} /> Sao chép cho người khác
                </button>
                <button onClick={handleSave} disabled={saving || loadingPerms}
                  className="flex items-center justify-center gap-2 bg-[#059669] text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all shadow-lg hover:bg-[#0d6e39] disabled:opacity-50">
                  {saving ? <><Loader2 className="animate-spin" size={14} />Đang lưu...</> : <><Save size={14} />Lưu quyền</>}
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto shadow-sm flex-1 custom-scrollbar">
              {loadingPerms ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-[#059669]" size={28} /></div>
              ) : (
                <table className="w-full min-w-[640px] text-left">
                  <thead className="bg-[#059669] text-white font-black uppercase text-[10px] tracking-widest sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3">Module / Chức năng</th>
                      {FIELDS.map(f => <th key={f} className="px-4 py-3 text-center w-16">{FIELD_LABELS[f]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {allModules.map(module => {
                      const mPerm = getPerm(module, null);
                      const subs = SUB_MODULES[module] || [];
                      const isExpanded = expandedModules.has(module);

                      return (
                        <React.Fragment key={module}>
                          <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors bg-slate-50/40">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                {subs.length > 0 && (
                                  <button onClick={() => toggleExpand(module)}
                                    className="p-0.5 rounded hover:bg-slate-200 transition-colors text-slate-400">
                                    <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                )}
                                <div>
                                  <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{moduleLabels[module]}</span>
                                  {subs.length > 0 && (
                                    <span className="ml-2 text-[9px] text-slate-400 font-bold">{subs.length} chức năng con</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            {FIELDS.map(field => (
                              <td key={field} className="px-4 py-3">
                                <div className="flex justify-center">
                                  <PermissionCheckbox checked={!!mPerm[field]}
                                    onChange={val => setPerm(module, null, field, val)} disabled={saving} />
                                </div>
                              </td>
                            ))}
                          </tr>

                          {isExpanded && subs.map(sub => {
                            const sPerm = getPerm(module, sub.id);
                            return (
                              <tr key={sub.id} className="border-b border-slate-50 hover:bg-green-50/30 transition-colors">
                                <td className="pl-12 pr-5 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-[#059669]/40" />
                                    <span className="text-[11px] font-bold text-slate-600">{sub.label}</span>
                                  </div>
                                </td>
                                {FIELDS.map(field => (
                                  <td key={field} className="px-4 py-2.5">
                                    <div className="flex justify-center">
                                      <PermissionCheckbox checked={!!sPerm[field]}
                                        onChange={val => setPerm(module, sub.id, field, val)} disabled={saving} />
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg flex gap-3 items-start">
              <ShieldCheck className="text-primary-600 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] font-bold text-primary-700 uppercase tracking-wider">
                <strong>Lưu ý:</strong> Quyền module cha kiểm soát truy cập tổng thể. Quyền chức năng con kiểm soát từng tab riêng biệt. Thay đổi có hiệu lực sau khi người dùng tải lại trang.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
            <ShieldCheck size={48} />
            <p className="font-bold uppercase tracking-widest text-xs">Chọn người dùng để cấu hình quyền</p>
          </div>
        )}
      </div>

      {isCopyModalOpen && (
        <CopyPermissionsModal
          users={users.filter(u => u.id !== selectedUserId)}
          onClose={() => setIsCopyModalOpen(false)}
          onConfirm={handleConfirmCopy}
          loading={copying}
          sourceName={selectedUser?.full_name || ""}
        />
      )}
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

const CopyPermissionsModal = ({ users, onClose, onConfirm, loading, sourceName }: any) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const filtered = users.filter((u: any) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((u: any) => u.id));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Sao chép phân quyền</h3>
            <p className="text-xs text-slate-500 font-bold">Sao chép từ: <span className="text-primary-600 font-black">{sourceName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng nhận quyền..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <button
              onClick={toggleAll}
              className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-wider"
            >
              {selected.length === filtered.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả kết quả'}
            </button>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Đã chọn: <span className="text-primary-600 font-black">{selected.length}</span> người dùng
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar divide-y divide-slate-50">
          {filtered.map((u: any) => (
            <div
              key={u.id}
              onClick={() => toggleUser(u.id)}
              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all hover:bg-slate-50 ${
                selected.includes(u.id) ? 'bg-primary-50/50' : ''
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                selected.includes(u.id) ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'
              }`}>
                {selected.includes(u.id) && <Check size={12} strokeWidth={4} />}
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xs font-black text-slate-500">{u.full_name?.[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{u.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold truncate">{u.department} · {u.role}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-slate-300 italic font-medium">Không tìm thấy người dùng phù hợp</div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-white transition-all uppercase tracking-wider"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={loading || selected.length === 0}
            className="flex-[2] flex items-center justify-center gap-2 bg-[#059669] text-white px-4 py-3 rounded-xl text-sm font-black uppercase transition-all shadow-lg hover:bg-[#0d6e39] disabled:opacity-50 disabled:scale-100 active:scale-95 tracking-wider"
          >
            {loading ? <><Loader2 className="animate-spin" size={18} /> Đang sao chép...</> : <><CheckCircle2 size={18} /> Xác nhận sao chép</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = ({ tab }: { tab: SettingTab }) => {
  switch (tab) {
    case 'USER': return <Users size={32} />;
    case 'DEPT': return <Building size={32} />;
    case 'SCHEDULE': return <CalendarClock size={32} />;
    case 'PERMISSIONS': return <ShieldCheck size={32} />;
    case 'NOTI': return <Bell size={32} />;
    case 'CRITERIA83': return <CheckCircle2 size={32} />;
    default: return <Layout size={32} />;
  }
}
