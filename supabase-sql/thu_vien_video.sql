-- Tạo bảng thu_vien_video
CREATE TABLE thu_vien_video (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  noi_dung text NOT NULL,       -- Nội dung
  file_video text NOT NULL,     -- File video (đường dẫn hoặc URL)
  loai text NOT NULL,           -- Loại video
  created_at timestamp with time zone DEFAULT now()
);

-- Policy: Cho phép tất cả người dùng đọc, chỉ owner được sửa/xóa
CREATE POLICY "thu_vien_video: Select all" ON thu_vien_video
  FOR SELECT USING (true);
CREATE POLICY "thu_vien_video: Insert" ON thu_vien_video
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "thu_vien_video: Update" ON thu_vien_video
  FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "thu_vien_video: Delete" ON thu_vien_video
  FOR DELETE USING (auth.uid() IS NOT NULL);
