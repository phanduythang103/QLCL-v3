import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateFilterState {
  type: string;
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  filter: DateFilterState;
  onChange: (filter: DateFilterState) => void;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ filter, onChange, className = '' }) => {
  const [showCustom, setShowCustom] = useState(filter.type === 'custom');

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    if (type === 'custom') {
      setShowCustom(true);
      onChange({ ...filter, type });
    } else {
      setShowCustom(false);
      onChange({ ...filter, type });
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="relative flex-1 sm:w-48">
        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={filter.type}
          onChange={handleTypeChange}
          className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] appearance-none outline-none"
        >
          <option value="all">Tất cả thời gian</option>
          <option value="thisWeek">Tuần này</option>
          <option value="lastWeek">Tuần trước</option>
          <option value="thisMonth">Tháng này</option>
          <option value="lastMonth">Tháng trước</option>
          <option value="thisQuarter">Quý này</option>
          <option value="lastQuarter">Quý trước</option>
          <option value="thisYear">Năm nay</option>
          <option value="lastYear">Năm trước</option>
          <option value="custom">Tùy chọn...</option>
        </select>
      </div>

      {showCustom && (
        <div className="flex gap-2 items-center animate-in fade-in slide-in-from-left-4">
          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-table font-bold focus:ring-2 focus:ring-[#009900] outline-none"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
