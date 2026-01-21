-- Tạo bảng chia_se (Góc chia sẻ kiến thức)
CREATE TABLE chia_se (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tieu_de text NOT NULL,          -- Tiêu đề bài viết
  noi_dung text NOT NULL,         -- Nội dung
  phan_loai text,                 -- Phân loại: Thực hành tốt, Bài học kinh nghiệm, Hỏi đáp, Thảo luận
  hinh_anh text,                  -- Hình ảnh (đường dẫn hoặc URL)
  video text,                     -- Video (đường dẫn hoặc URL)
  file_tai_lieu text,             -- File tài liệu (đường dẫn hoặc URL)
  luot_thich integer DEFAULT 0,   -- Số lượt thích
  ngay_dang date DEFAULT CURRENT_DATE, -- Ngày đăng
  nguoi_dang text NOT NULL,       -- Người đăng
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả thao tác CRUD
CREATE POLICY "chia_se: Select all" ON chia_se
  FOR SELECT USING (true);
CREATE POLICY "chia_se: Insert" ON chia_se
  FOR INSERT WITH CHECK (true);
CREATE POLICY "chia_se: Update" ON chia_se
  FOR UPDATE USING (true);
CREATE POLICY "chia_se: Delete" ON chia_se
  FOR DELETE USING (true);
