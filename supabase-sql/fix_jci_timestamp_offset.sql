-- =============================================================================
-- Sửa dữ liệu cũ bị lệch +7 giờ ở các bảng sự cố JCI.
--
-- Trước đây form gửi nguyên giờ nhập (không kèm múi giờ) nên Postgres lưu thành
-- giờ UTC: nhập 00:38 -> lưu 00:38+00 -> hiển thị 07:38 tại Việt Nam.
-- Script trừ 7 giờ để đưa các bản ghi cũ về đúng mốc thời gian thực.
--
-- CHẠY 1 LẦN, NGAY TRƯỚC KHI DEPLOY bản code mới. Bản ghi tạo bằng code mới đã đúng
-- nên không được trừ thêm. Marker trên comment của bảng chặn việc chạy lặp lại.
-- =============================================================================

DO $$
BEGIN
  IF obj_description('public.jci_critical_results'::regclass) LIKE '%tz_fixed_v1%' THEN
    RAISE EXCEPTION 'Đã sửa múi giờ JCI trước đó - không chạy lại.';
  END IF;

  UPDATE public.jci_critical_results
  SET thoi_gian_co_kq = thoi_gian_co_kq - INTERVAL '7 hours',
      thoi_gian_thong_bao = thoi_gian_thong_bao - INTERVAL '7 hours';

  UPDATE public.jci_fall_incidents
  SET thoi_gian_nga = thoi_gian_nga - INTERVAL '7 hours';

  UPDATE public.jci_handover_incidents
  SET thoi_gian_su_co = thoi_gian_su_co - INTERVAL '7 hours',
      thoi_gian_bao_cao = thoi_gian_bao_cao - INTERVAL '7 hours';

  COMMENT ON TABLE public.jci_critical_results IS 'tz_fixed_v1';
END $$;
