import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, AlertTriangle, TrendingUp, BarChart2, CheckSquare, FileText, Menu, Bell, Search, ChevronDown, ChevronRight, Settings, X, LogOut, Activity, Home, ArrowLeft, Calendar, Lightbulb, GraduationCap, Award } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { ModuleType, UserRole, SupervisionCategory } from './types';
import { Dashboard } from './components/Dashboard';
import { Incidents } from './components/Incidents';
import { Supervision } from './components/Supervision';
import { HRModule } from './components/HRModule';
import { DocsModule, KnowledgeSharing } from './components/DocsModule';
import { AssessmentModule } from './components/Assessment';
import { ImprovementModule } from './components/ImprovementModule';
import { IndicatorsModule } from './components/IndicatorsModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { ContinuousTraining } from './components/ContinuousTraining';
import { JCIModule } from './components/JCIModule';
import { SupervisionProvider, useSupervision } from './components/SupervisionContext';
import { AssessmentProvider, useAssessmentContext } from './components/AssessmentContext';
import { HeaderUserMenu } from './components/HeaderUserMenu';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { supabase } from './supabaseClient';
import { fetchThongBao, fetchThongBaoReadIds, markThongBaoAsRead, THONG_BAO_READ_EVENT, ThongBao } from './readThongBao';
import { PermissionsProvider, usePermissions } from './contexts/PermissionsContext';
import { IndicatorsProvider, useIndicators } from './components/IndicatorsContext';
import { IndicatorCategory } from './types';
// Mobile overview will dynamically import data services to avoid module-init side effects

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
    { label: "Nội soi đại trực tràng", cat: 'ENDOSCOPY' as SupervisionCategory, subId: 'ENDOSCOPY' },
    { label: "Nội soi TQDD có gây mê", cat: 'STOMACH_ENDOSCOPY' as SupervisionCategory, subId: 'STOMACH_ENDOSCOPY' },
    { label: "Tiêm ngoài màng cứng", cat: 'EPIDURAL_INJECTION' as SupervisionCategory, subId: 'EPIDURAL_INJECTION' },
    { label: "Nội soi phế quản sinh thiết", cat: 'BRONCHOSCOPY' as SupervisionCategory, subId: 'BRONCHOSCOPY' },
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

// --- Assessment Dropdown ---
const AssessmentNav = ({ collapsed, active, onSelectModule }: { collapsed: boolean; active: boolean; onSelectModule: () => void; }) => {
  const { activeTab, setActiveTab, isExpanded, setIsExpanded } = useAssessmentContext();

  const toggleExpansion = () => {
    if (!active) {
      onSelectModule();
      setIsExpanded(true);
      setActiveTab(null);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSubNavClick = (tab: any) => {
    onSelectModule();
    setActiveTab(tab);
  }

  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin') ||
    user.role.toLowerCase().includes('manager')
  );

  const subNavItems = [
    { label: "Chấm điểm 83 Tiêu chí", tab: 'QUALITY_ASSESSMENT' },
    { label: "Các bộ tiêu chuẩn khác", tab: 'ASSESSMENT_REPORTS' },
    { label: "Chấm điểm theo tổ", tab: 'TEAM_ASSESSMENT' },
  ];
  if (isAdmin) {
    subNavItems.push({ label: "Danh mục 83 Tiêu chí", tab: 'CRITERIA_83' });
  }

  return (
    <div>
      <button
        onClick={toggleExpansion}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${active ? 'bg-white/10 text-white shadow-inner' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
      >
        <div className={`flex items-center justify-center ${collapsed ? 'w-full' : ''}`}>
          <ClipboardCheck size={20} />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 text-left uppercase text-[13px] tracking-wide font-bold whitespace-nowrap">Đánh giá Chất lượng</span>
            <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded && active ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {!collapsed && isExpanded && active && (
        <div className="bg-black/20 py-1 animate-in slide-in-from-top-2 duration-200">
          {subNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSubNavClick(item.tab)}
              className={`w-full text-left pl-11 pr-4 py-2 text-[12px] transition-colors relative flex items-center justify-between ${activeTab === item.tab ? 'bg-white/15 text-white font-bold' : 'text-white/85 hover:text-white hover:bg-white/10'}`}
            >
              <span className="truncate">{item.label}</span>
            </button>
          ))}
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
  const [appVersion, setAppVersion] = useState(() => localStorage.getItem('appVersion') || 'Phiên bản 16042026-01');

  useEffect(() => {
    const handleVersionChange = () => setAppVersion(localStorage.getItem('appVersion') || 'Phiên bản 16042026-01');
    window.addEventListener('appVersionChange', handleVersionChange);
    return () => window.removeEventListener('appVersionChange', handleVersionChange);
  }, []);

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
        {canView(ModuleType.JCI) && <NavItem icon={<Award size={20} />} label="Tiêu chuẩn JCI" active={currentModule === ModuleType.JCI} onClick={() => handleModuleChange(ModuleType.JCI)} collapsed={collapsed} />}
        {canView(ModuleType.HR) && <NavItem icon={<Users size={20} />} label="Quản lý Nhân sự" active={currentModule === ModuleType.HR} onClick={() => handleModuleChange(ModuleType.HR)} collapsed={collapsed} />}
        {canView(ModuleType.DOCS, 'LIBRARY') && <NavItem icon={<BookOpen size={20} />} label="Văn bản & Tài liệu" active={currentModule === ModuleType.DOCS} onClick={() => handleModuleChange(ModuleType.DOCS)} collapsed={collapsed} />}
        {canView(ModuleType.ASSESSMENT) && <AssessmentNav collapsed={collapsed} active={currentModule === ModuleType.ASSESSMENT} onSelectModule={() => handleModuleChange(ModuleType.ASSESSMENT)} />}
        {canView(ModuleType.INCIDENTS) && <NavItem icon={<AlertTriangle size={20} />} label="Sự cố Y khoa" active={currentModule === ModuleType.INCIDENTS} onClick={() => handleModuleChange(ModuleType.INCIDENTS)} collapsed={collapsed} />}
        {canView(ModuleType.IMPROVEMENT) && <NavItem icon={<TrendingUp size={20} />} label="Cải tiến Chất lượng" active={currentModule === ModuleType.IMPROVEMENT} onClick={() => handleModuleChange(ModuleType.IMPROVEMENT)} collapsed={collapsed} />}
        {canView(ModuleType.INDICATORS) && <IndicatorsNav collapsed={collapsed} active={currentModule === ModuleType.INDICATORS} onSelectModule={() => handleModuleChange(ModuleType.INDICATORS)} />}
        {canView(ModuleType.SUPERVISION) && <SupervisionNav collapsed={collapsed} active={currentModule === ModuleType.SUPERVISION} onSelectModule={() => handleModuleChange(ModuleType.SUPERVISION)} />}
        {canView(ModuleType.DOCS, 'TRAINING') && <NavItem icon={<GraduationCap size={20} />} label="Đào tạo liên tục" active={currentModule === ModuleType.TRAINING} onClick={() => handleModuleChange(ModuleType.TRAINING)} collapsed={collapsed} />}
        {canView(ModuleType.DOCS, 'SHARING') && <NavItem icon={<Lightbulb size={20} />} label="Góc chia sẻ" active={currentModule === ModuleType.SHARING} onClick={() => handleModuleChange(ModuleType.SHARING)} collapsed={collapsed} />}
        {canView(ModuleType.REPORTS) && <NavItem icon={<FileText size={20} />} label="Báo cáo Tổng hợp" active={currentModule === ModuleType.REPORTS} onClick={() => handleModuleChange(ModuleType.REPORTS)} collapsed={collapsed} />}
        <div className="pt-4 mt-4 border-t border-white/20">
          {(canAccessSettings || canView(ModuleType.SETTINGS)) && (
            <NavItem icon={<Settings size={20} />} label="Cấu hình hệ thống" active={currentModule === ModuleType.SETTINGS} onClick={() => handleModuleChange(ModuleType.SETTINGS)} collapsed={collapsed} />
          )}
        </div>
      </div>
      <div className="p-4 border-t border-white/20 bg-primary-600 flex justify-center text-[12px] text-white/80 uppercase whitespace-nowrap overflow-hidden">
        {!collapsed && <span>{appVersion}</span>}
      </div>
    </aside>
  );
};

// Mobile overview removed: component and quick stat tiles now disabled on mobile per request


// Helper function to format time ago
const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return '---';
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

const getNotificationAttachmentUrl = (filePath?: string) => {
  if (!filePath) return '';
  if (/^(https?:|blob:|data:)/i.test(filePath)) return filePath;

  const normalizedPath = filePath
    .replace(/^\/+/, '')
    .replace(/^cv_file\//, '');

  const { data } = supabase.storage.from('cv_file').getPublicUrl(normalizedPath);
  return data.publicUrl;
};

const NotificationMenu: React.FC<{
  notifications: ThongBao[];
  readNotificationIds: Set<string>;
  unreadCount: number;
  loading: boolean;
  onSelect: (notification: ThongBao) => void;
  onManage: () => void;
}> = ({ notifications, readNotificationIds, unreadCount, loading, onSelect, onManage }) => (
  <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
    <div className="border-b border-slate-100 bg-orange-50 p-4">
      <h3 className="text-sm font-black uppercase text-slate-800">Thông báo</h3>
      <p className="mt-0.5 text-xs font-bold text-slate-500">
        {unreadCount} thông báo chưa xem
      </p>
    </div>
    <div className="max-h-96 overflow-y-auto">
      {loading ? (
        <div className="p-8 text-center text-sm font-bold text-slate-400">Đang tải thông báo...</div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-sm font-bold text-slate-400">Chưa có thông báo</div>
      ) : (
        notifications.slice(0, 10).map((notification) => (
          <button
            key={notification.id}
            onClick={() => onSelect(notification)}
            className={`block w-full border-b border-slate-100 p-3 text-left transition-colors hover:bg-slate-50 ${readNotificationIds.has(notification.id) ? 'bg-white' : 'bg-orange-50/60'}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Bell size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-slate-800">{notification.noi_dung}</p>
                  {!readNotificationIds.has(notification.id) && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                  <span>{formatTimeAgo(notification.ngay_tao)}</span>
                  {notification.file_dinh_kem && <span className="text-primary-600">Có đính kèm</span>}
                </div>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
    <div className="border-t border-slate-100 bg-slate-50 p-3">
      <button
        onClick={onManage}
        className="w-full rounded-xl px-3 py-2 text-center text-sm font-black uppercase text-primary-600 transition-colors hover:bg-white"
      >
        Quản lý thông báo
      </button>
    </div>
  </div>
);

const NotificationListSheet: React.FC<{
  notifications: ThongBao[];
  readNotificationIds: Set<string>;
  unreadCount: number;
  loading: boolean;
  onClose: () => void;
  onSelect: (notification: ThongBao) => void;
}> = ({ notifications, readNotificationIds, unreadCount, loading, onClose, onSelect }) => {
  const toSafeText = (value: unknown, fallback = '---') => {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text || fallback;
  };

  const toSafeDate = (value: unknown) => {
    if (!value) return '---';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return '---';
    return date;
  };

  const formatCreatedAt = (value?: string) => {
    const date = toSafeDate(value);
    if (date === '---') return date;
    return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
  };

  const formatDate = (value?: string) => {
    const date = toSafeDate(value);
    return date === '---' ? date : date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-[2rem] border border-slate-200 bg-slate-50 shadow-2xl sm:rounded-[2rem]">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Bell size={21} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-slate-800">Thông báo</h3>
                <p className="text-xs font-bold text-slate-400">{unreadCount} thông báo chưa xem</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
              aria-label="Đóng danh sách thông báo"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-5.5rem)] space-y-4 overflow-y-auto p-4">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-slate-400">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-slate-400">Chưa có thông báo</div>
          ) : (
            notifications.map((notification) => {
              const creatorName = toSafeText(notification.nguoi_tao_name, 'Thông báo hệ thống');
              const content = toSafeText(notification.noi_dung, 'Không có nội dung');
              const initial = creatorName.charAt(0).toUpperCase();
              return (
                <button
                  key={notification.id}
                  onClick={() => onSelect(notification)}
                  className={`w-full rounded-3xl border p-5 text-left shadow-sm transition-all active:scale-[0.99] active:bg-slate-50 ${readNotificationIds.has(notification.id) ? 'border-slate-200 bg-white' : 'border-orange-200 bg-orange-50/60'}`}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-green-200 bg-green-100 text-sm font-black text-green-700">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-black uppercase text-slate-900">{creatorName}</p>
                        {!readNotificationIds.has(notification.id) && <span className="size-2 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                      <p className="mt-0.5 text-[12px] font-black text-slate-500">{formatCreatedAt(notification.ngay_tao)}</p>
                    </div>
                  </div>

                  <p className="mb-4 line-clamp-3 text-[13px] font-medium leading-6 text-slate-900">
                    {content}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex min-w-0 items-center gap-2 text-[12px] font-black text-slate-600">
                      <Calendar size={14} className="shrink-0 text-green-600" />
                      <span className="truncate">{formatDate(notification.ngay_bat_dau)} - {formatDate(notification.ngay_ket_thuc)}</span>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentModule, navigateToModule, activeSettingsTab, setSettingsTab } = useNavigation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [notifications, setNotifications] = useState<ThongBao[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<ThongBao | null>(null);
  const { user } = useAuth();
  const { canView } = usePermissions();
  const { category: supervisionCategory, setCategory: setSupervisionCategory } = useSupervision();
  const { category: indicatorCategory, setCategory: setIndicatorCategory } = useIndicators();
  const [mobileSearch, setMobileSearch] = useState('');
  const [mobileBannerUrl, setMobileBannerUrl] = useState<string | null>(null);
  const unreadCount = notifications.reduce(
    (count, notification) => count + (readNotificationIds.has(notification.id) ? 0 : 1),
    0
  );

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

    if (root) {
      observer?.observe(root, { childList: true, subtree: true });
    }

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

  const hasMobileBackTarget = currentModule !== ModuleType.DASHBOARD;

  const handleMobileBack = () => {
    const event = new CustomEvent('app-mobile-back', { cancelable: true });
    window.dispatchEvent(event);
    if (event.defaultPrevented) return;

    if (currentModule === ModuleType.SUPERVISION && supervisionCategory) {
      setSupervisionCategory(null);
      return;
    }

    if (currentModule === ModuleType.INDICATORS && indicatorCategory) {
      setIndicatorCategory(null);
      return;
    }

    handleModuleChange(ModuleType.DASHBOARD);
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
      case ModuleType.JCI: return <JCIModule />;
      case ModuleType.HR: return <HRModule />;
      case ModuleType.DOCS: return <DocsModule />;
      case ModuleType.TRAINING: return <ContinuousTraining />;
      case ModuleType.SHARING: return <KnowledgeSharing />;
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
      case ModuleType.JCI: return 'Tiêu chuẩn JCI';
      case ModuleType.HR: return 'Quản lý Nhân sự';
      case ModuleType.DOCS: return 'Văn bản & Tài liệu';
      case ModuleType.TRAINING: return 'Đào tạo liên tục';
      case ModuleType.SHARING: return 'Góc chia sẻ';
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
    { label: 'VĂN BẢN', module: ModuleType.DOCS, icon: BookOpen, iconClass: 'text-sky-500', bgClass: 'bg-sky-300', permission: ModuleType.DOCS, subPermission: 'LIBRARY' },
    { label: 'ĐÀO TẠO\nLIÊN TỤC', module: ModuleType.TRAINING, icon: GraduationCap, iconClass: 'text-yellow-500', bgClass: 'bg-yellow-300', permission: ModuleType.DOCS, subPermission: 'TRAINING' },
    { label: 'GÓC\nCHIA SẺ', module: ModuleType.SHARING, icon: Lightbulb, iconClass: 'text-pink-500', bgClass: 'bg-pink-300', permission: ModuleType.DOCS, subPermission: 'SHARING' },
    { label: 'ĐÁNH GIÁ\nCHẤT LƯỢNG', module: ModuleType.ASSESSMENT, icon: ClipboardCheck, iconClass: 'text-purple-500', bgClass: 'bg-purple-300', permission: ModuleType.ASSESSMENT },
    { label: 'SỰ CỐ\nY KHOA', module: ModuleType.INCIDENTS, icon: AlertTriangle, iconClass: 'text-red-500', bgClass: 'bg-red-300', permission: ModuleType.INCIDENTS },
    { label: 'CẢI TIẾN\nCHẤT LƯỢNG', module: ModuleType.IMPROVEMENT, icon: TrendingUp, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-300', permission: ModuleType.IMPROVEMENT },
    { label: 'CHỈ SỐ\nCHẤT LƯỢNG', module: ModuleType.INDICATORS, icon: BarChart2, iconClass: 'text-orange-500', bgClass: 'bg-orange-300', permission: ModuleType.INDICATORS },
    { label: 'KIỂM TRA\nGIÁM SÁT', module: ModuleType.SUPERVISION, icon: CheckSquare, iconClass: 'text-teal-500', bgClass: 'bg-teal-300', permission: ModuleType.SUPERVISION },
    { label: 'BÁO CÁO', module: ModuleType.REPORTS, icon: FileText, iconClass: 'text-blue-500', bgClass: 'bg-blue-300', permission: ModuleType.REPORTS },
    { label: 'CÀI ĐẶT', module: ModuleType.SETTINGS, icon: Settings, iconClass: 'text-slate-500', bgClass: 'bg-slate-300', permission: ModuleType.SETTINGS, requiresSettingsAccess: true },
    { label: 'TIÊU CHUẨN\nJCI', module: ModuleType.JCI, icon: Award, iconClass: 'text-teal-500', bgClass: 'bg-teal-300', permission: ModuleType.JCI },
  ];

  const filteredMobileModules = mobileModuleItems.filter(item => {
    const normalizedLabel = item.label.replace(/\n/g, ' ').toLowerCase();
    const hasPermission = item.requiresSettingsAccess 
        ? (canAccessSettings || canView(item.permission, item.subPermission)) 
        : canView(item.permission, item.subPermission);
    return hasPermission && normalizedLabel.includes(mobileSearch.trim().toLowerCase());
  });

  const renderMobileHome = () => (
    <div className="flex flex-col gap-4">

      {mobileBannerUrl && (
        <div className="w-full overflow-hidden rounded-2xl">
          <img src={mobileBannerUrl} alt="Banner" className="w-full h-40 object-cover" />
        </div>
      )}

      <div className="function-icon-grid">
        <button
          onClick={() => setShowNotificationList(true)}
          className="mobile-app-tile function-icon-tile"
        >
          <span className="mobile-app-icon function-icon-box bg-orange-300 relative">
            <Bell size={28} className="text-orange-500" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-red-500 px-1 text-[10px] font-black leading-5 text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="mobile-app-label function-icon-label">
            THÔNG BÁO
          </span>
        </button>
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

    const channel = supabase
      .channel('thong_bao_home')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'thong_bao' },
        () => loadNotifications()
      )
      .subscribe();

    const handleReadEvent = (event: Event) => {
      const { thongBaoId, userId } = (event as CustomEvent<{ thongBaoId: string; userId: string }>).detail;
      if (userId === user?.id) {
        setReadNotificationIds(current => new Set(current).add(thongBaoId));
      }
    };
    window.addEventListener(THONG_BAO_READ_EVENT, handleReadEvent);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener(THONG_BAO_READ_EVENT, handleReadEvent);
    };
  }, [user?.id]);

  // Load mobile banner from cai_dat_giao_dien (single row config)
  useEffect(() => {
    let mounted = true;
    const loadBanner = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('cai_dat_giao_dien').select('*').order('created_at', { ascending: false }).limit(1).single();
        if (error) return;
        if (data && data.anh) {
          try {
            const { data: urlData } = supabase.storage.from('avatar').getPublicUrl(data.anh || '');
            if (mounted && urlData?.publicUrl) setMobileBannerUrl(urlData.publicUrl);
          } catch (e) {
            console.error('Error getting banner public url', e);
          }
        }
      } catch (e) {
        console.error('Error loading mobile banner', e);
      }
    };

    loadBanner();
    return () => { mounted = false; };
  }, []);

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const [data, readIds] = await Promise.all([
        fetchThongBao(),
        user?.id
          ? fetchThongBaoReadIds(user.id).catch(err => {
              console.error('Error loading notification click logs:', err);
              return [];
            })
          : Promise.resolve([])
      ]);
      setNotifications(data || []);
      setReadNotificationIds(new Set(readIds));
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: ThongBao) => {
    setSelectedNotification(notification);
    setShowNotifications(false);
    if (!user?.id || readNotificationIds.has(notification.id)) return;

    setReadNotificationIds(current => new Set(current).add(notification.id));
    try {
      await markThongBaoAsRead(notification.id, user.id);
    } catch (err) {
      console.error('Error logging notification click:', err);
      setReadNotificationIds(current => {
        const next = new Set(current);
        next.delete(notification.id);
        return next;
      });
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
              {currentModule === ModuleType.DASHBOARD && (
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex size-10 items-center justify-center rounded-xl text-slate-700 active:bg-slate-100"
                  aria-label="Thông báo"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 min-w-4 h-4 rounded-full bg-red-500 px-1 text-[9px] font-black leading-4 text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <NotificationMenu
                    notifications={notifications}
                    readNotificationIds={readNotificationIds}
                    unreadCount={unreadCount}
                    loading={loadingNotifications}
                    onSelect={handleNotificationClick}
                    onManage={() => {
                      setSettingsTab('NOTI');
                      navigateToModule(ModuleType.SETTINGS);
                      setShowNotifications(false);
                    }}
                  />
                )}
              </div>
              )}
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
              {hasMobileBackTarget && (
                <button
                  onClick={handleMobileBack}
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
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-red-500 px-1 text-[10px] font-black leading-5 text-white border border-white text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-primary-100">
                    <h3 className="font-bold text-slate-800 text-sm">Thông báo mới</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bạn có {unreadCount} thông báo chưa xem
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
                          className={`p-3 hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-colors ${readNotificationIds.has(notification.id) ? 'bg-white' : 'bg-orange-50/60'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                              <Bell size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 line-clamp-2">{notification.noi_dung}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notification.nguoi_tao_name || 'Thông báo hệ thống'}</p>
                              <span className="text-xs text-slate-400 mt-1 inline-block">
                                {formatTimeAgo(notification.ngay_tao)}
                              </span>
                            </div>
                            {!readNotificationIds.has(notification.id) && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>}
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

      {showNotificationList && (
        <NotificationListSheet
          notifications={notifications}
          readNotificationIds={readNotificationIds}
          unreadCount={unreadCount}
          loading={loadingNotifications}
          onClose={() => setShowNotificationList(false)}
          onSelect={(notification) => {
            setShowNotificationList(false);
            handleNotificationClick(notification);
          }}
        />
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur sm:bg-slate-50 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 sm:h-12 sm:w-12">
                  <Bell size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black uppercase text-slate-800">Thông báo</h3>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {selectedNotification.ngay_tao ? new Date(selectedNotification.ngay_tao).toLocaleString('vi-VN') : '---'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-5rem)] space-y-5 overflow-y-auto px-5 pb-6 pt-5 sm:p-6">
              <p className="whitespace-pre-wrap rounded-2xl border border-orange-100 bg-orange-50/60 p-5 text-[15px] font-semibold leading-7 text-slate-800">
                {selectedNotification.noi_dung}
              </p>
              <div className="grid gap-3 text-xs font-bold text-slate-500">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Người tạo</span>
                  <span className="mt-1 block text-slate-700">{selectedNotification.nguoi_tao_name || '---'}</span>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Hiệu lực</span>
                  <span className="mt-1 block text-slate-700">
                    {selectedNotification.ngay_bat_dau ? new Date(selectedNotification.ngay_bat_dau).toLocaleDateString('vi-VN') : '---'}
                    {selectedNotification.ngay_ket_thuc ? ` - ${new Date(selectedNotification.ngay_ket_thuc).toLocaleDateString('vi-VN')}` : ''}
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn vị nhận</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedNotification.don_vi_thuc_hien?.length ? (
                      selectedNotification.don_vi_thuc_hien.map((unit, index) => (
                        <span key={`${unit}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                          {unit}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-700">Toàn viện</span>
                    )}
                  </div>
                </div>
              </div>
              {selectedNotification.ghi_chu && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
                  {selectedNotification.ghi_chu}
                </div>
              )}
              {selectedNotification.file_dinh_kem && (
                <a
                  href={getNotificationAttachmentUrl(selectedNotification.file_dinh_kem)}
                  target="_blank"
                  rel="noreferrer"
                  className="sticky bottom-0 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-4 text-sm font-black uppercase text-white shadow-lg shadow-green-900/20 transition-opacity hover:opacity-90"
                >
                  <FileText size={18} />
                  Xem tài liệu đính kèm
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <NavigationProvider>
    <AssessmentProvider>
      <SupervisionProvider>
        <IndicatorsProvider>
          <PermissionsProvider>
            <AppContent />
          </PermissionsProvider>
        </IndicatorsProvider>
      </SupervisionProvider>
    </AssessmentProvider>
  </NavigationProvider>
);

export default App;
