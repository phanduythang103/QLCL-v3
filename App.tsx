import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  AlertTriangle, 
  TrendingUp, 
  BarChart2, 
  CheckSquare, 
  FileText,
  Menu,
  Bell,
  Search,
  ChevronDown,
  Settings,
  X
} from 'lucide-react';
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

// --- Sidebar Navigation Item ---
const NavItem = ({ 
  icon, 
  label, 
  active, 
  onClick,
  collapsed 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  collapsed: boolean
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200 group ${
      active 
        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' 
        : 'text-primary-100 hover:bg-primary-800 hover:text-white'
    }`}
    title={collapsed ? label : ''}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
      {icon}
    </div>
    {!collapsed && <span className="ml-3 font-medium text-sm truncate">{label}</span>}
  </button>
);

const SubNavItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-full text-left pl-11 pr-4 py-2 text-sm transition-colors relative ${
      active 
        ? 'text-white font-medium before:absolute before:left-8 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:bg-primary-400 before:rounded-full' 
        : 'text-primary-200/70 hover:text-white hover:bg-primary-800/50'
    }`}
  >
    {label}
  </button>
);

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN);
  
  // Supervision Module State
  const [supervisionCategory, setSupervisionCategory] = useState<SupervisionCategory>(null);
  const [supervisionExpanded, setSupervisionExpanded] = useState(false);

  const handleModuleChange = (module: ModuleType) => {
    setCurrentModule(module);
    setMobileSidebarOpen(false); // Close mobile sidebar on selection
  };

  const renderContent = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD: return <Dashboard />;
      case ModuleType.HR: return <HRModule />;
      case ModuleType.DOCS: return <DocsModule />;
      case ModuleType.INCIDENTS: return <Incidents />;
      case ModuleType.ASSESSMENT: return <AssessmentModule />;
      case ModuleType.SUPERVISION: return <Supervision category={supervisionCategory} onCategoryChange={setSupervisionCategory} />;
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
  
  const toggleSupervision = () => {
    if (currentModule !== ModuleType.SUPERVISION) {
      setCurrentModule(ModuleType.SUPERVISION);
      setSupervisionCategory(null);
      setSupervisionExpanded(true);
    } else {
      setSupervisionExpanded(!supervisionExpanded);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative inset-y-0 left-0 z-30
          flex flex-col bg-primary-900 shadow-xl transition-all duration-300
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header Logo */}
        <div className="h-20 flex items-center justify-center px-4 border-b border-primary-800/50 bg-primary-900 relative">
          {sidebarCollapsed ? (
            <img 
              src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" 
              alt="Logo 103" 
              className="w-10 h-10 object-contain drop-shadow-md" 
            />
          ) : (
            <div className="flex items-center gap-3 w-full justify-center">
               <img 
                 src="https://i.postimg.cc/YSf7nw74/logo_103_min.png" 
                 alt="Logo 103" 
                 className="w-10 h-10 object-contain drop-shadow-md shrink-0" 
               />
               <div className="flex flex-col overflow-hidden">
                  <h1 className="text-white font-bold text-sm uppercase leading-snug whitespace-nowrap">
                    BỆNH VIỆN QUÂN Y 103
                  </h1>
                  <span className="text-primary-200 text-[10px] font-bold uppercase tracking-normal leading-tight whitespace-nowrap truncate">
                    HỆ THỐNG QUẢN LÝ CHẤT LƯỢNG
                  </span>
               </div>
            </div>
          )}
          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-1/2 -translate-y-1/2 right-2 md:hidden text-primary-200 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Trang chủ" 
            active={currentModule === ModuleType.DASHBOARD} 
            onClick={() => handleModuleChange(ModuleType.DASHBOARD)} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Quản lý Nhân sự" 
            active={currentModule === ModuleType.HR} 
            onClick={() => handleModuleChange(ModuleType.HR)} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            icon={<BookOpen size={20} />} 
            label="Văn bản & Đào tạo" 
            active={currentModule === ModuleType.DOCS} 
            onClick={() => handleModuleChange(ModuleType.DOCS)} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            icon={<ClipboardCheck size={20} />} 
            label="Đánh giá Chất lượng" 
            active={currentModule === ModuleType.ASSESSMENT} 
            onClick={() => handleModuleChange(ModuleType.ASSESSMENT)} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            icon={<AlertTriangle size={20} />} 
            label="Sự cố Y khoa" 
            active={currentModule === ModuleType.INCIDENTS} 
            onClick={() => handleModuleChange(ModuleType.INCIDENTS)} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            icon={<TrendingUp size={20} />} 
            label="Cải tiến Chất lượng" 
            active={currentModule === ModuleType.IMPROVEMENT} 
            onClick={() => handleModuleChange(ModuleType.IMPROVEMENT)} 
            collapsed={sidebarCollapsed}
          />
          <NavItem 
            icon={<BarChart2 size={20} />} 
            label="Chỉ số QLCL" 
            active={currentModule === ModuleType.INDICATORS} 
            onClick={() => handleModuleChange(ModuleType.INDICATORS)} 
            collapsed={sidebarCollapsed}
          />
           
           {/* Custom Dropdown Nav Item for Supervision */}
           <div className="space-y-1">
             <button 
               onClick={toggleSupervision}
               className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                 currentModule === ModuleType.SUPERVISION
                   ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40' 
                   : 'text-primary-100 hover:bg-primary-800 hover:text-white'
               }`}
               title={sidebarCollapsed ? "Kiểm tra Giám sát" : ''}
             >
               <div className="flex items-center overflow-hidden">
                   <div className={`transition-transform duration-200 flex-shrink-0 ${currentModule === ModuleType.SUPERVISION ? 'scale-110' : 'group-hover:scale-110'}`}>
                     <CheckSquare size={20} />
                   </div>
                   {!sidebarCollapsed && <span className="ml-3 font-medium text-sm truncate">Kiểm tra Giám sát</span>}
               </div>
               {!sidebarCollapsed && <ChevronDown size={16} className={`transition-transform duration-200 ${supervisionExpanded ? 'rotate-180' : ''}`} />}
             </button>
             
             {/* Dropdown Menu */}
             {!sidebarCollapsed && supervisionExpanded && (
               <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <SubNavItem 
                    label="Tổng quan" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === null} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory(null);
                    }} 
                  />
                  <SubNavItem 
                    label="An toàn phẫu thuật" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === 'SURGERY'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('SURGERY');
                    }} 
                  />
                   <SubNavItem 
                    label="Vệ sinh tay" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === 'HAND_HYGIENE'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('HAND_HYGIENE');
                    }} 
                  />
                   <SubNavItem 
                    label="Giám sát 5S" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === '5S'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('5S');
                    }} 
                  />
                   <SubNavItem 
                    label="Hồ sơ bệnh án" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === 'RECORDS'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('RECORDS');
                    }} 
                  />
                   <SubNavItem 
                    label="Sử dụng thuốc" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === 'DRUGS'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('DRUGS');
                    }} 
                  />
                   <SubNavItem 
                    label="Chế độ chuyên môn" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === 'PROFESSIONAL'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('PROFESSIONAL');
                    }} 
                  />
                  <SubNavItem 
                    label="Giám sát chung" 
                    active={currentModule === ModuleType.SUPERVISION && supervisionCategory === 'GENERAL'} 
                    onClick={() => {
                      handleModuleChange(ModuleType.SUPERVISION);
                      setSupervisionCategory('GENERAL');
                    }} 
                  />
               </div>
             )}
           </div>

          <NavItem 
            icon={<FileText size={20} />} 
            label="Báo cáo Tổng hợp" 
            active={currentModule === ModuleType.REPORTS} 
            onClick={() => handleModuleChange(ModuleType.REPORTS)} 
            collapsed={sidebarCollapsed}
          />
          
          <div className="pt-4 mt-4 border-t border-primary-800/50">
             <NavItem 
              icon={<Settings size={20} />} 
              label="Cấu hình hệ thống" 
              active={currentModule === ModuleType.SETTINGS} 
              onClick={() => handleModuleChange(ModuleType.SETTINGS)} 
              collapsed={sidebarCollapsed}
            />
          </div>
        </div>

        {/* Footer Toggle (Desktop Only) */}
        <div className="hidden md:block p-4 border-t border-primary-800/50 bg-primary-900">
           <button 
             onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
             className="w-full flex items-center justify-center p-2 rounded-lg text-primary-200 hover:text-white hover:bg-primary-800 transition-colors"
           >
             <Menu size={20} />
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 w-full">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
             {/* Mobile Menu Button */}
             <button 
               onClick={() => setMobileSidebarOpen(true)}
               className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
             >
               <Menu size={24} />
             </button>
             <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">{getModuleTitle()}</h2>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:flex relative">
              <input 
                type="text" 
                placeholder="Tìm kiếm nhanh..." 
                className="w-48 lg:w-64 pl-10 pr-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-slate-50 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-1 md:mx-2"></div>
            
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 text-xs shadow-sm flex-shrink-0">
                AD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-700">Admin User</p>
                <p className="text-xs text-slate-500">Ban QLCL</p>
              </div>
              <ChevronDown size={16} className="text-slate-400 hidden md:block" />
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-10">
            {renderContent()}
          </div>
          <div className="text-center text-xs text-slate-400 pb-4">
            <p>© 2024 Bệnh viện Quân y 103. Hệ thống Hỗ trợ Quản lý Chất lượng.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;