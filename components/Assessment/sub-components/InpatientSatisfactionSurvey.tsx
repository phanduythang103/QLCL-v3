import React, { useState, useEffect } from 'react';
import { InpatientSatisfactionList } from './InpatientSatisfactionList';
import { InpatientSatisfactionForm } from './InpatientSatisfactionForm';
import { InpatientSatisfactionDetail } from './InpatientSatisfactionDetail';
import { InpatientSurveyResponse } from '../types/inpatientSatisfaction';
import { inpatientSatisfactionService } from '../services/inpatientSatisfactionService';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const InpatientSatisfactionSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [surveys, setSurveys] = useState<InpatientSurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<InpatientSurveyResponse | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await inpatientSatisfactionService.fetchInpatientSurveys();
      setSurveys(data);
    } catch (err) {
      console.error('Failed to load surveys:', err);
      alert('Không thể tải danh sách khảo sát');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedSurvey(undefined);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleEdit = (data: InpatientSurveyResponse) => {
    setSelectedSurvey(data);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleView = (data: InpatientSurveyResponse) => {
    setSelectedSurvey(data);
    setViewMode('DETAIL');
    setParentViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản khảo sát này?')) return;
    try {
      await inpatientSatisfactionService.deleteInpatientSurvey(id);
      alert('Đã xóa bản khảo sát');
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleSave = async (data: InpatientSurveyResponse) => {
    try {
      setSaving(true);
      if (selectedSurvey?.id) {
        await inpatientSatisfactionService.updateInpatientSurvey(selectedSurvey.id, data);
        alert('Đã cập nhật bản khảo sát');
      } else {
        await inpatientSatisfactionService.createInpatientSurvey(data);
        alert('Đã gửi phiếu khảo sát thành công');
      }
      loadSurveys();
      setViewMode('LIST');
      setParentViewMode('LIST');
    } catch (err) {
      console.error('Save error:', err);
      alert('Lỗi khi lưu bản khảo sát');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('LIST');
    setParentViewMode('LIST');
  };

  return (
    <div className="w-full">
      {viewMode === 'LIST' ? (
        <InpatientSatisfactionList 
          surveys={surveys}
          loading={loading}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          onAddNew={handleAddNew}
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
