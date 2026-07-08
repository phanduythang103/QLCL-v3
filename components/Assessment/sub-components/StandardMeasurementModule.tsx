import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Stethoscope, UserCheck, Baby, Heart,
  ArrowLeft, Activity, ChevronRight, Calendar
} from 'lucide-react';
import { StaffSatisfactionSurvey } from './StaffSatisfactionSurvey';
import { InpatientSatisfactionSurvey } from './InpatientSatisfactionSurvey';
import { OutpatientSatisfactionSurvey } from './OutpatientSatisfactionSurvey';
import { KsNuoiConSurvey } from './KsNuoiConSurvey';
import { KsMeSinhConSurvey } from './KsMeSinhConSurvey';
import { supabase } from '../../../supabaseClient';

// Import services
import { inpatientSatisfactionService } from '../services/inpatientSatisfactionService';
import { outpatientSatisfactionService } from '../services/outpatientSatisfactionService';
import { staffSatisfactionService } from '../services/staffSatisfactionService';
import { ksNuoiConService } from '../services/ksNuoiConService';
import { ksMeSinhConService } from '../services/ksMeSinhConService';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
  onBack?: () => void;
}

interface SatisfactionStats {
  id: string;
  name: string;
  percent: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  tab: 'PATIENT' | 'STAFF' | 'OUTPATIENT' | 'BABY' | 'MOTHER';
  surveyType: string;
}

export const StandardMeasurementModule: React.FC<Props> = ({ setParentViewMode, onBack }) => {
  const [activeTab, setActiveTab] = useState<'PATIENT' | 'STAFF' | 'OUTPATIENT' | 'BABY' | 'MOTHER' | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({
    PATIENT: 0,
    STAFF: 0,
    OUTPATIENT: 0,
    BABY: 0,
    MOTHER: 0,
  });
  const [publicConfigs, setPublicConfigs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch all in parallel
        const [inpatient, outpatient, staff, nuoiCon, meSinhCon] = await Promise.all([
          inpatientSatisfactionService.fetchInpatientSurveys(),
          outpatientSatisfactionService.fetchOutpatientSurveys(),
          staffSatisfactionService.fetchSurveys(),
          ksNuoiConService.fetchAll(),
          ksMeSinhConService.fetchAll(),
        ]);

        const { data: configs, error: configError } = await supabase
          .from('survey_public_configs')
          .select('survey_type, is_public');

        if (configError) throw configError;

        setPublicConfigs(
          (configs || []).reduce((acc: Record<string, boolean>, config: any) => {
            acc[config.survey_type] = !!config.is_public;
            return acc;
          }, {})
        );

        const calcAvg = (data: any[], type: 'PATIENT' | 'STAFF' | 'OUTPATIENT' | 'BABY' | 'MOTHER') => {
          if (!data || data.length === 0) return 0;

          const currentMonthData = data.filter(r => {
            const date = r.survey_date || r.ngay_khao_sat || r.created_at;
            if (!date) return false;
            const d = new Date(date);
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
          });

          const targetData = currentMonthData.length > 0 ? currentMonthData : data;

          let totalPercent = 0;
          targetData.forEach(r => {
            if (r.satisfaction_percent !== undefined && r.satisfaction_percent !== null) {
              totalPercent += r.satisfaction_percent;
            } else if (type === 'OUTPATIENT') {
              let sum = 0;
              let count = 0;
              for (let i = 1; i <= 15; i++) {
                const val = r[`q${i}`];
                if (val > 0) {
                  sum += val;
                  count++;
                }
              }
              totalPercent += count > 0 ? (sum / count) * 20 : 0;
            } else if (type === 'STAFF') {
              let sum = 0;
              let count = 0;
              for (let i = 1; i <= 13; i++) {
                const val = r[`q${i}`];
                if (val !== undefined && val !== null) {
                  sum += val;
                  count++;
                }
              }
              totalPercent += count > 0 ? (sum / count) * 20 : 0;
            } else if (type === 'BABY') {
              // As BABY survey doesn't have a satisfaction score, use a default high value or calculate compliance
              // For now, let's treat it as 100% just to show some progress, or 0 if nothing.
              // Actually, maybe we shouldn't show a bar for Nuôi con if it's not satisfaction?
              // But screenshot has it. Let's use 100 for now or some metric.
              totalPercent += 100;
            }
          });

          return Math.round(totalPercent / targetData.length);
        };

        setStats({
          PATIENT: calcAvg(inpatient, 'PATIENT'),
          OUTPATIENT: calcAvg(outpatient, 'OUTPATIENT'),
          STAFF: calcAvg(staff, 'STAFF'),
          BABY: calcAvg(nuoiCon, 'BABY'),
          MOTHER: calcAvg(meSinhCon, 'MOTHER'),
        });
      } catch (err) {
        console.error("Error fetching satisfaction stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === null) {
      fetchData();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleMobileBack = (event: Event) => {
      if (activeTab === null) return;
      event.preventDefault();
      setActiveTab(null);
    };

    window.addEventListener('app-mobile-back', handleMobileBack);
    return () => window.removeEventListener('app-mobile-back', handleMobileBack);
  }, [activeTab]);

  const menuItems: SatisfactionStats[] = [
    {
      id: 'patient',
      name: 'NB Nội trú',
      percent: stats.PATIENT,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      icon: <Users size={24} />,
      tab: 'PATIENT',
      surveyType: 'inpatient'
    },
    {
      id: 'staff',
      name: 'Nhân viên Y tế',
      percent: stats.STAFF,
      color: '#10b981',
      bgColor: '#ecfdf5',
      icon: <Stethoscope size={24} />,
      tab: 'STAFF',
      surveyType: 'staff'
    },
    {
      id: 'outpatient',
      name: 'NB Ngoại trú',
      percent: stats.OUTPATIENT,
      color: '#f59e0b',
      bgColor: '#fff7ed',
      icon: <UserCheck size={24} />,
      tab: 'OUTPATIENT',
      surveyType: 'outpatient'
    },
    {
      id: 'baby',
      name: 'Nuôi con',
      percent: stats.BABY,
      color: '#ec4899',
      bgColor: '#fdf2f8',
      icon: <Baby size={24} />,
      tab: 'BABY',
      surveyType: 'ks_nuoi_con'
    },
    {
      id: 'mother',
      name: 'Mẹ sinh con',
      percent: stats.MOTHER,
      color: '#ef4444',
      bgColor: '#fef2f2',
      icon: <Heart size={24} />,
      tab: 'MOTHER',
      surveyType: 'ks_me_sinh_con'
    },
  ];

  if (activeTab !== null) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
        <button
          onClick={() => setActiveTab(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-[#059669] font-black text-[10px] uppercase transition-all mb-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft size={14} /> Quay lại Dashboard Hài lòng
        </button>

        <div className="mt-4">
          {activeTab === 'PATIENT' && <InpatientSatisfactionSurvey setParentViewMode={setParentViewMode} />}
          {activeTab === 'STAFF' && <StaffSatisfactionSurvey setParentViewMode={setParentViewMode} />}
          {activeTab === 'BABY' && <KsNuoiConSurvey setParentViewMode={setParentViewMode} />}
          {activeTab === 'MOTHER' && <KsMeSinhConSurvey setParentViewMode={setParentViewMode} />}
          {activeTab === 'OUTPATIENT' && <OutpatientSatisfactionSurvey setParentViewMode={setParentViewMode} />}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 pb-10 space-y-12">
      {/* --- DESKTOP VIEW (Original + Stats) --- */}
      <div className="hidden md:block space-y-12">
        <div className="grid md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => publicConfigs[item.surveyType] && setActiveTab(item.tab)}
              disabled={!publicConfigs[item.surveyType]}
              title={!publicConfigs[item.surveyType] ? 'Khảo sát đang đóng trong cấu hình public' : undefined}
              className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all flex flex-col items-start justify-center group ${
                publicConfigs[item.surveyType] ? 'hover:shadow-xl hover:-translate-y-1' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: item.bgColor, color: item.color }}
                >
                  {React.cloneElement(item.icon as any, { size: 28 })}
                </div>
                <div>
                  <h4 className="font-black text-slate-800 uppercase text-xs mb-1">Khảo sát hài lòng</h4>
                  <p className="font-black text-[#059669] uppercase text-[10px] tracking-widest">{item.name}</p>
                  {!publicConfigs[item.surveyType] && (
                    <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-rose-500">Đang đóng</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {onBack && (
          <div className="hidden justify-start md:flex">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#059669] active:scale-[0.98]"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
          </div>
        )}

        {/* Desktop Statistics Section */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-[#059669] rounded-full"></div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Thống kê hài lòng hệ thống</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[11px] font-black uppercase border border-blue-100">
                <Calendar size={14} />
                Tháng này
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {menuItems.filter(item => item.id !== 'baby').map((item) => (
              <div key={item.id} className="p-6 rounded-2xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-lg font-black text-slate-800">
                    {loading ? '...' : `${item.percent}%`}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: loading ? '0%' : `${item.percent}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- MOBILE VIEW (Premium) --- */}
      <div className="md:hidden max-w-md mx-auto space-y-8">
        {/* Grid Menu Container - Single White Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50">
          <div className="grid grid-cols-3 gap-y-10 gap-x-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => publicConfigs[item.surveyType] && setActiveTab(item.tab)}
                disabled={!publicConfigs[item.surveyType]}
                title={!publicConfigs[item.surveyType] ? 'Khảo sát đang đóng trong cấu hình public' : undefined}
                className={`flex flex-col items-center gap-4 group transition-all ${
                  publicConfigs[item.surveyType] ? 'active:scale-95' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300"
                  style={{ backgroundColor: item.bgColor, color: item.color }}
                >
                  {React.cloneElement(item.icon as any, { size: 24 })}
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter text-center leading-tight">
                  {item.name}
                </span>
                {!publicConfigs[item.surveyType] && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Đóng</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {onBack && (
          <div className="hidden justify-start md:flex">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase text-slate-600 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#059669] active:scale-[0.98]"
            >
              <ArrowLeft size={14} /> Quay lại
            </button>
          </div>
        )}

        {/* Statistics Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Thống kê hài lòng
            </h3>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
              <Calendar size={12} />
              Tháng này
            </div>
          </div>

          <div className="space-y-4">
            {menuItems.filter(item => item.id !== 'baby').map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    {loading ? '...' : `${item.percent}%`}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: loading ? '0%' : `${item.percent}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
