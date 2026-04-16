import React, { useState, useEffect } from 'react';
import { StaffSatisfactionSurvey as SurveyType } from '../types/staffSatisfaction';
import { staffSatisfactionService } from '../services/staffSatisfactionService';
import { StaffSatisfactionList } from './StaffSatisfactionList';
import { StaffSatisfactionForm } from './StaffSatisfactionForm';
import { StaffSatisfactionDetail } from './StaffSatisfactionDetail';

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
            surveys={surveys}
            loading={loading}
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
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
