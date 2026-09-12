-- Thêm cột chọn nhân viên (Họ tên + Đối tượng ĐD/BS) vào các bảng giám sát.
-- Dữ liệu tên lấy từ bảng danh_sach_nhan_vien (Cài đặt > Danh sách nhân viên).
--
-- An toàn: chỉ ALTER những bảng có thật trong schema public; bảng nào chưa tồn tại
-- sẽ được bỏ qua kèm thông báo (xem tab "Messages/Notices" trong Supabase),
-- nên chạy lại nhiều lần đều được và không bao giờ dừng giữa chừng.
-- Bao gồm cả tên biến thể (cũ/mới) để chắc chắn trúng bảng thật.

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    -- Nhóm nội soi / thủ thuật
    'gs_ns_dai_tru_trang',
    'gs_ns_thuc_quan_da_day',
    'gs_nspq_sinh_thiet',
    'gs_tiem_nmc',
    'qt_cdmp',
    -- An toàn phẫu thuật
    'giam_sat_atpt',
    -- Chế độ chuyên môn / giám sát chung (kèm tên biến thể để chắc chắn)
    'giam_sat_cd_truc', 'gs_cd_truc',
    'giam_sat_cap_cuu', 'gs_cap_cuu',
    'gs_ra_vao_vien',   'giam_sat_ra_vao_vien',
    'giam_sat_chung',   'gs_chung'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS nguoi_duoc_giam_sat text', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS doi_tuong text', t);
      RAISE NOTICE 'Đã thêm cột cho bảng: %', t;
    ELSE
      RAISE NOTICE 'Bỏ qua (bảng chưa tồn tại): %', t;
    END IF;
  END LOOP;
END $$;
