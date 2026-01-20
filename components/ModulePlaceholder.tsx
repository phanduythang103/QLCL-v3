import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description: string;
}

export const ModulePlaceholder: React.FC<Props> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md mb-6">{description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl w-full">
        <div className="p-4 border border-slate-100 rounded-lg bg-slate-50">
          <h3 className="font-semibold text-slate-700 text-sm mb-1">Chức năng chính</h3>
          <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
            <li>Quản lý dữ liệu tập trung</li>
            <li>Tìm kiếm và trích xuất thông tin</li>
            <li>Báo cáo tự động</li>
          </ul>
        </div>
        <div className="p-4 border border-slate-100 rounded-lg bg-slate-50">
           <h3 className="font-semibold text-slate-700 text-sm mb-1">Trạng thái</h3>
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
             Đang phát triển
           </span>
        </div>
      </div>
    </div>
  );
};
