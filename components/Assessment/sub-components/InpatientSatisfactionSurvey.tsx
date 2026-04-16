import React, { useState, useEffect, useMemo } from 'react';
import { InpatientSatisfactionList } from './InpatientSatisfactionList';
import { InpatientSatisfactionForm } from './InpatientSatisfactionForm';
import { InpatientSatisfactionDetail } from './InpatientSatisfactionDetail';
import { InpatientSurveyResponse as SurveyType } from '../types/inpatientSatisfaction';
import { inpatientSatisfactionService } from '../services/inpatientSatisfactionService';
import { DateFilterState } from '../../DateRangeFilter';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const InpatientSatisfactionSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [surveys, setSurveys] = useState<SurveyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyType | undefined>();
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    type: 'all', startDate: '', endDate: ''
  });
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [respondentFilter, setRespondentFilter] = useState<string>('all');

  const loadSurveys = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await inpatientSatisfactionService.fetchInpatientSurveys();
      setSurveys(data);
    } catch (err: any) {
      console.error('Failed to load surveys:', err);
      setFetchError(err.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const sets = new Set<string>();
    surveys.forEach(s => { if (s.department) sets.add(s.department); });
    return Array.from(sets).sort();
  }, [surveys]);

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

      // 2. Filter by Dept
      const deptMatch = deptFilter === 'all' || s.department === deptFilter;

      // 3. Filter by Respondent
      const respondentMatch = respondentFilter === 'all' || s.respondent === respondentFilter;

      return dateMatch && deptMatch && respondentMatch;
    });
  }, [surveys, dateFilter, deptFilter, respondentFilter]);

  const stats = useMemo(() => {
    const total = filteredSurveys.length;
    if (total === 0) return { total: 0, avgSatisfaction: 0 };
    const sum = filteredSurveys.reduce((acc, s) => acc + (s.satisfaction_percent || 0), 0);
    return {
      total,
      avgSatisfaction: Math.round(sum / total)
    };
  }, [filteredSurveys]);

  const handleAddNew = () => {
    setSelectedSurvey(undefined);
    setViewMode('FORM');
  };

  const handleEdit = (user: any) => {
    setSelectedSurvey(user);
    setViewMode('FORM');
  };

  const handleView = (user: any) => {
    setSelectedSurvey(user);
    setViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản khảo sát này?')) return;
    try {
      await inpatientSatisfactionService.deleteInpatientSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleSave = async (data: SurveyType) => {
    try {
      setSaving(true);
      if (selectedSurvey?.id) {
        await inpatientSatisfactionService.updateInpatientSurvey(selectedSurvey.id, data);
      } else {
        await inpatientSatisfactionService.createInpatientSurvey(data);
      }
      loadSurveys();
      setViewMode('LIST');
    } catch (err) {
      console.error('Save error:', err);
      alert('Lỗi khi lưu bản khảo sát');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('LIST');
  };

  return (
    <div className="w-full">
      {viewMode === 'LIST' ? (
        <InpatientSatisfactionList
          surveys={filteredSurveys}
          loading={loading}
          error={fetchError}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
          onRetry={loadSurveys}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          respondentFilter={respondentFilter}
          setRespondentFilter={setRespondentFilter}
          departments={departments}
          totalSurveys={stats.total}
          avgSatisfaction={stats.avgSatisfaction}
        />
      ) : viewMode === 'DETAIL' ? (
        <InpatientSatisfactionDetail
          data={selectedSurvey}
          onBack={handleCancel}
        />
      ) : (
        <InpatientSatisfactionForm
          initialData={selectedSurvey}
          readOnly={false}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
    </div>
  );
};
