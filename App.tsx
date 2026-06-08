import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, AlertTriangle, TrendingUp, BarChart2, CheckSquare, FileText, Menu, Bell, Search, ChevronDown, Settings, X, LogOut, Activity, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { ModuleType, UserRole, SupervisionCategory } from './types';
import { Dashboard } from './components/Dashboard';
import { Incidents } from './components/Incidents';
import { Supervision } from './components/Supervision';
import { HRModule } from './components/HRModule';
import { DocsModule } from './components/DocsModule';
import { AssessmentModule } from './components/Assessment';
import { ImprovementModule } from './components/ImprovementModule';
import { IndicatorsModule } from './components/IndicatorsModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { SupervisionProvider, useSupervision } from './components/SupervisionContext';
import { HeaderUserMenu } from './components/HeaderUserMenu';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { fetchUnreadNotifications, markNotificationAsRead, subscribeToNotifications, Notification } from './notificationApi';
import { PermissionsProvider, usePermissions } from './contexts/PermissionsContext';
import { IndicatorsProvider, useIndicators } from './components/IndicatorsContext';
import { IndicatorCategory } from './types';

// --- Reusable Nav Item ---
const NavItem = ({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; collapsed: boolean; }) => (
  <button onClick={onClick} className={`w-full flex items-center px-4 py-2.5 mb-1 transition-colors group text-[12px] ${active ? 'bg-white text-primary-600 font-bold' : 'text-white hover:bg-white/10'}`} title={collapsed ? label : ''}>
    <div>{icon}</div>
    {!collapsed && <span className="ml-3 text-label truncate">{label}</span>}
  </button>
);

// --- Supervision Dropdown (now with Context) ---
const SupervisionNav = ({ collapsed, active, onSelectModule }: { collapsed: boolean; active: boolean; onSelectModule: () => void; }) => {
  const { category, setCategory, isExpanded, setIsExpanded } = useSupervision();
  const [profExpanded, setProfExpanded] = useState(false);

  const toggleExpansion = () => {
    onSelectModule();
    setCategory(null);
    if (!active) {
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSubNavClick = (cat: SupervisionCategory) => {
    onSelectModule();
    setCategory(null);
  }

  const { canView } = usePermissions();

  const subNavItems = ([
    { label: "Tổng quan", cat: null as SupervisionCategory, subId: 'OVERVIEW' },
    { label: "An toàn phẫu thuật", cat: 'SURGERY' as SupervisionCategory, subId: 'SURGERY' },
    { label: "Vệ sinh tay", cat: 'HAND_HYGIENE' as SupervisionCategory, subId: 'HAND_HYGIENE' },
    { label: "Giám sát 5S", cat: '5S' as SupervisionCategory, subId: '5S' },
    { label: "Nhận diện người bệnh", cat: 'NDNB' as SupervisionCategory, subId: 'NDNB' },
    { label: "Hồ sơ bệnh án", cat: 'RECORDS' as SupervisionCategory, subId: 'RECORDS' },
    { label: "Sử dụng thuốc", cat: 'DRUGS' as SupervisionCategory, subId: 'DRUGS' },
    {
      label: "Chế độ chuyên môn",
      cat: 'PROFESSIONAL' as SupervisionCategory,
      subId: 'PROFESSIONAL',
      children: [
        { label: "Công tác thường trực", cat: 'PROF_DUTY' as SupervisionCategory },
        { label: "Công tác cấp cứu", cat: 'PROF_EMERGENCY' as SupervisionCategory },
        { label: "Vào viện/CK/CV/RV", cat: 'PROF_ADMISSION' as SupervisionCategory },
      ]
    },
    { label: "Giám sát chung", cat: 'GENERAL' as SupervisionCategory, subId: 'GENERAL' },
  ]).filter(item => item.subId === 'OVERVIEW' || canView('SUPERVISION', item.subId));


  return (
    <div className="space-y-1">
      <button onClick={toggleExpansion} className={`w-full flex items-center justify-between px-4 py-2.5 mb-1 transition-colors group text-[12px] ${active ? 'bg-white text-primary-600 font-bold' : 'text-white hover:bg-white/10'}`} title={collapsed ? "Kiểm tra Giám sát" : ''}>
        <div className="flex items-center overflow-hidden">
          <div className="flex-shrink-0"><CheckSquare size={20} /></div>
          {!collapsed && <span className="ml-3 text-label truncate">Kiểm tra Giám sát</span>}
        </div>
        {!collapsed && <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
      </button>

      {!collapsed && isExpanded && (
        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
          {subNavItems.map(item => {
            const hasChildren = 'children' in item && item.children;
            const isProf = item.subId === 'PROFESSIONAL';

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => {
                    if (isProf) {
                      setProfExpanded(!profExpanded);
                      onSelectModule();
                      setCategory(null);
                    } else {
                      handleSubNavClick(item.cat);
                    }
                  }}
                  className={`w-full text-left pl-11 pr-4 py-2 text-[12px] transition-colors relative flex items-center justify-between ${active && category === item.cat ? 'bg-white/15 text-white font-bold' : 'text-white/85 hover:text-white hover:bg-white/10'}`}
                >
                  <span className="truncate">{item.label}</span>
                  {isProf && <ChevronDown size={14} className={`transition-transform duration-200 ${profExpanded ? 'rotate-180' : ''}`} />}
                </button>

                {isProf && profExpanded && hasChildren && (
                  <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {item.children.map(child => (
                      <button
                        key={child.label}
                        onClick={() => handleSubNavClick(child.cat)}
                        className={`w-full text-left pl-16 pr-4 py-1.5 text-[12px] transition-colors relative ${active && category === child.cat ? 'bg-white/15 text-white font-bold' : 'text-white/75 hover:text-white hover:bg-white/10'}`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Indicators Dropdown ---
const IndicatorsNav = ({ collapsed, active, onSelectModule }: { collapsed: boolean; active: boolean; onSelectModule: () => void; }) => {
  const { category, setCategory, isExpanded, setIsExpanded } = useIndicators();

  const toggleExpansion = () => {
    if (!active) {
      onSelectModule();
      setIsExpanded(true);
      setCategory(null);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSubNavClick = (cat: IndicatorCategory) => {
    onSelectModule();
    setCategory(null);
  }

  const { canView } = usePermissions();

  const subNavItems = [
    { label: "Tổng quan", cat: 'OVERVIEW' as IndicatorCategory },
    { label: "KTCM theo tuyến", cat: 'KTCM' as IndicatorCategory },
    { label: "PT loại II+", cat: 'SURGERY_II' as IndicatorCategory },
    { label: "Nhiễm khuẩn vết mổ", cat: 'SSI' as IndicatorCategory },
    { label: "Viêm phổi NKBV", cat: 'VAP' as IndicatorCategory },
    { label: "Sự cố y khoa NT", cat: 'SEVERE_INCIDENT' as IndicatorCategory },
    { label: "Sự cố ngoài y khoa nghiêm trọng", cat: 'SEVERE_NON_MEDICAL' as IndicatorCategory },
    { label: "Thời gian khám bệnh", cat: 'AVG_EXAM_TIME' as IndicatorCategory },
    { label: "Thời gian nằm viện", cat: 'AVG_STAY_TIME' as IndicatorCategory },
    { label: "Sử dụng giường", cat: 'BED_USAGE' as IndicatorCategory },
    { label: "Sử dụng phòng mổ", cat: 'OR_USAGE' as IndicatorCategory },
    { label: "Tỷ lệ ĐD/NB", cat: 'NURSE_PATIENT_RATIO' as IndicatorCategory },
    { label: "Vệ sinh tay", cat: 'HAND_HYGIENE' as IndicatorCategory },
    { label: "Cấu hình chỉ số", cat: 'INDICATOR_CONFIG' as IndicatorCategory },
  ];

  return (
    <div className="space-y-1">
      <button onClick={toggleExpansion} className={`w-full flex items-center justify-between px-4 py-2.5 mb-1 transition-colors group text-[12px] ${active ? 'bg-white text-primary-600 font-bold' : 'text-white hover:bg-white/10'}`} title={collapsed ? "Chỉ số QLCL" : ''}>
        <div className="flex items-center overflow-hidden">
          <div className="flex-shrink-0"><BarChart2 size={20} /></div>
          {!collapsed && <span className="ml-3 text-label truncate">Chỉ số QLCL</span>}
        </div>
        {!collapsed && <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
      </button>

      {!collapsed && isExpanded && (
        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200 lg:max-h-64 overflow-y-auto custom-scrollbar-light">
          {subNavItems.map(item => (
            <button key={item.label} onClick={() => handleSubNavClick(item.cat)} className={`w-full text-left pl-11 pr-4 py-2 text-[12px] transition-colors relative ${active && category === item.cat ? 'bg-white/15 text-white font-bold' : 'text-white/85 hover:text-white hover:bg-white/10'}`}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Component ---
const Sidebar = ({ currentModule, handleModuleChange, collapsed, setCollapsed, mobileSidebarOpen, setMobileOpen, canAccessSettings }: { currentModule: ModuleType; handleModuleChange: (module: ModuleType) => void; collapsed: boolean; setCollapsed: (collapsed: boolean) => void; mobileSidebarOpen: boolean; setMobileOpen: (open: boolean) => void; canAccessSettings: boolean; }) => {
  const { canView } = usePermissions();

  return (
    <aside className={`fixed lg:relative inset-y-0 left-0 z-30 flex flex-col bg-primary-600 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/20 bg-primary-600 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" alt="Logo 103" className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden py-1">
              <h1 className="text-white font-bold text-label uppercase leading-relaxed whitespace-nowrap">BỆNH VIỆN QUÂN Y 103</h1>
              <span className="text-white/85 text-[12px] uppercase tracking-normal leading-normal whitespace-nowrap truncate">HỆ THỐNG QLCL</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <Menu size={20} />
        </button>

        <button onClick={() => setMobileOpen(false)} className="absolute top-1/2 -translate-y-1/2 right-2 lg:hidden text-white">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {canView(ModuleType.DASHBOARD) && <NavItem icon={<LayoutDashboard size={20} />} label="Trang chủ" active={currentModule === ModuleType.DASHBOARD} onClick={() => handleModuleChange(ModuleType.DASHBOARD)} collapsed={collapsed} />}
        {canView(ModuleType.HR) && <NavItem icon={<Users size={20} />} label="Quản lý Nhân sự" active={currentModule === ModuleType.HR} onClick={() => handleModuleChange(ModuleType.HR)} collapsed={collapsed} />}
        {canView(ModuleType.DOCS) && <NavItem icon={<BookOpen size={20} />} label="Văn bản & Đào tạo" active={currentModule === ModuleType.DOCS} onClick={() => handleModuleChange(ModuleType.DOCS)} collapsed={collapsed} />}
        {canView(ModuleType.ASSESSMENT) && <NavItem icon={<ClipboardCheck size={20} />} label="Đánh giá Chất lượng" active={currentModule === ModuleType.ASSESSMENT} onClick={() => handleModuleChange(ModuleType.ASSESSMENT)} collapsed={collapsed} />}
        {canView(ModuleType.INCIDENTS) && <NavItem icon={<AlertTriangle size={20} />} label="Sự cố Y khoa" active={currentModule === ModuleType.INCIDENTS} onClick={() => handleModuleChange(ModuleType.INCIDENTS)} collapsed={collapsed} />}
        {canView(ModuleType.IMPROVEMENT) && <NavItem icon={<TrendingUp size={20} />} label="Cải tiến Chất lượng" active={currentModule === ModuleType.IMPROVEMENT} onClick={() => handleModuleChange(ModuleType.IMPROVEMENT)} collapsed={collapsed} />}
        {canView(ModuleType.INDICATORS) && <IndicatorsNav collapsed={collapsed} active={currentModule === ModuleType.INDICATORS} onSelectModule={() => handleModuleChange(ModuleType.INDICATORS)} />}
        {canView(ModuleType.SUPERVISION) && <SupervisionNav collapsed={collapsed} active={currentModule === ModuleType.SUPERVISION} onSelectModule={() => handleModuleChange(ModuleType.SUPERVISION)} />}
        {canView(ModuleType.REPORTS) && <NavItem icon={<FileText size={20} />} label="Báo cáo Tổng hợp" active={currentModule === ModuleType.REPORTS} onClick={() => handleModuleChange(ModuleType.REPORTS)} collapsed={collapsed} />}
        <div className="pt-4 mt-4 border-t border-white/20">
          {(canAccessSettings || canView(ModuleType.SETTINGS)) && (
            <NavItem icon={<Settings size={20} />} label="Cấu hình hệ thống" active={currentModule === ModuleType.SETTINGS} onClick={() => handleModuleChange(ModuleType.SETTINGS)} collapsed={collapsed} />
          )}
        </div>
      </div>
      <div className="p-4 border-t border-white/20 bg-primary-600 flex justify-center text-[12px] text-white/80 uppercase whitespace-nowrap overflow-hidden">
        {!collapsed && <span>Phiên bản 16042026-01</span>}
      </div>
    </aside>
  );
};


// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};

// Helper to get notification icon
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'incident': return <AlertTriangle size={16} className="text-red-600" />;
    case 'document': return <BookOpen size={16} className="text-green-600" />;
    case 'assessment': return <ClipboardCheck size={16} className="text-purple-600" />;
    case 'improvement': return <TrendingUp size={16} className="text-orange-600" />;
    default: return <Bell size={16} className="text-blue-600" />;
  }
};

// Helper to get notification background color
const getNotificationBgColor = (type: string) => {
  switch (type) {
    case 'incident': return 'bg-red-100';
    case 'document': return 'bg-green-100';
    case 'assessment': return 'bg-purple-100';
    case 'improvement': return 'bg-orange-100';
    default: return 'bg-blue-100';
  }
};

const AppContent: React.FC = () => {
  const { currentModule, navigateToModule, activeSettingsTab, setSettingsTab } = useNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const { user } = useAuth();
  const { canView } = usePermissions();
  const { category: supervisionCategory, setCategory: setSupervisionCategory } = useSupervision();
  const { category: indicatorCategory, setCategory: setIndicatorCategory } = useIndicators();
  const [mobileSearch, setMobileSearch] = useState('');

  useEffect(() => {
    const annotateMobileTables = () => {
      const root = document.querySelector('.mobile-module-content');
      if (!root) return;

      root.querySelectorAll('table').forEach((table) => {
        const headers = Array.from(table.querySelectorAll('thead th')).map((header) =>
          (header.textContent || '').replace(/\s+/g, ' ').trim()
        );

        table.querySelectorAll('tbody tr').forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (!(cell instanceof HTMLTableCellElement) || cell.tagName !== 'TD') return;
            const label = headers[index] || cell.getAttribute('data-label') || '';

            if (label) {
              cell.setAttribute('data-label', label);
            } else {
              cell.removeAttribute('data-label');
            }
          });
        });
      });
    };

    const frameId = window.requestAnimationFrame(annotateMobileTables);
    const root = document.querySelector('.mobile-module-content');
    const observer = root
      ? new MutationObserver(() => window.requestAnimationFrame(annotateMobileTables))
      : null;

    observer?.observe(root, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer?.disconnect();
    };
  }, [currentModule, activeSettingsTab]);

  // Permission State
  const [canAccessSettings, setCanAccessSettings] = useState(false);

  // Helper to map Vietnamese Role Name to Permission Role ID
  const getPermissionRoleId = (userRole: string | undefined): string => {
    if (!userRole) return 'staff';
    const roleLower = userRole.toLowerCase();
    if (roleLower.includes('quản trị') || roleLower.includes('admin')) return 'admin';
    if (roleLower.includes('hội đồng')) return 'council';
    if (roleLower.includes('mạng lưới')) return 'network';
    return 'staff';
  };

  // Fetch Permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setCanAccessSettings(false);
        return;
      }

      try {
        const roleId = getPermissionRoleId(user.role);
        // Import dynamically or assume imported
        const permissions = await import('./readPhanQuyen').then(m => m.fetchPermissionsByRole(roleId));
        const settingsPerm = permissions.find(p => p.module === 'SETTINGS');

        // Default to FALSE unless explicitly allowed
        // If settingsPerm is undefined, it defaults to NO ACCESS (safe default)
        setCanAccessSettings(settingsPerm?.can_view === true);

      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanAccessSettings(false);
      }
    };

    checkPermissions();
  }, [user]);

  const handleModuleChange = (module: ModuleType) => {
    navigateLogic(module);
  };

  const navigateLogic = (module: ModuleType) => {
    // Allow access if explicitly checking notifications (bypass restriction)
    if (module === ModuleType.SETTINGS && !canAccessSettings && activeSettingsTab !== 'NOTI') {
      alert('Bạn không có quyền truy cập module này.');
      return;
    }
    navigateToModule(module);
    setMobileSidebarOpen(false);
  }

  const renderContent = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD: return <Dashboard />;
      case ModuleType.HR: return <HRModule />;
      case ModuleType.DOCS: return <DocsModule />;
      case ModuleType.INCIDENTS: return <Incidents />;
      case ModuleType.ASSESSMENT: return <AssessmentModule />;
      case ModuleType.SUPERVISION: return <Supervision />;
      case ModuleType.IMPROVEMENT: return <ImprovementModule />;
      case ModuleType.INDICATORS: return <IndicatorsModule />;
      case ModuleType.REPORTS: return <ReportsModule />;
      case ModuleType.SETTINGS:
        return (canAccessSettings || activeSettingsTab === 'NOTI') ? <SettingsModule /> : <Dashboard />; // Redirect to Dashboard if no access
      default: return <Dashboard />;
    }
  };

  const getModuleTitle = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD: return 'Tổng quan';
      case ModuleType.HR: return 'Quản lý Nhân sự';
      case ModuleType.DOCS: return 'Văn bản & Đào tạo';
      case ModuleType.ASSESSMENT: return 'Đánh giá Chất lượng';
      case ModuleType.INCIDENTS: return 'Sự cố Y khoa';
      case ModuleType.IMPROVEMENT: return 'Cải tiến Chất lượng';
      case ModuleType.INDICATORS: return 'Chỉ số QLCL';
      case ModuleType.SUPERVISION: return 'Kiểm tra & Giám sát tuân thủ';
      case ModuleType.REPORTS: return 'Báo cáo Tổng hợp';
      case ModuleType.SETTINGS: return 'Cấu hình Hệ thống';
      default: return '';
    }
  }

  const mobileModuleItems = [
    { label: 'NHÂN SỰ', module: ModuleType.HR, icon: Users, iconClass: 'text-indigo-500', bgClass: 'bg-indigo-300', permission: ModuleType.HR },
    { label: 'VĂN BẢN', module: ModuleType.DOCS, icon: BookOpen, iconClass: 'text-sky-500', bgClass: 'bg-sky-300', permission: ModuleType.DOCS },
    { label: 'ĐÁNH GIÁ\nCHẤT LƯỢNG', module: ModuleType.ASSESSMENT, icon: ClipboardCheck, iconClass: 'text-purple-500', bgClass: 'bg-purple-300', permission: ModuleType.ASSESSMENT },
    { label: 'SỰ CỐ\nY KHOA', module: ModuleType.INCIDENTS, icon: AlertTriangle, iconClass: 'text-red-500', bgClass: 'bg-red-300', permission: ModuleType.INCIDENTS },
    { label: 'CẢI TIẾN\nCHẤT LƯỢNG', module: ModuleType.IMPROVEMENT, icon: TrendingUp, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-300', permission: ModuleType.IMPROVEMENT },
    { label: 'CHỈ SỐ\nCHẤT LƯỢNG', module: ModuleType.INDICATORS, icon: BarChart2, iconClass: 'text-orange-500', bgClass: 'bg-orange-300', permission: ModuleType.INDICATORS },
    { label: 'KIỂM TRA\nGIÁM SÁT', module: ModuleType.SUPERVISION, icon: CheckSquare, iconClass: 'text-teal-500', bgClass: 'bg-teal-300', permission: ModuleType.SUPERVISION },
    { label: 'BÁO CÁO', module: ModuleType.REPORTS, icon: FileText, iconClass: 'text-blue-500', bgClass: 'bg-blue-300', permission: ModuleType.REPORTS },
    { label: 'CÀI ĐẶT', module: ModuleType.SETTINGS, icon: Settings, iconClass: 'text-slate-500', bgClass: 'bg-slate-300', permission: ModuleType.SETTINGS, requiresSettingsAccess: true },
  ];

  const filteredMobileModules = mobileModuleItems.filter(item => {
    const normalizedLabel = item.label.replace(/\n/g, ' ').toLowerCase();
    const hasPermission = item.requiresSettingsAccess ? (canAccessSettings || canView(item.permission)) : canView(item.permission);
    return hasPermission && normalizedLabel.includes(mobileSearch.trim().toLowerCase());
  });

  const renderMobileHome = () => (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
        <img
          src="https://i.postimg.cc/13Tv4Z60/HOP-CA.png"
          alt="Họp ca"
          className="h-auto w-full object-cover"
        />
      </div>

      <div className="function-icon-grid">
        {filteredMobileModules.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => handleModuleChange(item.module)}
              className="mobile-app-tile function-icon-tile"
            >
              <span className={`mobile-app-icon function-icon-box ${item.bgClass}`}>
                <Icon size={28} className={item.iconClass} />
              </span>
              <span className="mobile-app-label function-icon-label">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Load notifications và subscribe realtime
  React.useEffect(() => {
    loadNotifications();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToNotifications((newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });

    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchUnreadNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 1. Mark as read
      await markNotificationAsRead(notification.id);

      // 2. Remove from UI
      setNotifications(prev => prev.filter(n => n.id !== notification.id));

      // 3. Navigate to module
      navigateToModule(notification.module as ModuleType);

      // 4. Close dropdown
      setShowNotifications(false);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Close notification dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative text-[#333]">
      <Sidebar
        currentModule={currentModule}
        handleModuleChange={handleModuleChange}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        canAccessSettings={canAccessSettings}
      />

      <main className="enterprise-ui flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 w-full">
        <div className="flex h-screen flex-col bg-white lg:hidden">
          <header className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 text-slate-900">
            <button
              onClick={() => navigateToModule(ModuleType.DASHBOARD)}
              className="flex size-10 items-center justify-center rounded-xl text-slate-700 active:bg-slate-100"
              aria-label="Trang chủ"
            >
              <Menu size={23} />
            </button>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-black text-slate-900">
              {currentModule === ModuleType.DASHBOARD ? 'Trang chủ' : getModuleTitle()}
            </h1>

            <div className="flex items-center gap-2">
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex size-10 items-center justify-center rounded-xl text-slate-700 active:bg-slate-100"
                  aria-label="Thông báo"
                >
                  <Bell size={21} />
                  {notifications.length > 0 && (
                    <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full border border-white bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
                      {Math.min(notifications.length, 9)}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-primary-100 p-4">
                      <h3 className="text-sm font-bold text-slate-800">Thông báo mới</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Bạn có {notifications.length} thông báo chưa đọc
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                          Đang tải thông báo...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                          Không có thông báo mới
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className="cursor-pointer border-b border-slate-100 p-3 transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex size-8 flex-shrink-0 items-center justify-center rounded-full ${getNotificationBgColor(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{notification.message}</p>
                                <span className="mt-1 inline-block text-xs text-slate-400">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                              <div className="mt-1 size-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50 p-3">
                      <button
                        onClick={() => {
                          setSettingsTab('NOTI');
                          navigateToModule(ModuleType.SETTINGS);
                          setShowNotifications(false);
                        }}
                        className="w-full text-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
                      >
                        Xem tất cả thông báo
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <HeaderUserMenu variant="light" />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-white px-4 pb-24 pt-3">
            {currentModule === ModuleType.DASHBOARD ? (
              renderMobileHome()
            ) : (
              <div className="mobile-module-content pb-4">
                {renderContent()}
              </div>
            )}
          </div>

          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-md justify-center gap-3">
              {((currentModule === ModuleType.SUPERVISION && supervisionCategory) || (currentModule === ModuleType.INDICATORS && indicatorCategory)) && (
                <button
                  onClick={() => {
                    if (currentModule === ModuleType.SUPERVISION) {
                      setSupervisionCategory(null);
                    } else if (currentModule === ModuleType.INDICATORS) {
                      setIndicatorCategory(null);
                    }
                  }}
                  className="flex min-w-24 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-primary-600"
                >
                  <ArrowLeft size={22} />
                  <span>Quay lại</span>
                </button>
              )}
              <button
                onClick={() => handleModuleChange(ModuleType.DASHBOARD)}
                className={`flex min-w-24 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${currentModule === ModuleType.DASHBOARD ? 'text-blue-600' : 'text-slate-500'}`}
              >
                <Home size={22} />
                <span>Trang chủ</span>
              </button>
            </div>
          </nav>
        </div>

        <header className="hidden h-16 flex-shrink-0 items-center justify-between border-b border-primary-700 bg-primary-600 px-4 text-white md:px-6 lg:flex">
          <div className="flex items-center gap-3">
            <h2 className="text-title text-white truncate">{getModuleTitle()}</h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notification Button */}
            <div className="relative notification-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-white hover:bg-white/10 transition-colors"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-primary-100">
                    <h3 className="font-bold text-slate-800 text-sm">Thông báo mới</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bạn có {notifications.length} thông báo chưa đọc
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Đang tải thông báo...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className="p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full ${getNotificationBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                              <span className="text-xs text-slate-400 mt-1 inline-block">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                            </div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={() => {
                        setSettingsTab('NOTI');
                        navigateToModule(ModuleType.SETTINGS);
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-white/30 mx-1 md:mx-2"></div>

            {/* New Integrated User Menu */}
            <HeaderUserMenu />
          </div>
        </header>

        <div className="relative hidden flex-1 overflow-y-auto scroll-smooth px-3 py-4 sm:p-4 lg:block">
          <div className="max-w-7xl mx-auto pb-10">
            {renderContent()}
          </div>
          <div className="text-center text-xs text-slate-400 pb-4">
            <p>© 2026 Bệnh viện Quân y 103. Hệ thống Quản lý Chất lượng.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <NavigationProvider>
    <SupervisionProvider>
      <IndicatorsProvider>
        <PermissionsProvider>
          <AppContent />
        </PermissionsProvider>
      </IndicatorsProvider>
    </SupervisionProvider>
  </NavigationProvider>
);

export default App;
