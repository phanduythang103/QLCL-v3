import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Quyền sửa/xóa phiếu của 6 chỉ số chất lượng JCI:
 *  - Admin: toàn quyền.
 *  - Người tạo phiếu: được sửa/xóa phiếu của mình.
 *  - Người khác: chỉ xem.
 *
 * Người tạo lưu ở cột `nguoi_tao` (tên đăng nhập, ghi khi tạo phiếu, không sửa trên form).
 * Phiếu tạo trước khi có cột này (`nguoi_tao` rỗng) xác định người tạo theo họ tên
 * người nhập trên phiếu (người giám sát / người tổng hợp / người thông báo).
 */

const normalize = (s?: string | null): string => (s || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const isAdminRole = (role?: string | null): boolean => {
  const r = normalize(role);
  return r.includes('quản trị') || r.includes('admin');
};

interface OwnerUser {
  username?: string;
  full_name?: string;
  role?: string;
}

export const canModifyRecord = (
  user: OwnerUser | null | undefined,
  nguoiTao: string | null | undefined,
  legacyNames: (string | null | undefined)[] = []
): boolean => {
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  if (normalize(nguoiTao)) return normalize(nguoiTao) === normalize(user.username);
  const me = normalize(user.full_name);
  return !!me && legacyNames.some(n => normalize(n) === me);
};

/** `creator`: giá trị ghi vào `nguoi_tao` khi tạo phiếu; `canModify`: được sửa/xóa phiếu hay không. */
export const useRecordOwnership = () => {
  const { user } = useAuth();
  const canModify = useCallback(
    (nguoiTao: string | null | undefined, ...legacyNames: (string | null | undefined)[]) =>
      canModifyRecord(user, nguoiTao, legacyNames),
    [user]
  );
  return { creator: user?.username || '', canModify };
};

/** Bỏ `nguoi_tao` khỏi dữ liệu cập nhật: người tạo phiếu không bao giờ bị đổi khi sửa. */
export const withoutCreator = <T extends Record<string, any>>(row: T): Omit<T, 'nguoi_tao'> => {
  const { nguoi_tao: _omit, ...rest } = row;
  return rest;
};

/**
 * Chạy lệnh insert kèm `nguoi_tao`; nếu DB chưa có cột này (chưa chạy
 * supabase-sql/jci_nguoi_tao.sql) thì lưu lại không kèm cột để không chặn việc tạo phiếu.
 */
export const insertWithCreator = async <T extends Record<string, any>>(
  row: T,
  insert: (row: T) => PromiseLike<{ data: any; error: any }>
): Promise<{ data: any; error: any }> => {
  const res = await insert(row);
  const missingColumn = res.error && /nguoi_tao/.test(String(res.error.message || '')) && ['PGRST204', '42703'].includes(res.error.code);
  if (!missingColumn) return res;
  console.warn('Bảng chưa có cột nguoi_tao - lưu phiếu không kèm người tạo. Chạy supabase-sql/jci_nguoi_tao.sql.');
  const { nguoi_tao: _omit, ...rest } = row;
  return insert(rest as T);
};
