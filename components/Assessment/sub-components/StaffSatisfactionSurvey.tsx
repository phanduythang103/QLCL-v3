import React, { useState, useEffect, useMemo } from 'react';
import { StaffSatisfactionSurvey as SurveyType } from '../types/staffSatisfaction';
import { staffSatisfactionService } from '../services/staffSatisfactionService';
import { StaffSatisfactionList } from './StaffSatisfactionList';
import { StaffSatisfactionForm } from './StaffSatisfactionForm';
import { StaffSatisfactionDetail } from './StaffSatisfactionDetail';
import DateRangeFilter, { DateFilterState } from '../../DateRangeFilter';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const StaffSatisfactionSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [surveys, setSurveys] = useState<SurveyType[]>([]);
  const [editingItem, setEditingItem] = useState<SurveyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [blockFilter, setBlockFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await staffSatisfactionService.fetchSurveys();
      setSurveys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      } else if (dateFilter.type !== 'all' && !s.ngay_khao_sat) {
        dateMatch = false;
      }

      // 2. Filter by Block
      const blockMatch = blockFilter === 'all' || s.block === blockFilter;

      // 3. Filter by Position
      const positionMatch = positionFilter === 'all' || s.position === positionFilter;

      return dateMatch && blockMatch && positionMatch;
    });
  }, [surveys, dateFilter, blockFilter, positionFilter]);

  const stats = useMemo(() => {
    const total = filteredSurveys.length;
    if (total === 0) return { total: 0, avgSatisfaction: 0 };

    const calculatePercentage = (s: SurveyType) => {
      let totalScore = 0;
      let validCount = 0;
      for (let i = 1; i <= 13; i++) {
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
    setEditingItem(null);
    setIsReadOnly(false);
    setViewMode('FORM');
  };

  const handleEdit = (item: SurveyType) => {
    setEditingItem(item);
    setIsReadOnly(false);
    setViewMode('FORM');
  };

  const handleView = (item: SurveyType) => {
    setEditingItem(item);
    setIsReadOnly(true);
    setViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản khảo sát này?')) return;
    try {
      await staffSatisfactionService.deleteSurvey(id);
      loadData();
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát.');
    }
  };

  const handleSave = async (data: SurveyType) => {
    setSaving(true);
    try {
      if (editingItem?.id) {
        await staffSatisfactionService.updateSurvey(editingItem.id, data);
      } else {
        await staffSatisfactionService.saveSurvey(data);
      }
      setViewMode('LIST');
      loadData();
    } catch (err) {
      alert('Lỗi khi lưu bản khảo sát.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('LIST');
  };

  const renderView = () => {
    switch (viewMode) {
      case 'DETAIL':
        return (
          <StaffSatisfactionDetail
            data={editingItem}
            onBack={handleCancel}
          />
        );
      case 'FORM':
        return (
          <StaffSatisfactionForm
            initialData={editingItem || undefined}
            readOnly={false}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        );
      case 'LIST':
      default:
        return (
          <StaffSatisfactionList
            surveys={filteredSurveys}
            loading={loading}
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            blockFilter={blockFilter}
            setBlockFilter={setBlockFilter}
            positionFilter={positionFilter}
            setPositionFilter={setPositionFilter}
            totalSurveys={stats.total}
            avgSatisfaction={stats.avgSatisfaction}
          />
        );
    }
  };

  return (
    <div className="relative min-h-[600px]">
      {renderView()}
    </div>
  );
};


