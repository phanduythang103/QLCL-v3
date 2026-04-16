import React, { useState, useEffect, useMemo } from 'react';
import { KsMeSinhConRecord as RecordType } from '../types/ksMeSinhCon';
import { ksMeSinhConService } from '../services/ksMeSinhConService';
import { KsMeSinhConList } from './KsMeSinhConList';
import { KsMeSinhConForm } from './KsMeSinhConForm';
import { KsMeSinhConDetail } from './KsMeSinhConDetail';
import { DateFilterState } from '../../DateRangeFilter';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const KsMeSinhConSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecordType | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    type: 'all', startDate: '', endDate: ''
  });
  const [birthMethodFilter, setBirthMethodFilter] = useState<string>('all');

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ksMeSinhConService.fetchAll();
      setRecords(data);
    } catch (err: any) {
      console.error('Failed to load ks_me_sinh_con records:', err);
      setError(err.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Filter by date
      let dateMatch = true;
      if (dateFilter.type !== 'all' && r.survey_date) {
        const surveyDate = new Date(r.survey_date);
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
      } else if (dateFilter.type !== 'all' && !r.survey_date) dateMatch = false;

      // 2. Filter by Birth Method
      const methodMatch = birthMethodFilter === 'all' || String(r.birth_method) === birthMethodFilter;

      return dateMatch && methodMatch;
    });
  }, [records, dateFilter, birthMethodFilter]);

  const stats = useMemo(() => {
    const total = filteredRecords.length;
    if (total === 0) return { total: 0, avgSatisfaction: 0 };
    const sum = filteredRecords.reduce((acc, r) => acc + (r.satisfaction_percent || 0), 0);
    return {
      total,
      avgSatisfaction: Math.round(sum / total)
    };
  }, [filteredRecords]);

  const handleAddNew = () => {
    setSelected(undefined);
    setViewMode('FORM');
  };

  const handleEdit = (rec: RecordType) => {
    setSelected(rec);
    setViewMode('FORM');
  };

  const handleView = (rec: RecordType) => {
    setSelected(rec);
    setViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản khảo sát này?')) return;
    try {
      await ksMeSinhConService.delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleSave = async (payload: RecordType) => {
    try {
      setSaving(true);
      if (selected?.id) {
        await ksMeSinhConService.update(selected.id, payload);
      } else {
        await ksMeSinhConService.create(payload);
      }
      await loadRecords();
      setViewMode('LIST');
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Lỗi khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('LIST');
  };

  return (
    <div className="w-full">
      {viewMode === 'LIST' && (
        <KsMeSinhConList
          records={filteredRecords}
          loading={loading}
          error={error}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          birthMethodFilter={birthMethodFilter}
          setBirthMethodFilter={setBirthMethodFilter}
          totalRecords={stats.total}
          avgSatisfaction={stats.avgSatisfaction}
        />
      )}
      {viewMode === 'FORM' && (
        <KsMeSinhConForm
          initialData={selected}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
      {viewMode === 'DETAIL' && selected && (
        <KsMeSinhConDetail data={selected} onBack={handleCancel} />
      )}
    </div>
  );
};
