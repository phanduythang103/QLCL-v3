import { supabase } from './supabaseClient';

export type DoiTuongNhanVien = 'Điều dưỡng' | 'Bác sỹ' | 'Kỹ thuật viên';

/**
 * Danh sách chức danh (đối tượng) dùng chung cho toàn hệ thống:
 * cấu hình Danh sách nhân viên và ô chọn tên↔đối tượng trên các phiếu giám sát (form mẫu).
 * Sửa ở đây là đồng bộ mọi nơi.
 */
export const DOI_TUONG_OPTIONS: string[] = ['Điều dưỡng', 'Bác sỹ', 'Kỹ thuật viên'];

export interface DanhSachNhanVien {
  id: string;
  khoa_don_vi?: string | null;
  ho_ten: string;
  doi_tuong: string; // xem DOI_TUONG_OPTIONS
  created_at?: string;
}

export async function fetchDanhSachNhanVien(): Promise<DanhSachNhanVien[]> {
  const { data, error } = await supabase
    .from('danh_sach_nhan_vien')
    .select('id, khoa_don_vi, ho_ten, doi_tuong, created_at');
  if (error) throw error;

  return (data || []).sort((a: any, b: any) =>
    (a.ho_ten || '').localeCompare(b.ho_ten || '', 'vi', { sensitivity: 'base' })
  );
}

export async function addDanhSachNhanVien(record: Partial<DanhSachNhanVien>): Promise<DanhSachNhanVien> {
  const { data, error } = await supabase
    .from('danh_sach_nhan_vien')
    .insert([record])
    .select('id, khoa_don_vi, ho_ten, doi_tuong, created_at');
  if (error) throw error;
  return data?.[0];
}

export async function updateDanhSachNhanVien(id: string, updates: Partial<DanhSachNhanVien>): Promise<DanhSachNhanVien> {
  const { data, error } = await supabase
    .from('danh_sach_nhan_vien')
    .update(updates)
    .eq('id', id)
    .select('id, khoa_don_vi, ho_ten, doi_tuong, created_at');
  if (error) throw error;
  return data?.[0];
}

export async function deleteDanhSachNhanVien(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('danh_sach_nhan_vien')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

/**
 * Các bảng phiếu giám sát có lưu người được giám sát theo cặp cột
 * (nguoi_duoc_giam_sat, doi_tuong) — dùng để đồng bộ khi sửa Danh sách nhân viên.
 */
export const GIAM_SAT_TABLES_WITH_NHAN_VIEN: string[] = [
  'giam_sat_chung',
  'giam_sat_cap_cuu',
  'giam_sat_cd_truc',
  'gs_ra_vao_vien',
  'gs_vst',
  'giam_sat_atpt',
  'qt_cdmp',
  'gs_ns_dai_tru_trang',
  'gs_nspq_sinh_thiet',
  'gs_ns_thuc_quan_da_day',
  'gs_tiem_nmc',
];

export interface SyncPhieuResult {
  updated: number;   // tổng số phiếu đã cập nhật
  errors: string[];  // lỗi theo từng bảng (nếu có), không chặn luồng chính
}

/**
 * Đồng bộ thông tin nhân viên vào các phiếu ĐÃ giám sát.
 * Khớp theo họ tên cũ (nguoi_duoc_giam_sat = oldName) rồi cập nhật họ tên / chức danh mới.
 * Chỉ gửi các trường có thay đổi. Lỗi RLS/bảng lẻ được gom lại, không ném ra ngoài.
 */
export async function syncNhanVienToPhieuGiamSat(
  oldName: string,
  updates: { ho_ten?: string; doi_tuong?: string }
): Promise<SyncPhieuResult> {
  const oldNameTrim = (oldName || '').trim();
  const result: SyncPhieuResult = { updated: 0, errors: [] };
  if (!oldNameTrim) return result;

  const patch: Record<string, string> = {};
  if (updates.ho_ten !== undefined && updates.ho_ten.trim() !== oldNameTrim) {
    patch.nguoi_duoc_giam_sat = updates.ho_ten.trim();
  }
  if (updates.doi_tuong !== undefined) {
    patch.doi_tuong = updates.doi_tuong;
  }
  if (Object.keys(patch).length === 0) return result;

  for (const table of GIAM_SAT_TABLES_WITH_NHAN_VIEN) {
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq('nguoi_duoc_giam_sat', oldNameTrim)
      .select('id');
    if (error) {
      result.errors.push(`${table}: ${error.message}`);
      continue;
    }
    result.updated += data?.length || 0;
  }
  return result;
}
