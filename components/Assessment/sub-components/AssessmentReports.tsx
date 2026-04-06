import React, { useState } from 'react';
import { ChevronRight, ClipboardList, ArrowLeft, ClipboardCheck, Smile } from 'lucide-react';
import { TieuChiCoBanModule } from './TieuChiCoBanModule';
import { StandardMeasurementModule } from './StandardMeasurementModule';

interface AssessmentReportsProps {
  setViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const AssessmentReports: React.FC<AssessmentReportsProps> = ({ setViewMode }) => {
  const [activeSubModule, setActiveSubModule] = useState<string | null>(null);

  if (activeSubModule === 'standard-1') {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => {
            setActiveSubModule(null);
            setViewMode('LIST');
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-[10px] uppercase transition-all mb-4"
        >
          <ArrowLeft size={14} /> Quay lại danh sách tiêu chuẩn
        </button>
        <TieuChiCoBanModule setParentViewMode={setViewMode} />
      </div>
    );
  }

  if (activeSubModule === 'standard-2') {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => {
            setActiveSubModule(null);
            setViewMode('LIST');
          }}
          className="flex items-center gap-2 text-slate-500 hover:text-[#009900] font-black text-[10px] uppercase transition-all mb-4"
        >
          <ArrowLeft size={14} /> Quay lại danh sách tiêu chuẩn
        </button>
        <StandardMeasurementModule setParentViewMode={setViewMode} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-6"></div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'standard-1', title: 'Tiêu chuẩn chất lượng cơ bản', desc: '' },
          { id: 'standard-2', title: 'Mức độ hài lòng', desc: '' }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSubModule(item.id)}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer flex flex-col items-start justify-center"
          >
            <div className="flex items-center gap-2">
              {item.id === 'standard-1' ? <ClipboardCheck size={20} className="text-[#009900]" /> : <Smile size={20} className="text-[#009900]" />}
              <h4 className="font-black text-slate-800 uppercase text-xs mb-2">{item.title}</h4>
            </div>
            <p className="text-slate-500 text-[10px] uppercase font-bold leading-relaxed">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
