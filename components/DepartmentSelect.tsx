import React from 'react';
import SearchableSelect, { SearchableOption } from './SearchableSelect';

/**
 * Ô chọn Khoa/Đơn vị dùng chung cho các phiếu giám sát & chỉ số JCI.
 *
 * Ràng buộc: chỉ cho phép CHỌN đúng một đơn vị trong danh mục `dm_don_vi`
 * theo định dạng chuẩn `${ma_don_vi} - ${ten_don_vi}` (mã khoa + tên khoa).
 * Không cho gõ tự do / thêm mới; khi `required` cũng không cho để trống.
 *
 * Giao diện là combobox xổ ngay dưới ô nhập (thân thiện mobile): bấm vào ô là
 * mở toàn bộ danh sách kể cả khi ô đang có dữ liệu; gõ để lọc nhanh.
 *
 * Giá trị cũ (dữ liệu lịch sử) không khớp danh mục vẫn được hiển thị để không
 * làm mất dữ liệu khi sửa bản ghi, nhưng người dùng không thể nhập giá trị mới.
 */

type DeptItem = string | { id?: string; ma_don_vi?: string; ten_don_vi?: string };

const deptValue = (d: DeptItem): string =>
  typeof d === 'string'
    ? d.trim()
    : (d.ma_don_vi ? `${d.ma_don_vi} - ${d.ten_don_vi}` : (d.ten_don_vi || '')).trim();

interface DepartmentSelectProps {
  value: string;
  onChange: (v: string) => void;
  departments: DeptItem[];
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Nhãn của tuỳ chọn trống (placeholder) */
  placeholder?: string;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onChange,
  departments,
  required = false,
  disabled = false,
  id,
  className,
  placeholder = '-- Chọn khoa/đơn vị --',
}) => {
  const options = React.useMemo<SearchableOption[]>(() => {
    const seen = new Set<string>();
    const list: SearchableOption[] = [];
    for (const d of departments || []) {
      const v = deptValue(d);
      if (v && !seen.has(v)) {
        seen.add(v);
        list.push({ value: v });
      }
    }
    return list;
  }, [departments]);

  return (
    <SearchableSelect
      id={id}
      value={(value || '').trim()}
      onChange={onChange}
      options={options}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      emptyText="Không tìm thấy khoa/đơn vị"
    />
  );
};

export default DepartmentSelect;
