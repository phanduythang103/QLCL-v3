-- Thêm trường "Đơn vị khảo sát" cho phiếu khảo sát hài lòng người bệnh ngoại trú.
-- Lưu theo định dạng `${ma_don_vi} - ${ten_don_vi}` (giống cột department của ksnb_noi_tru).
-- Phiếu đã thu trước đó để trống.

ALTER TABLE public.ksnb_ngoai_tru
    ADD COLUMN IF NOT EXISTS department TEXT;

COMMENT ON COLUMN public.ksnb_ngoai_tru.department IS '3. Đơn vị khảo sát';

-- Cho PostgREST nhận cột mới ngay
NOTIFY pgrst, 'reload schema';
