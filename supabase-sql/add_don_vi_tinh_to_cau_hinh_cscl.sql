-- Bổ sung cột đơn vị tính vào bảng cấu hình chỉ số chất lượng
-- Chạy lệnh này trong Supabase SQL Editor

ALTER TABLE cau_hinh_cscl
ADD COLUMN IF NOT EXISTS don_vi_tinh TEXT DEFAULT NULL;

COMMENT ON COLUMN cau_hinh_cscl.don_vi_tinh IS 'Đơn vị tính của mục tiêu (ví dụ: %, ca, lần, ngày, điểm)';

-- Kiểm tra cấu trúc bảng sau khi thêm cột
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'cau_hinh_cscl'
ORDER BY ordinal_position;
