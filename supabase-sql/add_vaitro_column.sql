-- Migration: Thêm cột vaitro_nguoi_bc vào bảng bao_cao_scyk
ALTER TABLE bao_cao_scyk ADD COLUMN IF NOT EXISTS vaitro_nguoi_bc text;

-- Phân loại: Điều dưỡng, Bác sĩ, Người bệnh, Người nhà, Khác
COMMENT ON COLUMN bao_cao_scyk.vaitro_nguoi_bc IS 'Vai trò/Chức danh của người thực hiện báo cáo';
