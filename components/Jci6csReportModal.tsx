import React, { useEffect, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import {
  X, FileDown, Download, Trash2, Loader2, FileText, CalendarRange, Building2, Pencil, Save, Plus, ListChecks, Search, ArrowLeft, Eye,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  buildJci6csReport, CapBaoCao, KyLoai, ReportPeriod, CAP_BAO_CAO_LABEL, describePeriod, Jci6csReportData,
  INDICATOR_ORDER, INDICATOR_META, IndicatorId, KienNghiRow, defaultKienNghi, emptyKienNghi, formatMetricValue, fmtNum,
  DANH_GIA_OPTIONS, TREND_OPTIONS, TrendValue, danhGiaChecksOf, datMucTieuFromChecks, xuHuongOf, periodMonths, mkMonth,
} from '../utils/jci6csReport';
import { buildJci6csDocx, jci6csFileName } from '../utils/jci6csReportDocx';
import {
  BaoCaoJci6cs, fetchBaoCaoJci6cs, addBaoCaoJci6cs, fetchBaoCaoJci6csFile, deleteBaoCaoJci6cs,
  fetchBaoCaoJci6csData, updateBaoCaoJci6cs, findBaoCaoJci6cs, blobToBase64, base64ToBlob,
} from '../readBaoCaoJci6cs';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

const KY_OPTIONS: { value: KyLoai; label: string }[] = [
  { value: 'thang', label: 'Tháng' },
  { value: 'quy', label: 'Quý' },
  { value: 'nam', label: 'Năm' },
];

/** Kỳ mặc định: tháng hiện tại; đầu tháng (≤ ngày 05) thì lấy tháng trước để kịp hạn nộp. */
const defaultPeriod = (): { thang: number; quy: number; nam: number } => {
  const now = new Date();
  const d = now.getDate() <= 5 ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now;
  return { thang: d.getMonth() + 1, quy: Math.floor(d.getMonth() / 3) + 1, nam: d.getFullYear() };
};

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30';
const textareaCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30';
const labelCls = 'mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-500';

/** Quyền theo tài khoản: user thường chỉ thao tác báo cáo cấp khoa của đơn vị mình. */
const useReportAccess = () => {
  const { user } = useAuth();
  const isAdmin = !!(user?.role?.toLowerCase().includes('quản trị') || user?.role?.toLowerCase().includes('admin'));
  const userDept = (user?.department || '').trim();
  const userName = user?.full_name || user?.username || '';
  return { isAdmin, userDept, userName };
};

/** Khung modal dùng chung. */
const ModalShell: React.FC<{
  title: string; icon: React.ReactNode; onClose: () => void; maxWidth?: string; footer?: React.ReactNode; children: React.ReactNode; z?: string;
}> = ({ title, icon, onClose, maxWidth = 'max-w-3xl', footer, children, z = 'z-[150]' }) => (
  <div className={`fixed inset-0 ${z} flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4`} onClick={onClose}>
    <div className={`flex max-h-[94vh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-black uppercase tracking-tight text-slate-900 sm:text-lg">
          {icon} <span className="truncate">{title}</span>
        </h3>
        <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng">
          <X size={20} />
        </button>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">{footer}</div>}
    </div>
  </div>
);

const Alert: React.FC<{ kind: 'error' | 'success'; children: React.ReactNode }> = ({ kind, children }) => (
  <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${kind === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
    {children}
  </div>
);

// ===========================================================================
// 1. Tạo báo cáo: tổng hợp số liệu -> lưu DB -> mở form sửa (không tự tải file)
// ===========================================================================

export const Jci6csReportModal: React.FC<{
  onClose: () => void;
  onCreated: (item: BaoCaoJci6cs) => void;
  onOpenExisting: (item: BaoCaoJci6cs) => void;
}> = ({ onClose, onCreated, onOpenExisting }) => {
  const { isAdmin, userDept, userName } = useReportAccess();

  const init = defaultPeriod();
  const [kyLoai, setKyLoai] = useState<KyLoai>('thang');
  const [thang, setThang] = useState(init.thang);
  const [quy, setQuy] = useState(init.quy);
  const [nam, setNam] = useState(init.nam);
  // User thường: mặc định cấp Khoa/đơn vị; Admin chọn Cơ quan/đầu mối hoặc Toàn viện
  const [cap, setCap] = useState<CapBaoCao>(isAdmin ? 'toan_vien' : 'khoa');
  const [tenCoQuan, setTenCoQuan] = useState(userDept);
  const [kinhGui, setKinhGui] = useState('Giám đốc Bệnh viện Quân y 103');
  // Mặc định áp dụng cả 6 chỉ số; đơn vị bỏ chọn chỉ số không áp dụng (KAD)
  const [khongApDung, setKhongApDung] = useState<IndicatorId[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const period: ReportPeriod = { loai: kyLoai, so: kyLoai === 'thang' ? thang : kyLoai === 'quy' ? quy : 0, nam };
  const donVi = cap === 'khoa' ? userDept : cap === 'co_quan' ? tenCoQuan.trim() : 'Bệnh viện Quân y 103';
  const reportKey = { ky_loai: period.loai, ky_so: period.so, nam: period.nam, cap_bao_cao: cap, don_vi: donVi };

  // Mỗi đơn vị chỉ 1 báo cáo cho mỗi kỳ: kiểm tra ngay khi đổi kỳ/cấp để báo trước
  const [existing, setExisting] = useState<BaoCaoJci6cs | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (!donVi) { setExisting(null); return; }
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(() => {
      findBaoCaoJci6cs(reportKey)
        .then(r => { if (!cancelled) setExisting(r); })
        .catch(() => { if (!cancelled) setExisting(null); })
        .finally(() => { if (!cancelled) setChecking(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [period.loai, period.so, period.nam, cap, donVi]);

  const handleCreate = async () => {
    setError('');
    if (cap === 'khoa' && !userDept) {
      setError('Tài khoản chưa được gán Khoa/đơn vị, không thể lập báo cáo cấp khoa.');
      return;
    }
    if (cap === 'co_quan' && !donVi) {
      setError('Vui lòng nhập tên Cơ quan/đầu mối chỉ số.');
      return;
    }
    setCreating(true);
    try {
      const dup = await findBaoCaoJci6cs(reportKey);
      if (dup) {
        setExisting(dup);
        return;
      }
      const data = await buildJci6csReport({ period, cap, donVi, kinhGui: kinhGui.trim(), nguoiLap: userName, khongApDung });
      const blob = await buildJci6csDocx(data);
      const saved = await addBaoCaoJci6cs({
        ky_loai: period.loai,
        ky_so: period.so,
        nam: period.nam,
        cap_bao_cao: cap,
        don_vi: donVi,
        ten_bao_cao: `BC 06 chỉ số - ${describePeriod(period)} - ${cap === 'toan_vien' ? 'Toàn viện' : donVi}`,
        ten_file: jci6csFileName(data),
        file_base64: await blobToBase64(blob),
        so_lieu: data,
        nguoi_tao: userName || null,
      });
      onCreated(saved);
    } catch (e: any) {
      // Chỉ mục unique trên DB chặn trường hợp 2 người tạo cùng lúc
      setError(/duplicate key|unique/i.test(e.message)
        ? `${donVi} đã có báo cáo ${describePeriod(period)}. Mỗi đơn vị chỉ được tạo 1 báo cáo cho mỗi kỳ.`
        : `Lỗi tạo báo cáo: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <ModalShell
      title="Xuất báo cáo tổng hợp 06 chỉ số"
      icon={<FileText className="text-teal-500" size={22} />}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Kỳ báo cáo */}
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <CalendarRange size={16} className="text-teal-500" /> Kỳ báo cáo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {KY_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setKyLoai(o.value)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-black transition-all ${kyLoai === o.value ? 'border-teal-500 bg-teal-500 text-white shadow-sm shadow-teal-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kyLoai === 'thang' && (
              <select value={thang} onChange={e => setThang(Number(e.target.value))} className={inputCls}>
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
              </select>
            )}
            {kyLoai === 'quy' && (
              <select value={quy} onChange={e => setQuy(Number(e.target.value))} className={inputCls}>
                {[1, 2, 3, 4].map(q => <option key={q} value={q}>Quý {q}</option>)}
              </select>
            )}
            <select value={nam} onChange={e => setNam(Number(e.target.value))} className={`${inputCls} ${kyLoai === 'nam' ? 'col-span-2' : ''}`}>
              {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          </div>
        </section>

        {/* Cấp báo cáo */}
        <section className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <Building2 size={16} className="text-teal-500" /> Cấp báo cáo
          </label>
          {isAdmin ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {(['co_quan', 'toan_vien'] as CapBaoCao[]).map(c => (
                <label
                  key={c}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${cap === c ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <input type="checkbox" checked={cap === c} onChange={() => setCap(c)} className="size-4 accent-teal-600" />
                  {CAP_BAO_CAO_LABEL[c]}
                </label>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
              {CAP_BAO_CAO_LABEL.khoa}: <span className="font-black">{userDept || 'Chưa gán khoa/đơn vị'}</span>
            </div>
          )}
          {isAdmin && cap === 'co_quan' && (
            <input
              value={tenCoQuan}
              onChange={e => setTenCoQuan(e.target.value)}
              placeholder="Tên cơ quan/đầu mối chỉ số (VD: Phòng Quản lý chất lượng)"
              className={inputCls}
            />
          )}
          <input value={kinhGui} onChange={e => setKinhGui(e.target.value)} placeholder="Kính gửi" className={inputCls} />
          <p className="text-xs font-medium text-slate-400">
            {cap === 'khoa'
              ? 'Số liệu lọc theo khoa/đơn vị của tài khoản. Tỷ suất sự cố bàn giao và ngã chỉ tính được ở cấp toàn viện (mẫu số nhập theo toàn viện).'
              : 'Số liệu tổng hợp toàn bộ các khoa/đơn vị trong bệnh viện.'}
          </p>
        </section>

        {/* Chỉ số áp dụng */}
        <section className="space-y-3">
          <label className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
            <ListChecks size={16} className="text-teal-500" /> Chỉ số áp dụng
            <span className="font-semibold normal-case tracking-normal text-slate-400">(bấm để chuyển sang Không áp dụng – KAD)</span>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {INDICATOR_ORDER.map(id => {
              const apDung = !khongApDung.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setKhongApDung(prev => (apDung ? [...prev, id] : prev.filter(x => x !== id)))}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${apDung ? 'border-teal-200 bg-teal-50/60' : 'border-slate-200 bg-slate-50'}`}
                >
                  <span className="min-w-0">
                    <span className={`block text-xs font-black ${apDung ? 'text-teal-800' : 'text-slate-400 line-through'}`}>{INDICATOR_META[id].code}</span>
                    <span className="block truncate text-xs font-semibold text-slate-500">{INDICATOR_META[id].shortTen}</span>
                  </span>
                  <span className={`flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase ${apDung ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {apDung ? 'Áp dụng' : 'KAD'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {error && <Alert kind="error">{error}</Alert>}
        {existing && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <p>
              {cap === 'toan_vien' ? 'Toàn viện' : donVi} đã có báo cáo {describePeriod(period)}
              {existing.nguoi_tao ? ` (${existing.nguoi_tao} tạo lúc ${fmtDateTime(existing.created_at)})` : ''}.
              Mỗi đơn vị chỉ được tạo 1 báo cáo cho mỗi kỳ.
            </p>
            <button
              onClick={() => onOpenExisting(existing)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600"
            >
              <Pencil size={14} /> Mở báo cáo đã có
            </button>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={creating || checking || !!existing}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-teal-200 transition-colors hover:bg-teal-600 disabled:opacity-60"
        >
          {creating ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
          {creating ? 'Đang tổng hợp số liệu...' : `Tạo báo cáo ${describePeriod(period)}`}
        </button>
        <p className="text-center text-xs text-slate-400">Báo cáo được lưu vào danh sách; sau khi tạo có thể chỉnh sửa nội dung trước khi tải file Word.</p>
      </div>
    </ModalShell>
  );
};

// ===========================================================================
// 2. Trang danh sách báo cáo đã lưu (user chỉ thấy báo cáo của đơn vị mình)
// ===========================================================================

const kyLabel = (i: BaoCaoJci6cs) => describePeriod({ loai: i.ky_loai, so: i.ky_so, nam: i.nam });

export const Jci6csReportListPage: React.FC<{ onBack: () => void; initialEdit?: { item: BaoCaoJci6cs; justCreated: boolean } | null }> = ({ onBack, initialEdit }) => {
  const { isAdmin, userDept, userName } = useReportAccess();
  const [items, setItems] = useState<BaoCaoJci6cs[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [namFilter, setNamFilter] = useState<string>('all');
  const [kyFilter, setKyFilter] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BaoCaoJci6cs | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<{ item: BaoCaoJci6cs; justCreated: boolean; readOnly?: boolean } | null>(initialEdit ?? null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    if (!isAdmin && !userDept) {
      setItems([]);
      setLoading(false);
      setError('Tài khoản chưa được gán Khoa/đơn vị nên không có báo cáo để hiển thị.');
      return;
    }
    fetchBaoCaoJci6cs(isAdmin ? null : userDept)
      .then(list => { if (!cancelled) setItems(list); })
      .catch(e => { if (!cancelled) setError(`Không tải được danh sách báo cáo: ${e.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, userDept, reloadKey]);

  const years = useMemo(() => [...new Set(items.map(i => i.nam))].sort((a, b) => b - a), [items]);
  const filtered = items.filter(i =>
    (namFilter === 'all' || String(i.nam) === namFilter) &&
    (kyFilter === 'all' || i.ky_loai === kyFilter) &&
    (!search.trim() || `${i.ten_bao_cao} ${i.nguoi_tao || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  );

  const handleDownload = async (item: BaoCaoJci6cs) => {
    setDownloadingId(item.id);
    setError('');
    try {
      // Tạo lại file từ nội dung đã lưu để báo cáo cũ cũng theo đúng mẫu hiện hành;
      // chỉ dùng file lưu sẵn khi báo cáo không có dữ liệu nội dung
      const data: Jci6csReportData | null = await fetchBaoCaoJci6csData(item.id);
      if (data?.indicators) {
        saveAs(await buildJci6csDocx(data), item.ten_file);
      } else {
        const b64 = await fetchBaoCaoJci6csFile(item.id);
        if (!b64) throw new Error('Báo cáo không có nội dung file');
        saveAs(base64ToBlob(b64), item.ten_file);
      }
    } catch (e: any) {
      setError(`Lỗi tải báo cáo: ${e.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBaoCaoJci6cs(deleteTarget.id);
      setItems(prev => prev.filter(h => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(`Lỗi xóa báo cáo: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteItem = (item: BaoCaoJci6cs) => isAdmin || (!!item.nguoi_tao && item.nguoi_tao === userName);

  const actions = (item: BaoCaoJci6cs) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={() => setEditing({ item, justCreated: false, readOnly: true })}
        className="flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 hover:bg-sky-100"
        title="Xem báo cáo (chỉ xem)"
      >
        <Eye size={14} /> Xem
      </button>
      <button
        onClick={() => setEditing({ item, justCreated: false })}
        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
        title="Sửa nội dung báo cáo"
      >
        <Pencil size={14} /> Sửa
      </button>
      <button
        onClick={() => handleDownload(item)}
        disabled={downloadingId === item.id}
        className="flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 hover:bg-teal-100 disabled:opacity-60"
        title="Tải xuống báo cáo"
      >
        {downloadingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Tải về
      </button>
      {canDeleteItem(item) && (
        <button
          onClick={() => setDeleteTarget(item)}
          className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Xóa báo cáo"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );

  if (editing) {
    return (
      <Jci6csReportEditor
        item={editing.item}
        justCreated={editing.justCreated}
        readOnly={editing.readOnly}
        onClose={() => setEditing(null)}
        onSaved={() => setReloadKey(k => k + 1)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100" title="Quay lại danh mục chỉ số">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800">Danh sách báo cáo tổng hợp 06 chỉ số</h2>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-200 transition-colors hover:bg-teal-600 sm:w-auto"
        >
          <Plus size={18} /> Tạo báo cáo mới
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên báo cáo, người tạo..." className={`${inputCls} pl-9`} />
          </div>
          <select value={kyFilter} onChange={e => setKyFilter(e.target.value)} className={`${inputCls} md:w-40`}>
            <option value="all">Tất cả kỳ</option>
            {KY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={namFilter} onChange={e => setNamFilter(e.target.value)} className={`${inputCls} md:w-40`}>
            <option value="all">Tất cả năm</option>
            {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
        </div>

        {!isAdmin && userDept && (
          <p className="px-4 pt-3 text-xs font-medium text-slate-400">Chỉ hiển thị báo cáo của đơn vị <span className="font-bold text-slate-600">{userDept}</span>.</p>
        )}
        {error && <div className="px-4 pt-3"><Alert kind="error">{error}</Alert></div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Đang tải...</div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">Chưa có báo cáo nào.</p>
        ) : (
          <>
            {/* Desktop: bảng */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center">TT</th>
                    <th className="px-4 py-3 text-left">Kỳ báo cáo</th>
                    <th className="px-4 py-3 text-left">Cấp báo cáo</th>
                    <th className="px-4 py-3 text-left">Đơn vị</th>
                    <th className="px-4 py-3 text-left">Người tạo</th>
                    <th className="px-4 py-3 text-left">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-800">{kyLabel(item)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{CAP_BAO_CAO_LABEL[item.cap_bao_cao]}</td>
                      <td className="px-4 py-3 text-slate-600">{item.cap_bao_cao === 'toan_vien' ? 'Toàn viện' : item.don_vi || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.nguoi_tao || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtDateTime(item.created_at)}</td>
                      <td className="px-4 py-3">{actions(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile: thẻ */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {filtered.map(item => (
                <li key={item.id} className="space-y-2 px-4 py-3">
                  <p className="text-sm font-bold text-slate-800">{item.ten_bao_cao}</p>
                  <p className="text-xs text-slate-400">{CAP_BAO_CAO_LABEL[item.cap_bao_cao]} · {item.nguoi_tao || '—'} · {fmtDateTime(item.created_at)}</p>
                  {actions(item)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {showCreate && (
        <Jci6csReportModal
          onClose={() => setShowCreate(false)}
          onCreated={item => { setShowCreate(false); setItems(prev => [item, ...prev]); setEditing({ item, justCreated: true }); }}
          onOpenExisting={item => { setShowCreate(false); setEditing({ item, justCreated: false }); }}
        />
      )}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        message={`Xóa báo cáo "${deleteTarget?.ten_bao_cao || ''}"? Thao tác này không thể hoàn tác.`}
      />
    </div>
  );
};

// ===========================================================================
// 3. Form sửa nội dung báo cáo theo mẫu -> lưu lại & tạo lại file Word
// ===========================================================================

const AutoTextarea: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number }> = ({ value, onChange, placeholder, minRows = 2 }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={Math.max(minRows, Math.min(10, (value || '').split('\n').length + Math.floor((value || '').length / 90)))}
    className={textareaCls}
  />
);

/** Ô tích giống mẫu Word; ô trong cùng nhóm loại trừ nhau, bấm lại ô đang tích để bỏ tích. */
const CheckItem: React.FC<{ checked: boolean; label: string; onToggle: () => void; disabled?: boolean }> = ({ checked, label, onToggle, disabled }) => (
  <label className={`inline-flex cursor-pointer select-none items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${checked ? 'text-teal-800' : 'text-slate-600'} ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onToggle} disabled={disabled} className="size-4 accent-teal-600" />
    {label}
  </label>
);

export const Jci6csReportEditor: React.FC<{
  item: BaoCaoJci6cs;
  onClose: () => void;
  onSaved?: () => void;
  justCreated?: boolean;
  readOnly?: boolean; // mở bằng nút "Xem": chỉ xem, không sửa được
}> = ({ item, onClose, onSaved, justCreated, readOnly: initialReadOnly = false }) => {
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [data, setData] = useState<Jci6csReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(justCreated ? 'Đã tạo và lưu báo cáo vào danh sách. Có thể chỉnh sửa nội dung bên dưới rồi bấm Lưu.' : '');

  useEffect(() => {
    let cancelled = false;
    fetchBaoCaoJci6csData(item.id)
      .then((d: Jci6csReportData | null) => {
        if (cancelled) return;
        if (!d?.indicators) throw new Error('Báo cáo không có dữ liệu để sửa');
        setData({ ...d, kienNghi: d.kienNghi ?? defaultKienNghi(d) });
      })
      .catch(e => { if (!cancelled) setError(`Không tải được báo cáo: ${e.message}`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [item.id]);

  const patch = (p: Partial<Jci6csReportData>) => { setData(prev => (prev ? { ...prev, ...p } : prev)); setDirty(true); setMessage(''); };
  const patchIndicator = (id: IndicatorId, p: Partial<Jci6csReportData['indicators'][IndicatorId]>) => {
    setData(prev => (prev ? { ...prev, indicators: { ...prev.indicators, [id]: { ...prev.indicators[id], ...p } } } : prev));
    setDirty(true);
    setMessage('');
  };
  const toggleDanhGia = (id: IndicatorId, key: string) => {
    if (!data) return;
    const r = data.indicators[id];
    const opt = DANH_GIA_OPTIONS[id].find(o => o.key === key)!;
    const next = { ...danhGiaChecksOf(r) };
    const turnOn = !next[key];
    DANH_GIA_OPTIONS[id].filter(o => o.group === opt.group).forEach(o => { next[o.key] = false; });
    next[key] = turnOn;
    patchIndicator(id, { danhGiaChecks: next });
  };
  const toggleXuHuong = (id: IndicatorId, value: TrendValue) =>
    patchIndicator(id, { xuHuong: data && xuHuongOf(data, id) === value ? null : value });
  const patchKienNghi = (idx: number, p: Partial<KienNghiRow>) =>
    patch({ kienNghi: (data?.kienNghi || []).map((k, i) => (i === idx ? { ...k, ...p } : k)) });

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError('');
    try {
      const blob = await buildJci6csDocx(data);
      await updateBaoCaoJci6cs(item.id, { so_lieu: data, file_base64: await blobToBase64(blob), ten_file: item.ten_file });
      setDirty(false);
      setMessage('Đã lưu nội dung báo cáo và cập nhật file Word.');
      onSaved?.();
    } catch (e: any) {
      setError(`Lỗi lưu báo cáo: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Tải file đúng với nội dung đang hiển thị trên form
  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      saveAs(await buildJci6csDocx(data), item.ten_file);
    } catch (e: any) {
      setError(`Lỗi tạo file: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    if (dirty && !window.confirm('Nội dung đã sửa chưa được lưu. Đóng form?')) return;
    onClose();
  };

  const signerLabel = data?.cap === 'toan_vien' ? 'Giám đốc (người ký)' : 'Chỉ huy / trưởng đơn vị (người ký)';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Thanh tiêu đề dính trên cùng để luôn thấy nút Lưu khi cuộn form dài */}
      <div className="sticky top-0 z-20 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={handleClose} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100" title="Quay lại danh sách báo cáo">
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-slate-800" title={item.ten_bao_cao}>{item.ten_bao_cao}</h2>
            {readOnly
              ? <p className="text-xs font-bold text-sky-600">Chế độ chỉ xem</p>
              : dirty && <p className="text-xs font-bold text-amber-600">Có thay đổi chưa lưu</p>}
          </div>
        </div>
        {data && (
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-60 sm:flex-none"
            >
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Tải xuống báo cáo
            </button>
            {readOnly ? (
              <button
                onClick={() => { setReadOnly(false); setMessage(''); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 sm:flex-none"
              >
                <Pencil size={16} /> Sửa
              </button>
            ) : (
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-teal-200 hover:bg-teal-600 disabled:opacity-50 sm:flex-none"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Lưu
            </button>
            )}
          </div>
        )}
      </div>

      <fieldset disabled={readOnly} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Đang tải báo cáo...</div>
      ) : !data ? (
        error && <Alert kind="error">{error}</Alert>
      ) : (
        <div className="space-y-6">
          {message && <Alert kind="success">{message}</Alert>}
          {error && <Alert kind="error">{error}</Alert>}

          {/* Thông tin chung */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Số văn bản</label>
              <input value={data.soVanBan || ''} onChange={e => patch({ soVanBan: e.target.value })} placeholder="……/BC-……" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kính gửi</label>
              <input value={data.kinhGui} onChange={e => patch({ kinhGui: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Người lập báo cáo</label>
              <input value={data.nguoiLap} onChange={e => patch({ nguoiLap: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{signerLabel}</label>
              <input value={data.nguoiKy || ''} onChange={e => patch({ nguoiKy: e.target.value })} placeholder="Họ tên" className={inputCls} />
            </div>
          </section>

          {/* I. Kết quả (chỉ xem - lấy từ dữ liệu giám sát) */}
          <section className="space-y-2">
            <h4 className="text-sm font-black uppercase text-slate-800">1.1. Kết quả kỳ báo cáo <span className="text-xs font-semibold normal-case text-slate-400">(số liệu tự động; cột Đánh giá tích lại được)</span></h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Chỉ số</th>
                    <th className="px-3 py-2 text-center">Tử số</th>
                    <th className="px-3 py-2 text-center">Mẫu số</th>
                    <th className="px-3 py-2 text-center">Kỳ này</th>
                    <th className="px-3 py-2 text-center">Kỳ trước</th>
                    <th className="w-56 px-3 py-2 text-left">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INDICATOR_ORDER.map(id => {
                    const r = data.indicators[id];
                    return (
                      <tr key={id}>
                        <td className="px-3 py-2"><span className="font-bold text-slate-800">{INDICATOR_META[id].code}</span> <span className="text-slate-500">{INDICATOR_META[id].shortTen}</span></td>
                        <td className="px-3 py-2 text-center">{fmtNum(r.current.tu, 0)}</td>
                        <td className="px-3 py-2 text-center">{r.current.mau === null ? '—' : fmtNum(r.current.mau, 0)}</td>
                        <td className="px-3 py-2 text-center font-bold">{formatMetricValue(id, r.current.rate)}</td>
                        <td className="px-3 py-2 text-center">{formatMetricValue(id, r.previous.rate)}</td>
                        <td className="px-3 py-2">
                          {r.khongApDung ? (
                            <span className="text-xs font-semibold text-slate-500">Không áp dụng (KAD)</span>
                          ) : (
                            <div className="space-y-1">
                              {[...new Set(DANH_GIA_OPTIONS[id].map(o => o.group))].map(g => {
                                const group = DANH_GIA_OPTIONS[id].filter(o => o.group === g);
                                const checks = danhGiaChecksOf(r);
                                return (
                                  <div key={g} className={group[0].prefix ? 'flex flex-wrap items-center gap-x-3 gap-y-1' : 'flex flex-col gap-1'}>
                                    {group[0].prefix && <span className="text-xs font-semibold text-slate-500">{group[0].prefix}</span>}
                                    {group.map(o => (
                                      <CheckItem key={o.key} checked={!!checks[o.key]} label={o.label} onToggle={() => toggleDanhGia(id, o.key)} />
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Tổng hợp: đạt mục tiêu <span className="font-black text-slate-800">{INDICATOR_ORDER.filter(id => datMucTieuFromChecks(data.indicators[id])).length}/6</span> chỉ số
              (theo ô Đánh giá đã tích); đủ cỡ mẫu {data.tongHop.duCoMau}/6; KAD: {data.tongHop.kad.length ? data.tongHop.kad.join(', ') : 'không'}.
            </p>
          </section>

          {/* 1.2. Diễn biến theo tháng + xu hướng: báo cáo tháng bỏ qua mục này theo mẫu */}
          {data.period.loai !== 'thang' && (
          <section className="space-y-2">
            <h4 className="text-sm font-black uppercase text-slate-800">1.2. Diễn biến theo tháng trong kỳ</h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Chỉ số</th>
                    {periodMonths(data.period).map(k => <th key={k} className="px-2 py-2 text-center">T{mkMonth(k)}</th>)}
                    <th className="px-3 py-2 text-left">Xu hướng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {INDICATOR_ORDER.map(id => {
                    const r = data.indicators[id];
                    const trend = xuHuongOf(data, id);
                    return (
                      <tr key={id}>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">{INDICATOR_META[id].trendLabel}</td>
                        {periodMonths(data.period).map(k => {
                          const v = r.monthly[mkMonth(k) - 1];
                          return <td key={k} className="px-2 py-2 text-center text-xs text-slate-600">{v === null || v === undefined ? '' : fmtNum(v, INDICATOR_META[id].unit === 'pct' ? 1 : 2)}</td>;
                        })}
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {TREND_OPTIONS.map(o => (
                              <CheckItem key={o.key} checked={trend === o.key} label={o.label} onToggle={() => toggleXuHuong(id, o.key)} />
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          )}

          {/* II. Tồn tại */}
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase text-slate-800">II. Những điểm tồn tại</h4>
            {INDICATOR_ORDER.map((id, idx) => {
              const r = data.indicators[id];
              return (
                <div key={id} className="space-y-2 rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-black text-slate-800">{idx + 1}. {INDICATOR_META[id].code} – {INDICATOR_META[id].tonTaiTen}</p>
                  <div>
                    <label className={labelCls}>Nội dung tồn tại</label>
                    <AutoTextarea value={r.tonTai} onChange={v => patchIndicator(id, { tonTai: v })} />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Khoa/đơn vị liên quan</label>
                      <AutoTextarea value={r.khoaLienQuan} onChange={v => patchIndicator(id, { khoaLienQuan: v })} />
                    </div>
                    <div>
                      <label className={labelCls}>Nguyên nhân chủ yếu</label>
                      <AutoTextarea value={r.nguyenNhan || ''} onChange={v => patchIndicator(id, { nguyenNhan: v })} placeholder="Nhập nguyên nhân..." />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="space-y-2 rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-black text-slate-800">7. Chung – Quy trình đo lường</p>
              <div>
                <label className={labelCls}>Nội dung tồn tại</label>
                <AutoTextarea value={data.chung} onChange={v => patch({ chung: v })} />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Khoa/đơn vị liên quan</label>
                  <AutoTextarea value={data.chungKhoa || ''} onChange={v => patch({ chungKhoa: v })} />
                </div>
                <div>
                  <label className={labelCls}>Nguyên nhân chủ yếu</label>
                  <AutoTextarea value={data.chungNguyenNhan || ''} onChange={v => patch({ chungNguyenNhan: v })} placeholder="Nhập nguyên nhân..." />
                </div>
              </div>
            </div>
          </section>

          {/* III. Kiến nghị */}
          <section className="space-y-3">
            <h4 className="text-sm font-black uppercase text-slate-800">III. Kiến nghị, đề xuất giải pháp khắc phục</h4>
            {(data.kienNghi || []).map((k, i) => (
              <div key={i} className="space-y-2 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-800">Giải pháp {i + 1}</p>
                  {!readOnly && <button
                    onClick={() => patch({ kienNghi: (data.kienNghi || []).filter((_, j) => j !== i) })}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Xóa dòng"
                  >
                    <Trash2 size={15} />
                  </button>}
                </div>
                <div>
                  <label className={labelCls}>Giải pháp / hành động khắc phục</label>
                  <AutoTextarea value={k.giaiPhap} onChange={v => patchKienNghi(i, { giaiPhap: v })} />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Chỉ số liên quan</label>
                    <input value={k.chiSo} onChange={e => patchKienNghi(i, { chiSo: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Đơn vị chủ trì</label>
                    <input value={k.chuTri} onChange={e => patchKienNghi(i, { chuTri: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Thời hạn</label>
                    <input value={k.thoiHan} onChange={e => patchKienNghi(i, { thoiHan: e.target.value })} placeholder="dd/mm/yyyy" className={inputCls} />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>Kết quả cần đạt / minh chứng</label>
                    <AutoTextarea value={k.ketQua} onChange={v => patchKienNghi(i, { ketQua: v })} />
                  </div>
                  <div>
                    <label className={labelCls}>Đề nghị BGĐ, Hội đồng QLCL</label>
                    <AutoTextarea value={k.deNghi} onChange={v => patchKienNghi(i, { deNghi: v })} />
                  </div>
                </div>
              </div>
            ))}
            {/* Nút thêm đặt cuối danh sách để giải pháp mới xuất hiện ngay chỗ vừa bấm */}
            {!readOnly && (
              <button
                onClick={() => patch({ kienNghi: [...(data.kienNghi || []), emptyKienNghi()] })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/50 px-4 py-3 text-sm font-black text-teal-700 transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                <Plus size={16} /> Thêm giải pháp
              </button>
            )}
          </section>
        </div>
      )}
      </fieldset>
    </div>
  );
};

export default Jci6csReportModal;
