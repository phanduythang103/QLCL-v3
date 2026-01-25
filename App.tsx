import React, { useState } from 'react';
import { LayoutDashboard, Users, BookOpen, ClipboardCheck, AlertTriangle, TrendingUp, BarChart2, CheckSquare, FileText, Menu, Bell, Search, ChevronDown, Settings, X, LogOut } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { ModuleType, UserRole, SupervisionCategory } from './types';
import { Dashboard } from './components/Dashboard';
import { Incidents } from './components/Incidents';
import { Supervision } from './components/Supervision';
import { HRModule } from './components/HRModule';
import { DocsModule } from './components/DocsModule';
import { AssessmentModule } from './components/AssessmentModule';
import { ImprovementModule } from './components/ImprovementModule';
import { IndicatorsModule } from './components/IndicatorsModule';
import { ReportsModule } from './components/ReportsModule';
import { SettingsModule } from './components/SettingsModule';
import { SupervisionProvider, useSupervision } from './components/SupervisionContext';
import { HeaderUserMenu } from './components/HeaderUserMenu';

// --- Reusable Nav Item ---
const NavItem = ({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; collapsed: boolean; }) => (
  <button onClick={onClick} className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200 group ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-primary-100 hover:bg-primary-800 hover:text-white'}`} title={collapsed ? label : ''}>
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
    {!collapsed && <span className="ml-3 font-medium text-sm truncate">{label}</span>}
  </button>
);

// --- Supervision Dropdown (now with Context) ---
const SupervisionNav = ({ collapsed, active, onSelectModule }: { collapsed: boolean; active: boolean; onSelectModule: () => void; }) => {
  const { category, setCategory, isExpanded, setIsExpanded } = useSupervision();

  const toggleExpansion = () => {
    if (!active) {
      onSelectModule();
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSubNavClick = (cat: SupervisionCategory) => {
    onSelectModule();
    setCategory(cat);
  }

  const subNavItems: { label: string, cat: SupervisionCategory }[] = [
    { label: "Tổng quan", cat: null },
    { label: "An toàn phẫu thuật", cat: 'SURGERY' },
    { label: "Vệ sinh tay", cat: 'HAND_HYGIENE' },
    { label: "Giám sát 5S", cat: '5S' },
    { label: "Hồ sơ bệnh án", cat: 'RECORDS' },
    { label: "Sử dụng thuốc", cat: 'DRUGS' },
    { label: "Chế độ chuyên môn", cat: 'PROFESSIONAL' },
    { label: "Giám sát chung", cat: 'GENERAL' },
  ];

  return (
    <div className="space-y-1">
      <button onClick={toggleExpansion} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' : 'text-primary-100 hover:bg-primary-800 hover:text-white'}`} title={collapsed ? "Kiểm tra Giám sát" : ''}>
        <div className="flex items-center overflow-hidden">
          <div className={`transition-transform duration-200 flex-shrink-0 ${active ? 'scale-110' : 'group-hover:scale-110'}`}><CheckSquare size={20} /></div>
          {!collapsed && <span className="ml-3 font-medium text-sm truncate">Kiểm tra Giám sát</span>}
        </div>
        {!collapsed && <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />}
      </button>

      {!collapsed && isExpanded && (
        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
          {subNavItems.map(item => (
            <button key={item.label} onClick={() => handleSubNavClick(item.cat)} className={`w-full text-left pl-11 pr-4 py-2 text-sm transition-colors relative ${active && category === item.cat ? 'text-white font-medium before:absolute before:left-8 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary-400 before:rounded-full' : 'text-primary-200/70 hover:text-white hover:bg-primary-800/50'}`}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Component ---
const Sidebar = ({ currentModule, handleModuleChange, collapsed, setCollapsed, mobileSidebarOpen, setMobileOpen }: { currentModule: ModuleType; handleModuleChange: (module: ModuleType) => void; collapsed: boolean; setCollapsed: (collapsed: boolean) => void; mobileSidebarOpen: boolean; setMobileOpen: (open: boolean) => void; }) => (
  <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col bg-primary-900 shadow-xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
    <div className="h-20 flex items-center justify-center px-4 border-b border-primary-800/50 bg-primary-900 relative">
      {collapsed ? <img src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" alt="Logo 103" className="w-10 h-10 object-contain drop-shadow-md" /> : (
        <div className="flex items-center gap-3 w-full justify-center">
          <img src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" alt="Logo 103" className="w-10 h-10 object-contain drop-shadow-md shrink-0" />
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-white font-bold text-sm uppercase leading-snug whitespace-nowrap">BỆNH VIỆN QUÂN Y 103</h1>
            <span className="text-primary-200 text-[10px] font-bold uppercase tracking-normal leading-tight whitespace-nowrap truncate">HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG</span>
          </div>
        </div>
      )}
      <button onClick={() => setMobileOpen(false)} className="absolute top-1/2 -translate-y-1/2 right-2 md:hidden text-primary-200 hover:text-white"><X size={24} /></button>
    </div>
    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
      <NavItem icon={<LayoutDashboard size={20} />} label="Trang chủ" active={currentModule === ModuleType.DASHBOARD} onClick={() => handleModuleChange(ModuleType.DASHBOARD)} collapsed={collapsed} />
      <NavItem icon={<Users size={20} />} label="Quản lý Nhân sự" active={currentModule === ModuleType.HR} onClick={() => handleModuleChange(ModuleType.HR)} collapsed={collapsed} />
      <NavItem icon={<BookOpen size={20} />} label="Văn bản & Đào tạo" active={currentModule === ModuleType.DOCS} onClick={() => handleModuleChange(ModuleType.DOCS)} collapsed={collapsed} />
      <NavItem icon={<ClipboardCheck size={20} />} label="Đánh giá Chất lượng" active={currentModule === ModuleType.ASSESSMENT} onClick={() => handleModuleChange(ModuleType.ASSESSMENT)} collapsed={collapsed} />
      <NavItem icon={<AlertTriangle size={20} />} label="Sự cố Y khoa" active={currentModule === ModuleType.INCIDENTS} onClick={() => handleModuleChange(ModuleType.INCIDENTS)} collapsed={collapsed} />
      <NavItem icon={<TrendingUp size={20} />} label="Cải tiến Chất lượng" active={currentModule === ModuleType.IMPROVEMENT} onClick={() => handleModuleChange(ModuleType.IMPROVEMENT)} collapsed={collapsed} />
      <NavItem icon={<BarChart2 size={20} />} label="Chỉ số QLCL" active={currentModule === ModuleType.INDICATORS} onClick={() => handleModuleChange(ModuleType.INDICATORS)} collapsed={collapsed} />
      <SupervisionNav collapsed={collapsed} active={currentModule === ModuleType.SUPERVISION} onSelectModule={() => handleModuleChange(ModuleType.SUPERVISION)} />
      <NavItem icon={<FileText size={20} />} label="Báo cáo Tổng hợp" active={currentModule === ModuleType.REPORTS} onClick={() => handleModuleChange(ModuleType.REPORTS)} collapsed={collapsed} />
      <div className="pt-4 mt-4 border-t border-primary-800/50">
        <NavItem icon={<Settings size={20} />} label="Cấu hình hệ thống" active={currentModule === ModuleType.SETTINGS} onClick={() => handleModuleChange(ModuleType.SETTINGS)} collapsed={collapsed} />
      </div>
    </div>
    <div className="p-4 border-t border-primary-800/50 bg-primary-900">
      <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex w-full items-center justify-center p-2 rounded-lg text-primary-200 hover:text-white hover:bg-primary-800 transition-colors">
        <Menu size={20} />
      </button>
    </div>
  </aside>
);

const AppContent: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const handleModuleChange = (module: ModuleType) => {
    setCurrentModule(module);
    setMobileSidebarOpen(false);
  };

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
      case ModuleType.SETTINGS: return <SettingsModule />;
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
      case ModuleType.SUPERVISION: return 'Kiểm tra Giám sát';
      case ModuleType.REPORTS: return 'Báo cáo Tổng hợp';
      case ModuleType.SETTINGS: return 'Cấu hình Hệ thống';
      default: return '';
    }
  }

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
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">{getModuleTitle()}</h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:flex relative">
              <input type="text" placeholder="Tìm kiếm nhanh..." className="w-48 lg:w-64 pl-10 pr-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-slate-50 transition-all" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 md:mx-2"></div>

            {/* New Integrated User Menu */}
            <HeaderUserMenu />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">{renderContent()}</div>
          <div className="text-center text-xs text-slate-400 pb-4">
            <p>© 2026 Bệnh viện Quân y 103. Hệ thống Hỗ trợ Quản lý Chất lượng.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <SupervisionProvider>
    <AppContent />
  </SupervisionProvider>
);

export default App;