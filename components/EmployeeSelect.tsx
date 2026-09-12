import React, { useEffect, useState, useMemo } from 'react';
import { fetchDanhSachNhanVien, DanhSachNhanVien } from '../readDanhSachNhanVien';

interface EmployeeSelectProps {
  /** Họ và tên nhân viên hiện tại */
  name: string;
  /** Đối tượng hiện tại (Điều dưỡng / Bác sỹ / ...) */
  doiTuong: string;
  /** Cập nhật cả tên và đối tượng cùng lúc */
  onChange: (next: { name: string; doiTuong: string }) => void;
  disabled?: boolean;
  /** Các lựa chọn đối tượng (mặc định Điều dưỡng / Bác sỹ). Cho phép module giữ danh sách riêng. */
  doiTuongOptions?: string[];
  /** id duy nhất cho datalist khi có nhiều instance trên cùng trang */
  idPrefix?: string;
  namePlaceholder?: string;
  selectClassName?: string;
  inputClassName?: string;
  wrapperClassName?: string;
  required?: boolean;
}

const DEFAULT_DOI_TUONG = ['Điều dưỡng', 'Bác sỹ'];

/**
 * Ô chọn Họ và tên nhân viên lấy theo bảng "Danh sách nhân viên" (Cài đặt).
 * - Chọn tên  -> tự điền đối tượng tương ứng.
 * - Chọn đối tượng -> lọc danh sách tên tương ứng.
 */
export const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  name,
  doiTuong,
  onChange,
  disabled = false,
  doiTuongOptions = DEFAULT_DOI_TUONG,
  idPrefix = 'emp',
  namePlaceholder = 'Họ tên nhân viên',
  selectClassName = '',
  inputClassName = '',
  wrapperClassName = 'flex gap-2',
  required = false,
}) => {
  const [staff, setStaff] = useState<DanhSachNhanVien[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchDanhSachNhanVien()
      .then(data => { if (!cancelled) setStaff(data); })
      .catch(err => console.error('EmployeeSelect: error loading staff list', err));
    return () => { cancelled = true; };
  }, []);

  const listId = `${idPrefix}-name-options`;

  // Lọc tên theo đối tượng đang chọn (nếu có)
  const filteredNames = useMemo(
    () => staff.filter(s => !doiTuong || s.doi_tuong === doiTuong),
    [staff, doiTuong]
  );

  const findEmployee = (val: string) =>
    staff.find(s => (s.ho_ten || '').trim().toLowerCase() === val.trim().toLowerCase());

  const handleNameChange = (val: string) => {
    // Nếu tên khớp một nhân viên -> tự điền đối tượng
    const matched = findEmployee(val);
    if (matched) {
      onChange({ name: matched.ho_ten, doiTuong: matched.doi_tuong });
    } else {
      onChange({ name: val, doiTuong });
    }
  };

  const handleDoiTuongChange = (val: string) => {
    // Nếu tên hiện tại là nhân viên có sẵn nhưng khác đối tượng mới -> xóa tên để lọc lại
    const emp = findEmployee(name);
    const keepName = !emp || emp.doi_tuong === val;
    onChange({ name: keepName ? name : '', doiTuong: val });
  };

  // Đảm bảo option đối tượng luôn chứa giá trị hiện tại (tránh mất dữ liệu cũ)
  const mergedDoiTuongOptions = useMemo(() => {
    const set = [...doiTuongOptions];
    if (doiTuong && !set.includes(doiTuong)) set.unshift(doiTuong);
    return set;
  }, [doiTuongOptions, doiTuong]);

  return (
    <div className={wrapperClassName}>
      <select
        value={doiTuong}
        onChange={e => handleDoiTuongChange(e.target.value)}
        disabled={disabled}
        className={selectClassName}
      >
        {mergedDoiTuongOptions.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <input
        type="text"
        list={listId}
        value={name}
        onChange={e => handleNameChange(e.target.value)}
        disabled={disabled}
        placeholder={namePlaceholder}
        required={required}
        className={inputClassName}
      />
      <datalist id={listId}>
        {filteredNames.map(s => (
          <option key={s.id} value={s.ho_ten}>
            {[s.doi_tuong, s.khoa_don_vi].filter(Boolean).join(' · ')}
          </option>
        ))}
      </datalist>
    </div>
  );
};

export default EmployeeSelect;
