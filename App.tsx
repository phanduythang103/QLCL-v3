import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, AlertTriangle, TrendingUp, BarChart2, CheckSquare, FileText, Menu, Bell, Search, ChevronDown, Settings, X, LogOut, Activity } from 'lucide-react';
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
  <button onClick={onClick} className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200 group ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-primary-100 hover:bg-primary-800 hover:text-white'}`} title={collapsed ? label : ''}>
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
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
    setCategory(cat);
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
      <button onClick={toggleExpansion} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-primary-100 hover:bg-primary-800 hover:text-white'}`} title={collapsed ? "Kiểm tra Giám sát" : ''}>
        <div className="flex items-center overflow-hidden">
          <div className={`transition-transform duration-200 flex-shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}><CheckSquare size={20} /></div>
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
                      handleSubNavClick(item.cat);
                    } else {
                      handleSubNavClick(item.cat);
                    }
                  }}
                  className={`w-full text-left pl-11 pr-4 py-2 text-label transition-colors relative flex items-center justify-between ${active && category === item.cat ? 'text-white font-black before:absolute before:left-8 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary-400 before:rounded-full' : 'text-primary-200/70 hover:text-white hover:bg-primary-800/50'}`}
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
                        className={`w-full text-left pl-16 pr-4 py-1.5 text-label transition-colors relative ${active && category === child.cat ? 'text-white font-black before:absolute before:left-12 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-primary-400 before:rounded-full' : 'text-primary-300/60 hover:text-white hover:bg-primary-800/30'}`}
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
      setCategory('OVERVIEW');
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSubNavClick = (cat: IndicatorCategory) => {
    onSelectModule();
    setCategory(cat);
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
      <button onClick={toggleExpansion} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-primary-100 hover:bg-primary-800 hover:text-white'}`} title={collapsed ? "Chỉ số QLCL" : ''}>
        <div className="flex items-center overflow-hidden">
          <div className={`transition-transform duration-200 flex-shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}><BarChart2 size={20} /></div>
          {!collapsed && <span className="ml-3 text-label truncate">Chỉ số QLCL</span>}
        </div>
        {!collapsed && <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
      </button>

      {!collapsed && isExpanded && (
        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200 lg:max-h-64 overflow-y-auto custom-scrollbar-light">
          {subNavItems.map(item => (
            <button key={item.label} onClick={() => handleSubNavClick(item.cat)} className={`w-full text-left pl-11 pr-4 py-2 text-label transition-colors relative ${active && category === item.cat ? 'text-white font-black before:absolute before:left-8 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary-400 before:rounded-full' : 'text-primary-200/70 hover:text-white hover:bg-primary-800/50'}`}>
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
    <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-primary-900 shadow-xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <div className="h-20 flex items-center justify-between px-4 border-b border-primary-800/50 bg-primary-900 relative">
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" alt="Logo 103" className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden py-1">
              <h1 className="text-white font-bold text-label uppercase leading-relaxed whitespace-nowrap">BỆNH VIỆN QUÂN Y 103</h1>
              <span className="text-primary-200 text-[11px] font-bold uppercase tracking-normal leading-normal whitespace-nowrap truncate opacity-80">HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-primary-200 hover:text-white hover:bg-primary-800 transition-colors shrink-0"
        >
          <Menu size={20} />
        </button>

        <button onClick={() => setMobileOpen(false)} className="absolute top-1/2 -translate-y-1/2 right-2 md:hidden text-primary-200 hover:text-white">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {canView(ModuleType.DASHBOARD) && <NavItem icon={<LayoutDashboard size={20} />} label="Trang chủ" active={currentModule === ModuleType.DASHBOARD} onClick={() => handleModuleChange(ModuleType.DASHBOARD)} collapsed={collapsed} />}
        {canView(ModuleType.HR) && <NavItem icon={<Users size={20} />} label="Quản lý Nhân sự" active={currentModule === ModuleType.HR} onClick={() => handleModuleChange(ModuleType.HR)} collapsed={collapsed} />}
        {canView(ModuleType.DOCS) && <NavItem icon={<BookOpen size={20} />} label="Văn bản & Đào tạo" active={currentModule === ModuleType.DOCS} onClick={() => handleModuleChange(ModuleType.DOCS)} collapsed={collapsed} />}
        {canView(ModuleType.ASSESSMENT) && <NavItem icon={<ClipboardCheck size={20} />} label="Đánh giá Chất lượng" active={currentModule === ModuleType.ASSESSMENT} onClick={() => handleModuleChange(ModuleType.ASSESSMENT)} collapsed={collapsed} />}
        {canView(ModuleType.INCIDENTS) && <NavItem icon={<AlertTriangle size={20} />} label="Sự cố Y khoa" active={currentModule === ModuleType.INCIDENTS} onClick={() => handleModuleChange(ModuleType.INCIDENTS)} collapsed={collapsed} />}
        {canView(ModuleType.IMPROVEMENT) && <NavItem icon={<TrendingUp size={20} />} label="Cải tiến Chất lượng" active={currentModule === ModuleType.IMPROVEMENT} onClick={() => handleModuleChange(ModuleType.IMPROVEMENT)} collapsed={collapsed} />}
        {canView(ModuleType.INDICATORS) && <IndicatorsNav collapsed={collapsed} active={currentModule === ModuleType.INDICATORS} onSelectModule={() => handleModuleChange(ModuleType.INDICATORS)} />}
        {canView(ModuleType.SUPERVISION) && <SupervisionNav collapsed={collapsed} active={currentModule === ModuleType.SUPERVISION} onSelectModule={() => handleModuleChange(ModuleType.SUPERVISION)} />}
        {canView(ModuleType.REPORTS) && <NavItem icon={<FileText size={20} />} label="Báo cáo Tổng hợp" active={currentModule === ModuleType.REPORTS} onClick={() => handleModuleChange(ModuleType.REPORTS)} collapsed={collapsed} />}
        <div className="pt-4 mt-4 border-t border-primary-800/50">
          {(canAccessSettings || canView(ModuleType.SETTINGS)) && (
            <NavItem icon={<Settings size={20} />} label="Cấu hình hệ thống" active={currentModule === ModuleType.SETTINGS} onClick={() => handleModuleChange(ModuleType.SETTINGS)} collapsed={collapsed} />
          )}
        </div>
      </div>
      <div className="p-4 border-t border-primary-800/50 bg-primary-900 flex justify-center text-[12px] text-primary-400 font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden">
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {mobileSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setMobileSidebarOpen(false)} />}

      <Sidebar
        currentModule={currentModule}
        handleModuleChange={handleModuleChange}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        canAccessSettings={canAccessSettings}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
            <h2 className="text-title text-black truncate">{getModuleTitle()}</h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Notification Button */}
            <div className="relative notification-dropdown">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
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
            <div className="h-8 w-px bg-slate-200 mx-1 md:mx-2"></div>

            {/* New Integrated User Menu */}
            <HeaderUserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth relative">
          <div className="max-w-7xl mx-auto pb-10">
            {renderContent()}
          </div>
          <div className="text-center text-xs text-slate-400 pb-4">
            <p>© 2026 Bệnh viện Quân y 103. Hệ thống Hỗ trợ Quản lý Chất lượng.</p>
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