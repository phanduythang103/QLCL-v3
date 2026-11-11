-- =============================================================================
-- Sửa lỗi lệch +7 giờ ở thời gian ghi phiếu của các bảng khảo sát hài lòng.
--
-- Các cột thời gian có DEFAULT timezone('ict', now()): hàm này trả về giờ Việt Nam
-- KHÔNG kèm múi giờ, Postgres lại hiểu đó là giờ UTC khi ghi vào cột timestamptz.
-- Ví dụ phiếu gửi lúc 10:52 sáng -> lưu 10:52+00 -> hiển thị 17:52.
-- Hệ quả: phiếu gửi sau 17h hiện sang ngày hôm sau, lọc/báo cáo theo ngày-tuần-tháng sai.
--
-- Script đổi DEFAULT về now() và trừ 7 giờ cho dữ liệu cũ, CHỈ ở những giá trị do DB tự điền:
--   * created_at: app không bao giờ gửi cột này -> luôn do DB điền -> trừ 7 giờ.
--   * cột khác (ngay_khao_sat, updated_at): trừ khi trùng created_at (cùng được điền
--     một lần lúc tạo) hoặc có độ chính xác micro giây (now() của Postgres). Giá trị
--     do app gửi lên từ JavaScript chỉ chính xác tới mili giây và đã đúng giờ nên giữ
--     nguyên (vd: 2 phiếu ngoại trú đầu tháng 4, updated_at của cấu hình khảo sát).
--
-- App không gửi các cột này khi tạo phiếu nên chỉ cần chạy script, không cần deploy lại.
-- Chạy trong SQL Editor của Supabase. Phần sửa nằm gọn trong một khối DO: lỗi ở bảng nào
-- thì không bảng nào bị đổi. Mỗi bảng có marker [tz_fixed_v1] trên comment nên chạy lại
-- sẽ tự bỏ qua bảng đã sửa.
-- =============================================================================

CREATE OR REPLACE FUNCTION pg_temp.fix_tz_offset(tbl text, cols text[], has_created_at boolean)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  old_comment text := obj_description(format('public.%I', tbl)::regclass, 'pg_class');
  sets text[] := '{}';
  c text;
  n bigint;
BEGIN
  IF coalesce(old_comment, '') LIKE '%tz_fixed_v1%' THEN
    RAISE NOTICE '%: đã sửa trước đó - bỏ qua', tbl;
    RETURN;
  END IF;

  -- Khóa ghi trong lúc sửa: phiếu gửi tới sẽ chờ, rồi nhận DEFAULT mới, không bị trừ 2 lần
  EXECUTE format('LOCK TABLE public.%I IN SHARE ROW EXCLUSIVE MODE', tbl);

  IF has_created_at THEN
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_at SET DEFAULT now()', tbl);
    sets := sets || 'created_at = created_at - INTERVAL ''7 hours'''::text;
  END IF;

  FOREACH c IN ARRAY cols LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT now()', tbl, c);
    sets := sets || format(
      '%1$I = CASE WHEN %2$s (extract(microseconds FROM %1$I)::bigint %% 1000) <> 0 '
      'THEN %1$I - INTERVAL ''7 hours'' ELSE %1$I END',
      c,
      CASE WHEN has_created_at THEN format('%I = created_at OR', c) ELSE '' END
    );
  END LOOP;

  EXECUTE format('UPDATE public.%I SET %s', tbl, array_to_string(sets, ', '));
  GET DIAGNOSTICS n = ROW_COUNT;

  EXECUTE format('COMMENT ON TABLE public.%I IS %L', tbl, trim(coalesce(old_comment, '') || ' [tz_fixed_v1]'));
  RAISE NOTICE '%: đã sửa % dòng', tbl, n;
END
$fn$;

DO $$
BEGIN
  PERFORM pg_temp.fix_tz_offset('ksnb_noi_tru',                      ARRAY['ngay_khao_sat'], true);
  PERFORM pg_temp.fix_tz_offset('ksnb_ngoai_tru',                    ARRAY['ngay_khao_sat'], true);
  PERFORM pg_temp.fix_tz_offset('ks_hai_long_iso',                   ARRAY['ngay_khao_sat'], true);
  PERFORM pg_temp.fix_tz_offset('staff_satisfaction_2026_responses', ARRAY['ngay_khao_sat'], false); -- bảng không có created_at
  PERFORM pg_temp.fix_tz_offset('survey_public_configs',             ARRAY['updated_at'],    true);
END $$;
