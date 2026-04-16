import React, { useState, useEffect, useMemo } from 'react';
import { OutpatientSatisfactionList } from './OutpatientSatisfactionList';
import { OutpatientSatisfactionForm } from './OutpatientSatisfactionForm';
import { OutpatientSurveyResponse as SurveyType } from '../types/outpatientSatisfaction';
import { outpatientSatisfactionService } from '../services/outpatientSatisfactionService';
import { OutpatientSatisfactionDetail } from './OutpatientSatisfactionDetail';
import { DateFilterState } from '../../DateRangeFilter';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const OutpatientSatisfactionSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [surveys, setSurveys] = useState<SurveyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyType | undefined>();
  const [saving, setSaving] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    type: 'all', startDate: '', endDate: ''
  });
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [respondentFilter, setRespondentFilter] = useState<string>('all');

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await outpatientSatisfactionService.fetchOutpatientSurveys();
      setSurveys(data);
    } catch (err) {
      console.error('Failed to load outpatient surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      // 1. Filter by date
      let dateMatch = true;
      if (dateFilter.type !== 'all' && s.ngay_khao_sat) {
        const surveyDate = new Date(s.ngay_khao_sat);
        const now = new Date();

        switch (dateFilter.type) {
          case 'thisWeek': {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            dateMatch = surveyDate >= startOfWeek;
            break;
          }
          case 'lastWeek': {
            const startOfLastWeek = new Date(now);
            startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
            startOfLastWeek.setHours(0, 0, 0, 0);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23, 59, 59, 999);
            dateMatch = surveyDate >= startOfLastWeek && surveyDate <= endOfLastWeek;
            break;
          }
          case 'thisMonth': {
            dateMatch = surveyDate.getMonth() === now.getMonth() && surveyDate.getFullYear() === now.getFullYear();
            break;
          }
          case 'lastMonth': {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            dateMatch = surveyDate.getMonth() === lastMonth.getMonth() && surveyDate.getFullYear() === lastMonth.getFullYear();
            break;
          }
          case 'custom': {
            const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
            const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);
            if (start && end) dateMatch = surveyDate >= start && surveyDate <= end;
            else if (start) dateMatch = surveyDate >= start;
            else if (end) dateMatch = surveyDate <= end;
            break;
          }
          default: dateMatch = true;
        }
      } else if (dateFilter.type !== 'all' && !s.ngay_khao_sat) dateMatch = false;

      // 2. Filter by Area
      const areaMatch = areaFilter === 'all' || s.area === areaFilter;

      // 3. Filter by Respondent
      const respondentMatch = respondentFilter === 'all' || s.respondent === respondentFilter;

      return dateMatch && areaMatch && respondentMatch;
    });
  }, [surveys, dateFilter, areaFilter, respondentFilter]);

  const stats = useMemo(() => {
    const total = filteredSurveys.length;
    if (total === 0) return { total: 0, avgSatisfaction: 0 };

    const calculatePercentage = (s: SurveyType) => {
      let totalScore = 0;
      let validCount = 0;
      for (let i = 1; i <= 15; i++) {
        const val = (s as any)[`q${i}`];
        if (val && val > 0) {
          totalScore += val;
          validCount++;
        }
      }
      if (validCount === 0) return 0;
      return (totalScore / (validCount * 5)) * 100;
    };

    const sumPercentages = filteredSurveys.reduce((acc, s) => acc + calculatePercentage(s), 0);
    return {
      total,
      avgSatisfaction: Math.round(sumPercentages / total)
    };
  }, [filteredSurveys]);

  const handleAddNew = () => {
    setSelectedSurvey(undefined);
    setViewMode('FORM');
  };

  const handleEdit = (data: SurveyType) => {
    setSelectedSurvey(data);
    setViewMode('FORM');
  };

  const handleView = (data: SurveyType) => {
    setSelectedSurvey(data);
    setViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản khảo sát này?')) return;
    try {
      await outpatientSatisfactionService.deleteOutpatientSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleSave = async (data: SurveyType) => {
    try {
      setSaving(true);
      if (selectedSurvey?.id) {
        await outpatientSatisfactionService.updateOutpatientSurvey(selectedSurvey.id, data);
      } else {
        await outpatientSatisfactionService.createOutpatientSurvey(data);
      }
      loadSurveys();
      setViewMode('LIST');
    } catch (err) {
      console.error('Save error:', err);
      alert('Lỗi khi gửi phiếu khảo sát');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('LIST');
  };

  const renderView = () => {
    switch (viewMode) {
      case 'LIST':
        return (
          <OutpatientSatisfactionList
            surveys={filteredSurveys}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            areaFilter={areaFilter}
            setAreaFilter={setAreaFilter}
            respondentFilter={respondentFilter}
            setRespondentFilter={setRespondentFilter}
            totalSurveys={stats.total}
            avgSatisfaction={stats.avgSatisfaction}
          />
        );
      case 'DETAIL':
        return (
          <OutpatientSatisfactionDetail
            data={selectedSurvey}
            onBack={handleCancel}
          />
        );
      case 'FORM':
      default:
        return (
          <OutpatientSatisfactionForm
            initialData={selectedSurvey}
            readOnly={false}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
            setParentViewMode={setParentViewMode}
          />
        );
    }
  };

  return (
    <div className="w-full">
      {renderView()}
    </div>
  );
};
