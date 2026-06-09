import React, { useState } from 'react';
import { ChevronRight, ClipboardList, ArrowLeft, ClipboardCheck, Smile } from 'lucide-react';
import { TieuChiCoBanModule } from './TieuChiCoBanModule';
import { StandardMeasurementModule } from './StandardMeasurementModule';

interface AssessmentReportsProps {
  setViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
  onSubModuleChange: (active: boolean) => void;
  onBack?: () => void;
}

export const AssessmentReports: React.FC<AssessmentReportsProps> = ({ setViewMode, onSubModuleChange, onBack }) => {
  const [activeSubModule, setActiveSubModule] = useState<string | null>(null);

  const handleSubModuleSelect = (id: string) => {
    setActiveSubModule(id);
    onSubModuleChange(true);
  };

  const handleBack = () => {
    setActiveSubModule(null);
    onSubModuleChange(false);
    setViewMode('LIST');
  };

  React.useEffect(() => {
    const handleMobileBack = (event: Event) => {
      if (!activeSubModule) return;
      event.preventDefault();
      handleBack();
    };

    window.addEventListener('app-mobile-back', handleMobileBack);
    return () => window.removeEventListener('app-mobile-back', handleMobileBack);
  }, [activeSubModule]);

  if (activeSubModule === 'standard-1') {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button
          onClick={handleBack}
          className="hidden"
        >
          <ArrowLeft size={14} /> Quay lại danh sách tiêu chuẩn
        </button>
        <TieuChiCoBanModule setParentViewMode={setViewMode} onBack={handleBack} />
      </div>
    );
  }

  if (activeSubModule === 'standard-2') {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button
          onClick={handleBack}
          className="hidden"
        >
          <ArrowLeft size={14} /> Quay lại danh sách tiêu chuẩn
        </button>
        <StandardMeasurementModule setParentViewMode={setViewMode} onBack={handleBack} />
      </div>
    );
  }

  const reportItems = [
    {
      id: 'standard-1',
      title: 'Tiêu chuẩn chất lượng cơ bản',
      icon: <ClipboardCheck size={32} />,
      color: '#10b981',
      bgColor: '#ecfdf5',
    },
    {
      id: 'standard-2',
      title: 'Mức độ hài lòng',
      icon: <Smile size={32} />,
      color: '#3b82f6',
      bgColor: '#eff6ff',
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 gap-8">
        {reportItems.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSubModuleSelect(item.id)}
            className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left flex flex-col items-start gap-6 group"
          >
            <div
              className="p-5 rounded-2xl transition-transform group-hover:scale-110 shadow-sm"
              style={{ backgroundColor: item.bgColor, color: item.color }}
            >
              {item.icon}
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-800 uppercase text-sm tracking-tight">{item.title}</h4>
              <p className="text-xs text-slate-400 font-medium">Báo cáo đánh giá chất lượng chi tiết</p>
            </div>
          </button>
        ))}
      </div>

      {/* Mobile Grid - Single Card Style */}
      <div className="md:hidden bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50">
        <div className="grid grid-cols-2 gap-y-12 gap-x-6">
          {reportItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSubModuleSelect(item.id)}
              className="flex flex-col items-center gap-4 text-center active:scale-95 transition-all group"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300"
                style={{ backgroundColor: item.bgColor, color: item.color }}
              >
                {React.cloneElement(item.icon as any, { size: 32 })}
              </div>
              <span className="font-black text-slate-700 uppercase text-[10px] leading-tight tracking-tighter px-1">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {onBack && (
        <div className="hidden justify-start md:flex">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#009900] active:scale-[0.98]"
          >
            <ArrowLeft size={14} /> Quay lại
          </button>
        </div>
      )}
    </div>
  );
};
