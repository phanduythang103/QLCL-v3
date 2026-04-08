import React from 'react';
import { 
  Plus, Search, FileText, Edit2, Trash2, Calendar, MapPin, User, Star
} from 'lucide-react';
import { KsMeSinhConRecord } from '../types/ksMeSinhCon';

interface Props {
  records: KsMeSinhConRecord[];
  loading: boolean;
  error: string | null;
  onAddNew: () => void;
  onEdit: (rec: KsMeSinhConRecord) => void;
  onView: (rec: KsMeSinhConRecord) => void;
  onDelete: (id: string) => void;
}

export const KsMeSinhConList: React.FC<Props> = ({
  records, loading, error, onAddNew, onEdit, onView, onDelete
}) => {
  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Đang tải dữ liệu...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 bg-red-50 text-red-600 rounded-3xl border border-red-100 text-center">
      <p className="font-black uppercase text-xs">Lỗi: {error}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Khảo sát người mẹ sinh con</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Danh sách các bản khảo sát đã thực hiện</p>
        </div>
        <button 
          onClick={onAddNew}
          className="flex items-center gap-2 bg-[#009900] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={18} /> Thêm khảo sát mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-black text-xs uppercase italic">Chưa có dữ liệu khảo sát</p>
          </div>
        ) : (
          records.map((rec) => (
            <div 
              key={rec.id}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-[#009900] group-hover:text-white transition-colors">
                  <User size={20} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onView(rec)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><FileText size={18} /></button>
                  <button onClick={() => onEdit(rec)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => rec.id && onDelete(rec.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-black text-slate-800 uppercase text-xs line-clamp-1">
                  Mẹ: {rec.mother_id || 'N/A'}
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14} className="shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{rec.survey_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin size={14} className="shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-tight truncate">{rec.hospital}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs font-black text-slate-700">{rec.satisfaction_percent}% hài lòng</span>
                   </div>
                   <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Hoàn thành</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
