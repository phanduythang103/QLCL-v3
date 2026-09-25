import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';

/** Số dòng mỗi trang của bảng danh sách giám sát các chỉ số JCI */
export const JCI_PAGE_SIZE = 10;

/** Phân trang phía client; tự về trang 1 khi danh sách (bộ lọc) thay đổi */
export function usePagination<T>(items: T[], pageSize = JCI_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => { setPage(1); }, [items]);

  const current = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize]
  );
  return { page: current, setPage, totalPages, pageItems, total: items.length, pageSize };
}

/** Dãy số trang rút gọn: 1 … 4 5 6 … 12 */
const pageNumbers = (page: number, totalPages: number): (number | '…')[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push('…');
  out.push(totalPages);
  return out;
};

export const ListPagination: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  unit?: string;
}> = ({ page, totalPages, total, pageSize = JCI_PAGE_SIZE, onPageChange, unit = 'phiếu' }) => {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn = 'min-w-[32px] h-8 px-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
      <span className="text-xs text-slate-500">
        Hiển thị <b className="text-slate-700">{from}–{to}</b> / {total} {unit}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-100`} disabled={page <= 1} onClick={() => onPageChange(page - 1)} title="Trang trước">
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          {pageNumbers(page, totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-slate-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`${btn} ${p === page ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
              >
                {p}
              </button>
            )
          )}
          <button type="button" className={`${btn} border-slate-200 bg-white text-slate-600 hover:bg-slate-100`} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} title="Trang sau">
            <ChevronRight size={16} className="mx-auto" />
          </button>
        </div>
      )}
    </div>
  );
};

export interface DeptSummaryRow {
  dept: string;
  phieu: number;
  /** null = chỉ số không có khái niệm cơ hội/đạt (vd sự cố) */
  coHoi: number | null;
  dat: number | null;
}

/**
 * Gom danh sách phiếu theo đơn vị.
 * - getDept: 1 hoặc nhiều đơn vị của phiếu (vd sự cố bàn giao tính cho cả khoa giao và khoa nhận)
 * - getCounts: số cơ hội / số đạt của phiếu; bỏ trống nếu chỉ số không có tỷ lệ đạt
 */
export function summarizeByDept<T>(
  items: T[],
  getDept: (item: T) => string | string[] | null | undefined,
  getCounts?: (item: T) => { coHoi: number; dat: number },
): { rows: DeptSummaryRow[]; total: DeptSummaryRow } {
  const map = new Map<string, DeptSummaryRow>();
  const total: DeptSummaryRow = { dept: 'Tổng cộng', phieu: 0, coHoi: getCounts ? 0 : null, dat: getCounts ? 0 : null };
  for (const item of items) {
    const raw = getDept(item);
    const depts = Array.from(new Set((Array.isArray(raw) ? raw : [raw]).map(d => (d || '').trim()).filter(Boolean)));
    if (depts.length === 0) depts.push('Chưa xác định');
    const c = getCounts?.(item);
    for (const d of depts) {
      const row = map.get(d) || { dept: d, phieu: 0, coHoi: c ? 0 : null, dat: c ? 0 : null };
      row.phieu += 1;
      if (c) { row.coHoi = (row.coHoi || 0) + c.coHoi; row.dat = (row.dat || 0) + c.dat; }
      map.set(d, row);
    }
    total.phieu += 1;
    if (c) { total.coHoi = (total.coHoi || 0) + c.coHoi; total.dat = (total.dat || 0) + c.dat; }
  }
  const rows = Array.from(map.values()).sort((a, b) => b.phieu - a.phieu || a.dept.localeCompare(b.dept, 'vi'));
  return { rows, total };
}

const RateCell: React.FC<{ coHoi: number | null; dat: number | null }> = ({ coHoi, dat }) => {
  if (coHoi === null || dat === null || coHoi === 0) return <span className="text-slate-400">—</span>;
  const rate = (dat / coHoi) * 100;
  const cls = rate >= 90 ? 'bg-green-100 text-green-700' : rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${cls}`}>{rate.toFixed(1)}%</span>;
};

/** Bảng tổng hợp số lượng giám sát theo đơn vị (đặt dưới bảng danh sách) */
export const DeptSummaryTable: React.FC<{
  rows: DeptSummaryRow[];
  total: DeptSummaryRow;
  title?: string;
  phieuLabel?: string;
  coHoiLabel?: string;
  note?: string;
}> = ({
  rows,
  total,
  title = 'Tổng hợp giám sát theo đơn vị',
  phieuLabel = 'Số phiếu giám sát',
  coHoiLabel = 'Số cơ hội',
  note,
}) => {
  if (total.phieu === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <Building2 size={16} className="text-teal-600 shrink-0" />
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        <span className="ml-auto text-xs text-slate-500">{rows.length} đơn vị</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="p-3 w-12 text-center">STT</th>
              <th className="p-3">Tên đơn vị</th>
              <th className="p-3 text-center whitespace-nowrap">{phieuLabel}</th>
              <th className="p-3 text-center whitespace-nowrap">{coHoiLabel}</th>
              <th className="p-3 text-center whitespace-nowrap">Tỷ lệ đạt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={r.dept} className="hover:bg-slate-50">
                <td className="p-3 text-center text-slate-500">{i + 1}</td>
                <td className="p-3 font-medium text-slate-700">{r.dept}</td>
                <td className="p-3 text-center">{r.phieu}</td>
                <td className="p-3 text-center">{r.coHoi ?? <span className="text-slate-400">—</span>}</td>
                <td className="p-3 text-center"><RateCell coHoi={r.coHoi} dat={r.dat} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
            <tr>
              <td className="p-3" />
              <td className="p-3">{total.dept}</td>
              <td className="p-3 text-center">{total.phieu}</td>
              <td className="p-3 text-center">{total.coHoi ?? <span className="text-slate-400">—</span>}</td>
              <td className="p-3 text-center"><RateCell coHoi={total.coHoi} dat={total.dat} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {note && <p className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100">{note}</p>}
    </div>
  );
};
