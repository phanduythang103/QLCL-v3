-- Tạo bảng chia_se
CREATE TABLE chia_se (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chu_de text NOT NULL,           -- Chủ đề
  noi_dung text NOT NULL,         -- Nội dung
  hinh_anh text,                  -- Hình ảnh (đường dẫn hoặc URL)
  video text,                     -- Video (đường dẫn hoặc URL)
  file_tai_lieu text,             -- File tài liệu (đường dẫn hoặc URL)
  binh_luan text,                 -- Bình luận
  ngay_dang date NOT NULL,        -- Ngày đăng
  nguoi_dang text NOT NULL,       -- Người đăng
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, chỉ owner được sửa/xóa
CREATE POLICY "chia_se: Select all" ON chia_se
  FOR SELECT USING (true);
CREATE POLICY "chia_se: Insert" ON chia_se
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "chia_se: Update" ON chia_se
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "chia_se: Delete" ON chia_se
  FOR DELETE USING (auth.uid() IS NOT NULL);
