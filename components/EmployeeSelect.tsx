import React, { useEffect, useState, useMemo } from 'react';
import { fetchDanhSachNhanVien, addDanhSachNhanVien, DanhSachNhanVien, DOI_TUONG_OPTIONS } from '../readDanhSachNhanVien';
import SearchableSelect, { SearchableOption } from './SearchableSelect';

interface EmployeeSelectProps {
  /** Họ và tên nhân viên hiện tại */
  name: string;
  /** Đối tượng hiện tại (Điều dưỡng / Bác sỹ / ...) */
  doiTuong: string;
  /** Nếu có: chỉ hiện nhân viên thuộc khoa/đơn vị này (lọc theo bảng Danh sách nhân viên) */
  khoaDonVi?: string;
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

const DEFAULT_DOI_TUONG = DOI_TUONG_OPTIONS;

/**
 * Ô chọn Họ và tên nhân viên lấy theo bảng "Danh sách nhân viên" (Cài đặt).
 * - Chọn tên  -> tự điền đối tượng tương ứng.
 * - Chọn đối tượng -> lọc danh sách tên tương ứng.
 * - Chọn "+ Thêm mới" -> lưu luôn vào Danh sách nhân viên (theo đối tượng + khoa đang chọn).
 */
export const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  name,
  doiTuong,
  khoaDonVi,
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

  const norm = (s?: string | null) => (s || '').trim().toLowerCase();

  // Lọc tên theo đối tượng + khoa/đơn vị đang chọn (nếu có)
  const filteredNames = useMemo(
    () => staff.filter(s =>
      (!doiTuong || s.doi_tuong === doiTuong) &&
      (!khoaDonVi || norm(s.khoa_don_vi) === norm(khoaDonVi))
    ),
    [staff, doiTuong, khoaDonVi]
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

  // Tên chưa có trong danh sách -> lưu vào bảng Danh sách nhân viên để lần sau chọn được
  const handleCreate = async (val: string) => {
    const hoTen = val.trim();
    // Trùng tên + cùng khoa (hoặc không chọn khoa) thì coi như đã có, không lưu lặp
    const dup = staff.some(s =>
      norm(s.ho_ten) === norm(hoTen) && (!khoaDonVi || norm(s.khoa_don_vi) === norm(khoaDonVi))
    );
    if (!hoTen || dup) return;
    try {
      const created = await addDanhSachNhanVien({
        ho_ten: hoTen,
        doi_tuong: doiTuong || DEFAULT_DOI_TUONG[0],
        khoa_don_vi: (khoaDonVi || '').trim() || null,
      });
      if (created) {
        setStaff(prev => [...prev, created].sort((a, b) =>
          (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi', { sensitivity: 'base' })
        ));
      }
    } catch (err: any) {
      console.error('EmployeeSelect: error adding staff', err);
      alert(`Không lưu được "${hoTen}" vào Danh sách nhân viên: ${err?.message || err}`);
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

  // Options cho combobox tên: mỗi tên kèm dòng phụ "đối tượng · khoa"
  const nameOptions = useMemo<SearchableOption[]>(
    () => filteredNames.map(s => ({
      value: s.ho_ten,
      hint: [s.doi_tuong, s.khoa_don_vi].filter(Boolean).join(' · '),
    })),
    [filteredNames]
  );

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
      <SearchableSelect
        id={listId}
        value={name}
        onChange={handleNameChange}
        options={nameOptions}
        allowCustom
        onCreate={handleCreate}
        disabled={disabled}
        required={required}
        placeholder={namePlaceholder}
        className={inputClassName}
        wrapperClassName="flex-1"
        emptyText="Không tìm thấy nhân viên"
      />
    </div>
  );
};

export default EmployeeSelect;
