import React from 'react';
import { SCALE_OPTIONS, SurveySection } from '../types/patientSatisfactionMauByt';

/**
 * Các phần dùng chung cho phiếu khảo sát trình bày giống bản giấy
 * (phiếu người bệnh mẫu BYT, phiếu NVYT mẫu BYT, phiếu hài lòng ISO).
 * Kiểu bảng/thẻ trên mobile nằm trong index.css (class kshl-*).
 */

export const paperCell = 'border border-black px-1.5 py-1 align-top';
export const lineInput = 'bg-transparent border-0 border-b border-dotted border-slate-500 outline-none px-1 font-semibold text-[#047857] focus:border-[#059669] disabled:text-[#047857] disabled:opacity-100';
export const paperRoot = "kshl-paper bg-white text-black font-['Times_New_Roman',Times,serif] text-[15px] md:text-[17px] leading-snug";

/** Số trong vòng tròn giống ①..⑤ trên phiếu giấy */
export const Circle: React.FC<{ n: React.ReactNode; selected?: boolean; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; disabled?: boolean; title?: string }> = ({ n, selected, size = 'md', onClick, disabled, title }) => {
  const dim = size === 'sm' ? 'w-[18px] h-[18px] text-[11px]'
    : size === 'lg' ? 'w-11 h-11 text-[17px]'
      : 'w-[25px] h-[25px] md:w-8 md:h-8 text-[12px] md:text-[15px]';
  const cls = `kshl-circle ${selected ? 'kshl-circle-on' : ''} ${dim} inline-flex items-center justify-center rounded-full border border-black font-sans font-semibold shrink-0 transition-all ${selected ? 'bg-[#059669] border-[#059669] text-white shadow' : 'bg-white text-black'}`;
  if (!onClick) return <span className={cls}>{n}</span>;
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={`${cls} ${disabled ? '' : 'hover:border-[#059669] hover:text-[#059669] cursor-pointer'} ${selected && !disabled ? 'hover:text-white' : ''}`}>
      {n}
    </button>
  );
};

/** Lựa chọn dạng chữ trên phiếu (VD "1. Nam"): khi chọn thì được khoanh tròn */
export const Opt: React.FC<{ label: React.ReactNode; selected: boolean; readOnly?: boolean; onClick: () => void }> = ({ label, selected, readOnly, onClick }) => (
  <button
    type="button"
    disabled={readOnly}
    onClick={onClick}
    className={`inline-block text-left px-1.5 rounded-full border transition-all ${selected
      ? 'border-[#059669] bg-emerald-50 text-[#047857] font-bold'
      : `border-transparent ${readOnly ? '' : 'hover:border-slate-400 cursor-pointer'}`}`}
  >
    {label}
  </button>
);

/** Ô đánh dấu ☐ cho câu chọn nhiều / chọn một dạng liệt kê */
export const CheckBox: React.FC<{ label: React.ReactNode; checked: boolean; readOnly?: boolean; onClick: () => void; round?: boolean }> = ({ label, checked, readOnly, onClick, round }) => (
  <button
    type="button"
    disabled={readOnly}
    onClick={onClick}
    className={`flex items-start gap-2 text-left py-0.5 ${readOnly ? '' : 'cursor-pointer'}`}
  >
    <span className={`kshl-circle ${checked ? 'kshl-circle-on' : ''} mt-[3px] w-[18px] h-[18px] shrink-0 border flex items-center justify-center text-[12px] font-sans font-bold ${round ? 'rounded-full' : 'rounded-[3px]'} ${checked ? 'bg-[#059669] border-[#059669] text-white' : 'border-black bg-white'}`}>
      {checked ? '✓' : ''}
    </span>
    <span className={checked ? 'text-[#047857] font-semibold' : ''}>{label}</span>
  </button>
);

/** Dòng tiêu đề "MẪU SỐ n" kèm dãy ô mã phiếu */
export const MauSoRow: React.FC<{ so: number | string }> = ({ so }) => (
  <div className="flex items-center gap-2 md:gap-4 mt-1 mb-3 md:pl-16">
    <span className="font-bold whitespace-nowrap">MẪU SỐ {so}</span>
    <div className="flex flex-1 max-w-[460px]">
      {Array.from({ length: 11 }).map((_, i) => (
        <span key={i} className="flex-1 h-5 md:h-6 border border-black -ml-px first:ml-0" />
      ))}
    </div>
  </div>
);

/** Bảng chú thích thang điểm 1-5 của mẫu BYT */
export const ScaleLegend: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => (
  <>
    <p>
      {readOnly ? 'Đánh dấu' : 'Bấm chọn'} vào một số <b>từ 1 đến 5</b>, tương ứng với <b>mức độ hài lòng hoặc nhận xét từ rất kém đến rất tốt</b> cho từng câu hỏi dưới đây:
    </p>
    <table className="w-full border-collapse text-center text-[13px] md:text-[16px] mb-4">
      <tbody>
        <tr>
          {SCALE_OPTIONS.map(o => (
            <td key={o.value} className="border border-black px-1 py-1 align-top">
              <div className="flex items-center justify-center gap-1"><Circle n={o.value} size="sm" /> là:</div>
              <div>{o.label}</div>
              <div className="mt-1"><i>hoặc:</i> {o.alt}</div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  </>
);

/**
 * Các nhóm câu chấm điểm 1-5: điện thoại hiển thị dạng thẻ ("B1. Nội dung" một dòng,
 * thang điểm chia đều 5 cột), máy tính hiển thị bảng kẻ ô như bản giấy.
 */
export const RatedSections: React.FC<{
  sections: SurveySection[];
  data: Record<string, any>;
  readOnly?: boolean;
  onSet: (code: string, value: number) => void;
}> = ({ sections, data, readOnly, onSet }) => (
  <>
    <div className="md:hidden space-y-4 mb-4">
      {sections.map(sec => (
        <div key={sec.stt} className="space-y-2">
          <div className="bg-[#059669] text-white font-bold rounded-lg px-3 py-2">{sec.stt}. {sec.name}</div>
          {sec.questions.map(q => (
            <div key={q.code} className="border border-slate-300 rounded-xl px-3 py-2.5">
              <p><b>{q.code.toUpperCase()}.</b> {q.text}</p>
              <div className="grid grid-cols-5 gap-1 mt-2 justify-items-center">
                {SCALE_OPTIONS.map(o => (
                  <Circle
                    key={o.value}
                    n={o.value}
                    size="lg"
                    title={o.label}
                    selected={data[q.code] === o.value}
                    disabled={readOnly}
                    onClick={readOnly ? undefined : () => onSet(q.code, o.value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>

    <table className="kshl-q-desktop w-full border-collapse">
      <tbody>
        {sections.map(sec => (
          <React.Fragment key={sec.stt}>
            <tr>
              <td className={`${paperCell} kshl-sec font-bold`} colSpan={3}>{sec.stt}. {sec.name}</td>
            </tr>
            {sec.questions.map(q => (
              <tr key={q.code}>
                <td className={`${paperCell} kshl-code`}>{q.code.toUpperCase()}.</td>
                <td className={paperCell}>{q.text}</td>
                <td className={`${paperCell} kshl-rate`}>
                  <div className="flex items-center justify-center gap-[3px] md:gap-1.5">
                    {SCALE_OPTIONS.map(o => (
                      <Circle
                        key={o.value}
                        n={o.value}
                        title={o.label}
                        selected={data[q.code] === o.value}
                        disabled={readOnly}
                        onClick={readOnly ? undefined : () => onSet(q.code, o.value)}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </>
);

/** Khung trang giấy cho form nhập: nút quay lại, tờ phiếu, nút gửi */
export const PaperFormShell: React.FC<{
  isPublic?: boolean;
  readOnly?: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}> = ({ isPublic, readOnly, saving, onCancel, onSubmit, children }) => (
  <div className="w-full pb-20 animate-in fade-in duration-700 bg-slate-100 min-h-screen px-2 md:px-8">
    {!isPublic && (
      <div className="max-w-[860px] mx-auto pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-500 hover:text-[#059669] font-black text-[10px] md:text-xs uppercase p-2 transition-all"
        >
          ← Quay lại
        </button>
      </div>
    )}

    <div className="max-w-[860px] mx-auto mt-4 bg-white shadow-xl border border-slate-200 px-3 py-5 md:px-12 md:py-10">
      {children}
    </div>

    {!readOnly && (
      <div className="pt-8 flex justify-center">
        <button
          onClick={onSubmit}
          disabled={saving}
          className="flex items-center gap-3 px-16 py-5 bg-[#059669] hover:bg-emerald-700 text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:shadow-none"
        >
          {saving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          {saving ? 'Đang gửi...' : 'Gửi phiếu khảo sát'}
        </button>
      </div>
    )}
  </div>
);

/** Khung trang xem chi tiết phiếu (chỉ đọc) kèm nút quay lại và in phiếu */
export const PaperViewShell: React.FC<{ onBack: () => void; children: React.ReactNode }> = ({ onBack, children }) => (
  <div className="w-full min-h-full bg-slate-100/50 p-2 md:p-8 animate-in fade-in duration-500 paper-view">
    <div className="max-w-[860px] mx-auto no-print flex items-center justify-between mb-3">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-[#059669] font-black text-[10px] md:text-xs uppercase p-2 md:p-3 hover:bg-emerald-50 rounded-2xl transition-all"
      >
        ← Quay lại
      </button>
      <button
        onClick={() => window.print()}
        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] md:text-xs uppercase shadow hover:bg-black transition-all"
      >
        In phiếu
      </button>
    </div>
    <div className="max-w-[860px] mx-auto bg-white shadow-xl border border-slate-200 px-3 py-5 md:px-12 md:py-10 paper-sheet">
      {children}
    </div>
    <style dangerouslySetInnerHTML={{
      __html: `
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; }
        .paper-view { padding: 0 !important; background: white !important; }
        .paper-sheet { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
        .paper-sheet button { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}} />
  </div>
);
