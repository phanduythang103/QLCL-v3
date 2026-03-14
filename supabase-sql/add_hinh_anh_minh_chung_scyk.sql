-- Thêm cột hinh_anh_minh_chung vào bảng bao_cao_scyk
ALTER TABLE bao_cao_scyk
  ADD COLUMN IF NOT EXISTS hinh_anh_minh_chung text[] DEFAULT '{}';
