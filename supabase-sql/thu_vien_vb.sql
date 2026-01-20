-- Tạo bảng thu_vien_vb
CREATE TABLE thu_vien_vb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  so_hieu_vb text NOT NULL,         -- Số hiệu văn bản
  ten_vb text NOT NULL,             -- Tên văn bản
  loai_vb text NOT NULL,            -- Loại văn bản
  co_quan_ban_hanh text NOT NULL,   -- Cơ quan ban hành
  hieu_luc text NOT NULL,           -- Hiệu lực
  trang_thai text NOT NULL,         -- Trạng thái
  file_dinh_kem text,               -- File đính kèm (đường dẫn hoặc URL)
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, chỉ owner được sửa/xóa
CREATE POLICY "thu_vien_vb: Select all" ON thu_vien_vb
  FOR SELECT USING (true);
CREATE POLICY "thu_vien_vb: Insert" ON thu_vien_vb
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "thu_vien_vb: Update" ON thu_vien_vb
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "thu_vien_vb: Delete" ON thu_vien_vb
  FOR DELETE USING (auth.uid() IS NOT NULL);
