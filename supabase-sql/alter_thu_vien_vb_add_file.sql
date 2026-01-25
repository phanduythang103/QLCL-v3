-- Thêm cột file_van_ban vào bảng thu_vien_vb để lưu đường dẫn file văn bản
ALTER TABLE thu_vien_vb
ADD COLUMN file_van_ban TEXT;