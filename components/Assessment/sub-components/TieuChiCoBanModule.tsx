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
    setParentViewMode('FORM');
  };

  const handleEdit = (item: TieuChiCoBan) => {
    setEditingItem(item);
    setIsReadOnly(false);
    setViewMode('FORM');
    setParentViewMode('FORM');
  };

  const handleView = (item: TieuChiCoBan) => {
    setEditingItem(item);
    setIsReadOnly(true);
    setViewMode('FORM');
    setParentViewMode('FORM');
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
      setParentViewMode('LIST');
      loadData();
    } catch (err) {
      alert('Lỗi khi lưu bản đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative min-h-[600px]">
      {/* Header for Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#009900]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex items-center gap-4 relative">
          <div className="w-12 h-12 bg-emerald-50 text-[#009900] rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tiêu chuẩn chất lượng cơ bản</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Dựa trên danh sách tiêu chí Nghị định Luật khám chữa bệnh
            </p>
          </div>
        </div>
      </div>

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
            setParentViewMode('LIST');
          }}
          saving={saving}
        />
      )}
    </div>
  );
};
