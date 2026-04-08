import React, { useState, useEffect } from 'react';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';
import { ksMeSinhConService } from '../services/ksMeSinhConService';
import { KsMeSinhConList } from './KsMeSinhConList';
import { KsMeSinhConForm } from './KsMeSinhConForm';
import { KsMeSinhConDetail } from './KsMeSinhConDetail';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const KsMeSinhConSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [records, setRecords] = useState<KsMeSinhConRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<KsMeSinhConRecord | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

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

  const handleAddNew = () => {
    setSelected(undefined);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleEdit = (rec: KsMeSinhConRecord) => {
    setSelected(rec);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleView = (rec: KsMeSinhConRecord) => {
    setSelected(rec);
    setViewMode('DETAIL');
    setParentViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản khảo sát này?')) return;
    try {
      await ksMeSinhConService.delete(id);
      alert('Đã xóa bản khảo sát');
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleSave = async (payload: KsMeSinhConRecord) => {
    try {
      setSaving(true);
      if (selected?.id) {
        await ksMeSinhConService.update(selected.id, payload);
        alert('Cập nhật thành công');
      } else {
        await ksMeSinhConService.create(payload);
        alert('Tạo mới thành công');
      }
      await loadRecords();
      handleCancel();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Lỗi khi lưu dữ liệu');
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
      {viewMode === 'LIST' && (
        <KsMeSinhConList
          records={records}
          loading={loading}
          error={error}
          onAddNew={handleAddNew}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
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
