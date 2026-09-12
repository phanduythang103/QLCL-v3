import React, { useState, useEffect } from 'react';

type DeptItem = string | { id?: string; ma_don_vi?: string; ten_don_vi?: string };

interface SupervisionScopeProps {
  /** Giá trị khoa/đơn vị được giám sát hiện tại */
  department: string;
  onDepartmentChange: (v: string) => void;
  /** Khoa/đơn vị của user đang đăng nhập (dùng cho chế độ Tự giám sát) */
  userDepartment?: string;
  /** Danh sách khoa (đối tượng dm_don_vi hoặc mảng chuỗi) */
  departments: DeptItem[];
  disabled?: boolean;
  idPrefix?: string;
  label?: string;
  labelClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
  required?: boolean;
}

const norm = (s?: string) => (s || '').trim().toLowerCase();

const initialMode = (dep: string, userDep?: string): 'self' | 'cross' =>
  (userDep && dep && norm(dep) !== norm(userDep)) ? 'cross' : 'self';

const deptValue = (d: DeptItem): string =>
  typeof d === 'string' ? d : (d.ma_don_vi ? `${d.ma_don_vi} - ${d.ten_don_vi}` : (d.ten_don_vi || ''));

/**
 * Chọn phạm vi giám sát:
 * - Tự giám sát: khóa khoa = khoa của user (mặc định).
 * - Giám sát chéo: cho phép chọn khoa/đơn vị khác -> danh sách nhân viên lọc theo khoa đó.
 */
export const SupervisionScope: React.FC<SupervisionScopeProps> = ({
  department,
  onDepartmentChange,
  userDepartment,
  departments,
  disabled = false,
  idPrefix = 'sup',
  label = 'Khoa được giám sát',
  labelClassName = 'text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2',
  inputClassName = 'w-full p-3 rounded-2xl border border-slate-200 text-sm font-bold outline-none',
  containerClassName = 'space-y-1.5',
  required = false,
}) => {
  const [mode, setMode] = useState<'self' | 'cross'>(() => initialMode(department, userDepartment));
  const dlId = `${idPrefix}-scope-dv`;

  // Chế độ Tự giám sát: luôn đồng bộ khoa = khoa của user
  useEffect(() => {
    if (mode === 'self' && userDepartment && norm(department) !== norm(userDepartment)) {
      onDepartmentChange(userDepartment);
    }
    // chỉ chạy khi đổi chế độ hoặc khi có userDepartment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, userDepartment]);

  const selectSelf = () => { setMode('self'); onDepartmentChange(userDepartment || ''); };
  const selectCross = () => { setMode('cross'); onDepartmentChange(''); };

  const pill = (active: boolean) =>
    `flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight border transition-all ${active
      ? 'bg-[#059669] text-white border-[#059669] shadow-sm'
      : 'bg-white text-slate-500 border-slate-200 hover:border-[#059669] hover:text-[#059669]'}`;

  return (
    <div className={containerClassName}>
      {label ? <label className={labelClassName}>{label}</label> : null}
      <div className="flex gap-2">
        <button type="button" disabled={disabled} onClick={selectSelf} className={pill(mode === 'self')}>Tự giám sát</button>
        <button type="button" disabled={disabled} onClick={selectCross} className={pill(mode === 'cross')}>Giám sát chéo</button>
      </div>
      <input
        list={dlId}
        value={department}
        onChange={e => onDepartmentChange(e.target.value)}
        disabled={disabled || mode === 'self'}
        required={required}
        placeholder={mode === 'self' ? 'Khoa của bạn' : 'Chọn khoa/đơn vị khác...'}
        className={inputClassName}
      />
      <datalist id={dlId}>
        {departments.map((d, i) => {
          const v = deptValue(d);
          return <option key={(typeof d === 'string' ? d : d.id) || i} value={v} />;
        })}
      </datalist>
    </div>
  );
};

export default SupervisionScope;
