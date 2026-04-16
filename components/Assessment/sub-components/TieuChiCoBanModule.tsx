import React, { useState, useEffect } from 'react';
import { TieuChiCoBan } from '../types/tieuChiCoBan';
import { tieuChiCoBanService } from '../services/tieuChiCoBanService';
import { TieuChiCoBanList } from './TieuChiCoBanList';
import { TieuChiCoBanForm } from './TieuChiCoBanForm';
import { ArrowLeft, ClipboardList } from 'lucide-react';

interface TieuChiCoBanModuleProps {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const TieuChiCoBanModule: React.FC<TieuChiCoBanModuleProps> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM'>('LIST');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [assessments, setAssessments] = useState<TieuChiCoBan[]>([]);
  const [editingItem, setEditingItem] = useState<TieuChiCoBan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await tieuChiCoBanService.fetchAssessments();
      setAssessments(data);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải danh sách đánh giá.');
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

  const handleEdit = (item: TieuChiCoBan) => {
    setEditingItem(item);
    setIsReadOnly(false);
    setViewMode('FORM');
  };

  const handleView = (item: TieuChiCoBan) => {
    setEditingItem(item);
    setIsReadOnly(true);
    setViewMode('FORM');
  };

  const handleDelete = async (id: string) => {
    try {
      await tieuChiCoBanService.deleteAssessment(id);
      loadData();
    } catch (err) {
      alert('Lỗi khi xóa bản đánh giá.');
    }
  };

  const handleSave = async (data: TieuChiCoBan) => {
    setSaving(true);
    try {
      if (editingItem?.id) {
        await tieuChiCoBanService.updateAssessment(editingItem.id, data);
      } else {
        await tieuChiCoBanService.saveAssessment(data);
      }
      setViewMode('LIST');
      loadData();
    } catch (err) {
      alert('Lỗi khi lưu bản đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative min-h-[600px]">


      {viewMode === 'LIST' ? (
        <TieuChiCoBanList
          assessments={assessments}
          loading={loading}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
        />
      ) : (
        <TieuChiCoBanForm
          initialData={editingItem || undefined}
          readOnly={isReadOnly}
          onSave={handleSave}
          onEdit={(data) => {
            setEditingItem(data);
            setIsReadOnly(false);
          }}
          onDelete={handleDelete}
          onCancel={() => {
            setViewMode('LIST');
          }}
          saving={saving}
        />
      )}
    </div>
  );
};
