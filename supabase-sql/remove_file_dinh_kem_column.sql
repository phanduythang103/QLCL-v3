-- Xóa cột file_dinh_kem khỏi bảng thu_vien_vb
ALTER TABLE thu_vien_vb
DROP COLUMN IF EXISTS file_dinh_kem;
