import React, { useState } from 'react';
import { LayoutGrid, Activity, AlertCircle, ShieldCheck, HandMetal, FileText, ArrowLeft, Pill, Bell, TrendingDown, Users, Award } from 'lucide-react';
import { JCIFallIncidentsModule } from './JCIFallIncidentsModule';
import { JCICriticalResultsModule } from './JCICriticalResultsModule';
import { JCIHandoverIncidentsModule } from './JCIHandoverIncidentsModule';
import { NdnbMonitoringModule } from './NdnbMonitoringModule';
import { SurgerySafetyModule } from './SurgerySafetyModule';
import { HandHygieneModule } from './HandHygieneModule';
import { usePermissions } from '../contexts/PermissionsContext';

export const JCIModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'INDICATORS'>('INDICATORS');
  const [category, setCategory] = useState<string | null>(null);
  const { canView } = usePermissions();

  const jciIndicators = [
    { id: 'FALL_RATE', label: 'Tỷ suất NB ngã', icon: TrendingDown, desc: 'Giám sát tỷ suất người bệnh ngã', bgClass: 'bg-red-300', iconClass: 'text-red-500' },
    { id: 'PATIENT_IDENTIFICATION', label: 'Nhận dạng người bệnh', icon: Users, desc: 'Tỷ lệ tuân thủ nhận dạng người bệnh', bgClass: 'bg-blue-300', iconClass: 'text-blue-500' },
    { id: 'CRITICAL_RESULTS', label: 'Thông báo KQ báo động CLS', icon: Bell, desc: 'Thông báo kết quả xét nghiệm/CLS nguy hiểm', bgClass: 'bg-teal-300', iconClass: 'text-teal-500' },
    { id: 'HANDOVER_INCIDENTS', label: 'KQ sự cố liên quan đến bàn giao', icon: AlertCircle, desc: 'Sự cố y khoa liên quan đến bàn giao người bệnh', bgClass: 'bg-purple-300', iconClass: 'text-purple-500' },
    { id: 'SURGERY_SAFETY', label: 'Tuân thủ ATPT', icon: ShieldCheck, desc: 'Tỷ lệ tuân thủ An toàn phẫu thuật', bgClass: 'bg-emerald-300', iconClass: 'text-emerald-500' },
    { id: 'HAND_HYGIENE', label: 'Tuân thủ 5 thời điểm VST', icon: HandMetal, desc: 'Tỷ lệ tuân thủ 5 thời điểm vệ sinh tay', bgClass: 'bg-cyan-300', iconClass: 'text-cyan-500' },
  ].filter(item => canView('JCI', item.id));

  if (category) {
    switch (category) {
      case 'FALL_RATE':
        return <JCIFallIncidentsModule onBack={() => setCategory(null)} />;
      case 'CRITICAL_RESULTS':
        return <JCICriticalResultsModule onBack={() => setCategory(null)} />;
      case 'HANDOVER_INCIDENTS':
        return <JCIHandoverIncidentsModule onBack={() => setCategory(null)} />;
      case 'PATIENT_IDENTIFICATION':
        return <NdnbMonitoringModule onBack={() => setCategory(null)} />;
      case 'SURGERY_SAFETY':
        return <SurgerySafetyModule onBack={() => setCategory(null)} />;
      case 'HAND_HYGIENE':
        return <HandHygieneModule onBack={() => setCategory(null)} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 font-medium space-y-4">
            <p className="text-xl">Phân hệ <span className="font-bold text-teal-600">{category}</span> đang được phát triển.</p>
            <button onClick={() => setCategory(null)} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowLeft size={18} /> Quay lại
            </button>
          </div>
        );
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">Tiêu chuẩn JCI</h1>
          <p className="text-teal-100 font-medium max-w-2xl text-sm md:text-base">Quản lý và giám sát các chỉ số chất lượng, đánh giá an toàn người bệnh theo tiêu chuẩn quốc tế JCI.</p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4 transform">
          <Award size={240} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActiveTab('INDICATORS')}
          className={`flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-sm
            ${activeTab === 'INDICATORS' ? 'bg-teal-500 text-white shadow-teal-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
        >
          Chỉ số chất lượng
        </button>
      </div>

      {/* Grid Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-main-title font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <LayoutGrid className="text-teal-500" size={24} /> Danh mục chỉ số
          </h2>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/30">
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 lg:gap-6">
            {jciIndicators.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                className="function-icon-tile group lg:min-h-0 lg:flex-row lg:items-start lg:justify-start lg:gap-4 lg:rounded-2xl lg:border lg:border-slate-100 lg:bg-white lg:p-5 lg:text-left lg:hover:border-teal-500/30 lg:hover:shadow-xl lg:hover:shadow-teal-500/5"
              >
                <div className={`function-icon-box ${item.bgClass} lg:shadow-sm`}>
                  <item.icon size={28} className={item.iconClass} />
                </div>
                <div className="min-w-0 lg:flex-1">
                  <h4 className="function-icon-label uppercase transition-colors group-hover:text-teal-600 lg:text-table lg:font-black lg:normal-case">{item.label}</h4>
                  <p className="mt-1 hidden text-xs font-medium leading-relaxed text-slate-500 lg:block">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
