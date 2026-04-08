import React, { useState } from 'react';
import { UserCheck, Users, Activity, ChevronRight, Hospital, Baby } from 'lucide-react';
import { StaffSatisfactionSurvey } from './StaffSatisfactionSurvey';
import { InpatientSatisfactionSurvey } from './InpatientSatisfactionSurvey';
import { OutpatientSatisfactionSurvey } from './OutpatientSatisfactionSurvey';
import { OutpatientSatisfactionForm } from './OutpatientSatisfactionForm';
import { KsNuoiConSurvey } from './KsNuoiConSurvey';
import { KsMeSinhConSurvey } from './KsMeSinhConSurvey';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const StandardMeasurementModule: React.FC<Props> = ({ setParentViewMode }) => {
  const [activeTab, setActiveTab] = useState<'PATIENT' | 'STAFF' | 'OUTPATIENT' | 'BABY' | 'MOTHER'>('STAFF');

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Card Buttons Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveTab('PATIENT')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start justify-center"
        >
          <div className="flex items-center gap-2">
            <UserCheck size={24} className="text-[#009900]" />
            <h4 className="font-black text-slate-800 uppercase text-xs mb-2">Khảo sát hài lòng Người bệnh nội trú</h4>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('STAFF')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start justify-center"
        >
          <div className="flex items-center gap-2">
            <Users size={24} className="text-[#009900]" />
            <h4 className="font-black text-slate-800 uppercase text-xs mb-2">Khảo sát hài lòng NVYT</h4>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('OUTPATIENT')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start justify-center"
        >
          <div className="flex items-center gap-2">
            <Hospital size={24} className="text-[#009900]" />
            <h4 className="font-black text-slate-800 uppercase text-xs mb-2">Khảo sát hài lòng Người bệnh ngoại trú</h4>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('BABY')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start justify-center"
        >
          <div className="flex items-center gap-2">
            <Baby size={24} className="text-[#009900]" />
            <h4 className="font-black text-slate-800 uppercase text-xs mb-2">Khảo sát nuôi con bằng sữa mẹ</h4>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('MOTHER')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start justify-center"
        >
          <div className="flex items-center gap-2">
            <UserCheck size={24} className="text-[#009900]" />
            <h4 className="font-black text-slate-800 uppercase text-xs mb-2">Khảo sát người mẹ sinh con</h4>
          </div>
        </button>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {activeTab === 'PATIENT' ? (
          <InpatientSatisfactionSurvey setParentViewMode={setParentViewMode} />
        ) : activeTab === 'STAFF' ? (
          <StaffSatisfactionSurvey setParentViewMode={setParentViewMode} />
        ) : activeTab === 'BABY' ? (
          <KsNuoiConSurvey setParentViewMode={setParentViewMode} />
        ) : activeTab === 'MOTHER' ? (
          <KsMeSinhConSurvey setParentViewMode={setParentViewMode} />
        ) : (
          <OutpatientSatisfactionSurvey setParentViewMode={setParentViewMode} />
        )}
      </div>
    </div>
  );
};
