import React from 'react';
import { Calendar, Lock } from 'lucide-react';

/**
 * Bộ lọc dùng chung cho phần "Báo cáo quy trình" của các chỉ số JCI.
 * - Đơn vị: non-admin bị khóa theo đơn vị của user; admin chọn tự do (bỏ trống = toàn viện).
 * - Thời gian: chọn Năm + Tháng, hoặc nhập khoảng Từ ngày – Đến ngày (khoảng ngày sẽ ưu tiên).
 */
export interface ProcessReportFilterState {
  year: string;
  month: string;      // '' = cả năm, '1'..'12'
  startDate: string;  // '' = không dùng
  endDate: string;    // '' = không dùng
  department: string; // '' = tất cả đơn vị (chỉ admin)
}

/** Giá trị mặc định: admin = toàn viện; non-admin = đơn vị của user (khóa). */
export const makeDefaultReportFilter = (
  isAdmin: boolean,
  userDepartment?: string,
  year: string = String(new Date().getFullYear())
): ProcessReportFilterState => ({
  year,
  month: '',
  startDate: '',
  endDate: '',
  department: isAdmin ? '' : (userDepartment || '').trim(),
});

/** Kiểm tra một mốc thời gian có nằm trong kỳ báo cáo đã chọn không. */
export const matchesReportPeriod = (dateValue: any, f: ProcessReportFilterState): boolean => {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return false;

  // Ưu tiên khoảng ngày tùy chọn nếu có nhập
  if (f.startDate || f.endDate) {
    const t = d.getTime();
    if (f.startDate && t < new Date(`${f.startDate}T00:00:00`).getTime()) return false;
    if (f.endDate && t > new Date(`${f.endDate}T23:59:59.999`).getTime()) return false;
    return true;
  }

  // Theo Năm (+ Tháng tùy chọn)
  if (String(d.getFullYear()) !== f.year) return false;
  if (f.month && String(d.getMonth() + 1) !== f.month) return false;
  return true;
};

/** Mô tả kỳ báo cáo đang chọn, dùng cho dòng chú thích. */
export const describeReportPeriod = (f: ProcessReportFilterState): string => {
  if (f.startDate || f.endDate) {
    const from = f.startDate ? new Date(f.startDate).toLocaleDateString('vi-VN') : '…';
    const to = f.endDate ? new Date(f.endDate).toLocaleDateString('vi-VN') : '…';
    return `Từ ${from} đến ${to}`;
  }
  if (f.month) return `Tháng ${f.month}/${f.year}`;
  return `Năm ${f.year}`;
};

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));

interface Props {
  filter: ProcessReportFilterState;
  onChange: (f: ProcessReportFilterState) => void;
  departmentOptions: string[];
  isAdmin: boolean;
  yearOptions: string[];
  /** Nút xuất Excel / hành động, hiển thị cuối hàng lọc. */
  children?: React.ReactNode;
  /** Dòng chú thích tùy chọn dưới bộ lọc. */
  note?: React.ReactNode;
}

const inputCls =
  'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#059669] outline-none';

const ProcessReportFilter: React.FC<Props> = ({
  filter, onChange, departmentOptions, isAdmin, yearOptions, children, note,
}) => {
  const usingCustomRange = Boolean(filter.startDate || filter.endDate);
  const datalistId = React.useId();

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 lg:items-end">
        {/* Đơn vị */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
          <label className="text-sm font-medium text-slate-700">Đơn vị</label>
          {isAdmin ? (
            <>
              <input
                type="text"
                list={datalistId}
                value={filter.department}
                onChange={e => onChange({ ...filter, department: e.target.value })}
                placeholder="Gõ để tìm đơn vị… (bỏ trống = toàn viện)"
                className={inputCls}
              />
              <datalist id={datalistId}>
                {departmentOptions.map(n => <option key={n} value={n} />)}
              </datalist>
            </>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={filter.department || 'Đơn vị của bạn'}
                readOnly
                disabled
                title="Bạn chỉ xem được báo cáo của đơn vị mình"
                className={`${inputCls} pr-9 cursor-not-allowed text-slate-600`}
              />
              <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          )}
        </div>

        {/* Năm */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Năm</label>
          <select
            value={filter.year}
            onChange={e => onChange({ ...filter, year: e.target.value })}
            disabled={usingCustomRange}
            className={`${inputCls} ${usingCustomRange ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {yearOptions.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
        </div>

        {/* Tháng */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Tháng</label>
          <select
            value={filter.month}
            onChange={e => onChange({ ...filter, month: e.target.value })}
            disabled={usingCustomRange}
            className={`${inputCls} ${usingCustomRange ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">Cả năm</option>
            {MONTH_OPTIONS.map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
        </div>

        {/* Từ ngày – Đến ngày */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Calendar size={14} className="text-slate-400" /> Từ ngày – Đến ngày
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filter.startDate}
              max={filter.endDate || undefined}
              onChange={e => onChange({ ...filter, startDate: e.target.value })}
              className={inputCls}
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="date"
              value={filter.endDate}
              min={filter.startDate || undefined}
              onChange={e => onChange({ ...filter, endDate: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        {/* Hành động (nút xuất Excel) */}
        {children && (
          <div className="sm:col-span-2 lg:col-span-6 flex flex-col sm:flex-row sm:justify-end gap-2">
            {usingCustomRange && (
              <button
                type="button"
                onClick={() => onChange({ ...filter, startDate: '', endDate: '' })}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Bỏ khoảng ngày
              </button>
            )}
            {children}
          </div>
        )}
      </div>

      {note && <p className="text-xs text-slate-500 mt-3">{note}</p>}
    </div>
  );
};

export default ProcessReportFilter;
