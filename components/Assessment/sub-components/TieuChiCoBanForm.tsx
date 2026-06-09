import React, { useState, useEffect, useRef } from 'react';
import { Save, X, ClipboardCheck, Calendar, User, Building, ChevronDown, ChevronRight, FileText, Edit, Activity, Trash2, ArrowUp } from 'lucide-react';
import { TieuChiCoBan } from '../types/tieuChiCoBan';
import dataJson from '../../../mcp/core/Template-form/tieu-chi-co-ban.json';
import { useAuth } from '../../../contexts/AuthContext';

interface Props {
  initialData?: TieuChiCoBan;
  onSave: (data: TieuChiCoBan) => void;
  onCancel: () => void;
  onEdit?: (data: TieuChiCoBan) => void;
  onDelete?: (id: string) => void;
  saving?: boolean;
  readOnly?: boolean;
}

export const TieuChiCoBanForm: React.FC<Props> = ({
  initialData,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  saving,
  readOnly
}) => {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<TieuChiCoBan>(initialData || {
    ngay_danh_gia: new Date().toISOString().split('T')[0],
    nguoi_danh_gia: user?.full_name || '',
    don_vi_danh_gia: '',
    ghi_chu: '',
    trang_thai: 'Hoàn thành',
    // ... initialize all c_x_y_z to false
  } as TieuChiCoBan);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'I': true, 'II': true, 'III': true, 'IV': true, 'V': true
  });

  useEffect(() => {
    if (!initialData) {
      // Initialize all boolean fields to false if new
      const initialBooleans: any = {};
      dataJson.f.forEach((group: any) => {
        if (group.t === 'grp' && group.i) {
          group.i.forEach((item: any) => {
            const fieldName = `c_${item.k.replace(/\./g, '_')}`;
            initialBooleans[fieldName] = false;
          });
        }
      });
      setFormData(prev => ({
        ...prev,
        ...initialBooleans,
        nguoi_danh_gia: prev.nguoi_danh_gia || user?.full_name || ''
      }));
    }
  }, [initialData, user]);

  const handleToggleGroup = (k: string) => {
    setExpandedGroups(prev => ({ ...prev, [k]: !prev[k] }));
  };

  const handleCheckboxChange = (k: string) => {
    const fieldName = `c_${k.replace(/\./g, '_')}` as keyof TieuChiCoBan;
    setFormData(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 z-[40] bg-slate-50 overflow-y-auto animate-in fade-in duration-300 no-scrollbar"
    >
      <div className="max-w-7xl mx-auto w-full min-h-full flex flex-col p-3 md:p-8 space-y-5 md:space-y-8">
        {/* SCYK Style Header - Now with Actions & Results */}
        <div className="bg-[#009900] rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl shadow-emerald-900/20 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 md:gap-6 relative group border border-white/20">
          <div className="flex items-start md:items-center gap-3 md:gap-4 text-white w-full lg:w-auto min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-sm shrink-0">
              <ClipboardCheck size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-[14px] md:text-xl uppercase tracking-tight leading-tight md:leading-none mb-1 break-words">
                <span className="block md:inline">{readOnly ? 'Chi tiết' : 'Đánh giá'}</span>
                <span className="block md:inline md:ml-1">Tiêu chuẩn chất lượng cơ bản</span>
              </h2>
              <p className="text-[9px] md:text-[10px] font-bold opacity-80 uppercase tracking-widest leading-relaxed">
                (Thông tư số 35/2024/TT-BYT)
              </p>
            </div>
          </div>

          {/* Results Summary in Header */}
          {(() => {
            const totalCriteria = 43;
            const totalMet = Object.keys(formData).filter(k => k.startsWith('c_') && (formData as any)[k] === true).length;
            const percentage = ((totalMet / totalCriteria) * 100).toFixed(1);
            return (
              <div className="grid grid-cols-2 gap-0 overflow-hidden bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md w-full lg:w-auto">
                <div className="flex flex-col items-center px-4 md:px-6 py-2.5">
                  <span className="text-[8px] md:text-[9px] font-black text-emerald-100 uppercase tracking-widest opacity-70">Tiêu chí đạt</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg md:text-xl font-black text-white">{totalMet}</span>
                    <span className="text-emerald-200/50 text-[10px] font-bold">/ {totalCriteria}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center px-4 md:px-6 py-2.5 border-l border-white/20">
                  <span className="text-[8px] md:text-[9px] font-black text-emerald-100 uppercase tracking-widest opacity-70">Tỷ lệ %</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg md:text-xl font-black text-white">{percentage}</span>
                    <span className="text-emerald-200/50 text-[10px] font-bold">%</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Actions in Header */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto justify-center lg:justify-end">
            <button
              onClick={onCancel}
              className="px-4 md:px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-white/20 flex items-center justify-center gap-2"
            >
              <X size={15} /> Đóng
            </button>

            {readOnly && initialData && (
              <>
                <button
                  onClick={() => onEdit?.(initialData)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95 border border-blue-400"
                >
                  <Edit size={16} /> Sửa
                </button>
                <button
                  onClick={() => {
                    if (confirm('Xác nhận xóa bản đánh giá này?')) {
                      onDelete?.(initialData.id!);
                      onCancel();
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 transition-all active:scale-95 border border-red-400"
                >
                  <Trash2 size={16} /> Xóa
                </button>
              </>
            )}

            {!readOnly && (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="col-span-1 md:col-span-1 bg-white hover:bg-emerald-50 text-[#009900] px-4 md:px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 disabled:opacity-50 border border-white"
              >
                {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu đánh giá</>}
              </button>
            )}
          </div>
        </div>

        <form className="space-y-10">
          {/* Section: GENERAL INFO (Matching Scyk style) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#009900]/20"></div>
            <h3 className="text-sm font-black text-blue-700 uppercase tracking-tight flex items-center gap-2 mb-2">
              <FileText className="text-blue-600" size={20} />
              Thông tin chung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  Ngày đánh giá
                </label>
                <input
                  type="date"
                  value={formData.ngay_danh_gia}
                  onChange={e => setFormData({ ...formData, ngay_danh_gia: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#009900] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  Người đánh giá
                </label>
                <input
                  type="text"
                  value={formData.nguoi_danh_gia}
                  readOnly
                  disabled
                  placeholder="Họ và tên..."
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: CRITERIA */}
          <div className="space-y-8">
            {dataJson.f.filter(f => f.t === 'grp').map((groupAny: any) => {
              const group = groupAny as { k: string, l: string, i: any[] };
              const isExpanded = expandedGroups[group.k];
              const criteriaCount = group.i.length;

              return (
                <div key={group.k} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 transition-all">
                  {/* Group Header matching the image */}
                  <div
                    onClick={() => handleToggleGroup(group.k)}
                    className="bg-[#009900] p-4 flex justify-between items-center cursor-pointer hover:bg-[#008800] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-sm text-white font-black text-xl shadow-lg">
                        {group.k}
                      </div>
                      <div className="text-white">
                        <h3 className="font-black text-lg uppercase tracking-tight leading-none mb-1">{group.l}</h3>
                        <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">{criteriaCount} TIÊU CHUẨN ĐÁNH GIÁ</p>
                      </div>
                    </div>
                    <div className="text-white/40">
                      <Activity size={32} strokeWidth={1} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 p-2 space-y-2 md:bg-white md:p-0 md:space-y-0 md:divide-y md:divide-slate-100">
                      {group.i.map((item: any) => {
                        const fieldName = `c_${item.k.replace(/\./g, '_')}` as keyof TieuChiCoBan;

                        return (
                          <div
                            key={item.k}
                            className="bg-white even:bg-[#E0FFFF] p-3 md:p-3.5 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-6 group hover:bg-slate-50 transition-all"
                          >
                            <div className="w-full md:w-auto flex items-center gap-3">
                              {/* ID Circle */}
                              <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-emerald-100 bg-white flex items-center justify-center text-[9px] md:text-xs font-black text-slate-400 group-hover:border-[#009900] group-hover:text-[#009900] transition-all">
                                {item.k}
                              </div>

                              {/* Content Text (Mobile Title Style) */}
                              <div className="flex-1 md:hidden">
                                <span className="text-[9px] font-black text-[#009900] uppercase tracking-widest">Tiêu chí {item.k}</span>
                              </div>
                            </div>

                            <div className="flex-1 w-full text-left">
                              <p className="font-black text-slate-800 text-[13px] md:text-[14px] leading-relaxed italic md:not-italic">
                                {item.l}
                              </p>
                            </div>

                            {/* Yes / No Buttons (Mobile Full Width) */}
                            <div className={`flex items-center gap-2 w-full md:w-auto shrink-0 mt-1 md:mt-0 ${readOnly ? 'pointer-events-none opacity-80' : ''}`}>
                              <button
                                type="button"
                                onClick={() => !readOnly && setFormData({ ...formData, [fieldName]: true })}
                                className={`flex-1 md:flex-none px-5 md:px-7 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 shadow-sm ${formData[fieldName] === true
                                  ? 'bg-[#009900] border-[#009900] text-white shadow-emerald-200'
                                  : 'bg-white border-slate-100 text-slate-400'
                                  }`}
                              >
                                CÓ
                              </button>
                              <button
                                type="button"
                                onClick={() => !readOnly && setFormData({ ...formData, [fieldName]: false })}
                                className={`flex-1 md:flex-none px-5 md:px-7 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 shadow-sm ${formData[fieldName] === false
                                  ? 'bg-red-500 border-red-500 text-white shadow-red-200'
                                  : 'bg-white border-slate-100 text-slate-400'
                                  }`}
                              >
                                KHÔNG
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Notes */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-blue-700 uppercase tracking-tight flex items-center gap-2">
              <Edit className="text-blue-600" size={20} />
              Ghi chú & Kết luận
            </h3>
            <textarea
              rows={4}
              value={formData.ghi_chu}
              onChange={e => setFormData({ ...formData, ghi_chu: e.target.value })}
              placeholder="Nhập ghi chú hoặc ý kiến bổ sung của đoàn đánh giá..."
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#009900] outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-center pb-8">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-[#009900] hover:border-[#009900] transition-all shadow-sm active:scale-95"
            >
              <ArrowUp size={14} /> Lên đầu trang
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
