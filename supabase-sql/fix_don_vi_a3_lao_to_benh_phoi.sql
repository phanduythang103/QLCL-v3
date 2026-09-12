-- =====================================================================
-- SỬA ĐƠN VỊ BỊ NHẦM:  'A3 - Lao'  ->  'A3 - Bệnh phổi'
-- Môi trường: Supabase (PostgreSQL). Chạy trong SQL Editor.
--
-- ⚠️ LÀM THEO ĐÚNG THỨ TỰ. Chạy BƯỚC 1 (chỉ đọc) trước để xem giá trị
--    thực tế đang lưu, rồi mới chạy BƯỚC 2/3 (cập nhật).
--    Nên sao lưu (backup) trước khi cập nhật.
--
-- Ghi chú: script dò ĐỘNG mọi cột text trong schema public và chỉ sửa
--    đúng ô có giá trị bằng chuỗi cũ -> không đụng nhầm cột khác
--    (ví dụ 'don_vi_tinh' = đơn vị tính sẽ không bị ảnh hưởng).
-- =====================================================================


-- =====================================================================
-- CÁCH NHANH (đúng chỗ đã xác định): cột "Khoa được giám sát" của
-- module Tuân thủ VST 5 thời điểm WHO (IPSG.05.00) = bảng gs_vst.
-- Nếu chỉ cần sửa đúng chỗ này thì chạy 2 câu dưới là đủ.
-- =====================================================================

-- Xem trước các dòng sẽ bị đổi:
-- SELECT id, ngay_giam_sat, khoa_duoc_giam_sat
-- FROM public.gs_vst
-- WHERE khoa_duoc_giam_sat = 'A3 - Lao';

UPDATE public.gs_vst
SET    khoa_duoc_giam_sat = 'A3 - Bệnh phổi'
WHERE  khoa_duoc_giam_sat = 'A3 - Lao';


-- =====================================================================
-- CÁCH TOÀN DIỆN (khuyến nghị nếu 'A3 - Lao' còn lẫn ở module khác):
-- dò và sửa trên MỌI bảng/cột. Dùng khi không chắc còn sót ở đâu.
-- =====================================================================

-- ---------------------------------------------------------------------
-- BƯỚC 1 (CHỈ ĐỌC): Dò xem đơn vị "A3 ... Lao" đang lưu ở bảng/cột nào
-- và ĐANG lưu dưới ĐỊNH DẠNG nào (in ra ở tab "Messages"/"Notices").
-- Dùng ILIKE '%A3%Lao%' để bắt cả các biến thể: 'A3 - Lao', 'Lao', 'A3-Lao'...
-- ---------------------------------------------------------------------
DO $$
DECLARE
  r        record;
  sample   text;
BEGIN
  RAISE NOTICE '=== CÁC GIÁ TRỊ KHỚP "A3 / Lao" ĐANG LƯU TRONG DB ===';
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying')
    ORDER BY c.table_name, c.column_name
  LOOP
    EXECUTE format(
      'SELECT string_agg(DISTINCT %1$I, '' | '') FROM public.%2$I WHERE %1$I ILIKE %3$L',
      r.column_name, r.table_name, '%A3%Lao%'
    ) INTO sample;

    IF sample IS NOT NULL THEN
      RAISE NOTICE '% . %  ->  [ % ]', r.table_name, r.column_name, sample;
    END IF;
  END LOOP;
  RAISE NOTICE '=== HẾT. Kiểm tra định dạng ở trên trước khi chạy BƯỚC 2. ===';
END $$;


-- ---------------------------------------------------------------------
-- BƯỚC 2 (CẬP NHẬT): Đổi đúng ô có giá trị = chuỗi cũ sang chuỗi mới,
-- trên MỌI bảng/cột text của schema public.
--
-- 👉 Nếu BƯỚC 1 cho thấy định dạng lưu KHÁC (ví dụ chỉ 'Lao' chứ không
--    phải 'A3 - Lao'), hãy sửa 2 biến v_old / v_new bên dưới cho khớp
--    RỒI mới chạy.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_old   text := 'A3 - Lao';        -- giá trị đang bị nhầm
  v_new   text := 'A3 - Bệnh phổi';  -- giá trị đúng
  r       record;
  cnt     bigint;
  total   bigint := 0;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('text', 'character varying')
  LOOP
    EXECUTE format(
      'UPDATE public.%1$I SET %2$I = %4$L WHERE %2$I = %3$L',
      r.table_name, r.column_name, v_old, v_new
    );
    GET DIAGNOSTICS cnt = ROW_COUNT;
    IF cnt > 0 THEN
      RAISE NOTICE 'Đã cập nhật %.% : % dòng', r.table_name, r.column_name, cnt;
      total := total + cnt;
    END IF;
  END LOOP;
  RAISE NOTICE '====== TỔNG CỘNG ĐÃ SỬA: % dòng ======', total;
END $$;


-- ---------------------------------------------------------------------
-- BƯỚC 3: Sửa DANH MỤC gốc (bảng dm_don_vi).
-- Ở bảng danh mục, tên đơn vị lưu tách: ma_don_vi = 'A3', ten_don_vi = 'Lao'.
-- ---------------------------------------------------------------------
UPDATE public.dm_don_vi
SET    ten_don_vi = 'Bệnh phổi'
WHERE  ma_don_vi = 'A3'
  AND  ten_don_vi ILIKE 'Lao';

-- Kiểm tra lại danh mục A3:
-- SELECT ma_don_vi, ten_don_vi FROM public.dm_don_vi WHERE ma_don_vi = 'A3';


-- ---------------------------------------------------------------------
-- SAU KHI CHẠY:
-- - App có cache danh mục đơn vị. Người dùng tải lại trang (hoặc chờ hết
--   TTL cache) để thấy tên mới.
-- - Chạy lại BƯỚC 1 để xác nhận không còn giá trị 'A3 - Lao' nào sót.
-- ---------------------------------------------------------------------
