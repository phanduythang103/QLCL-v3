import React, { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface SearchableOption {
  value: string;
  /** Nhãn hiển thị (mặc định = value) */
  label?: string;
  /** Dòng phụ nhỏ bên dưới (vd đối tượng · khoa) */
  hint?: string;
  /** Dòng "Thêm mới" (giá trị tự nhập, không có trong danh sách) */
  isNew?: boolean;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Cho phép nhập giá trị tự do không có trong danh sách (vd tên nhân viên mới) */
  allowCustom?: boolean;
  /** Gọi khi người dùng chọn dòng "+ Thêm mới" (vd lưu vào danh mục) */
  onCreate?: (value: string) => void;
  className?: string;
  /** Class cho thẻ bọc ngoài (vd 'flex-1' khi đặt trong hàng flex) */
  wrapperClassName?: string;
  id?: string;
  emptyText?: string;
}

/**
 * Combobox tìm kiếm thân thiện mobile:
 * - Dropdown XỔ NGAY DƯỚI ô nhập (portal + position fixed để không bị cắt bởi overflow-hidden).
 * - Bấm vào ô là mở TOÀN BỘ danh sách, kể cả khi ô đang có dữ liệu (không cần xóa).
 * - Gõ để lọc; bấm chọn để điền.
 * - Không dùng <datalist> nên không hiện "thanh gợi ý trên bàn phím".
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  allowCustom = false,
  onCreate,
  className = '',
  wrapperClassName = '',
  id,
  emptyText = 'Không có kết quả phù hợp',
}) => {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [rect, setRect] = useState<{ left: number; top: number; bottom: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const blurTimer = useRef<number | null>(null);

  // Danh sách hiển thị: khi CHƯA gõ (vừa mở) -> hiện tất cả; khi đang gõ -> lọc theo query
  const visible = useMemo(() => {
    if (!typing || !query.trim()) return options;
    const kw = query.trim().toLowerCase();
    return options.filter(o => (o.label || o.value).toLowerCase().includes(kw) || (o.hint || '').toLowerCase().includes(kw));
  }, [options, typing, query]);

  // Cho phép tự nhập: nếu đang gõ tên KHÔNG trùng khớp mục nào -> thêm dòng "+ Thêm mới" cuối danh sách
  const items = useMemo<SearchableOption[]>(() => {
    const q = query.trim();
    if (!allowCustom || !typing || !q) return visible;
    const exists = options.some(o => (o.label || o.value).trim().toLowerCase() === q.toLowerCase());
    return exists ? visible : [...visible, { value: q, label: `+ Thêm mới: "${q}"`, hint: 'Không có trong danh sách', isNew: true }];
  }, [visible, options, allowCustom, typing, query]);

  const display = typing ? query : value;

  // Giá trị mới nhất cho các handler chạy trễ (chạm ra ngoài / blur) để không đọc state cũ
  const latest = useRef({ typing, query, value, allowCustom, onChange });
  latest.current = { typing, query, value, allowCustom, onChange };

  const measure = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.top, bottom: r.bottom, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onScroll = () => measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, measure]);

  // Đóng khi chạm ra ngoài
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (inputRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      commitCustom();
    };
    document.addEventListener('pointerdown', onDocPointer, true);
    return () => document.removeEventListener('pointerdown', onDocPointer, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => { if (blurTimer.current) window.clearTimeout(blurTimer.current); }, []);

  const openDropdown = () => {
    if (disabled) return;
    setTyping(false);
    setQuery('');
    setActiveIdx(0);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setTyping(false);
    setQuery('');
  };

  const commitCustom = () => {
    // Khi cho phép tự do: chốt giá trị đang gõ nếu khác giá trị hiện tại
    const cur = latest.current;
    if (cur.allowCustom && cur.typing) {
      const v = cur.query.trim();
      if (v !== (cur.value || '').trim()) cur.onChange(v);
    }
    close();
  };

  const selectOption = (opt: SearchableOption) => {
    onChange(opt.value);
    if (opt.isNew) onCreate?.(opt.value);
    if (blurTimer.current) { window.clearTimeout(blurTimer.current); blurTimer.current = null; }
    close();
    inputRef.current?.blur();
  };

  const handleInput = (v: string) => {
    setTyping(true);
    setQuery(v);
    setActiveIdx(0);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { openDropdown(); return; }
      setActiveIdx(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && items[activeIdx]) { e.preventDefault(); selectOption(items[activeIdx]); }
      else if (open) commitCustom();
    } else if (e.key === 'Escape') {
      close();
    }
  };

  // Vị trí panel: ưu tiên xổ xuống; nếu thiếu chỗ dưới thì xổ lên
  const panelStyle = useMemo((): React.CSSProperties | null => {
    if (!rect) return null;
    const gap = 4;
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(280, openUp ? spaceAbove : spaceBelow));
    return {
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      maxHeight,
      ...(openUp ? { bottom: vh - rect.top + gap } : { top: rect.bottom + gap }),
      zIndex: 9999,
    };
  }, [rect]);

  return (
    <div className={`relative ${wrapperClassName}`.trim()}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          value={display}
          onChange={e => handleInput(e.target.value)}
          onFocus={openDropdown}
          onPointerDown={() => { if (!open) openDropdown(); }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => { commitCustom(); }, 120);
          }}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          style={{ paddingRight: 34 }}
          className={`${className} w-full`.trim()}
        />
        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && panelStyle && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-900/10"
          // Ngăn input mất focus (đóng dropdown) trước khi kịp nhận cú chạm chọn
          onPointerDown={e => e.preventDefault()}
        >
          {items.length === 0 ? (
            <div className="px-3 py-2.5 text-sm text-slate-400">{emptyText}</div>
          ) : (
            items.map((opt, i) => {
              const selected = !opt.isNew && opt.value === value;
              const active = i === activeIdx;
              return (
                <button
                  key={opt.value + i}
                  type="button"
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors ${
                    active ? 'bg-slate-100' : ''
                  } ${opt.isNew ? 'border-t border-slate-100 font-bold text-[#059669]' : selected ? 'font-bold text-[#059669]' : 'text-slate-700'}`}
                >
                  <span className="text-sm leading-tight">{opt.label || opt.value}</span>
                  {opt.hint ? <span className="text-[11px] font-medium text-slate-400 leading-tight">{opt.hint}</span> : null}
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default SearchableSelect;
