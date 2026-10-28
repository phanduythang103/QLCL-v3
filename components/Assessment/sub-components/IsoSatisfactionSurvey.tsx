import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Eye, Plus, Trash2, Trophy, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import DateRangeFilter, { DateFilterState } from '../../DateRangeFilter';
import { useAuth } from '../../../contexts/AuthContext';
import { ISO_FORMS, IsoSurveyResponse, getIsoForm } from '../types/isoSatisfaction';
import { isoSatisfactionService } from '../services/isoSatisfactionService';
import { IsoSatisfactionForm } from './IsoSatisfactionForm';
import { IsoSurveyPaperView } from './IsoSurveyPaper';

interface Props {
  setParentViewMode: (mode: 'LIST' | 'FORM' | 'DETAIL') => void;
}

/** Lọc theo khoảng thời gian giống các khảo sát hài lòng khác */
const matchDate = (value: string | undefined, f: DateFilterState) => {
  if (f.type === 'all') return true;
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  switch (f.type) {
    case 'thisWeek': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return d >= start;
    }
    case 'lastWeek': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    case 'thisMonth':
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    case 'lastMonth': {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear();
    }
    case 'thisQuarter':
    case 'lastQuarter': {
      let q = Math.floor(now.getMonth() / 3) - (f.type === 'lastQuarter' ? 1 : 0);
      let y = now.getFullYear();
      if (q < 0) { q = 3; y -= 1; }
      return d.getFullYear() === y && Math.floor(d.getMonth() / 3) === q;
    }
    case 'thisYear':
      return d.getFullYear() === now.getFullYear();
    case 'lastYear':
      return d.getFullYear() === now.getFullYear() - 1;
    case 'custom': {
      const start = f.startDate ? new Date(f.startDate) : null;
      const end = f.endDate ? new Date(f.endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      return (!start || d >= start) && (!end || d <= end);
    }
    default:
      return true;
  }
};

const surveyCode = (s: IsoSurveyResponse) => {
  const d = s.ngay_khao_sat ? new Date(s.ngay_khao_sat) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `ISO-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

/** Giá trị câu trả lời dạng chữ (cho xuất Excel) */
const answerText = (mau: string, code: string, value: any, answers: Record<string, any>): string => {
  const form = getIsoForm(mau);
  const q = form?.groups.flatMap(g => g.questions.map(q => ({ q, scale: g.scale || form.scale }))).find(x => x.q.code === code);
  if (!q || value == null || value === '') return value == null ? '' : String(value);
  if (q.q.type === 'rating') return q.scale.find(s => s.value === value)?.label || String(value);
  if (q.q.type === 'single' || q.q.type === 'multi') {
    const vals: string[] = Array.isArray(value) ? value : [value];
    const options = q.q.options;
    return vals.map(v => {
      const o = options.find(o => o.value === v);
      return o?.other && answers[`${code}_other`] ? `${o.label}: ${answers[`${code}_other`]}` : (o?.label || v);
    }).join('; ');
  }
  return String(value);
};

export const IsoSatisfactionSurvey: React.FC<Props> = () => {
  const [viewMode, setViewMode] = useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [surveys, setSurveys] = useState<IsoSurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IsoSurveyResponse | undefined>();
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({ type: 'all', startDate: '', endDate: '' });
  const [mauFilter, setMauFilter] = useState<string>('all');

  const { user } = useAuth();
  const isAdmin = !!user?.role && (
    user.role.toLowerCase().includes('quản trị') ||
    user.role.toLowerCase().includes('admin')
  );

  const loadSurveys = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      setSurveys(await isoSatisfactionService.fetchSurveys());
    } catch (err: any) {
      setFetchError(err.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSurveys(); }, []);

  const filtered = useMemo(
    () => surveys.filter(s => matchDate(s.ngay_khao_sat, dateFilter) && (mauFilter === 'all' || s.mau === mauFilter)),
    [surveys, dateFilter, mauFilter]
  );

  const avgSatisfaction = useMemo(() => {
    const scored = filtered.filter(s => s.satisfaction_percent != null);
    return scored.length ? Math.round(scored.reduce((a, s) => a + (s.satisfaction_percent || 0), 0) / scored.length) : 0;
  }, [filtered]);

  const handleSave = async (data: IsoSurveyResponse) => {
    try {
      setSaving(true);
      if (selected?.id) await isoSatisfactionService.updateSurvey(selected.id, data);
      else await isoSatisfactionService.createSurvey(data);
      await loadSurveys();
      setViewMode('LIST');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu bản khảo sát');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản khảo sát này?')) return;
    try {
      await isoSatisfactionService.deleteSurvey(id);
      setSurveys(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Lỗi khi xóa bản khảo sát');
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) return alert('Không có dữ liệu để xuất.');
    const workbook = XLSX.utils.book_new();
    // Mỗi khoa xét nghiệm một sheet vì bộ câu hỏi khác nhau
    for (const form of ISO_FORMS) {
      const rows = filtered.filter(s => s.mau === form.key);
      if (!rows.length) continue;
      let tt = 0;
      const cols = form.groups.flatMap(g => g.questions.map(q => {
        if (g.table) tt++;
        return { code: q.code, header: g.table ? `Câu ${tt}` : q.text.split(/[.:]/)[0].slice(0, 40) };
      }));
      const data = rows.map((s, i) => ({
        'STT': i + 1,
        'Mã khảo sát': surveyCode(s),
        'Ngày khảo sát': s.ngay_khao_sat ? new Date(s.ngay_khao_sat).toLocaleDateString('vi-VN') : '',
        'Hài lòng (%)': s.satisfaction_percent ?? '',
        ...Object.fromEntries(cols.map(c => [c.header, answerText(form.key, c.code, s.answers?.[c.code], s.answers || {})])),
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), form.khoa.slice(0, 31).replace(/[\\/?*[\]:]/g, '-'));
    }
    XLSX.writeFile(workbook, `Khao_sat_hai_long_ISO_${new Date().getTime()}.xlsx`);
  };

  if (viewMode === 'FORM') {
    return <IsoSatisfactionForm initialData={selected} onSave={handleSave} onCancel={() => setViewMode('LIST')} saving={saving} />;
  }

  if (viewMode === 'DETAIL' && selected) {
    const form = getIsoForm(selected.mau);
    if (form) {
      return <IsoSurveyPaperView form={form} answers={selected.answers || {}} ngayKhaoSat={selected.ngay_khao_sat} onBack={() => setViewMode('LIST')} />;
    }
  }

  const scoreColor = (p: number) => (p >= 90 ? 'text-emerald-600 bg-emerald-50' : p >= 70 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-2 md:gap-6">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-emerald-50 rounded-lg md:rounded-2xl flex items-center justify-center text-[#059669] shrink-0">
            <Users size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Số phiếu</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{filtered.length}</h3>
          </div>
        </div>
        <div className="bg-white p-3 md:p-6 rounded-[1rem] md:rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-2 md:gap-6">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-amber-50 rounded-lg md:rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
            <Trophy size={20} className="md:w-8 md:h-8" />
          </div>
          <div className="text-center md:text-left">
            <p className="text-[7px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Hài lòng TB</p>
            <h3 className="text-lg md:text-3xl font-black text-slate-800 leading-tight">{avgSatisfaction}%</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
          <select
            value={mauFilter}
            onChange={e => setMauFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 text-slate-700 text-[10px] md:text-xs font-black rounded-xl px-4 py-2.5 outline-none focus:border-[#059669] transition-all"
          >
            <option value="all">Tất cả khoa xét nghiệm</option>
            {ISO_FORMS.map(f => <option key={f.key} value={f.key}>{f.khoa}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {isAdmin && (
            <button
              onClick={handleExportExcel}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg hover:shadow-xl transition-all"
            >
              <Download size={16} /> Xuất Excel
            </button>
          )}
          <button
            onClick={() => { setSelected(undefined); setViewMode('FORM'); }}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-[#059669] text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus size={16} /> Thêm phiếu mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#059669]/20 border-t-[#059669] rounded-full animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse uppercase text-xs">Đang tải dữ liệu...</p>
          </div>
        ) : fetchError ? (
          <div className="px-6 py-16 text-center space-y-3">
            <p className="text-rose-600 font-bold text-sm">{fetchError}</p>
            <button onClick={loadSurveys} className="px-6 py-2 bg-[#059669] text-white rounded-xl font-black text-xs uppercase">Thử lại</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-wider">
                  <th className="px-4 md:px-6 py-5">Mã khảo sát</th>
                  <th className="px-4 md:px-6 py-5">Khoa xét nghiệm</th>
                  <th className="px-4 md:px-6 py-5 text-center">Hài lòng (%)</th>
                  <th className="px-4 md:px-6 py-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <BarChart3 size={48} />
                        <p className="text-sm font-black uppercase">Chưa có dữ liệu</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(s => (
                  <tr key={s.id} onClick={() => { setSelected(s); setViewMode('DETAIL'); }} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td data-label="Mã khảo sát" className="px-4 md:px-6 py-4">
                      <span className="text-[10px] md:text-xs font-black text-[#059669] bg-emerald-50 px-2 md:px-3 py-1.5 rounded-lg border border-emerald-100">{surveyCode(s)}</span>
                      <span className="block mt-1 text-[10px] font-bold text-slate-400">{s.ngay_khao_sat ? new Date(s.ngay_khao_sat).toLocaleDateString('vi-VN') : ''}</span>
                    </td>
                    <td data-label="Khoa xét nghiệm" className="px-4 md:px-6 py-4 text-sm font-bold text-slate-700">{getIsoForm(s.mau)?.khoa || s.mau}</td>
                    <td data-label="Hài lòng (%)" className="px-4 md:px-6 py-4 text-center">
                      {s.satisfaction_percent != null ? (
                        <span className={`px-3 py-1.5 rounded-full text-[10px] md:text-xs font-black ${scoreColor(s.satisfaction_percent)}`}>{s.satisfaction_percent}%</span>
                      ) : <span className="text-slate-400 text-xs font-bold">—</span>}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                      <button className="inline-flex items-center gap-1 px-3 py-2 text-slate-500 hover:text-[#059669] hover:bg-emerald-50 rounded-xl font-black text-[10px] uppercase" title="Xem chi tiết">
                        <Eye size={16} /> Chi tiết
                      </button>
                      {isAdmin && s.id && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(s.id!); }}
                          className="inline-flex items-center gap-1 px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-black text-[10px] uppercase"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
