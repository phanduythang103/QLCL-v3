-- Thêm cột nguoi_tao vào bảng lich_giam_sat để track người tạo lịch
ALTER TABLE lich_giam_sat 
ADD COLUMN IF NOT EXISTS nguoi_tao text;

-- Thêm comment cho cột mới
COMMENT ON COLUMN lich_giam_sat.nguoi_tao IS 'Tên người tạo lịch giám sát (lấy từ users.ten_nhan_vien hoặc users.username)';

-- Cập nhật dữ liệu cũ (nếu có) với giá trị mặc định
UPDATE lich_giam_sat 
SET nguoi_tao = 'Hệ thống' 
WHERE nguoi_tao IS NULL;
