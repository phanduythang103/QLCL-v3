import React, { useState, useEffect } from 'react';
import { KsNuoiConRecord } from '../types/ksNuoiCon';
import { ksNuoiConService } from '../services/ksNuoiConService';
import { KsNuoiConList } from './KsNuoiConList';
import { KsNuoiConForm } from './KsNuoiConForm';
import { KsNuoiConDetail } from './KsNuoiConDetail';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

export const KsNuoiConSurvey: React.FC<Props> = ({ setParentViewMode }) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [records, setRecords] = useState<KsNuoiConRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<KsNuoiConRecord | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ksNuoiConService.fetchAll();
      setRecords(data);
    } catch (err: any) {
      console.error('Failed to load ks_nuoi_con records:', err);
      setError(err.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelected(undefined);
    setViewMode('FORM');
  };

  const handleEdit = (rec: KsNuoiConRecord) => {
    setSelected(rec);
    setViewMode('FORM');
  };

  const handleView = (rec: KsNuoiConRecord) => {
    setSelected(rec);
    setViewMode('DETAIL');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản khảo sát này?')) return;
    try {
      await ksNuoiConService.delete(id);
      alert('Đã xóa bản khảo sát');
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleSave = async (payload: KsNuoiConRecord) => {
    try {
      setSaving(true);
      if (selected?.id) {
        await ksNuoiConService.update(selected.id, payload);
        alert('Cập nhật thành công');
      } else {
        await ksNuoiConService.create(payload);
        alert('Tạo mới thành công');
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
    <div className="w-full p-4">
      {viewMode === 'LIST' && (
        <KsNuoiConList
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
        <KsNuoiConForm
          initialData={selected}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}
      {viewMode === 'DETAIL' && selected && (
        <KsNuoiConDetail data={selected} onBack={handleCancel} />
      )}
    </div>
  );
};
