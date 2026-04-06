import React, { useState, useEffect } from 'react';
import { OutpatientSatisfactionList } from './OutpatientSatisfactionList';
import { OutpatientSatisfactionForm } from './OutpatientSatisfactionForm';
import { OutpatientSurveyResponse } from '../types/outpatientSatisfaction';
import { outpatientSatisfactionService } from '../services/outpatientSatisfactionService';

import { OutpatientSatisfactionDetail } from './OutpatientSatisfactionDetail';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const OutpatientSatisfactionSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [surveys, setSurveys] = useState<OutpatientSurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<OutpatientSurveyResponse | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

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

  const handleAddNew = () => {
    setSelectedSurvey(undefined);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleEdit = (data: OutpatientSurveyResponse) => {
    setSelectedSurvey(data);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleView = (data: OutpatientSurveyResponse) => {
    setSelectedSurvey(data);
    setViewMode('DETAIL');
    setParentViewMode('DETAIL');
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

  const handleSave = async (data: OutpatientSurveyResponse) => {
    try {
      setSaving(true);
      if (selectedSurvey?.id) {
        await outpatientSatisfactionService.updateOutpatientSurvey(selectedSurvey.id, data);
      } else {
        await outpatientSatisfactionService.createOutpatientSurvey(data);
      }
      loadSurveys();
      setViewMode('LIST');
      setParentViewMode('LIST');
    } catch (err) {
      console.error('Save error:', err);
      alert('Lỗi khi gửi phiếu khảo sát');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setViewMode('LIST');
    setParentViewMode('LIST');
  };

  const renderView = () => {
    switch (viewMode) {
      case 'LIST':
        return (
          <OutpatientSatisfactionList 
            surveys={surveys}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onAddNew={handleAddNew}
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
