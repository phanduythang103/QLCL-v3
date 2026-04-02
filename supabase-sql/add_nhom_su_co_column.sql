-- Thêm cột nhom_su_co vào bảng bao_cao_scyk
ALTER TABLE bao_cao_scyk ADD COLUMN IF NOT EXISTS nhom_su_co text;
