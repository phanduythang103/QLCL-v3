-- =====================================================================================
-- 6 CHỈ SỐ CHẤT LƯỢNG JCI - lưu người tạo phiếu để phân quyền sửa/xóa:
-- người tạo được sửa/xóa phiếu của mình, admin toàn quyền, người khác chỉ xem.
-- nguoi_tao = tên đăng nhập (users.username) của người tạo phiếu.
-- Chạy script này trên giao diện SQL Editor của Supabase.
-- =====================================================================================

ALTER TABLE public.gs_ndnb                ADD COLUMN IF NOT EXISTS nguoi_tao TEXT;
ALTER TABLE public.gs_vst                 ADD COLUMN IF NOT EXISTS nguoi_tao TEXT;
ALTER TABLE public.giam_sat_atpt          ADD COLUMN IF NOT EXISTS nguoi_tao TEXT;
ALTER TABLE public.jci_critical_results   ADD COLUMN IF NOT EXISTS nguoi_tao TEXT;
ALTER TABLE public.jci_fall_incidents     ADD COLUMN IF NOT EXISTS nguoi_tao TEXT;
ALTER TABLE public.jci_handover_incidents ADD COLUMN IF NOT EXISTS nguoi_tao TEXT;

-- Làm mới cache cấu trúc của PostgREST để app nhận cột mới ngay
NOTIFY pgrst, 'reload schema';
